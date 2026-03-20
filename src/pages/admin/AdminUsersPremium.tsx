import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Ban, Crown, Search, ShieldAlert, UserCheck } from 'lucide-react';
import { PremiumUser, cancelUserSubscription, cleanupAllPremiumUsers, getPremiumUsers } from '@/lib/admin/premiumAdminApi';

const AdminUsersPremium: React.FC = () => {
  const [users, setUsers] = useState<PremiumUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsers(await getPremiumUsers());
    } catch (err: any) {
      console.error('Erro ao carregar usuários premium legados:', err);
      setError(err?.message || 'Erro ao carregar usuários premium legados');
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
      if (!normalizedQuery) return true;
      return user.name.toLowerCase().includes(normalizedQuery) || user.email.toLowerCase().includes(normalizedQuery);
    });
  }, [searchQuery, users]);

  const handleRemovePremium = async (user: PremiumUser) => {
    if (!window.confirm(`Mover "${user.name}" para plano gratuito?`)) return;

    try {
      setActioningUserId(user.id);
      await cancelUserSubscription(user.id);
      await loadData();
    } catch (err) {
      console.error('Erro ao remover premium legado:', err);
    } finally {
      setActioningUserId(null);
    }
  };

  const handleCleanupAll = async () => {
    if (!window.confirm('Remover o plano premium de todos os usuários legados listados?')) return;

    try {
      setCleanupLoading(true);
      await cleanupAllPremiumUsers();
      await loadData();
    } catch (err) {
      console.error('Erro na limpeza em lote de premium:', err);
    } finally {
      setCleanupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando dados legados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar dados legados</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button onClick={loadData} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Premium legado (descontinuado)</h1>
        <p className="text-gray-400">A plataforma nao opera mais assinatura premium. Esta tela existe apenas para limpeza operacional do legado.</p>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-yellow-300 mt-0.5" />
          <div>
            <h2 className="text-yellow-100 font-semibold">Modo de saneamento</h2>
            <p className="text-yellow-200/90 text-sm mt-1">
              O produto foi migrado para ativacao por cadastro apos o primeiro hino. Remova os usuarios premium antigos para consolidar o
              modelo atual.
            </p>
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

        <button
          onClick={handleCleanupAll}
          disabled={cleanupLoading || users.length === 0}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          {cleanupLoading ? 'Limpando...' : 'Limpar premium legado (todos)'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Crown className="w-7 h-7 text-yellow-400" />
            <div>
              <p className="text-gray-400 text-sm">Usuarios premium legados</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Ban className="w-7 h-7 text-red-400" />
            <div>
              <p className="text-gray-400 text-sm">Plano premium ativo</p>
              <p className="text-2xl font-bold text-white">{users.filter((user) => user.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-7 h-7 text-green-400" />
            <div>
              <p className="text-gray-400 text-sm">Meta</p>
              <p className="text-2xl font-bold text-white">0 premium</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Nenhum usuario premium legado encontrado</p>
            <p className="text-gray-400 text-sm mt-2">A limpeza do legado de premium ja esta concluida neste ambiente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">Usuario</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Status legado</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Acao</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 text-white font-medium">{user.name}</td>
                    <td className="p-4 text-gray-300">{user.email}</td>
                    <td className="p-4 text-gray-400">{user.status}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleRemovePremium(user)}
                        disabled={actioningUserId === user.id}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                      >
                        {actioningUserId === user.id ? 'Salvando...' : 'Mover para gratuito'}
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
