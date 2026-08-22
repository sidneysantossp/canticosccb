import json
from pathlib import Path

for instrument in ('violao', 'ukulele', 'teclado'):
    path = Path(f'/tmp/catalog_{instrument}.json')
    payload = json.loads(path.read_text())
    if not isinstance(payload, list) or any(not isinstance(row, dict) for row in payload):
        print(f'{instrument}: resposta_invalida={payload!r}')
        continue
    numbers = {row.get('hinario_numero') for row in payload if isinstance(row.get('hinario_numero'), int)}
    missing = sorted(set(range(1, 481)) - numbers)
    no_content = [row.get('hinario_numero') for row in payload if not row.get('lines_count') or not row.get('sections_count') or not row.get('chords_index')]
    bad_slug = [row.get('hinario_numero') for row in payload if f"hino-{row.get('hinario_numero')}-" not in (row.get('public_slug') or '')]
    unwanted = [row.get('hinario_numero') for row in payload if 'elias brand' in f"{row.get('seo_title','')} {row.get('seo_description','')}".lower()]
    print(f'{instrument}: rows={len(payload)} numbers={len(numbers)} missing={missing}')
    print(f'  sem_conteudo={no_content[:30]} total={len(no_content)} slugs_suspeitos={bad_slug[:30]} total={len(bad_slug)} unwanted={unwanted}')
