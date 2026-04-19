try {
  await import('dotenv/config');
} catch {}

import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  R2_PUBLIC_URL,
} = process.env;

const DRY_RUN = process.argv.includes('--dry-run');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env');
  process.exit(1);
}

if (!R2_PUBLIC_URL) {
  console.error('❌ R2_PUBLIC_URL é obrigatório no .env (ex: https://media.canticosccb.com.br)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const MEDIA_BASE = R2_PUBLIC_URL.replace(/\/+$/, '');
const LEGACY_PUBLIC_PREFIX = `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public/`;

const TABLES = [
  { table: 'albums', columns: ['cover_url'] },
  { table: 'hinos', columns: ['cover_url', 'audio_url'] },
  { table: 'users', columns: ['avatar_url'] },
  { table: 'profiles', columns: ['avatar_url'] },
  { table: 'composers', columns: ['avatar_url', 'photo_url', 'banner_url'] },
  { table: 'categorias', columns: ['imagem_url'] },
  { table: 'banners', columns: ['image_url'] },
  { table: 'home_banners', columns: ['image_url'] },
  { table: 'site_banners', columns: ['image_url'] },
  { table: 'featured_playlists', columns: ['cover_url', 'thumbnail_url', 'banner_url'] },
  { table: 'curated_playlists', columns: ['cover_url', 'thumbnail_url', 'banner_url'] },
  { table: 'editorial_playlists', columns: ['cover_url', 'thumbnail_url', 'banner_url'] },
  { table: 'playlists_editorial', columns: ['cover_url', 'thumbnail_url', 'banner_url'] },
  { table: 'collections', columns: ['cover_url'] },
  { table: 'songs', columns: ['audio_url', 'cover_url'] },
  { table: 'album_tracks', columns: ['audio_url'] },
  { table: 'branding_logos', columns: ['url'] },
  { table: 'logos', columns: ['url'] },
  { table: 'site_logos', columns: ['url'] },
  { table: 'copyright_chat_attachments', columns: ['file_url'] },
  { table: 'copyright_claims', columns: ['song_cover_url'] },
  { table: 'composer_documents', columns: ['document_image'] },
  { table: 'compositores_pendentes', columns: ['documento_frente_url', 'documento_verso_url'] },
  { table: 'exports', columns: ['file_url'] },
  { table: 'imports', columns: ['file_url'] },
  { table: 'data_exports', columns: ['file_url'] },
  { table: 'backups', columns: ['file_url'] },
];

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

function rewriteLegacyStorageUrl(value) {
  const raw = String(value || '').trim();
  if (!raw || !raw.startsWith(LEGACY_PUBLIC_PREFIX)) return null;

  const remainder = raw.slice(LEGACY_PUBLIC_PREFIX.length);
  const [bucket, ...rest] = remainder.split('/').filter(Boolean);
  const objectPath = rest.join('/');
  const mediaPath = mapBucketPathToMediaPath(bucket, objectPath);

  if (!mediaPath) return null;
  return `${MEDIA_BASE}/${mediaPath}`;
}

async function updateTable(tableName, columns) {
  console.log(`\n📋 ${tableName}`);

  for (const col of columns) {
    const { data, error } = await supabase
      .from(tableName)
      .select(`id, ${col}`);

    if (error) {
      console.error(`   ❌ Erro ao ler ${tableName}.${col}:`, error.message);
      continue;
    }

    const rowsToUpdate = (data || [])
      .map((row) => ({ id: row.id, oldUrl: row[col], newUrl: rewriteLegacyStorageUrl(row[col]) }))
      .filter((row) => row.newUrl && row.newUrl !== row.oldUrl);

    if (rowsToUpdate.length === 0) {
      console.log(`   ${col}: 0 registros com URL legada`);
      continue;
    }

    console.log(`   ${col}: ${rowsToUpdate.length} registros para atualizar`);

    if (DRY_RUN) {
      for (const sample of rowsToUpdate.slice(0, 3)) {
        console.log(`      🔍 ${sample.oldUrl}`);
        console.log(`       → ${sample.newUrl}`);
      }
      if (rowsToUpdate.length > 3) {
        console.log(`      ... e mais ${rowsToUpdate.length - 3} registros`);
      }
      continue;
    }

    let ok = 0;
    let fail = 0;

    for (const row of rowsToUpdate) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ [col]: row.newUrl })
        .eq('id', row.id);

      if (updateError) {
        fail++;
        console.error(`      ❌ id=${row.id}: ${updateError.message}`);
      } else {
        ok++;
      }
    }

    console.log(`      ✅ ${ok} atualizados | ❌ ${fail} erros`);
  }
}

(async () => {
  console.log('\n🔄 Atualização de URLs: Supabase legado → domínio de mídia atual');
  console.log(`   Modo: ${DRY_RUN ? '🔍 DRY-RUN' : '✏️  ATUALIZAÇÃO REAL'}`);
  console.log(`   Prefixo legado: ${LEGACY_PUBLIC_PREFIX}`);
  console.log(`   Base de mídia:   ${MEDIA_BASE}`);

  for (const { table, columns } of TABLES) {
    try {
      await updateTable(table, columns);
    } catch (error) {
      console.error(`\n❌ Erro fatal em ${table}:`, error.message);
    }
  }

  console.log(`\n${DRY_RUN ? '💡 Execute sem --dry-run para aplicar a troca.' : '✅ Atualização de URLs concluída!'}\n`);
})();
