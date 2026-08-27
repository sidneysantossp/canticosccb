#!/usr/bin/env node
/**
 * Importa referencias cruzadas do OpenBible.info (CC BY 2016).
 *
 * Uso:
 *   node scripts/import-openbible-cross-references.mjs
 *   node scripts/import-openbible-cross-references.mjs --apply --max-per-verse 3
 *
 * O modo padrao apenas consulta e valida a fonte. --apply exige
 * SUPABASE_SERVICE_ROLE_KEY no .env.local e nao importa texto biblico.
 */
import { existsSync, readFileSync } from 'node:fs';
import JSZip from 'jszip';

const SOURCE_URL = 'https://a.openbible.info/data/cross-references.zip';
const BATCH_SIZE = 500;

const BOOKS = {
  Gen: 'genesis', Exod: 'exodo', Lev: 'levitico', Num: 'numeros', Deut: 'deuteronomio', Josh: 'josue', Judg: 'juizes', Ruth: 'rute',
  '1Sam': '1-samuel', '2Sam': '2-samuel', '1Kgs': '1-reis', '2Kgs': '2-reis', '1Chr': '1-cronicas', '2Chr': '2-cronicas', Ezra: 'esdras', Neh: 'neemias', Esth: 'ester', Job: 'jo', Ps: 'salmos', Prov: 'proverbios', Eccl: 'eclesiastes', Song: 'cantares', Isa: 'isaias', Jer: 'jeremias', Lam: 'lamentacoes', Ezek: 'ezequiel', Dan: 'daniel', Hos: 'oseias', Joel: 'joel', Amos: 'amos', Obad: 'obadias', Jonah: 'jonas', Mic: 'miqueias', Nah: 'naum', Hab: 'habacuque', Zeph: 'sofonias', Hag: 'ageu', Zech: 'zacarias', Mal: 'malaquias',
  Matt: 'mateus', Mark: 'marcos', Luke: 'lucas', John: 'joao', Acts: 'atos', Rom: 'romanos', '1Cor': '1-corintios', '2Cor': '2-corintios', Gal: 'galatas', Eph: 'efesios', Phil: 'filipenses', Col: 'colossenses', '1Thess': '1-tessalonicenses', '2Thess': '2-tessalonicenses', '1Tim': '1-timoteo', '2Tim': '2-timoteo', Titus: 'tito', Phlm: 'filemom', Heb: 'hebreus', Jas: 'tiago', '1Pet': '1-pedro', '2Pet': '2-pedro', '1John': '1-joao', '2John': '2-joao', '3John': '3-joao', Jude: 'judas', Rev: 'apocalipse',
};

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = raw.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['\"]|['\"]$/g, '');
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const index = args.indexOf('--max-per-verse');
  return { apply: args.includes('--apply'), maxPerVerse: Math.max(1, Math.min(Number(args[index + 1] || 3), 6)) };
}

function parseReference(value) {
  const match = String(value || '').trim().match(/^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/);
  if (!match || !BOOKS[match[1]]) return null;
  return { bookSlug: BOOKS[match[1]], chapter: Number(match[2]), verse: Number(match[3]) };
}

function getRows(text, maxPerVerse) {
  const best = new Map();
  text.split(/\r?\n/).forEach((line) => {
    if (!line || line.startsWith('#')) return;
    const [from, to, rawVotes] = line.split('\t');
    const source = parseReference(from);
    const target = parseReference(to);
    const voteCount = Number(rawVotes || 0);
    if (!source || !target || !Number.isFinite(voteCount)) return;
    const key = `${source.bookSlug}:${source.chapter}:${source.verse}`;
    const entries = best.get(key) || [];
    entries.push({
      translation_code: 'acf', source_book_slug: source.bookSlug, source_chapter: source.chapter, source_verse: source.verse,
      target_book_slug: target.bookSlug, target_chapter: target.chapter, target_verse: target.verse,
      // A fonte também registra votos negativos; a coluna local é não negativa,
      // então normalizamos esses casos para zero sem descartar a referência.
      vote_count: Math.max(0, voteCount),
      source_name: 'OpenBible.info', source_url: 'https://www.openbible.info/labs/cross-references/', license_name: 'CC BY 2016',
    });
    best.set(key, entries);
  });
  return [...best.values()].flatMap((entries) => entries.sort((a, b) => b.vote_count - a.vote_count).slice(0, maxPerVerse));
}

async function downloadSource() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`Fonte indisponível: ${response.status}`);
  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const sourceFile = Object.values(zip.files).find((file) => !file.dir && /cross.*references.*\.txt$/i.test(file.name))
    || Object.values(zip.files).find((file) => !file.dir && /\.txt$/i.test(file.name));
  if (!sourceFile) throw new Error('O pacote oficial não contém o arquivo de referências esperado.');
  return sourceFile.async('text');
}

async function importRows(rows) {
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const response = await fetch(`${REST_URL}/rest/v1/bible_cross_references?on_conflict=translation_code,source_book_slug,source_chapter,source_verse,target_book_slug,target_chapter,target_verse`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows.slice(start, start + BATCH_SIZE)),
    });
    if (!response.ok) throw new Error(`Lote ${start / BATCH_SIZE + 1} falhou: ${response.status} ${await response.text()}`);
    process.stdout.write(`\rImportados ${Math.min(start + BATCH_SIZE, rows.length)}/${rows.length}`);
  }
  process.stdout.write('\n');
}

loadEnvFile('.env.local');
const { apply, maxPerVerse } = parseArgs();
// As variáveis podem vir de .env.local; por isso são lidas somente depois do
// carregamento do arquivo, e nunca são exibidas no terminal.
const REST_URL = String(process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const rows = getRows(await downloadSource(), maxPerVerse);
console.log(`Fonte OpenBible.info validada. ${rows.length} referencias selecionadas (maximo ${maxPerVerse} por versiculo).`);
if (!apply) {
  console.log('Modo de validacao: nenhum dado foi enviado. Use --apply apos executar CREATE_BIBLE_CROSS_REFERENCES.sql.');
  process.exit(0);
}
if (!REST_URL || !SERVICE_KEY) throw new Error('VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias para --apply.');
await importRows(rows);
console.log('Importacao concluida. Atribuicao: OpenBible.info — CC BY 2016.');
