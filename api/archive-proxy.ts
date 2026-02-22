// Vercel Edge Function — Proxy for Web Archive ZIP downloads
// Uses Edge Runtime for streaming support (no memory buffering)

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Only allow archive.org URLs
  if (!targetUrl.includes('web.archive.org')) {
    return new Response(JSON.stringify({ error: 'Only web.archive.org URLs allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'CanticosCCB/1.0 (album-recovery)' },
      redirect: 'follow',
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Archive returned ${response.status} ${response.statusText}` }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Stream the response body directly (no buffering)
    const headers = new Headers({
      'Content-Type': response.headers.get('Content-Type') || 'application/zip',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
      'Cache-Control': 'public, max-age=86400',
    });

    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new Response(response.body, { status: 200, headers });
  } catch (error: any) {
    console.error('[archive-proxy] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to fetch from archive.org' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}
