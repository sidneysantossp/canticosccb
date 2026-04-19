import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Edit,
  Eye,
  EyeOff,
  List,
  Music,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  deleteUserPlaylist,
  getAllUserPlaylists,
  getUserPlaylistById,
  removeSongFromUserPlaylist,
  toggleUserPlaylistVisibility,
  updateUserPlaylist,
  type Playlist,
  type PlaylistWithDetails,
} from '@/lib/admin/userPlaylistsAdminApi';

type EditFormState = {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  is_public: boolean;
};

const emptyEditForm: EditFormState = {
  id: '',
  name: '',
  description: '',
  cover_url: '',
  is_public: true,
};

const AdminPlaylists: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setActionError(null);
      setPlaylists(await getAllUserPlaylists());
    } catch (loadError: any) {
      console.error('Error loading user playlists:', loadError);
      setError(loadError?.message || 'Erro ao carregar playlists dos usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlaylists = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return playlists;

    return playlists.filter((playlist) =>
      [
        playlist.name,
        playlist.description,
        playlist.user_name,
        playlist.user_email,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [playlists, searchQuery]);

  const stats = useMemo(
    () => ({
      total: playlists.length,
      active: playlists.filter((playlist) => playlist.is_public).length,
      disabled: playlists.filter((playlist) => !playlist.is_public).length,
      totalSongs: playlists.reduce((sum, playlist) => sum + Number(playlist.song_count || 0), 0),
    }),
    [playlists]
  );

  const openEditModal = (playlist: Playlist) => {
    setActionError(null);
    setEditForm({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || '',
      cover_url: playlist.cover_url || '',
      is_public: playlist.is_public,
    });
    setIsEditOpen(true);
  };

  const openDetailsModal = async (playlistId: string) => {
    try {
      setActionError(null);
      const playlist = await getUserPlaylistById(playlistId);
      if (!playlist) {
        throw new Error('Playlist não encontrada.');
      }
      setSelectedPlaylist(playlist);
      setIsDetailsOpen(true);
    } catch (detailsError: any) {
      console.error('Error loading playlist details:', detailsError);
      setActionError(detailsError?.message || 'Erro ao carregar detalhes da playlist.');
    }
  };

  const handleEditSave = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setIsSaving(true);
      setActionError(null);
      await updateUserPlaylist(editForm.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        cover_url: editForm.cover_url.trim(),
        is_public: editForm.is_public,
      });

      setPlaylists((current) =>
        current.map((playlist) =>
          playlist.id === editForm.id
            ? {
                ...playlist,
                name: editForm.name.trim(),
                description: editForm.description.trim(),
                cover_url: editForm.cover_url.trim(),
                is_public: editForm.is_public,
                updated_at: new Date().toISOString(),
              }
            : playlist
        )
      );

      if (selectedPlaylist?.id === editForm.id) {
        setSelectedPlaylist((current) =>
          current
            ? {
                ...current,
                name: editForm.name.trim(),
                description: editForm.description.trim(),
                cover_url: editForm.cover_url.trim(),
                is_public: editForm.is_public,
                updated_at: new Date().toISOString(),
              }
            : current
        );
      }

      setIsEditOpen(false);
      setEditForm(emptyEditForm);
    } catch (saveError: any) {
      console.error('Error updating playlist:', saveError);
      setActionError(saveError?.message || 'Erro ao salvar playlist.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (playlist: Playlist) => {
    const nextVisibility = !playlist.is_public;
    const confirmMessage = nextVisibility
      ? `Deseja ativar a playlist "${playlist.name}"?`
      : `Deseja desativar a playlist "${playlist.name}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setActionError(null);
      await toggleUserPlaylistVisibility(playlist.id, nextVisibility);
      setPlaylists((current) =>
        current.map((item) =>
          item.id === playlist.id ? { ...item, is_public: nextVisibility } : item
        )
      );

      if (selectedPlaylist?.id === playlist.id) {
        setSelectedPlaylist((current) =>
          current ? { ...current, is_public: nextVisibility } : current
        );
      }
    } catch (toggleError: any) {
      console.error('Error toggling playlist visibility:', toggleError);
      setActionError(toggleError?.message || 'Erro ao alterar o status da playlist.');
    }
  };

  const handleDelete = async (playlist: Playlist) => {
    if (!window.confirm(`Deseja realmente excluir a playlist "${playlist.name}"?`)) return;

    try {
      setActionError(null);
      await deleteUserPlaylist(playlist.id);
      setPlaylists((current) => current.filter((item) => item.id !== playlist.id));

      if (selectedPlaylist?.id === playlist.id) {
        setSelectedPlaylist(null);
        setIsDetailsOpen(false);
      }
    } catch (deleteError: any) {
      console.error('Error deleting playlist:', deleteError);
      setActionError(deleteError?.message || 'Erro ao excluir a playlist.');
    }
  };

  const handleRemoveSong = async (songId: string, songTitle: string) => {
    if (!selectedPlaylist) return;
    if (!window.confirm(`Deseja remover "${songTitle}" desta playlist?`)) return;

    try {
      setActionError(null);
      await removeSongFromUserPlaylist(selectedPlaylist.id, songId);
      const updatedPlaylist = await getUserPlaylistById(selectedPlaylist.id);
      setSelectedPlaylist(updatedPlaylist);
      setPlaylists((current) =>
        current.map((playlist) =>
          playlist.id === selectedPlaylist.id
            ? {
                ...playlist,
                song_count: Math.max((playlist.song_count || 1) - 1, 0),
              }
            : playlist
        )
      );
    } catch (removeError: any) {
      console.error('Error removing song from playlist:', removeError);
      setActionError(removeError?.message || 'Erro ao remover hino da playlist.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando playlists dos usuários...</p>
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
            onClick={() => void loadPlaylists()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Playlists dos Usuários</h1>
          <p className="text-gray-400">Edite, desative ou exclua playlists criadas pelos usuários.</p>
        </div>
        <button
          onClick={() => void loadPlaylists()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Atualizar
        </button>
      </div>

      {actionError && (
        <div className="bg-red-500/10 border border-red-500/40 rounded-lg px-4 py-3 text-red-200">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <List className="w-6 h-6 text-blue-400" />
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
              <Eye className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Ativas</p>
              <p className="text-white text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <EyeOff className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Desativadas</p>
              <p className="text-white text-2xl font-bold">{stats.disabled}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Music className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Hinos</p>
              <p className="text-white text-2xl font-bold">{stats.totalSongs}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Buscar por playlist, descrição, nome ou email do proprietário..."
          className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-600"
        />
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Playlist</th>
                <th className="text-left p-4 text-gray-400 font-medium">Proprietário</th>
                <th className="text-left p-4 text-gray-400 font-medium">Resumo</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-right p-4 text-gray-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlaylists.map((playlist) => (
                <tr key={playlist.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                        {playlist.cover_url ? (
                          <img
                            src={playlist.cover_url}
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <List className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{playlist.name}</p>
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {playlist.description || 'Sem descrição'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-white">{playlist.user_name}</p>
                    <p className="text-gray-400 text-sm">{playlist.user_email || 'Sem email visível'}</p>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-300">{playlist.song_count || 0} hinos</p>
                      <p className="text-gray-400">
                        Atualizada em {new Date(playlist.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        playlist.is_public
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                      }`}
                    >
                      {playlist.is_public ? 'Ativa' : 'Desativada'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => void openDetailsModal(playlist.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => openEditModal(playlist)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar playlist"
                      >
                        <Edit className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button
                        onClick={() => void handleToggleStatus(playlist)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title={playlist.is_public ? 'Desativar playlist' : 'Ativar playlist'}
                      >
                        {playlist.is_public ? (
                          <EyeOff className="w-4 h-4 text-yellow-300" />
                        ) : (
                          <Eye className="w-4 h-4 text-green-400" />
                        )}
                      </button>
                      <button
                        onClick={() => void handleDelete(playlist)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Excluir playlist"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPlaylists.length === 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <List className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Nenhuma playlist encontrada</p>
          <p className="text-gray-500 text-sm">Ajuste a busca ou atualize a listagem.</p>
        </div>
      )}

      {isDetailsOpen && selectedPlaylist && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedPlaylist.name}</h2>
                <p className="text-gray-400">{selectedPlaylist.user_name}</p>
                <p className="text-gray-500 text-sm">{selectedPlaylist.user_email}</p>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Hinos</p>
                <p className="text-2xl font-bold text-white">{selectedPlaylist.songs.length}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-lg font-semibold text-white">
                  {selectedPlaylist.is_public ? 'Ativa' : 'Desativada'}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Criada em</p>
                <p className="text-lg font-semibold text-white">
                  {new Date(selectedPlaylist.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-2">Descrição</p>
              <p className="text-white">{selectedPlaylist.description || 'Sem descrição'}</p>
            </div>

            <h3 className="text-lg font-semibold text-white mb-4">Hinos da Playlist</h3>
            <div className="space-y-2">
              {selectedPlaylist.songs.length > 0 ? (
                selectedPlaylist.songs.map((song, index) => (
                  <div
                    key={`${song.song_id}-${index}`}
                    className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-mono text-sm">{index + 1}</span>
                      <div>
                        <p className="text-white font-medium">
                          {song.song_number ? `Hino ${song.song_number}` : 'Hino avulso'}
                        </p>
                        <p className="text-gray-400 text-sm">{song.song_title}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => void handleRemoveSong(song.song_id, song.song_title)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Remover da playlist"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">Playlist vazia</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Editar Playlist</h2>
                <p className="text-gray-400">Atualize os dados visíveis da playlist do usuário.</p>
              </div>
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditForm(emptyEditForm);
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                <textarea
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, description: event.target.value }))
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">URL da capa</label>
                <input
                  type="url"
                  value={editForm.cover_url}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, cover_url: event.target.value }))
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-600"
                  placeholder="https://..."
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_public}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, is_public: event.target.checked }))
                  }
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-white">Playlist ativa para os usuários</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditForm(emptyEditForm);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlaylists;
