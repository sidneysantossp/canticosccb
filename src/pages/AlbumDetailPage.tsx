import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, MoreVertical, Clock, Music, ArrowLeft, Share2, ListPlus, Info, X } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import useFavoritesStore from '@/stores/favoritesStore';
import usePlaylistsStore from '@/stores/playlistsStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContextMock';
import SEOHead from '@/components/SEO/SEOHead';
import LoginRequiredModal from '@/components/modals/LoginRequiredModal';
import { albunsApi } from '@/lib/api-client';

interface AlbumTrack {
  id: string;
  number: number;
  title: string;
  artist: string;
  duration: string;
  coverUrl: string;
  audioUrl: string;
  plays: number;
  isLiked: boolean;
  createdAt: string;
  category: string;
  lyrics?: string;
}

interface AlbumDetails {
  id: string;
  title: string;
  artist: string;
  description: string;
  coverUrl: string;
  releaseYear: string;
  totalTracks: number;
  totalDuration: string;
  tracks: AlbumTrack[];
}

const AlbumDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<AlbumDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<AlbumTrack | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const { currentTrack, isPlaying, play, pause } = usePlayerStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const { playlists, addTrackToPlaylist } = usePlaylistsStore();
  const { openFullScreen } = usePlayerContext();
  const { user } = useAuth();

  useEffect(() => {
    loadAlbumData();
  }, [id]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toMMSS = (v: string | number | undefined): string => {
    if (v == null) return '0:00';
    if (typeof v === 'string') {
      if (v.includes(':')) return v;
      const n = Number(v);
      if (!Number.isFinite(n)) return v;
      v = n;
    }
    const mins = Math.floor((v as number) / 60);
    const secs = Math.floor((v as number) % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const sumDurations = (list: string[]): string => {
    let total = 0;
    for (const s of list) {
      if (typeof s === 'string' && s.includes(':')) {
        const [m, sec] = s.split(':').map(Number);
        if (Number.isFinite(m) && Number.isFinite(sec)) total += m * 60 + sec;
      }
    }
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  const registerPlay = async (trackId: string) => {
    try {
      if (album) {
        const updatedTracks = album.tracks.map(track =>
          track.id === trackId ? { ...track, plays: (track.plays || 0) + 1 } : track
        );
        setAlbum({ ...album, tracks: updatedTracks });
      }
    } catch {}
  };

  const loadAlbumData = async () => {
    setIsLoading(true);
    try {
      if (!id) {
        console.error('ID do álbum não fornecido');
        setAlbum(null);
        return;
      }

      const albumRes = await albunsApi.get(Number(id));
      const albumRaw: any = (albumRes as any)?.data || albumRes;
      if (!albumRaw || !albumRaw.id) {
        console.error('Álbum não encontrado');
        setAlbum(null);
        return;
      }

      const tracksRes = await albunsApi.listHinos(Number(id));
      const tracksRaw: any = (tracksRes as any)?.data || tracksRes;
      const list: any[] = Array.isArray(tracksRaw?.hinos) ? tracksRaw.hinos : [];

      const artistName = (list[0]?.compositor) || 'Álbum';
      const tracks: AlbumTrack[] = list.map((h: any, idx: number) => ({
        id: String(h.id),
        number: h.ordem || h.numero || idx + 1,
        title: h.titulo,
        artist: h.compositor || artistName,
        duration: toMMSS(h.duracao),
        coverUrl: albumRaw.cover_url || h.cover_url || 'https://picsum.photos/400/400',
        audioUrl: h.audio_url || '',
        plays: 0,
        isLiked: false,
        createdAt: h.created_at || albumRaw.created_at,
        category: 'Cantados',
        lyrics: h.letra || h.lyrics || ''
      }));

      const totalDuration = sumDurations(tracks.map(t => t.duration));

      const formattedAlbum: AlbumDetails = {
        id: String(albumRaw.id),
        title: albumRaw.titulo || albumRaw.title || 'Álbum',
        artist: artistName,
        description: albumRaw.descricao || albumRaw.description || '',
        coverUrl: albumRaw.cover_url || 'https://picsum.photos/400/400',
        releaseYear: (albumRaw.ano ? String(albumRaw.ano) : (new Date(albumRaw.created_at || Date.now()).getFullYear().toString())),
        totalTracks: tracks.length,
        totalDuration,
        tracks,
      };

      setAlbum(formattedAlbum);
    } catch (error) {
      console.error('Erro ao carregar álbum:', error);
      setAlbum(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = (track: AlbumTrack) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else {
      play(track);
      // Registrar play
      registerPlay(track.id);
    }
    openFullScreen('album');
  };

  const handleTrackSelectAndOpenFullscreen = (track: AlbumTrack) => {
    if (!album) return;
    
    // Encontrar índice da faixa clicada
    const trackIndex = album.tracks.findIndex(t => t.id === track.id);
    
    if (trackIndex !== -1) {
      const { clearQueue, addToQueue, setRepeat } = usePlayerStore.getState();
      
      // Limpar fila e ativar repeat para álbum
      clearQueue();
      setRepeat('all');
      
      // Adicionar faixas seguintes à fila
      const remainingTracks = album.tracks.slice(trackIndex + 1);
      remainingTracks.forEach(t => addToQueue(t));
      
      console.log(`🎵 Tocando faixa ${trackIndex + 1}/${album.tracks.length} - ${remainingTracks.length} faixas na fila`);
    }
    
    play(track);
    // Registrar play
    registerPlay(track.id);
    openFullScreen('album');
  };

  const handlePlayAll = () => {
    if (!album || album.tracks.length === 0) return;
    
    // Ativar repeat automaticamente para álbuns
    const { setRepeat, clearQueue, addToQueue } = usePlayerStore.getState();
    setRepeat('all');
    
    // Limpar fila atual
    clearQueue();
    
    // Adicionar todas as faixas à fila (exceto a primeira que vai tocar)
    album.tracks.slice(1).forEach(track => {
      addToQueue(track);
    });
    
    // Tocar primeira faixa
    const firstTrack = album.tracks[0];
    play(firstTrack);
    
    // Registrar play da primeira faixa
    registerPlay(firstTrack.id);
    
    // Abrir fullscreen com tema de álbum
    openFullScreen('album');
    
    console.log(`🎵 Reproduzindo álbum completo: ${album.tracks.length} faixas na fila`);
  };

  const handleToggleFavorite = (trackId: string) => {
    // Verificar se o usuário está logado
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const id = parseInt(trackId);
    const uid = user?.id ? Number(user.id) : undefined;
    if (isFavorite(id)) {
      removeFavorite(id, uid);
    } else {
      const track = album?.tracks.find(t => t.id === trackId);
      if (track) {
        addFavorite({
          id,
          title: track.title,
          artist: track.artist,
          album: album?.title || 'Álbum',
          duration: track.duration,
          coverUrl: track.coverUrl
        }, uid);
      }
    }
  };

  const updateMenuPosition = (menuHeight = 0) => {
    if (!menuButtonRef.current) return;
    const rect = menuButtonRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.top + window.scrollY - menuHeight - 12,
      right: Math.max(0, window.innerWidth - rect.right - 80)
    });
  };

  useEffect(() => {
    if (!showMenu) return;

    const runUpdate = () => {
      if (menuRef.current) {
        updateMenuPosition(menuRef.current.offsetHeight);
      } else {
        updateMenuPosition();
      }
    };

    requestAnimationFrame(runUpdate);

    const handleReposition = () => runUpdate();

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [showMenu]);

  const handleToggleFavoriteAlbum = () => {
    // Verificar se o usuário está logado
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!album) return;
    const albumId = parseInt(album.id);
    const uid = user?.id ? Number(user.id) : undefined;
    if (isFavorite(albumId)) {
      removeFavorite(albumId, uid);
    } else {
      addFavorite({
        id: albumId,
        title: album.title,
        artist: album.artist,
        album: album.title,
        duration: album.totalDuration,
        coverUrl: album.coverUrl
      }, uid);
    }
  };

  const handleShareAlbum = () => {
    if (!album) return;
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: album.title,
        text: `Confira o álbum "${album.title}" de ${album.artist}`,
        url: url
      }).catch(() => {
        navigator.clipboard.writeText(url);
        alert('Link copiado para a área de transferência!');
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');
    }
    setShowMenu(false);
  };

  const handleAddToPlaylist = () => {
    // Verificar se o usuário está logado
    if (!user) {
      setShowLoginModal(true);
      setShowMenu(false);
      return;
    }

    // Verificar se há faixas no álbum
    if (!album || !album.tracks || album.tracks.length === 0) {
      console.warn('Álbum não possui faixas para adicionar');
      setShowMenu(false);
      return;
    }

    console.log('Abrindo modal de adicionar à playlist para álbum:', album.title);
    setShowMenu(false);
    setShowPlaylistModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando álbum...</p>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Álbum não encontrado</p>
          <button
            onClick={() => navigate('/albuns')}
            className="mt-4 px-6 py-2 bg-primary-500 text-black rounded-full hover:bg-primary-400 transition-colors"
          >
            Ver todos os álbuns
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${album.title} - ${album.artist}`}
        description={album.description}
        keywords={`${album.title}, ${album.artist}, álbum, hinos, CCB`}
        ogImage={album.coverUrl}
      />

      {showMenu && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setShowMenu(false)}
        ></div>
      )}

      <div className="min-h-screen bg-background pb-24">
        {/* Header com Gradiente Verde */}
        <div className="relative bg-gradient-to-b from-primary-900 via-primary-950 to-background">
          <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
            {/* Botão Voltar */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>

            <div className="flex flex-col md:flex-row gap-6 items-center md:items-end">
              {/* Cover do Álbum */}
              <div className="relative flex-shrink-0 mx-auto md:mx-0">
                <img
                  src={album.coverUrl}
                  alt={album.title}
                  className="w-48 h-48 md:w-56 md:h-56 rounded-lg shadow-2xl object-cover"
                />
              </div>

              {/* Informações do Álbum */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Music className="w-4 h-4 text-primary-400" />
                  <span className="text-xs text-gray-300 uppercase tracking-widest font-semibold">Álbum</span>
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight">
                  {album.title}
                </h1>
                <p className="text-base md:text-lg text-gray-200 mb-3 font-medium">{album.artist}</p>
                <p className="text-sm text-gray-300 mb-4 max-w-2xl leading-relaxed">{album.description}</p>
                
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="font-semibold">{album.releaseYear}</span>
                  <span className="text-gray-500">•</span>
                  <span>{album.totalTracks} faixas</span>
                  <span className="text-gray-500">•</span>
                  <span>{album.totalDuration}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Ações */}
        <div className="bg-gradient-to-b from-background to-background-secondary">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-3 px-6 py-3 bg-primary-500 text-black font-bold rounded-full hover:scale-105 transition-all shadow-lg hover:shadow-primary-500/50"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Reproduzir</span>
              </button>
              
              <button
                onClick={handleToggleFavoriteAlbum}
                className={`p-3 rounded-full hover:bg-white/10 transition-all ${
                  album && isFavorite(parseInt(album.id)) 
                    ? 'text-red-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title={album && isFavorite(parseInt(album.id)) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                <Heart className={`w-6 h-6 ${
                  album && isFavorite(parseInt(album.id)) ? 'fill-red-500' : ''
                }`} />
              </button>
              
              <div className="relative">
                <button
                  ref={menuButtonRef}
                  onClick={() => {
                    updateMenuPosition();
                    setShowMenu((prev) => !prev);
                  }}
                  className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                  title="Mais opções"
                >
                  <MoreVertical className="w-6 h-6" />
                </button>

                {/* Dropdown Menu */}
                {showMenu && album && (
                  <div
                    ref={menuRef}
                    className="fixed bg-background-tertiary border border-gray-700 rounded-lg shadow-xl z-50 w-[240px]"
                    style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                      <span className="text-xs text-gray-500 uppercase tracking-widest">Opções</span>
                      <button
                        onClick={() => setShowMenu(false)}
                        className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={handlePlayAll}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                    >
                      <Play className="w-4 h-4 text-primary-500" />
                      <span className="text-white text-sm">Reproduzir álbum</span>
                    </button>

                    <button
                      onClick={handleToggleFavoriteAlbum}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          isFavorite(parseInt(album.id)) 
                            ? 'text-red-500 fill-red-500' 
                            : 'text-gray-400'
                        }`}
                      />
                      <span className="text-white text-sm">
                        {isFavorite(parseInt(album.id)) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      </span>
                    </button>

                    <button
                      onClick={handleAddToPlaylist}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                    >
                      <ListPlus className="w-4 h-4 text-gray-400" />
                      <span className="text-white text-sm">Adicionar à playlist</span>
                    </button>

                    <button
                      onClick={handleShareAlbum}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                    >
                      <Share2 className="w-4 h-4 text-gray-400" />
                      <span className="text-white text-sm">Compartilhar álbum</span>
                    </button>

                    <div className="border-t border-gray-700"></div>

                    <div className="px-4 py-3">
                      <p className="text-xs text-gray-500">Informações</p>
                      <p className="text-xs text-gray-400 mt-1">{album.totalTracks} faixas • {album.totalDuration}</p>
                      <p className="text-xs text-gray-400">Ano: {album.releaseYear}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Faixas */}
        <div className="max-w-7xl mx-auto px-6 mt-2">
          {/* Header da Tabela */}
          <div className="grid grid-cols-[40px_1fr_80px] md:grid-cols-[40px_40px_1fr_1fr_80px] gap-4 px-4 py-3 border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider mb-2">
            <div className="text-center">#</div>
            <div className="hidden md:block"></div>
            <div>Título</div>
            <div className="hidden md:block">Artista</div>
            <div className="flex items-center justify-end">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          {/* Tracks */}
          <div className="space-y-1">
            {album.tracks.map((track, index) => (
              <div
                key={track.id}
                className={`group grid grid-cols-[40px_1fr_80px] md:grid-cols-[40px_40px_1fr_1fr_80px] gap-4 px-4 py-2 rounded-md transition-all ${
                  currentTrack?.id === track.id 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/5'
                }`}
                onClick={() => handleTrackSelectAndOpenFullscreen(track)}
              >
                {/* Número / Play Button */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => handlePlayPause(track)}
                    className="relative w-8 h-8 flex items-center justify-center"
                  >
                    <span className={`absolute text-sm ${
                      currentTrack?.id === track.id 
                        ? 'text-primary-400 font-semibold' 
                        : 'text-gray-400 group-hover:opacity-0'
                    } transition-opacity`}>
                      {index + 1}
                    </span>
                    <div className={`absolute opacity-0 group-hover:opacity-100 transition-opacity ${
                      currentTrack?.id === track.id ? 'opacity-100' : ''
                    }`}>
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Pause className="w-4 h-4 text-primary-400 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 text-white fill-current" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Cover (Desktop only) */}
                <div className="hidden md:flex items-center">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-10 h-10 rounded object-cover shadow-md"
                  />
                </div>

                {/* Título */}
                <div className="flex flex-col justify-center min-w-0">
                  <span className={`text-sm font-medium truncate ${
                    currentTrack?.id === track.id ? 'text-primary-400' : 'text-white group-hover:text-primary-400'
                  } transition-colors`}>
                    {track.title}
                  </span>
                  <span className="text-xs text-gray-400 truncate md:hidden mt-0.5">
                    {track.artist}
                  </span>
                </div>

                {/* Artista (Desktop only) */}
                <div className="hidden md:flex items-center min-w-0">
                  <span className="text-sm text-gray-400 truncate group-hover:text-white transition-colors">
                    {track.artist}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrackForPlaylist(track);
                      setShowPlaylistModal(true);
                    }}
                    className="p-1.5 rounded-full transition-all text-gray-400 opacity-0 group-hover:opacity-100 hover:text-primary-400"
                    title="Adicionar à playlist"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleFavorite(track.id)}
                    className={`p-1.5 rounded-full transition-all ${
                      isFavorite(parseInt(track.id))
                        ? 'text-primary-400 opacity-100'
                        : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite(parseInt(track.id)) ? 'fill-current' : ''}`} />
                  </button>
                  <span className="text-sm text-gray-400 min-w-[45px] text-right tabular-nums">
                    {track.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Login Necessário */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Login Necessário"
        message="Você precisa estar logado para adicionar favoritos"
      />

      {/* Modal de Seleção de Playlist */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ zIndex: 99999 }}>
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowPlaylistModal(false);
              setSelectedTrackForPlaylist(null);
            }}
          />
          
          <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mx-4 w-full max-w-md shadow-2xl border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Adicionar à Playlist</h2>
              <button
                onClick={() => {
                  setShowPlaylistModal(false);
                  setSelectedTrackForPlaylist(null);
                }}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-4">
                {selectedTrackForPlaylist 
                  ? `Adicionar "${selectedTrackForPlaylist.title}" à uma playlist:`
                  : `Selecione uma playlist para adicionar todas as ${album?.tracks?.length || 0} faixas do álbum "${album?.title}":`
                }
              </p>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => {
                        if (selectedTrackForPlaylist) {
                          // Adicionar apenas a faixa selecionada
                          addTrackToPlaylist(playlist.id, {
                            id: parseInt(selectedTrackForPlaylist.id) || 0,
                            title: selectedTrackForPlaylist.title,
                            artist: selectedTrackForPlaylist.artist,
                            duration: selectedTrackForPlaylist.duration,
                            coverUrl: selectedTrackForPlaylist.coverUrl
                          });
                          setShowPlaylistModal(false);
                          setSelectedTrackForPlaylist(null);
                          alert(`"${selectedTrackForPlaylist.title}" adicionada à playlist "${playlist.name}"!`);
                        } else {
                          // Adicionar todas as faixas do álbum à playlist
                          if (album?.tracks) {
                            album.tracks.forEach(track => {
                              addTrackToPlaylist(playlist.id, {
                                id: parseInt(track.id) || 0,
                                title: track.title,
                                artist: track.artist,
                                duration: track.duration,
                                coverUrl: track.coverUrl
                              });
                            });
                          }
                          setShowPlaylistModal(false);
                          alert(`Álbum adicionado à playlist "${playlist.name}"!`);
                        }
                      }}
                      className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
                    >
                      <div className="text-white font-medium">{playlist.name}</div>
                      <div className="text-gray-400 text-sm">{playlist.tracks?.length || 0} músicas</div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">Você ainda não tem playlists</p>
                    <p className="text-gray-500 text-sm">Crie uma playlist primeiro</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setShowPlaylistModal(false);
                setSelectedTrackForPlaylist(null);
              }}
              className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AlbumDetailPage;
