import { supabase } from '@/lib/supabase-auth';

const formatDayKey = (value: string | Date) =>
  new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const dateDaysAgo = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getTopSongs = async (limit = 10) => {
  const { data, error } = await supabase
    .from('hinos')
    .select('id, titulo, compositor_nome, cover_url, plays_count, plays, views_count, likes_count, likes')
    .order('plays_count', { ascending: false, nullsFirst: false })
    .order('plays', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;

  return (data || [])
    .map((row: any) => ({
      id: String(row.id),
      title: row.titulo || '',
      composer_name: row.compositor_nome || 'CCB',
      cover_url: row.cover_url || '',
      plays_count: toNumber(row.plays_count || row.plays || row.views_count),
      likes_count: toNumber(row.likes_count || row.likes),
    }))
    .sort((a, b) => b.plays_count - a.plays_count)
    .slice(0, limit);
};

export const getPlaysByDay = async (period = 30) => {
  const since = dateDaysAgo(period - 1);
  const { data, error } = await supabase
    .from('hinos')
    .select('id, created_at, plays_count, plays, views_count')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  const bucket = new Map<string, number>();
  for (let i = period - 1; i >= 0; i -= 1) {
    const date = dateDaysAgo(i);
    bucket.set(formatDayKey(date), 0);
  }

  for (const row of data || []) {
    const key = formatDayKey(row.created_at || new Date());
    const previous = bucket.get(key) || 0;
    // Fallback: sem tabela granular de plays, usamos o total do hino criado/atualizado no período.
    bucket.set(key, previous + toNumber(row.plays_count || row.plays || row.views_count));
  }

  return Array.from(bucket.entries()).map(([date, plays]) => ({ date, plays }));
};

export const getGenreStats = async () => {
  const { data, error } = await supabase
    .from('hinos')
    .select('categoria');

  if (error) throw error;

  const counts = (data || []).reduce<Record<string, number>>((acc, row: any) => {
    const key = row.categoria || 'Sem categoria';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

export const getUserGrowth = async (period = 30) => {
  const since = dateDaysAgo(period - 1);
  const { data, error } = await supabase
    .from('users')
    .select('created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  const bucket = new Map<string, number>();
  for (let i = period - 1; i >= 0; i -= 1) {
    const date = dateDaysAgo(i);
    bucket.set(formatDayKey(date), 0);
  }

  for (const row of data || []) {
    const key = formatDayKey(row.created_at || new Date());
    bucket.set(key, (bucket.get(key) || 0) + 1);
  }

  return Array.from(bucket.entries()).map(([date, users]) => ({ date, users }));
};

export const getAnalyticsSummary = async () => {
  const [songsRes, usersRes] = await Promise.all([
    supabase
      .from('hinos')
      .select('id, plays_count, plays, views_count, likes_count, likes, status'),
    supabase
      .from('users')
      .select('id'),
  ]);

  if (songsRes.error) throw songsRes.error;
  if (usersRes.error) throw usersRes.error;

  const songs = songsRes.data || [];
  const users = usersRes.data || [];

  return {
    totalPlays: songs.reduce((sum: number, row: any) => sum + toNumber(row.plays_count || row.plays || row.views_count), 0),
    totalLikes: songs.reduce((sum: number, row: any) => sum + toNumber(row.likes_count || row.likes), 0),
    totalSongs: songs.filter((row: any) => row.status !== 'archived').length,
    totalUsers: users.length,
  };
};

// ==================== PRESENCE / ONLINE USERS ====================

export const getOnlineUsers = async (): Promise<{ count: number; users: any[] }> => {
  try {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('user_presence')
      .select('user_id,user_name,user_email,last_seen')
      .gte('last_seen', twoMinAgo)
      .order('last_seen', { ascending: false });

    if (error) throw error;
    return { count: data?.length || 0, users: data || [] };
  } catch (err) {
    console.error('[getOnlineUsers] Error:', err);
    return { count: 0, users: [] };
  }
};

export const getOnlineUsersHistory = async (hours = 24): Promise<any[]> => {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('user_presence_history')
      .select('online_count,recorded_at')
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      time: new Date(row.recorded_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      online: toNumber(row.online_count),
    }));
  } catch (err) {
    console.error('[getOnlineUsersHistory] Error:', err);
    return [];
  }
};

export const saveOnlineSnapshot = async (count: number): Promise<void> => {
  try {
    await supabase
      .from('user_presence_history')
      .insert({
        online_count: count,
        recorded_at: new Date().toISOString(),
      });
  } catch (err) {
    console.error('[saveOnlineSnapshot] Error:', err);
  }
};

export const getAll = async () => [];
export const getById = async () => null;
export const create = async () => ({ success: false });
export const update = async () => ({ success: false });
export const deleteItem = async () => ({ success: false });
