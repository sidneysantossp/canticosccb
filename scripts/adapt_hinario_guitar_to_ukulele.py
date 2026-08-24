"""Create missing instrument versions from the platform's validated guitar cifras.

Chord symbols and harmonic progression are retained. Existing ukulele arrangements
(including the 100 imported from the supplied PDF) are never replaced.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request

from optimize_hinario_cifras_seo import load_env


def request(base_url: str, anon_key: str, method: str, *, query: dict[str, str] | None = None, payload: object | None = None):
    url = f"{base_url.rstrip('/')}/rest/v1/cifras"
    if query:
        url = f"{url}?{urllib.parse.urlencode(query)}"
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
    headers = {"apikey": anon_key, "Authorization": f"Bearer {anon_key}"}
    if body is not None:
        headers.update({"Content-Type": "application/json", "Prefer": "return=representation"})
    with urllib.request.urlopen(urllib.request.Request(url, data=body, headers=headers, method=method), timeout=60) as response:
        return json.loads(response.read().decode("utf-8")) if response.length != 0 else []


def hymn_number(title: str) -> int:
    match = re.match(r"Hino\s+(\d{1,3})\b", title, re.IGNORECASE)
    if not match:
        raise ValueError(f"Título sem número de hino: {title}")
    return int(match.group(1))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--instrument", choices=("ukulele", "teclado"), default="ukulele")
    args = parser.parse_args()
    env = load_env()
    base_url, anon_key = env.get("VITE_SUPABASE_URL", ""), env.get("VITE_SUPABASE_ANON_KEY", "")
    if not base_url or not anon_key:
        raise ValueError("Supabase não configurado em .env.local.")

    guitar = request(base_url, anon_key, "GET", query={
        "select": "title,slug,content,original_key,capo,cover_url,hino_id,category,is_active",
        "instrument": "eq.violao",
        "category": "eq.hinario",
        "is_active": "eq.true",
        "limit": "520",
    })
    ukulele = request(base_url, anon_key, "GET", query={
        "select": "title",
        "instrument": f"eq.{args.instrument}",
        "category": "eq.hinario",
        "limit": "520",
    })
    guitar_numbers = {hymn_number(row["title"]) for row in guitar}
    existing_numbers = {hymn_number(row["title"]) for row in ukulele}
    if guitar_numbers != set(range(1, 481)):
        raise ValueError(f"Base de Violão incompleta: {len(guitar_numbers)} hinos encontrados.")

    missing = [row for row in guitar if hymn_number(row["title"]) not in existing_numbers]
    payloads = [{
        "title": row["title"],
        "artist": "Hinário CCB",
        "slug": f"{row['slug']}-{args.instrument}",
        "content": f"[Adaptação para {args.instrument.title()}]\nAs cifras abaixo preservam a harmonia da versão de Violão.\n\n" + row["content"],
        "original_key": row["original_key"],
        "instrument": args.instrument,
        "capo": 0,
        "cover_url": row["cover_url"],
        "hino_id": row["hino_id"],
        "category": "hinario",
        "is_active": True,
        "created_by": None,
    } for row in missing]

    print(json.dumps({
        "guitar_source_hymns": len(guitar),
        "existing_instrument_hymns": len(existing_numbers),
        "adaptations_to_create": len(payloads),
        "mode": "apply" if args.apply else "dry-run",
    }, ensure_ascii=False))
    if not args.apply:
        return 0
    inserted = request(base_url, anon_key, "POST", payload=payloads) if payloads else []
    print(json.dumps({"inserted": len(inserted), "preserved_existing": len(existing_numbers)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERRO: {error}", file=sys.stderr)
        raise SystemExit(1)
