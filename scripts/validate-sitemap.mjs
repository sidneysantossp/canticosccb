import fs from 'node:fs';
import path from 'node:path';

const sitemapPath = path.resolve(process.cwd(), 'public/sitemap.xml');
const xml = fs.readFileSync(sitemapPath, 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const errors = [];
const seen = new Set();
const blockedPrefixes = ['/admin', '/composer', '/compositor/dashboard', '/login', '/register', '/perfil', '/configuracoes'];

if (!xml.includes('<urlset')) errors.push('sitemap sem elemento urlset');
if (urls.length === 0) errors.push('sitemap sem URLs');

for (const raw of urls) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    errors.push(`URL inválida: ${raw}`);
    continue;
  }
  if (url.protocol !== 'https:') errors.push(`URL não HTTPS: ${raw}`);
  if (url.hostname !== 'www.canticosccb.com.br') errors.push(`host não canónico: ${raw}`);
  if (url.search || url.hash) errors.push(`URL com query/hash: ${raw}`);
  if (seen.has(raw)) errors.push(`URL duplicada: ${raw}`);
  seen.add(raw);
  if (blockedPrefixes.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
    errors.push(`rota privada no sitemap: ${raw}`);
  }
}

const requiredPublicHubs = ['/', '/hinario', '/hinos-ccb'];
for (const hub of requiredPublicHubs) {
  if (!urls.includes(`https://www.canticosccb.com.br${hub}`)) errors.push(`hub público ausente: ${hub}`);
}

console.log(`Sitemap URLs: ${urls.length}`);
console.log(`Sitemap errors: ${errors.length}`);
for (const error of errors) console.error(`- ${error}`);
if (errors.length) process.exitCode = 1;
