"""Validate and import the supplied 480-hymn CCB guitar document.

The Word file has one section per hymn, with a few layout-only sections.  This
script preserves its tabs and line breaks, validates every numbered block, and
can insert only the missing legacy guitar entries into Supabase.

Run without --apply for validation.  Use --apply only after reviewing its
summary; it is idempotent through the stable `hino-<number>-ccb-violao` slug.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DOCUMENT = Path(r"C:\Users\si_d1\Downloads\HINARIO CCB Violão.docx")
NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
CHORD_RE = re.compile(r"\b[A-G](?:#|b)?(?:m|maj|min|sus|add|dim|aug|°|º)?\d?(?:/[A-G](?:#|b)?)?\b")


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
        if raw and not raw.startswith("#") and "=" in raw:
            key, value = raw.split("=", 1)
            values[key] = value.strip().strip('"')
    return values


def paragraph_text(paragraph: ET.Element) -> str:
    parts: list[str] = []
    for node in paragraph.iter():
        if node.tag == f"{NS}t":
            parts.append(node.text or "")
        elif node.tag == f"{NS}tab":
            parts.append("\t")
        elif node.tag == f"{NS}br":
            parts.append("\n")
    return "".join(parts).strip()


def section_text(section: list[ET.Element]) -> str:
    lines: list[str] = []
    for element in section:
        for paragraph in element.iter(f"{NS}p"):
            value = paragraph_text(paragraph)
            if value:
                lines.append(value)
    return "\n".join(lines)


def document_sections() -> list[str]:
    with zipfile.ZipFile(DOCUMENT) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
    body = document.find(f".//{NS}body")
    if body is None:
        raise ValueError("Não foi possível localizar o conteúdo do documento.")

    groups: list[list[ET.Element]] = []
    current: list[ET.Element] = []
    for element in body:
        current.append(element)
        if element.find(f".//{NS}sectPr") is not None:
            groups.append(current)
            current = []
    if current:
        groups.append(current)
    return [section_text(group) for group in groups]


def hymn_blocks() -> dict[int, str]:
    sections = document_sections()
    if len(sections) != 487:
        raise ValueError(f"Estrutura inesperada: {len(sections)} seções (esperado: 487).")

    blocks: dict[int, str] = {1: "\n".join(sections[index] for index in (0, 1, 2))}
    for number in range(2, 481):
        if number == 415:
            indices = (416, 417, 418)
        elif number <= 414:
            indices = (number + 1,)
        else:
            indices = (number + 3,)
        blocks[number] = "\n".join(sections[index] for index in indices)
    return blocks


def api_request(base_url: str, anon_key: str, method: str, table: str, *, query: dict[str, str] | None = None, payload: object | None = None):
    url = f"{base_url.rstrip('/')}/rest/v1/{table}"
    if query:
        url = f"{url}?{urllib.parse.urlencode(query)}"
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload is not None else None
    headers = {"apikey": anon_key, "Authorization": f"Bearer {anon_key}"}
    if body is not None:
        headers.update({"Content-Type": "application/json", "Prefer": "return=representation"})
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8")) if response.length != 0 else None


def title_from_block(number: int, content: str, official_titles: dict[int, str]) -> str | None:
    if number in official_titles:
        return official_titles[number]
    prefix = re.compile(rf"^\s*{number}\s*\.\s*(.+)$")
    for line in content.splitlines():
        match = prefix.match(line)
        if match:
            return match.group(1).strip()
    return None


def first_key(content: str) -> str:
    match = CHORD_RE.search(content)
    return match.group(0) if match else "C"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Insere os registros validados no Supabase.")
    args = parser.parse_args()

    if not DOCUMENT.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {DOCUMENT}")

    env = load_env()
    base_url = env.get("VITE_SUPABASE_URL", "")
    anon_key = env.get("VITE_SUPABASE_ANON_KEY", "")
    if not base_url or not anon_key:
        raise ValueError("As credenciais públicas do Supabase não estão configuradas em .env.local.")

    blocks = hymn_blocks()
    invalid = [number for number, content in blocks.items() if len(content.strip()) < 40 or not CHORD_RE.search(content)]
    if invalid:
        raise ValueError(f"Validação reprovada para os hinos: {invalid}")

    hinario_rows = api_request(base_url, anon_key, "GET", "hinario", query={
        "select": "id,numero,titulo",
        "categoria": "eq.hinario5",
        "order": "numero.asc",
        "limit": "520",
    })
    official_titles = {int(row["numero"]): row["titulo"] for row in hinario_rows if row.get("numero") and row.get("titulo")}
    hino_ids = {int(row["numero"]): str(row["id"]) for row in hinario_rows if row.get("numero") and row.get("id") is not None}

    payloads = []
    for number, content in blocks.items():
        title = title_from_block(number, content, official_titles)
        display_title = f"Hino {number} - {title}" if title else f"Hino {number}"
        payloads.append({
            "title": display_title,
            "artist": "Hinário CCB",
            "slug": f"hino-{number}-ccb-violao",
            "content": f"[Hino {number}]\n\n{content}",
            "original_key": first_key(content),
            "instrument": "violao",
            "capo": 0,
            "cover_url": None,
            "hino_id": hino_ids.get(number),
            "category": "hinario",
            "is_active": True,
            "created_by": None,
        })

    heading_titles = sum(1 for item in payloads if not re.fullmatch(r"Hino \d+", item["title"]))
    print(json.dumps({
        "validated_hymns": len(payloads),
        "blocks_with_chords": len(payloads) - len(invalid),
        "hymns_linked_to_existing_hinario": len(hino_ids),
        "titles_from_hinario_or_document": heading_titles,
        "fallback_number_only_titles": len(payloads) - heading_titles,
        "mode": "apply" if args.apply else "dry-run",
    }, ensure_ascii=False))

    if not args.apply:
        return 0

    existing = api_request(base_url, anon_key, "GET", "cifras", query={
        "select": "slug,title",
        "slug": "in.(" + ",".join(item["slug"] for item in payloads) + ")",
        "limit": "520",
    })
    existing_slugs = {row["slug"] for row in existing}
    corrected = 0
    for item in payloads:
        old_title = f"{item['title']} - {item['title']}"
        matching = next((row for row in existing if row["slug"] == item["slug"]), None)
        if matching and matching.get("title") == old_title:
            api_request(base_url, anon_key, "PATCH", "cifras", query={"slug": f"eq.{item['slug']}"}, payload={"title": item["title"]})
            corrected += 1
    missing = [item for item in payloads if item["slug"] not in existing_slugs]
    if not missing:
        print(json.dumps({"inserted": 0, "corrected_titles": corrected, "skipped_existing": len(payloads)}, ensure_ascii=False))
        return 0

    inserted = api_request(base_url, anon_key, "POST", "cifras", payload=missing)
    print(json.dumps({"inserted": len(inserted or []), "corrected_titles": corrected, "skipped_existing": len(existing_slugs)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERRO: {error}", file=sys.stderr)
        raise SystemExit(1)
