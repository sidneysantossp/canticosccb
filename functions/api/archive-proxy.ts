// Cloudflare Pages Function — Proxy for protected archive downloads
// Streaming via Web APIs (no buffering)

export const onRequest: PagesFunction = async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  const rangeHeader = request.headers.get('range');
  const isRangeRequest = Boolean(rangeHeader);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  if (!targetUrl) {
    return json({ error: 'Referência ausente' }, 400);
  }

  if (!targetUrl.includes('web.archive.org')) {
    return json({ error: 'Referência protegida inválida' }, 403);
  }

  try {
    const upstreamHeaders = new Headers({
      'User-Agent': 'CanticosCCB/1.0 (album-recovery)',
    });

    if (rangeHeader) {
      upstreamHeaders.set('Range', rangeHeader);
    }

    const response = await fetch(targetUrl, {
      method: request.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: upstreamHeaders,
      redirect: 'follow',
    });

    if (!response.ok) {
      return json(
        { error: `Fonte protegida indisponível (${response.status})` },
        response.status,
      );
    }

    const headers = new Headers({
      'Content-Type': response.headers.get('Content-Type') || 'application/zip',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers':
        'Content-Length, Content-Type, Content-Range, Accept-Ranges',
      'Cache-Control': isRangeRequest ? 'no-store' : 'public, max-age=86400',
    });

    if (isRangeRequest) headers.set('Vary', 'Range');
    copyHeader(response, headers, 'Content-Length');
    copyHeader(response, headers, 'Content-Range');
    copyHeader(response, headers, 'Accept-Ranges');

    return new Response(request.method === 'HEAD' ? null : response.body, {
      status: response.status,
      headers,
    });
  } catch (error: any) {
    console.error('[archive-proxy] Error:', error);
    return json(
      { error: error?.message || 'Falha ao buscar o conteúdo protegido do acervo' },
      502,
    );
  }
};

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function copyHeader(source: Response, target: Headers, name: string): void {
  const value = source.headers.get(name);
  if (value) target.set(name, value);
}
