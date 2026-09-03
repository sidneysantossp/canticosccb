import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const execFileAsync = promisify(execFile);

function clean(value) {
  return String(value || '')
    .replace(/\\[nrt]/g, '')
    .replace(/[\r\n\t]/g, '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

const execute = process.argv.includes('--execute');
const limitArg = Math.max(0, Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || 0));
const idArg = String(process.argv.find((arg) => arg.startsWith('--id='))?.split('=')[1] || '').trim();
const concurrencyArg = Math.min(4, Math.max(1, Number(process.argv.find((arg) => arg.startsWith('--concurrency='))?.split('=')[1] || 2)));
const reportArg = process.argv.find((arg) => arg.startsWith('--report='))?.slice('--report='.length);
const supabaseUrl = clean(process.env.CURRENT_SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
const serviceKey = clean(process.env.CURRENT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
const r2AccountId = clean(process.env.R2_ACCOUNT_ID);
const r2AccessKeyId = clean(process.env.R2_ACCESS_KEY_ID);
const r2SecretAccessKey = clean(process.env.R2_SECRET_ACCESS_KEY);
const r2Bucket = clean(process.env.R2_BUCKET);
const r2PublicUrl = clean(process.env.R2_PUBLIC_URL || process.env.VITE_MEDIA_PUBLIC_BASE_URL).replace(/\/+$/, '');
const ffmpegExecutable = clean(process.env.FFMPEG_PATH || 'ffmpeg');

if (!supabaseUrl || !serviceKey) throw new Error('Credenciais do Supabase atual ausentes.');
if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2Bucket || !r2PublicUrl) {
  throw new Error('Configuração do R2 incompleta.');
}

await execFileAsync(ffmpegExecutable, ['-version'], { timeout: 10000 });

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

async function fetchWmaRows() {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const query = new URLSearchParams({
      select: 'id,numero,titulo,audio_url,status,ativo',
      audio_url: 'ilike.*.wma',
      order: 'id.asc',
      limit: String(pageSize),
      offset: String(offset),
    });
    if (idArg) query.set('id', `eq.${idArg}`);
    const page = await request(`/rest/v1/hinos?${query}`, { method: 'GET' });
    rows.push(...page.filter((row) => String(row.audio_url || '').startsWith(`${r2PublicUrl}/hinos/`)));
    if (idArg || page.length < pageSize) break;
  }
  return rows;
}

function objectKeyFromUrl(url) {
  const parsed = new URL(url);
  return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
}

async function headSize(key) {
  try {
    const response = await r2.send(new HeadObjectCommand({ Bucket: r2Bucket, Key: key }));
    return Number(response.ContentLength || 0);
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404) return 0;
    throw error;
  }
}

async function transcode(sourceUrl) {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`download WMA HTTP ${response.status}`);
  const sourceBuffer = Buffer.from(await response.arrayBuffer());
  if (sourceBuffer.length === 0) throw new Error('WMA vazio');

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'canticos-wma-'));
  const inputPath = path.join(tempDir, 'entrada.wma');
  const outputPath = path.join(tempDir, 'saida.mp3');
  try {
    await fs.writeFile(inputPath, sourceBuffer);
    await execFileAsync(ffmpegExecutable, [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-i', inputPath,
      '-vn', '-codec:a', 'libmp3lame', '-b:a', '192k',
      outputPath,
    ], { timeout: 180000, maxBuffer: 20 * 1024 * 1024 });
    const mp3 = await fs.readFile(outputPath);
    if (mp3.length < 1024) throw new Error(`MP3 convertido inválido (${mp3.length} bytes)`);
    return mp3;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function updateRow(row, newUrl) {
  const query = new URLSearchParams({ id: `eq.${row.id}`, audio_url: `eq.${row.audio_url}` });
  const updated = await request(`/rest/v1/hinos?${query}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ audio_url: newUrl }),
  });
  return Array.isArray(updated) && updated.length === 1;
}

const rows = await fetchWmaRows();
const groups = new Map();
for (const row of rows) {
  const sourceKey = objectKeyFromUrl(row.audio_url);
  if (!sourceKey.toLowerCase().endsWith('.wma')) continue;
  if (!groups.has(sourceKey)) groups.set(sourceKey, []);
  groups.get(sourceKey).push(row);
}
const entriesAll = [...groups.entries()];
const entries = limitArg > 0 ? entriesAll.slice(0, limitArg) : entriesAll;
const report = {
  startedAt: new Date().toISOString(),
  completedAt: null,
  mode: execute ? 'execute' : 'audit',
  wmaRows: rows.length,
  uniqueWmaObjects: entriesAll.length,
  selectedObjects: entries.length,
  convertedObjects: 0,
  reusedMp3Objects: 0,
  updatedRows: 0,
  unchangedByConflict: 0,
  failed: [],
};

console.log(JSON.stringify({
  mode: report.mode,
  wmaRows: report.wmaRows,
  uniqueWmaObjects: report.uniqueWmaObjects,
  selectedObjects: report.selectedObjects,
}, null, 2));

if (execute) {
  let cursor = 0;
  let completed = 0;
  async function worker() {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= entries.length) return;
    const [sourceKey, objectRows] = entries[index];
    const mp3Key = sourceKey.replace(/\.wma$/i, '.mp3');
    const mp3Url = `${r2PublicUrl}/${mp3Key.split('/').map(encodeURIComponent).join('/')}`;
    try {
      let mp3Size = await headSize(mp3Key);
      if (mp3Size === 0) {
        const mp3 = await transcode(objectRows[0].audio_url);
        try {
          await r2.send(new PutObjectCommand({
            Bucket: r2Bucket,
            Key: mp3Key,
            Body: mp3,
            ContentType: 'audio/mpeg',
            CacheControl: 'public, max-age=31536000, immutable',
            IfNoneMatch: '*',
            Metadata: { convertedFrom: sourceKey },
          }));
          report.convertedObjects += 1;
        } catch (error) {
          const status = error?.$metadata?.httpStatusCode;
          if (status !== 409 && status !== 412) throw error;
        }
        mp3Size = await headSize(mp3Key);
        if (mp3Size !== mp3.length) throw new Error(`MP3 no R2 diverge: local=${mp3.length}, remoto=${mp3Size}`);
      } else {
        report.reusedMp3Objects += 1;
      }

      for (const row of objectRows) {
        if (await updateRow(row, mp3Url)) report.updatedRows += 1;
        else report.unchangedByConflict += 1;
      }
    } catch (error) {
      report.failed.push({ sourceKey, rowIds: objectRows.map((row) => row.id), error: error?.message || String(error) });
    }
      completed += 1;
      if (completed % 10 === 0 || completed === entries.length) {
        console.log(`[${completed}/${entries.length}] convertidos=${report.convertedObjects} reaproveitados=${report.reusedMp3Objects} linhas=${report.updatedRows} falhas=${report.failed.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrencyArg, entries.length) }, worker));
}

report.completedAt = new Date().toISOString();
const stamp = report.startedAt.replace(/[:.]/g, '-');
const reportPath = path.resolve(reportArg || path.join('outputs', `conversao-wma-mp3-${stamp}.json`));
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Relatório: ${reportPath}`);
if (!execute) console.log('Auditoria concluída; nenhum áudio ou registro foi alterado.');
if (report.failed.length > 0) process.exitCode = 2;
