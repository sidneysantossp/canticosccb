import React from 'react';
import { TrendingUp, Users, Music, Play, DollarSign, Download } from 'lucide-react';
import LineChart from '@/components/charts/LineChart';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';
import AreaChart from '@/components/charts/AreaChart';

const AdminAnalytics: React.FC = () => {
  const stats = [
    { label: 'Usuários Ativos (MAU)', value: '24,547', change: '+12.5%', icon: Users, color: 'blue' },
    { label: 'Total de Plays', value: '2.4M', change: '+18.3%', icon: Play, color: 'green' },
    { label: 'Novos Hinos', value: '156', change: '+23.1%', icon: Music, color: 'purple' },
    { label: 'Receita (MRR)', value: 'R$ 145K', change: '+15.8%', icon: DollarSign, color: 'emerald' }
  ];

  // Mock data para gráficos
  const userGrowthData = [
    { month: 'Jan', usuarios: 15000 },
    { month: 'Fev', usuarios: 17000 },
    { month: 'Mar', usuarios: 19000 },
    { month: 'Abr', usuarios: 20500 },
    { month: 'Mai', usuarios: 22000 },
    { month: 'Jun', usuarios: 24547 }
  ];

  const categoryData = [
    { name: 'Adoração', value: 35 },
    { name: 'Louvor', value: 25 },
    { name: 'Paz', value: 20 },
    { name: 'Glória', value: 12 },
    { name: 'Outros', value: 8 }
  ];

  const revenueData = [
    { month: 'Jan', receita: 98000 },
    { month: 'Fev', receita: 105000 },
    { month: 'Mar', receita: 118000 },
    { month: 'Abr', receita: 128000 },
    { month: 'Mai', receita: 135000 },
    { month: 'Jun', receita: 145000 }
  ];

  const playsData = [
    { month: 'Jan', plays: 1800000 },
    { month: 'Fev', plays: 1950000 },
    { month: 'Mar', plays: 2100000 },
    { month: 'Abr', plays: 2200000 },
    { month: 'Mai', plays: 2300000 },
    { month: 'Jun', plays: 2400000 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Global</h1>
          <p className="text-gray-400">Visão geral das métricas da plataforma</p>
        </div>
        <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exportar Relatório
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-500/20 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <span className="text-green-500 text-sm font-semibold">{stat.change}</span>
              </div>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="h-80">
            <LineChart
              data={userGrowthData}
              dataKey="usuarios"
              xAxisKey="month"
              color="#3B82F6"
              title="Crescimento de Usuários"
            />
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="h-80">
            <PieChart
              data={categoryData}
              dataKey="value"
              nameKey="name"
              title="Plays por Categoria"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="h-96">
          <BarChart
            data={revenueData}
            dataKey="receita"
            xAxisKey="month"
            color="#10B981"
            title="Receita Mensal (R$)"
          />
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="h-80">
          <AreaChart
            data={playsData}
            dataKey="plays"
            xAxisKey="month"
            color="#8B5CF6"
            title="Total de Plays"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
