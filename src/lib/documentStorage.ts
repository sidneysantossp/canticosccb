import { getSupabaseStorageUrl } from './supabaseRest';

const normalizePath = (path: string): string => path.replace(/\\/g, '/').replace(/^\/+/, '');

export function getDocumentStorageUrl(imagePath: string): string {
  if (!imagePath) return '';
  // Base64 data URI — retornar diretamente
  if (imagePath.startsWith('data:')) return imagePath;
  // URL completa — retornar diretamente
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  // Path no Storage — construir URL autenticada (bucket privado)
  const sanitized = normalizePath(imagePath);
  const segments = sanitized.split('/');
  const fileName = segments.pop() || sanitized;
  if (!fileName) return '';

  // Tentar URL pública primeiro (funciona se bucket for público)
  return getSupabaseStorageUrl('documents', fileName);
}

/**
 * Gera URL assinada para documentos em bucket privado.
 * Usar quando getDocumentStorageUrl retorna erro 400/403.
 */
export async function getDocumentSignedUrl(imagePath: string): Promise<string> {
  if (!imagePath) return '';
  if (imagePath.startsWith('data:')) return imagePath;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  try {
    const { supabase } = await import('./supabase-auth');
    const sanitized = normalizePath(imagePath);
    const segments = sanitized.split('/');
    const fileName = segments.pop() || sanitized;

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(fileName, 3600); // 1 hora

    if (error || !data?.signedUrl) {
      console.warn('[getDocumentSignedUrl] Failed:', error?.message);
      return getDocumentStorageUrl(imagePath);
    }
    return data.signedUrl;
  } catch (e) {
    console.warn('[getDocumentSignedUrl] Error:', e);
    return getDocumentStorageUrl(imagePath);
  }
}
