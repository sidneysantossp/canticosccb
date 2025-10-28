import React, { useState } from 'react';
import { Crown, Search, Mail, Calendar, X, CheckCircle, XCircle } from 'lucide-react';

interface PremiumUser {
  id: string;
  name: string;
  email: string;
  plan: 'premium';
  subscriptionDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'cancelled';
  paymentMethod: string;
  totalPaid: number;
}

const AdminUsersPremium: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [users] = useState<PremiumUser[]>([
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@email.com',
      plan: 'premium',
      subscriptionDate: '2025-01-15',
      expiryDate: '2026-01-15',
      status: 'active',
      paymentMethod: 'Cartão de Crédito',
      totalPaid: 199.90
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@email.com',
      plan: 'premium',
      subscriptionDate: '2024-12-01',
      expiryDate: '2025-12-01',
      status: 'active',
      paymentMethod: 'PIX',
      totalPaid: 179.90
    },
    {
      id: '3',
      name: 'Pedro Costa',
      email: 'pedro@email.com',
      plan: 'premium',
      subscriptionDate: '2024-06-10',
      expiryDate: '2025-01-01',
      status: 'expired',
      paymentMethod: 'Boleto',
      totalPaid: 149.90
    }
  ]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCancelSubscription = (id: string, name: string) => {
    if (!window.confirm(`Cancelar assinatura de "${name}"?`)) return;
    console.log('Assinatura cancelada para:', id, name);
  };

  const handleExtendSubscription = (id: string, name: string) => {
    console.log('Assinatura estendida para:', id, name);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Usuários Premium</h1>
        <p className="text-gray-400">Gerencie assinaturas e usuários premium</p>
      </div>

      {/* Stats */}
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
              <p className="text-2xl font-bold text-white">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-gray-400 text-sm">Expirados</p>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => u.status === 'expired').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">Receita Total</p>
              <p className="text-2xl font-bold text-white">
                R$ {users.reduce((sum, u) => sum + u.totalPaid, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
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
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="expired">Expirados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Usuário</th>
                <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                <th className="text-left p-4 text-gray-400 font-medium">Assinatura</th>
                <th className="text-left p-4 text-gray-400 font-medium">Validade</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Pagamento</th>
                <th className="text-left p-4 text-gray-400 font-medium">Total Pago</th>
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
                      <span className="text-white font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(user.subscriptionDate).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="p-4 text-gray-400">
                    {new Date(user.expiryDate).toLocaleDateString('pt-BR')}
                  </td>
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
                  <td className="p-4 text-gray-400">{user.paymentMethod}</td>
                  <td className="p-4 text-green-400 font-semibold">
                    R$ {user.totalPaid.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {user.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleExtendSubscription(user.id, user.name)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Estender
                          </button>
                          <button
                            onClick={() => handleCancelSubscription(user.id, user.name)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {user.status === 'expired' && (
                        <button
                          onClick={() => console.log('Reativar assinatura em breve')}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Reativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Nenhum usuário premium encontrado</p>
          <p className="text-gray-500 text-sm">Ajuste os filtros de busca</p>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPremium;
