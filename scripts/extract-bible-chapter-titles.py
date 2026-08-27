import json, re, sys
from pathlib import Path
import pypdf

PDF = Path(sys.argv[1])
OUT = Path(sys.argv[2])
BOOKS = [
 'Gênesis','Êxodo','Levítico','Números','Deuteronômio','Josué','Juízes','Rute','1Samuel','2Samuel','1Reis','2Reis','1Crônicas','2Crônicas','Esdras','Neemias','Ester','Jó','Salmos','Provérbios','Eclesiastes','Cantares','Isaías','Jeremias','Lamentações','Ezequiel','Daniel','Oséias','Joel','Amós','Obadias','Jonas','Miquéias','Naum','Habacuque','Sofonias','Ageu','Zacarias','Malaquias','Mateus','Marcos','Lucas','João','Atos','Romanos','1Coríntios','2Coríntios','Gálatas','Efésios','Filipenses','Colossenses','1Tessalonicenses','2Tessalonicenses','1Timóteo','2Timóteo','Tito','Filemom','Hebreus','Tiago','1Pedro','2Pedro','1João','2João','3João','Judas','Apocalipse']
def norm(s):
    return re.sub(r'\s+', ' ', s.replace('\t',' ')).strip()
def key(s):
    return norm(s).replace('�','').lower()
aliases = {key(x): x for x in BOOKS}
rows=[]
reader=pypdf.PdfReader(str(PDF))
for page in reader.pages:
    lines=[norm(x) for x in (page.extract_text() or '').splitlines() if norm(x)]
    for i,line in enumerate(lines):
        m=re.match(r'^(.*?)\s+(\d{1,3})$', line)
        if not m: continue
        raw, num=m.group(1), int(m.group(2))
        b=aliases.get(key(raw))
        if not b or num < 1: continue
        title=''
        for candidate in lines[i+1:i+30]:
            if re.match(r'^\d+\s+', candidate):
                continue
            if candidate.lower() not in ('índice dos capítulos','introdução','versículos:','versículos'):
                if not re.match(r'^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]', candidate):
                    continue
                title=candidate; break
        if title and len(title) < 220:
            rows.append({'book':b,'chapter':num,'title':title})
dedup={(x['book'],x['chapter']):x for x in rows}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(list(dedup.values()), ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'pages':len(reader.pages),'titles':len(dedup),'books':len(set(x['book'] for x in dedup.values()))}, ensure_ascii=False))
