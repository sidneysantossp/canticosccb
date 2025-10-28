/**
 * Helper para gerar URLs de API que funcionam em qualquer dispositivo da rede
 */

/**
 * Gera URL completa de API baseada no hostname atual
 * Funciona tanto em localhost quanto em acesso via IP na rede local
 */
export function getApiUrl(path: string): string {
  // Se já for URL absoluta, retornar como está
  if (/^https?:\/\//i.test(path)) return path;

  // Normalizar caminho e garantir prefixo /api/
  let p = path.startsWith('/') ? path : `/${path}`;
  if (!p.startsWith('/api/')) p = `/api/${p.replace(/^\//, '')}`;

  // Construir base pela origem atual (localhost ou IP na rede)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname; // ex: localhost, 127.0.0.1, 192.168.x.x
    const isLocal = /^(localhost|127\.0\.0\.1|10\.|192\.168\.)/.test(host);
    const base = isLocal ? `http://${host}/1canticosccb` : 'https://canticosccb.com.br';
    return `${base}${p}`;
  }

  // Fallback para SSR/build
  return `https://canticosccb.com.br${p}`;
}

/**
 * Wrapper do fetch que usa URLs dinâmicas
 * Uso: apiFetch('/api/compositores/index.php?limit=100')
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const primaryUrl = getApiUrl(path);
  console.log('🌐 API Request:', primaryUrl);
  try {
    const res = await fetch(primaryUrl, options);
    if (typeof window !== 'undefined') {
      // Fallback automático em ambiente local para qualquer status não OK
      const host = window.location.hostname;
      const isLocal = /^(localhost|127\.0\.0\.1|10\.|192\.168\.)/.test(host);
      if (isLocal && !res.ok) {
        // Tentar com base alternativa /canticosccb
        let p = path.startsWith('/') ? path : `/${path}`;
        if (!p.startsWith('/api/')) p = `/api/${p.replace(/^\//, '')}`;
        const alt = `http://${host}/canticosccb${p}`;
        console.warn('🔁 API Fallback Request:', alt);
        try {
          const r2 = await fetch(alt, options);
          return r2;
        } catch {
          return res;
        }
      }
    }
    return res;
  } catch (e) {
    // Network error: tentar fallback local se aplicável
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const isLocal = /^(localhost|127\.0\.0\.1|10\.|192\.168\.)/.test(host);
      if (isLocal) {
        let p = path.startsWith('/') ? path : `/${path}`;
        if (!p.startsWith('/api/')) p = `/api/${p.replace(/^\//, '')}`;
        const alt = `http://${host}/canticosccb${p}`;
        console.warn('🔁 API Fallback (network error):', alt);
        return fetch(alt, options);
      }
    }
    throw e;
  }
}
