import React from 'react';
import { Database, Download, Upload, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const AdminBackup: React.FC = () => {
  const backups = [
    { id: 1, name: 'backup-2024-01-22-full.sql', size: '245 MB', date: '2024-01-22 03:00', type: 'Completo', status: 'success' },
    { id: 2, name: 'backup-2024-01-21-full.sql', size: '243 MB', date: '2024-01-21 03:00', type: 'Completo', status: 'success' },
    { id: 3, name: 'backup-2024-01-20-full.sql', size: '241 MB', date: '2024-01-20 03:00', type: 'Completo', status: 'success' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Backup e Restauração</h1>
        <p className="text-gray-400">Gerencie backups do banco de dados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <Database className="w-8 h-8 text-blue-400 mb-3" />
          <p className="text-gray-400 text-sm mb-1">Último Backup</p>
          <p className="text-xl font-bold text-white">22/01/2024</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
          <p className="text-gray-400 text-sm mb-1">Backups Realizados</p>
          <p className="text-xl font-bold text-white">365</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <Clock className="w-8 h-8 text-yellow-400 mb-3" />
          <p className="text-gray-400 text-sm mb-1">Próximo Backup</p>
          <p className="text-xl font-bold text-white">Hoje às 03:00</p>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Ações Rápidas</h2>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2">
            <Database className="w-5 h-5" />
            Criar Backup Agora
          </button>
          <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Restaurar Backup
          </button>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Backups Disponíveis</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800/50 border-y border-gray-800">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Nome do Arquivo</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Tamanho</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Data/Hora</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Tipo</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {backups.map((backup) => (
              <tr key={backup.id} className="hover:bg-gray-800/30">
                <td className="px-6 py-4 text-white">{backup.name}</td>
                <td className="px-6 py-4 text-gray-400">{backup.size}</td>
                <td className="px-6 py-4 text-gray-400">{backup.date}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    {backup.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg mr-2">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg">
                    Restaurar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBackup;
