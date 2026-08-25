// Cloudflare Pages Function — Fallback resolver for hymn audio
// Tenta a URL fornecida; se indisponível, resolve para emergency archive track

import { getEmergencyArchiveZipSegmentByNumber } from './_emergencyAudioArchives.js';

const SITE_BASE_URL = 'https://www.canticosccb.com.br';
const CACHE_CONTROL = 'public, max-age=300, s-maxage=300';

export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      },
    });
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    return jsonError('Method Not Allowed', 405, { Allow: 'GET, HEAD, OPTIONS' });
  }

  const { searchParams } = new URL(request.url);
  const number = Number(searchParams.get('number') || '');
  const title = (searchParams.get('title') || '').trim();
  const audioUrl = sanitizeAudioUrl(searchParams.get('audioUrl') || '');

  try {
    if (audioUrl && (await isReachable(audioUrl))) {
      return redirect(audioUrl);
    }

    if (Number.isFinite(number) && number > 0) {
      const emergencyUrl = buildEmergencyTrackUrl(number, title);
      if (emergencyUrl) return redirect(emergencyUrl);
    }

    return jsonError('Audio not found', 404);
  } catch (error) {
    console.error('[hino-audio-fallback]', error);
    return jsonError('Internal Server Error', 500);
  }
};

function sanitizeAudioUrl(rawValue: string): string {
  const value = rawValue.trim();
  if (!value) return '';
  try {
    return new URL(value, SITE_BASE_URL).toString();
  } catch {
    return '';
  }
}

function buildEmergencyTrackUrl(number: number, title: string): string {
  const segment = getEmergencyArchiveZipSegmentByNumber(number);
  if (!segment) return '';

  const url = new URL('/api/media-stream', SITE_BASE_URL);
  url.searchParams.set('segment', segment.id);
  url.searchParams.set('number', String(number));
  if (title) url.searchParams.set('title', title);
  return `${url.pathname}${url.search}`;
}

async function isReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function redirect(location: string): Response {
  return new Response(null, {
    status: 307,
    headers: {
      Location: location,
      'Cache-Control': CACHE_CONTROL,
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function jsonError(message: string, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}
