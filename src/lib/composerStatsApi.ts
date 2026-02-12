import { supabaseFetch, supabaseRPC, isSupabaseConfigured } from './supabaseRest';

export type ComposerOverview = {
  plays: number;
  followers: number;
  likes: number;
  averageListenTimeSeconds: number;
  totalSongs: number;
  monthlyFollowers: number;
  totalAlbums: number;
};

export type TopSong = {
  id: string;
  title: string;
  plays: number;
  likes: number;
  coverUrl?: string;
};

export async function getComposerOverview(usuarioId: string | number, period: '7d'|'30d'|'90d'|'1y' = '30d'): Promise<ComposerOverview> {
  const empty: ComposerOverview = { plays: 0, followers: 0, likes: 0, averageListenTimeSeconds: 0, totalSongs: 0, monthlyFollowers: 0, totalAlbums: 0 };
  if (!isSupabaseConfigured) return empty;

  try {
    const compositorId = await getComposerIdForUser(usuarioId);
    if (!compositorId) return empty;

    // Buscar dados reais em paralelo
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const sinceDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

    const [followersAll, followersRecent, songs, favorites, albums] = await Promise.all([
      // Total de seguidores
      supabaseFetch<any>('user_follows', {
        composer_id: `eq.${compositorId}`,
        select: 'id'
      }).catch(() => []),
      // Novos seguidores no período
      supabaseFetch<any>('user_follows', {
        composer_id: `eq.${compositorId}`,
        created_at: `gte.${sinceDate}`,
        select: 'id'
      }).catch(() => []),
      // Total de hinos publicados
      supabaseFetch<any>('hinos', {
        compositor_id: `eq.${compositorId}`,
        select: 'id,plays'
      }).catch(() => []),
      // Total de favoritos (likes) nos hinos do compositor
      supabaseFetch<any>('hinos', {
        compositor_id: `eq.${compositorId}`,
        select: 'id'
      }).then(async (hinos: any[]) => {
        if (hinos.length === 0) return [];
        const ids = hinos.map((h: any) => h.id);
        return supabaseFetch<any>('favorites', {
          hino_id: `in.(${ids.join(',')})`,
          select: 'id'
        }).catch(() => []);
      }).catch(() => []),
      // Total de álbuns
      supabaseFetch<any>('albums', {
        composer_id: `eq.${compositorId}`,
        select: 'id'
      }).catch(() => []),
    ]);

    const totalPlays = songs.reduce((sum: number, s: any) => sum + (s.plays || 0), 0);

    return {
      plays: totalPlays,
      followers: followersAll.length,
      likes: favorites.length,
      averageListenTimeSeconds: 0,
      totalSongs: songs.length,
      monthlyFollowers: followersRecent.length,
      totalAlbums: albums.length,
    };
  } catch (error) {
    console.error('Error in getComposerOverview:', error);
    return empty;
  }
}

export async function getTopSongs(usuarioId: string | number, limit: number): Promise<TopSong[]> {
  if (!isSupabaseConfigured) return [];

  try {
    // Resolver compositor_id a partir do user_id
    const compositorId = await getComposerIdForUser(usuarioId);
    if (!compositorId) return [];

    const rows = await supabaseFetch<any>('hinos', {
      compositor_id: `eq.${compositorId}`,
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

export async function getPlaysSeries(usuarioId: string | number, days: number): Promise<{ day: string; plays: number }[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const compositorId = await getComposerIdForUser(usuarioId);
    if (!compositorId) return [];

    const data = await supabaseRPC<any[]>('get_plays_series', {
      p_compositor_id: compositorId,
      p_days: days
    });
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function getEngagementCounts(usuarioId: string | number, days: number): Promise<{ likes: number; shares: number; downloads: number }> {
  if (!isSupabaseConfigured) return { likes: 0, shares: 0, downloads: 0 };

  try {
    const compositorId = await getComposerIdForUser(usuarioId);
    if (!compositorId) return { likes: 0, shares: 0, downloads: 0 };

    const data = await supabaseRPC<any>('get_engagement_counts', {
      p_compositor_id: compositorId,
      p_days: days
    });
    return { likes: data?.likes || 0, shares: data?.shares || 0, downloads: data?.downloads || 0 };
  } catch (error) {
    return { likes: 0, shares: 0, downloads: 0 };
  }
}

// Janela anterior (por enquanto, retorna 0 até termos endpoint com range)
export async function getEngagementCountsWindow(_usuarioId: string | number, _startISO: string, _endISO: string): Promise<{ likes: number; shares: number; downloads: number }> {
  return { likes: 0, shares: 0, downloads: 0 };
}

// Ainda não implementados no backend: retornar vazio
export async function getAudienceTopCountries(_usuarioId: string | number, _days: number, _limit: number) { return []; }
export async function getAudienceDevices(_usuarioId: string | number, _days: number) { return { mobile: 0, desktop: 0, other: 0 }; }

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

export async function getEngagementCountsByComposerId(compositorId: string | number, days: number): Promise<{ likes: number; shares: number; downloads: number }> {
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
