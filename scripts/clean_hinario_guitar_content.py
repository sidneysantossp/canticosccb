"""Remove numeric OCR/layout artifacts from imported instrument cifras."""

from __future__ import annotations

import argparse
import json
import sys

from optimize_hinario_cifras_seo import load_env, request


ARTIFACT_LINE = __import__('re').compile(r"^\s*(?:\d{2,3}\s+){1,}\d{2,3}\s*$")


def clean(content: str) -> str:
    lines = []
    for line in content.splitlines():
        if ARTIFACT_LINE.match(line):
            continue
        if line.strip().startswith('[Adaptação para ') or line.strip().startswith('As cifras abaixo preservam a harmonia'):
            continue
        # Import artifacts are always two-or-three-digit standalone values;
        # musical extensions such as D7 remain untouched.
        lines.append(__import__('re').sub(r"\b\d{2,3}\b", "", line))
    return "\n".join(lines).replace("\n\n\n", "\n\n").strip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--instrument", choices=("violao", "ukulele", "teclado"), default="violao")
    args = parser.parse_args()
    env = load_env()
    rows = request(env["VITE_SUPABASE_URL"], env["VITE_SUPABASE_ANON_KEY"], "GET", query={
        "select": "id,content",
        "instrument": f"eq.{args.instrument}",
        "category": "eq.hinario",
        "limit": "520",
    })
    updates = [{"id": row["id"], "content": clean(row["content"])} for row in rows if clean(row["content"]) != row["content"]]
    print(json.dumps({"instrument": args.instrument, "hymns": len(rows), "cifras_with_artifacts": len(updates), "mode": "apply" if args.apply else "dry-run"}))
    if args.apply:
        for update in updates:
            request(env["VITE_SUPABASE_URL"], env["VITE_SUPABASE_ANON_KEY"], "PATCH", query={"id": f"eq.{update['id']}"}, payload={"content": update["content"]})
        print(json.dumps({"updated": len(updates)}))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERRO: {error}", file=sys.stderr)
        raise SystemExit(1)
