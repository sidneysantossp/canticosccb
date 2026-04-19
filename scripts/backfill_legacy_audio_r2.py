#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path

try:
    import psycopg
except Exception as exc:  # pragma: no cover
    print(
        "psycopg não está disponível. Ative um venv com psycopg instalado antes de rodar este script.",
        file=sys.stderr,
    )
    raise


LEGACY_PREFIX = "https://rdogsfrplohxnemvtetn.supabase.co/storage/v1/object/public/"
DEFAULT_SITE_URL = "https://www.canticosccb.com.br"
DEFAULT_MEDIA_PREFIX = "https://media.canticosccb.com.br/hinos/"


@dataclass
class HymnRow:
    id: str
    titulo: str
    numero: int | None
    categoria: str | None
    audio_url: str | None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Backfill dos hinos publicados que ainda apontam para o storage antigo."
    )
    parser.add_argument("--db-url", required=True, help="Connection string do Postgres do projeto novo")
    parser.add_argument("--site-url", default=DEFAULT_SITE_URL, help="URL base pública do site")
    parser.add_argument("--category", default="", help="Filtrar por categoria")
    parser.add_argument("--limit", type=int, default=0, help="Limitar quantidade de hinos")
    parser.add_argument("--offset", type=int, default=0, help="Offset inicial")
    parser.add_argument("--sleep", type=float, default=0.25, help="Pausa entre requisições")
    parser.add_argument("--dry-run", action="store_true", help="Só listar o lote selecionado")
    return parser.parse_args()


def fetch_rows(conn: "psycopg.Connection", category: str, limit: int, offset: int) -> list[HymnRow]:
    where = [
        "ativo = true",
        "status = 'published'",
        "audio_url like %s",
    ]
    params: list[object] = [f"{LEGACY_PREFIX}%"]

    if category:
        where.append("categoria = %s")
        params.append(category)

    query = f"""
        select id::text, titulo, numero, categoria, audio_url
        from public.hinos
        where {' and '.join(where)}
        order by id asc
    """

    if limit > 0:
        query += " limit %s"
        params.append(limit)

    if offset > 0:
        query += " offset %s"
        params.append(offset)

    with conn.cursor() as cur:
        cur.execute(query, params)
        rows = cur.fetchall()

    return [
        HymnRow(
            id=row[0],
            titulo=row[1] or "",
            numero=row[2],
            categoria=row[3],
            audio_url=row[4],
        )
        for row in rows
    ]


def count_legacy(conn: "psycopg.Connection", category: str) -> int:
    where = [
        "ativo = true",
        "status = 'published'",
        "audio_url like %s",
    ]
    params: list[object] = [f"{LEGACY_PREFIX}%"]

    if category:
        where.append("categoria = %s")
        params.append(category)

    with conn.cursor() as cur:
        cur.execute(
            f"select count(*) from public.hinos where {' and '.join(where)}",
            params,
        )
        return int(cur.fetchone()[0] or 0)


def get_current_audio_url(conn: "psycopg.Connection", hymn_id: str) -> str:
    with conn.cursor() as cur:
        cur.execute("select audio_url from public.hinos where id = %s", (hymn_id,))
        row = cur.fetchone()
    return str(row[0] or "").strip() if row else ""


def trigger_fallback(site_url: str, hymn: HymnRow) -> tuple[int, str, str]:
    url = urllib.parse.urljoin(site_url.rstrip("/") + "/", "api/hino-audio-fallback")
    params = {
        "hinoId": hymn.id,
        "title": hymn.titulo,
    }
    if hymn.numero is not None:
        params["number"] = str(hymn.numero)
    if hymn.audio_url:
        params["audioUrl"] = hymn.audio_url

    request_url = f"{url}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(
        request_url,
        headers={"User-Agent": "CanticosCCB/1.0 (legacy-backfill)"},
        method="GET",
    )

    opener = urllib.request.build_opener(NoRedirectHandler)
    try:
        with opener.open(request, timeout=180) as response:
            body = response.read().decode("utf-8", errors="replace")
            return response.status, str(response.headers.get("Location") or ""), body
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        return int(error.code), str(error.headers.get("Location") or ""), body


class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def main() -> int:
    args = parse_args()
    site_url = args.site_url.rstrip("/")

    with psycopg.connect(args.db_url) as conn:
        before = count_legacy(conn, args.category)
        rows = fetch_rows(conn, args.category, args.limit, args.offset)

        print(
            json.dumps(
                {
                    "site": site_url,
                    "category": args.category or "todas",
                    "legacy_before": before,
                    "selected": len(rows),
                    "offset": args.offset,
                    "limit": args.limit,
                    "dry_run": args.dry_run,
                },
                ensure_ascii=False,
                indent=2,
            )
        )

        if args.dry_run:
            for row in rows[:20]:
                print(f"- {row.id} | {row.categoria or 'SEM_CATEGORIA'} | {row.titulo}")
            return 0

        ok = 0
        fail = 0

        for index, hymn in enumerate(rows, start=1):
            label = f"[{index}/{len(rows)}] {hymn.titulo} ({hymn.id})"
            try:
                status, location, body = trigger_fallback(site_url, hymn)
                time.sleep(args.sleep)
                current_audio_url = get_current_audio_url(conn, hymn.id)

                if current_audio_url.startswith(DEFAULT_MEDIA_PREFIX):
                    ok += 1
                    print(f"{label} -> OK {current_audio_url}")
                else:
                    fail += 1
                    preview = body.replace("\n", " ").strip()[:200]
                    print(
                        f"{label} -> FAIL status={status} location={location} current={current_audio_url or '-'} body={preview}"
                    )
            except Exception as error:
                fail += 1
                print(f"{label} -> ERROR {error}")

        after = count_legacy(conn, args.category)
        print(
            json.dumps(
                {
                    "ok": ok,
                    "fail": fail,
                    "remaining": after,
                    "delta": before - after,
                },
                ensure_ascii=False,
                indent=2,
            )
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
