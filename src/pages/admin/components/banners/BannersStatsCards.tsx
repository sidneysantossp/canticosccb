import React from 'react';
import { Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

interface Props {
  total: number;
  active: number;
  inactive: number;
}

const BannersStatsCards: React.FC<Props> = ({ total, active, inactive }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-blue-400" />
          <div>
            <p className="text-gray-400 text-sm">Total nesta categoria</p>
            <p className="text-2xl font-bold text-white">{total}</p>
          </div>
        </div>
      </div>
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Eye className="w-8 h-8 text-green-400" />
          <div>
            <p className="text-gray-400 text-sm">Ativos</p>
            <p className="text-2xl font-bold text-white">{active}</p>
          </div>
        </div>
      </div>
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <EyeOff className="w-8 h-8 text-gray-400" />
          <div>
            <p className="text-gray-400 text-sm">Inativos</p>
            <p className="text-2xl font-bold text-white">{inactive}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannersStatsCards;
