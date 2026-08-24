"""Import the validated ukulele arrangements supplied in the source PDF.

The document covers hymns 201 to 300.
Run without --apply to validate its structure; --apply inserts only missing rows.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from pypdf import PdfReader

from optimize_hinario_cifras_seo import load_env


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\si_d1\Downloads\599763279-300-300-ukulele.pdf")
HEADER = re.compile(r"Hino\s+(\d{1,3})\s*[–-]\s*([^\n]+)", re.IGNORECASE)
KEY = re.compile(r"Tonalidade:\s*([A-G](?:#|b)?(?:m)?)", re.IGNORECASE)
CHORD = re.compile(r"\b[A-G](?:#|b)?(?:m|maj|min|sus|add|dim|aug|°|º)?\d?(?:/[A-G](?:#|b)?)?\b")


def request(base_url: str, anon_key: str, method: str, table: str, *, query: dict[str, str] | None = None, payload: object | None = None):
    url = f"{base_url.rstrip('/')}/rest/v1/{table}"
    if query:
        url = f"{url}?{urllib.parse.urlencode(query)}"
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
    headers = {"apikey": anon_key, "Authorization": f"Bearer {anon_key}"}
    if body is not None:
        headers.update({"Content-Type": "application/json", "Prefer": "return=representation"})
    with urllib.request.urlopen(urllib.request.Request(url, data=body, headers=headers, method=method), timeout=60) as response:
        return json.loads(response.read().decode("utf-8")) if response.length != 0 else []


def pdf_hymns() -> dict[int, dict[str, str]]:
    text = "\n".join(page.extract_text() or "" for page in PdfReader(SOURCE).pages)
    matches = list(HEADER.finditer(text))
    hymns: dict[int, dict[str, str]] = {}
    for index, match in enumerate(matches):
        number = int(match.group(1))
        if not 201 <= number <= 300:
            continue
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        content = text[match.end():end]
        content = re.sub(r"HINÁRIO CCB Nº 5.*?bit\.ly/apostilaccb\s*", "", content, flags=re.IGNORECASE)
        content = re.sub(r"\n{3,}", "\n\n", content).strip()
        if number in hymns:
            raise ValueError(f"Hino {number} apareceu mais de uma vez no PDF.")
        hymns[number] = {"pdf_title": match.group(2).strip(), "content": content}
    return hymns


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if not SOURCE.exists():
        raise FileNotFoundError(f"PDF não encontrado: {SOURCE}")

    hymns = pdf_hymns()
    expected = set(range(201, 301))
    if set(hymns) != expected:
        raise ValueError(f"Numeração inesperada. Encontrados: {sorted(hymns)}")
    invalid = [number for number, hymn in hymns.items() if len(hymn["content"]) < 80 or not CHORD.search(hymn["content"])]
    if invalid:
        raise ValueError(f"Cifras sem conteúdo ou acordes: {invalid}")

    env = load_env()
    base_url, anon_key = env.get("VITE_SUPABASE_URL", ""), env.get("VITE_SUPABASE_ANON_KEY", "")
    if not base_url or not anon_key:
        raise ValueError("Supabase não configurado em .env.local.")

    guitar_rows = request(base_url, anon_key, "GET", "cifras", query={
        "select": "title,slug,hino_id",
        "instrument": "eq.violao",
        "category": "eq.hinario",
        "limit": "520",
    })
    guitar_by_number = {}
    for row in guitar_rows:
        number_match = re.match(r"Hino\s+(\d{1,3})\b", row.get("title", ""), re.IGNORECASE)
        if number_match:
            guitar_by_number[int(number_match.group(1))] = row
    missing_reference = sorted(expected - set(guitar_by_number))
    if missing_reference:
        raise ValueError(f"Não foi possível vincular os hinos de referência: {missing_reference}")

    payloads = []
    for number in sorted(hymns):
        hymn, reference = hymns[number], guitar_by_number[number]
        title = reference["title"]
        key_match = KEY.search(hymn["content"])
        payloads.append({
            "title": title,
            "artist": "Hinário CCB",
            "slug": f"{reference['slug']}-ukulele",
            "content": f"[Hino {number}]\n\n{hymn['content']}",
            "original_key": key_match.group(1) if key_match else "C",
            "instrument": "ukulele",
            "capo": 0,
            "cover_url": None,
            "hino_id": reference.get("hino_id"),
            "category": "hinario",
            "is_active": True,
            "created_by": None,
        })

    print(json.dumps({
        "validated_hymns": len(payloads),
        "range": "201-300",
        "first": {"number": 201, "title": payloads[0]["title"], "key": payloads[0]["original_key"]},
        "last": {"number": 300, "title": payloads[-1]["title"], "key": payloads[-1]["original_key"]},
        "mode": "apply" if args.apply else "dry-run",
    }, ensure_ascii=False))
    if not args.apply:
        return 0

    existing = request(base_url, anon_key, "GET", "cifras", query={
        "select": "slug",
        "instrument": "eq.ukulele",
        "category": "eq.hinario",
        "limit": "520",
    })
    existing_slugs = {row["slug"] for row in existing}
    missing = [payload for payload in payloads if payload["slug"] not in existing_slugs]
    inserted = request(base_url, anon_key, "POST", "cifras", payload=missing) if missing else []
    print(json.dumps({"inserted": len(inserted), "skipped_existing": len(payloads) - len(missing)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERRO: {error}", file=sys.stderr)
        raise SystemExit(1)
