import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Edit, Eye, Heart, Music, Play, Plus, RefreshCw, Trash2 } from 'lucide-react';
import {
  deleteItem as deletePlaylist,
  getAll as getAllPlaylists,
  update as updatePlaylist,
  type EditorialPlaylist,
} from '@/lib/admin/playlistsAdminApi';

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'devotional', label: 'Devocional' },
  { value: 'worship', label: 'Adoração' },
  { value: 'doctrine', label: 'Doutrina' },
  { value: 'youth', label: 'Jovens' },
  { value: 'children', label: 'Infantil' },
  { value: 'special', label: 'Especial' },
  { value: 'classic', label: 'Clássico' },
] as const;

const getCategoryBadgeClass = (category: string) => {
  switch (category) {
    case 'devotional':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'worship':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'doctrine':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'youth':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'children':
      return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    case 'special':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'classic':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const AdminPlaylistsEditorial: React.FC = () => {
  const [playlists, setPlaylists] = useState<EditorialPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setPlaylists(await getAllPlaylists());
    } catch (err: any) {
      console.error('Erro ao carregar playlists editoriais:', err);
      setError(err?.message || 'Erro ao carregar playlists');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlaylists = useMemo(
    () =>
      selectedCategory === 'all'
        ? playlists
        : playlists.filter((playlist) => playlist.category === selectedCategory),
    [playlists, selectedCategory]
  );

  const stats = useMemo(
    () => ({
      total: playlists.length,
      active: playlists.filter((playlist) => playlist.is_active).length,
      featured: playlists.filter((playlist) => playlist.is_featured).length,
      totalPlays: playlists.reduce((sum, playlist) => sum + Number(playlist.plays_count || 0), 0),
    }),
    [playlists]
  );

  const handleToggleStatus = async (playlist: EditorialPlaylist) => {
    try {
      await updatePlaylist(playlist.id, { is_active: !playlist.is_active });
      setPlaylists((current) =>
        current.map((item) =>
          item.id === playlist.id ? { ...item, is_active: !item.is_active } : item
        )
      );
    } catch (err) {
      console.error('Erro ao alterar status da playlist:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!window.confirm('Deseja realmente excluir esta playlist?')) return;
      await deletePlaylist(id);
      setPlaylists((current) => current.filter((playlist) => playlist.id !== id));
    } catch (err) {
      console.error('Erro ao excluir playlist:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando playlists...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar playlists</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadData()}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Playlists Editoriais</h1>
          <p className="text-gray-400">Gerencie as playlists curadas pela equipe</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Atualizar
          </button>
          <Link
            to="/admin/playlists/criar"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nova Playlist
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Music className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Playlists</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <Eye className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Playlists Ativas</p>
              <p className="text-white text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Music className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Em Destaque</p>
              <p className="text-white text-2xl font-bold">{stats.featured}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Play className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Plays</p>
              <p className="text-white text-2xl font-bold">{stats.totalPlays.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category.value
                ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlaylists.map((playlist) => (
          <div key={playlist.id} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <div className="relative aspect-square bg-gray-800">
              <img
                src={playlist.cover_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%231a1a1a%22 width=%22300%22 height=%22300%22/%3E%3Ctext fill=%22%23666%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2214%22%3EPlaylist%3C/text%3E%3C/svg%3E'}
                alt={playlist.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                {playlist.is_featured && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                    Destaque
                  </span>
                )}
                <span
                  className={`px-2 py-1 text-xs rounded-full border ${
                    playlist.is_active
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}
                >
                  {playlist.is_active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className={`px-2 py-1 text-xs rounded-full border ${getCategoryBadgeClass(playlist.category)}`}>
                  {CATEGORIES.find((category) => category.value === playlist.category)?.label || playlist.category}
                </span>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-white font-semibold text-lg mb-1">{playlist.title}</h3>
              {playlist.description ? (
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{playlist.description}</p>
              ) : null}
              {playlist.curator_name ? (
                <p className="text-gray-500 text-xs mb-3">Por {playlist.curator_name}</p>
              ) : null}

              <div className="flex items-center gap-4 text-sm mb-4">
                <div className="flex items-center gap-1 text-gray-400">
                  <Music className="w-4 h-4" />
                  <span>{playlist.items_count} hinos</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Play className="w-4 h-4" />
                  <span>{Number(playlist.plays_count || 0).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Heart className="w-4 h-4" />
                  <span>{Number(playlist.likes_count || 0).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={playlist.is_active}
                    onChange={() => handleToggleStatus(playlist)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>

                <div className="flex gap-2">
                  <Link
                    to={`/admin/playlists/editar/${playlist.id}`}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4 text-blue-400" />
                  </Link>
                  <button
                    onClick={() => handleDelete(playlist.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPlaylists.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
          <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma playlist encontrada</p>
          <p className="text-gray-500 text-sm">Crie sua primeira playlist editorial</p>
        </div>
      )}
    </div>
  );
};

export default AdminPlaylistsEditorial;
