import { getEmergencyArchiveZipSegmentByNumber } from './_emergencyAudioArchives.js';

type VercelRequest = {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
  json: (body: unknown) => void;
};

function getQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] || '').trim();
  return String(value || '').trim();
}

function sanitizeAudioUrl(rawValue: string): string {
  const value = String(rawValue || '').trim();
  if (!value) return '';

  try {
    const parsed = new URL(value, 'https://www.canticosccb.com.br');
    return parsed.toString();
  } catch {
    return '';
  }
}

function buildEmergencyTrackUrl(number: number, title: string): string {
  const segment = getEmergencyArchiveZipSegmentByNumber(number);
  if (!segment) return '';

  const url = new URL('/api/emergency-audio-track', 'https://www.canticosccb.com.br');
  url.searchParams.set('segment', segment.id);
  url.searchParams.set('number', String(number));
  if (title) {
    url.searchParams.set('title', title);
  }
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method && !['GET', 'HEAD'].includes(req.method.toUpperCase())) {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const number = Number(getQueryValue(req.query?.number));
  const title = getQueryValue(req.query?.title);
  const audioUrl = sanitizeAudioUrl(getQueryValue(req.query?.audioUrl));

  try {
    if (audioUrl && await isReachable(audioUrl)) {
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
      res.setHeader('Location', audioUrl);
      return res.status(307).end();
    }

    if (Number.isFinite(number) && number > 0) {
      const emergencyUrl = buildEmergencyTrackUrl(number, title);
      if (emergencyUrl) {
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
        res.setHeader('Location', emergencyUrl);
        return res.status(307).end();
      }
    }

    return res.status(404).json({ error: 'Audio not found' });
  } catch (error) {
    console.error('[hino-audio-fallback]', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
