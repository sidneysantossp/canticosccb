import React, { useState } from 'react';
import { FileText, Search, Download, Filter } from 'lucide-react';

const AdminLogs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const logs = [
    {
      id: 1,
      type: 'create',
      user: 'Admin',
      action: 'Criou um novo hino',
      target: 'Hino #456 - Glória Eterna',
      ip: '192.168.1.1',
      timestamp: '2024-01-22 14:35:22'
    },
    {
      id: 2,
      type: 'update',
      user: 'João Silva',
      action: 'Atualizou informações do perfil',
      target: 'Perfil de usuário',
      ip: '192.168.1.2',
      timestamp: '2024-01-22 14:30:15'
    },
    {
      id: 3,
      type: 'delete',
      user: 'Admin',
      action: 'Removeu um comentário',
      target: 'Comentário #123',
      ip: '192.168.1.1',
      timestamp: '2024-01-22 14:25:10'
    },
    {
      id: 4,
      type: 'login',
      user: 'Maria Santos',
      action: 'Fez login no sistema',
      target: 'Sistema',
      ip: '192.168.1.3',
      timestamp: '2024-01-22 14:20:05'
    }
  ];

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-500/20 text-green-400',
      update: 'bg-blue-500/20 text-blue-400',
      delete: 'bg-red-500/20 text-red-400',
      login: 'bg-purple-500/20 text-purple-400'
    };

    const labels: Record<string, string> = {
      create: 'Criação',
      update: 'Atualização',
      delete: 'Remoção',
      login: 'Login'
    };

    return (
      <span className={`px-2 py-1 ${colors[type] || 'bg-gray-700 text-gray-400'} text-xs font-semibold rounded-full`}>
        {labels[type] || type}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Logs do Sistema</h1>
          <p className="text-gray-400">Histórico de atividades administrativas</p>
        </div>
        <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exportar Logs
        </button>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar nos logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
          >
            <option value="all">Todos os Tipos</option>
            <option value="create">Criação</option>
            <option value="update">Atualização</option>
            <option value="delete">Remoção</option>
            <option value="login">Login</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800/50 border-b border-gray-800">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                Tipo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                Usuário
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                Ação
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                Alvo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                IP
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                Data/Hora
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-800/30">
                <td className="px-6 py-4">{getTypeBadge(log.type)}</td>
                <td className="px-6 py-4 text-white">{log.user}</td>
                <td className="px-6 py-4 text-gray-400">{log.action}</td>
                <td className="px-6 py-4 text-white">{log.target}</td>
                <td className="px-6 py-4 text-gray-400">{log.ip}</td>
                <td className="px-6 py-4 text-gray-400">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLogs;
