import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpegStatic from 'ffmpeg-static';

const execFileAsync = promisify(execFile);

function cleanEnvValue(value) {
  return String(value || '')
    .replace(/\\[nrt]/g, '')
    .replace(/[\r\n\t]/g, '')
    .trim();
}

async function loadEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const [key, ...rest] = line.split('=');
      if (!key || process.env[key]) continue;
      let value = rest.join('=').trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // ignore missing file
  }
}

await loadEnvFile(path.resolve('.env.vercel.local'));
await loadEnvFile(path.resolve('.env.local'));

const SUPABASE_URL = cleanEnvValue(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = cleanEnvValue(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '');

const R2_ACCOUNT_ID = cleanEnvValue(process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID || '');
const R2_ACCESS_KEY_ID = cleanEnvValue(process.env.R2_ACCESS_KEY_ID || '');
const R2_SECRET_ACCESS_KEY = cleanEnvValue(process.env.R2_SECRET_ACCESS_KEY || '');
const R2_BUCKET = cleanEnvValue(process.env.R2_BUCKET || 'canticos-media') || 'canticos-media';
const R2_PUBLIC_URL = cleanEnvValue(
  process.env.R2_PUBLIC_URL || process.env.VITE_MEDIA_PUBLIC_BASE_URL || 'https://media.canticosccb.com.br'
).replace(/\/+$/, '');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase env ausente');
}

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  throw new Error('R2 env ausente');
}

if (!ffmpegStatic) {
  throw new Error('ffmpeg-static indisponível');
}

const limitArg = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || '0');
const offsetArg = Number(process.argv.find((arg) => arg.startsWith('--offset='))?.split('=')[1] || '0');
const albumIdArg = String(process.argv.find((arg) => arg.startsWith('--album-id='))?.split('=')[1] || '').trim();
const dryRun = process.argv.includes('--dry-run');

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function createMp3Key() {
  return `hinos/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp3`;
}

async function supabaseRequest(pathname, init = {}) {
  const response = await fetch(`${SUPABASE_URL}${pathname}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(text || `Supabase error ${response.status}`);
  }
  return text ? JSON.parse(text) : null;
}

async function fetchRows() {
  if (albumIdArg) {
    const query = new URLSearchParams({
      select: 'position,hino:hino_id(id,titulo,audio_url)',
      album_id: `eq.${albumIdArg}`,
      order: 'position.asc',
    });
    const rows = await supabaseRequest(`/rest/v1/album_hinos?${query.toString()}`, { method: 'GET' });
    if (!Array.isArray(rows)) return [];
    const filtered = rows
      .map((row) => row?.hino)
      .filter(Boolean)
      .filter((row) =>
        String(row?.audio_url || '').startsWith(`${R2_PUBLIC_URL}/hinos/`) &&
        String(row?.audio_url || '').toLowerCase().endsWith('.wma')
      );
    return limitArg > 0 ? filtered.slice(0, limitArg) : filtered;
  }

  const pageSize = limitArg > 0 ? Math.max(limitArg * 5, 200) : 2000;
  const query = new URLSearchParams({
    select: 'id,titulo,audio_url',
    'audio_url': 'ilike.*.wma',
    order: 'updated_at.desc.nullslast,id.desc',
    limit: String(pageSize),
    offset: String(offsetArg),
  });
  const rows = await supabaseRequest(`/rest/v1/hinos?${query.toString()}`, { method: 'GET' });
  if (!Array.isArray(rows)) return [];
  const filtered = rows.filter((row) =>
    String(row?.audio_url || '').startsWith(`${R2_PUBLIC_URL}/hinos/`) &&
    String(row?.audio_url || '').toLowerCase().endsWith('.wma')
  );
  return limitArg > 0 ? filtered.slice(0, limitArg) : filtered;
}

async function transcodeWmaToMp3(buffer) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wma-backfill-'));
  const inputPath = path.join(tempDir, 'input.wma');
  const outputPath = path.join(tempDir, 'output.mp3');

  try {
    await fs.writeFile(inputPath, buffer);
    await execFileAsync(ffmpegStatic, [
      '-y',
      '-i', inputPath,
      '-vn',
      '-codec:a', 'libmp3lame',
      '-b:a', '192k',
      outputPath,
    ], {
      timeout: 120000,
      maxBuffer: 20 * 1024 * 1024,
    });

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function updateHino(id, audioUrl) {
  await supabaseRequest(`/rest/v1/hinos?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ audio_url: audioUrl }),
  });
}

async function processRow(row, index, total) {
  const currentUrl = String(row.audio_url || '');
  console.log(`[${index}/${total}] ${row.titulo} -> ${currentUrl}`);

  const response = await fetch(currentUrl);
  if (!response.ok) {
    throw new Error(`download ${response.status}`);
  }

  const sourceBuffer = Buffer.from(await response.arrayBuffer());
  const mp3Buffer = await transcodeWmaToMp3(sourceBuffer);
  const key = createMp3Key();
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

  if (!dryRun) {
    await r2Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: mp3Buffer,
      ContentType: 'audio/mpeg',
    }));
    await updateHino(row.id, publicUrl);
  }

  console.log(`  ok -> ${publicUrl}`);
}

const rows = await fetchRows();
const total = Array.isArray(rows) ? rows.length : 0;

console.log(JSON.stringify({
  total,
  offset: offsetArg,
  limit: limitArg || total,
  dryRun,
}));

for (let index = 0; index < total; index += 1) {
  const row = rows[index];
  try {
    await processRow(row, index + 1, total);
  } catch (error) {
    console.error(`  fail ${row?.id}: ${error?.message || error}`);
  }
}
