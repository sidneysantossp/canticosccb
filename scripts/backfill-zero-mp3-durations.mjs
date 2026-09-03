import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const execFileAsync = promisify(execFile);

function clean(value) {
  return String(value || '')
    .replace(/\\[nrt]/g, '')
    .replace(/[\r\n\t]/g, '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

async function loadEnvFiles() {
  for (const fileName of ['.env.local', '.env.pending-audit.local', '.env']) {
    const filePath = path.resolve(process.cwd(), fileName);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (!match) continue;
        const key = match[1].trim();
        const value = clean(match[2]);
        if (value && !process.env[key]) process.env[key] = value;
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
}

await loadEnvFiles();

const execute = process.argv.includes('--execute');
const limit = Math.max(0, Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || 0));
const onlyId = String(process.argv.find((arg) => arg.startsWith('--id='))?.split('=')[1] || '').trim();
const concurrency = Math.min(8, Math.max(1, Number(process.argv.find((arg) => arg.startsWith('--concurrency='))?.split('=')[1] || 4)));
const reportArg = process.argv.find((arg) => arg.startsWith('--report='))?.slice('--report='.length);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportPath = path.resolve(reportArg || path.join('outputs', `duracoes-mp3-${execute ? 'execucao' : 'auditoria'}-${stamp}.json`));
const supabaseUrl = clean(process.env.CURRENT_SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
const serviceKey = clean(process.env.CURRENT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
const r2PublicUrl = clean(process.env.R2_PUBLIC_URL || process.env.VITE_MEDIA_PUBLIC_BASE_URL).replace(/\/+$/, '');
const ffprobe = clean(process.env.FFPROBE_PATH || 'ffprobe');

if (!supabaseUrl || !serviceKey) throw new Error('Credenciais administrativas do Supabase ausentes.');
if (!r2PublicUrl) throw new Error('URL pública do R2 ausente.');
await execFileAsync(ffprobe, ['-version'], { timeout: 10000 });

function headers(extra = {}) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function request(pathname, init = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(`${supabaseUrl}${pathname}`, {
        ...init,
        headers: headers(init.headers),
        signal: AbortSignal.timeout(30000),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Supabase HTTP ${response.status}: ${text}`);
      return text ? JSON.parse(text) : null;
    } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

async function listCandidates() {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const query = new URLSearchParams({
      select: 'id,numero,titulo,audio_url,duracao,status,ativo,updated_at',
      order: 'id.asc',
      limit: String(pageSize),
      offset: String(offset),
    });
    if (onlyId) query.set('id', `eq.${onlyId}`);
    const page = await request(`/rest/v1/hinos?${query}`);
    rows.push(...page);
    if (onlyId || page.length < pageSize) break;
  }

  return rows.filter((row) => {
    const url = String(row.audio_url || '');
    const current = String(row.duracao ?? '').trim();
    const isZero = current === '' || /^(?:0+|0+:0+(?::0+)?)$/.test(current);
    return isZero && url.startsWith(`${r2PublicUrl}/`) && /\.mp3(?:$|[?#])/i.test(url);
  });
}

async function probeDuration(url) {
  const { stdout } = await execFileAsync(ffprobe, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    url,
  ], { timeout: 45000, maxBuffer: 1024 * 1024 });
  const seconds = Number(String(stdout).trim());
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('Duração inválida ou ausente.');
  return seconds;
}

function formatDuration(seconds) {
  const total = Math.max(1, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function updateDuration(row, duration) {
  const query = new URLSearchParams({ id: `eq.${row.id}`, select: 'id,duracao' });
  if (row.duracao == null || String(row.duracao).trim() === '') {
    query.set('duracao', row.duracao == null ? 'is.null' : 'eq.');
  } else {
    query.set('duracao', `eq.${row.duracao}`);
  }
  const updated = await request(`/rest/v1/hinos?${query}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ duracao: duration }),
  });
  return Array.isArray(updated) && updated.length === 1;
}

const candidates = (await listCandidates()).slice(0, limit || undefined);
const results = new Array(candidates.length);
let cursor = 0;
let completed = 0;

async function persistReport() {
  const successful = results.filter((item) => item?.status === (execute ? 'updated' : 'valid')).length;
  const payload = {
    createdAt: new Date().toISOString(),
    mode: execute ? 'execute' : 'audit',
    supabaseHost: new URL(supabaseUrl).hostname,
    r2Host: new URL(r2PublicUrl).hostname,
    candidateCount: candidates.length,
    completed,
    successful,
    failed: results.filter((item) => item?.status === 'failed').length,
    skippedByConcurrentChange: results.filter((item) => item?.status === 'skipped').length,
    rows: results.filter(Boolean),
  };
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function worker() {
  while (true) {
    const index = cursor;
    cursor += 1;
    if (index >= candidates.length) return;
    const row = candidates[index];
    try {
      const seconds = await probeDuration(row.audio_url);
      const duration = formatDuration(seconds);
      let status = 'valid';
      if (execute) status = await updateDuration(row, duration) ? 'updated' : 'skipped';
      results[index] = {
        id: row.id,
        numero: row.numero,
        titulo: row.titulo,
        audio_url: row.audio_url,
        previousDuration: row.duracao,
        detectedSeconds: Number(seconds.toFixed(3)),
        duration,
        status,
      };
    } catch (error) {
      results[index] = {
        id: row.id,
        numero: row.numero,
        titulo: row.titulo,
        audio_url: row.audio_url,
        previousDuration: row.duracao,
        status: 'failed',
        error: error?.message || String(error),
      };
    }
    completed += 1;
    if (completed % 25 === 0 || completed === candidates.length) {
      await persistReport();
      console.log(JSON.stringify({ completed, total: candidates.length, reportPath }));
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, candidates.length)) }, () => worker()));
await persistReport();
console.log(JSON.stringify({ mode: execute ? 'execute' : 'audit', candidateCount: candidates.length, completed, reportPath }, null, 2));
