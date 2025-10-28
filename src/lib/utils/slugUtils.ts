/**
 * Utilitários para geração e validação de slugs SEO-friendly
 */

const SITE_URL = 'https://canticosccb.com.br';

/**
 * Gera um slug a partir de um texto
 * Remove acentos, converte para minúsculas, substitui espaços por hífens
 */
export const generateSlug = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD') // Normaliza acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove marcas diacríticas
    .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, '') // Remove hífens do início e fim
    .substring(0, 100); // Limita tamanho
};

/**
 * Valida se um slug é válido
 */
export const isValidSlug = (slug: string): boolean => {
  if (!slug) return false;
  if (slug.length > 100) return false;
  if (slug.startsWith('-') || slug.endsWith('-')) return false;
  return /^[a-z0-9-]+$/.test(slug);
};

/**
 * Gera URL canônica para um hino/música
 */
export const generateSongCanonicalUrl = (slug: string, categorySlug: string = 'hinos-avulsos'): string => {
  return `${SITE_URL}/${categorySlug}/${slug}`;
};

/**
 * Gera URL canônica para um álbum
 */
export const generateAlbumCanonicalUrl = (slug: string): string => {
  return `${SITE_URL}/albuns/${slug}`;
};

/**
 * Gera URL canônica para uma faixa de álbum
 */
export const generateAlbumTrackCanonicalUrl = (albumSlug: string, trackSlug: string): string => {
  return `${SITE_URL}/albuns/${albumSlug}/${trackSlug}`;
};

/**
 * Gera URL canônica para um compositor
 */
export const generateComposerCanonicalUrl = (slug: string): string => {
  return `${SITE_URL}/compositores/${slug}`;
};

/**
 * Gera URL canônica para uma playlist
 */
export const generatePlaylistCanonicalUrl = (slug: string): string => {
  return `${SITE_URL}/playlists/${slug}`;
};

/**
 * Gera URL canônica para uma coleção
 */
export const generateCollectionCanonicalUrl = (slug: string): string => {
  return `${SITE_URL}/colecoes/${slug}`;
};

/**
 * Gera URL canônica para uma categoria
 */
export const generateCategoryCanonicalUrl = (slug: string): string => {
  return `${SITE_URL}/categorias/${slug}`;
};

/**
 * Gera URL canônica para uma tag
 */
export const generateTagCanonicalUrl = (slug: string): string => {
  return `${SITE_URL}/tags/${slug}`;
};

/**
 * Extrai o slug de uma URL completa
 */
export const extractSlugFromUrl = (url: string): string => {
  const parts = url.replace(SITE_URL, '').split('/').filter(Boolean);
  return parts[parts.length - 1];
};

/**
 * Sugestões de slug com base no título
 * Retorna variações caso o slug principal já exista
 */
export const suggestSlugs = (title: string, count: number = 3): string[] => {
  const baseSlug = generateSlug(title);
  const suggestions: string[] = [baseSlug];
  
  for (let i = 2; i <= count; i++) {
    suggestions.push(`${baseSlug}-${i}`);
  }
  
  return suggestions;
};

/**
 * Formata um slug para exibição (primeira letra maiúscula, hífens por espaços)
 */
export const formatSlugForDisplay = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Gera breadcrumbs a partir de uma URL
 */
export interface Breadcrumb {
  label: string;
  url: string;
}

export const generateBreadcrumbs = (canonicalUrl: string): Breadcrumb[] => {
  const parts = canonicalUrl.replace(SITE_URL, '').split('/').filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Home', url: SITE_URL }
  ];
  
  let currentPath = SITE_URL;
  
  parts.forEach((part, index) => {
    currentPath += '/' + part;
    
    const isLast = index === parts.length - 1;
    const label = formatSlugForDisplay(part);
    
    breadcrumbs.push({
      label: isLast ? label : formatCategoryLabel(part),
      url: currentPath
    });
  });
  
  return breadcrumbs;
};

/**
 * Formata labels de categorias conhecidas
 */
const formatCategoryLabel = (slug: string): string => {
  const knownCategories: Record<string, string> = {
    'hinos-avulsos': 'Hinos Avulsos',
    'albuns': 'Álbuns',
    'compositores': 'Compositores',
    'playlists': 'Playlists',
    'colecoes': 'Coleções',
    'categorias': 'Categorias',
    'tags': 'Tags'
  };
  
  return knownCategories[slug] || formatSlugForDisplay(slug);
};

/**
 * Valida se uma URL é canônica (completa e válida)
 */
export const isCanonicalUrl = (url: string): boolean => {
  if (!url) return false;
  if (!url.startsWith('https://')) return false;
  if (!url.includes(SITE_URL)) return false;
  return true;
};

/**
 * Normaliza uma URL para o formato canônico
 */
export const normalizeUrl = (url: string): string => {
  // Remove trailing slash
  url = url.replace(/\/+$/, '');
  
  // Garante HTTPS
  url = url.replace(/^http:/, 'https:');
  
  // Remove query strings se necessário (opcional)
  // url = url.split('?')[0];
  
  return url;
};

/**
 * Gera URL de compartilhamento para redes sociais
 */
export const generateShareUrl = (canonicalUrl: string, platform: 'facebook' | 'twitter' | 'whatsapp' | 'telegram'): string => {
  const encodedUrl = encodeURIComponent(canonicalUrl);
  
  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}`
  };
  
  return shareUrls[platform];
};

/**
 * Gera Schema.org BreadcrumbList JSON-LD
 */
export const generateBreadcrumbSchema = (breadcrumbs: Breadcrumb[]): string => {
  const itemListElement = breadcrumbs.map((crumb, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": crumb.label,
    "item": crumb.url
  }));
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": itemListElement
  };
  
  return JSON.stringify(schema);
};
