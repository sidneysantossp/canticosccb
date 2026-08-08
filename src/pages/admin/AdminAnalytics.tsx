import React, { useState, useEffect } from 'react';
import { Music, Users, Heart, BarChart3, Wifi } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
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
  getAnalyticsSummary,
  getOnlineUsers,
  getOnlineUsersHistory,
  saveOnlineSnapshot
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

  // Online users state
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [onlineHistory, setOnlineHistory] = useState<any[]>([]);
  const [showOnlineList, setShowOnlineList] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  // Poll online users every 30s
  useEffect(() => {
    const fetchOnline = async () => {
      try {
        const [result, history] = await Promise.all([
          getOnlineUsers(),
          getOnlineUsersHistory(24),
        ]);
        setOnlineCount(result.count);
        setOnlineUsers(result.users);
        setOnlineHistory(history);
        // Save snapshot every poll
        await saveOnlineSnapshot(result.count);
      } catch (err) {
        console.error('Error fetching online users:', err);
      }
    };
    fetchOnline();
    const timer = setInterval(fetchOnline, 30000);
    return () => clearInterval(timer);
  }, []);

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

      const normalizedGrowthSource = growthData || [];
      const totalNewUsers = normalizedGrowthSource.reduce(
        (sum: number, row: any) => sum + Number(row.new ?? row.users ?? 0),
        0
      );
      let runningTotal = Math.max((summaryData?.totalUsers || 0) - totalNewUsers, 0);

      setSummary(summaryData || { totalPlays: 0, totalLikes: 0, totalSongs: 0, totalUsers: 0 });
      setPlaysByDay((playsData || []).map((row: any) => ({
        date: row.date,
        plays: Number(row.plays || 0),
      })));
      setTopSongs((topSongsData || []).map((song: any) => ({
        ...song,
        plays: Number(song.plays ?? song.plays_count ?? 0),
        likes: Number(song.likes ?? song.likes_count ?? 0),
      })));
      setGenreStats((genreData || []).map((item: any) => ({
        ...item,
        count: Number(item.count ?? item.value ?? 0),
      })));
      setUserGrowth(normalizedGrowthSource.map((row: any) => {
        const newUsers = Number(row.new ?? row.users ?? 0);
        runningTotal += newUsers;
        return {
          date: row.date,
          new: newUsers,
          total: runningTotal,
        };
      }));
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Online Users Card */}
        <div
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-green-600 transition-colors relative"
          onClick={() => setShowOnlineList(!showOnlineList)}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-500/20 p-3 rounded-lg relative">
              <Wifi className="w-6 h-6 text-emerald-400" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Online Agora</p>
              <p className="text-white text-2xl font-bold">{onlineCount}</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs">Clique para ver detalhes</p>

          {/* Dropdown lista de usuários online */}
          {showOnlineList && onlineUsers.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              <div className="p-3 border-b border-gray-700">
                <p className="text-white text-sm font-semibold">Usuários Online ({onlineCount})</p>
              </div>
              {onlineUsers.map((u: any) => (
                <div key={u.user_id} className="px-3 py-2 flex items-center gap-2 border-b border-gray-700/50 last:border-0">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{u.user_name || 'Anônimo'}</p>
                    <p className="text-gray-500 text-xs truncate">{u.user_email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
              <p className="text-gray-400 text-sm">Hinos Publicados</p>
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

      {/* Online Users History Chart */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-emerald-400" />
            Usuários Online - Últimas 24h
          </h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-sm font-semibold">{onlineCount} online agora</span>
          </div>
        </div>
        {onlineHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={onlineHistory}>
              <defs>
                <linearGradient id="onlineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem'
                }}
                labelFormatter={(label) => `Horário: ${label}`}
                formatter={(value: any) => [value, 'Usuários Online']}
              />
              <Area
                type="monotone"
                dataKey="online"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#onlineGradient)"
                name="Online"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <div className="text-center">
              <Wifi className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Ainda não há dados de presença.</p>
              <p className="text-xs mt-1">O gráfico será preenchido conforme os usuários acessam a plataforma.</p>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Songs */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Top 10 Hinos</h3>
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
                label={({ name, percent }) => `${name} (${(Number(percent || 0) * 100).toFixed(0)}%)`}
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
