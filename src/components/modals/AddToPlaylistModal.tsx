import React, { useState } from 'react';
import { X, Music, Plus } from 'lucide-react';
import usePlaylistsStore from '@/stores/playlistsStore';
import * as playlistsApi from '@/lib/playlistsApi';
import { useToast } from '@/contexts/ToastContext';

interface TrackBrief {
  id: string | number;
  title: string;
  artist: string;
  duration: string;
  coverUrl?: string;
}

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: TrackBrief | null;
  bulkTracks?: TrackBrief[];
}

export default function AddToPlaylistModal({ isOpen, onClose, track, bulkTracks }: AddToPlaylistModalProps) {
  const { playlists, addTrackToPlaylist, createPlaylist } = usePlaylistsStore();
  const { showToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const isBulk = Array.isArray(bulkTracks) && bulkTracks.length > 0;
  if (!isOpen) return null;

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      showToast('error', 'Nome inválido', 'Digite um nome para a playlist.');
      return;
    }

    try {
      setIsCreating(true);
      const newPlaylist = await createPlaylist(newPlaylistName.trim());
      
      // Adicionar tracks à nova playlist se houver
      if (isBulk && bulkTracks) {
        for (const t of bulkTracks) {
          const trackIdNum = typeof t.id === 'string' ? (isNaN(parseInt(t.id)) ? Date.now() : parseInt(t.id)) : t.id;
          addTrackToPlaylist(newPlaylist.id, {
            id: trackIdNum,
            title: t.title,
            artist: t.artist,
            duration: t.duration,
            coverUrl: t.coverUrl || '',
            backendTrackId: String(t.id)
          } as any);
        }
        onClose();
        showToast('success', 'Playlist criada', `"${newPlaylistName}" criada com ${bulkTracks.length} hinos.`);
      } else if (track) {
        const trackIdNum = typeof track.id === 'string' ? (isNaN(parseInt(track.id)) ? Date.now() : parseInt(track.id)) : track.id;
        addTrackToPlaylist(newPlaylist.id, {
          id: trackIdNum,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          coverUrl: track.coverUrl || '',
          backendTrackId: String(track.id)
        } as any);
        onClose();
        showToast('success', 'Playlist criada', `"${newPlaylistName}" criada com "${track.title}".`);
      } else {
        // Criou playlist vazia
        onClose();
        showToast('success', 'Playlist criada', `"${newPlaylistName}" criada com sucesso.`);
      }
      
      setNewPlaylistName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Erro ao criar playlist:', error);
      showToast('error', 'Erro ao criar', 'Não foi possível criar a playlist. Tente novamente.');
      setIsCreating(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      const numericId = /^\d+$/.test(String(playlistId));
      if (isBulk && bulkTracks) {
        // Adicionar vários
        for (const t of bulkTracks) {
          const trackIdNum = typeof t.id === 'string' ? (isNaN(parseInt(t.id)) ? Date.now() : parseInt(t.id)) : t.id;
          if (numericId) {
            try {
              await playlistsApi.addTrack({
                playlistId,
                trackId: t.id,
                title: t.title,
                artist: t.artist,
                duration: t.duration,
                coverUrl: t.coverUrl,
              });
            } catch {}
          }
          addTrackToPlaylist(playlistId, {
            id: trackIdNum,
            title: t.title,
            artist: t.artist,
            duration: t.duration,
            coverUrl: t.coverUrl || '',
            backendTrackId: String(t.id)
          } as any);
        }
        onClose();
        showToast('success', 'Adicionados à playlist', `${bulkTracks.length} hinos adicionados com sucesso.`);
      } else if (track) {
        const trackIdNum = typeof track.id === 'string' ? (isNaN(parseInt(track.id)) ? Date.now() : parseInt(track.id)) : track.id;
        if (numericId) {
          await playlistsApi.addTrack({
            playlistId,
            trackId: track.id,
            title: track.title,
            artist: track.artist,
            duration: track.duration,
            coverUrl: track.coverUrl,
          });
        }
        addTrackToPlaylist(playlistId, {
          id: trackIdNum,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          coverUrl: track.coverUrl || '',
          backendTrackId: String(track.id)
        } as any);
        onClose();
        showToast('success', 'Adicionada à playlist', `"${track.title}" foi adicionada com sucesso.`);
      }
    } catch (e) {
      console.error('Erro ao adicionar à playlist:', e);
      showToast('error', 'Erro ao adicionar', 'Não foi possível adicionar à playlist. Tente novamente.');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-[#124e2a] to-[#000201] rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            Adicionar à Playlist
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Track/Category Info */}
        {isBulk && bulkTracks ? (
          <p className="text-gray-300 text-sm mb-6">{bulkTracks.length} hinos serão adicionados</p>
        ) : track ? (
          <p className="text-gray-300 text-sm mb-6">{track.title}</p>
        ) : (
          <p className="text-gray-300 text-sm mb-6">Criar nova playlist</p>
        )}

        {/* Playlists List */}
        {isCreating ? (
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Nome da Playlist
              </label>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Digite o nome da playlist..."
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewPlaylistName('');
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim() || isCreating}
                className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        ) : (
          <>
            {playlists.length === 0 ? (
              <div className="text-center py-8">
                <Music className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Você ainda não tem playlists</p>
                <p className="text-gray-500 text-sm mb-4">Crie uma playlist para começar!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                      {playlist.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{playlist.name}</p>
                      <p className="text-gray-400 text-sm">{playlist.tracks.length} músicas</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setIsCreating(true)}
                className="w-full bg-primary-500 hover:bg-primary-600 text-black font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar Nova Playlist
              </button>
              
              <button
                onClick={onClose}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
