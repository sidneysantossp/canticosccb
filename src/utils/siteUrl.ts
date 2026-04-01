export const DEFAULT_SITE_URL = 'https://www.canticosccb.com.br';

const LEGACY_HOST = 'canticosccb.com.br';
const CANONICAL_HOST = 'www.canticosccb.com.br';
const MEDIA_HOST = 'media.canticosccb.com.br';
const DEFAULT_MEDIA_BASE_URL = `https://${MEDIA_HOST}`;

const normalizeSupabaseStorageAsset = (url: URL): string | null => {
  const storagePrefix = '/storage/v1/object/public/';
  const pathname = url.pathname || '';

  if (!pathname.startsWith(storagePrefix)) {
    return null;
  }

  const assetPath = pathname.slice(storagePrefix.length);
  const [bucket, ...rest] = assetPath.split('/');
  const relativePath = rest.join('/');

  if (!bucket || !relativePath) {
    return null;
  }

  if (bucket === 'images') {
    return `${DEFAULT_MEDIA_BASE_URL}/${relativePath}`.replace(/([^:]\/)\/+/g, '$1');
  }

  if (bucket === 'logos') {
    if (/favicon/i.test(relativePath)) {
      return `${DEFAULT_SITE_URL}/icons/favicon.svg`;
    }

    return `${DEFAULT_SITE_URL}/logo-canticos-ccb.png`;
  }

  return null;
};

export const normalizeMediaBaseUrl = (value?: string, fallback = ''): string => {
  const raw = String(value ?? '').trim() || fallback;
  if (!raw) return '';

  try {
    const normalizedInput = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(normalizedInput);
    const isSupabaseHost = url.hostname.endsWith('.supabase.co');

    if (!isSupabaseHost && url.pathname.replace(/\/+$/, '') === '/images') {
      url.pathname = '';
    }

    return url.toString().replace(/\/+$/, '');
  } catch {
    return fallback;
  }
};

export const normalizeSiteUrl = (value?: string, fallback = DEFAULT_SITE_URL): string => {
  const raw = String(value ?? '').trim() || fallback;

  try {
    const normalizedInput = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(normalizedInput);

    if (url.hostname === MEDIA_HOST) {
      return fallback;
    }

    if (url.hostname === LEGACY_HOST) {
      url.hostname = CANONICAL_HOST;
    }

    return url.toString().replace(/\/+$/, '');
  } catch {
    return fallback;
  }
};

export const normalizeAssetUrl = (value?: string): string => {
  const raw = String(value ?? '').trim();
  if (!raw || !/^https?:\/\//i.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const rewrittenStorageUrl = normalizeSupabaseStorageAsset(url);

    if (rewrittenStorageUrl) {
      return rewrittenStorageUrl;
    }

    if (url.hostname === LEGACY_HOST) {
      url.hostname = CANONICAL_HOST;
    }

    return url.toString();
  } catch {
    return raw;
  }
};
