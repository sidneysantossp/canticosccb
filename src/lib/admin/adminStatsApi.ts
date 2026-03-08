import { supabase } from '@/lib/supabase-auth';
import { supabaseFetch } from '@/lib/supabaseRest';
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
    console.log('🔍 [getAdminStats] Fetching admin statistics...');
    
    // Buscar dados em paralelo
    const [
      allUsers,
      allComposers,
      allSongs,
      publishedSongsData,
      pendingSongsData,
      pendingComposersData,
      openReports
    ] = await Promise.all([
      supabaseFetch<any>('users', { select: 'id,created_at' }),
      supabaseFetch<any>('composers', { select: 'id,status' }),
      supabaseFetch<any>('hinos', { select: 'id,plays,likes' }),
      supabaseFetch<any>('hinos', { status: 'eq.published', select: 'id' }),
      supabaseFetch<any>('hinos', { status: 'eq.draft', select: 'id' }),
      supabaseFetch<any>('composers', { status: 'eq.pending', select: 'id' }),
      getOpenReportsCount()
    ]);

    // Calcular total de plays e likes
    const totalPlays = allSongs.reduce((sum, song) => sum + (song.plays || 0), 0);
    const totalLikes = allSongs.reduce((sum, song) => sum + (song.likes || 0), 0);

    // Calcular novos usuários hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = allUsers.filter(user => {
      const createdAt = new Date(user.created_at);
      return createdAt >= today;
    }).length;

    const stats = {
      totalUsers: allUsers.length,
      totalComposers: allComposers.length,
      totalSongs: allSongs.length,
      totalPlays,
      publishedSongs: publishedSongsData.length,
      totalLikes,
      newUsersToday,
      pendingSongs: pendingSongsData.length,
      pendingComposers: pendingComposersData.length,
      openReports
    };

    console.log('✅ [getAdminStats] Stats calculated:', stats);
    return stats;
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
      .select('id, titulo, composer_name, cover_url')
      .limit(limit);
      
    // Adaptar para o formato esperado pela UI
    return (data || []).map(song => ({
      song_id: song.id,
      total_plays: 0,
      songs: {
        title: song.titulo,
        composer_name: song.composer_name,
        cover_url: song.cover_url
      }
    }));
  } catch (e) {
    console.error('Error fetching top songs:', e);
    return [];
  }
};

export const getUserGrowth = async (months: number = 6) => {
  try {
    const allUsers = await supabaseFetch<any>('users', { 
      select: 'id,created_at',
      order: 'created_at.asc'
    });

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
    // Buscar usuários premium
    const premiumUsers = await supabaseFetch<any>('users', {
      plan: 'neq.free',
      select: 'id,plan,created_at'
    });

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
    // Buscar atividades recentes (novos usuários, novos hinos, etc)
    const [newUsers, newSongs] = await Promise.all([
      supabaseFetch<any>('users', {
        select: 'id,name,created_at',
        order: 'created_at.desc',
        limit: String(Math.floor(limit / 2))
      }),
      supabaseFetch<any>('hinos', {
        select: 'id,titulo,created_at',
        order: 'created_at.desc',
        limit: String(Math.floor(limit / 2))
      })
    ]);

    const activities = [
      ...newUsers.map(user => ({
        id: `user-${user.id}`,
        type: 'new_user',
        description: `Novo usuário: ${user.name}`,
        timestamp: user.created_at
      })),
      ...newSongs.map(song => ({
        id: `song-${song.id}`,
        type: 'new_song',
        description: `Novo hino: ${song.titulo}`,
        timestamp: song.created_at
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
