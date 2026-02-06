import { supabaseFetch, supabaseRPC, isSupabaseConfigured } from './supabaseRest';

export type ComposerOverview = {
  plays: number;
  followers: number;
  likes: number;
  averageListenTimeSeconds: number;
};

export type TopSong = {
  id: string;
  title: string;
  plays: number;
  likes: number;
  coverUrl?: string;
};

export async function getComposerOverview(usuarioId: number, period: '7d'|'30d'|'90d'|'1y' = '30d'): Promise<ComposerOverview> {
  if (!isSupabaseConfigured) {
    return { plays: 0, followers: 0, likes: 0, averageListenTimeSeconds: 0 };
  }

  try {
    const data = await supabaseRPC<any>('get_composer_overview', {
      p_usuario_id: usuarioId,
      p_period: period
    });
    return {
      plays: data.total_plays || 0,
      followers: data.total_followers || 0,
      likes: data.total_likes || 0,
      averageListenTimeSeconds: data.avg_listen_time || 0,
    };
  } catch (error) {
    console.error('Error fetching composer overview:', error);
    return { plays: 0, followers: 0, likes: 0, averageListenTimeSeconds: 0 };
  }
}

export async function getTopSongs(usuarioId: number, limit: number): Promise<TopSong[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const rows = await supabaseFetch<any>('hinos', {
      compositor_id: `eq.${usuarioId}`,
      select: 'id,titulo,plays,cover_url',
      order: 'plays.desc',
      limit: String(limit)
    });
    return rows.map((t: any) => ({
      id: String(t.id),
      title: t.titulo,
      plays: t.plays || 0,
      likes: 0,
      coverUrl: t.cover_url || undefined,
    }));
  } catch (error) {
    console.error('Error fetching top songs:', error);
    return [];
  }
}

export async function getPlaysSeries(usuarioId: number, days: number): Promise<{ day: string; plays: number }[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const data = await supabaseRPC<any[]>('get_plays_series', {
      p_usuario_id: usuarioId,
      p_days: days
    });
    return data || [];
  } catch (error) {
    console.error('Error fetching plays series:', error);
    return [];
  }
}

export async function getEngagementCounts(usuarioId: number, days: number): Promise<{ likes: number; shares: number; downloads: number }> {
  if (!isSupabaseConfigured) return { likes: 0, shares: 0, downloads: 0 };

  try {
    const data = await supabaseRPC<any>('get_engagement_counts', {
      p_usuario_id: usuarioId,
      p_days: days
    });
    return { likes: data.likes || 0, shares: data.shares || 0, downloads: data.downloads || 0 };
  } catch (error) {
    console.error('Error fetching engagement counts:', error);
    return { likes: 0, shares: 0, downloads: 0 };
  }
}

// Janela anterior (por enquanto, retorna 0 até termos endpoint com range)
export async function getEngagementCountsWindow(_usuarioId: number, _startISO: string, _endISO: string): Promise<{ likes: number; shares: number; downloads: number }> {
  return { likes: 0, shares: 0, downloads: 0 };
}

// Ainda não implementados no backend: retornar vazio
export async function getAudienceTopCountries(_usuarioId: number, _days: number, _limit: number) { return []; }
export async function getAudienceDevices(_usuarioId: number, _days: number) { return { mobile: 0, desktop: 0, other: 0 }; }

export async function getComposerIdForUser(usuarioId: string | number): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const rows = await supabaseFetch<any>('composers', {
      user_id: `eq.${usuarioId}`,
      select: 'id',
      limit: '1'
    });
    return rows.length > 0 ? String(rows[0].id) : null;
  } catch (error) {
    console.error('Error fetching composer ID:', error);
    return null;
  }
}

export async function getEngagementCountsByComposerId(compositorId: number, days: number): Promise<{ likes: number; shares: number; downloads: number }> {
  if (!isSupabaseConfigured) return { likes: 0, shares: 0, downloads: 0 };

  try {
    const data = await supabaseRPC<any>('get_engagement_counts_by_composer', {
      p_compositor_id: compositorId,
      p_days: days
    });
    return { likes: data.likes || 0, shares: data.shares || 0, downloads: data.downloads || 0 };
  } catch (error) {
    console.error('Error fetching engagement counts by composer:', error);
    return { likes: 0, shares: 0, downloads: 0 };
  }
}
