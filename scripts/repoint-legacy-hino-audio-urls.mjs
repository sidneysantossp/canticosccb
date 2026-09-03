import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const LEGACY_PROJECT_REF = 'rdogsfrplohxnemvtetn';
const LEGACY_PREFIX = `https://${LEGACY_PROJECT_REF}.supabase.co/storage/v1/object/public/images/hinos/`;

function clean(value) {
  return String(value || '')
    .replace(/\\[nrt]/g, '')
    .replace(/[\r\n\t]/g, '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

const execute = process.argv.includes('--execute');
const limitArg = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || 0);
const concurrencyArg = Math.min(8, Math.max(1, Number(process.argv.find((arg) => arg.startsWith('--concurrency='))?.split('=')[1] || 4)));
const outputArg = process.argv.find((arg) => arg.startsWith('--report='))?.slice('--report='.length);
const supabaseUrl = clean(process.env.CURRENT_SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
const serviceKey = clean(process.env.CURRENT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
const r2AccountId = clean(process.env.R2_ACCOUNT_ID);
const r2AccessKeyId = clean(process.env.R2_ACCESS_KEY_ID);
const r2SecretAccessKey = clean(process.env.R2_SECRET_ACCESS_KEY);
const r2Bucket = clean(process.env.R2_BUCKET);
const r2PublicUrl = clean(process.env.R2_PUBLIC_URL || process.env.VITE_MEDIA_PUBLIC_BASE_URL).replace(/\/+$/, '');

if (!supabaseUrl || !serviceKey) throw new Error('Credenciais do Supabase atual ausentes.');
if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2Bucket || !r2PublicUrl) {
  throw new Error('Configuração do R2 incompleta.');
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey },
});

async function request(pathname, init = {}) {
  const response = await fetch(`${supabaseUrl}${pathname}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase HTTP ${response.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function fetchLegacyRows() {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const query = new URLSearchParams({
      select: 'id,numero,titulo,audio_url,status,ativo',
      audio_url: `like.${LEGACY_PREFIX}*`,
      order: 'id.asc',
      limit: String(pageSize),
      offset: String(offset),
    });
    const page = await request(`/rest/v1/hinos?${query}`, { method: 'GET' });
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

async function listR2Keys() {
  const keys = new Set();
  let continuationToken;
  do {
    const response = await r2.send(new ListObjectsV2Command({
      Bucket: r2Bucket,
      Prefix: 'hinos/',
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    }));
    for (const item of response.Contents || []) if (item.Key) keys.add(item.Key);
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

function rowTarget(row, r2Keys) {
  const oldUrl = String(row.audio_url || '');
  if (!oldUrl.startsWith(LEGACY_PREFIX)) return null;
  const encodedName = oldUrl.slice(LEGACY_PREFIX.length).split(/[?#]/)[0];
  let name;
  try {
    name = decodeURIComponent(encodedName);
  } catch {
    return null;
  }
  const key = `hinos/${name}`;
  if (!r2Keys.has(key)) return null;
  return { ...row, oldUrl, key, newUrl: `${r2PublicUrl}/${key.split('/').map(encodeURIComponent).join('/')}` };
}

async function updateOne(row) {
  const query = new URLSearchParams({
    id: `eq.${row.id}`,
    audio_url: `eq.${row.oldUrl}`,
  });
  const updated = await request(`/rest/v1/hinos?${query}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ audio_url: row.newUrl }),
  });
  return Array.isArray(updated) && updated.length === 1;
}

console.log('Conferindo URLs legadas e objetos disponíveis no R2...');
const [legacyRows, r2Keys] = await Promise.all([fetchLegacyRows(), listR2Keys()]);
const eligibleAll = legacyRows.map((row) => rowTarget(row, r2Keys)).filter(Boolean);
const eligible = limitArg > 0 ? eligibleAll.slice(0, limitArg) : eligibleAll;
const report = {
  startedAt: new Date().toISOString(),
  completedAt: null,
  mode: execute ? 'execute' : 'audit',
  legacyRows: legacyRows.length,
  r2Objects: r2Keys.size,
  eligibleRows: eligibleAll.length,
  missingInR2: legacyRows.length - eligibleAll.length,
  selectedRows: eligible.length,
  updated: 0,
  unchangedByConflict: 0,
  failed: [],
};

console.log(JSON.stringify({
  mode: report.mode,
  legacyRows: report.legacyRows,
  eligibleRows: report.eligibleRows,
  missingInR2: report.missingInR2,
  selectedRows: report.selectedRows,
  samples: eligible.slice(0, 3).map(({ id, oldUrl, newUrl }) => ({ id, oldUrl, newUrl })),
}, null, 2));

if (execute) {
  let cursor = 0;
  let completed = 0;
  async function worker() {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= eligible.length) return;
      const row = eligible[index];
      try {
        if (await updateOne(row)) report.updated += 1;
        else report.unchangedByConflict += 1;
      } catch (error) {
        report.failed.push({ id: row.id, error: error?.message || String(error) });
      }
      completed += 1;
      if (completed % 100 === 0 || completed === eligible.length) {
        console.log(`[${completed}/${eligible.length}] atualizados=${report.updated} conflitos=${report.unchangedByConflict} falhas=${report.failed.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrencyArg, eligible.length) }, worker));
}

report.completedAt = new Date().toISOString();
const stamp = report.startedAt.replace(/[:.]/g, '-');
const reportPath = path.resolve(outputArg || path.join('outputs', `troca-urls-audios-${stamp}.json`));
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Relatório: ${reportPath}`);
if (!execute) console.log('Auditoria concluída; nenhuma URL foi alterada.');
if (report.failed.length > 0) process.exitCode = 2;
