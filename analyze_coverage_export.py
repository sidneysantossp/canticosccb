from pathlib import Path
import csv, json
root=Path('/home/ubuntu/canticosccb-fix/coverage-2026-08-20')
files=sorted(root.glob('*.csv'))
for p in files:
    print(f'{p.name}: {sum(1 for _ in p.open(encoding="utf-8-sig")) - 1} data rows')

graph=next(p for p in files if 'Gr' in p.name)
rows=list(csv.DictReader(graph.open(encoding='utf-8-sig')))
print(f'GRAPH_START={rows[0]["Data"]} GRAPH_END={rows[-1]["Data"]}')
for key in ('Não indexadas','Indexados','Impressões'):
    vals=[int(r[key]) for r in rows]
    print(f'{key}: first={vals[0]} last={vals[-1]} min={min(vals)} max={max(vals)} delta={vals[-1]-vals[0]}')
print('LAST_10')
for r in rows[-10:]: print(r)
print('FILES', [p.name for p in files])
