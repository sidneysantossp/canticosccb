import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

function clean(value) {
  return String(value || '')
    .replace(/\\[nrt]/g, '')
    .replace(/[\r\n\t]/g, '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = clean(process.env.CURRENT_SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
const serviceKey = clean(process.env.CURRENT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
const outputArg = process.argv.find((arg) => arg.startsWith('--output='))?.slice('--output='.length);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = path.resolve(outputArg || path.join('outputs', `backup-urls-hinos-${stamp}.json`));

if (!supabaseUrl || !serviceKey) throw new Error('Credenciais do Supabase atual ausentes.');

const rows = [];
const pageSize = 1000;
for (let offset = 0; ; offset += pageSize) {
  const query = new URLSearchParams({
    select: 'id,numero,titulo,audio_url,status,ativo,updated_at',
    order: 'id.asc',
    limit: String(pageSize),
    offset: String(offset),
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/hinos?${query}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!response.ok) throw new Error(`Falha ao ler hinos: HTTP ${response.status} ${await response.text()}`);
  const page = await response.json();
  rows.push(...page);
  if (page.length < pageSize) break;
}

const payload = {
  createdAt: new Date().toISOString(),
  supabaseHost: new URL(supabaseUrl).hostname,
  table: 'hinos',
  rowCount: rows.length,
  rows,
};
const serialized = `${JSON.stringify(payload, null, 2)}\n`;
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, serialized, 'utf8');
console.log(JSON.stringify({
  outputPath,
  rowCount: rows.length,
  sha256: createHash('sha256').update(serialized).digest('hex'),
}, null, 2));
