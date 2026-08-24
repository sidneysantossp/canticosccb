"""Set descriptive, stable URLs for the 480 imported Hinário guitar cifras."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for line in (ROOT / '.env.local').read_text(encoding='utf-8').splitlines():
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            values[key] = value.strip().strip('"')
    return values


def request(base_url: str, anon_key: str, method: str, *, query: dict[str, str], payload: object | None = None):
    url = f"{base_url.rstrip('/')}/rest/v1/cifras?{urllib.parse.urlencode(query)}"
    body = json.dumps(payload, ensure_ascii=False).encode('utf-8') if payload is not None else None
    headers = {'apikey': anon_key, 'Authorization': f'Bearer {anon_key}'}
    if body is not None:
        headers.update({'Content-Type': 'application/json', 'Prefer': 'return=representation'})
    with urllib.request.urlopen(urllib.request.Request(url, data=body, headers=headers, method=method), timeout=60) as response:
        return json.loads(response.read().decode('utf-8')) if response.length != 0 else []


def slugify(value: str) -> str:
    normalized = unicodedata.normalize('NFD', value)
    ascii_value = ''.join(char for char in normalized if unicodedata.category(char) != 'Mn').lower()
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', ascii_value)).strip('-')


def target_slug(title: str) -> tuple[int, str]:
    match = re.match(r'^Hino\s+(\d{1,3})(?:\s+-\s+(.+))?$', title.strip(), re.I)
    if not match:
        raise ValueError(f'Título sem numeração do Hinário: {title}')
    number = int(match.group(1))
    song_name = (match.group(2) or '').strip()
    suffix = f'-{slugify(song_name)}' if song_name and song_name.lower() != f'hino {number}' else ''
    return number, f'cifra-hino-{number}-ccb{suffix}-violao'


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    env = load_env()
    base_url, anon_key = env.get('VITE_SUPABASE_URL', ''), env.get('VITE_SUPABASE_ANON_KEY', '')
    if not base_url or not anon_key:
        raise ValueError('Supabase não configurado em .env.local.')

    rows = request(base_url, anon_key, 'GET', query={
        'select': 'id,title,slug',
        'instrument': 'eq.violao',
        'category': 'eq.hinario',
        'order': 'id.asc',
        'limit': '520',
    })
    if len(rows) != 480:
        raise ValueError(f'Foram encontradas {len(rows)} cifras do Hinário; esperado: 480.')

    targets = []
    for row in rows:
        number, slug = target_slug(row['title'])
        targets.append({'id': row['id'], 'number': number, 'old_slug': row['slug'], 'new_slug': slug})
    numbers = {item['number'] for item in targets}
    slugs = [item['new_slug'] for item in targets]
    if numbers != set(range(1, 481)) or len(slugs) != len(set(slugs)):
        raise ValueError('A numeração ou os novos slugs não são únicos.')

    print(json.dumps({
        'validated': len(targets),
        'changed': sum(item['old_slug'] != item['new_slug'] for item in targets),
        'first': next(item for item in targets if item['number'] == 1),
        'last': next(item for item in targets if item['number'] == 480),
        'mode': 'apply' if args.apply else 'dry-run',
    }, ensure_ascii=False))

    if not args.apply:
        return 0
    for item in targets:
        if item['old_slug'] != item['new_slug']:
            request(base_url, anon_key, 'PATCH', query={'id': f"eq.{item['id']}"}, payload={'slug': item['new_slug']})
    print(json.dumps({'updated': sum(item['old_slug'] != item['new_slug'] for item in targets)}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
