import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Mic2,
  Music,
  Play,

  TrendingUp,
  Clock,
  CheckCircle,
  Flag
} from 'lucide-react';
import { getAdminStats, getTopSongs, getRecentActivity, AdminStats } from '@/lib/admin/adminStatsApi';
import { useApiCache } from '@/hooks/useApiCache';

const AdminDashboard: React.FC = () => {
  // Cache de stats do dashboard - atualiza a cada 1 minuto
  const { 
    data: stats, 
    isLoading: loadingStats 
  } = useApiCache<AdminStats>({
    key: 'admin-dashboard-stats',
    fetcher: () => getAdminStats(),
    ttl: 60 * 1000 // 1 minuto
  });

  // Cache de top songs - atualiza a cada 5 minutos
  const { 
    data: topSongs, 
    isLoading: loadingTopSongs 
  } = useApiCache<any[]>({
    key: 'admin-dashboard-top-songs',
    fetcher: () => getTopSongs(5),
    ttl: 5 * 60 * 1000 // 5 minutos
  });

  // Atividade recente - atualiza a cada 1 minuto
  const {
    data: recentActivity,
    isLoading: loadingActivity
  } = useApiCache<any[]>({
    key: 'admin-dashboard-recent-activity',
    fetcher: () => getRecentActivity(10),
    ttl: 60 * 1000
  });

  const isLoading = loadingStats || loadingTopSongs || loadingActivity;

  const s = stats || { totalComposers: 0, publishedSongs: 0, totalPlays: 0, totalLikes: 0, totalSongs: 0, newUsersToday: 0, pendingSongs: 0, pendingComposers: 0, openReports: 0 };
  const displayStats = [
    {
      id: 1,
      title: 'Compositores',
      value: s.totalComposers.toString(),
      icon: Mic2,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-500'
    },
    {
      id: 2,
      title: 'Hinos Publicados',
      value: s.publishedSongs.toString(),
      icon: Music,
      color: 'bg-green-500',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500'
    },
    {
      id: 3,
      title: 'Total de Plays',
      value: s.totalPlays >= 1000 
        ? `${(s.totalPlays / 1000).toFixed(1)}K` 
        : s.totalPlays.toString(),
      icon: Play,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-500'
    },
    {
      id: 4,
      title: 'Total de Curtidas',
      value: s.totalLikes.toString(),
      icon: Music,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-500/10',
      textColor: 'text-pink-500'
    },
    {
      id: 5,
      title: 'Total de Hinos',
      value: s.totalSongs.toString(),
      icon: Music,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500'
    },
    {
      id: 6,
      title: 'Novos Hoje',
      value: s.newUsersToday.toString(),
      icon: TrendingUp,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-500'
    }
  ];

  const pendingActions = stats ? [
    { id: 1, type: 'song', title: 'Hinos Pendentes', count: stats.pendingSongs, icon: Music, link: '/admin/songs/pending', color: 'text-yellow-500' },
    { id: 2, type: 'composer', title: 'Compositores Pendentes', count: stats.pendingComposers, icon: Mic2, link: '/admin/composers/pending', color: 'text-blue-500' },
    { id: 3, type: 'report', title: 'Denúncias Abertas', count: stats.openReports, icon: Flag, link: '/admin/reports', color: 'text-red-500' }
  ] : [];

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'favorite': return 'curtiu um hino';
      case 'playlist_created': return 'criou uma playlist';
      case 'playlist_updated': return 'atualizou uma playlist';
      case 'follow': return 'seguiu um compositor';
      case 'play': return 'tocou um hino';
      case 'share': return 'compartilhou um hino';
      default: return 'realizou uma atividade';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard Admin</h1>
          <p className="text-gray-400">Visão geral da plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Dados carregados nesta sessão
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <span className="text-xs font-medium text-gray-500">Sem comparação</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Pending Actions */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Ações Pendentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pendingActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.id}
                to={action.link}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-red-600 transition-all hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${action.color}`} />
                    <div>
                      <p className="text-white font-semibold">{action.title}</p>
                      <p className="text-gray-400 text-sm">Requer atenção</p>
                    </div>
                  </div>
                  <div className="bg-red-600 text-white font-bold px-3 py-1 rounded-full text-sm">
                    {action.count}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Atividade Recente</h2>
            <Link to="/admin/reports/logs" className="text-primary-400 text-sm hover:text-primary-300">
              Ver tudo
            </Link>
          </div>
          <div className="space-y-4">
            {(recentActivity || []).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-800 last:border-0">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activity.user || 'U')}&background=random&size=150`}
                  alt={activity.user}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="text-white text-sm">
                    <span className="font-semibold">{activity.user}</span>{' '}
                    <span className="text-gray-400">{getActionLabel(activity.type)}</span>
                    {activity.item && (
                      <span className="text-primary-400"> {activity.item}</span>
                    )}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{new Date(activity.time).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Songs */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Hinos Mais Tocados</h2>
            <Link to="/admin/reports/analytics" className="text-primary-400 text-sm hover:text-primary-300">
              Ver relatório
            </Link>
          </div>
          <div className="space-y-3">
            {topSongs.length > 0 ? topSongs.map((item, index) => {
              const song = item.songs;
              const plays = item.total_plays >= 1000 
                ? `${(item.total_plays / 1000).toFixed(1)}K` 
                : item.total_plays.toString();
              
              return (
                <div key={item.song_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <span className="text-gray-400 font-bold text-lg w-6">{index + 1}</span>
                  <img
                    src={song?.cover_url || `https://ui-avatars.com/api/?name=${index + 1}&background=1f2937&color=9ca3af&size=100`}
                    alt={song?.title || 'Song'}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {song?.number ? `Hino ${song.number} - ` : ''}{song?.title || 'Sem título'}
                    </p>
                    {song?.composer_name && (
                      <p className="text-gray-400 text-sm truncate">{song.composer_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{plays}</p>
                    <p className="text-gray-400 text-xs">plays</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-gray-400 text-center py-4">Nenhum hino encontrado</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-red-900/20 to-red-600/10 border border-red-800/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/admin/songs/create"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-red-600 transition-all hover:scale-105 text-center"
          >
            <Music className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Criar Hino</p>
          </Link>
          <Link
            to="/admin/users"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-red-600 transition-all hover:scale-105 text-center"
          >
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Usuários</p>
          </Link>
          <Link
            to="/admin/composers/create"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-red-600 transition-all hover:scale-105 text-center"
          >
            <Mic2 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Novo Compositor</p>
          </Link>
          <Link
            to="/admin/approvals"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-red-600 transition-all hover:scale-105 text-center"
          >
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Aprovações</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
