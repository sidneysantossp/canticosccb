import React from 'react';
import { Megaphone, TrendingUp, Send } from 'lucide-react';

interface Props {
  stats: { total: number; active: number; totalSent: number; totalRevenue: number };
  formatNumber: (n: number) => string;
  formatCurrency: (n: number) => string;
}

const CampaignsStatsCards: React.FC<Props> = ({ stats, formatNumber, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 p-3 rounded-lg">
            <Megaphone className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total de Campanhas</p>
            <p className="text-white text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/20 p-3 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Campanhas Ativas</p>
            <p className="text-white text-2xl font-bold">{stats.active}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/20 p-3 rounded-lg">
            <Send className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Enviado</p>
            <p className="text-white text-2xl font-bold">{formatNumber(stats.totalSent)}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500/20 p-3 rounded-lg">
            <TrendingUp className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Receita Total</p>
            <p className="text-white text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignsStatsCards;
