import { supabase } from '@/lib/supabase-auth';
import { normalizeYoutubeSource } from '@/lib/youtubeSource';

export interface RecTrack {
  id: string;
  number: number;
  title: string;
  composer_name: string;
  cover_url: string;
  audio_url: string;
  category?: string;
  reason?: string;
  youtube_source?: string;
}

export interface PersonalizedData {
  mix: RecTrack[];
  byCategories: RecTrack[];
  byFollowedComposers: RecTrack[];
}

const toRecTrack = (h: any, reason?: string): RecTrack => ({
  id: String(h.id),
  number: Number(h.numero || h.number || 0),
  title: String(h.titulo || h.title || 'Hino'),
  composer_name: String(h.compositor_nome || h.compositor || h.composer_name || 'Desconhecido'),
  cover_url: String(h.cover_url || ''),
  audio_url: normalizeYoutubeSource(h.youtube_source) ? '' : String(h.audio_url || ''),
  category: String(h.categoria || h.category || ''),
  reason,
  youtube_source: normalizeYoutubeSource(h.youtube_source),
});

export async function getPersonalizedHomeData(_userId: string): Promise<PersonalizedData> {
  try {
    // Usar hinos reais publicados recentemente como base para "mix"
    const { data, error } = await supabase
      .from('hinos')
      .select('*')
      .eq('ativo', 1)
      .order('created_at', { ascending: false })
      .limit(12);

    if (!error && data) {
      const mix = data.slice(0, 8).map((h) => toRecTrack(h));
      return { mix, byCategories: [], byFollowedComposers: [] };
    }
  } catch {}
  // Em caso de erro: nenhuma seção personalizada
  return { mix: [], byCategories: [], byFollowedComposers: [] };
}
