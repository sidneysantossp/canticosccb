import { supabaseFetch, supabaseInsert, isSupabaseConfigured } from '@/lib/supabaseRest';

// TODO: Integrar com Supabase analytics quando disponível
export const getAll = async (...args: any[]) => [];
export const getById = async (...args: any[]) => null;
export const create = async (...args: any[]) => ({ success: true });
export const update = async (...args: any[]) => ({ success: true });
export const deleteItem = async (...args: any[]) => ({ success: true });
export const getTopSongs = async (limit: number = 10) => {
  return [];
};
export const getPlaysByDay = async (period: number = 30) => {
  return [];
};
export const getGenreStats = async () => {
  return [];
};
export const getUserGrowth = async (period: number = 30) => {
  return [];
};
export const getAnalyticsSummary = async (...args: any[]) => ({ 
  totalPlays: 0, 
  totalLikes: 0, 
  totalSongs: 0, 
  totalUsers: 0 
});
export const getSiteSettings = async (...args: any[]) => ({});
export const updateSiteSettings = async (...args: any[]) => ({ success: true });
export const getComments = async (...args: any[]) => [];
export const deleteComment = async (...args: any[]) => ({ success: true });
export const approveComment = async (...args: any[]) => ({ success: true });
export const getClaims = async (...args: any[]) => [];
export const getCopyrightClaims = async (...args: any[]) => [];
export const updateClaim = async (...args: any[]) => ({ success: true });
export const getRoyalties = async (...args: any[]) => [];
export const processPayment = async (...args: any[]) => ({ success: true });
export const getAllPlaylists = async (...args: any[]) => [];
export const createPlaylist = async (...args: any[]) => ({ success: true });
export const updatePlaylist = async (...args: any[]) => ({ success: true });
export const deletePlaylist = async (...args: any[]) => ({ success: true });
export type SiteSettings = any;
export type Comment = any;
export type Claim = any;
export type CopyrightClaim = any;
export type Royalty = any;
export type Playlist = any;

// ==================== PRESENCE / ONLINE USERS ====================

/**
 * Retorna a lista de usuários online (last_seen nos últimos 2 minutos)
 */
export const getOnlineUsers = async (): Promise<{ count: number; users: any[] }> => {
  if (!isSupabaseConfigured) return { count: 0, users: [] };
  try {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const rows = await supabaseFetch<any>('user_presence', {
      last_seen: `gte.${twoMinAgo}`,
      select: 'user_id,user_name,user_email,last_seen',
      order: 'last_seen.desc',
    });
    return { count: rows.length, users: rows };
  } catch (err) {
    console.error('[getOnlineUsers] Error:', err);
    return { count: 0, users: [] };
  }
};

/**
 * Retorna o histórico de contagem de usuários online (últimas N horas)
 */
export const getOnlineUsersHistory = async (hours: number = 24): Promise<any[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const rows = await supabaseFetch<any>('user_presence_history', {
      recorded_at: `gte.${since}`,
      select: 'online_count,recorded_at',
      order: 'recorded_at.asc',
    });
    return rows.map((r: any) => ({
      time: new Date(r.recorded_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      online: r.online_count,
    }));
  } catch (err) {
    console.error('[getOnlineUsersHistory] Error:', err);
    return [];
  }
};

/**
 * Salva um snapshot da contagem atual de usuários online no histórico
 */
export const saveOnlineSnapshot = async (count: number): Promise<void> => {
  if (!isSupabaseConfigured) return;
  try {
    await supabaseInsert('user_presence_history', {
      online_count: count,
      recorded_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[saveOnlineSnapshot] Error:', err);
  }
};
