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

const emptyOverview: ComposerOverview = {
  plays: 0,
  followers: 0,
  likes: 0,
  averageListenTimeSeconds: 0,
  totalSongs: 0,
  monthlyFollowers: 0,
  totalAlbums: 0,
};

async function getComposerOverviewInternal(compositorId: string | number, period: '7d'|'30d'|'90d'|'1y' = '30d'): Promise<ComposerOverview> {
  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const sinceDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  const [followersAll, followersRecent, songs, favorites, albums] = await Promise.all([
    supabaseFetch<any>('user_follows', {
      composer_id: `eq.${compositorId}`,
      select: 'id'
    }).catch(() => []),
    supabaseFetch<any>('user_follows', {
      composer_id: `eq.${compositorId}`,
      created_at: `gte.${sinceDate}`,
      select: 'id'
    }).catch(() => []),
    supabaseFetch<any>('hinos', {
      compositor_id: `eq.${compositorId}`,
      select: 'id,plays'
    }).catch(() => []),
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
    supabaseFetch<any>('albums', {
      composer_id: `eq.${compositorId}`,
      select: 'id'
    }).catch(() => []),
  ]);

  const totalPlays = songs.reduce((sum: number, song: any) => sum + (song.plays || 0), 0);

  return {
    plays: totalPlays,
    followers: followersAll.length,
    likes: favorites.length,
    averageListenTimeSeconds: 0,
    totalSongs: songs.length,
    monthlyFollowers: followersRecent.length,
    totalAlbums: albums.length,
  };
}

async function getTopSongsInternal(compositorId: string | number, limit: number): Promise<TopSong[]> {
  const rows = await supabaseFetch<any>('hinos', {
    compositor_id: `eq.${compositorId}`,
    select: 'id,titulo,plays,cover_url',
    order: 'plays.desc',
    limit: String(limit)
  });

  return rows.map((track: any) => ({
    id: String(track.id),
    title: track.titulo,
    plays: track.plays || 0,
    likes: 0,
    coverUrl: track.cover_url || undefined,
  }));
}

export async function getComposerOverview(usuarioId: string | number, period: '7d'|'30d'|'90d'|'1y' = '30d'): Promise<ComposerOverview> {
  if (!isSupabaseConfigured) return emptyOverview;

  try {
    const compositorId = await getComposerIdForUser(usuarioId);
    if (!compositorId) return emptyOverview;
    return await getComposerOverviewInternal(compositorId, period);
  } catch (error) {
    console.error('Error in getComposerOverview:', error);
    return emptyOverview;
  }
}

export async function getTopSongs(usuarioId: string | number, limit: number): Promise<TopSong[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const compositorId = await getComposerIdForUser(usuarioId);
    if (!compositorId) return [];
    return await getTopSongsInternal(compositorId, limit);
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
    return await getPlaysSeriesByComposerId(compositorId, days);
  } catch  {
    return [];
  }
}

export async function getEngagementCounts(usuarioId: string | number, days: number): Promise<{ likes: number; shares: number; downloads: number }> {
  if (!isSupabaseConfigured) return { likes: 0, shares: 0, downloads: 0 };

  try {
    const compositorId = await getComposerIdForUser(usuarioId);
    if (!compositorId) return { likes: 0, shares: 0, downloads: 0 };
    return await getEngagementCountsByComposerId(compositorId, days);
  } catch  {
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

export async function getComposerOverviewByComposerId(compositorId: string | number, period: '7d'|'30d'|'90d'|'1y' = '30d'): Promise<ComposerOverview> {
  if (!isSupabaseConfigured) return emptyOverview;

  try {
    return await getComposerOverviewInternal(compositorId, period);
  } catch (error) {
    console.error('Error in getComposerOverviewByComposerId:', error);
    return emptyOverview;
  }
}

export async function getTopSongsByComposerId(compositorId: string | number, limit: number): Promise<TopSong[]> {
  if (!isSupabaseConfigured) return [];

  try {
    return await getTopSongsInternal(compositorId, limit);
  } catch (error) {
    console.error('Error fetching top songs by composer:', error);
    return [];
  }
}

export async function getPlaysSeriesByComposerId(compositorId: string | number, days: number): Promise<{ day: string; plays: number }[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const data = await supabaseRPC<any[]>('get_plays_series', {
      p_compositor_id: compositorId,
      p_days: days
    });
    return data || [];
  } catch  {
    return [];
  }
}

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
