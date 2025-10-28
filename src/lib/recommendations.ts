import { apiFetch } from '@/lib/api-helper';

export interface RecTrack {
  id: string;
  title: string;
  composer_name: string;
  cover_url: string;
  audio_url: string;
  category?: string;
  reason?: string;
}

export interface PersonalizedData {
  mix: RecTrack[];
  byCategories: RecTrack[];
  byFollowedComposers: RecTrack[];
}

const toRecTrack = (h: any, reason?: string): RecTrack => ({
  id: String(h.id),
  title: String(h.titulo || h.title || 'Hino'),
  composer_name: String(h.compositor || h.composer_name || 'Desconhecido'),
  cover_url: String(h.cover_url || ''),
  audio_url: String(h.audio_url || ''),
  category: String(h.categoria || h.category || ''),
  reason,
});

export async function getPersonalizedHomeData(_userId: string): Promise<PersonalizedData> {
  try {
    // Tentar usar hinos reais publicados recentemente como base para "mix"
    const res = await apiFetch('/api/hinos/index.php?sort=recent&limit=12&ativo=1');
    if (res.ok) {
      const json = await res.json();
      const list: any[] = Array.isArray(json?.hinos) ? json.hinos : (Array.isArray(json) ? json : []);
      const mix = list.slice(0, 8).map((h) => toRecTrack(h));
      // Sem dados reais de "seguidos", manter vazios para ocultar seÃ§Ãµes personalizadas
      return { mix, byCategories: [], byFollowedComposers: [] };
    }
  } catch {}
  // Em caso de erro: nenhuma seção personalizada
  return { mix: [], byCategories: [], byFollowedComposers: [] };
}
