/**
 * Configurações da Aplicação
 * Centralize todas as URLs e configurações aqui
 */

// @ts-ignore
const MEDIA_BASE_URL = import.meta.env?.VITE_MEDIA_BASE_URL || 'https://canticosccb.com.br/media';
// @ts-ignore
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.0.')
);
// @ts-ignore
const IS_DEV = !!(import.meta?.env?.DEV);

// Usar o hostname atual para permitir acesso via IP local (celular)
// IMPORTANTE: Apache roda na porta 80 (padrão), não na porta do Vite (5173)
// Por isso não incluímos a porta na URL da API
const localApiBase = typeof window !== 'undefined' 
  ? `http://${window.location.hostname}/1canticosccb/api`
  : 'http://localhost/1canticosccb/api';

const API_BASE_URL = isLocalhost 
  ? localApiBase
  : (import.meta.env?.VITE_API_BASE_URL || 'https://canticosccb.com.br/api');

/**
 * Gera URL de API usando o hostname atual (para funcionar em rede local)
 */
export function getApiUrl(path: string): string {
  // Remove barra inicial se houver
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  if (isLocalhost) {
    return `${localApiBase}/${cleanPath}`;
  }
  
  return `${API_BASE_URL}/${cleanPath}`;
}

// Usar API de streaming seguro ao invés de acesso direto
const USE_STREAMING_API = true;

/**
 * Gera URL completa para hino
 */
export function getHinoUrl(filename: string): string {
  if (USE_STREAMING_API) {
    // Em desenvolvimento, usar URL ABSOLUTA para bypass do Vite proxy (Safari mobile + Range)
    if (IS_DEV) {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      return `http://${host}/1canticosccb/api/stream.php?type=hinos&file=${encodeURIComponent(filename)}`;
    }
    const url = `${API_BASE_URL}/stream.php?type=hinos&file=${encodeURIComponent(filename)}`;
    console.log('🎵 getHinoUrl:', { 
      filename, 
      url, 
      API_BASE_URL,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
      isLocalhost
    });
    return url;
  }
  return `${MEDIA_BASE_URL}/hinos/${filename}`;
}

/**
 * Gera URL completa para capa de álbum
 */
export function getAlbumCoverUrl(filename: string): string {
  if (USE_STREAMING_API) {
    if (IS_DEV) {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      return `http://${host}/1canticosccb/api/stream.php?type=albuns&file=${encodeURIComponent(filename)}`;
    }
    return `${API_BASE_URL}/stream.php?type=albuns&file=${encodeURIComponent(filename)}`;
  }
  return `${MEDIA_BASE_URL}/albuns/${filename}`;
}

/**
 * Gera URL completa para avatar de usuário
 */
export function getAvatarUrl(filename: string): string {
  if (USE_STREAMING_API) {
    if (IS_DEV) {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      return `http://${host}/1canticosccb/api/stream.php?type=avatars&file=${encodeURIComponent(filename)}`;
    }
    return `${API_BASE_URL}/stream.php?type=avatars&file=${encodeURIComponent(filename)}`;
  }
  return `${MEDIA_BASE_URL}/avatars/${filename}`;
}

/**
 * Gera URL completa para banner (imagem/vídeo)
 */
export function getBannerUrl(filename: string): string {
  if (USE_STREAMING_API) {
    if (IS_DEV) {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      return `http://${host}/1canticosccb/api/stream.php?type=banners&file=${encodeURIComponent(filename)}`;
    }
    return `${API_BASE_URL}/stream.php?type=banners&file=${encodeURIComponent(filename)}`;
  }
  return `${MEDIA_BASE_URL}/banners/${filename}`;
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

// Configurações da aplicação
export const APP_CONFIG = {
  name: 'Cânticos CCB',
  description: 'Plataforma de Hinos da Congregação Cristã no Brasil',
  url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  mediaUrl: MEDIA_BASE_URL,
} as const;

// Feature Flags
export const FEATURES = {
  enablePremium: import.meta.env.VITE_ENABLE_PREMIUM === 'true',
  enableSocial: import.meta.env.VITE_ENABLE_SOCIAL === 'true',
  enableOffline: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
} as const;
