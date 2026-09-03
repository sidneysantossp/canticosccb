import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const LEGACY_REF = 'rdogsfrplohxnemvtetn';
const LEGACY_URL = `https://${LEGACY_REF}.supabase.co`;
const LEGACY_AUDIO_PREFIX = `${LEGACY_URL}/storage/v1/object/public/images/hinos/`;

function clean(value) {
  return String(value || '').replace(/\\[nrt]/g, '').replace(/[\r\n\t]/g, '').trim().replace(/^['"]|['"]$/g, '');
}

const execute = process.argv.includes('--execute');
const reportArg = process.argv.find((arg) => arg.startsWith('--report='))?.slice('--report='.length);
const legacyKey = clean(process.env.LEGACY_SUPABASE_KEY || process.env.LEGACY_SUPABASE_ANON_KEY);
const currentUrl = clean(process.env.CURRENT_SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
const currentKey = clean(process.env.CURRENT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
const r2AccountId = clean(process.env.R2_ACCOUNT_ID);
const r2AccessKeyId = clean(process.env.R2_ACCESS_KEY_ID);
const r2SecretAccessKey = clean(process.env.R2_SECRET_ACCESS_KEY);
const r2Bucket = clean(process.env.R2_BUCKET);
const r2PublicUrl = clean(process.env.R2_PUBLIC_URL || process.env.VITE_MEDIA_PUBLIC_BASE_URL).replace(/\/+$/, '');

if (!legacyKey || !currentUrl || !currentKey) throw new Error('Credenciais Supabase incompletas.');
if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2Bucket || !r2PublicUrl) throw new Error('Configuração R2 incompleta.');

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey },
});

async function request(base, key, pathname, init = {}) {
  const response = await fetch(`${base}${pathname}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function fetchAll(base, key) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const query = new URLSearchParams({
      select: 'id,numero,titulo,audio_url,status,ativo', order: 'id.asc', limit: '1000', offset: String(offset),
    });
    const page = await request(base, key, `/rest/v1/hinos?${query}`, { method: 'GET' });
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

async function listR2Keys() {
  const keys = new Set();
  let token;
  do {
    const result = await r2.send(new ListObjectsV2Command({ Bucket: r2Bucket, Prefix: 'hinos/', ContinuationToken: token }));
    for (const item of result.Contents || []) if (item.Key) keys.add(item.Key);
    token = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

function targetFromLegacyUrl(value, keys) {
  const url = String(value || '');
  if (!url.startsWith(LEGACY_AUDIO_PREFIX)) return null;
  let name;
  try { name = decodeURIComponent(url.slice(LEGACY_AUDIO_PREFIX.length).split(/[?#]/)[0]); } catch { return null; }
  const objectKey = `hinos/${name}`;
  if (!keys.has(objectKey)) return null;
  return `${r2PublicUrl}/${objectKey.split('/').map(encodeURIComponent).join('/')}`;
}

function normalizeTitle(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function identityKey(row) {
  const title = normalizeTitle(row.titulo);
  if (!title) return '';
  return `${String(row.numero ?? '').trim()}|${title}`;
}

async function updateBlank(row) {
  const query = new URLSearchParams({ id: `eq.${row.id}` });
  query.set('audio_url', row.currentAudioUrl === null ? 'is.null' : 'eq.');
  const updated = await request(currentUrl, currentKey, `/rest/v1/hinos?${query}`, {
    method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ audio_url: row.newAudioUrl }),
  });
  return Array.isArray(updated) && updated.length === 1;
}

console.log('Comparando registros sem áudio com o banco Supabase antigo...');
const [currentRows, legacyRows, r2Keys] = await Promise.all([
  fetchAll(currentUrl, currentKey), fetchAll(LEGACY_URL, legacyKey), listR2Keys(),
]);
const blankRows = currentRows.filter((row) => !String(row.audio_url || '').trim());
const legacyById = new Map(legacyRows.map((row) => [row.id, row]));
const exactMatches = [];
for (const row of blankRows) {
  const legacy = legacyById.get(row.id);
  if (!legacy) continue;
  const newAudioUrl = targetFromLegacyUrl(legacy.audio_url, r2Keys);
  if (!newAudioUrl) continue;
  exactMatches.push({
    id: row.id, numero: row.numero, titulo: row.titulo, status: row.status, ativo: row.ativo,
    currentAudioUrl: row.audio_url, legacyAudioUrl: legacy.audio_url, newAudioUrl,
  });
}
const legacyByIdentity = new Map();
for (const row of legacyRows) {
  const key = identityKey(row);
  const newAudioUrl = targetFromLegacyUrl(row.audio_url, r2Keys);
  if (!key || !newAudioUrl) continue;
  if (!legacyByIdentity.has(key)) legacyByIdentity.set(key, []);
  legacyByIdentity.get(key).push({ ...row, newAudioUrl });
}
const identityMatches = [];
for (const row of blankRows) {
  const candidates = legacyByIdentity.get(identityKey(row)) || [];
  if (candidates.length !== 1) continue;
  const candidate = candidates[0];
  identityMatches.push({
    id: row.id, numero: row.numero, titulo: row.titulo, status: row.status, ativo: row.ativo,
    currentAudioUrl: row.audio_url, legacyId: candidate.id, legacyAudioUrl: candidate.audio_url,
    newAudioUrl: candidate.newAudioUrl,
  });
}

const report = {
  startedAt: new Date().toISOString(), completedAt: null, mode: execute ? 'execute' : 'audit',
  currentRows: currentRows.length, legacyRows: legacyRows.length, blankRows: blankRows.length,
  publishedActiveBlankRows: blankRows.filter((row) => row.status === 'published' && row.ativo === true).length,
  exactIdRecoverable: exactMatches.length,
  publishedActiveRecoverable: exactMatches.filter((row) => row.status === 'published' && row.ativo === true).length,
  uniqueNumberTitleRecoverable: identityMatches.length,
  publishedActiveNumberTitleRecoverable: identityMatches.filter((row) => row.status === 'published' && row.ativo === true).length,
  updated: 0, unchangedByConflict: 0, failed: [], matches: exactMatches, identityMatches,
};

console.log(JSON.stringify({
  mode: report.mode, currentRows: report.currentRows, legacyRows: report.legacyRows,
  blankRows: report.blankRows, publishedActiveBlankRows: report.publishedActiveBlankRows,
  exactIdRecoverable: report.exactIdRecoverable, publishedActiveRecoverable: report.publishedActiveRecoverable,
  uniqueNumberTitleRecoverable: report.uniqueNumberTitleRecoverable,
  publishedActiveNumberTitleRecoverable: report.publishedActiveNumberTitleRecoverable,
}, null, 2));

if (execute) {
  for (const row of exactMatches) {
    try {
      if (await updateBlank(row)) report.updated += 1;
      else report.unchangedByConflict += 1;
    } catch (error) {
      report.failed.push({ id: row.id, error: error?.message || String(error) });
    }
  }
}

report.completedAt = new Date().toISOString();
const reportPath = path.resolve(reportArg || path.join('outputs', `recuperacao-urls-ausentes-${report.startedAt.replace(/[:.]/g, '-')}.json`));
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Relatório: ${reportPath}`);
if (!execute) console.log('Auditoria concluída; nenhum registro foi alterado.');
if (report.failed.length > 0) process.exitCode = 2;
