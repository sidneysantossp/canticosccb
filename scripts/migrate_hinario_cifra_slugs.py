"""Migrate imported Hinário guitar slugs to the instrument-scoped URL shape."""
from __future__ import annotations
import argparse, json, re, urllib.parse, urllib.request
from pathlib import Path
from optimize_hinario_cifras_seo import load_env, request

ROOT = Path(__file__).resolve().parents[1]
def env():
    values = {}
    for line in (ROOT / '.env.local').read_text(encoding='utf-8').splitlines():
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1); values[k] = v.strip().strip('"')
    return values
def call(base, key, method, query, payload=None):
    url = f"{base.rstrip('/')}/rest/v1/cifras?{urllib.parse.urlencode(query)}"
    body = json.dumps(payload).encode() if payload else None
    headers = {'apikey': key, 'Authorization': f'Bearer {key}'}
    if body: headers.update({'Content-Type': 'application/json', 'Prefer': 'return=representation'})
    with urllib.request.urlopen(urllib.request.Request(url, data=body, headers=headers, method=method), timeout=60) as res:
        return json.loads(res.read().decode()) if res.length else []
def main():
    apply = '--apply' in __import__('sys').argv
    cfg = load_env(); base, key = cfg['VITE_SUPABASE_URL'], cfg['VITE_SUPABASE_ANON_KEY']
    rows = request(base,key,'GET',query={'select':'id,title,slug','instrument':'eq.violao','category':'eq.hinario','order':'id.asc','limit':'520'})
    targets=[]
    for row in rows:
        match=re.match(r'^cifra-(hino-\d+-ccb(?:-[a-z0-9-]+)?)-violao$',row['slug'])
        if not match: raise ValueError(f"Slug inesperado: {row['slug']}")
        targets.append((row['id'],match.group(1)))
    if len(targets)!=480 or len({slug for _,slug in targets})!=480: raise ValueError('Os 480 slugs não foram validados.')
    print(json.dumps({'validated':len(targets),'first':targets[0],'mode':'apply' if apply else 'dry-run'}))
    if apply:
        for ident, slug in targets: request(base,key,'PATCH',query={'id':f'eq.{ident}'},payload={'slug':slug})
        print(json.dumps({'updated':len(targets)}))
if __name__ == '__main__': main()
