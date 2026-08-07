#!/usr/bin/env node

/**
 * validate-seo-assets.js
 *
 * Lightweight technical SEO/AI discovery regression checks.
 * It validates the public files that search engines and answer engines read
 * before JavaScript execution.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'https://www.canticosccb.com.br';

const checks = [];

function readFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function assertCheck(label, condition, details = '') {
  checks.push({ label, ok: Boolean(condition), details });
}

function validateIndex() {
  const html = readFile('index.html');
  assertCheck('index has canonical home', html.includes(`<link rel="canonical" href="${SITE_URL}/">`));
  assertCheck('index allows public indexing', /<meta\s+name="robots"\s+content="index,\s*follow"/i.test(html));
  assertCheck('index has Open Graph image', html.includes(`property="og:image" content="${SITE_URL}/logo-canticos-ccb.png"`));
  assertCheck('index has base JSON-LD', html.includes('"@context": "https://schema.org"'));
  assertCheck('index links manifest', html.includes('rel="manifest"'));
}

function validateRobots() {
  const robots = readFile('public/robots.txt');
  assertCheck('robots points to canonical sitemap', robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));
  assertCheck('robots allows public crawl', /User-agent:\s*\*\s+Allow:\s*\//i.test(robots));
  assertCheck('robots blocks admin area', /Disallow:\s*\/admin\b/i.test(robots));
  assertCheck('robots declares AI search crawlers', /User-agent:\s*OAI-SearchBot/i.test(robots) && /User-agent:\s*PerplexityBot/i.test(robots));
  assertCheck('robots blocks AI training crawlers', /User-agent:\s*GPTBot\s+Disallow:\s*\//i.test(robots) && /User-agent:\s*Google-Extended\s+Disallow:\s*\//i.test(robots));
}

function validateLlms() {
  const llms = readFile('public/llms.txt');
  assertCheck('llms identifies site', /^# Cânticos CCB/m.test(llms));
  assertCheck('llms references canonical host', llms.includes(SITE_URL));
  assertCheck('llms references sitemap', llms.includes(`${SITE_URL}/sitemap.xml`));
  assertCheck('llms states independence disclaimer', /independente, sem vínculo institucional/i.test(llms));
  assertCheck('llms guides AI assistants', /Uso por Assistentes de IA/i.test(llms));
}

function validateSitemap() {
  const sitemap = readFile('public/sitemap.xml');
  const urlCount = (sitemap.match(/<url>/g) || []).length;
  assertCheck('sitemap is XML urlset', sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assertCheck('sitemap has canonical URLs', sitemap.includes(`<loc>${SITE_URL}/`));
  assertCheck('sitemap avoids non-www host', !sitemap.includes('https://canticosccb.com.br/'));
  assertCheck('sitemap has substantial coverage', urlCount >= 1000, `${urlCount} URLs`);
}

function validateManifest() {
  const manifest = JSON.parse(readFile('public/manifest.webmanifest'));
  assertCheck('manifest has app name', manifest.name === 'Cânticos CCB');
  assertCheck('manifest has pt-BR lang', manifest.lang === 'pt-BR');
  assertCheck('manifest has icons', Array.isArray(manifest.icons) && manifest.icons.length >= 4);
  assertCheck('manifest has maskable icon', JSON.stringify(manifest.icons || []).includes('maskable'));
}

function validateVercelHeaders() {
  const vercel = JSON.parse(readFile('vercel.json'));
  const headers = JSON.stringify(vercel.headers || []);
  const rewrites = JSON.stringify(vercel.rewrites || []);
  assertCheck('vercel sets llms content type', headers.includes('/llms.txt') && headers.includes('text/plain; charset=utf-8'));
  assertCheck('vercel noindexes private routes', headers.includes('X-Robots-Tag') && headers.includes('noindex, nofollow, noarchive'));
  assertCheck('vercel has bot SSR rewrites', rewrites.includes('/api/ssr') && rewrites.includes('googlebot') && rewrites.includes('oai-searchbot'));
}

try {
  validateIndex();
  validateRobots();
  validateLlms();
  validateSitemap();
  validateManifest();
  validateVercelHeaders();
} catch (error) {
  console.error(`❌ SEO audit failed: ${error.message}`);
  process.exit(1);
}

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  const suffix = check.details ? ` (${check.details})` : '';
  console.log(`${check.ok ? '✅' : '❌'} ${check.label}${suffix}`);
}

if (failed.length > 0) {
  console.error(`\n❌ ${failed.length} SEO/AI checks failed.`);
  process.exit(1);
}

console.log(`\n✅ ${checks.length} SEO/AI discovery checks passed.`);
