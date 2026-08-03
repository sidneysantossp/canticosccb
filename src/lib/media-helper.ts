/**
 * Helper para trabalhar com URLs de mídia da VPS
 */

import {
  getHinoUrl,
  getAlbumCoverUrl,
  getAvatarUrl,
  getPlaceholderUrl,
  getBannerUrl,
  getStorageObjectUrl,
} from './config';

function extractSupabasePublicObject(raw: string): { bucket: string; objectPath: string } | null {
  const value = String(raw || '').trim();
  if (!value) return null;

  try {
    const parsed = value.startsWith('http://') || value.startsWith('https://')
      ? new URL(value)
      : value.startsWith('/')
        ? new URL(value, 'https://www.canticosccb.com.br')
        : null;

    const pathname = parsed?.pathname || value;
    const marker = '/storage/v1/object/public/';

    if (!pathname.startsWith(marker)) {
      return null;
    }

    const remainder = pathname.slice(marker.length);
    const [bucket, ...rest] = remainder.split('/').filter(Boolean);
    const objectPath = rest.join('/');

    if (!bucket || !objectPath) {
      return null;
    }

    return { bucket, objectPath };
  } catch {
    return null;
  }
}

/**
 * Formata nome de arquivo para URL
 * Remove caracteres especiais e espaços
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9.-]/g, '-') // Substitui caracteres especiais por -
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens no início/fim
}

/**
 * Gera URL de banner (imagem/vídeo) sempre via stream protegido
 */
export function buildBannerUrl(banner: { image_url?: string } | string): string {
  const raw = typeof banner === 'string' ? banner : (banner?.image_url || '');
  if (!raw) return '';

  const storageObject = extractSupabasePublicObject(raw);
  if (storageObject?.bucket === 'banners') {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }

    return getStorageObjectUrl('banners', storageObject.objectPath);
  }

  // Se já é uma URL completa (http/https), retornar diretamente
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  // Se começa com /, é um caminho relativo
  if (raw.startsWith('/')) {
    if (raw.startsWith('/storage/v1/object/public/banners/')) {
      const cleanPath = raw.replace('/storage/v1/object/public/banners/', '').replace(/^\/+/, '');
      return getStorageObjectUrl('banners', cleanPath);
    }
    return raw;
  }

  const cleanPath = raw.replace(/^\/+/, '');
  if (cleanPath.startsWith('banners/')) {
    return getStorageObjectUrl('banners', cleanPath);
  }

  // Caso contrário, é um nome de arquivo - construir URL padrão
  const filename = cleanPath.split('/').pop() || cleanPath;
  return getStorageObjectUrl('banners', filename) || getBannerUrl(filename);
}

/**
 * Gera URL de hino a partir de ID ou objeto
 */
export function buildHinoUrl(hino: { id: string; audio_url?: string } | string): string {
  const raw = typeof hino === 'string' ? String(hino || '').trim() : String(hino.audio_url || '').trim();

  if (raw) {
    const storageObject = extractSupabasePublicObject(raw);
    if (storageObject?.bucket === 'images') {
      const cleanObjectPath = storageObject.objectPath.replace(/^\/+/, '');
      if (cleanObjectPath.startsWith('hinos/')) {
        return getStorageObjectUrl('images', cleanObjectPath);
      }

      const legacyFilename = cleanObjectPath.split('/').pop()?.split('?')[0] || '';
      if (legacyFilename) {
        return getHinoUrl(legacyFilename);
      }
    }

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }

    const cleanRaw = raw
      .replace(/^\/+/, '')
      .replace(/^storage\/v1\/object\/public\/images\//, '')
      .replace(/^images\//, '');

    if (cleanRaw.startsWith('hinos/')) {
      return getStorageObjectUrl('images', cleanRaw);
    }

    const filenameFromRaw = cleanRaw.split('/').pop()?.split('?')[0] || '';
    if (filenameFromRaw) {
      return getHinoUrl(filenameFromRaw);
    }
  }

  let filename = typeof hino === 'string' ? String(hino || '').trim() : String(hino.id || '').trim();
  if (filename && !/\.[a-z0-9]+$/i.test(filename)) {
    filename = `${filename}.mp3`;
  }

  return getHinoUrl(filename);
}

/**
 * Gera URL de capa de álbum com fallback
 */
export function buildAlbumCoverUrl(album: { id: string; cover_url?: string } | string, withFallback = true): string {
  if (typeof album === 'string') {
    return getAlbumCoverUrl(album);
  }
  
  const raw = album.cover_url || '';
  if (raw) {
    const storageObject = extractSupabasePublicObject(raw);
    if (storageObject) {
      return getStorageObjectUrl(storageObject.bucket, storageObject.objectPath);
    }

    if (raw.startsWith('http')) return raw;

    const cleanRaw = raw
      .replace(/^\/+/, '')
      .replace(/^storage\/v1\/object\/public\/images\//, '')
      .replace(/^storage\/v1\/object\/public\/covers\//, '')
      .replace(/^images\//, '')
      .replace(/^covers\//, '');

    if (cleanRaw.startsWith('covers/') || cleanRaw.startsWith('hinos/')) {
      return getStorageObjectUrl('images', cleanRaw);
    }

    const filename = cleanRaw.split('/').pop() || cleanRaw;
    return getAlbumCoverUrl(filename);
  }

  return getAlbumCoverUrl(album.id);
}

/**
 * Gera URL de avatar com fallback
 */
export function buildAvatarUrl(user: { id: string; avatar_url?: string; name?: string } | string): string {
  if (typeof user === 'string') {
    return getAvatarUrl(user);
  }
  
  const raw = user.avatar_url || '';
  if (raw) {
    const storageObject = extractSupabasePublicObject(raw);
    if (storageObject) {
      return getStorageObjectUrl(storageObject.bucket, storageObject.objectPath);
    }

    if (raw.startsWith('http')) return raw;
    const filename = raw.split('/').pop()?.split('?')[0] || raw;
    return getAvatarUrl(filename);
  }

  if (user.name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1db954&color=fff&size=200`;
  }
  
  return getAvatarUrl(user.id);
}

/**
 * Verifica se URL de mídia é válida
 */
export async function checkMediaUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Retorna URL com fallback se a original falhar
 */
export async function getUrlWithFallback(url: string, fallbackUrl: string): Promise<string> {
  const isValid = await checkMediaUrl(url);
  return isValid ? url : fallbackUrl;
}

/**
 * Carrega imagem com fallback
 */
export function loadImageWithFallback(
  url: string,
  fallbackUrl: string,
  onLoad: (finalUrl: string) => void
): void {
  const img = new Image();
  
  img.onload = () => onLoad(url);
  img.onerror = () => {
    // Tenta fallback
    const fallbackImg = new Image();
    fallbackImg.onload = () => onLoad(fallbackUrl);
    fallbackImg.onerror = () => onLoad(getPlaceholderUrl('album'));
    fallbackImg.src = fallbackUrl;
  };
  
  img.src = url;
}

/**
 * Converte duração em segundos para formato MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Converte tamanho de arquivo para formato legível
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Extrai extensão de arquivo
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Verifica se é arquivo de áudio suportado
 */
export function isAudioFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(ext);
}

/**
 * Verifica se é arquivo de vídeo suportado
 */
export function isVideoFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['mp4', 'webm', 'ogg'].includes(ext);
}
