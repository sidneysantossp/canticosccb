import React, { useState, useEffect } from 'react';
import { Crown, Users, CreditCard, TrendingUp, Plus, Edit, Trash2, Eye, Star, AlertTriangle } from 'lucide-react';
import {
  getPremiumPlans,
  getPremiumUsers,
  getPremiumStats,
  deletePremiumPlan,
  togglePlanStatus,
  cancelUserSubscription,
  extendUserSubscription,
  processRefund,
  PremiumPlan,
  PremiumUser
} from '@/lib/admin/premiumAdminApi';
import { getPremiumVisibility, setPremiumVisibility } from '@/lib/admin/premiumAdminApi';

const AdminSettingsPremium: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'users' | 'analytics'>('plans');
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [premiumEnabled, setPremiumEnabled] = useState<boolean>(false);
  const [loadingPremiumToggle, setLoadingPremiumToggle] = useState<boolean>(true);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscribers: 0,
    totalPlans: 0,
    conversionRate: 0
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    (async () => {
      try {
        const enabled = await getPremiumVisibility();
        setPremiumEnabled(enabled);
      } finally {
        setLoadingPremiumToggle(false);
      }
    })();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [plansData, usersData, statsData] = await Promise.all([
        getPremiumPlans(),
        getPremiumUsers(),
        getPremiumStats()
      ]);

      setPlans(plansData);
      setPremiumUsers(usersData);
      setStats({
        totalRevenue: statsData.totalRevenue,
        activeSubscribers: statsData.activeSubscribers,
        totalPlans: statsData.totalPlans,
        conversionRate: statsData.conversionRate
      });

    } catch (err: any) {
      console.error('Error loading premium data:', err);
      setError(err?.message || 'Erro ao carregar dados premium');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePremiumVisibility = async () => {
    try {
      const next = !premiumEnabled;
      setPremiumEnabled(next);
      await setPremiumVisibility(next);
    } catch (e) {
      setPremiumEnabled(prev => !prev);
      console.error('Erro ao alternar visibilidade premium:', e);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handlePlanAction = async (planId: string, action: 'edit' | 'delete' | 'toggle') => {
    try {
      switch (action) {
        case 'edit':
          break;
        case 'delete':
          if (confirm('Deletar este plano?')) {
            await deletePremiumPlan(planId);
            loadData();
          }
          break;
        case 'toggle':
          const plan = plans.find(p => p.id === planId);
          if (plan) {
            await togglePlanStatus(planId, !plan.is_active);
            loadData();
          }
          break;
      }
    } catch (error) {
      console.error('Error in plan action:', error);
    }
  };

  const handleUserAction = async (userId: string, action: 'cancel' | 'extend' | 'refund') => {
    try {
      switch (action) {
        case 'cancel':
          if (confirm('Cancelar assinatura deste usuário?')) {
            await cancelUserSubscription(userId);
            loadData();
          }
          break;
        case 'extend':
          await extendUserSubscription(userId, 30);
          loadData();
          break;
        case 'refund':
          if (confirm('Processar reembolso?')) {
            await processRefund(userId);
            loadData();
          }
          break;
      }
    } catch (error) {
      console.error('Error in user action:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando dados premium...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar dados premium</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Premium</h1>
          <p className="text-gray-400">Administre planos premium e assinaturas</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-300">Premium visível para usuários</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!premiumEnabled}
                onChange={handleTogglePremiumVisibility}
                disabled={loadingPremiumToggle}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
            Novo Plano
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Receita Total</p>
              <p className="text-white text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Assinantes Ativos</p>
              <p className="text-white text-2xl font-bold">{stats.activeSubscribers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Crown className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Planos Ativos</p>
              <p className="text-white text-2xl font-bold">{stats.totalPlans}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Taxa de Conversão</p>
              <p className="text-white text-2xl font-bold">{stats.conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="flex border-b border-gray-800">
          {[
            { id: 'plans', label: 'Planos', icon: Crown },
            { id: 'users', label: 'Assinantes', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-400 border-b-2 border-primary-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Plans Tab */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg">Planos Premium</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.map((plan) => (
                  <div key={plan.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-white font-semibold text-lg">{plan.name}</h4>
                        <p className="text-gray-400 text-sm">{plan.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePlanAction(plan.id, 'edit')}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handlePlanAction(plan.id, 'delete')}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{formatCurrency(plan.price)}</span>
                        <span className="text-gray-400">/{plan.interval === 'monthly' ? 'mês' : 'ano'}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="text-white font-medium mb-2">Recursos:</h5>
                      <ul className="space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="text-gray-300 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <div className="text-sm">
                        <span className="text-gray-400">Assinantes: </span>
                        <span className="text-white font-medium">{premiumUsers.filter(u => u.plan_id === plan.id).length}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          plan.is_active 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}>
                          {plan.is_active ? 'Ativo' : 'Inativo'}
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={plan.is_active}
                            onChange={() => handlePlanAction(plan.id, 'toggle')}
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg">Assinantes Premium</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Usuário</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Plano</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Período</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Valor Pago</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {premiumUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{user.name}</p>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white">{user.plan_name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(user.status)}`}>
                            {user.status === 'active' ? 'Ativo' : user.status === 'expired' ? 'Expirado' : 'Cancelado'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <p className="text-gray-300">{formatDate(user.start_date)} -</p>
                            <p className="text-gray-300">{formatDate(user.end_date)}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-green-400 font-medium">{
                            formatCurrency((plans.find(p => p.id === user.plan_id)?.price) || 0)
                          }</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUserAction(user.id, 'extend')}
                              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Estender assinatura"
                            >
                              <Crown className="w-4 h-4 text-yellow-400" />
                            </button>
                            <button
                              onClick={() => handleUserAction(user.id, 'cancel')}
                              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Cancelar assinatura"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                            <button
                              onClick={() => handleUserAction(user.id, 'refund')}
                              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Processar reembolso"
                            >
                              <CreditCard className="w-4 h-4 text-blue-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg">Analytics Premium</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h4 className="text-white font-medium mb-4">Receita por Mês</h4>
                  <div className="space-y-3">
                    {['Janeiro', 'Fevereiro', 'Março', 'Abril'].map((month, index) => (
                      <div key={month} className="flex items-center justify-between">
                        <span className="text-gray-300">{month}</span>
                        <span className="text-white font-medium">{formatCurrency(800 + index * 200)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h4 className="text-white font-medium mb-4">Planos Mais Populares</h4>
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <div key={plan.id} className="flex items-center justify-between">
                        <span className="text-gray-300">{plan.name}</span>
                        <span className="text-white font-medium">{premiumUsers.filter(u => u.plan_id === plan.id).length} assinantes</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPremium;
