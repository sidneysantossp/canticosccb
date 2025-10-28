import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Music,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Star,
  MoreVertical,
  Download
} from 'lucide-react';

const AdminSongs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Mock data - será substituído por dados reais
  const songs = [
    {
      id: 1,
      thumbnail: 'https://picsum.photos/seed/1/100',
      title: 'Hino 50 - Saudosa Lembrança',
      composer: 'Coral CCB',
      category: 'Adoração',
      genre: 'Hino',
      plays: '125.4K',
      likes: '8.2K',
      status: 'approved',
      uploadDate: '2024-01-15'
    },
    {
      id: 2,
      thumbnail: 'https://picsum.photos/seed/2/100',
      title: 'Hino 200 - Jerusalém Celeste',
      composer: 'Coral CCB',
      category: 'Louvor',
      genre: 'Hino',
      plays: '98.2K',
      likes: '6.5K',
      status: 'approved',
      uploadDate: '2024-01-14'
    },
    {
      id: 3,
      thumbnail: 'https://picsum.photos/seed/3/100',
      title: 'Hino Novo - Glória Eterna',
      composer: 'João Silva',
      category: 'Adoração',
      genre: 'Contemporâneo',
      plays: '2.5K',
      likes: '340',
      status: 'pending',
      uploadDate: '2024-01-20'
    },
    {
      id: 4,
      thumbnail: 'https://picsum.photos/seed/4/100',
      title: 'Cântico de Paz',
      composer: 'Maria Santos',
      category: 'Paz',
      genre: 'Coral',
      plays: '15.3K',
      likes: '1.2K',
      status: 'rejected',
      uploadDate: '2024-01-18'
    },
    {
      id: 5,
      thumbnail: 'https://picsum.photos/seed/5/100',
      title: 'Hino 75 - Glória ao Senhor',
      composer: 'Coral CCB',
      category: 'Glória',
      genre: 'Hino',
      plays: '87.5K',
      likes: '5.8K',
      status: 'approved',
      uploadDate: '2024-01-10'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
            <CheckCircle className="w-3 h-3" />
            Aprovado
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full">
            <Eye className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
            <XCircle className="w-3 h-3" />
            Rejeitado
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
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Hinos</h1>
          <p className="text-gray-400">Total de {songs.length} hinos cadastrados</p>
        </div>
        <Link
          to="/admin/songs/create"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adicionar Hino
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título, compositor..."
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
              <option value="approved">Aprovados</option>
              <option value="pending">Pendentes</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
            >
              <option value="all">Todas Categorias</option>
              <option value="adoracao">Adoração</option>
              <option value="louvor">Louvor</option>
              <option value="paz">Paz</option>
              <option value="gloria">Glória</option>
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
                  Hino
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Compositor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Estatísticas
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {songs.map((song) => (
                <tr key={song.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-white font-medium">{song.title}</p>
                        <p className="text-gray-400 text-sm">{song.genre}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{song.composer}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs font-medium rounded-full">
                      {song.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">
                        {song.plays} plays
                      </span>
                      <span className="text-gray-400">
                        {song.likes} likes
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(song.status)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-400 text-sm">{song.uploadDate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/songs/${song.id}`}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </Link>
                      <Link
                        to={`/admin/songs/${song.id}/edit`}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </Link>
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
            Mostrando <span className="font-semibold text-white">1</span> a{' '}
            <span className="font-semibold text-white">5</span> de{' '}
            <span className="font-semibold text-white">{songs.length}</span> resultados
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors">
              Anterior
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg">
              1
            </button>
            <button className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors">
              2
            </button>
            <button className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors">
              Próximo
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">Ações em massa</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Aprovar Selecionados
            </button>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejeitar Selecionados
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSongs;
