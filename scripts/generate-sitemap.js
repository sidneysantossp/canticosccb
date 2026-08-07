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

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const envContent = fs.readFileSync(filePath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.resolve(__dirname, '..', '.env'));
loadEnvFile(path.resolve(__dirname, '..', '.env.local'));

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const DEFAULT_SITE_URL = 'https://www.canticosccb.com.br';

function normalizeSiteUrl(siteUrl = DEFAULT_SITE_URL) {
  try {
    const normalizedInput = /^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`;
    const url = new URL(normalizedInput);

    if (url.hostname === 'canticosccb.com.br') {
      url.hostname = 'www.canticosccb.com.br';
    }

    return url.toString().replace(/\/+$/, '');
  } catch {
    return DEFAULT_SITE_URL;
  }
}

const SITE_URL = normalizeSiteUrl(process.env.VITE_SITE_URL || DEFAULT_SITE_URL);
let hadFetchFailure = false;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars. Keeping existing sitemap.xml.');
  process.exit(0);
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

function normalizeHymnTitleForSlug(titulo, numero) {
  let normalized = String(titulo || '').trim();
  if (numero != null) {
    const escapedNumber = String(numero).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const separatorPattern = '(?:-|:|\\u2013)?';
    const leadingPattern = new RegExp(`^hino\\s*${escapedNumber}(?:\\s*ccb)?\\s*${separatorPattern}\\s*`, 'i');
    normalized = normalized.replace(leadingPattern, '').trim();
  }
  return normalized || String(titulo || '');
}

function buildHinoUrl(id, titulo, numero) {
  if (!titulo) return `/hino/${id}`;
  const parts = ['hino'];
  if (numero != null) parts.push(String(numero));
  parts.push('ccb');
  parts.push(slugify(normalizeHymnTitleForSlug(titulo, numero)));
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

function buildPlaylistUrl(id) {
  return `/playlist/${id}`;
}

async function supabaseFetch(table, select = '*', filters = {}) {
  try {
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
      hadFetchFailure = true;
      return [];
    }

    return res.json();
  } catch (error) {
    console.warn(`⚠️ Failed to fetch ${table}:`, error.message || error);
    hadFetchFailure = true;
    return [];
  }
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
  const lastmodXml = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>
    <loc>${escapeXml(SITE_URL + loc)}</loc>${lastmodXml}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function main() {
  console.log('🗺️  Generating sitemap.xml...');
  const today = new Date().toISOString().split('T')[0];
  const staticLastmod = process.env.SITEMAP_STATIC_LASTMOD || '';
  const urls = [];

  // Static pages
  urls.push(urlEntry('/', staticLastmod, 'daily', '1.0'));
  urls.push(urlEntry('/search', staticLastmod, 'daily', '0.9'));
  urls.push(urlEntry('/cifras', staticLastmod, 'daily', '0.9'));
  urls.push(urlEntry('/cifras-hinos-ccb', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/hinario', staticLastmod, 'daily', '0.9'));
  urls.push(urlEntry('/hinos-ccb', staticLastmod, 'weekly', '0.9'));
  urls.push(urlEntry('/hinos-1-a-120-ccb', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/hinos-121-a-240-ccb', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/hinos-241-a-360-ccb', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/hinos-361-a-480-ccb', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/hinario-5-ccb', staticLastmod, 'weekly', '0.9'));
  urls.push(urlEntry('/letras-hinos-ccb', staticLastmod, 'weekly', '0.9'));
  urls.push(urlEntry('/hinos-cantados-ccb', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/hinos-tocados-ccb', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/hinos-avulsos-ccb', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/instrumentais', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/biblia-ccb', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/biblia-narrada', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/trends', staticLastmod, 'daily', '0.8'));
  urls.push(urlEntry('/about', staticLastmod, 'monthly', '0.5'));
  urls.push(urlEntry('/termos', staticLastmod, 'yearly', '0.3'));
  urls.push(urlEntry('/categorias', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/compositores', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/albuns', staticLastmod, 'weekly', '0.8'));
  urls.push(urlEntry('/playlists', staticLastmod, 'weekly', '0.7'));
  urls.push(urlEntry('/radio', staticLastmod, 'weekly', '0.6'));
  urls.push(urlEntry('/cifras-violao-ccb', staticLastmod, 'weekly', '0.7'));
  urls.push(urlEntry('/cifras-ukulele-ccb', staticLastmod, 'weekly', '0.7'));
  urls.push(urlEntry('/cifras-teclado-ccb', staticLastmod, 'weekly', '0.7'));
  urls.push(urlEntry('/baixar-hinos-ccb', staticLastmod, 'monthly', '0.6'));
  urls.push(urlEntry('/baixar-albuns-ccb', staticLastmod, 'monthly', '0.6'));
  urls.push(urlEntry('/baixar-cds-ccb', staticLastmod, 'monthly', '0.6'));
  urls.push(urlEntry('/privacidade', staticLastmod, 'yearly', '0.3'));
  urls.push(urlEntry('/avisos', staticLastmod, 'daily', '0.6'));
  urls.push(urlEntry('/ajuda', staticLastmod, 'monthly', '0.4'));
  urls.push(urlEntry('/contato', staticLastmod, 'monthly', '0.4'));
  urls.push(urlEntry('/reivindicacao-de-conteudo', staticLastmod, 'monthly', '0.4'));
  const staticUrlCount = urls.length;

  // Hinos
  console.log('  📀 Fetching hinos...');
  const hinos = await supabaseFetch('hinos', 'id,numero,titulo,updated_at,created_at', {
    'or': '(ativo.eq.true,ativo.eq.1)',
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
    'or': '(is_published.eq.true,is_published.eq.1)',
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
  const compositores = await supabaseFetch('composers', 'id,name,artistic_name,updated_at,created_at', {
    'or': '(verified.eq.true,status.eq.approved)',
    'order': 'name.asc',
    'limit': '2000',
  });
  console.log(`     Found ${compositores.length} compositores`);
  for (const c of compositores) {
    const mod = (c.updated_at || c.created_at || today).split('T')[0];
    urls.push(urlEntry(buildCompositorUrl(c.id, c.artistic_name || c.name), mod, 'monthly', '0.7'));
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
    'or': '(ativo.eq.true,ativo.eq.1)',
    'order': 'nome.asc',
    'limit': '200',
  });
  console.log(`     Found ${categorias.length} categorias`);
  for (const cat of categorias) {
    const mod = (cat.updated_at || today).split('T')[0];
    const catSlug = cat.slug || cat.id;
    urls.push(urlEntry(`/categoria/${catSlug}`, mod, 'weekly', '0.6'));
  }

  // Playlists públicas
  console.log('  🎧 Fetching playlists...');
  const playlists = await supabaseFetch('playlists', 'id,updated_at,created_at', {
    'or': '(is_public.eq.true,is_public.eq.1)',
    'order': 'updated_at.desc',
    'limit': '5000',
  });
  console.log(`     Found ${playlists.length} playlists`);
  for (const playlist of playlists) {
    const mod = (playlist.updated_at || playlist.created_at || today).split('T')[0];
    urls.push(urlEntry(buildPlaylistUrl(playlist.id), mod, 'weekly', '0.6'));
  }

  // Build XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  const outPath = path.resolve(__dirname, '..', 'public', 'sitemap.xml');
  if (hadFetchFailure && urls.length === staticUrlCount && fs.existsSync(outPath)) {
    console.warn('⚠️ Dynamic sitemap data unavailable. Keeping existing sitemap.xml.');
    return;
  }
  fs.writeFileSync(outPath, xml, 'utf-8');
  console.log(`\n✅ Sitemap generated with ${urls.length} URLs → ${outPath}`);
}

main().catch(err => {
  console.warn('⚠️ Sitemap generation failed. Keeping existing sitemap.xml.', err);
});
