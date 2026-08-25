#!/usr/bin/env node
/**
 * Importa o texto ACF para o modulo Biblia, em modo seguro.
 *
 * Uso:
 *   node scripts/import-bible-acf.mjs --source-json tmp/bible-source-acf/json/acf.json
 *   node scripts/import-bible-acf.mjs --source-json tmp/bible-source-acf/json/acf.json --apply
 *   node scripts/import-bible-acf.mjs --source-json tmp/bible-source-acf/json/acf.json --apply --publish
 *
 * O modo padrao apenas valida o arquivo. --apply exige a chave de servico do
 * Supabase em SUPABASE_SERVICE_ROLE_KEY e mantem o texto nao publicado.
 * --publish so e permitido depois que a validacao retornar a base completa.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const EXPECTED_BOOKS = 66;
const EXPECTED_CHAPTERS = 1189;
const MINIMUM_VERSES = 30000;
const BATCH_SIZE = 500;

function parseArgs(argv) {
  const result = { sourceJson: 'tmp/bible-source-acf/json/acf.json', apply: false, publish: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--apply') result.apply = true;
    if (argument === '--publish') result.publish = true;
    if (argument === '--source-json') result.sourceJson = argv[index + 1] || result.sourceJson;
  }
  return result;
}

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const rawLine of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['\"]|['\"]$/g, '');
  }
}

function loadSource(file) {
  if (!existsSync(file)) throw new Error(`Arquivo-fonte nao encontrado: ${file}`);
  const buffer = readFileSync(file);
  let raw = buffer.toString('utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('O JSON deve conter uma lista de livros.');
  return { data, sha256: createHash('sha256').update(buffer).digest('hex') };
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function validateSource(data) {
  const errors = [];
  let chapters = 0;
  let verses = 0;
  const rows = [];

  if (data.length !== EXPECTED_BOOKS) errors.push(`Foram encontrados ${data.length} livros; esperado: ${EXPECTED_BOOKS}.`);

  data.forEach((book, bookIndex) => {
    if (!Array.isArray(book?.chapters) || book.chapters.length === 0) {
      errors.push(`Livro ${bookIndex + 1} nao possui capitulos.`);
      return;
    }
    chapters += book.chapters.length;
    book.chapters.forEach((chapter, chapterIndex) => {
      if (!Array.isArray(chapter) || chapter.length === 0) {
        errors.push(`${book.name || `Livro ${bookIndex + 1}`} ${chapterIndex + 1} esta vazio.`);
        return;
      }
      chapter.forEach((rawVerse, verseIndex) => {
        const verseText = cleanText(rawVerse);
        if (!verseText || verseText.includes('\uFFFD')) {
          errors.push(`${book.name || `Livro ${bookIndex + 1}`} ${chapterIndex + 1}:${verseIndex + 1} possui texto invalido.`);
          return;
        }
        rows.push({
          canonOrder: bookIndex + 1,
          chapterNumber: chapterIndex + 1,
          verseNumber: verseIndex + 1,
          verseText,
        });
        verses += 1;
      });
    });
  });

  if (chapters !== EXPECTED_CHAPTERS) errors.push(`Foram encontrados ${chapters} capitulos; esperado: ${EXPECTED_CHAPTERS}.`);
  if (verses < MINIMUM_VERSES) errors.push(`Foram encontrados ${verses} versiculos; minimo esperado: ${MINIMUM_VERSES}.`);
  return { errors, rows, summary: { books: data.length, chapters, verses } };
}

function headers(serviceKey, prefer = 'return=representation') {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: prefer,
  };
}

async function request(url, serviceKey, method = 'GET', body, prefer, range) {
  const requestHeaders = headers(serviceKey, prefer);
  if (range) requestHeaders.Range = range;
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${method} ${url} falhou (${response.status}): ${text}`);
  return data;
}

async function requestAll(url, serviceKey) {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const separator = url.includes('?') ? '&' : '?';
    const page = await request(`${url}${separator}limit=${pageSize}&offset=${offset}`, serviceKey);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function importIntoSupabase({ rows, sha256, publish }) {
  loadEnvFile('.env.local');
  const supabaseUrl = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Para importar, defina VITE_SUPABASE_URL e uma chave administrativa (SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY) apenas no seu .env.local.');
  }

  const rest = `${supabaseUrl}/rest/v1`;
  const translations = await request(`${rest}/bible_translations?code=eq.acf&select=id`, serviceKey);
  const translation = translations?.[0];
  if (!translation?.id) throw new Error('A traducao ACF nao foi encontrada. Execute primeiro a migration SQL no Supabase.');

  const importRows = await request(`${rest}/bible_imports?select=id`, serviceKey, 'POST', {
    translation_id: translation.id,
    source_file_name: 'acf.json (corpus validado contra o PDF fornecido)',
    source_sha256: sha256,
    status: 'processing',
    books_count: EXPECTED_BOOKS,
    chapters_count: EXPECTED_CHAPTERS,
    verses_count: rows.length,
    declared_rights_basis: 'Conteudo declarado como autorizado pelo responsavel do projeto.',
    notes: 'Importacao automatizada, com publicacao condicionada a validacao de integridade.',
  });
  const importId = importRows?.[0]?.id;

  const books = await request(`${rest}/bible_books?translation_id=eq.${translation.id}&select=id,canon_order`, serviceKey);
  const bookIdByOrder = new Map(books.map((book) => [book.canon_order, book.id]));
  if (bookIdByOrder.size !== EXPECTED_BOOKS) throw new Error('O catalogo de livros no Supabase esta incompleto.');

  const chapters = await requestAll(
    `${rest}/bible_chapters?select=id,book_id,chapter_number&order=id.asc`,
    serviceKey,
  );
  const bookOrderById = new Map(books.map((book) => [book.id, book.canon_order]));
  const chapterIdByKey = new Map(chapters.map((chapter) => [`${bookOrderById.get(chapter.book_id)}:${chapter.chapter_number}`, chapter.id]));
  if (chapterIdByKey.size !== EXPECTED_CHAPTERS) throw new Error('O catalogo de capitulos no Supabase esta incompleto.');

  const verseRows = rows.map((row) => {
    const chapterId = chapterIdByKey.get(`${row.canonOrder}:${row.chapterNumber}`);
    if (!chapterId) throw new Error(`Capitulo ausente: livro ${row.canonOrder}, capitulo ${row.chapterNumber}.`);
    return {
      chapter_id: chapterId,
      verse_number: row.verseNumber,
      verse_text: row.verseText,
      source_reference: `ACF ${row.canonOrder}:${row.chapterNumber}:${row.verseNumber}`,
      metadata: { importer: 'scripts/import-bible-acf.mjs', source_encoding: 'utf-8' },
    };
  });

  for (let offset = 0; offset < verseRows.length; offset += BATCH_SIZE) {
    const batch = verseRows.slice(offset, offset + BATCH_SIZE);
    await request(
      `${rest}/bible_verses?on_conflict=chapter_id,verse_number`,
      serviceKey,
      'POST',
      batch,
      'resolution=merge-duplicates,return=minimal',
    );
    process.stdout.write(`\rImportados ${Math.min(offset + batch.length, verseRows.length)} de ${verseRows.length} versiculos`);
  }
  process.stdout.write('\n');

  const validation = await request(`${rest}/rpc/validate_bible_translation`, serviceKey, 'POST', { p_translation_code: 'acf' });
  if (!validation?.ready_to_publish) {
    if (importId) await request(`${rest}/bible_imports?id=eq.${importId}`, serviceKey, 'PATCH', {
      status: 'failed', completed_at: new Date().toISOString(), validation_report: validation,
    });
    throw new Error(`A validacao final falhou: ${JSON.stringify(validation)}`);
  }

  const completedAt = new Date().toISOString();
  if (publish) {
    await request(`${rest}/bible_chapters?is_published=eq.false`, serviceKey, 'PATCH', { is_published: true });
    await request(`${rest}/bible_books?translation_id=eq.${translation.id}`, serviceKey, 'PATCH', { is_published: true });
    await request(`${rest}/bible_translations?id=eq.${translation.id}`, serviceKey, 'PATCH', { is_published: true, published_at: completedAt });
  }
  if (importId) await request(`${rest}/bible_imports?id=eq.${importId}`, serviceKey, 'PATCH', {
    status: publish ? 'published' : 'validated', completed_at: completedAt, validation_report: validation,
  });
  return validation;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { data, sha256 } = loadSource(args.sourceJson);
  const validation = validateSource(data);
  console.log(JSON.stringify({ mode: args.apply ? (args.publish ? 'apply-and-publish' : 'apply') : 'validation', ...validation.summary, source_sha256: sha256, errors: validation.errors }, null, 2));
  if (validation.errors.length) process.exitCode = 1;
  if (!args.apply || validation.errors.length) return;
  const databaseValidation = await importIntoSupabase({ rows: validation.rows, sha256, publish: args.publish });
  console.log(JSON.stringify({ database_validation: databaseValidation, published: args.publish }, null, 2));
}

main().catch((error) => {
  console.error(`Erro: ${error.message}`);
  process.exitCode = 1;
});
