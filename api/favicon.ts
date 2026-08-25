export const config = { runtime: 'edge' };

const fallback = 'https://www.canticosccb.com.br/favicon-96x96.png';

export default async function handler(): Promise<Response> {
  const url = (process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.VITE_SUPABASE_ANON_KEY || '';
  let favicon = fallback;
  if (url && key) {
    try {
      const response = await fetch(`${url}/rest/v1/site_logos?select=url&type=eq.favicon&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(7000) });
      const rows = await response.json() as Array<{ url?: string }>;
      if (rows[0]?.url) favicon = rows[0].url;
    } catch { /* mantém o ícone estável de fallback */ }
  }
  return Response.redirect(favicon, 302);
}
