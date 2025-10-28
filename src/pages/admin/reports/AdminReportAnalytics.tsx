import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Music, Download, Calendar, AlertTriangle } from 'lucide-react';

interface AnalyticsData {
  period: string;
  plays: number;
  users: number;
  downloads: number;
  favorites: number;
}

const AdminReportAnalytics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  // Mock analytics data
  const mockData: AnalyticsData[] = [
    { period: 'Últimos 7 dias', plays: 12450, users: 3240, downloads: 890, favorites: 1230 },
    { period: 'Últimos 30 dias', plays: 54320, users: 12450, downloads: 3450, favorites: 4560 },
    { period: 'Últimos 90 dias', plays: 165890, users: 34560, downloads: 9870, favorites: 12340 }
  ];

  const [data] = useState<AnalyticsData[]>(mockData);

  useEffect(() => {
    // Simulate loading analytics data from API
    const timer = setTimeout(() => {
      try {
        // In production, load from API: const analytics = await getReportAnalytics();
        setIsLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar relatório de analytics');
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    {
      label: 'Total de Plays',
      value: '54.3K',
      change: '+12.5%',
      icon: Music,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      label: 'Usuários Ativos',
      value: '12.4K',
      change: '+8.3%',
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      label: 'Downloads',
      value: '3.5K',
      change: '+15.2%',
      icon: Download,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      label: 'Favoritos',
      value: '4.6K',
      change: '+6.8%',
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    }
  ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar relatório</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
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
          <h1 className="text-3xl font-bold text-white mb-2">Relatório de Analytics</h1>
          <p className="text-gray-400">Análise detalhada de métricas e desempenho</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-600"
          >
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="90days">Últimos 90 dias</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-green-400 text-sm font-semibold">{stat.change}</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Detailed Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Métricas por Período
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Período</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Plays</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Usuários</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Downloads</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Favoritos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4 text-white font-medium">{item.period}</td>
                  <td className="py-3 px-4 text-gray-300">{item.plays.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-gray-300">{item.users.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-gray-300">{item.downloads.toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4 text-gray-300">{item.favorites.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Songs */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Top 5 Hinos Mais Tocados</h2>
        <div className="space-y-3">
          {[
            { name: 'Hino 1 - Oh! Que Glória', plays: 4520 },
            { name: 'Hino 5 - Vem, Ó Pródigo', plays: 3890 },
            { name: 'Hino 10 - Lindo País', plays: 3450 },
            { name: 'Hino 15 - Ó Cristãos, Vinde Todos', plays: 3120 },
            { name: 'Hino 20 - Jerusalém Celeste', plays: 2890 }
          ].map((song, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-600">#{index + 1}</span>
                <span className="text-white">{song.name}</span>
              </div>
              <span className="text-gray-400">{song.plays.toLocaleString('pt-BR')} plays</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminReportAnalytics;
