// Logos Management — Supabase REST + Storage
import { supabase } from '@/lib/supabase-auth';
import { supabaseFetch, supabaseUpdate, supabaseInsert } from '@/lib/supabaseRest';

export type LogoType = 'favicon' | 'primary' | 'secondary' | 'social';

export interface Logo {
  id: string;
  type: LogoType;
  name: string;
  url: string;
  width: number;
  height: number;
  file_size?: number;
  updated_at: string;
}

// Fallback data when table doesn't exist yet
const FALLBACK_LOGOS: Logo[] = [
  { id: '0', type: 'primary', name: 'Logo Principal (Claro)', url: 'https://canticosccb.com.br/logo-canticos-ccb.png', width: 300, height: 80, updated_at: new Date().toISOString() },
  { id: '0', type: 'secondary', name: 'Logo Alternativo (Escuro)', url: '', width: 0, height: 0, updated_at: new Date().toISOString() },
  { id: '0', type: 'favicon', name: 'Favicon', url: '/icons/favicon.svg', width: 32, height: 32, updated_at: new Date().toISOString() },
  { id: '0', type: 'social', name: 'Imagem para Redes Sociais', url: 'https://canticosccb.com.br/logo-canticos-ccb.png', width: 1200, height: 630, updated_at: new Date().toISOString() },
];

const mapRow = (r: any): Logo => ({
  id: String(r.id),
  type: r.type as LogoType,
  name: r.name || '',
  url: r.url || '',
  width: r.width || 0,
  height: r.height || 0,
  file_size: r.file_size || 0,
  updated_at: r.updated_at || new Date().toISOString(),
});

export const getAllLogos = async (): Promise<Logo[]> => {
  try {
    const rows = await supabaseFetch<any>('site_logos', {
      select: '*',
      order: 'id.asc',
    });
    if (rows.length > 0) {
      return rows.map(mapRow);
    }
    return FALLBACK_LOGOS;
  } catch (error) {
    console.warn('[logosApi] Tabela site_logos não encontrada, usando fallback:', error);
    return FALLBACK_LOGOS;
  }
};

export const updateLogo = async (
  logoType: LogoType,
  data: { url: string; width: number; height: number; file_size?: number }
): Promise<{ success: boolean }> => {
  try {
    const result = await supabaseUpdate('site_logos', { type: `eq.${logoType}` }, {
      url: data.url,
      width: data.width,
      height: data.height,
      ...(data.file_size ? { file_size: data.file_size } : {}),
      updated_at: new Date().toISOString(),
    });
    if (Array.isArray(result) && result.length === 0) {
      // Row doesn't exist yet — insert it
      const nameMap: Record<string, string> = {
        primary: 'Logo Principal (Claro)', secondary: 'Logo Alternativo (Escuro)',
        favicon: 'Favicon', social: 'Imagem para Redes Sociais',
      };
      await supabaseInsert('site_logos', {
        type: logoType,
        name: nameMap[logoType] || logoType,
        url: data.url,
        width: data.width,
        height: data.height,
        file_size: data.file_size || 0,
      });
    }
    return { success: true };
  } catch (error) {
    console.error('[logosApi] updateLogo error:', error);
    return { success: false };
  }
};

export const uploadLogoImage = async (file: File, logoType: LogoType): Promise<string> => {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase não configurado');

  // Get auth token
  let accessToken = SUPABASE_ANON_KEY;
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) accessToken = data.session.access_token;
  } catch { /* use anon */ }

  const ext = file.name.split('.').pop() || 'png';
  const path = `logos/${logoType}-${Date.now()}.${ext}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/logos/${path}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': file.type,
      'x-upsert': 'true',
    },
    body: file,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Upload falhou: ${response.status} - ${errText}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/logos/${path}`;
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível carregar a imagem'));
    };
    
    img.src = objectUrl;
  });
};
