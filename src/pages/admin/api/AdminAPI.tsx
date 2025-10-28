import React, { useState } from 'react';
import { Key, Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react';

const AdminAPI: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const apiKeys = [
    { id: 1, name: 'Mobile App - iOS', key: 'sk_live_abc123...', created: '2024-01-15', lastUsed: '2024-01-22', requests: 15234, active: true },
    { id: 2, name: 'Mobile App - Android', key: 'sk_live_def456...', created: '2024-01-10', lastUsed: '2024-01-22', requests: 18945, active: true },
    { id: 3, name: 'Integration - Testing', key: 'sk_test_ghi789...', created: '2024-01-05', lastUsed: '2024-01-20', requests: 234, active: false }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Keys</h1>
          <p className="text-gray-400">Gerencie as chaves de API da plataforma</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova API Key
        </button>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <p className="text-yellow-500 text-sm">
          ⚠️ Atenção: Nunca compartilhe suas API keys publicamente. Mantenha-as seguras.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {apiKeys.map((apiKey) => (
          <div key={apiKey.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Key className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{apiKey.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      apiKey.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {apiKey.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <code className="px-3 py-1 bg-gray-800 rounded text-purple-400 font-mono text-sm">
                      {apiKey.key}
                    </code>
                    <button className="p-1 hover:bg-gray-800 rounded">
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-800 rounded">
                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <span>Criada em: {apiKey.created}</span>
                    <span>Último uso: {apiKey.lastUsed}</span>
                    <span>{apiKey.requests.toLocaleString()} requisições</span>
                  </div>
                </div>
              </div>

              <button className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Nova API Key</h3>
            <form className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Nome da Key</label>
                <input
                  type="text"
                  placeholder="Ex: Mobile App - iOS"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Ambiente</label>
                <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600">
                  <option value="production">Produção</option>
                  <option value="testing">Teste</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAPI;
