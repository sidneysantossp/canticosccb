export const config = { runtime: 'edge' };

const fallback = `User-agent: *\nAllow: /\n\nSitemap: https://www.canticosccb.com.br/sitemap.xml\n\nDisallow: /admin/\nDisallow: /login\nDisallow: /register\n`;

export default async function handler(): Promise<Response> {
  const url = (process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.VITE_SUPABASE_ANON_KEY || '';
  let content = fallback;
  if (url && key) {
    try {
      const response = await fetch(`${url}/rest/v1/site_config?select=config_key,config_value&config_key=in.(robots_txt,site_url)`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(7000) });
      const rows = await response.json() as Array<{ config_key: string; config_value: string }>;
      const configMap = rows.reduce<Record<string, string>>((acc, row) => { acc[row.config_key] = row.config_value || ''; return acc; }, {});
      content = (configMap.robots_txt || fallback).replace(/^\s*Sitemap:\s*.*$/gim, `Sitemap: ${(configMap.site_url || 'https://www.canticosccb.com.br').replace(/\/+$/, '')}/sitemap.xml`);
    } catch { /* mantém fallback público */ }
  }
  return new Response(content.trim() + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=300' } });
}
