import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, Heart, Download, MoreHorizontal, Plus, Clock, Trash2 } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import usePlaylistsStore, { PlaylistTrack } from '@/stores/playlistsStore';
import { Hino } from '@/types';
import AddToPlaylistModal from '@/components/modals/AddToPlaylistModal';
import * as playlistsApi from '@/lib/playlistsApi';
import { useToast } from '@/contexts/ToastContext';

const PlaylistDetailPage: React.FC = () => {
  const { id } = useParams();
  const { currentTrack, isPlaying, play, pause, setPlaybackContext } = usePlayerStore();
  const { getPlaylistById, upsertPlaylist, removeTrackFromPlaylist } = usePlaylistsStore();

  const playlist = getPlaylistById(String(id || ''));
  const tracks = playlist?.tracks || [];

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<{
    id: string | number;
    title: string;
    artist: string;
    duration: string;
    coverUrl?: string;
  } | null>(null);
  const { showToast } = useToast();

  const toHino = (t: PlaylistTrack): Hino => ({
    id: String(t.id),
    title: t.title,
    number: 0,
    category: 'playlist',
    artist: t.artist,
    duration: t.duration,
    audioUrl: undefined,
    coverUrl: t.coverUrl,
    lyrics: undefined,
    plays: 0,
    isLiked: false,
    createdAt: new Date().toISOString(),
  });

  const parseDuration = (d: string) => {
    const [m, s] = d.split(':').map((x) => parseInt(x || '0', 10));
    return (isNaN(m) ? 0 : m) * 60 + (isNaN(s) ? 0 : s);
  };
  const totalSeconds = tracks.reduce((acc, t) => acc + parseDuration(t.duration || '0:00'), 0);
  const totalDuration = totalSeconds > 0
    ? `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}min`.
        replace(/^0h\s/, '')
    : '—';

  const handlePlayPlaylist = () => {
    if (tracks.length > 0) {
      setPlaybackContext({ type: 'playlist', id: String(id) });
      play(toHino(tracks[0]));
    }
  };

  const handlePlaySong = (track: PlaylistTrack) => {
    setPlaybackContext({ type: 'playlist', id: String(id) });
    play(toHino(track));
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('pt-BR').format(num);

  // Buscar playlist no backend se não estiver no store (apenas ids numéricos)
  useEffect(() => {
    const fetchIfNeeded = async () => {
      if (!id) return;
      if (playlist) return;
      const isNumeric = /^\d+$/.test(String(id));
      if (!isNumeric) return;
      try {
        const dto = await playlistsApi.get(id);
        const mapped = {
          id: String(dto.id),
          name: dto.name,
          description: dto.description || undefined,
          coverUrl: dto.cover_url || `https://picsum.photos/seed/${dto.id}/300/300`,
          tracks: (dto.tracks || []).map((t) => ({
            id: isNaN(parseInt(String(t.id))) ? Date.now() : parseInt(String(t.id)),
            title: t.title,
            artist: t.artist,
            coverUrl: t.cover_url || '',
            duration: t.duration || '0:00',
            backendTrackId: String(t.id),
          })),
          createdAt: dto.created_at,
          updatedAt: dto.updated_at,
        };
        upsertPlaylist(mapped);
      } catch (e) {
        console.error('Erro ao carregar playlist do backend:', e);
      }
    };
    fetchIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, !!playlist]);

  const handleRemoveTrack = async (track: PlaylistTrack) => {
    if (!playlist) return;
    const ok = window.confirm(`Remover "${track.title}" desta playlist?`);
    if (!ok) return;
    try {
      const isNumeric = /^\d+$/.test(String(playlist.id));
      const trackId = track.backendTrackId || String(track.id);
      if (isNumeric) {
        await playlistsApi.removeTrack({ playlistId: playlist.id, trackId });
      }
      removeTrackFromPlaylist(playlist.id, track.id);
      showToast('success', 'Removido da playlist', `"${track.title}" foi removida de "${playlist.name}".`);
    } catch (e) {
      console.error('Erro ao remover faixa:', e);
      showToast('error', 'Erro ao remover', 'Não foi possível remover a faixa. Tente novamente.');
    }
  };

  return (
    <>
    <div className="min-h-screen">
      {/* Header with Gradient Background */}
      <div className="relative bg-gradient-to-b from-primary-900 to-background-primary pt-16 pb-6 px-6">
        <div className="flex flex-col md:flex-row gap-6 items-end max-w-7xl mx-auto">
          {/* Playlist Cover */}
          <div className="flex-shrink-0">
            <img
              src={playlist?.coverUrl || 'https://placehold.co/400x400/1a1a1a/green?text=Playlist'}
              alt={playlist?.name || 'Playlist'}
              className="w-48 h-48 md:w-56 md:h-56 rounded-lg shadow-2xl object-cover"
            />
          </div>

          {/* Playlist Info */}
          <div className="flex-1 pb-4">
            <p className="text-sm font-semibold uppercase tracking-wider mb-2">Playlist</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              {playlist?.name || 'Playlist'}
            </h1>
            <p className="text-white/80 text-base mb-4">{playlist?.description}</p>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <span className="font-semibold">Você</span>
              <span>•</span>
              <span>{tracks.length} {tracks.length === 1 ? 'hino' : 'hinos'}</span>
              {totalDuration !== '—' && (
                <>
                  <span className="hidden md:inline">•</span>
                  <span className="hidden md:inline text-white/70">{totalDuration}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-gradient-to-b from-background-primary/95 to-background-primary px-6 py-6 sticky top-0 z-10 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-6 max-w-7xl mx-auto">
          <button
            onClick={handlePlayPlaylist}
            className="w-14 h-14 bg-primary-500 text-black rounded-full flex items-center justify-center hover:scale-105 hover:bg-primary-400 transition-all shadow-lg"
          >
            <Play className="w-6 h-6 ml-1" />
          </button>

          <button className="p-2 hover:scale-110 transition-transform">
            <Heart className="w-7 h-7 text-text-muted hover:text-white" />
          </button>

          <button className="p-2 hover:scale-110 transition-transform">
            <Download className="w-6 h-6 text-text-muted hover:text-white" />
          </button>

          <button className="p-2 hover:scale-110 transition-transform">
            <MoreHorizontal className="w-6 h-6 text-text-muted hover:text-white" />
          </button>
        </div>
      </div>

      {/* Songs Table */}
      <div className="px-6 pb-24 max-w-7xl mx-auto">
        {/* Table Header */}
        <div className="grid grid-cols-[16px_4fr_2fr_1fr_80px] md:grid-cols-[16px_48px_4fr_2fr_2fr_1fr_80px] gap-4 px-4 py-2 border-b border-white/10 text-text-muted text-sm mb-2">
          <div className="text-center">#</div>
          <div className="hidden md:block"></div>
          <div>Título</div>
          <div className="hidden md:block">Álbum</div>
          <div className="hidden md:block">Adicionado</div>
          <div className="flex items-center justify-end">
            <Clock className="w-4 h-4" />
          </div>
          <div></div>
        </div>

        {/* Songs List */}
        <div className="space-y-1">
          {tracks.map((track, index) => {
            const isCurrentTrack = String(currentTrack?.id || '') === String(track.id);
            const isCurrentPlaying = isCurrentTrack && isPlaying;

            return (
              <div
                key={track.id}
                className="grid grid-cols-[16px_4fr_2fr_1fr_80px] md:grid-cols-[16px_48px_4fr_2fr_2fr_1fr_80px] gap-4 px-4 py-3 rounded-md hover:bg-white/5 group transition-colors"
                onDoubleClick={() => handlePlaySong(track)}
              >
                {/* Track Number / Play Icon */}
                <div className="flex items-center justify-center text-text-muted group-hover:text-white">
                  {isCurrentPlaying ? (
                    <Pause
                      className="w-4 h-4 text-primary-500 cursor-pointer"
                      onClick={() => pause()}
                    />
                  ) : (
                    <>
                      <span className="group-hover:hidden">{index + 1}</span>
                      <Play
                        className="hidden group-hover:block w-4 h-4 cursor-pointer"
                        onClick={() => handlePlaySong(track)}
                      />
                    </>
                  )}
                </div>

                {/* Album Cover - Desktop */}
                <div className="hidden md:flex items-center">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                </div>

                {/* Title & Artist */}
                <div className="flex flex-col justify-center min-w-0">
                  <p className={`font-medium truncate ${isCurrentTrack ? 'text-primary-500' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-text-muted text-sm truncate">{track.artist}</p>
                </div>

                {/* Album - Desktop */}
                <div className="hidden md:flex items-center">
                  <p className="text-text-muted text-sm truncate hover:text-white hover:underline cursor-pointer">
                    —
                  </p>
                </div>

                {/* Added At - Desktop */}
                <div className="hidden md:flex items-center">
                  <p className="text-text-muted text-sm">—</p>
                </div>

                {/* Duration */}
                <div className="flex items-center justify-end">
                  <p className="text-text-muted text-sm">{track.duration}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1 hover:bg-white/10 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTrack(track);
                    }}
                    title="Remover da playlist"
                  >
                    <Trash2 className="w-4 h-4 text-text-muted hover:text-white" />
                  </button>
                  <button
                    className="p-1 hover:bg-white/10 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrack({
                        id: track.id,
                        title: track.title,
                        artist: track.artist,
                        duration: track.duration,
                        coverUrl: track.coverUrl,
                      });
                      setShowPlaylistModal(true);
                    }}
                    title="Adicionar à playlist"
                  >
                    <Plus className="w-4 h-4 text-text-muted hover:text-white" />
                  </button>
                  <button className="p-1 hover:bg-white/10 rounded">
                    <MoreHorizontal className="w-4 h-4 text-text-muted hover:text-white" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6">Recomendado</h2>
          <p className="text-text-muted mb-8">Baseado nesta playlist</p>
          {/* TODO: Add recommended songs component */}
        </div>
      </div>
    </div>
    <AddToPlaylistModal
      isOpen={showPlaylistModal}
      onClose={() => {
        setShowPlaylistModal(false);
        setSelectedTrack(null);
      }}
      track={selectedTrack}
    />
    </>
  );

  
};

export default PlaylistDetailPage;
