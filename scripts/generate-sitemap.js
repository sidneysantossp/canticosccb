/**
 * generate-sitemap.js
 * 
 * Build-time script that fetches all public content from Supabase
 * and generates a comprehensive sitemap.xml in the public/ folder.
 * 
 * Usage: node scripts/generate-sitemap.js
 * Requires: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file manually (no external deps)
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SITE_URL = 'https://canticosccb.com.br';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
  process.exit(1);
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

function buildHinoUrl(id, titulo, numero) {
  if (!titulo) return `/hino/${id}`;
  const parts = [];
  if (numero != null) parts.push(String(numero));
  parts.push(slugify(titulo));
  return `/hino/${parts.join('-')}-${id}`;
}

function buildAlbumUrl(id, titulo, artista) {
  if (!titulo) return `/album/${id}`;
  const parts = [slugify(titulo)];
  if (artista) parts.push(slugify(artista));
  return `/album/${parts.join('-')}-${id}`;
}

function buildCompositorUrl(id, nome) {
  if (!nome) return `/compositor/${id}`;
  return `/compositor/${slugify(nome)}-${id}`;
}

async function supabaseFetch(table, select = '*', filters = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set('select', select);
  Object.entries(filters).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    console.warn(`⚠️ Failed to fetch ${table}: ${res.status} ${res.statusText}`);
    return [];
  }

  return res.json();
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, lastmod, changefreq, priority) {
  const today = new Date().toISOString().split('T')[0];
  return `  <url>
    <loc>${escapeXml(SITE_URL + loc)}</loc>
    <lastmod>${lastmod || today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function main() {
  console.log('🗺️  Generating sitemap.xml...');
  const today = new Date().toISOString().split('T')[0];
  const urls = [];

  // Static pages
  urls.push(urlEntry('/', today, 'daily', '1.0'));
  urls.push(urlEntry('/search', today, 'daily', '0.9'));
  urls.push(urlEntry('/cifras', today, 'daily', '0.9'));
  urls.push(urlEntry('/hinario', today, 'daily', '0.9'));
  urls.push(urlEntry('/trends', today, 'daily', '0.8'));
  urls.push(urlEntry('/sobre', today, 'monthly', '0.5'));
  urls.push(urlEntry('/termos', today, 'yearly', '0.3'));
  urls.push(urlEntry('/categorias', today, 'weekly', '0.8'));
  urls.push(urlEntry('/compositores', today, 'weekly', '0.8'));
  urls.push(urlEntry('/albuns', today, 'weekly', '0.8'));
  urls.push(urlEntry('/recem-chegados', today, 'daily', '0.8'));
  urls.push(urlEntry('/instrumentais', today, 'weekly', '0.7'));
  urls.push(urlEntry('/biblia-narrada', today, 'weekly', '0.7'));
  urls.push(urlEntry('/privacidade', today, 'yearly', '0.3'));

  // Hinos
  console.log('  📀 Fetching hinos...');
  const hinos = await supabaseFetch('hinos', 'id,numero,titulo,updated_at,created_at', {
    'ativo': 'eq.true',
    'order': 'numero.asc',
    'limit': '5000',
  });
  console.log(`     Found ${hinos.length} hinos`);
  for (const h of hinos) {
    const mod = (h.updated_at || h.created_at || today).split('T')[0];
    urls.push(urlEntry(buildHinoUrl(h.id, h.titulo, h.numero), mod, 'weekly', '0.8'));
  }

  // Álbuns
  console.log('  💿 Fetching albums...');
  const albums = await supabaseFetch('albums', 'id,title,artist,updated_at,created_at', {
    'is_published': 'eq.true',
    'order': 'created_at.desc',
    'limit': '2000',
  });
  console.log(`     Found ${albums.length} albums`);
  for (const a of albums) {
    const mod = (a.updated_at || a.created_at || today).split('T')[0];
    urls.push(urlEntry(buildAlbumUrl(a.id, a.title, a.artist), mod, 'monthly', '0.7'));
  }

  // Compositores
  console.log('  🎵 Fetching compositores...');
  const compositores = await supabaseFetch('composers', 'id,name,updated_at,created_at', {
    'or': '(verified.eq.true,status.eq.approved)',
    'order': 'name.asc',
    'limit': '2000',
  });
  console.log(`     Found ${compositores.length} compositores`);
  for (const c of compositores) {
    const mod = (c.updated_at || c.created_at || today).split('T')[0];
    urls.push(urlEntry(buildCompositorUrl(c.id, c.name), mod, 'monthly', '0.7'));
  }

  // Cifras
  console.log('  🎸 Fetching cifras...');
  const cifras = await supabaseFetch('cifras', 'id,slug,updated_at,created_at', {
    'is_active': 'eq.true',
    'order': 'created_at.desc',
    'limit': '5000',
  });
  console.log(`     Found ${cifras.length} cifras`);
  for (const ci of cifras) {
    const mod = (ci.updated_at || ci.created_at || today).split('T')[0];
    const slug = ci.slug || ci.id;
    urls.push(urlEntry(`/cifra/${slug}`, mod, 'monthly', '0.7'));
  }

  // Hinário (letras)
  console.log('  📖 Fetching hinário...');
  const hinario = await supabaseFetch('hinario', 'id,numero,updated_at,created_at', {
    'is_active': 'eq.true',
    'order': 'numero.asc',
    'limit': '500',
  });
  console.log(`     Found ${hinario.length} hinário entries`);
  for (const h of hinario) {
    const mod = (h.updated_at || h.created_at || today).split('T')[0];
    urls.push(urlEntry(`/hinario/${h.numero}`, mod, 'monthly', '0.7'));
  }

  // Categorias (buscar do banco)
  console.log('  📂 Fetching categorias...');
  const categorias = await supabaseFetch('categorias', 'id,nome,slug,updated_at', {
    'ativo': 'eq.1',
    'order': 'nome.asc',
    'limit': '200',
  });
  console.log(`     Found ${categorias.length} categorias`);
  for (const cat of categorias) {
    const mod = (cat.updated_at || today).split('T')[0];
    const catSlug = cat.slug || cat.id;
    urls.push(urlEntry(`/categoria/${catSlug}`, mod, 'weekly', '0.6'));
  }

  // Build XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  const outPath = path.resolve(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf-8');
  console.log(`\n✅ Sitemap generated with ${urls.length} URLs → ${outPath}`);
}

main().catch(err => {
  console.error('❌ Sitemap generation failed:', err);
  process.exit(1);
});
