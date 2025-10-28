import React, { useState, useEffect } from 'react';
import { TrendingUp, Music, Users, Heart, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  getPlaysByDay,
  getTopSongs,
  getGenreStats,
  getUserGrowth,
  getAnalyticsSummary
} from '@/lib/admin/analyticsAdminApi';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const AdminAnalytics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  
  const [summary, setSummary] = useState({
    totalPlays: 0,
    totalLikes: 0,
    totalSongs: 0,
    totalUsers: 0
  });
  
  const [playsByDay, setPlaysByDay] = useState<any[]>([]);
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [genreStats, setGenreStats] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [summaryData, playsData, topSongsData, genreData, growthData] = await Promise.all([
        getAnalyticsSummary(),
        getPlaysByDay(period),
        getTopSongs(10),
        getGenreStats(),
        getUserGrowth(period)
      ]);

      setSummary(summaryData || { totalPlays: 0, totalLikes: 0, totalSongs: 0, totalUsers: 0 });
      setPlaysByDay(playsData || []);
      setTopSongs(topSongsData || []);
      setGenreStats(genreData || []);
      setUserGrowth(growthData || []);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      setError(error?.message || 'Erro ao carregar analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar Analytics</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">Visão geral das estatísticas da plataforma</p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod(7)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              period === 7
                ? 'bg-primary-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setPeriod(30)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              period === 30
                ? 'bg-primary-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            30 dias
          </button>
          <button
            onClick={() => setPeriod(90)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              period === 90
                ? 'bg-primary-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            90 dias
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Plays</p>
              <p className="text-white text-2xl font-bold">{summary.totalPlays.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-pink-500/20 p-3 rounded-lg">
              <Heart className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Likes</p>
              <p className="text-white text-2xl font-bold">{summary.totalLikes.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Music className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Músicas Publicadas</p>
              <p className="text-white text-2xl font-bold">{summary.totalSongs}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Usuários Ativos</p>
              <p className="text-white text-2xl font-bold">{summary.totalUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plays by Day */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Plays por Dia</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={playsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="plays" stroke="#8b5cf6" strokeWidth={2} name="Plays" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Crescimento de Usuários</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="new" stroke="#3b82f6" strokeWidth={2} name="Novos" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Songs */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Top 10 Músicas</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topSongs} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="title" type="category" width={150} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Bar dataKey="plays" fill="#8b5cf6" name="Plays" />
              <Bar dataKey="likes" fill="#ec4899" name="Likes" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Genre Distribution */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Distribuição por Gênero</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={genreStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="count"
              >
                {genreStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
