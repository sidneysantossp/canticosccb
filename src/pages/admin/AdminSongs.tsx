import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Music,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  Play,
  Heart,
  MoreVertical
} from 'lucide-react';
import {
  getAllSongs,
  deleteSong,
  toggleSongStatus,
  toggleSongFeatured,
  Song
} from '@/lib/admin/songsAdminApi';

interface SongsFilters {
  status: 'all' | 'published' | 'draft';
  search: string;
}

const AdminSongs: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<SongsFilters>({
    status: 'all',
    search: ''
  });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    loadSongs();
  }, [currentPage, filters]);

  const loadSongs = async () => {
    try {
      setIsLoading(true);
      const result = await getAllSongs(currentPage, 20, filters);
      setSongs(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.count);
    } catch (error) {
      console.error('Error loading songs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchInput });
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: SongsFilters['status']) => {
    setFilters({ ...filters, status });
    setCurrentPage(1);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await toggleSongStatus(id, newStatus as 'draft' | 'published');
      loadSongs();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      await toggleSongFeatured(id, !currentFeatured);
      loadSongs();
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${title}"?`)) {
      return;
    }

    try {
      await deleteSong(id);
      loadSongs();
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-500/20 text-green-400 border-green-500/30',
      draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };

    const labels = {
      published: 'Publicado',
      draft: 'Rascunho',
      archived: 'Arquivado'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  // Removed page-level loading to render instantly

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Hinos</h1>
          <p className="text-gray-400">Total: {totalCount} hinos</p>
        </div>
        <Link
          to="/admin/songs/create"
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adicionar Hino
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por título ou número..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </form>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filters.status === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => handleStatusFilter('published')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filters.status === 'published'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Publicados
            </button>
            <button
              onClick={() => handleStatusFilter('draft')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filters.status === 'draft'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Rascunhos
            </button>
          </div>
        </div>
      </div>

      {/* Songs Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Hino
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Gênero
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Estatísticas
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {songs.map((song) => (
                <tr key={song.id} className="hover:bg-gray-800/30 transition-colors">
                  {/* Number */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {song.is_featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <span className="text-gray-400 font-mono">
                        {song.number || '-'}
                      </span>
                    </div>
                  </td>

                  {/* Title */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={song.cover_url || `https://picsum.photos/seed/${song.id}/100`}
                        alt={song.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-white font-semibold">{song.title}</p>
                        <p className="text-gray-400 text-sm">
                          {(song as any)?.composers?.artistic_name || (song as any)?.composers?.name || 'Sem compositor'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Genre */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-300">
                      {(song as any)?.genres?.name || '-'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(song.status)}
                  </td>

                  {/* Stats */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Play className="w-4 h-4" />
                        {(song as any)?.song_stats?.total_plays || 0}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Heart className="w-4 h-4" />
                        {(song as any)?.song_stats?.total_likes || 0}
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {/* Toggle Status */}
                      <button
                        onClick={() => handleToggleStatus(song.id, song.status)}
                        className={`p-2 rounded-lg transition-colors ${
                          song.status === 'published'
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                        title={song.status === 'published' ? 'Despublicar' : 'Publicar'}
                      >
                        {song.status === 'published' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>

                      {/* Toggle Featured */}
                      <button
                        onClick={() => handleToggleFeatured(song.id, song.is_featured)}
                        className={`p-2 rounded-lg transition-colors ${
                          song.is_featured
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                        title={song.is_featured ? 'Remover destaque' : 'Destacar'}
                      >
                        <Star className={`w-4 h-4 ${song.is_featured ? 'fill-yellow-400' : ''}`} />
                      </button>

                      {/* Edit */}
                      <Link
                        to={`/admin/songs/edit/${song.id}`}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(song.id, song.title)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {songs.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Nenhum hino encontrado</p>
            <p className="text-gray-500 text-sm">
              {filters.search || filters.status !== 'all'
                ? 'Tente ajustar os filtros'
                : 'Adicione o primeiro hino'}
            </p>
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
    </div>
  );
};

export default AdminSongs;
