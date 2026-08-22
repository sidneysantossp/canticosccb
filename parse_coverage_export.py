from pathlib import Path
import csv
import json

root = Path('/home/ubuntu/canticosccb-fix/coverage-2026-08-20')
result = {}
for path in sorted(root.glob('*.csv')):
    raw = path.read_bytes()
    text = None
    used = None
    for enc in ('utf-8-sig', 'utf-8', 'cp1252', 'latin-1'):
        try:
            text = raw.decode(enc)
            used = enc
            break
        except UnicodeDecodeError:
            continue
    rows = list(csv.reader(text.splitlines())) if text is not None else []
    result[path.name] = {'encoding': used, 'rows': rows}
    print(f'## {path.name} [{used}]')
    for row in rows[:30]:
        print(' | '.join(row))
    print()
Path('/home/ubuntu/canticosccb-fix/COVERAGE_EXPORT_PARSED.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
