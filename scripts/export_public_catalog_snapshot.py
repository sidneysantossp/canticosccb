#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import uuid
from collections import defaultdict
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

import psycopg


STATIC_NOW = "2026-04-04T00:00:00.000Z"


def json_default(value: Any):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, Decimal):
        return float(value)
    raise TypeError(f"Unsupported type: {type(value)!r}")


def normalize_playlist_cover(value: Any, fallback_cover: str) -> str:
    text = str(value or "").strip()
    if not text:
        return fallback_cover
    if text.startswith("data:"):
        return fallback_cover
    return text


def fetch_all(cur: psycopg.Cursor, query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    cur.execute(query, params)
    columns = [desc.name for desc in cur.description]
    return [dict(zip(columns, row)) for row in cur.fetchall()]


def build_hinario(hymns: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_number: dict[int, dict[str, Any]] = {}
    for hymn in hymns:
        numero = int(hymn.get("numero") or 0)
        if numero < 1 or numero > 480:
            continue
        current = by_number.get(numero)
        if current is None or len(str(hymn.get("titulo") or "")) < len(str(current.get("titulo") or "")):
            by_number[numero] = hymn

    items: list[dict[str, Any]] = []
    for numero in sorted(by_number):
        hymn = by_number[numero]
        items.append(
            {
                "id": numero,
                "numero": numero,
                "titulo": hymn.get("titulo") or f"Hino {numero}",
                "subtitulo": hymn.get("compositor_nome") or None,
                "conteudo": "",
                "categoria": "hinario5",
                "tags": None,
                "views_count": 0,
                "is_active": True,
                "created_at": hymn.get("created_at") or STATIC_NOW,
                "updated_at": hymn.get("updated_at") or STATIC_NOW,
                "is_emergency_fallback": True,
            }
        )
    return items


def main() -> int:
    parser = argparse.ArgumentParser(description="Exporta snapshot público do catálogo para fallback local.")
    parser.add_argument("--db-url", required=True, help="Connection string do Postgres")
    parser.add_argument(
        "--output",
        default="src/data/publicCatalogSnapshot.json",
        help="Arquivo JSON de saída dentro do projeto",
    )
    parser.add_argument(
        "--default-cover-url",
        default="https://media.canticosccb.com.br/covers/1771984574638_y6tw06.png",
        help="Capa padrão usada em playlists e álbuns sem imagem própria",
    )
    args = parser.parse_args()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with psycopg.connect(args.db_url) as conn:
        with conn.cursor() as cur:
            hymns = fetch_all(
                cur,
                """
                select
                  id,
                  coalesce(numero, 0) as numero,
                  coalesce(titulo, title, 'Hino') as titulo,
                  compositor_nome,
                  compositor_id,
                  coalesce(categoria, 'Outros') as categoria,
                  coalesce(cover_url, '') as cover_url,
                  coalesce(audio_url, '') as audio_url,
                  coalesce(letra, lyrics, '') as letra,
                  coalesce(duracao, '00:00') as duracao,
                  youtube_source,
                  created_at,
                  updated_at,
                  coalesce(ativo, true) as ativo,
                  coalesce(slug, '') as slug
                from public.hinos
                where coalesce(ativo, true) = true
                order by created_at desc, titulo asc
                """
            )

            albums = fetch_all(
                cur,
                """
                select
                  id,
                  coalesce(title, name, 'Álbum') as title,
                  coalesce(artist, 'Cânticos CCB') as artist,
                  coalesce(description, 'Álbum do acervo disponível em modo de contingência.') as description,
                  coalesce(cover_url, %s) as cover_url,
                  coalesce(total_tracks, total_hinos, song_count, total_faixas, 0) as total_tracks,
                  release_date,
                  composer_id,
                  created_at,
                  updated_at,
                  coalesce(is_published, true) as is_published,
                  coalesce(active, true) as active,
                  coalesce(featured, false) as featured,
                  coalesce(featured_order, 0) as featured_order,
                  genre,
                  coalesce(slug, '') as slug
                from public.albums
                where coalesce(is_published, true) = true
                  and coalesce(active, true) = true
                order by created_at desc, title asc
                """,
                (args.default_cover_url,),
            )

            composers = fetch_all(
                cur,
                """
                select
                  id,
                  user_id,
                  coalesce(name, artistic_name, 'Compositor CCB') as name,
                  coalesce(artistic_name, name, 'Compositor CCB') as artistic_name,
                  email,
                  bio,
                  biography,
                  avatar_url,
                  photo_url,
                  coalesce(status, 'approved') as status,
                  coalesce(verified, true) as verified,
                  coalesce(is_featured, false) as is_featured,
                  coalesce(is_trending, false) as is_trending,
                  coalesce(followers_count, 0) as followers_count,
                  coalesce(slug, '') as slug,
                  category,
                  created_at,
                  updated_at
                from public.composers
                order by name asc
                """
            )

            playlists = fetch_all(
                cur,
                """
                select
                  id,
                  name,
                  description,
                  cover_url,
                  coalesce(is_public, true) as is_public,
                  created_at,
                  updated_at
                from public.playlists
                where coalesce(is_public, true) = true
                order by created_at desc, name asc
                """
            )

            categories = fetch_all(
                cur,
                """
                select
                  id,
                  coalesce(nome, 'Categoria') as nome,
                  coalesce(slug, '') as slug,
                  descricao,
                  imagem_url,
                  coalesce(ativo, true) as ativo,
                  coalesce(cor, '#22c55e') as cor,
                  meta_title,
                  meta_description,
                  created_at,
                  updated_at
                from public.categorias
                where coalesce(ativo, true) = true
                order by nome asc
                """
            )

            album_hymns = fetch_all(
                cur,
                """
                select
                  album_id,
                  hino_id,
                  coalesce(position, track_number, 0) as position,
                  coalesce(track_number, position, 0) as track_number
                from public.album_hinos
                """
            )

            hymn_categories = fetch_all(
                cur,
                """
                select
                  hino_id,
                  categoria_id
                from public.hino_categorias
                """
            )

    hymn_ids = {str(row["id"]) for row in hymns}
    album_ids = {str(row["id"]) for row in albums}

    filtered_album_hymns = [
        {
          "album_id": str(row["album_id"]),
          "hino_id": str(row["hino_id"]),
          "position": int(row.get("position") or 0),
          "track_number": int(row.get("track_number") or row.get("position") or 0),
        }
        for row in album_hymns
        if str(row["album_id"]) in album_ids and str(row["hino_id"]) in hymn_ids
    ]

    album_related_hymns: dict[str, list[str]] = defaultdict(list)
    for relation in sorted(filtered_album_hymns, key=lambda item: (item["album_id"], item["track_number"], item["position"], item["hino_id"])):
        album_related_hymns[relation["album_id"]].append(relation["hino_id"])

    filtered_hymn_categories = [
        {
          "hino_id": str(row["hino_id"]),
          "categoria_id": str(row["categoria_id"]),
        }
        for row in hymn_categories
        if str(row["hino_id"]) in hymn_ids
    ]

    snapshot = {
        "hymns": [
            {
                "id": str(row["id"]),
                "numero": int(row.get("numero") or 0),
                "titulo": row.get("titulo") or "Hino",
                "compositor_nome": row.get("compositor_nome") or None,
                "compositor_id": str(row["compositor_id"]) if row.get("compositor_id") else None,
                "categoria": row.get("categoria") or "Outros",
                "cover_url": row.get("cover_url") or args.default_cover_url,
                "audio_url": row.get("audio_url") or "",
                "letra": row.get("letra") or "",
                "duracao": row.get("duracao") or "00:00",
                "youtube_source": row.get("youtube_source") or None,
                "created_at": row.get("created_at") or STATIC_NOW,
                "updated_at": row.get("updated_at") or STATIC_NOW,
                "ativo": bool(row.get("ativo", True)),
                "slug": row.get("slug") or "",
                "source_path": f"/snapshot/hino/{row.get('slug') or row['id']}",
                "is_emergency_fallback": True,
            }
            for row in hymns
        ],
        "albums": [
            {
                "id": str(row["id"]),
                "title": row.get("title") or "Álbum",
                "artist": row.get("artist") or "Cânticos CCB",
                "description": row.get("description") or "Álbum do acervo disponível em modo de contingência.",
                "cover_url": row.get("cover_url") or args.default_cover_url,
                "total_tracks": int(row.get("total_tracks") or len(album_related_hymns.get(str(row["id"]), []))),
                "release_date": row.get("release_date"),
                "composer_id": str(row["composer_id"]) if row.get("composer_id") else None,
                "created_at": row.get("created_at") or STATIC_NOW,
                "updated_at": row.get("updated_at") or STATIC_NOW,
                "is_published": bool(row.get("is_published", True)),
                "active": bool(row.get("active", True)),
                "featured": bool(row.get("featured", False)),
                "featured_order": int(row.get("featured_order") or 0),
                "genre": row.get("genre"),
                "slug": row.get("slug") or "",
                "related_hymn_ids": album_related_hymns.get(str(row["id"]), []),
                "is_emergency_fallback": True,
            }
            for row in albums
        ],
        "composers": [
            {
                "id": str(row["id"]),
                "user_id": str(row["user_id"]) if row.get("user_id") else None,
                "name": row.get("name") or row.get("artistic_name") or "Compositor CCB",
                "artistic_name": row.get("artistic_name") or row.get("name") or "Compositor CCB",
                "email": row.get("email"),
                "bio": row.get("bio") or "",
                "biography": row.get("biography") or row.get("bio") or "",
                "avatar_url": row.get("avatar_url") or row.get("photo_url") or "",
                "photo_url": row.get("photo_url") or row.get("avatar_url") or "",
                "status": "approved",
                "verified": True,
                "is_featured": bool(row.get("is_featured", False)),
                "is_trending": bool(row.get("is_trending", False)),
                "followers_count": int(row.get("followers_count") or 0),
                "slug": row.get("slug") or "",
                "category": row.get("category"),
                "created_at": row.get("created_at") or STATIC_NOW,
                "updated_at": row.get("updated_at") or STATIC_NOW,
                "is_emergency_fallback": True,
            }
            for row in composers
        ],
        "playlists": [
            {
                "id": str(row["id"]),
                "name": row.get("name") or "Playlist",
                "description": row.get("description") or "",
                "cover_url": normalize_playlist_cover(row.get("cover_url"), args.default_cover_url),
                "is_public": bool(row.get("is_public", True)),
                "created_at": row.get("created_at") or STATIC_NOW,
                "updated_at": row.get("updated_at") or STATIC_NOW,
                "is_emergency_fallback": True,
            }
            for row in playlists
        ],
        "categories": [
            {
                "id": str(row["id"]),
                "nome": row.get("nome") or "Categoria",
                "slug": row.get("slug") or "",
                "descricao": row.get("descricao") or "",
                "imagem_url": row.get("imagem_url") or args.default_cover_url,
                "ativo": bool(row.get("ativo", True)),
                "cor": row.get("cor") or "#22c55e",
                "meta_title": row.get("meta_title") or None,
                "meta_description": row.get("meta_description") or None,
                "created_at": row.get("created_at") or STATIC_NOW,
                "updated_at": row.get("updated_at") or STATIC_NOW,
                "is_emergency_fallback": True,
            }
            for row in categories
        ],
        "albumHymns": filtered_album_hymns,
        "hymnCategories": filtered_hymn_categories,
        "hinario": build_hinario(
            [
                {
                    **row,
                    "created_at": row.get("created_at") or STATIC_NOW,
                    "updated_at": row.get("updated_at") or STATIC_NOW,
                }
                for row in hymns
            ]
        ),
    }

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(snapshot, handle, ensure_ascii=False, indent=2, default=json_default)
        handle.write("\n")

    print(f"Snapshot salvo em {output_path}")
    print(
        json.dumps(
            {
                "hymns": len(snapshot["hymns"]),
                "albums": len(snapshot["albums"]),
                "composers": len(snapshot["composers"]),
                "playlists": len(snapshot["playlists"]),
                "categories": len(snapshot["categories"]),
                "albumHymns": len(snapshot["albumHymns"]),
                "hymnCategories": len(snapshot["hymnCategories"]),
                "hinario": len(snapshot["hinario"]),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
