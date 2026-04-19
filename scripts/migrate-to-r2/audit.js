try {
  await import('dotenv/config');
} catch {}

import pg from 'pg';

const { Client } = pg;

const {
  OLD_DB_URL,
  NEW_DB_URL,
  MEDIA_BASE_URL = 'https://media.canticosccb.com.br',
} = process.env;

if (!OLD_DB_URL || !NEW_DB_URL) {
  console.error('❌ OLD_DB_URL e NEW_DB_URL são obrigatórios no .env');
  process.exit(1);
}

const REFERENCE_COLUMNS = [
  ['hinos', 'audio_url'],
  ['hinos', 'cover_url'],
  ['albums', 'cover_url'],
  ['users', 'avatar_url'],
  ['composers', 'avatar_url'],
  ['composers', 'banner_url'],
  ['composers', 'photo_url'],
  ['banners', 'image_url'],
  ['home_banners', 'image_url'],
  ['site_banners', 'image_url'],
  ['categorias', 'imagem_url'],
  ['playlists', 'cover_url'],
];

const LEGACY_STORAGE_HOST = 'rdogsfrplohxnemvtetn.supabase.co';
const CURRENT_STORAGE_HOST = 'vxzyujmqiqenevoatmgy.supabase.co';

const basename = (value) => String(value || '').split('/').filter(Boolean).pop() || '';

function mapBucketPathToMediaPath(bucket, objectPath) {
  const clean = String(objectPath || '').replace(/^\/+/, '');
  if (!bucket || !clean) return '';

  switch (bucket) {
    case 'images':
      return clean;
    case 'banners':
      return clean.startsWith('banners/') ? clean : `banners/${clean}`;
    case 'avatars':
    case 'user-avatars':
    case 'composer-avatars':
      return `avatars/${basename(clean)}`;
    case 'covers':
      return `covers/${basename(clean)}`;
    case 'logos':
      return `logos/${basename(clean)}`;
    case 'documents':
      return `documents/${basename(clean)}`;
    case 'songs':
      return `songs/${basename(clean)}`;
    case 'media':
      return `media/${basename(clean)}`;
    case 'copyright-attachments':
      return `copyright-attachments/${basename(clean)}`;
    default:
      return `${bucket}/${clean}`;
  }
}

function rewriteToMedia(url) {
  if (!url) return '';
  try {
    const parsed = new URL(String(url));
    const marker = '/storage/v1/object/public/';
    if (!parsed.pathname.startsWith(marker)) return '';

    const remainder = parsed.pathname.slice(marker.length);
    const [bucket, ...rest] = remainder.split('/').filter(Boolean);
    const objectPath = rest.join('/');
    const mediaPath = mapBucketPathToMediaPath(bucket, objectPath);
    if (!mediaPath) return '';

    return `${MEDIA_BASE_URL.replace(/\/+$/, '')}/${mediaPath.replace(/^\/+/, '')}`;
  } catch {
    return '';
  }
}

function classifyUrl(url) {
  if (!url) return 'empty';
  const value = String(url);
  if (value.includes(MEDIA_BASE_URL.replace(/\/+$/, ''))) return 'media-domain';
  if (value.includes(CURRENT_STORAGE_HOST) && value.includes('/storage/')) return 'new-supabase-storage';
  if (value.includes(LEGACY_STORAGE_HOST) && value.includes('/storage/')) return 'old-supabase-storage';
  if (/^https?:\/\//i.test(value)) return 'other-http';
  if (value.startsWith('/')) return 'relative';
  return 'plain-path';
}

async function withClient(connectionString, fn) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => {});
  }
}

async function run() {
  console.log('\n🔎 Auditoria de storage da plataforma\n');

  const oldBuckets = await withClient(OLD_DB_URL, async (client) => {
    const res = await client.query(`
      select bucket_id,
             count(*)::int as objects,
             coalesce(sum(((metadata->>'size'))::bigint), 0)::bigint as total_bytes
      from storage.objects
      group by bucket_id
      order by bucket_id
    `);
    return res.rows;
  });

  const oldImagesFolders = await withClient(OLD_DB_URL, async (client) => {
    const res = await client.query(`
      select split_part(name, '/', 1) as top_folder,
             count(*)::int as objects,
             coalesce(sum(((metadata->>'size'))::bigint), 0)::bigint as total_bytes
      from storage.objects
      where bucket_id = 'images'
      group by split_part(name, '/', 1)
      order by objects desc, top_folder asc
    `);
    return res.rows;
  });

  const urlSummary = await withClient(NEW_DB_URL, async (client) => {
    const results = [];
    for (const [table, column] of REFERENCE_COLUMNS) {
      const res = await client.query(`select ${column} as value from public.${table}`);
      const counts = {};
      let sampleMediaUrl = '';

      for (const row of res.rows) {
        const bucket = classifyUrl(row.value);
        counts[bucket] = (counts[bucket] || 0) + 1;
        if (!sampleMediaUrl && bucket === 'old-supabase-storage') {
          sampleMediaUrl = rewriteToMedia(row.value);
        }
      }

      results.push({
        table,
        column,
        rows: res.rowCount,
        counts,
        sampleMediaUrl,
      });
    }
    return results;
  });

  console.log('📦 Buckets do projeto antigo');
  console.log(JSON.stringify(oldBuckets, null, 2));

  console.log('\n🗂️ Pastas internas do bucket images (projeto antigo)');
  console.log(JSON.stringify(oldImagesFolders, null, 2));

  console.log('\n🔗 Estado atual das referências de mídia no banco novo');
  console.log(JSON.stringify(urlSummary, null, 2));
}

run().catch((error) => {
  console.error('\n❌ Falha na auditoria:', error.message);
  process.exit(1);
});
