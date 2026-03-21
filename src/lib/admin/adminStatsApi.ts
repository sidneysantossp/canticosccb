import { supabase } from '@/lib/supabase-auth';
import { getOpenReportsCount } from '@/lib/admin/reportsApi';

export type AdminStats = {
  totalUsers: number;
  totalComposers: number;
  totalSongs: number;
  totalPlays: number;
  publishedSongs: number;
  totalLikes: number;
  newUsersToday: number;
  pendingSongs: number;
  pendingComposers: number;
  openReports: number;
};

export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const [
      usersRes,
      composersRes,
      songsRes,
      openReports
    ] = await Promise.all([
      supabase.from('users').select('id,created_at'),
      supabase.from('composers').select('id,status,verified'),
      supabase.from('hinos').select('id,plays_count,plays,views_count,likes_count,likes,status'),
      getOpenReportsCount()
    ]);

    if (usersRes.error) throw usersRes.error;
    if (composersRes.error) throw composersRes.error;
    if (songsRes.error) throw songsRes.error;

    const allUsers = usersRes.data || [];
    const allComposers = composersRes.data || [];
    const allSongs = songsRes.data || [];

    const totalPlays = allSongs.reduce((sum, song: any) => sum + Number(song.plays_count || song.plays || song.views_count || 0), 0);
    const totalLikes = allSongs.reduce((sum, song: any) => sum + Number(song.likes_count || song.likes || 0), 0);
    const publishedSongs = allSongs.filter((song: any) => song.status === 'published').length;
    const pendingSongs = allSongs.filter((song: any) => ['draft', 'pending'].includes(song.status)).length;
    const pendingComposers = allComposers.filter((composer: any) => composer.status === 'pending' || composer.verified === false).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = allUsers.filter((user: any) => {
      const createdAt = new Date(user.created_at);
      return createdAt >= today;
    }).length;

    return {
      totalUsers: allUsers.length,
      totalComposers: allComposers.length,
      totalSongs: allSongs.length,
      totalPlays,
      publishedSongs,
      totalLikes,
      newUsersToday,
      pendingSongs,
      pendingComposers,
      openReports
    };
  } catch (error) {
    console.error('❌ [getAdminStats] Error:', error);
    return {
      totalUsers: 0,
      totalComposers: 0,
      totalSongs: 0,
      totalPlays: 0,
      publishedSongs: 0,
      totalLikes: 0,
      newUsersToday: 0,
      pendingSongs: 0,
      pendingComposers: 0,
      openReports: 0
    };
  }
};

export const getDashboardStats = getAdminStats;

export const getTopSongs = async (limit = 5) => {
  try {
    const { data } = await supabase
      .from('hinos')
      .select('id, titulo, compositor_nome, cover_url, plays_count, plays, views_count')
      .order('plays_count', { ascending: false, nullsFirst: false })
      .order('plays', { ascending: false, nullsFirst: false })
      .limit(limit);
      
    // Adaptar para o formato esperado pela UI
    return (data || []).map(song => ({
      song_id: song.id,
      total_plays: Number((song as any).plays_count || (song as any).plays || (song as any).views_count || 0),
      songs: {
        title: song.titulo,
        composer_name: (song as any).compositor_nome,
        cover_url: (song as any).cover_url || ''
      }
    }));
  } catch (e) {
    console.error('Error fetching top songs:', e);
    return [];
  }
};

export const getUserGrowth = async (months: number = 6) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id,created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    const allUsers = data || [];

    // Agrupar usuários por mês
    const monthlyData: Record<string, number> = {};
    const now = new Date();
    
    // Inicializar últimos N meses
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      monthlyData[key] = 0;
    }

    // Contar usuários por mês
    allUsers.forEach(user => {
      const date = new Date(user.created_at);
      const key = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      if (monthlyData[key] !== undefined) {
        monthlyData[key]++;
      }
    });

    return Object.entries(monthlyData).map(([month, usuarios]) => ({
      month,
      usuarios
    }));
  } catch (error) {
    console.error('❌ [getUserGrowth] Error:', error);
    return [];
  }
};

export const getRevenueStats = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id,plan,created_at')
      .neq('plan', 'free');

    if (error) throw error;
    const premiumUsers = data || [];

    // Calcular MRR (Monthly Recurring Revenue)
    const planPrices: Record<string, number> = {
      'basic': 9.90,
      'premium': 19.90,
      'pro': 29.90
    };

    const mrr = premiumUsers.reduce((sum, user) => {
      return sum + (planPrices[user.plan] || 0);
    }, 0);

    return {
      mrr,
      totalRevenue: mrr * 12, // ARR (Annual Recurring Revenue)
      premiumUsers: premiumUsers.length,
      conversionRate: 0 // Calcular depois com total de usuários
    };
  } catch (error) {
    console.error('❌ [getRevenueStats] Error:', error);
    return {
      mrr: 0,
      totalRevenue: 0,
      premiumUsers: 0,
      conversionRate: 0
    };
  }
};

export const getRecentActivity = async (limit = 10) => {
  try {
    const [usersRes, songsRes] = await Promise.all([
      supabase
        .from('users')
        .select('id,name,created_at')
        .order('created_at', { ascending: false })
        .limit(Math.floor(limit / 2)),
      supabase
        .from('hinos')
        .select('id,titulo,created_at')
        .order('created_at', { ascending: false })
        .limit(Math.floor(limit / 2))
    ]);

    if (usersRes.error) throw usersRes.error;
    if (songsRes.error) throw songsRes.error;

    const newUsers = usersRes.data || [];
    const newSongs = songsRes.data || [];

    const activities = [
      ...newUsers.map(user => ({
        id: `user-${user.id}`,
        type: 'new_user',
        user: user.name || 'Usuário',
        item: '',
        description: `Novo usuário: ${user.name}`,
        timestamp: user.created_at,
        time: user.created_at,
      })),
      ...newSongs.map(song => ({
        id: `song-${song.id}`,
        type: 'new_song',
        user: 'Sistema',
        item: song.titulo,
        description: `Novo hino: ${song.titulo}`,
        timestamp: song.created_at,
        time: song.created_at,
      }))
    ];

    // Ordenar por timestamp
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return activities.slice(0, limit);
  } catch (error) {
    console.error('❌ [getRecentActivity] Error:', error);
    return [];
  }
};

export type DashboardStats = AdminStats;
export type RecentActivity = any;
