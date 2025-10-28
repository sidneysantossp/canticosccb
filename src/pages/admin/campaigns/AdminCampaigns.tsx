import React, { useState } from 'react';
import { Plus, Edit, Trash2, BarChart3, Calendar } from 'lucide-react';

const AdminCampaigns: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const campaigns = [
    {
      id: 1,
      name: 'Lançamento Premium',
      description: 'Campanha de lançamento do plano premium',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      budget: 5000,
      spent: 2340,
      clicks: 15234,
      conversions: 456,
      status: 'active'
    },
    {
      id: 2,
      name: 'Black Friday',
      description: 'Campanha especial de Black Friday',
      startDate: '2024-11-20',
      endDate: '2024-11-30',
      budget: 10000,
      spent: 8950,
      clicks: 34521,
      conversions: 1234,
      status: 'completed'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Campanhas de Marketing</h1>
          <p className="text-gray-400">{campaigns.length} campanhas cadastradas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Campanha
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{campaign.name}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    campaign.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {campaign.status === 'active' ? 'Ativa' : 'Concluída'}
                  </span>
                </div>
                <p className="text-gray-400 mb-4">{campaign.description}</p>
                
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{campaign.startDate} - {campaign.endDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
                  <Edit className="w-4 h-4 text-blue-400" />
                </button>
                <button className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Orçamento</p>
                <p className="text-white text-lg font-bold">R$ {campaign.budget}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Gasto</p>
                <p className="text-white text-lg font-bold">R$ {campaign.spent}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Cliques</p>
                <p className="text-white text-lg font-bold">{campaign.clicks.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Conversões</p>
                <p className="text-white text-lg font-bold">{campaign.conversions}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Nova Campanha</h3>
            <form className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Nome da Campanha</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Descrição</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Data Início</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Data Fim</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Orçamento (R$)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg"
                >
                  Criar Campanha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampaigns;
