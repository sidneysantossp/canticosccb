import React, { useState, useEffect } from 'react';
import { Crown, Users, TrendingUp, AlertTriangle, Shield, Ban } from 'lucide-react';
import {
  getPremiumPlans,
  getPremiumUsers,
  getPremiumStats,
  cancelUserSubscription,
  PremiumPlan,
  PremiumUser
} from '@/lib/admin/premiumAdminApi';
import { getPremiumVisibility, setPremiumVisibility } from '@/lib/admin/premiumAdminApi';

const AdminSettingsPremium: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'users' | 'analytics'>('users');
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const getStatusStyle = (status: PremiumUser['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleUserAction = async (userId: string) => {
    try {
      if (confirm('Remover o status premium deste usuário?')) {
        await cancelUserSubscription(userId);
        loadData();
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
          <p className="text-gray-400">Controle a visibilidade do premium e acompanhe usuários marcados como premium</p>
        </div>
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
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-300 mt-0.5" />
          <div>
            <h2 className="text-blue-100 font-semibold">Operação atual do premium</h2>
            <p className="text-blue-200/90 text-sm mt-1">
              Nesta fase a plataforma não opera catálogo de planos nem cobrança recorrente. Este painel controla a visibilidade do recurso
              no site e acompanha os usuários já marcados como premium no banco.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${premiumEnabled ? 'bg-green-500/20' : 'bg-gray-700/50'}`}>
              <Shield className={`w-6 h-6 ${premiumEnabled ? 'text-green-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Visibilidade</p>
              <p className="text-white text-2xl font-bold">{premiumEnabled ? 'Ativo' : 'Oculto'}</p>
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
              <TrendingUp className="w-6 h-6 text-yellow-400" />
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
              <h3 className="text-white font-semibold text-lg">Catálogo de Planos</h3>

              {plans.length === 0 ? (
                <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-xl p-8 text-center">
                  <Ban className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h4 className="text-white font-semibold text-lg">Nenhum plano configurado</h4>
                  <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
                    O catálogo de assinaturas não está em operação nesta fase. Quando houver backend de cobrança e regras comerciais
                    definidas, os planos podem voltar a ser administrados aqui.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plans.map((plan) => (
                    <div key={plan.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-white font-semibold text-lg">{plan.name}</h4>
                          <p className="text-gray-400 text-sm">{plan.description}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          plan.is_active 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}>
                          {plan.is_active ? 'Ativo' : 'Inativo'}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-white">{formatCurrency(plan.price)}</span>
                          <span className="text-gray-400">/{plan.interval === 'monthly' ? 'mês' : 'ano'}</span>
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="text-gray-300 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg">Assinantes Premium</h3>
              
              <div className="overflow-x-auto">
                {premiumUsers.length === 0 ? (
                  <div className="bg-gray-800/30 border border-dashed border-gray-700 rounded-xl p-8 text-center">
                    <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h4 className="text-white font-semibold text-lg">Nenhum usuário premium encontrado</h4>
                    <p className="text-gray-400 mt-2">
                      Quando houver usuários marcados com o plano <span className="text-white font-medium">premium</span> na tabela de usuários,
                      eles aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Usuário</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Plano</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Período</th>
                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Pagamento</th>
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
                            <span className="text-gray-300">{user.payment_method || 'Indisponível'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleUserAction(user.id)}
                              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg transition-colors"
                              title="Remover premium"
                            >
                              Remover premium
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg">Analytics Premium</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h4 className="text-white font-medium mb-4">Resumo atual</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Usuários premium ativos</span>
                      <span className="text-white font-medium">{premiumUsers.filter((user) => user.status === 'active').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Usuários premium cancelados</span>
                      <span className="text-white font-medium">{premiumUsers.filter((user) => user.status === 'cancelled').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Receita rastreada</span>
                      <span className="text-white font-medium">{formatCurrency(stats.totalRevenue)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h4 className="text-white font-medium mb-4">Observações operacionais</h4>
                  <ul className="space-y-3 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2"></div>
                      O painel acompanha somente usuários já marcados como premium no banco.
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2"></div>
                      Receita, renovação e catálogo de planos seguem desativados até existir backend comercial real.
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2"></div>
                      A ação disponível hoje é remover o status premium do usuário quando necessário.
                    </li>
                  </ul>
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
