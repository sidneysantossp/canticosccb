#!/usr/bin/env python3

from __future__ import annotations

import argparse
import io
import json
import os
import random
import re
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import boto3
import psycopg


LEGACY_PREFIX = "https://rdogsfrplohxnemvtetn.supabase.co/storage/v1/object/public/"
DEFAULT_MEDIA_PUBLIC_URL = "https://media.canticosccb.com.br"
AUDIO_EXTENSION_REGEX = re.compile(r"\.(mp3|wma|mid|midi|wav|ogg|aac|m4a)$", re.IGNORECASE)
REPO_ROOT = Path(__file__).resolve().parent.parent


@dataclass
class HymnRow:
    id: str
    titulo: str
    numero: int | None
    categoria: str | None
    audio_url: str | None


@dataclass(frozen=True)
class ArchiveCatalogEntry:
    raw_url: str
    normalized_title: str


def clean_env_value(value: str | None) -> str:
    return str(value or "").replace("\\n", "").replace("\\r", "").replace("\\t", "").strip()


def load_env_file(file_path: Path) -> None:
    if not file_path.exists():
        return

    for raw_line in file_path.read_text("utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value.startswith(("'", '"')) and value.endswith(("'", '"')) and len(value) >= 2:
            value = value[1:-1]
        os.environ.setdefault(key, value)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Restaura áudio legado direto do Archive para o R2 e atualiza o banco novo."
    )
    parser.add_argument("--db-url", required=True, help="Connection string do Postgres do projeto novo")
    parser.add_argument("--category", default="", help="Filtrar por categoria")
    parser.add_argument("--limit", type=int, default=0, help="Limitar quantidade de hinos")
    parser.add_argument("--offset", type=int, default=0, help="Offset inicial")
    parser.add_argument("--sleep", type=float, default=0.2, help="Pausa entre hinos")
    parser.add_argument("--dry-run", action="store_true", help="Só listar o lote e as URLs do acervo")
    return parser.parse_args()


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def normalize_comparable_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", str(value or ""))
    normalized = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    normalized = normalized.lower()
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return normalize_text(normalized)


def normalize_album_comparable_title(value: str) -> str:
    normalized = normalize_comparable_text(value)
    normalized = re.sub(r"\bacervo\b", " ", normalized)
    normalized = re.sub(r"\bcanticos\b", " ", normalized)
    normalized = re.sub(r"\bccb\b", " ", normalized)
    normalized = re.sub(r"\balbum\b", " ", normalized)
    normalized = re.sub(r"\bcoletanea\b", " ", normalized)
    normalized = re.sub(r"\bcoletania\b", " ", normalized)
    return normalize_text(normalized)


def strip_archive_file_extension(value: str) -> str:
    return re.sub(r"\.(mp3|wma|mid|midi|wav|ogg|aac|m4a|zip)$", "", str(value or ""), flags=re.IGNORECASE).strip()


def strip_archive_source_markers(value: str) -> str:
    cleaned = re.sub(r"\bhttps?:\/\/\S+", " ", str(value or ""), flags=re.IGNORECASE)
    cleaned = re.sub(r"\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\.[a-z]{2})?\b", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bwww\b", " ", cleaned, flags=re.IGNORECASE)
    return normalize_text(cleaned)


def title_case(value: str) -> str:
    words = []
    for word in normalize_text(value).split(" "):
        if not word:
            continue
        if word.isdigit():
            words.append(word)
        elif len(word) <= 2:
            words.append(word.lower())
        else:
            words.append(word[:1].upper() + word[1:].lower())
    return " ".join(words).replace("Ccb", "CCB")


def clean_archive_track_title(file_name: str, album_slug: str) -> str:
    base_name = Path(str(file_name or "")).name
    without_extension = strip_archive_file_extension(base_name)
    without_source = strip_archive_source_markers(without_extension)
    if album_slug:
        without_source = re.sub(
            re.escape(str(album_slug)),
            "",
            without_source,
            flags=re.IGNORECASE,
        )

    cleaned = without_source.replace("_", " ")
    cleaned = re.sub(r"^\d+[\s._-]*", "", cleaned)
    cleaned = re.sub(r"([0-9])([A-Za-zÀ-ÿ])", r"\1 \2", cleaned)
    cleaned = re.sub(r"([a-zà-ÿ])([A-ZÀ-Ý])", r"\1 \2", cleaned)
    return title_case(cleaned or "Faixa do Acervo")


def natural_sort_key(value: str) -> list[object]:
    parts = re.split(r"(\d+)", str(value or ""))
    key: list[object] = []
    for part in parts:
        if part.isdigit():
            key.append(int(part))
        else:
            key.append(part.lower())
    return key


def normalize_archive_binary_url(url: str) -> str:
    raw = str(url or "").strip()
    if not raw:
        return raw
    return re.sub(r"/web/(\d+)(?!if_)/", r"/web/\1if_/", raw)


def build_s3_client() -> object:
    account_id = clean_env_value(os.environ.get("R2_ACCOUNT_ID") or os.environ.get("CLOUDFLARE_R2_ACCOUNT_ID"))
    access_key_id = clean_env_value(os.environ.get("R2_ACCESS_KEY_ID"))
    secret_access_key = clean_env_value(os.environ.get("R2_SECRET_ACCESS_KEY"))

    if not account_id or not access_key_id or not secret_access_key:
        raise RuntimeError("Credenciais do R2 ausentes no ambiente")

    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        region_name="auto",
    )


def media_bucket() -> str:
    return clean_env_value(os.environ.get("R2_BUCKET") or "canticos-media") or "canticos-media"


def media_public_base() -> str:
    return clean_env_value(os.environ.get("R2_PUBLIC_URL") or DEFAULT_MEDIA_PUBLIC_URL).rstrip("/")


def create_media_file_name(extension: str) -> str:
    ext = re.sub(r"[^a-z0-9]", "", str(extension or "").lower()) or "mp3"
    return f"{int(time.time() * 1000)}_{random.randrange(36**6):06x}.{ext}"


def normalize_archive_catalog_title(raw_url: str) -> str:
    path = urllib.parse.urlparse(str(raw_url or "").strip()).path or str(raw_url or "")
    base_name = Path(path).name
    without_extension = strip_archive_file_extension(base_name)
    without_domain = re.sub(r"-www-canticosccb-com-br$", "", without_extension, flags=re.IGNORECASE)
    without_domain = re.sub(r"-canticosccb-com-br$", "", without_domain, flags=re.IGNORECASE)
    without_domain = without_domain.replace("-", " ").replace("_", " ")
    return normalize_album_comparable_title(without_domain)


@lru_cache(maxsize=1)
def load_archive_catalog_entries() -> tuple[ArchiveCatalogEntry, ...]:
    entries: dict[str, ArchiveCatalogEntry] = {}
    for file_name in ("wayback-archive-urls.txt", "wayback-zip-urls.txt"):
        file_path = REPO_ROOT / file_name
        if not file_path.exists():
            continue
        for raw_line in file_path.read_text("utf-8").splitlines():
            raw_url = raw_line.strip()
            if not raw_url:
                continue
            normalized_title = normalize_archive_catalog_title(raw_url)
            entries.setdefault(
                raw_url,
                ArchiveCatalogEntry(raw_url=raw_url, normalized_title=normalized_title),
            )
    return tuple(entries.values())


def resolve_archive_url_from_metadata(metadata: object) -> str:
    if not isinstance(metadata, dict):
        return ""
    for key in ("archive_url", "source_url", "archiveUrl", "sourceUrl"):
        value = str(metadata.get(key) or "").strip()
        if value:
            return value
    return ""


def extract_track_number_from_title(title: str) -> int | None:
    numbers = [int(match) for match in re.findall(r"\b(\d{1,3})\b", str(title or ""))]
    candidates = [value for value in numbers if 1 <= value <= 120]
    if not candidates:
        return None
    return candidates[-1]


def build_album_search_candidates(album_title: str, album_slug: str) -> list[str]:
    candidates: set[str] = set()
    raw_title = str(album_title or "").strip()
    raw_slug = str(album_slug or "").strip()

    if raw_title:
        candidates.add(raw_title)
        for segment in re.split(r"\s*[-–:|]\s*", raw_title):
            segment = segment.strip()
            if segment:
                candidates.add(segment)

    if raw_slug:
        clean_slug = (
            raw_slug.replace("acervo-", "")
            .replace("-acervo-canticos-ccb", "")
            .replace("-www-canticosccb-com-br", "")
            .strip()
        )
        if clean_slug:
            candidates.add(clean_slug.replace("-", " "))
            slug_parts = [part for part in clean_slug.split("-") if part]
            for size in range(min(5, len(slug_parts)), 1, -1):
                for start in range(0, len(slug_parts) - size + 1):
                    segment = " ".join(slug_parts[start:start + size]).strip()
                    if segment:
                        candidates.add(segment)

    normalized = [normalize_album_comparable_title(value) for value in candidates]
    deduped = []
    for item in normalized:
        if item and item not in deduped:
            deduped.append(item)
    deduped.sort(key=len, reverse=True)
    return deduped[:12]


def score_sibling_album_candidate(candidate_title: str, candidate_slug: str, normalized_title: str, normalized_slug: str) -> int:
    score = 0
    comparisons = [
        (candidate_title, normalized_title),
        (candidate_title, normalized_slug),
        (candidate_slug, normalized_title),
        (candidate_slug, normalized_slug),
    ]

    for left, right in comparisons:
        if not left or not right:
            continue
        if left == right:
            score += 100
        if left in right or right in left:
            score += 40
        for token in right.split(" "):
            if len(token) >= 3 and token in left:
                score += 5
    return score


def find_catalog_archive_url(album_title: str, album_slug: str, hymn_title: str = "") -> str:
    normalized_title = normalize_album_comparable_title(album_title)
    normalized_slug = normalize_album_comparable_title(album_slug.replace("-", " "))
    normalized_hymn = normalize_album_comparable_title(hymn_title)

    best_item = None
    best_score = 0
    for entry in load_archive_catalog_entries():
        candidate = entry.normalized_title
        if not candidate:
            continue

        score = score_sibling_album_candidate(candidate, candidate, normalized_title, normalized_slug)
        if normalized_hymn:
            score += score_sibling_album_candidate(candidate, candidate, normalized_hymn, normalized_hymn) // 4
        if score > best_score:
            best_score = score
            best_item = entry

    return best_item.raw_url if best_item and best_score > 0 else ""


def fetch_legacy_rows(conn: "psycopg.Connection", category: str, limit: int, offset: int) -> list[HymnRow]:
    conditions = [
        "h.ativo = true",
        "h.status = 'published'",
        "h.audio_url like %s",
    ]
    params: list[object] = [f"{LEGACY_PREFIX}%"]

    if category:
        conditions.append("h.categoria = %s")
        params.append(category)

    query = f"""
        select h.id::text, h.titulo, h.numero, h.categoria, h.audio_url
        from public.hinos h
        where {' and '.join(conditions)}
        order by h.id asc
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

    return [HymnRow(id=row[0], titulo=row[1] or "", numero=row[2], categoria=row[3], audio_url=row[4]) for row in rows]


def count_legacy_rows(conn: "psycopg.Connection", category: str) -> int:
    conditions = [
        "ativo = true",
        "status = 'published'",
        "audio_url like %s",
    ]
    params: list[object] = [f"{LEGACY_PREFIX}%"]

    if category:
        conditions.append("categoria = %s")
        params.append(category)

    with conn.cursor() as cur:
        cur.execute(f"select count(*) from public.hinos where {' and '.join(conditions)}", params)
        return int(cur.fetchone()[0] or 0)


def fetch_hymn_relations(conn: "psycopg.Connection", hymn_id: str) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """
            select ah.track_number, a.title, a.slug, a.metadata
            from public.album_hinos ah
            join public.albums a on a.id = ah.album_id
            where ah.hino_id = %s
            order by ah.track_number asc
            """,
            (hymn_id,),
        )
        rows = cur.fetchall()

    return [
        {
            "track_number": row[0],
            "title": row[1] or "",
            "slug": row[2] or "",
            "metadata": row[3] or {},
        }
        for row in rows
    ]


def find_sibling_archive_album(conn: "psycopg.Connection", album_title: str, album_slug: str) -> dict | None:
    normalized_title = normalize_album_comparable_title(album_title)
    normalized_slug = normalize_album_comparable_title(album_slug.replace("-", " "))
    if not normalized_title and not normalized_slug:
        return None

    merged_candidates: dict[str, dict] = {}
    for term in build_album_search_candidates(album_title, album_slug):
        like_term = f"%{term}%"
        with conn.cursor() as cur:
            cur.execute(
                """
                select id::text, title, slug, metadata
                from public.albums
                where title ilike %s or slug ilike %s
                limit 50
                """,
                (like_term, like_term.replace(" ", "-")),
            )
            rows = cur.fetchall()

        for album_id, title, slug, metadata in rows:
            if album_id in merged_candidates:
                continue
            merged_candidates[album_id] = {
                "id": album_id,
                "title": title or "",
                "slug": slug or "",
                "metadata": metadata or {},
            }

    best_item = None
    best_score = 0
    for candidate in merged_candidates.values():
        archive_url = resolve_archive_url_from_metadata(candidate["metadata"])
        if not archive_url:
            continue
        candidate_title = normalize_album_comparable_title(candidate["title"])
        candidate_slug = normalize_album_comparable_title(candidate["slug"].replace("-", " "))
        score = score_sibling_album_candidate(candidate_title, candidate_slug, normalized_title, normalized_slug)
        if score > best_score:
            best_score = score
            best_item = candidate

    return best_item if best_score > 0 else None


def resolve_archive_candidate(conn: "psycopg.Connection", hymn: HymnRow) -> dict | None:
    relations = fetch_hymn_relations(conn, hymn.id)
    for relation in relations:
        archive_url = resolve_archive_url_from_metadata(relation["metadata"])
        if archive_url:
            return {
                "archive_url": archive_url,
                "track_number": int(relation["track_number"] or 0),
                "album_title": relation["title"],
                "album_slug": relation["slug"],
            }

        sibling = find_sibling_archive_album(conn, relation["title"], relation["slug"])
        if sibling:
            sibling_archive_url = resolve_archive_url_from_metadata(sibling.get("metadata"))
            if sibling_archive_url:
                return {
                    "archive_url": sibling_archive_url,
                    "track_number": int(relation["track_number"] or 0),
                    "album_title": sibling.get("title") or relation["title"],
                    "album_slug": sibling.get("slug") or relation["slug"],
                }

        catalog_url = find_catalog_archive_url(relation["title"], relation["slug"], hymn.titulo)
        if catalog_url:
            return {
                "archive_url": catalog_url,
                "track_number": int(relation["track_number"] or 0),
                "album_title": relation["title"],
                "album_slug": relation["slug"],
            }

    inferred_track_number = extract_track_number_from_title(hymn.titulo)
    catalog_url = find_catalog_archive_url("", "", hymn.titulo)
    if catalog_url and inferred_track_number:
        return {
            "archive_url": catalog_url,
            "track_number": inferred_track_number,
            "album_title": hymn.titulo,
            "album_slug": normalize_text(hymn.titulo).lower().replace(" ", "-"),
        }

    return None


@lru_cache(maxsize=2048)
def resolve_archive_reference_url(archive_url: str) -> str:
    raw_url = str(archive_url or "").strip()
    if not raw_url:
        raise RuntimeError("URL do acervo ausente")

    if "web.archive.org/web/" in raw_url:
        return normalize_archive_binary_url(raw_url)

    cdx_url = (
        "https://web.archive.org/cdx/search/cdx"
        f"?url={urllib.parse.quote(raw_url, safe='')}"
        "&output=json&limit=-1&fl=timestamp,original,statuscode,mimetype"
    )
    request = urllib.request.Request(
        cdx_url,
        headers={"User-Agent": "CanticosCCB/1.0 (legacy-audio-backfill)"},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if not isinstance(payload, list) or len(payload) < 2:
        raise RuntimeError("Não foi possível resolver captura do Wayback para o ZIP")

    snapshots = [row for row in payload[1:] if isinstance(row, list)]
    good_snapshots = [row for row in snapshots if str(row[2]) == "200"]
    best_snapshot = good_snapshots[-1] if good_snapshots else snapshots[-1]
    timestamp = str(best_snapshot[0] or "").strip()
    original_url = str(best_snapshot[1] or "").strip()
    if not timestamp or not original_url:
        raise RuntimeError("A captura retornada pelo Wayback é inválida")
    return f"https://web.archive.org/web/{timestamp}if_/{original_url}"


def fetch_archive_zip_bytes(archive_url: str) -> bytes:
    normalized_url = resolve_archive_reference_url(archive_url)
    request = urllib.request.Request(
        normalized_url,
        headers={"User-Agent": "CanticosCCB/1.0 (legacy-audio-backfill)"},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        payload = response.read()
        content_type = str(response.headers.get("Content-Type") or "").lower()
        if content_type.startswith("text/html") or payload[:32].lower().startswith(b"<!doctype html"):
            raise RuntimeError("O acervo retornou HTML em vez do ZIP")
        return payload


def score_entry(entry_name: str, title: str, album_slug: str) -> int:
    cleaned = clean_archive_track_title(entry_name, album_slug)
    normalized_entry = normalize_comparable_text(cleaned)
    normalized_title = normalize_comparable_text(title)
    score = 0

    if normalized_entry == normalized_title:
        score += 100
    if normalized_entry in normalized_title or normalized_title in normalized_entry:
        score += 40
    for token in normalized_title.split(" "):
        if len(token) >= 3 and token in normalized_entry:
            score += 6
    return score


def select_zip_entry(entries: list[str], track_number: int, title: str, album_slug: str) -> str | None:
    indexed = entries[track_number - 1] if track_number > 0 and track_number <= len(entries) else None
    normalized_title = normalize_comparable_text(title)

    if not normalized_title:
        return indexed or (entries[0] if entries else None)

    if indexed:
        indexed_title = normalize_comparable_text(clean_archive_track_title(indexed, album_slug))
        if indexed_title == normalized_title or indexed_title in normalized_title or normalized_title in indexed_title:
            return indexed

    ranked = sorted(
        ((entry, score_entry(entry, title, album_slug)) for entry in entries),
        key=lambda item: (-item[1], natural_sort_key(item[0])),
    )
    if ranked and ranked[0][1] > 0:
        return ranked[0][0]
    return indexed or (entries[0] if entries else None)


def extract_audio_from_zip(zip_bytes: bytes, track_number: int, title: str, album_slug: str) -> tuple[bytes, str]:
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as archive:
        entries = [
            info.filename
            for info in archive.infolist()
            if not info.is_dir() and AUDIO_EXTENSION_REGEX.search(info.filename)
        ]
        entries.sort(key=natural_sort_key)

        if not entries:
            raise RuntimeError("Nenhuma faixa de áudio encontrada no ZIP do acervo")

        selected = select_zip_entry(entries, track_number, title, album_slug)
        if not selected:
            raise RuntimeError("Não foi possível localizar a faixa no ZIP do acervo")

        with archive.open(selected) as handle:
            payload = handle.read()

        extension = Path(selected).suffix.lower().lstrip(".") or "mp3"
        if extension != "mp3":
            raise RuntimeError(f"Faixa não é mp3 ({extension}); este backfill atende só mp3 legado")

        return payload, f"{create_media_file_name('mp3')}"


def upload_to_r2(s3_client: object, payload: bytes, file_name: str) -> str:
    key = f"hinos/{file_name}"
    s3_client.put_object(
        Bucket=media_bucket(),
        Key=key,
        Body=payload,
        ContentType="audio/mpeg",
        CacheControl="public, max-age=31536000, immutable",
    )
    return f"{media_public_base()}/{key}"


def update_hymn_audio_url(conn: "psycopg.Connection", hymn_id: str, audio_url: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "update public.hinos set audio_url = %s where id = %s",
            (audio_url, hymn_id),
        )
    conn.commit()


def main() -> int:
    load_env_file(Path(".env.vercel.local"))
    load_env_file(Path(".env.local"))
    args = parse_args()
    s3_client = build_s3_client()

    with psycopg.connect(args.db_url) as conn:
        before = count_legacy_rows(conn, args.category)
        hymns = fetch_legacy_rows(conn, args.category, args.limit, args.offset)

        print(json.dumps({
            "legacy_before": before,
            "selected": len(hymns),
            "category": args.category or "todas",
            "offset": args.offset,
            "limit": args.limit,
            "dry_run": args.dry_run,
        }, ensure_ascii=False, indent=2))

        if args.dry_run:
            for hymn in hymns[:20]:
                candidate = resolve_archive_candidate(conn, hymn)
                print(
                    json.dumps({
                        "id": hymn.id,
                        "titulo": hymn.titulo,
                        "categoria": hymn.categoria,
                        "archive_candidate": candidate,
                    }, ensure_ascii=False)
                )
            return 0

        ok = 0
        fail = 0

        for index, hymn in enumerate(hymns, start=1):
            label = f"[{index}/{len(hymns)}] {hymn.titulo} ({hymn.id})"
            try:
                candidate = resolve_archive_candidate(conn, hymn)
                if not candidate:
                    raise RuntimeError("Nenhum álbum do acervo com archive_url foi localizado")

                zip_bytes = fetch_archive_zip_bytes(candidate["archive_url"])
                audio_payload, target_name = extract_audio_from_zip(
                    zip_bytes,
                    int(candidate["track_number"] or 0),
                    hymn.titulo,
                    candidate["album_slug"],
                )
                public_url = upload_to_r2(s3_client, audio_payload, target_name)
                update_hymn_audio_url(conn, hymn.id, public_url)
                ok += 1
                print(f"{label} -> OK {public_url}")
            except Exception as error:
                fail += 1
                print(f"{label} -> FAIL {error}")
            time.sleep(args.sleep)

        after = count_legacy_rows(conn, args.category)
        print(json.dumps({
            "ok": ok,
            "fail": fail,
            "remaining": after,
            "delta": before - after,
        }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
