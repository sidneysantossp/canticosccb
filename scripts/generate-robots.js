import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_SITE_URL = 'https://www.canticosccb.com.br';
const FETCH_TIMEOUT_MS = Number.parseInt(process.env.ROBOTS_FETCH_TIMEOUT_MS || '8000', 10);
const PRIVATE_ROBOTS_RULES = `Disallow: /admin
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
Disallow: /composer/onboarding`;

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
${PRIVATE_ROBOTS_RULES}

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

# AI search and answer crawlers - public content allowed
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: ClaudeBot
${PRIVATE_ROBOTS_RULES}
Allow: /

# AI training crawlers - not allowed
User-agent: GPTBot
Disallow: /
User-agent: Google-Extended
Disallow: /
User-agent: Applebot-Extended
Disallow: /
User-agent: Bytespider
Disallow: /
User-agent: CCBot
Disallow: /

# Content signals for AI
Content-Signal: search=yes,ai-input=yes,ai-train=no
`;
}

function normalizeRobotsContent(content, siteUrl) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  let normalized = (content || '').trim();
  if (!normalized) {
    normalized = buildDefaultRobots(normalizedSiteUrl).trim();
  }

  normalized = normalized
    .replace(/https:\/\/canticosccb\.com\.br\/robots\.txt/gi, `${normalizedSiteUrl}/robots.txt`)
    .replace(/^\s*Sitemap:\s*.*$/gim, `Sitemap: ${normalizedSiteUrl}/sitemap.xml`);

  if (!/^\s*Sitemap:/im.test(normalized)) {
    normalized += `\n\nSitemap: ${normalizedSiteUrl}/sitemap.xml`;
  }

  normalized = normalized
    .replace(/\n?# AI Crawlers[\s\S]*?(?=\n# Content signals|\nContent-Signal:|$)/i, '')
    .replace(/\n?# AI search and answer crawlers[\s\S]*?(?=\n# Content signals|\nContent-Signal:|$)/i, '')
    .replace(/^\s*# Content signals for AI\s*$/gim, '')
    .replace(/^\s*Content-Signal:.*$/gim, '')
    .trim();

  normalized += `

# AI search and answer crawlers - public content allowed
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: ClaudeBot
${PRIVATE_ROBOTS_RULES}
Allow: /

# AI training crawlers - not allowed
User-agent: GPTBot
Disallow: /
User-agent: Google-Extended
Disallow: /
User-agent: Applebot-Extended
Disallow: /
User-agent: Bytespider
Disallow: /
User-agent: CCBot
Disallow: /`;

  normalized += '\n\n# Content signals for AI\nContent-Signal: search=yes,ai-input=yes,ai-train=no';

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      signal: controller.signal,
    });
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? `request timed out after ${FETCH_TIMEOUT_MS}ms`
      : error?.message || error;
    console.warn(`⚠️ Failed to fetch site_config for robots.txt: ${message}`);
    return { siteUrl: DEFAULT_SITE_URL, robotsTxt: '' };
  } finally {
    clearTimeout(timeoutId);
  }

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
    siteUrl: normalizeSiteUrl(String(configMap.site_url || DEFAULT_SITE_URL)),
    robotsTxt: String(configMap.robots_txt || ''),
  };
}

async function main() {
  // Na Vercel, /robots.txt é atendido por api/robots.ts para refletir o
  // conteúdo salvo no Admin sem exigir uma nova publicação.
  if (process.env.VERCEL) {
    console.log('🤖 robots.txt dinâmico será atendido pela API em produção.');
    return;
  }

  const { siteUrl, robotsTxt } = await fetchSiteConfig();
  const content = normalizeRobotsContent(robotsTxt, siteUrl);
  const outPath = path.resolve(__dirname, '..', 'public', 'robots.txt');

  fs.writeFileSync(outPath, content, 'utf-8');
  console.log(`🤖 robots.txt generated → ${outPath}`);
}

main().catch((error) => {
  console.warn('⚠️ Could not regenerate robots.txt. Keeping existing file.', error);
});
