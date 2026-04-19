try {
  await import('dotenv/config');
} catch {}

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// ─── Config ───────────────────────────────────────────────
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
} = process.env;

const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_EXISTING = !process.argv.includes('--force');
const SOURCE_BUCKET = 'images';
const FOLDERS = ['covers', 'hinos', 'avatars', 'banners'];

// ─── Validação ────────────────────────────────────────────
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env');
  process.exit(1);
}
if (!DRY_RUN && (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET)) {
  console.error('❌ Variáveis R2_* são obrigatórias no .env para migração real');
  process.exit(1);
}

// ─── Clients ──────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const r2 = DRY_RUN ? null : new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ─── Helpers ──────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMimeType(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  const mimes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    mp4: 'video/mp4',
  };
  return mimes[ext] || 'application/octet-stream';
}

async function existsInR2(key) {
  if (!r2 || !SKIP_EXISTING) return false;
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function listAllFiles(folder) {
  const all = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase.storage
      .from(SOURCE_BUCKET)
      .list(folder, { limit, offset, sortBy: { column: 'name', order: 'asc' } });

    if (error) throw error;
    if (!data || data.length === 0) break;

    // Filtrar apenas arquivos reais (ignorar subpastas e arquivos de teste)
    const VALID_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp3', 'wav', 'ogg', 'm4a', 'mp4'];
    const files = data.filter((x) => {
      if (!x.id) return false;
      const ext = x.name.split('.').pop()?.toLowerCase();
      return VALID_EXTS.includes(ext);
    });
    all.push(...files);

    if (data.length < limit) break;
    offset += limit;
  }

  return all;
}

// ─── Migração de pasta ───────────────────────────────────
async function migrateFolder(folder) {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📁 ${folder}`);
  console.log(`${'═'.repeat(50)}`);

  const files = await listAllFiles(folder);
  console.log(`   Arquivos encontrados: ${files.length}`);

  if (files.length === 0) {
    console.log('   (vazio, pulando)');
    return { ok: 0, skipped: 0, fail: 0, totalBytes: 0 };
  }

  let ok = 0;
  let skipped = 0;
  let fail = 0;
  let totalBytes = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const key = `${folder}/${f.name}`;
    const size = f.metadata?.size || 0;
    totalBytes += size;

    const progress = `[${i + 1}/${files.length}]`;

    if (DRY_RUN) {
      console.log(`   ${progress} ${key} (${formatBytes(size)})`);
      ok++;
      continue;
    }

    try {
      // Verificar se já existe no R2
      if (SKIP_EXISTING) {
        const exists = await existsInR2(key);
        if (exists) {
          skipped++;
          if (skipped % 50 === 0 || i === files.length - 1) {
            console.log(`   ${progress} ⏭️  ${skipped} já existem no R2...`);
          }
          continue;
        }
      }

      // Download do Supabase
      const { data, error } = await supabase.storage.from(SOURCE_BUCKET).download(key);
      if (error) throw error;

      const body = Buffer.from(await data.arrayBuffer());

      // Upload para R2
      await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: getMimeType(f.name),
        CacheControl: 'public, max-age=31536000, immutable',
      }));

      ok++;
      if (ok % 10 === 0 || i === files.length - 1) {
        console.log(`   ${progress} ✅ ${ok} migrados (${formatBytes(totalBytes)})`);
      }
    } catch (e) {
      fail++;
      console.error(`   ${progress} ❌ ERRO ${key}: ${e.message}`);
    }
  }

  console.log(`   ── Resultado: ✅ ${ok} ok | ⏭️ ${skipped} já existiam | ❌ ${fail} erros | ${formatBytes(totalBytes)} total`);
  return { ok, skipped, fail, totalBytes };
}

// ─── Main ─────────────────────────────────────────────────
(async () => {
  console.log('\n🚀 Migração Supabase Storage → Cloudflare R2');
  console.log(`   Modo: ${DRY_RUN ? '🔍 DRY-RUN (apenas listagem)' : '📦 MIGRAÇÃO REAL'}`);
  console.log(`   Skip existentes: ${SKIP_EXISTING ? 'Sim (use --force para reenviar)' : 'Não'}`);
  console.log(`   Source: ${SUPABASE_URL}/storage → ${SOURCE_BUCKET}`);
  if (!DRY_RUN) console.log(`   Target: R2 bucket "${R2_BUCKET}"`);
  console.log(`   Pastas: ${FOLDERS.join(', ')}`);

  const totals = { ok: 0, skipped: 0, fail: 0, totalBytes: 0 };

  for (const folder of FOLDERS) {
    try {
      const result = await migrateFolder(folder);
      totals.ok += result.ok;
      totals.skipped += result.skipped;
      totals.fail += result.fail;
      totals.totalBytes += result.totalBytes;
    } catch (e) {
      console.error(`\n❌ Erro fatal na pasta ${folder}:`, e.message);
    }
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📊 RESUMO FINAL`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`   ✅ Migrados:     ${totals.ok}`);
  console.log(`   ⏭️  Já existiam: ${totals.skipped}`);
  console.log(`   ❌ Erros:        ${totals.fail}`);
  console.log(`   📦 Total:        ${formatBytes(totals.totalBytes)}`);
  console.log(`\n${DRY_RUN ? '💡 Execute sem --dry-run para migrar de verdade.' : '✅ Migração concluída!'}\n`);
})();
