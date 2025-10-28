import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  MoreVertical,
  Music,
  Users,
  TrendingUp
} from 'lucide-react';

const AdminComposers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Mock data
  const composers = [
    {
      id: 1,
      avatar: 'https://i.pravatar.cc/150?img=11',
      name: 'João Silva',
      artisticName: 'João Silva',
      email: 'joao@email.com',
      type: 'Solo',
      verified: true,
      status: 'active',
      songs: 15,
      plays: '125.4K',
      followers: '8.2K',
      joinDate: '2023-01-15'
    },
    {
      id: 2,
      avatar: 'https://i.pravatar.cc/150?img=12',
      name: 'Maria Santos',
      artisticName: 'Maria Santos',
      email: 'maria@email.com',
      type: 'Solo',
      verified: true,
      status: 'active',
      songs: 22,
      plays: '245.8K',
      followers: '12.5K',
      joinDate: '2022-08-20'
    },
    {
      id: 3,
      avatar: 'https://i.pravatar.cc/150?img=13',
      name: 'Coral CCB',
      artisticName: 'Coral CCB',
      email: 'coral@ccb.com.br',
      type: 'Grupo',
      verified: true,
      status: 'active',
      songs: 456,
      plays: '8.5M',
      followers: '125.3K',
      joinDate: '2020-03-10'
    },
    {
      id: 4,
      avatar: 'https://i.pravatar.cc/150?img=14',
      name: 'Pedro Costa',
      artisticName: 'Pedro Costa',
      email: 'pedro@email.com',
      type: 'Solo',
      verified: false,
      status: 'pending',
      songs: 3,
      plays: '1.2K',
      followers: '145',
      joinDate: '2024-01-18'
    },
    {
      id: 5,
      avatar: 'https://i.pravatar.cc/150?img=15',
      name: 'Orquestra Sinfônica',
      artisticName: 'Orquestra CCB',
      email: 'orquestra@ccb.com.br',
      type: 'Orquestra',
      verified: true,
      status: 'active',
      songs: 89,
      plays: '2.3M',
      followers: '45.8K',
      joinDate: '2021-05-22'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
            <CheckCircle className="w-3 h-3" />
            Ativo
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full">
            <Eye className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'suspended':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
            <XCircle className="w-3 h-3" />
            Suspenso
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'Solo': 'bg-blue-500/20 text-blue-400',
      'Grupo': 'bg-purple-500/20 text-purple-400',
      'Orquestra': 'bg-pink-500/20 text-pink-400'
    };

    return (
      <span className={`px-2 py-1 ${colors[type] || 'bg-gray-700 text-gray-400'} text-xs font-semibold rounded-full`}>
        {type}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Compositores</h1>
          <p className="text-gray-400">Total de {composers.length} compositores cadastrados</p>
        </div>
        <Link
          to="/admin/composers/create"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adicionar Compositor
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Mic2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{composers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Verificados</p>
              <p className="text-2xl font-bold text-white">
                {composers.filter(c => c.verified).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Eye className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pendentes</p>
              <p className="text-2xl font-bold text-white">
                {composers.filter(c => c.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Music className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Hinos</p>
              <p className="text-2xl font-bold text-white">
                {composers.reduce((sum, c) => sum + c.songs, 0)}
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
                placeholder="Buscar compositor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
              />
            </div>
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
              <option value="pending">Pendentes</option>
              <option value="suspended">Suspensos</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
            >
              <option value="all">Todos os Tipos</option>
              <option value="solo">Solo</option>
              <option value="grupo">Grupo</option>
              <option value="orquestra">Orquestra</option>
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
                  Compositor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Estatísticas
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
              {composers.map((composer) => (
                <tr key={composer.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={composer.avatar}
                        alt={composer.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{composer.artisticName}</p>
                          {composer.verified && (
                            <Shield className="w-4 h-4 text-blue-400" title="Verificado" />
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{composer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getTypeBadge(composer.type)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Music className="w-3 h-3" />
                        <span>{composer.songs} hinos</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>{composer.plays} plays</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-3 h-3" />
                        <span>{composer.followers} seguidores</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(composer.status)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-400 text-sm">{composer.joinDate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/composers/${composer.id}`}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </Link>
                      <Link
                        to={`/admin/composers/${composer.id}/edit`}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </Link>
                      {!composer.verified && (
                        <button
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Verificar"
                        >
                          <Shield className="w-4 h-4 text-green-400" />
                        </button>
                      )}
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
            Mostrando 1-{composers.length} de {composers.length} resultados
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

export default AdminComposers;
