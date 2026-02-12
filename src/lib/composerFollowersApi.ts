import { supabaseFetch, supabaseRPC, isSupabaseConfigured } from './supabaseRest';

export type FollowerStats = {
  total: number;
  thisMonth: number;
  growth: number;
  engagement: number;
  averagePlays: number;
};

export type Follower = {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  followedAt: string;
  totalPlays: number;
  isActive: boolean;
  location?: string | null;
  favoriteSong?: string | null;
};

export type TopFan = {
  id: string;
  name: string;
  avatar_url?: string;
  totalPlays: number;
  totalLikes: number;
  engagementScore: number;
  plays?: number;
  hoursListened?: number | null;
};

export type FollowerGrowthPoint = { date: string; count: number };

export async function getFollowerStats(usuarioId: string | number): Promise<FollowerStats> {
  const empty: FollowerStats = { total: 0, thisMonth: 0, growth: 0, engagement: 0, averagePlays: 0 };
  if (!isSupabaseConfigured) return empty;

  try {
    // Resolver composer_id a partir do user_id
    const composerRows = await supabaseFetch<any>('composers', {
      user_id: `eq.${usuarioId}`,
      select: 'id',
      limit: '1'
    });
    const compositorId = composerRows?.[0]?.id;
    if (!compositorId) return empty;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [allFollowers, recentFollowers] = await Promise.all([
      supabaseFetch<any>('user_follows', {
        composer_id: `eq.${compositorId}`,
        select: 'id'
      }).catch(() => []),
      supabaseFetch<any>('user_follows', {
        composer_id: `eq.${compositorId}`,
        created_at: `gte.${thirtyDaysAgo}`,
        select: 'id'
      }).catch(() => []),
    ]);

    const total = allFollowers.length;
    const thisMonth = recentFollowers.length;
    return {
      total,
      thisMonth,
      growth: total > 0 ? Math.round((thisMonth / total) * 100) : 0,
      engagement: 0,
      averagePlays: 0,
    };
  } catch (error) {
    console.error('Error fetching follower stats:', error);
    return empty;
  }
}

export async function getFollowers(usuarioId: string | number, limit = 50, offset = 0, search = '', filter: 'all'|'recent'|'active' = 'all'): Promise<Follower[]> {
  if (!isSupabaseConfigured) return [];

  try {
    // Resolver composer_id a partir do user_id
    const composerRows = await supabaseFetch<any>('composers', {
      user_id: `eq.${usuarioId}`,
      select: 'id',
      limit: '1'
    });
    const compositorId = composerRows?.[0]?.id;
    if (!compositorId) return [];

    const filters: Record<string, string> = {
      composer_id: `eq.${compositorId}`,
      select: 'id,user_id,created_at',
      limit: String(limit),
      offset: String(offset),
      order: 'created_at.desc'
    };

    const rows = await supabaseFetch<any>('user_follows', filters);

    // Buscar dados dos usuários
    const userIds = rows.map((r: any) => r.user_id).filter(Boolean);
    let usersMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const users = await supabaseFetch<any>('users', {
        id: `in.(${userIds.join(',')})`,
        select: 'id,name,email,avatar_url'
      }).catch(() => []);
      usersMap = (users || []).reduce((acc: any, u: any) => { acc[u.id] = u; return acc; }, {});
    }

    return rows.map((row: any) => {
      const u = usersMap[row.user_id] || {};
      return {
        id: String(row.id),
        name: u.name || 'Usuário',
        email: u.email,
        avatar_url: u.avatar_url,
        followedAt: row.created_at,
        totalPlays: 0,
        isActive: true,
        location: null,
        favoriteSong: null,
      };
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return [];
  }
}

export async function getTopFans(usuarioId: string | number, limit = 3): Promise<TopFan[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const data = await supabaseRPC<any[]>('get_top_fans', {
      p_usuario_id: usuarioId,
      p_limit: limit
    });
    return (data || []).map((fan: any) => ({
      id: String(fan.id),
      name: fan.name || 'Fã',
      avatar_url: fan.avatar_url,
      totalPlays: fan.total_plays || 0,
      totalLikes: fan.total_likes || 0,
      engagementScore: fan.engagement_score || 0,
      plays: fan.plays,
      hoursListened: fan.hours_listened,
    }));
  } catch (error) {
    console.error('Error fetching top fans:', error);
    return [];
  }
}

export async function getFollowerGrowth(usuarioId: string | number, days = 30): Promise<FollowerGrowthPoint[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const data = await supabaseRPC<any[]>('get_follower_growth', {
      p_usuario_id: usuarioId,
      p_days: days
    });
    return (data || []).map((point: any) => ({
      date: point.date,
      count: point.count || 0,
    }));
  } catch (error) {
    console.error('Error fetching follower growth:', error);
    return [];
  }
}
