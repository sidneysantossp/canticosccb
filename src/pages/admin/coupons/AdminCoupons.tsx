import React, { useState } from 'react';
import { Plus, Edit, Trash2, Copy, Tag } from 'lucide-react';

const AdminCoupons: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const coupons = [
    { id: 1, code: 'BLACKFRIDAY50', discount: 50, type: 'percentage', maxUses: 1000, currentUses: 234, validUntil: '2024-11-30', active: true },
    { id: 2, code: 'NATAL25', discount: 25, type: 'percentage', maxUses: 500, currentUses: 89, validUntil: '2024-12-25', active: true },
    { id: 3, code: 'PRIMEIRACOMPRA', discount: 10, type: 'fixed', maxUses: null, currentUses: 456, validUntil: null, active: true }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Cupons de Desconto</h1>
          <p className="text-gray-400">{coupons.length} cupons ativos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Cupom
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Tag className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-2xl font-bold text-white font-mono">{coupon.code}</h3>
                  <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Desconto</p>
                    <p className="text-white text-lg font-bold">
                      {coupon.type === 'percentage' ? `${coupon.discount}%` : `R$ ${coupon.discount}`}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Usos</p>
                    <p className="text-white text-lg font-bold">
                      {coupon.currentUses}/{coupon.maxUses || '∞'}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Válido até</p>
                    <p className="text-white text-lg font-bold">
                      {coupon.validUntil || 'Sem limite'}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Status</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      coupon.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {coupon.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
                  <Edit className="w-4 h-4 text-blue-400" />
                </button>
                <button className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Novo Cupom</h3>
            <form className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Código do Cupom</label>
                <input
                  type="text"
                  placeholder="EXEMPLO50"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-red-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Tipo de Desconto</label>
                  <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600">
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Valor</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Máximo de Usos</label>
                  <input
                    type="number"
                    placeholder="Deixe vazio para ilimitado"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Válido Até</label>
                  <input
                    type="date"
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
                  Criar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
