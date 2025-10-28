import React from 'react';
import { Eye, AlertTriangle, Ban, Shield } from 'lucide-react';

export interface SecurityStats {
  totalAttempts: number;
  failedAttempts: number;
  blockedIPs: number;
  criticalAlerts: number;
}

interface Props {
  stats: SecurityStats;
}

const SecurityStatsCards: React.FC<Props> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 p-3 rounded-lg">
            <Eye className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Tentativas de Login</p>
            <p className="text-white text-2xl font-bold">{stats.totalAttempts}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500/20 p-3 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Falhas de Login</p>
            <p className="text-white text-2xl font-bold">{stats.failedAttempts}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/20 p-3 rounded-lg">
            <Ban className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">IPs Bloqueados</p>
            <p className="text-white text-2xl font-bold">{stats.blockedIPs}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500/20 p-3 rounded-lg">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Alertas Críticos</p>
            <p className="text-white text-2xl font-bold">{stats.criticalAlerts}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityStatsCards;
