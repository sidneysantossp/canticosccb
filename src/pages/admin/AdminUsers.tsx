import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Shield, Ban, Trash2, Users, UserCheck, UserX, Edit, AlertTriangle } from 'lucide-react';
import { usuariosApi, type Usuario } from '@/lib/api-client';
import { useRealtimeUsers } from '@/hooks/useRealtimeUsers';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal from '@/components/ui/AlertModal';

interface UsersFilters {
  search: string;
  role: string;
  status: string;
}
const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, admins: 0, blocked: 0, active: 0 });
  
  const [filters, setFilters] = useState<UsersFilters>({
    search: '',
    role: 'all',
    status: 'all'
  });
  const [searchInput, setSearchInput] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userId: string; email: string }>({ isOpen: false, userId: '', email: '' });
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [currentPage, filters]);

  // Setup Realtime updates
  useRealtimeUsers({
    onUsersChange: (updatedUsers) => {
      setUsers(updatedUsers);
    },
    onStatsChange: (updatedStats) => {
      setStats(updatedStats);
    },
  });

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await usuariosApi.list({
        search: filters.search,
        page: currentPage,
        limit: 20
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        // A API retorna 'usuarios' não 'data'
        const apiData = response.data as any;
        const usersData = apiData.usuarios || [];
        setUsers(usersData);
        setTotalCount(apiData.total);
        setTotalPages(apiData.pages);
        
        // Atualizar stats com os dados da página atual
        setStats({
          total: apiData.total, // Total do backend
          admins: usersData.filter((u: Usuario) => u.tipo === 'admin').length,
          blocked: usersData.filter((u: Usuario) => !u.ativo).length,
          active: usersData.filter((u: Usuario) => u.ativo).length
        });
      }
      setError(null);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setError(error?.message || 'Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    // Função mantida para compatibilidade, mas stats são atualizados em loadUsers
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
    setCurrentPage(1);
  };

  const handleToggleBlock = async (id: string, currentBlocked: boolean) => {
    try {
      await usuariosApi.update(id, { ativo: currentBlocked ? 1 : 0 });
      loadUsers();
    } catch (error) {
      console.error('Error toggling block:', error);
    }
  };

  const handleToggleAdmin = async (id: string, currentAdmin: boolean) => {
    try {
      await usuariosApi.update(id, { tipo: currentAdmin ? 'usuario' : 'admin' });
      loadUsers();
    } catch (error) {
      console.error('Error toggling admin:', error);
    }
  };

  const handleDelete = (id: string, email: string) => {
    setDeleteModal({ isOpen: true, userId: id, email });
  };

  const confirmDelete = async () => {
    const { userId, email } = deleteModal;
    setDeleteModal({ isOpen: false, userId: '', email: '' });
    setIsDeleting(true);
    try {
      const result = await usuariosApi.delete(userId);
      if (result.success) {
        setAlertModal({ isOpen: true, title: 'Sucesso', message: 'Usuário excluído com sucesso!', type: 'success' });
        loadUsers();
      } else {
        setAlertModal({ isOpen: true, title: 'Erro', message: result.error || 'Erro desconhecido ao excluir usuário.', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setAlertModal({ isOpen: true, title: 'Erro', message: error?.message || 'Erro desconhecido ao excluir usuário.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditUser = (userId: string) => {
    navigate(`/admin/users/edit/${encodeURIComponent(userId)}`);
  };

  const renderRow = (user: Usuario) => {
    const displayName = user.nome || user.email || 'Usuário';
    const handle = user.email.split('@')[0] || 'user';
    const avatarSrc = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
    const isAdmin = user.tipo === 'admin';
    const isBlocked = !user.ativo;

    return (
      <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
        {/* User */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-white font-semibold">{displayName}</p>
              <p className="text-gray-400 text-sm">@{handle}</p>
            </div>
          </div>
        </td>

        {/* Email */}
        <td className="px-6 py-4">
          <span className="text-gray-300">{user.email}</span>
        </td>

        {/* Role */}
        <td className="px-6 py-4">
          {isAdmin ? (
            <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-purple-500/20 text-purple-400 border-purple-500/30">
              Admin
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-gray-500/20 text-gray-400 border-gray-500/30">
              Usuário
            </span>
          )}
        </td>

        {/* Status */}
        <td className="px-6 py-4">
          {isBlocked ? (
            <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-red-500/20 text-red-400 border-red-500/30">
              Bloqueado
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-green-500/20 text-green-400 border-green-500/30">
              Ativo
            </span>
          )}
        </td>

        {/* Actions */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {/* Edit */}
            <Link
              to={`/admin/users/edit/${user.id}`}
              className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors inline-flex items-center"
              title="Editar usuário"
            >
              <Edit className="w-4 h-4" />
            </Link>

            {/* Delete */}
            <button
              onClick={() => handleDelete(user.id.toString(), user.email)}
              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              title="Deletar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (isLoading && users.length === 0) {
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
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar usuários</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => { loadUsers(); loadStats(); }}
            className="btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Usuários</h1>
          <p className="text-gray-400">Total: {totalCount} usuários</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 text-sm">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          Novos usuários devem usar o cadastro público.
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
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Ativos</p>
              <p className="text-white text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Admins</p>
              <p className="text-white text-2xl font-bold">{stats.admins}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/20 p-3 rounded-lg">
              <UserX className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Bloqueados</p>
              <p className="text-white text-2xl font-bold">{stats.blocked}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por email, nome ou username..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value as any })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">Todos os papéis</option>
            <option value="admins">Admins</option>
            <option value="users">Usuários</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="blocked">Bloqueados</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Usuário
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Papel
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users && users.length > 0 ? (
                users.map(renderRow)
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    {isLoading ? 'Carregando...' : 'Nenhum usuário encontrado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {users.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Nenhum usuário encontrado</p>
            <p className="text-gray-500 text-sm">Tente ajustar os filtros</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, userId: '', email: '' })}
        onConfirm={confirmDelete}
        title="Excluir Usuário"
        message={`Tem certeza que deseja excluir o usuário ${deleteModal.email}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Modal de Resultado */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type === 'success' ? 'success' : 'error'}
        buttonText="OK"
        buttonColor={alertModal.type === 'success' ? 'green' : 'red'}
      />
    </div>
  );
};

export default AdminUsers;
