import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Ban,
  CheckCircle,
  Crown,
  Mail,
  MoreVertical,
  UserX,
  UserCheck
} from 'lucide-react';

const AdminUsers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data
  const users = [
    {
      id: 1,
      avatar: 'https://i.pravatar.cc/150?img=1',
      name: 'João Silva',
      email: 'joao@email.com',
      plan: 'premium',
      status: 'active',
      joinDate: '2023-06-15',
      lastAccess: '2024-01-22',
      playlists: 12,
      plays: '1.5K',
      location: 'São Paulo, SP'
    },
    {
      id: 2,
      avatar: 'https://i.pravatar.cc/150?img=2',
      name: 'Maria Santos',
      email: 'maria@email.com',
      plan: 'free',
      status: 'active',
      joinDate: '2024-01-10',
      lastAccess: '2024-01-23',
      playlists: 5,
      plays: '342',
      location: 'Rio de Janeiro, RJ'
    },
    {
      id: 3,
      avatar: 'https://i.pravatar.cc/150?img=3',
      name: 'Pedro Costa',
      email: 'pedro@email.com',
      plan: 'premium',
      status: 'active',
      joinDate: '2023-03-22',
      lastAccess: '2024-01-21',
      playlists: 28,
      plays: '8.2K',
      location: 'Belo Horizonte, MG'
    },
    {
      id: 4,
      avatar: 'https://i.pravatar.cc/150?img=4',
      name: 'Ana Oliveira',
      email: 'ana@email.com',
      plan: 'free',
      status: 'suspended',
      joinDate: '2023-11-05',
      lastAccess: '2024-01-15',
      playlists: 3,
      plays: '156',
      location: 'Curitiba, PR'
    },
    {
      id: 5,
      avatar: 'https://i.pravatar.cc/150?img=5',
      name: 'Lucas Pereira',
      email: 'lucas@email.com',
      plan: 'premium',
      status: 'active',
      joinDate: '2022-08-30',
      lastAccess: '2024-01-23',
      playlists: 45,
      plays: '15.3K',
      location: 'Salvador, BA'
    }
  ];

  const getPlanBadge = (plan: string) => {
    if (plan === 'premium') {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full">
          <Crown className="w-3 h-3" />
          Premium
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs font-semibold rounded-full">
        Free
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
            <CheckCircle className="w-3 h-3" />
            Ativo
          </span>
        );
      case 'suspended':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
            <Ban className="w-3 h-3" />
            Suspenso
          </span>
        );
      case 'banned':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
            <UserX className="w-3 h-3" />
            Banido
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Usuários</h1>
          <p className="text-gray-400">Total de {users.length} usuários cadastrados</p>
        </div>
        <Link
          to="/admin/users/create"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adicionar Usuário
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Crown className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Premium</p>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => u.plan === 'premium').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-400" />
            </div>
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
            <div className="p-3 bg-red-500/20 rounded-lg">
              <UserX className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Suspensos</p>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => u.status === 'suspended').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Plan Filter */}
          <div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
            >
              <option value="all">Todos os Planos</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="suspended">Suspensos</option>
              <option value="banned">Banidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Atividade
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getPlanBadge(user.plan)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-white text-sm">{user.plays} plays</p>
                      <p className="text-gray-400 text-xs">{user.playlists} playlists</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white text-sm">{user.joinDate}</p>
                    <p className="text-gray-400 text-xs">Último acesso: {user.lastAccess}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </Link>
                      <Link
                        to={`/admin/users/${user.id}/edit`}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </Link>
                      <button
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Enviar email"
                      >
                        <Mail className="w-4 h-4 text-green-400" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Suspender"
                      >
                        <Ban className="w-4 h-4 text-yellow-400" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Mais opções"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Mostrando 1-{users.length} de {users.length} resultados
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors">
              Anterior
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg">
              1
            </button>
            <button className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors">
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
