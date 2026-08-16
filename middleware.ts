import { next, rewrite } from '@vercel/functions/middleware';

// Mechanical conversion of the exact bot set used by vercel.json:
// (?i).*(googlebot|...|screaming.frog).*
const BOT_UA_PATTERN = /.*(googlebot|bingbot|yandexbot|duckduckbot|slurp|baiduspider|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|applebot|pinterest|redditbot|gptbot|oai-searchbot|chatgpt-user|claudebot|google-extended|applebot-extended|perplexitybot|perplexity-user|bytespider|ccbot|amazonbot|meta-externalagent|petalbot|semrushbot|ahrefsbot|mj12bot|embedly|quora|showyoubot|outbrain|rogerbot|screaming.frog).*/i;

export const config = {
  matcher: '/',
};

export default function middleware(request: Request) {
  const url = new URL(request.url);

  // Defensive guard: keep the middleware root-only if the matcher is broadened unexpectedly.
  if (url.pathname !== '/') return next();

  const userAgent = request.headers.get('user-agent') || '';
  if (!BOT_UA_PATTERN.test(userAgent)) return next();

  return rewrite(new URL('/api/ssr?path=/', request.url));
}
