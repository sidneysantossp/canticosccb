import React from 'react';
import { Tag, TrendingUp, Percent, DollarSign } from 'lucide-react';

export interface PromotionStats {
  total: number;
  active: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
}

interface Props {
  stats: PromotionStats;
  formatNumber: (n: number) => string;
  formatCurrency: (n: number) => string;
}

const PromotionsStatsCards: React.FC<Props> = ({ stats, formatNumber, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 p-3 rounded-lg">
            <Tag className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total de Promoções</p>
            <p className="text-white text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/20 p-3 rounded-lg">
            <Tag className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Ativas</p>
            <p className="text-white text-2xl font-bold">{stats.active}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/20 p-3 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Cliques</p>
            <p className="text-white text-2xl font-bold">{formatNumber(stats.totalClicks)}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500/20 p-3 rounded-lg">
            <Percent className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Conversões</p>
            <p className="text-white text-2xl font-bold">{formatNumber(stats.totalConversions)}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-pink-500/20 p-3 rounded-lg">
            <DollarSign className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Receita</p>
            <p className="text-white text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionsStatsCards;
