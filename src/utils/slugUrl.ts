/**
 * Utilitários para gerar URLs SEO-friendly com slug + UUID embutido.
 *
 * Formato: /hino/hino-13-ccb-confiemos-em-deus-7c1db2a1-99a9-4f22-b92a-d8b76590b096
 *
 * O UUID (padrão 8-4-4-4-12 hex) é preservado no final da URL para lookup confiável.
 * A parte slug antes do UUID é puramente cosmética/SEO.
 */

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Gera um slug URL-friendly a partir de um texto.
 */
export function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove acentos
    .replace(/[^\w\s-]/g, '')          // remove caracteres especiais
    .replace(/\s+/g, '-')             // espaços → hífens
    .replace(/-+/g, '-')              // hífens duplicados
    .replace(/^-|-$/g, '')            // trim hífens
    .substring(0, 80);                // limita tamanho
}

function normalizeHymnTitleForSlug(titulo: string, numero?: number): string {
  let normalized = titulo.trim();
  if (numero != null) {
    const escapedNumber = String(numero).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const leadingPattern = new RegExp(`^hino\\s*${escapedNumber}(?:\\s*ccb)?\\s*[-:–]?\\s*`, 'i');
    normalized = normalized.replace(leadingPattern, '').trim();
  }
  return normalized || titulo;
}

/**
 * Extrai o UUID de um parâmetro de rota que pode ser:
 * - UUID puro: "7c1db2a1-99a9-4f22-b92a-d8b76590b096"
 * - Slug + UUID: "hino-13-confiemos-em-deus-7c1db2a1-99a9-4f22-b92a-d8b76590b096"
 *
 * Retorna o UUID encontrado, ou o param original como fallback.
 */
export function extractUUID(param: string): string {
  if (!param) return param;
  const match = param.match(UUID_REGEX);
  return match ? match[0] : param;
}

/**
 * Gera URL para página de hino.
 * Ex: /hino/hino-13-confiemos-em-deus-7c1db2a1-99a9-4f22-b92a-d8b76590b096
 */
export function buildHinoUrl(id: string, titulo?: string, numero?: number): string {
  if (!titulo) return `/hino/${id}`;
  const parts: string[] = [];
  parts.push('hino');
  if (numero != null) parts.push(String(numero));
  parts.push('ccb');
  parts.push(slugifyText(normalizeHymnTitleForSlug(titulo, numero)));
  const slug = parts.join('-');
  return `/hino/${slug}-${id}`;
}

/**
 * Gera URL para página de álbum.
 * Ex: /album/hinario-5-ana-marques-76fb71d7-c95e-4c6c-9628-accd55c27581
 */
export function buildAlbumUrl(id: string, titulo?: string, artista?: string): string {
  if (!titulo) return `/album/${id}`;
  const parts = [slugifyText(titulo)];
  if (artista) parts.push(slugifyText(artista));
  const slug = parts.join('-');
  return `/album/${slug}-${id}`;
}

/**
 * Gera URL para página de compositor.
 * Ex: /compositor/ana-marques-l-souza-abc12345-1234-5678-9abc-def012345678
 */
export function buildCompositorUrl(id: string, nome?: string): string {
  if (!nome) return `/compositor/${id}`;
  return `/compositor/${slugifyText(nome)}-${id}`;
}
