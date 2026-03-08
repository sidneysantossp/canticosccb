import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_SITE_URL = 'https://canticosccb.com.br';

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

function buildDefaultRobots(siteUrl) {
  return `# robots.txt - Cânticos CCB
# ${siteUrl}/robots.txt

User-agent: *
Allow: /

# Sitemap
Sitemap: ${siteUrl}/sitemap.xml

# Disallow private/auth areas
Disallow: /admin
Disallow: /admin/*
Disallow: /composer/dashboard
Disallow: /composer/analytics
Disallow: /composer/songs/upload
Disallow: /composer/albums/create
Disallow: /settings
Disallow: /edit-profile
Disallow: /subscription
Disallow: /login
Disallow: /register
Disallow: /onboarding
Disallow: /composer/onboarding

# Allow all public content
Allow: /hino/*
Allow: /album/*
Allow: /compositor/*
Allow: /cifras
Allow: /cifras/*
Allow: /hinario
Allow: /hinario/*
Allow: /albuns
Allow: /compositores
Allow: /playlists
Allow: /categoria/*
Allow: /trends
Allow: /about
Allow: /termos

# AI Crawlers - explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Bytespider
Allow: /

# Content signals for AI
Content-Signal: search=yes,ai-input=yes,ai-train=no
`;
}

function normalizeRobotsContent(content, siteUrl) {
  let normalized = (content || '').trim();
  if (!normalized) {
    normalized = buildDefaultRobots(siteUrl).trim();
  }

  if (!/^\s*Sitemap:/im.test(normalized)) {
    normalized += `\n\nSitemap: ${siteUrl}/sitemap.xml`;
  }

  if (!/User-agent:\s*GPTBot/i.test(normalized)) {
    normalized += `

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Bytespider
Allow: /`;
  }

  if (!/Content-Signal:/i.test(normalized)) {
    normalized += '\n\nContent-Signal: search=yes,ai-input=yes,ai-train=no';
  }

  return `${normalized.trim()}\n`;
}

async function fetchSiteConfig() {
  loadEnvFile(path.resolve(__dirname, '..', '.env'));
  loadEnvFile(path.resolve(__dirname, '..', '.env.local'));

  const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return { siteUrl: DEFAULT_SITE_URL, robotsTxt: '' };
  }

  const url = new URL(`${supabaseUrl}/rest/v1/site_config`);
  url.searchParams.set('select', 'config_key,config_value');
  url.searchParams.set('config_key', 'in.(robots_txt,site_url)');

  const response = await fetch(url.toString(), {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    console.warn(`⚠️ Failed to fetch site_config for robots.txt: ${response.status} ${response.statusText}`);
    return { siteUrl: DEFAULT_SITE_URL, robotsTxt: '' };
  }

  const rows = await response.json();
  const configMap = rows.reduce((acc, row) => {
    if (row?.config_key) {
      acc[row.config_key] = row.config_value || '';
    }
    return acc;
  }, {});

  return {
    siteUrl: String(configMap.site_url || DEFAULT_SITE_URL).replace(/\/+$/, ''),
    robotsTxt: String(configMap.robots_txt || ''),
  };
}

async function main() {
  const { siteUrl, robotsTxt } = await fetchSiteConfig();
  const content = normalizeRobotsContent(robotsTxt, siteUrl);
  const outPath = path.resolve(__dirname, '..', 'public', 'robots.txt');

  fs.writeFileSync(outPath, content, 'utf-8');
  console.log(`🤖 robots.txt generated → ${outPath}`);
}

main().catch((error) => {
  console.warn('⚠️ Could not regenerate robots.txt. Keeping existing file.', error);
});
