/**
 * Configurações da Aplicação
 * Centralize todas as URLs e configurações aqui
 */

import { DEFAULT_SITE_URL, normalizeMediaBaseUrl, normalizeSiteUrl } from '@/utils/siteUrl';

const SUPABASE_URL = (import.meta.env?.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');
const SUPABASE_STORAGE_URL = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public` : '';
const MEDIA_PUBLIC_BASE_URL = normalizeMediaBaseUrl(
  import.meta.env?.VITE_MEDIA_PUBLIC_BASE_URL ?? '',
  SUPABASE_STORAGE_URL ? `${SUPABASE_STORAGE_URL}/images` : ''
);
const APP_BASE_URL = normalizeSiteUrl(
  import.meta.env?.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : DEFAULT_SITE_URL),
  DEFAULT_SITE_URL
);

export const DEFAULT_COVER_IDENTIFIER = '1771984574638_y6tw06';
export const DEFAULT_COVER_URL =
  normalizeMediaBaseUrl(import.meta.env?.VITE_DEFAULT_COVER_URL ?? '') ||
  `${MEDIA_PUBLIC_BASE_URL}/covers/${DEFAULT_COVER_IDENTIFIER}.png`;

function basename(value: string): string {
  return String(value || '').split('/').filter(Boolean).pop() || '';
}

function mapStorageObjectToMediaPath(bucket: string, path: string): string {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  if (!bucket || !cleanPath) return '';

  switch (bucket) {
    case 'images':
      return cleanPath;
    case 'banners':
      return cleanPath.startsWith('banners/') ? cleanPath : `banners/${cleanPath}`;
    case 'avatars':
    case 'user-avatars':
    case 'composer-avatars':
      return `avatars/${basename(cleanPath)}`;
    case 'covers':
      return `covers/${basename(cleanPath)}`;
    case 'logos':
      return `logos/${basename(cleanPath)}`;
    case 'documents':
      return `documents/${basename(cleanPath)}`;
    case 'songs':
      return `songs/${basename(cleanPath)}`;
    case 'media':
      return `media/${basename(cleanPath)}`;
    case 'copyright-attachments':
      return `copyright-attachments/${basename(cleanPath)}`;
    default:
      return '';
  }
}


export function getHinoUrl(filename: string): string {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  if (!MEDIA_PUBLIC_BASE_URL) return '';
  return `${MEDIA_PUBLIC_BASE_URL}/hinos/${encodeURIComponent(filename)}`;
}

export function getAlbumCoverUrl(filename: string): string {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  if (!MEDIA_PUBLIC_BASE_URL) return '';
  return `${MEDIA_PUBLIC_BASE_URL}/covers/${encodeURIComponent(filename)}`;
}

export function getAvatarUrl(filename: string): string {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  if (!MEDIA_PUBLIC_BASE_URL) return '';
  return `${MEDIA_PUBLIC_BASE_URL}/avatars/${encodeURIComponent(filename)}`;
}

export function getBannerUrl(filename: string): string {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  if (!MEDIA_PUBLIC_BASE_URL) return '';
  return `${MEDIA_PUBLIC_BASE_URL}/banners/${encodeURIComponent(filename)}`;
}

export function getStorageObjectUrl(bucket: string, path: string): string {
  if (!bucket || !path) return '';
  if (path.startsWith('http')) return path;
  const mediaPath = mapStorageObjectToMediaPath(bucket, path);
  if (MEDIA_PUBLIC_BASE_URL && mediaPath) {
    return `${MEDIA_PUBLIC_BASE_URL}/${mediaPath}`;
  }
  if (!SUPABASE_URL) return '';
  const cleanPath = String(path).replace(/^\/+/, '');
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;
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
  description: 'Plataforma de Hinos da comunidade CCB',
  url: APP_BASE_URL,
  mediaUrl: MEDIA_PUBLIC_BASE_URL,
} as const;

// Feature Flags
export const FEATURES = {
  enableSocial: import.meta.env.VITE_ENABLE_SOCIAL === 'true',
  enableOffline: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
} as const;
