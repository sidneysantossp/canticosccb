/**
 * Helper para trabalhar com URLs de mídia da VPS
 */

import { getHinoUrl, getAlbumCoverUrl, getAvatarUrl, getPlaceholderUrl, getBannerUrl } from './config';

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
  
  // Se já é uma URL completa (http/https), retornar diretamente
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  
  // Se começa com /, é um caminho relativo
  if (raw.startsWith('/')) {
    return raw;
  }
  
  // Caso contrário, é um nome de arquivo - construir URL do Supabase
  const filename = raw.split('/').pop() || raw;
  return getBannerUrl(filename);
}

/**
 * Gera URL de hino a partir de ID ou objeto
 */
export function buildHinoUrl(hino: { id: string; audio_url?: string } | string): string {
  if (typeof hino === 'string') {
    const hasExt = /\.[a-z0-9]+$/i.test(hino);
    const filename = hasExt ? hino : `${hino}.mp3`;
    return getHinoUrl(filename);
  }
  
  if (hino.audio_url) {
    if (hino.audio_url.startsWith('http')) return hino.audio_url;
    const filename = hino.audio_url.split('/').pop() || hino.audio_url;
    return getHinoUrl(filename);
  }
  
  let filename = hino.id;
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
    if (raw.startsWith('http')) return raw;
    const filename = raw.split('/').pop() || raw;
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
