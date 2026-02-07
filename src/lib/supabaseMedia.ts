import { isSupabaseConfigured, supabaseGetSignedUrl } from './supabaseRest';

const STORAGE_URL_REGEX = /storage\/v1\/object\/public\/([^\/]+)/i;

export async function getSignedSupabaseUrl(value: string, fallbackBucket = 'hinos'): Promise<string> {
  if (!value) return value;
  if (!isSupabaseConfigured) return value;

  if (/^https?:\/\/.+storage\/v1\/object\/public\//i.test(value)) {
    return value;
  }

  let bucket = fallbackBucket;
  let fileName = '';

  try {
    const parsed = new URL(value, window.location.origin);
    const typeParam = parsed.searchParams.get('type');
    const fileParam = parsed.searchParams.get('file');
    if (fileParam) {
      fileName = fileParam;
      if (typeParam) {
        bucket = typeParam;
      }
    } else {
      const segments = parsed.pathname.split('/').filter(Boolean);
      fileName = segments.pop() || '';
    }
  } catch {
    const sanitized = value.replace(/\\/g, '/').replace(/^\/+/, '');
    const segments = sanitized.split('/');
    fileName = segments.pop() || '';
    const match = sanitized.match(STORAGE_URL_REGEX);
    if (match) {
      bucket = match[1];
    }
  }

  if (!fileName) {
    return value;
  }

  try {
    const signed = await supabaseGetSignedUrl(bucket, fileName);
    return signed || value;
  } catch {
    return value;
  }
}
