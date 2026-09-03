import { createClient } from '@supabase/supabase-js';
import {
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const EXPECTED_SOURCE_REF = 'rdogsfrplohxnemvtetn';
const SOURCE_BUCKET = 'images';
const SOURCE_FOLDER = 'hinos';
const VALID_EXTENSIONS = new Set(['mp3', 'wma', 'wav', 'ogg', 'aac', 'm4a', 'mid', 'midi']);
const MIME_TYPES = {
  mp3: 'audio/mpeg',
  wma: 'audio/x-ms-wma',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  mid: 'audio/midi',
  midi: 'audio/midi',
};

const execute = process.argv.includes('--execute');
const concurrency = Math.min(8, Math.max(1, numberArg('--concurrency', 4)));
const limit = Math.max(0, numberArg('--limit', 0));
const offset = Math.max(0, numberArg('--offset', 0));
const reportArg = stringArg('--report');

function stringArg(name) {
  const value = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return value ? value.slice(name.length + 1).trim() : '';
}

function numberArg(name, fallback) {
  const parsed = Number(stringArg(name));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clean(value) {
  return String(value || '')
    .replace(/\\[nrt]/g, '')
    .replace(/[\r\n\t]/g, '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

function extension(name) {
  return String(name || '').split('.').pop()?.toLowerCase() || '';
}

function formatBytes(bytes) {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let value = Number(bytes || 0);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function sourceRefFromUrl(value) {
  try {
    return new URL(value).hostname.split('.')[0];
  } catch {
    return '';
  }
}

const sourceUrl = clean(process.env.LEGACY_SUPABASE_URL).replace(/\/+$/, '');
const sourceKey = clean(process.env.LEGACY_SUPABASE_KEY || process.env.LEGACY_SUPABASE_ANON_KEY);
const r2AccountId = clean(process.env.R2_ACCOUNT_ID);
const r2AccessKeyId = clean(process.env.R2_ACCESS_KEY_ID);
const r2SecretAccessKey = clean(process.env.R2_SECRET_ACCESS_KEY);
const r2Bucket = clean(process.env.R2_BUCKET);

if (sourceRefFromUrl(sourceUrl) !== EXPECTED_SOURCE_REF) {
  throw new Error(`Origem recusada: LEGACY_SUPABASE_URL deve apontar para ${EXPECTED_SOURCE_REF}.`);
}
if (!sourceKey) throw new Error('LEGACY_SUPABASE_KEY ausente.');
if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2Bucket) {
  throw new Error('Credenciais R2 incompletas.');
}

const source = createClient(sourceUrl, sourceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey },
});

async function listSourceFiles() {
  const files = [];
  const pageSize = 1000;
  for (let pageOffset = 0; ; pageOffset += pageSize) {
    const { data, error } = await source.storage.from(SOURCE_BUCKET).list(SOURCE_FOLDER, {
      limit: pageSize,
      offset: pageOffset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`Falha ao listar origem: ${error.message}`);
    const page = data || [];
    for (const item of page) {
      const ext = extension(item.name);
      if (!item.id || !VALID_EXTENSIONS.has(ext)) continue;
      files.push({
        key: `${SOURCE_FOLDER}/${item.name}`,
        name: item.name,
        extension: ext,
        declaredSize: Number(item.metadata?.size || 0),
        updatedAt: item.updated_at || null,
      });
    }
    if (page.length < pageSize) break;
  }
  return files;
}

async function listR2Objects() {
  const objects = new Map();
  let continuationToken;
  do {
    const response = await r2.send(new ListObjectsV2Command({
      Bucket: r2Bucket,
      Prefix: `${SOURCE_FOLDER}/`,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    }));
    for (const item of response.Contents || []) {
      if (item.Key) objects.set(item.Key, Number(item.Size || 0));
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);
  return objects;
}

function summarizeFormats(files) {
  const summary = {};
  for (const file of files) {
    summary[file.extension] ||= { count: 0, bytes: 0 };
    summary[file.extension].count += 1;
    summary[file.extension].bytes += file.declaredSize;
  }
  return summary;
}

function publicSourceUrl(key) {
  return `${sourceUrl}/storage/v1/object/public/${SOURCE_BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

async function withRetry(label, operation, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delay = 500 * (2 ** (attempt - 1)) + Math.floor(Math.random() * 250);
      console.warn(`  Tentativa ${attempt}/${attempts} falhou em ${label}; nova tentativa em ${delay} ms.`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

async function copyOne(file) {
  const body = await withRetry(`download ${file.key}`, async () => {
    const response = await fetch(publicSourceUrl(file.key));
    if (!response.ok) throw new Error(`download HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  });
  if (body.length === 0) throw new Error('arquivo de origem vazio');
  if (file.declaredSize > 0 && body.length !== file.declaredSize) {
    throw new Error(`tamanho divergente: origem declarou ${file.declaredSize}, download trouxe ${body.length}`);
  }

  try {
    await withRetry(`upload ${file.key}`, () => r2.send(new PutObjectCommand({
      Bucket: r2Bucket,
      Key: file.key,
      Body: body,
      ContentType: MIME_TYPES[file.extension] || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
      IfNoneMatch: '*',
      Metadata: { migratedFrom: EXPECTED_SOURCE_REF },
    })));
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    if (status === 409 || status === 412) return { status: 'skipped-race', bytes: 0 };
    throw error;
  }

  const verified = await withRetry(`verificação ${file.key}`, () => r2.send(new HeadObjectCommand({
    Bucket: r2Bucket,
    Key: file.key,
  })));
  const targetSize = Number(verified.ContentLength || 0);
  if (targetSize !== body.length) {
    throw new Error(`verificação falhou: enviado ${body.length}, R2 informa ${targetSize}`);
  }
  return { status: 'copied', bytes: body.length };
}

async function runPool(items, worker, size) {
  let cursor = 0;
  const results = new Array(items.length);
  async function consume() {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, consume));
  return results;
}

const startedAt = new Date().toISOString();
const reportPath = path.resolve(reportArg || path.join('outputs', `migracao-audios-legado-${startedAt.replace(/[:.]/g, '-')}.json`));
await fs.mkdir(path.dirname(reportPath), { recursive: true });

console.log('Inventariando Supabase antigo e Cloudflare R2...');
const [sourceFiles, r2Objects] = await Promise.all([listSourceFiles(), listR2Objects()]);
const missingAll = sourceFiles.filter((file) => !r2Objects.has(file.key));
const sizeConflicts = sourceFiles.filter((file) => {
  const targetSize = r2Objects.get(file.key);
  return targetSize !== undefined && file.declaredSize > 0 && targetSize !== file.declaredSize;
});
const selected = missingAll.slice(offset, limit > 0 ? offset + limit : undefined);

const report = {
  startedAt,
  completedAt: null,
  mode: execute ? 'execute' : 'inventory',
  source: { projectRef: EXPECTED_SOURCE_REF, bucket: SOURCE_BUCKET, folder: SOURCE_FOLDER },
  destination: { bucket: r2Bucket, prefix: `${SOURCE_FOLDER}/` },
  inventory: {
    sourceCount: sourceFiles.length,
    sourceBytes: sourceFiles.reduce((sum, file) => sum + file.declaredSize, 0),
    r2Count: r2Objects.size,
    missingCount: missingAll.length,
    missingBytes: missingAll.reduce((sum, file) => sum + file.declaredSize, 0),
    sizeConflictCount: sizeConflicts.length,
    zeroByteSourceCount: sourceFiles.filter((file) => file.declaredSize === 0).length,
    formats: summarizeFormats(sourceFiles),
  },
  selection: { offset, limit: limit || null, count: selected.length },
  result: { copied: 0, copiedBytes: 0, skippedRace: 0, failed: 0, failures: [] },
};

console.log(JSON.stringify({
  mode: report.mode,
  source: `${report.inventory.sourceCount} (${formatBytes(report.inventory.sourceBytes)})`,
  alreadyInR2: report.inventory.sourceCount - report.inventory.missingCount,
  missing: `${report.inventory.missingCount} (${formatBytes(report.inventory.missingBytes)})`,
  sizeConflicts: report.inventory.sizeConflictCount,
  selected: selected.length,
  formats: report.inventory.formats,
}, null, 2));

if (execute && selected.length > 0) {
  console.log(`Iniciando cópia de ${selected.length} arquivos com concorrência ${concurrency}...`);
  await runPool(selected, async (file, index) => {
    try {
      const outcome = await copyOne(file);
      if (outcome.status === 'copied') {
        report.result.copied += 1;
        report.result.copiedBytes += outcome.bytes;
      } else {
        report.result.skippedRace += 1;
      }
    } catch (error) {
      report.result.failed += 1;
      report.result.failures.push({ key: file.key, error: error?.message || String(error) });
    }
    const done = index + 1;
    if (done % 25 === 0 || done === selected.length) {
      console.log(`[${done}/${selected.length}] copiados=${report.result.copied} falhas=${report.result.failed} bytes=${formatBytes(report.result.copiedBytes)}`);
      report.completedAt = new Date().toISOString();
      await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    }
  }, concurrency);
}

report.completedAt = new Date().toISOString();
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Relatório: ${reportPath}`);

if (!execute) {
  console.log('Auditoria concluída. Nenhum arquivo foi alterado. Use --execute somente após validar este relatório.');
}
if (report.result.failed > 0) process.exitCode = 2;
