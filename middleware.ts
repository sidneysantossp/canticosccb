import { next, rewrite } from '@vercel/functions/middleware';

const BOT_UA_PATTERN = /.*(googlebot|bingbot|yandexbot|duckduckbot|slurp|baiduspider|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|applebot|pinterest|redditbot|gptbot|oai-searchbot|chatgpt-user|claudebot|google-extended|applebot-extended|perplexitybot|perplexity-user|bytespider|ccbot|amazonbot|meta-externalagent|petalbot|semrushbot|ahrefsbot|mj12bot|embedly|quora|showyoubot|outbrain|rogerbot|screaming.frog).*/i;
const PUBLIC_EXACT = new Set([
  '/', '/cifras', '/hinario', '/playlists', '/categorias', '/compositores', '/albuns',
  '/hinos-ccb', '/hinos-1-a-120-ccb', '/hinos-121-a-240-ccb', '/hinos-241-a-360-ccb',
  '/hinos-361-a-480-ccb', '/hinario-5-ccb', '/letras-hinos-ccb', '/hinos-cantados-ccb',
  '/hinos-tocados-ccb', '/hinos-avulsos-ccb', '/cifras-hinos-ccb', '/cifras-violao-ccb',
  '/cifras-ukulele-ccb', '/cifras-teclado-ccb', '/baixar-hinos-ccb', '/baixar-albuns-ccb',
  '/baixar-cds-ccb', '/trends', '/tendencias', '/about', '/sobre', '/search', '/buscar',
  '/termos', '/premium', '/privacidade', '/privacy', '/cookies', '/disclaimer', '/lgpd',
  '/avisos', '/ajuda', '/contato', '/instrumentais', '/biblia-ccb', '/biblia-narrada',
  '/radio', '/biblia', '/biblia/'
]);
const PUBLIC_PREFIXES = [/^\/hino\//, /^\/compositor\//, /^\/album\//, /^\/categoria\//, /^\/playlist\//, /^\/cifra\//, /^\/hinario\/\d+$/];
const PRIVATE_PREFIXES = ['/admin', '/composer', '/compositor/cadastro', '/perfil', '/profile', '/biblioteca', '/library', '/favoritos', '/liked', '/historico', '/history', '/downloads', '/notifications', '/notificacoes', '/chat', '/suporte', '/support', '/configuracoes', '/settings', '/login', '/register', '/onboarding', '/subscription', '/edit-profile'];

export const config = { matcher: '/:path*' };

function isIgnoredPath(pathname: string) {
  return pathname.startsWith('/api/') || pathname === '/api' || /\.[a-z0-9]+$/i.test(pathname);
}

function isKnownAppRoute(pathname: string) {
  return PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((pattern) => pattern.test(pathname)) || PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/')) || pathname === '/hinos' || pathname === '/hinos/';
}

function notFoundResponse(pathname: string) {
  const html = '<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="robots" content="noindex, follow"><title>Página não encontrada | Cânticos CCB</title></head><body><main><h1>Página não encontrada</h1><p>A página solicitada não existe ou foi movida.</p><a href="https://www.canticosccb.com.br/">Voltar ao início</a></main></body></html>';
  return new Response(html, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex, follow, noarchive', 'x-matched-path': pathname } });
}

export default function middleware(request: Request) {
  const url = new URL(request.url);
  if (isIgnoredPath(url.pathname) || isKnownAppRoute(url.pathname)) {
    if (url.pathname === '/') {
      const userAgent = request.headers.get('user-agent') || '';
      if (BOT_UA_PATTERN.test(userAgent)) return rewrite(new URL('/api/ssr?path=/', request.url));
    }
    if (PUBLIC_PREFIXES.some((pattern) => pattern.test(url.pathname)) && !PRIVATE_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(prefix + "/"))) {
      const ssrUrl = new URL("/api/ssr", request.url);
      ssrUrl.searchParams.set("path", url.pathname);
      return rewrite(ssrUrl);
    }
    return next();
  }
  return notFoundResponse(url.pathname);
}
