import { getSupabaseStorageUrl } from './supabaseRest';

const normalizePath = (path: string): string => path.replace(/\\/g, '/').replace(/^\/+/, '');

export function getDocumentStorageUrl(imagePath: string): string {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  const sanitized = normalizePath(imagePath);
  const segments = sanitized.split('/');
  const fileName = segments.pop() || sanitized;
  if (!fileName) return '';

  return getSupabaseStorageUrl('documents', fileName);
}
