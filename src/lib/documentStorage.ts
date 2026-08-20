import { supabaseGetSignedUrl } from './supabaseRest';

const normalizePath = (path: string): string => path.replace(/\\/g, '/').replace(/^\/+/, '');

/**
 * Documentos de verificação não possuem URL pública. A função é mantida apenas
 * para compatibilidade com chamadas antigas e sempre devolve uma string vazia.
 */
export function getDocumentStorageUrl(_imagePath: string): string {
  return '';
}

/**
 * Gera uma URL assinada, curta e condicionada às políticas RLS do bucket
 * privado `documents`. O caminho precisa manter o formato
 * `composer/<composer_id>/<arquivo>` para que a política de Storage valide o
 * proprietário ou administrador.
 */
export async function getDocumentSignedUrl(imagePath: string, expiresInSeconds = 300): Promise<string> {
  if (!imagePath) return '';

  // Valores antigos em Base64 ou URLs completas não devem mais ser renderizados
  // como documento de identidade. Eles precisam ser migrados para o bucket
  // privado antes de voltar a ficar disponíveis.
  if (imagePath.startsWith('data:') || /^https?:\/\//i.test(imagePath)) {
    console.warn('[documents] Caminho legado inseguro bloqueado; migre o documento para o bucket privado.');
    return '';
  }

  const sanitized = normalizePath(imagePath);
  if (!sanitized.startsWith('composer/') || sanitized.split('/').length < 3) {
    console.warn('[documents] Caminho de documento inválido para URL assinada.');
    return '';
  }

  try {
    const signedUrl = await supabaseGetSignedUrl('documents', sanitized, expiresInSeconds);
    if (!signedUrl) {
      console.warn('[documents] Não foi possível gerar URL assinada para o caminho:', sanitized);
      return '';
    }
    return signedUrl;
  } catch (error) {
    console.warn('[documents] Erro ao gerar URL assinada:', error);
    return '';
  }
}
