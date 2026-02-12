import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  Music,
  Play,
  Heart,
  Download,
  UserPlus,
  Calendar,
  Eye,
  Share2,
  Award,
  Clock,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getComposerOverview, getTopSongs } from '@/lib/composerStatsApi';
import useNotificationsStore, { createFollowNotification } from '@/stores/notificationsStore';

// Mock types
interface ComposerStats {
  totalPlays: number;
  totalLikes: number;
  totalDownloads: number;
  totalFollowers: number;
  monthlyPlays: number;
  monthlyLikes: number;
  monthlyDownloads: number;
  monthlyFollowers: number;
  playsGrowth: number;
  followersGrowth: number;
  revenueGrowth: number;
  totalSongs: number;
  totalAlbums: number;
  revenue: number;
  monthlyListeners: number;
  averageListenTime: number;
  saveRate: number;
}

interface TopSong {
  id: string;
  title: string;
  plays: number;
  likes: number;
  thumbnail?: string;
  coverUrl?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  message?: string;
  timestamp: string;
}

const fetchOverview = async (params: { composerId?: string | number; usuarioId?: string | number; period: '7d'|'30d'|'90d'|'1y' }): Promise<ComposerStats> => {
  const { usuarioId, period } = params;
  if (!usuarioId) throw new Error('usuarioId required');
  
  const overview = await getComposerOverview(usuarioId, period);
  return {
    totalPlays: overview.plays,
    totalLikes: overview.likes,
    totalDownloads: 0,
    totalFollowers: overview.followers,
    monthlyPlays: 0,
    monthlyLikes: 0,
    monthlyDownloads: 0,
    monthlyFollowers: overview.monthlyFollowers,
    playsGrowth: 0,
    followersGrowth: overview.followers > 0 && overview.monthlyFollowers > 0
      ? Math.round((overview.monthlyFollowers / overview.followers) * 100)
      : 0,
    revenueGrowth: 0,
    totalSongs: overview.totalSongs,
    totalAlbums: overview.totalAlbums,
    revenue: 0,
    monthlyListeners: 0,
    averageListenTime: overview.averageListenTimeSeconds / 60,
    saveRate: overview.totalSongs > 0 && overview.likes > 0
      ? Math.round((overview.likes / overview.plays) * 100) || 0
      : 0,
  };
};

const fetchHighlights = async (params: { composerId?: string | number; usuarioId?: string | number; limit: number }): Promise<TopSong[]> => {
  const { usuarioId, limit } = params;
  if (!usuarioId) return [];
  
  const songs = await getTopSongs(usuarioId, limit);
  return songs.map((s) => ({
    id: s.id,
    title: s.title,
    plays: s.plays,
    likes: s.likes,
    coverUrl: s.coverUrl,
    trend: 'up' as const,
  }));
};

const fetchRecentActivities = async (params: { composerId?: string | number; usuarioId?: string | number }): Promise<RecentActivity[]> => {
  return [];
};

const ComposerDashboard: React.FC = () => {
  const { user, profile, managingComposerId } = useAuth();
  const [followToast, setFollowToast] = useState<{ visible: boolean; name: string }>(() => ({ visible: false, name: '' }));
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ComposerStats | null>(null);
  const [topSongs, setTopSongs] = useState<TopSong[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [topCountries, setTopCountries] = useState<Array<{country: string; plays: number}>>([]);

  useEffect(() => {
    console.log('🎯 ComposerDashboard - User:', user?.id);
    console.log('🎯 ComposerDashboard - Profile:', profile);
    
    if (user?.id) {
      loadDashboardData();
    } else {
      console.warn('⚠️ No user ID found!');
      setIsLoading(false); // Stop loading if no user
    }
  }, [user?.id, timeRange]);

  // Realtime: notificação de novo seguidor (disabled - mock mode)
  useEffect(() => {
    if (!user?.id) return;
    /*

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      // Descobrir o composer_id associado a este user
      const { data: composer, error } = await supabase
        .from('composers')
        .select('id, name')
        .eq('user_id', user.id)
        .single();
      if (error || !composer) return;

      channel = supabase
        .channel(`composer_notifications_${composer.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'composer_notifications', filter: `composer_id=eq.${composer.id}` },
          async (payload: any) => {
            try {
              // Buscar dados do seguidor para enriquecer a notificação (opcional)
              const followerId = payload.new?.user_id as string | undefined;
              let followerName = 'Novo seguidor';
              let followerAvatar = '';
              if (followerId) {
                const { data: follower } = await supabase
                  .from('users')
                  .select('username, name, avatar_url, email')
                  .eq('id', followerId)
                  .single();
                followerName = follower?.name || follower?.username || follower?.email || followerName;
                followerAvatar = follower?.avatar_url || '';
              }

              useNotificationsStore.getState().addNotification(
                createFollowNotification(followerName, followerAvatar, followerId || '')
              );

              // Toast visual
              setFollowToast({ visible: true, name: followerName });
              setTimeout(() => setFollowToast({ visible: false, name: '' }), 4000);
            } catch (e) {
              console.warn('Realtime follow notification handling error', e);
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime channel status:', status);
        });
    };

    void setup();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    */
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      const sessionComposerId = window.sessionStorage.getItem('managingComposerId') ? parseInt(window.sessionStorage.getItem('managingComposerId') as string) : undefined;
      const composerId = (managingComposerId ?? sessionComposerId);
      const usuarioId = user!.id;
      console.log('📊 Loading dashboard data for composer:', composerId, 'usuario:', usuarioId);
      setIsLoading(true);
      
      // Carregar stats primeiro
      console.log('1️⃣ Loading stats...');
      const statsData = await fetchOverview({ composerId: composerId ?? undefined, usuarioId, period: timeRange });
      console.log('✅ Stats loaded:', statsData);
      setStats(statsData);
      
      // Carregar songs
      console.log('2️⃣ Loading songs...');
      const songsData = await fetchHighlights({ composerId: composerId ?? undefined, usuarioId, limit: 4 });
      console.log('✅ Songs loaded:', songsData);
      setTopSongs(songsData);
      
      // Carregar activities
      console.log('3️⃣ Loading activities...');
      const activitiesData = await fetchRecentActivities({ composerId: composerId ?? undefined, usuarioId });
      console.log('✅ Activities loaded:', activitiesData);
      setActivities(activitiesData);
      
      // Países: por ora sem endpoint real, mantém vazio
      setTopCountries([]);
      
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      // Garantir renderização mesmo em caso de falha parcial
      setStats({
        totalPlays: 0,
        totalLikes: 0,
        totalDownloads: 0,
        totalFollowers: 0,
        monthlyPlays: 0,
        monthlyLikes: 0,
        monthlyDownloads: 0,
        monthlyFollowers: 0,
        playsGrowth: 0,
        followersGrowth: 0,
        revenueGrowth: 0,
        totalSongs: 0,
        totalAlbums: 0,
        revenue: 0,
        monthlyListeners: 0,
        averageListenTime: 0,
        saveRate: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mapear ícones de atividade
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'milestone': return Award;
      case 'followers': return Users;
      case 'trending': return TrendingUp;
      case 'save_rate': return Heart;
      default: return Music;
    }
  };

  // Demographics calculados dos dados reais
  const totalCountryPlays = topCountries.reduce((sum, c) => sum + c.plays, 0);
  const demographics = {
    topCountries: topCountries.length > 0 ? topCountries.map(c => ({
      country: c.country,
      percentage: totalCountryPlays > 0 ? Math.round((c.plays / totalCountryPlays) * 100) : 0
    })) : [
      { country: 'Sem dados ainda', percentage: 100 }
    ]
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (isLoading || !stats) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      {followToast.visible && (
        <div className="fixed right-6 top-20 z-50 bg-background-secondary border border-gray-700 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Novo seguidor</p>
            <p className="text-text-muted text-xs">{followToast.name} começou a seguir você</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-text-muted">Bem-vindo de volta! Aqui está um resumo da sua performance.</p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 bg-background-secondary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="1y">Último ano</option>
          </select>
          
          <Link
            to="/composer/songs/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-black rounded-lg font-medium hover:bg-primary-400 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Hino
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-primary-400" />
            </div>
            <span className={`text-sm font-medium ${stats.playsGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.playsGrowth >= 0 ? '+' : ''}{stats.playsGrowth}%
            </span>
          </div>
          <p className="text-text-muted text-sm mb-1">Total de Plays</p>
          <h3 className="text-3xl font-bold text-white">{formatNumber(stats.totalPlays)}</h3>
        </div>

        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <span className={`text-sm font-medium ${stats.followersGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.followersGrowth >= 0 ? '+' : ''}{stats.followersGrowth}%
            </span>
          </div>
          <p className="text-text-muted text-sm mb-1">Seguidores</p>
          <h3 className="text-3xl font-bold text-white">{formatNumber(stats.totalFollowers)}</h3>
        </div>

        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-text-muted text-sm">Total</span>
          </div>
          <p className="text-text-muted text-sm mb-1">Hinos Publicados</p>
          <h3 className="text-3xl font-bold text-white">{stats.totalSongs}</h3>
        </div>

        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-green-400" />
            </div>
            <span className={`text-sm font-medium ${stats.followersGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.followersGrowth >= 0 ? '+' : ''}{stats.followersGrowth}%
            </span>
          </div>
          <p className="text-text-muted text-sm mb-1">Novos Seguidores (30d)</p>
          <h3 className="text-3xl font-bold text-white">{formatNumber(stats.monthlyFollowers)}</h3>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-background-secondary rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-text-muted" />
            <div>
              <p className="text-text-muted text-xs">Ouvintes Mensais</p>
              <p className="text-white font-semibold">{formatNumber(stats.monthlyListeners)}</p>
            </div>
          </div>
        </div>

        <div className="bg-background-secondary rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-text-muted" />
            <div>
              <p className="text-text-muted text-xs">Tempo Médio</p>
              <p className="text-white font-semibold">{stats.averageListenTime}</p>
            </div>
          </div>
        </div>

        <div className="bg-background-secondary rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-text-muted" />
            <div>
              <p className="text-text-muted text-xs">Taxa de Salvamento</p>
              <p className="text-white font-semibold">{stats.saveRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-background-secondary rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-text-muted" />
            <div>
              <p className="text-text-muted text-xs">Álbuns</p>
              <p className="text-white font-semibold">{stats.totalAlbums}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Top Songs */}
        <div className="lg:col-span-2 bg-background-secondary rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Hinos em Destaque</h2>
            <Link to="/composer/songs" className="text-primary-400 hover:text-primary-300 text-sm font-medium">
              Ver todos
            </Link>
          </div>
          <div className="space-y-4">
            {topSongs.length > 0 ? topSongs.map((song, index) => (
              <div key={song.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors">
                <span className="text-text-muted font-bold w-6">{index + 1}</span>
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="w-14 h-14 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{song.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      {formatNumber(song.plays)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {formatNumber(song.likes)}
                    </span>
                  </div>
                </div>
                <span className="text-green-400 text-sm font-medium">{song.trend}</span>
              </div>
            )) : (
              <div className="text-center py-8">
                <Music className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">Nenhum hino publicado ainda</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6">Atividade Recente</h2>
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm mb-1">{activity.message}</p>
                    <p className="text-text-muted text-xs">{activity.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
        {/* Top Countries */}
        <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6">Principais Países</h2>
          <div className="space-y-4">
            {demographics.topCountries.map((country, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white">{country.country}</span>
                  <span className="text-text-muted">{country.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${country.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/composer/analytics"
          className="bg-background-secondary rounded-xl p-6 border border-gray-800 hover:border-primary-500 transition-colors group"
        >
          <BarChart3 className="w-12 h-12 text-primary-400 mb-4" />
          <h3 className="text-white font-semibold mb-2">Analytics Detalhados</h3>
          <p className="text-text-muted text-sm">Veja métricas completas e insights</p>
        </Link>

        <Link
          to="/composer/albums"
          className="bg-background-secondary rounded-xl p-6 border border-gray-800 hover:border-primary-500 transition-colors group"
        >
          <Music className="w-12 h-12 text-blue-400 mb-4" />
          <h3 className="text-white font-semibold mb-2">Gerenciar Álbuns</h3>
          <p className="text-text-muted text-sm">Organize suas coleções musicais</p>
        </Link>

        <Link
          to="/composer/profile"
          className="bg-background-secondary rounded-xl p-6 border border-gray-800 hover:border-primary-500 transition-colors group"
        >
          <Users className="w-12 h-12 text-purple-400 mb-4" />
          <h3 className="text-white font-semibold mb-2">Meu Perfil</h3>
          <p className="text-text-muted text-sm">Edite suas informações públicas</p>
        </Link>
      </div>
    </div>
  );
};

export default ComposerDashboard;
