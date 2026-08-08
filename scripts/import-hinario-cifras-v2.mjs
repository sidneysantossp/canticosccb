#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DEFAULT_INPUT = 'tmp/hinario-cifras/hinario-cifras.json';

function parseArgs(argv) {
  const args = {
    input: DEFAULT_INPUT,
    apply: false,
    status: 'draft',
    limit: null,
    offset: 0,
    skipWarnings: false,
    onlyClean: false,
    allowDuplicateNumbers: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next === undefined || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index += 1;
  }

  args.apply = Boolean(args.apply);
  args.skipWarnings = Boolean(args.skipWarnings);
  args.onlyClean = Boolean(args.onlyClean);
  args.allowDuplicateNumbers = Boolean(args.allowDuplicateNumbers);
  args.limit = args.limit === null ? null : Number(args.limit);
  args.offset = Number(args.offset || 0);
  return args;
}

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  const content = readFileSync(file, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}

function normalizeUrl(value) {
  return String(value || '').replace(/\/+$/, '').trim();
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueSlug(base, suffix) {
  return [base, suffix].filter(Boolean).map(slugify).filter(Boolean).join('-');
}

function buildHeaders(serviceKey) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation,resolution=merge-duplicates',
  };
}

async function supabaseRequest({ table, method = 'GET', query = '', body, serviceKey, supabaseUrl }) {
  const url = `${supabaseUrl}/rest/v1/${table}${query}`;
  const response = await fetch(url, {
    method,
    headers: buildHeaders(serviceKey),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(`${method} ${table}${query} failed ${response.status}: ${text}`);
  }

  return data;
}

function buildSongPayload(item) {
  const number = Number.isFinite(Number(item.hinario_numero)) ? Number(item.hinario_numero) : null;
  const title = String(item.title || `Hino ${number || ''}`).trim();
  const canonicalSlug = item.canonical_slug || uniqueSlug(`hino-${number || 'sem-numero'}`, title);

  return {
    canonical_slug: canonicalSlug,
    title,
    subtitle: number ? `Hinário 5 CCB - Hino ${number}` : 'Hinário 5 CCB',
    composer_name: null,
    hino_id: null,
    hinario_numero: number,
    source_type: 'hinario',
    liturgical_context: null,
    seo_title: number ? `${title} - Cifra Hino ${number} CCB` : `${title} - Cifra CCB`,
    seo_description: number
      ? `Cifra para violão do Hino ${number} do Hinário 5 CCB: ${title}.`
      : `Cifra para violão do Hinário 5 CCB: ${title}.`,
    seo_keywords: [
      'cifra ccb',
      'hinario 5 ccb',
      number ? `hino ${number} ccb` : null,
      title,
      'violao',
    ].filter(Boolean).join(', '),
    cover_url: null,
    metadata: {
      import_source: 'hinario-5-ccb-para-violao-altura-padrao.pdf',
      source_pdf_page: item.page ?? null,
      ocr_confidence_hint: item.ocr?.confidence_hint ?? null,
      ocr_warnings: item.warnings ?? [],
    },
    is_active: true,
    is_indexable: true,
  };
}

function buildVersionPayload(item, songId, status) {
  const publicSlug = item.public_slug || uniqueSlug(item.canonical_slug, 'violao');
  const published = status === 'published';
  const sections = Array.isArray(item.sections) ? item.sections : [];
  const bodyAst = item.body_ast || {
    sections: sections.map((section) => ({
      key: section.section_key,
      label: section.section_label,
      order: section.section_order,
      cueStartSeconds: null,
      cueEndSeconds: null,
      loopStartSeconds: null,
      loopEndSeconds: null,
      lines: section.content_ast || [],
    })),
  };

  return {
    song_id: songId,
    public_slug: publicSlug,
    title: item.title,
    instrument: item.instrument || 'violao',
    arrangement_type: item.arrangement_type || 'completa',
    difficulty_level: item.difficulty_level || 'intermediario',
    tuning: item.tuning || 'standard',
    capo: Number(item.capo || 0),
    original_key: item.original_key || 'C',
    preferred_key: item.preferred_key || item.original_key || null,
    tempo_bpm: item.tempo_bpm ?? null,
    time_signature: item.time_signature ?? null,
    intro_notes: item.intro_notes ?? null,
    body_text: item.body_text || '',
    body_ast: bodyAst,
    chords_index: item.chords_index || [],
    sections_count: sections.length,
    lines_count: Number(item.lines_count || 0),
    status,
    publication_label: 'reviewed',
    is_primary: published,
    is_active: true,
    is_searchable: true,
    published_at: published ? new Date().toISOString() : null,
  };
}

function buildSectionPayload(section, versionId) {
  return {
    version_id: versionId,
    section_order: section.section_order || 1,
    section_key: section.section_key || 'verse',
    section_label: section.section_label || 'Hino',
    content_ast: section.content_ast || [],
    plain_text: section.plain_text || '',
    chords_index: section.chords_index || [],
  };
}

async function upsertOne(item, config) {
  const songPayload = buildSongPayload(item);
  const songRows = await supabaseRequest({
    table: 'cifra_songs',
    method: 'POST',
    query: '?on_conflict=canonical_slug&select=*',
    body: songPayload,
    ...config,
  });
  const song = Array.isArray(songRows) ? songRows[0] : null;
  if (!song?.id) throw new Error(`Song upsert did not return id for ${songPayload.canonical_slug}`);

  const versionPayload = buildVersionPayload(item, song.id, config.status);
  const versionRows = await supabaseRequest({
    table: 'cifra_versions',
    method: 'POST',
    query: '?on_conflict=public_slug&select=*',
    body: versionPayload,
    ...config,
  });
  const version = Array.isArray(versionRows) ? versionRows[0] : null;
  if (!version?.id) throw new Error(`Version upsert did not return id for ${versionPayload.public_slug}`);

  await supabaseRequest({
    table: 'cifra_version_sections',
    method: 'DELETE',
    query: `?version_id=eq.${version.id}`,
    ...config,
  });

  for (const section of item.sections || []) {
    await supabaseRequest({
      table: 'cifra_version_sections',
      method: 'POST',
      query: '?select=*',
      body: buildSectionPayload(section, version.id),
      ...config,
    });
  }

  return { song, version };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnvFile('.env.local');

  if (!existsSync(args.input)) {
    throw new Error(`Input JSON not found: ${args.input}`);
  }

  const supabaseUrl = normalizeUrl(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const source = JSON.parse(readFileSync(args.input, 'utf8'));
  const baseItems = args.onlyClean
    ? source.items.filter((item) => !item.warnings?.length && item.hinario_numero && item.lines_count > 0)
    : source.items;
  const selected = baseItems.slice(args.offset, args.limit ? args.offset + args.limit : undefined);

  console.log(`Loaded ${source.items.length} extracted item(s). Selected ${selected.length}.`);
  const blocked = selected.filter((item) => item.warnings?.length && !args.skipWarnings);
  if (blocked.length) {
    console.warn(`Blocked by OCR warnings: ${blocked.map((item) => `${item.hinario_numero || item.page}:${item.warnings.join('|')}`).join(', ')}`);
    console.warn('Use --skipWarnings only after reviewing the JSON.');
    if (args.apply) process.exit(1);
  }

  const seenNumbers = new Set();
  const duplicateNumbers = new Set();
  for (const item of selected) {
    const number = Number(item.hinario_numero);
    if (!Number.isFinite(number)) continue;
    if (seenNumbers.has(number)) duplicateNumbers.add(number);
    seenNumbers.add(number);
  }
  if (duplicateNumbers.size && !args.allowDuplicateNumbers) {
    console.warn(`Blocked by duplicate hinario_numero: ${Array.from(duplicateNumbers).sort((a, b) => a - b).join(', ')}`);
    console.warn('Use --allowDuplicateNumbers only after reviewing the JSON.');
    if (args.apply) process.exit(1);
  }

  for (const item of selected) {
    console.log([
      item.hinario_numero ? `#${item.hinario_numero}` : `page ${item.page}`,
      item.title,
      `key=${item.original_key}`,
      `lines=${item.lines_count}`,
      `chords=${item.chords_index?.length || 0}`,
      item.warnings?.length ? `warnings=${item.warnings.join('|')}` : 'warnings=none',
    ].join(' | '));
  }

  if (!args.apply) {
    console.log('Dry-run only. Add --apply to write to Supabase.');
    return;
  }

  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL/SUPABASE_URL are required for --apply.');
  }

  const config = { supabaseUrl, serviceKey, status: args.status };
  let imported = 0;
  for (const item of selected) {
    await upsertOne(item, config);
    imported += 1;
    console.log(`Imported ${imported}/${selected.length}: ${item.title}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
