import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Mic2, Music, Play } from 'lucide-react';
import { supabaseFetch } from '@/lib/supabaseRest';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalComposers: number;
  totalHymns: number;
  totalPlays: number;
}

const AdminDashboardSimple: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalComposers: 0,
    totalHymns: 0,
    totalPlays: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 [Dashboard] Loading stats...');

      // Buscar usuários
      const users = await supabaseFetch<any>('usuarios', { select: 'id,ativo,tipo' });
      const totalUsers = users.length;
      const activeUsers = users.filter((u: any) => u.ativo === 1).length;
      const totalComposers = users.filter((u: any) => u.tipo === 'compositor').length;

      // Buscar hinos
      const hymns = await supabaseFetch<any>('hinos', { select: 'id,plays_count,ativo' });
      const totalHymns = hymns.filter((h: any) => h.ativo === true || h.ativo === 1).length;
      const totalPlays = hymns.reduce((sum: number, h: any) => sum + (h.plays_count || 0), 0);

      setStats({
        totalUsers,
        activeUsers,
        totalComposers,
        totalHymns,
        totalPlays
      });

      console.log('✅ [Dashboard] Stats loaded:', { totalUsers, activeUsers, totalComposers, totalHymns, totalPlays });
    } catch (error) {
      console.error('❌ [Dashboard] Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard Admin</h1>
          <p className="text-gray-400">Visão geral da plataforma</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Usuários Ativos</h3>
          {isLoading ? (
            <div className="h-9 bg-gray-800 animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold text-white">{formatNumber(stats.activeUsers)}</p>
          )}
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <Mic2 className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Compositores</h3>
          {isLoading ? (
            <div className="h-9 bg-gray-800 animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold text-white">{formatNumber(stats.totalComposers)}</p>
          )}
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-green-500/10 p-3 rounded-lg">
              <Music className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Hinos Publicados</h3>
          {isLoading ? (
            <div className="h-9 bg-gray-800 animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold text-white">{formatNumber(stats.totalHymns)}</p>
          )}
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-orange-500/10 p-3 rounded-lg">
              <Play className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Total de Plays</h3>
          {isLoading ? (
            <div className="h-9 bg-gray-800 animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold text-white">{formatNumber(stats.totalPlays)}</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-red-900/20 to-red-600/10 border border-red-800/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/admin/usuarios"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-red-600 transition-all hover:scale-105 text-center"
          >
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Usuários</p>
          </Link>
          <Link
            to="/admin/compositores"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-red-600 transition-all hover:scale-105 text-center"
          >
            <Mic2 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Compositores</p>
          </Link>
          <Link
            to="/admin/hinos"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-red-600 transition-all hover:scale-105 text-center"
          >
            <Music className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Hinos</p>
          </Link>
          <Link
            to="/admin/musicas"
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-red-600 transition-all hover:scale-105 text-center"
          >
            <Music className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">Músicas</p>
          </Link>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-2">✅ Dashboard Admin Carregado</h3>
        <p className="text-gray-400 text-sm">
          Se você está vendo esta mensagem, o sistema de rotas admin está funcionando corretamente.
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Para testar outras páginas, clique nos links acima ou navegue pelo menu lateral.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboardSimple;
