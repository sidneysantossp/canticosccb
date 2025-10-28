import React from 'react';
import { FileText, CheckCircle, RefreshCw } from 'lucide-react';

export interface ImportStats {
  total: number;
  completed: number;
  processing: number;
  totalRows: number;
  successRate: number;
}

interface Props {
  stats: ImportStats;
}

const ImportStatsCards: React.FC<Props> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total de Importações</p>
            <p className="text-white text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/20 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Concluídas</p>
            <p className="text-white text-2xl font-bold">{stats.completed}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500/20 p-3 rounded-lg">
            <RefreshCw className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Em Processamento</p>
            <p className="text-white text-2xl font-bold">{stats.processing}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/20 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Taxa de Sucesso</p>
            <p className="text-white text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportStatsCards;
