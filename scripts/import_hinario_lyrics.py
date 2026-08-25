"""Extract lyric-only content from the supplied Hinário Word document.

Dry run:  python scripts/import_hinario_lyrics.py
Apply:    python scripts/import_hinario_lyrics.py --apply
"""
from __future__ import annotations

import argparse
import re

from import_hinario_violao import api_request, hymn_blocks, load_env, title_from_block


CHORD_ONLY = re.compile(r"^[A-G](?:#|b)?(?:m|maj|min|sus|add|dim|aug|°|º)?\d?(?:/[A-G](?:#|b)?)?(?:\s+[A-G](?:#|b)?(?:m|maj|min|sus|add|dim|aug|°|º)?\d?(?:/[A-G](?:#|b)?)?)*\s*\*?$", re.I)
CHORD_TOKEN = re.compile(r"^[A-G](?:#|b)?(?:m|maj|min|sus|add|dim|aug|°|º)?\d?(?:/[A-G](?:#|b)?)?\*?$", re.I)
MUSIC_METADATA = re.compile(r"^(?:tom|tono|introdu[cç][aã]o|intro|dedilhado|batida|ritmo|capo|afina[cç][aã]o|pima|[0-9]+[ªa]\s)", re.I)


def is_chord_line(line: str) -> bool:
    tokens = re.findall(r"[A-Za-z#b/°º*]+|\d+", line)
    return bool(tokens) and all(CHORD_TOKEN.fullmatch(token) or (token.isdigit() and len(token) <= 2) for token in tokens)


def lyric_only(content: str) -> str:
    lines: list[str] = []
    for raw in content.splitlines():
        line = raw.strip()
        if not line or CHORD_ONLY.fullmatch(line) or is_chord_line(line) or MUSIC_METADATA.match(line):
            continue
        if re.fullmatch(r"[xXoO|/\\\-\s0-9^ª]+", line):
            continue
        lines.append(line)
    return "\n".join(lines).strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    env = load_env()
    base_url, anon_key = env.get("VITE_SUPABASE_URL", ""), env.get("VITE_SUPABASE_ANON_KEY", "")
    blocks = hymn_blocks()
    lyrics = {number: lyric_only(block) for number, block in blocks.items()}
    invalid = [number for number, text in lyrics.items() if len(text) < 40]
    if invalid:
        raise ValueError(f"Letras insuficientes: {invalid}")
    print({"validated_hymns": len(lyrics), "mode": "apply" if args.apply else "dry-run"})
    if not args.apply:
        return 0
    existing = api_request(base_url, anon_key, "GET", "hinario", query={"select": "id,numero,titulo", "limit": "520"})
    by_number = {int(row["numero"]): row for row in existing if row.get("numero")}
    inserted = updated = 0
    for number, content in lyrics.items():
        row = by_number.get(number)
        title = row.get("titulo") if row else title_from_block(number, blocks[number], {}) or f"Hino {number}"
        payload = {"numero": number, "titulo": title, "conteudo": content, "categoria": "hinario5", "is_active": True}
        if row:
            api_request(base_url, anon_key, "PATCH", "hinario", query={"id": f"eq.{row['id']}"}, payload=payload)
            updated += 1
        else:
            api_request(base_url, anon_key, "POST", "hinario", payload=payload)
            inserted += 1
    print({"inserted": inserted, "updated": updated})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
