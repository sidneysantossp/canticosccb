import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// ─── Config ───────────────────────────────────────────────
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

// Prefixo antigo do Supabase Storage
const OLD_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/images/`;
// Novo prefixo R2
const NEW_PREFIX = R2_PUBLIC_URL.replace(/\/+$/, '') + '/';

// ─── Tabelas e colunas para atualizar ─────────────────────
const TABLES = [
  { table: 'albums', columns: ['cover_url'] },
  { table: 'hinos', columns: ['cover_url'] },
  { table: 'composers', columns: ['avatar_url', 'photo_url', 'banner_url'] },
  { table: 'banners', columns: ['image_url'] },
  { table: 'users', columns: ['avatar_url'] },
];

// ─── Atualizar URLs de uma tabela ─────────────────────────
async function updateTable(tableName, columns) {
  console.log(`\n📋 ${tableName}`);

  for (const col of columns) {
    // Buscar registros com URL antiga
    const { data, error } = await supabase
      .from(tableName)
      .select(`id, ${col}`)
      .like(col, `${OLD_PREFIX}%`);

    if (error) {
      console.error(`   ❌ Erro ao ler ${tableName}.${col}:`, error.message);
      continue;
    }

    if (!data || data.length === 0) {
      console.log(`   ${col}: 0 registros com URL antiga`);
      continue;
    }

    console.log(`   ${col}: ${data.length} registros para atualizar`);

    let ok = 0;
    let fail = 0;

    for (const row of data) {
      const oldUrl = row[col];
      const newUrl = oldUrl.replace(OLD_PREFIX, NEW_PREFIX);

      if (DRY_RUN) {
        if (ok < 3) {
          console.log(`      🔍 ${oldUrl}`);
          console.log(`       → ${newUrl}`);
        }
        ok++;
        continue;
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ [col]: newUrl })
        .eq('id', row.id);

      if (updateError) {
        fail++;
        console.error(`      ❌ id=${row.id}: ${updateError.message}`);
      } else {
        ok++;
      }
    }

    if (DRY_RUN) {
      console.log(`      ... e mais ${Math.max(0, ok - 3)} registros`);
      console.log(`      Total: ${ok} URLs a trocar`);
    } else {
      console.log(`      ✅ ${ok} atualizados | ❌ ${fail} erros`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────
(async () => {
  console.log('\n🔄 Atualização de URLs: Supabase → Cloudflare R2');
  console.log(`   Modo: ${DRY_RUN ? '🔍 DRY-RUN (apenas listagem)' : '✏️  ATUALIZAÇÃO REAL'}`);
  console.log(`   De: ${OLD_PREFIX}`);
  console.log(`   Para: ${NEW_PREFIX}`);

  for (const { table, columns } of TABLES) {
    try {
      await updateTable(table, columns);
    } catch (e) {
      console.error(`\n❌ Erro fatal em ${table}:`, e.message);
    }
  }

  console.log(`\n${DRY_RUN ? '💡 Execute sem --dry-run para atualizar de verdade.' : '✅ Atualização de URLs concluída!'}\n`);
})();
