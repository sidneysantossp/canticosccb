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

  const [data, setData] = useState<AnalyticsData[]>([]);

  useEffect(() => {
    // TODO: Integrar com API de analytics real quando disponível
    setData([]);
    setIsLoading(false);
  }, []);

  const stats = [
    {
      label: 'Total de Plays',
      value: '0',
      change: '+0%',
      icon: Music,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      label: 'Usuários Ativos',
      value: '0',
      change: '+0%',
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      label: 'Downloads',
      value: '0',
      change: '+0%',
      icon: Download,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      label: 'Favoritos',
      value: '0',
      change: '+0%',
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
        <div className="text-center py-8 text-gray-400">
          <Music className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p>Nenhum dado disponível ainda</p>
        </div>
      </div>
    </div>
  );
};

export default AdminReportAnalytics;
