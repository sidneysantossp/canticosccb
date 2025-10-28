import React, { useState, useEffect } from 'react';
import { List, Search, Eye, EyeOff, Trash2, Users, Music, X } from 'lucide-react';
import {
  getAllPlaylists,
  getPlaylistById,
  togglePlaylistVisibility,
  deletePlaylist,
  removeSongFromPlaylist,
  Playlist,
  PlaylistWithDetails
} from '@/lib/admin/playlistsAdminApi';

const AdminPlaylists: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setIsLoading(true);
      const data = await getAllPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPlaylist = async (id: string) => {
    try {
      const data = await getPlaylistById(id);
      setSelectedPlaylist(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error loading playlist details:', error);
    }
  };

  const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
    try {
      await togglePlaylistVisibility(id, !currentStatus);
      await loadPlaylists();
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Deletar playlist "${name}"?`)) return;

    try {
      await deletePlaylist(id);
      await loadPlaylists();
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const handleRemoveSong = async (songId: string, songTitle?: string) => {
    if (!selectedPlaylist) return;
    if (!window.confirm(`Remover "${songTitle || 'música'}" da playlist?`)) return;

    try {
      await removeSongFromPlaylist(selectedPlaylist.id, songId);
      const updated = await getPlaylistById(selectedPlaylist.id);
      setSelectedPlaylist(updated);
    } catch (error) {
      console.error('Error removing song:', error);
    }
  };

  const filteredPlaylists = playlists.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Playlists dos Usuários</h1>
        <p className="text-gray-400">Total de {playlists.length} playlists</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <List className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">Total de Playlists</p>
              <p className="text-2xl font-bold text-white">{playlists.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-gray-400 text-sm">Públicas</p>
              <p className="text-2xl font-bold text-white">
                {playlists.filter(p => p.is_public).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-gray-400 text-sm">Total de Músicas</p>
              <p className="text-2xl font-bold text-white">
                {playlists.reduce((sum, p) => sum + (p.song_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar playlist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-600"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Playlist</th>
                <th className="text-left p-4 text-gray-400 font-medium">Proprietário</th>
                <th className="text-left p-4 text-gray-400 font-medium">Estatísticas</th>
                <th className="text-left p-4 text-gray-400 font-medium">Visibilidade</th>
                <th className="text-right p-4 text-gray-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlaylists.map((playlist) => (
                <tr key={playlist.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                  <td className="p-4">
                    <p className="text-white font-medium">{playlist.name}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(playlist.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-white">{playlist.user_name}</p>
                    <p className="text-gray-400 text-sm">{playlist.user_email}</p>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-400">{playlist.song_count || 0} músicas</p>
                      <p className="text-gray-400">{playlist.followers_count || 0} seguidores</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        playlist.is_public
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-700 text-gray-400 border border-gray-600'
                      }`}
                    >
                      {playlist.is_public ? 'Pública' : 'Privada'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewPlaylist(playlist.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(playlist.id, playlist.is_public)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title={playlist.is_public ? 'Tornar privada' : 'Tornar pública'}
                      >
                        {playlist.is_public ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-green-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(playlist.id, playlist.name)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Deletar"
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

      {/* Empty State */}
      {filteredPlaylists.length === 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <List className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Nenhuma playlist encontrada</p>
          <p className="text-gray-500 text-sm">Ajuste os filtros de busca</p>
        </div>
      )}

      {/* Modal de Detalhes */}
      {isModalOpen && selectedPlaylist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedPlaylist.name}</h2>
                <p className="text-gray-400">{selectedPlaylist.user_name}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Músicas</p>
                <p className="text-2xl font-bold text-white">{selectedPlaylist.songs?.length || 0}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Visibilidade</p>
                <p className="text-lg font-semibold text-white">
                  {selectedPlaylist.is_public ? 'Pública' : 'Privada'}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Criada em</p>
                <p className="text-lg font-semibold text-white">
                  {new Date(selectedPlaylist.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-4">Músicas da Playlist</h3>
            <div className="space-y-2">
              {selectedPlaylist.songs && selectedPlaylist.songs.length > 0 ? (
                selectedPlaylist.songs.map((song, index) => (
                  <div
                    key={song.id}
                    className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-mono text-sm">{index + 1}</span>
                      <div>
                        <p className="text-white font-medium">
                          {song.song_number ? `Hino ${song.song_number}` : 'Hino'}
                        </p>
                        <p className="text-gray-400 text-sm">{song.song_title}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSong(song.song_id, song.song_title)}
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
    </div>
  );
};

export default AdminPlaylists;
