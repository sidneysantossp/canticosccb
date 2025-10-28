import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, Edit, Trash2, Shield, Mail, Calendar, MoreVertical, Plus, UserPlus, AlertTriangle } from 'lucide-react';
import {
  getUsers,
  getUserStats,
  updateUser,
  deleteUsers,
  updateUsersStatus,
  sendVerificationEmail,
  resetUserPassword,
  User
} from '@/lib/admin/usersAdminApi';

interface UserFilters {
  search: string;
  role: string;
  status: string;
  emailVerified: string;
}

const AdminSettingsUsers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    emailVerified: 0,
    newUsers: 0
  });
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    emailVerified: 'all'
  });

  const roles = [
    { value: 'all', label: 'Todas as Funções' },
    { value: 'admin', label: 'Administrador', color: 'text-red-400', bg: 'bg-red-500/20' },
    { value: 'moderator', label: 'Moderador', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    { value: 'user', label: 'Usuário', color: 'text-blue-400', bg: 'bg-blue-500/20' }
  ];

  const statuses = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'active', label: 'Ativo', color: 'text-green-400', bg: 'bg-green-500/20' },
    { value: 'inactive', label: 'Inativo', color: 'text-gray-400', bg: 'bg-gray-500/20' },
    { value: 'banned', label: 'Banido', color: 'text-red-400', bg: 'bg-red-500/20' }
  ];

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { users: fetchedUsers } = await getUsers({
        search: filters.search,
        role: filters.role !== 'all' ? filters.role : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        emailVerified: filters.emailVerified !== 'all' ? filters.emailVerified : undefined
      });
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err?.message || 'Erro ao carregar usu\u00e1rios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getUserStats();
      setStats({
        total: statsData.total,
        active: statsData.active,
        emailVerified: statsData.emailVerified,
        newUsers: statsData.newUsers
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Filtros já aplicados pela API
  const filteredUsers = users;

  const getRoleStyle = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig ? `${roleConfig.color} ${roleConfig.bg}` : 'text-gray-400 bg-gray-500/20';
  };

  const getStatusStyle = (status: string) => {
    const statusConfig = statuses.find(s => s.value === status);
    return statusConfig ? `${statusConfig.color} ${statusConfig.bg}` : 'text-gray-400 bg-gray-500/20';
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Nunca';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Agora mesmo';
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 30) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) {
      return;
    }

    const actionLabels = {
      activate: 'ativar',
      deactivate: 'desativar',
      delete: 'deletar'
    };

    if (!confirm(`${actionLabels[action]} ${selectedUsers.length} usuário(s)?`)) {
      return;
    }

    try {
      if (action === 'delete') {
        await deleteUsers(selectedUsers);
      } else {
        const status = action === 'activate' ? 'active' : 'inactive';
        await updateUsersStatus(selectedUsers, status);
      }
      
      setSelectedUsers([]);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Error in bulk action:', error);
    }
  };

  const handleUserAction = async (userId: string, action: 'edit' | 'delete' | 'verify' | 'reset') => {
    try {
      switch (action) {
        case 'verify':
          await sendVerificationEmail(userId);
          break;
        case 'reset':
          await resetUserPassword(userId);
          break;
        case 'delete':
          if (confirm('Deletar este usuário?')) {
            await deleteUsers([userId]);
            loadUsers();
            loadStats();
          }
          break;
        case 'edit':
          navigate(`/admin/users/edit/${userId}`);
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
          <p className="text-gray-400">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar usuários</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadUsers()}
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
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Usuários</h1>
          <p className="text-gray-400">Administre usuários, funções e permissões</p>
        </div>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <>
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Ativar ({selectedUsers.length})
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                Desativar ({selectedUsers.length})
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Deletar ({selectedUsers.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Usuários</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Usuários Ativos</p>
              <p className="text-white text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Mail className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Email Verificado</p>
              <p className="text-white text-2xl font-bold">{stats.emailVerified}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Novos (30 dias)</p>
              <p className="text-white text-2xl font-bold">{stats.newUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary-600"
                placeholder="Buscar por nome ou email..."
              />
            </div>
          </div>

          <div>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filters.emailVerified}
              onChange={(e) => setFilters({ ...filters, emailVerified: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
            >
              <option value="all">Todos</option>
              <option value="verified">Verificado</option>
              <option value="unverified">Não Verificado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left py-3 px-4 text-gray-300 font-medium w-12">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                </th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Usuário</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Função</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Último Login</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRoleStyle(user.role)}`}>
                      {roles.find(r => r.value === user.role)?.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(user.status)}`}>
                      {statuses.find(s => s.value === user.status)?.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {user.email_verified ? (
                        <span className="text-green-400 text-xs">✓ Verificado</span>
                      ) : (
                        <span className="text-red-400 text-xs">✗ Não verificado</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-300 text-sm">
                      {formatLastLogin(user.last_login)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleUserAction(user.id, 'edit')}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar usuário"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                      {!user.email_verified && (
                        <button 
                          onClick={() => handleUserAction(user.id, 'verify')}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Reenviar verificação"
                        >
                          <Mail className="w-4 h-4 text-yellow-400" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleUserAction(user.id, 'reset')}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Resetar senha"
                      >
                        <Shield className="w-4 h-4 text-blue-400" />
                      </button>
                      <button 
                        onClick={() => handleUserAction(user.id, 'delete')}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Deletar usuário"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum usuário encontrado</p>
              <p className="text-gray-500 text-sm">Tente ajustar os filtros de busca</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsUsers;
