import React from 'react';
import { Crown, Edit, Plus } from 'lucide-react';

const AdminPremiumPlans: React.FC = () => {
  const plans = [
    { id: 1, name: 'Premium Mensal', price: 19.90, interval: 'monthly', features: ['Sem anúncios', 'Qualidade superior', 'Download offline'], active: true, subscribers: 1234 },
    { id: 2, name: 'Premium Anual', price: 199.90, interval: 'yearly', features: ['Sem anúncios', 'Qualidade superior', 'Download offline', '2 meses grátis'], active: true, subscribers: 5678 },
    { id: 3, name: 'Premium Família', price: 29.90, interval: 'monthly', features: ['Até 6 contas', 'Sem anúncios', 'Qualidade superior', 'Download offline'], active: false, subscribers: 0 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Planos Premium</h1>
          <p className="text-gray-400">Configure os planos de assinatura</p>
        </div>
        <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className={`bg-gray-900/50 border rounded-xl p-6 ${
            plan.active ? 'border-yellow-600' : 'border-gray-800'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <Crown className="w-8 h-8 text-yellow-500" />
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                plan.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
              }`}>
                {plan.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">R$ {plan.price}</span>
              <span className="text-gray-400">/{plan.interval === 'monthly' ? 'mês' : 'ano'}</span>
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="text-gray-300 text-sm flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Assinantes</p>
              <p className="text-white text-2xl font-bold">{plan.subscribers.toLocaleString()}</p>
            </div>

            <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-2">
              <Edit className="w-4 h-4" />
              Editar Plano
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPremiumPlans;
