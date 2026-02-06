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

export async function getFollowerStats(usuarioId: number): Promise<FollowerStats> {
  if (!isSupabaseConfigured) {
    return { total: 0, thisMonth: 0, growth: 0, engagement: 0, averagePlays: 0 };
  }

  try {
    const data = await supabaseRPC<any>('get_follower_stats', { p_usuario_id: usuarioId });
    return {
      total: data.total || 0,
      thisMonth: data.this_month || 0,
      growth: data.growth || 0,
      engagement: data.engagement || 0,
      averagePlays: data.average_plays || 0,
    };
  } catch (error) {
    console.error('Error fetching follower stats:', error);
    return { total: 0, thisMonth: 0, growth: 0, engagement: 0, averagePlays: 0 };
  }
}

export async function getFollowers(usuarioId: number, limit = 50, offset = 0, search = '', filter: 'all'|'recent'|'active' = 'all'): Promise<Follower[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const filters: Record<string, string> = {
      composer_id: `eq.${usuarioId}`,
      select: 'id,user_id,created_at,users(name,email,avatar_url)',
      limit: String(limit),
      offset: String(offset),
      order: 'created_at.desc'
    };

    const rows = await supabaseFetch<any>('user_follows', filters);
    return rows.map((row: any) => ({
      id: String(row.id),
      name: row.users?.name || 'Usuário',
      email: row.users?.email,
      avatar_url: row.users?.avatar_url,
      followedAt: row.created_at,
      totalPlays: 0,
      isActive: true,
      location: null,
      favoriteSong: null,
    }));
  } catch (error) {
    console.error('Error fetching followers:', error);
    return [];
  }
}

export async function getTopFans(usuarioId: number, limit = 3): Promise<TopFan[]> {
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

export async function getFollowerGrowth(usuarioId: number, days = 30): Promise<FollowerGrowthPoint[]> {
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
