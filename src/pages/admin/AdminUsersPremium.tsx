import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Crown, Search, Shield, Users, XCircle } from 'lucide-react';
import {
  PremiumUser,
  cancelUserSubscription,
  getPremiumStats,
  getPremiumUsers,
  getPremiumVisibility,
  setPremiumVisibility,
} from '@/lib/admin/premiumAdminApi';

const AdminUsersPremium: React.FC = () => {
  const [users, setUsers] = useState<PremiumUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | PremiumUser['status']>('all');
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [togglingPremium, setTogglingPremium] = useState(false);
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    activeSubscribers: 0,
    totalPlans: 0,
    conversionRate: 0,
    totalRevenue: 0,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [enabled, premiumUsers, premiumStats] = await Promise.all([
        getPremiumVisibility(),
        getPremiumUsers(),
        getPremiumStats(),
      ]);

      setPremiumEnabled(enabled);
      setUsers(premiumUsers);
      setStats(premiumStats);
    } catch (err: any) {
      console.error('Erro ao carregar premium:', err);
      setError(err?.message || 'Erro ao carregar os usuários premium');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedQuery ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery);
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [filterStatus, searchQuery, users]);

  const handleTogglePremium = async () => {
    setTogglingPremium(true);
    try {
      const next = !premiumEnabled;
      setPremiumEnabled(next);
      await setPremiumVisibility(next);
    } catch (err) {
      console.error('Erro ao alterar visibilidade premium:', err);
      setPremiumEnabled((prev) => !prev);
    } finally {
      setTogglingPremium(false);
    }
  };

  const handleRemovePremium = async (user: PremiumUser) => {
    if (!window.confirm(`Remover o status premium de "${user.name}"?`)) return;

    try {
      setActioningUserId(user.id);
      await cancelUserSubscription(user.id);
      await loadData();
    } catch (err) {
      console.error('Erro ao remover premium:', err);
    } finally {
      setActioningUserId(null);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando usuários premium...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar o premium</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Usuários Premium</h1>
        <p className="text-gray-400">Acompanhe os usuários já marcados como premium e a visibilidade do recurso no site.</p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${premiumEnabled ? 'bg-green-500/20' : 'bg-gray-700/50'}`}>
              <Shield className={`w-6 h-6 ${premiumEnabled ? 'text-green-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Visibilidade do Premium</h3>
              <p className="text-gray-400 text-sm">
                {premiumEnabled
                  ? 'Ativada. O premium está visível para os usuários no frontend.'
                  : 'Desativada. O premium está oculto no frontend.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleTogglePremium}
            disabled={togglingPremium}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
              premiumEnabled ? 'bg-primary-500' : 'bg-gray-600'
            } ${togglingPremium ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={premiumEnabled ? 'Ocultar premium' : 'Mostrar premium'}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                premiumEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-gray-400 text-sm">Total Premium</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-gray-400 text-sm">Ativos</p>
              <p className="text-2xl font-bold text-white">{stats.activeSubscribers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-gray-400 text-sm">Cancelados</p>
              <p className="text-2xl font-bold text-white">{users.filter((user) => user.status === 'cancelled').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">Conversão</p>
              <p className="text-2xl font-bold text-white">{stats.conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary-600"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | PremiumUser['status'])}
          className="bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="expired">Expirados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Nenhum usuário premium encontrado</p>
            <p className="text-gray-500 text-sm">Ajuste os filtros ou marque usuários como premium no banco.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">Usuário</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Início</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Fim</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Pagamento</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-gray-500 text-xs">{user.plan_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{user.email}</td>
                    <td className="p-4 text-gray-400">{formatDate(user.start_date)}</td>
                    <td className="p-4 text-gray-400">{formatDate(user.end_date)}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.status === 'active'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : user.status === 'expired'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-gray-700 text-gray-400 border border-gray-600'
                        }`}
                      >
                        {user.status === 'active' ? 'Ativo' : user.status === 'expired' ? 'Expirado' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{user.payment_method || 'Indisponível'}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleRemovePremium(user)}
                        disabled={actioningUserId === user.id}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                      >
                        {actioningUserId === user.id ? 'Salvando...' : 'Remover premium'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPremium;
