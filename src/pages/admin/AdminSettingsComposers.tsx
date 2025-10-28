import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Search, Edit, Trash2, Shield, Mail, Calendar, MoreVertical, Plus, UserPlus, Award, Star, AlertTriangle } from 'lucide-react';
import {
  getComposers,
  getComposerStats,
  verifyComposers,
  rejectComposers,
  deleteComposers,
  updateComposersStatus,
  Composer
} from '@/lib/admin/composersAdminApi';

interface ComposerFilters {
  search: string;
  status: string;
  verification: string;
  location: string;
}

const AdminSettingsComposers: React.FC = () => {
  const navigate = useNavigate();
  const [composers, setComposers] = useState<Composer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComposers, setSelectedComposers] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    totalSongs: 0,
    totalRoyalties: 0
  });
  const [filters, setFilters] = useState<ComposerFilters>({
    search: '',
    status: 'all',
    verification: 'all',
    location: 'all'
  });

  const statuses = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'active', label: 'Ativo', color: 'text-green-400', bg: 'bg-green-500/20' },
    { value: 'inactive', label: 'Inativo', color: 'text-gray-400', bg: 'bg-gray-500/20' },
    { value: 'verified', label: 'Verificado', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { value: 'pending', label: 'Pendente', color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
  ];

  const verificationStatuses = [
    { value: 'all', label: 'Todas as Verificações' },
    { value: 'verified', label: 'Verificado', color: 'text-green-400', bg: 'bg-green-500/20' },
    { value: 'pending', label: 'Pendente', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    { value: 'rejected', label: 'Rejeitado', color: 'text-red-400', bg: 'bg-red-500/20' }
  ];

  useEffect(() => {
    loadComposers();
    loadStats();
  }, [filters]);

  const loadComposers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { composers: fetchedComposers } = await getComposers({
        search: filters.search,
        status: filters.status !== 'all' ? filters.status : undefined,
        verification: filters.verification !== 'all' ? filters.verification : undefined,
        location: filters.location !== 'all' ? filters.location : undefined
      });
      setComposers(fetchedComposers);
    } catch (err: any) {
      console.error('Error loading composers:', err);
      setError(err?.message || 'Erro ao carregar compositores');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getComposerStats();
      setStats({
        total: statsData.total,
        verified: statsData.verified,
        pending: statsData.pending,
        totalSongs: statsData.totalSongs,
        totalRoyalties: statsData.totalRoyalties
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusStyle = (status: string) => {
    const statusConfig = statuses.find(s => s.value === status);
    return statusConfig ? `${statusConfig.color} ${statusConfig.bg}` : 'text-gray-400 bg-gray-500/20';
  };

  const getVerificationStyle = (verification: string) => {
    const verificationConfig = verificationStatuses.find(v => v.value === verification);
    return verificationConfig ? `${verificationConfig.color} ${verificationConfig.bg}` : 'text-gray-400 bg-gray-500/20';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const handleBulkAction = async (action: 'verify' | 'reject' | 'activate' | 'deactivate' | 'delete') => {
    if (selectedComposers.length === 0) {
      return;
    }

    const actionLabels = {
      verify: 'verificar',
      reject: 'rejeitar',
      activate: 'ativar',
      deactivate: 'desativar',
      delete: 'deletar'
    };

    if (!confirm(`${actionLabels[action]} ${selectedComposers.length} compositor(es)?`)) {
      return;
    }

    try {
      switch (action) {
        case 'verify':
          await verifyComposers(selectedComposers);
          break;
        case 'reject':
          await rejectComposers(selectedComposers);
          break;
        case 'delete':
          await deleteComposers(selectedComposers);
          break;
        case 'activate':
          await updateComposersStatus(selectedComposers, 'active');
          break;
        case 'deactivate':
          await updateComposersStatus(selectedComposers, 'inactive');
          break;
      }
      
      setSelectedComposers([]);
      loadComposers();
      loadStats();
    } catch (error) {
      console.error('Error in bulk action:', error);
    }
  };

  const handleComposerAction = async (composerId: string, action: 'edit' | 'delete' | 'verify' | 'reject' | 'view') => {
    try {
      switch (action) {
        case 'verify':
          break;
        case 'reject':
          break;
        case 'delete':
          if (confirm('Deletar este compositor?')) {
            loadComposers();
            loadStats();
          }
          break;
        case 'edit':
          navigate(`/admin/composers/edit/${composerId}`);
          break;
        case 'view':
          break;
      }
    } catch (error) {
      console.error('Error in composer action:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando compositores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar compositores</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadComposers()}
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
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Compositores</h1>
          <p className="text-gray-400">Administre compositores, verificações e royalties</p>
        </div>
        <div className="flex gap-2">
          {selectedComposers.length > 0 && (
            <>
              <button
                onClick={() => handleBulkAction('verify')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Verificar ({selectedComposers.length})
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Rejeitar ({selectedComposers.length})
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Deletar ({selectedComposers.length})
              </button>
            </>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
            Novo Compositor
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Music className="w-6 h-6 text-blue-400" />
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
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Verificados</p>
              <p className="text-white text-2xl font-bold">{stats.verified}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pendentes</p>
              <p className="text-white text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Músicas</p>
              <p className="text-white text-2xl font-bold">{stats.totalSongs}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-3 rounded-lg">
              <Star className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Royalties</p>
              <p className="text-white text-xl font-bold">{formatCurrency(stats.totalRoyalties)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary-600"
                placeholder="Buscar compositor..."
              />
            </div>
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
              value={filters.verification}
              onChange={(e) => setFilters({ ...filters, verification: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
            >
              {verificationStatuses.map(verification => (
                <option key={verification.value} value={verification.value}>{verification.label}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
            >
              <option value="all">Todas as Localidades</option>
              <option value="sp">São Paulo</option>
              <option value="rj">Rio de Janeiro</option>
              <option value="mg">Minas Gerais</option>
              <option value="ba">Bahia</option>
            </select>
          </div>
        </div>
      </div>

      {/* Composers Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left py-3 px-4 text-gray-300 font-medium w-12">
                  <input
                    type="checkbox"
                    checked={selectedComposers.length === composers.length && composers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedComposers(composers.map(c => c.id));
                      } else {
                        setSelectedComposers([]);
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                </th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Compositor</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Verificação</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Músicas</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Reproduções</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Royalties</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {composers.map((composer) => (
                <tr key={composer.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedComposers.includes(composer.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedComposers([...selectedComposers, composer.id]);
                        } else {
                          setSelectedComposers(selectedComposers.filter(id => id !== composer.id));
                        }
                      }}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {composer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{composer.name}</p>
                        <p className="text-gray-400 text-sm">{composer.email}</p>
                        {composer.location && (
                          <p className="text-gray-500 text-xs">{composer.location}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(composer.status)}`}>
                      {statuses.find(s => s.value === composer.status)?.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getVerificationStyle(composer.verification_status)}`}>
                        {verificationStatuses.find(v => v.value === composer.verification_status)?.label}
                      </span>
                      {composer.verification_status === 'verified' && (
                        <Shield className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-white font-medium">{composer.songs_count}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-300">{formatNumber(composer.total_plays)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-green-400 font-medium">{formatCurrency(composer.royalties_earned)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleComposerAction(composer.id, 'view')}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Ver perfil"
                      >
                        <Music className="w-4 h-4 text-blue-400" />
                      </button>
                      {composer.verification_status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleComposerAction(composer.id, 'verify')}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Verificar compositor"
                          >
                            <Shield className="w-4 h-4 text-green-400" />
                          </button>
                          <button 
                            onClick={() => handleComposerAction(composer.id, 'reject')}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Rejeitar verificação"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleComposerAction(composer.id, 'edit')}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar compositor"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                      <button 
                        onClick={() => handleComposerAction(composer.id, 'delete')}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Deletar compositor"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {composers.length === 0 && (
            <div className="text-center py-12">
              <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum compositor encontrado</p>
              <p className="text-gray-500 text-sm">Tente ajustar os filtros de busca</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsComposers;
