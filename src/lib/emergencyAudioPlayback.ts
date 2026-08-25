const MEDIA_STREAM_PATH = '/api/media-stream';
const LEGACY_MEDIA_STREAM_PATH = '/api/emergency-audio-track';

function normalizeMediaStreamUrl(routeUrl: string): URL | null {
  try {
    const baseOrigin = typeof window !== 'undefined'
      ? window.location.origin
      : 'https://www.canticosccb.com.br';
    const baseUrl = new URL(baseOrigin);
    const parsed = new URL(routeUrl, baseOrigin);

    if (![MEDIA_STREAM_PATH, LEGACY_MEDIA_STREAM_PATH].includes(parsed.pathname)) {
      return null;
    }

    parsed.pathname = MEDIA_STREAM_PATH;
    parsed.host = baseUrl.host;
    parsed.protocol = baseUrl.protocol;
    return parsed;
  } catch {
    return null;
  }
}

export function isEmergencyArchiveRouteUrl(routeUrl?: string | null): boolean {
  return Boolean(normalizeMediaStreamUrl(String(routeUrl || '').trim()));
}

export function getCachedEmergencyPlaybackUrl(routeUrl: string): string | null {
  return normalizeMediaStreamUrl(routeUrl)?.toString() || null;
}

export async function resolveEmergencyPlaybackUrl(routeUrl: string): Promise<string> {
  return normalizeMediaStreamUrl(routeUrl)?.toString() || routeUrl;
}

export async function prewarmEmergencyPlaybackUrl(routeUrl?: string | null): Promise<string | null> {
  return normalizeMediaStreamUrl(String(routeUrl || '').trim())?.toString() || null;
}
