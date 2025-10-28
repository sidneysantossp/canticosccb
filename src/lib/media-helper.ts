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

  // Caso 1: Já é URL http
  if (raw.startsWith('http')) {
    try {
      const u = new URL(raw);
      const host = typeof window !== 'undefined' ? window.location.hostname : u.hostname;
      // Se aponta para /media/banners/, reescrever para stream protegido no host atual
      if (/\/media\/banners\//i.test(u.pathname)) {
        const file = u.pathname.split('/').pop() || '';
        return `http://${host}/1canticosccb/api/stream.php?type=banners&file=${encodeURIComponent(file)}`;
      }
      // Se já é stream.php (qualquer host), manter como está
      if (u.pathname.endsWith('/api/stream.php') || /\/api\/stream\.php$/i.test(u.pathname)) {
        return raw;
      }
      return raw; // outros domínios (CDN externa) permanecem
    } catch {
      // Se falhar no parse, tentar tratar como filename
      return getBannerUrl(raw);
    }
  }

  // Caso 2: Caminho absoluto começando com '/'
  if (raw.startsWith('/')) {
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      // Se é caminho direto para /media/banners/
      if (/\/media\/banners\//i.test(raw)) {
        const file = raw.split('/').pop() || '';
        return `http://${host}/1canticosccb/api/stream.php?type=banners&file=${encodeURIComponent(file)}`;
      }
      // Se já é /api/stream.php
      if (/^\/api\/stream\.php/i.test(raw)) {
        const alreadyPrefixed = raw.startsWith('/1canticosccb/');
        const path = alreadyPrefixed ? raw : `/1canticosccb${raw}`;
        return `http://${host}${path}`;
      }
      // Último caso: tratar como filename
      const file = raw.split('/').pop() || raw;
      return `http://${host}/1canticosccb/api/stream.php?type=banners&file=${encodeURIComponent(file)}`;
    } catch {
      return getBannerUrl(raw);
    }
  }

  // Caso 3: apenas nome do arquivo
  return getBannerUrl(raw);
}

/**
 * Gera URL de hino a partir de ID ou objeto
 */
export function buildHinoUrl(hino: { id: string; audio_url?: string } | string): string {
  console.log('🔧 buildHinoUrl input:', hino);
  
  if (typeof hino === 'string') {
    const hasExt = /\.[a-z0-9]+$/i.test(hino);
    const filename = hasExt ? hino : `${hino}.mp3`;
    const url = getHinoUrl(filename);
    console.log('🔧 buildHinoUrl (string):', { input: hino, filename, url });
    return url;
  }
  
  // Se já tem URL customizada completa, tratar casos
  if (hino.audio_url) {
    if (hino.audio_url.startsWith('http')) {
      try {
        const u = new URL(hino.audio_url);
        const host = u.hostname;
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
          // Converter para URL da API de stream no host atual
          const fileFromParam = u.searchParams.get('file');
          const baseName = u.pathname.split('/').pop() || '';
          const file = fileFromParam || baseName;
          if (file) {
            const fixed = getHinoUrl(file);
            console.log('🔧 buildHinoUrl (regravado de localhost → atual):', { original: hino.audio_url, fixed });
            return fixed;
          }
        }
      } catch {}
      console.log('🔧 buildHinoUrl (URL http completa):', hino.audio_url);
      return hino.audio_url;
    }
    if (hino.audio_url.startsWith('/')) {
      // Em dev, transformar '/api/...' em URL absoluta direto no Apache
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
        const alreadyPrefixed = hino.audio_url.startsWith('/1canticosccb/');
        const path = alreadyPrefixed ? hino.audio_url : (hino.audio_url.startsWith('/api/') ? `/1canticosccb${hino.audio_url}` : hino.audio_url);
        const absolute = `http://${host}${path}`;
        console.log('🔧 buildHinoUrl (URL absoluta a partir de /):', absolute);
        return absolute;
      } catch {
        return hino.audio_url;
      }
    }
  }
  
  // Garantir extensão apenas quando não houver nenhuma
  let filename = hino.audio_url || hino.id;
  if (filename && !/\.[a-z0-9]+$/i.test(filename)) {
    filename = `${filename}.mp3`;
  }
  
  const url = getHinoUrl(filename);
  console.log('🔧 buildHinoUrl (object):', { id: hino.id, audio_url: hino.audio_url, filename, url });
  return url;
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
    // Caso 1: URL absoluta
    if (raw.startsWith('http')) {
      try {
        const u = new URL(raw);
        const host = u.hostname;
        const typeParam = u.searchParams.get('type');
        const looksCovers = /(^|\/)covers(\/|$)/i.test(u.pathname) || typeParam === 'covers';
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
          // Reescrever para host atual usando stream.php
          const byParam = u.searchParams.get('file');
          const baseName = u.pathname.split('/').pop() || '';
          const file = byParam || baseName;
          if (file) {
            if (looksCovers) {
              const h = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
              return `http://${h}/1canticosccb/api/stream.php?type=covers&file=${encodeURIComponent(file)}`;
            }
            return getAlbumCoverUrl(file);
          }
        }
      } catch {}
      return raw; // host já válido
    }

    // Caso 2: Caminho absoluto começando com '/'
    if (raw.startsWith('/')) {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const alreadyPrefixed = raw.startsWith('/1canticosccb/');
        const looksCovers = /(^|\/)covers(\/|$)/i.test(raw) || /type=covers/i.test(raw);
        if (looksCovers) {
          const file = raw.split('/').pop() || '';
          return `http://${host}/1canticosccb/api/stream.php?type=covers&file=${encodeURIComponent(file)}`;
        }
        const path = alreadyPrefixed ? raw : (raw.startsWith('/api/') ? `/1canticosccb${raw}` : raw);
        return `http://${host}${path}`;
      } catch {
        return raw;
      }
    }
  }

  const url = getAlbumCoverUrl(raw || album.id);
  return withFallback ? url : url;
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
    if (raw.startsWith('http')) {
      try {
        const u = new URL(raw);
        const host = u.hostname;
        const isPrivateNet = /^192\.168\./.test(host) || /^10\./.test(host) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host);
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || isPrivateNet) {
          const byParam = u.searchParams.get('file');
          const baseName = u.pathname.split('/').pop() || '';
          const file = byParam || baseName;
          if (file) return getAvatarUrl(file);
        }
      } catch {}
      return raw;
    }
    if (raw.startsWith('/')) {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
        const alreadyPrefixed = raw.startsWith('/1canticosccb/');
        // Reescrever caminhos diretos para pastas de avatars para stream protegido
        const looksAvatars = /(^|\/)media_protegida\/avatars(\/|$)/i.test(raw) || /(^|\/)media\/avatars(\/|$)/i.test(raw) || (/(^|\/)avatars(\/|$)/i.test(raw) && !/^\/(api|1canticosccb\/api)\/stream\.php/i.test(raw));
        if (looksAvatars) {
          const last = raw.split('/').pop() || '';
          const file = last.split('?')[0];
          return `${protocol}//${host}/1canticosccb/api/stream.php?type=avatars&file=${encodeURIComponent(file)}`;
        }
        // Se já é /api/stream.php, apenas prefixar corretamente em dev
        if (/^\/api\/stream\.php/i.test(raw)) {
          const path = alreadyPrefixed ? raw : `/1canticosccb${raw}`;
          return `${protocol}//${host}${path}`;
        }
        const path = alreadyPrefixed ? raw : raw;
        return `${protocol}//${host}${path}`;
      } catch {
        return raw;
      }
    }
  }

  if (user.name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1db954&color=fff&size=200`;
  }
  return getAvatarUrl(raw || user.id);
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
