import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Gift, TrendingUp } from 'lucide-react';

const AdminPromotions: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const promotions = [
    {
      id: 1,
      title: 'Black Friday - 50% OFF',
      description: '50% de desconto no plano Premium anual',
      startDate: '2024-11-20',
      endDate: '2024-11-30',
      discount: 50,
      active: true,
      clicks: 1234,
      conversions: 89
    },
    {
      id: 2,
      title: 'Natal Premium',
      description: '3 meses grátis na assinatura anual',
      startDate: '2024-12-01',
      endDate: '2024-12-25',
      discount: 25,
      active: true,
      clicks: 567,
      conversions: 45
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Promoções</h1>
          <p className="text-gray-400">{promotions.length} promoções cadastradas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Promoção
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {promotions.map((promo) => (
          <div key={promo.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Gift className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-xl font-bold text-white">{promo.title}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    promo.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {promo.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <p className="text-gray-400 mb-3">{promo.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>De {promo.startDate} até {promo.endDate}</span>
                  <span>•</span>
                  <span className="text-yellow-500 font-semibold">{promo.discount}% OFF</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <p className="text-gray-400 text-xs">Cliques</p>
                </div>
                <p className="text-white text-xl font-bold">{promo.clicks}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-4 h-4 text-green-400" />
                  <p className="text-gray-400 text-xs">Conversões</p>
                </div>
                <p className="text-white text-xl font-bold">{promo.conversions}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2">
                {promo.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {promo.active ? 'Desativar' : 'Ativar'}
              </button>
              <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Nova Promoção</h3>
            <form className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Título</label>
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
                  <label className="text-white text-sm font-medium mb-2 block">Desconto (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
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
                  Criar Promoção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromotions;
