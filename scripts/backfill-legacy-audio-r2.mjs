import fs from 'node:fs';
import path from 'node:path';

function loadLocalEnv() {
  const envFiles = ['.env.local', '.env'];

  for (const fileName of envFiles) {
    const filePath = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separator = trimmed.indexOf('=');
      if (separator <= 0) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadLocalEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SITE_URL = (process.env.SITE_URL || 'https://www.canticosccb.com.br').replace(/\/+$/, '');
const LEGACY_PREFIX = 'https://rdogsfrplohxnemvtetn.supabase.co/storage/v1/object/public/';

function parseArgs(argv) {
  const parsed = {
    category: '',
    limit: 0,
    siteUrl: SITE_URL,
    dryRun: false,
    startAt: 0,
    pageSize: 100,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--category') {
      parsed.category = String(argv[index + 1] || '').trim();
      index += 1;
    } else if (value === '--limit') {
      parsed.limit = Number(argv[index + 1] || 0) || 0;
      index += 1;
    } else if (value === '--site-url') {
      parsed.siteUrl = String(argv[index + 1] || SITE_URL).trim().replace(/\/+$/, '');
      index += 1;
    } else if (value === '--start-at') {
      parsed.startAt = Math.max(Number(argv[index + 1] || 0) || 0, 0);
      index += 1;
    } else if (value === '--page-size') {
      parsed.pageSize = Math.max(1, Math.min(Number(argv[index + 1] || 0) || 100, 500));
      index += 1;
    } else if (value === '--dry-run') {
      parsed.dryRun = true;
    }
  }

  return parsed;
}

function buildHeaders() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY não configurados');
  }

  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function supabaseFetch(pathname) {
  let lastError;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(`${SUPABASE_URL}${pathname}`, {
        headers: buildHeaders(),
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Supabase ${response.status}: ${text}`);
      }
      return text ? JSON.parse(text) : [];
    } catch (error) {
      lastError = error;
      if (attempt >= 4) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }

  throw lastError || new Error('Falha desconhecida ao consultar o Supabase');
}

function encodeLikePrefix(prefix) {
  return `${encodeURIComponent(prefix)}%25`;
}

async function listLegacyActiveHymns(category, pageSize = 100) {
  const rows = [];
  let offset = 0;

  while (true) {
    const filters = [
      'select=id,titulo,numero,categoria,audio_url,ativo,status',
      'ativo=eq.true',
      'status=eq.published',
      `audio_url=like.${encodeLikePrefix(LEGACY_PREFIX)}`,
      'order=id.asc',
      `limit=${pageSize}`,
      `offset=${offset}`,
    ];

    if (category) {
      filters.push(`categoria=eq.${encodeURIComponent(category)}`);
    }

    const batch = await supabaseFetch(`/rest/v1/hinos?${filters.join('&')}`);
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return rows;
}

async function triggerFallback(siteUrl, hymn) {
  const url = new URL('/api/hino-audio-fallback', siteUrl);
  url.searchParams.set('hinoId', String(hymn.id || ''));
  url.searchParams.set('title', String(hymn.titulo || ''));
  if (hymn.numero != null) {
    url.searchParams.set('number', String(hymn.numero));
  }
  if (hymn.audio_url) {
    url.searchParams.set('audioUrl', String(hymn.audio_url));
  }

  const response = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
  });

  const location = response.headers.get('location') || '';
  const body = await response.text().catch(() => '');

  return {
    status: response.status,
    location,
    body,
  };
}

function isSuccessResult(result) {
  if (![301, 302, 307, 308].includes(result.status)) {
    return false;
  }
  return result.location.includes('media.canticosccb.com.br/hinos/');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const allRows = await listLegacyActiveHymns(args.category, args.pageSize);
  const before = allRows.length;
  const rows = allRows.slice(args.startAt, args.limit > 0 ? args.startAt + args.limit : undefined);

  console.log(`[backfill] site=${args.siteUrl}`);
  console.log(`[backfill] categoria=${args.category || 'todas'}`);
  console.log(`[backfill] legados ativos antes=${before}`);
  console.log(`[backfill] lote selecionado=${rows.length} (offset=${args.startAt})`);

  if (args.dryRun || rows.length === 0) {
    for (const hymn of rows.slice(0, 20)) {
      console.log(`- ${hymn.id} | ${hymn.categoria || 'SEM_CATEGORIA'} | ${hymn.titulo}`);
    }
    return;
  }

  let ok = 0;
  let failed = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const hymn = rows[index];
    const label = `[${index + 1}/${rows.length}] ${hymn.titulo} (${hymn.id})`;
    try {
      const result = await triggerFallback(args.siteUrl, hymn);
      if (isSuccessResult(result)) {
        ok += 1;
        console.log(`${label} -> OK ${result.location}`);
      } else {
        failed += 1;
        console.log(`${label} -> FAIL status=${result.status} location=${result.location} body=${result.body.slice(0, 200)}`);
      }
    } catch (error) {
      failed += 1;
      console.log(`${label} -> ERROR ${error?.message || error}`);
    }
  }

  const afterRows = await listLegacyActiveHymns(args.category, args.pageSize);
  const after = afterRows.length;
  console.log(`[backfill] concluído ok=${ok} fail=${failed} restantes=${after}`);
}

main().catch((error) => {
  console.error('[backfill] fatal:', error);
  process.exitCode = 1;
});
