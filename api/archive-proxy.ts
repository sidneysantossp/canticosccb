// Vercel Edge Function — Proxy for protected archive downloads
// Uses Edge Runtime for streaming support (no memory buffering)

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  const rangeHeader = req.headers.get('range');
  const isRangeRequest = Boolean(rangeHeader);

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
    return new Response(JSON.stringify({ error: 'Referência ausente' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Only allow archive.org URLs
  if (!targetUrl.includes('web.archive.org')) {
    return new Response(JSON.stringify({ error: 'Referência protegida inválida' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const upstreamHeaders = new Headers({
      'User-Agent': 'CanticosCCB/1.0 (album-recovery)',
    });

    if (rangeHeader) {
      upstreamHeaders.set('Range', rangeHeader);
    }

    const response = await fetch(targetUrl, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: upstreamHeaders,
      redirect: 'follow',
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Fonte protegida indisponível (${response.status})` }),
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
      'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Content-Range, Accept-Ranges',
      'Cache-Control': isRangeRequest ? 'no-store' : 'public, max-age=86400',
    });

    if (isRangeRequest) {
      headers.set('Vary', 'Range');
    }

    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      headers.set('Content-Range', contentRange);
    }

    const acceptRanges = response.headers.get('Accept-Ranges');
    if (acceptRanges) {
      headers.set('Accept-Ranges', acceptRanges);
    }

    return new Response(req.method === 'HEAD' ? null : response.body, {
      status: response.status,
      headers,
    });
  } catch (error: any) {
    console.error('[archive-proxy] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Falha ao buscar o conteúdo protegido do acervo' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}
