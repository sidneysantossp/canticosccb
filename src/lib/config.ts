/**
 * Configurações da Aplicação
 * Centralize todas as URLs e configurações aqui
 */

const SUPABASE_URL = (import.meta.env?.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');
const SUPABASE_STORAGE_URL = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public` : '';


export function getHinoUrl(filename: string): string {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  return `${SUPABASE_STORAGE_URL}/hinos/${encodeURIComponent(filename)}`;
}

export function getAlbumCoverUrl(filename: string): string {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  return `${SUPABASE_STORAGE_URL}/covers/${encodeURIComponent(filename)}`;
}

export function getAvatarUrl(filename: string): string {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  return `${SUPABASE_STORAGE_URL}/avatars/${encodeURIComponent(filename)}`;
}

export function getBannerUrl(filename: string): string {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  return `${SUPABASE_STORAGE_URL}/banners/${encodeURIComponent(filename)}`;
}

/**
 * Gera URL de fallback para quando mídia não existe
 */
export function getPlaceholderUrl(type: 'hino' | 'album' | 'avatar'): string {
  const placeholders = {
    hino: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Hino',
    album: 'https://via.placeholder.com/300x300/1db954/ffffff?text=Álbum',
    avatar: 'https://ui-avatars.com/api/?name=Usuario&background=1db954&color=fff',
  };
  return placeholders[type];
}

export const APP_CONFIG = {
  name: 'Cânticos CCB',
  description: 'Plataforma de Hinos da Congregação Cristã no Brasil',
  url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  mediaUrl: SUPABASE_STORAGE_URL,
} as const;

// Feature Flags
export const FEATURES = {
  enablePremium: import.meta.env.VITE_ENABLE_PREMIUM === 'true',
  enableSocial: import.meta.env.VITE_ENABLE_SOCIAL === 'true',
  enableOffline: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
} as const;
