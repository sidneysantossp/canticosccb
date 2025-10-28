import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Heart, Download, MoreHorizontal, Search, SlidersHorizontal, Clock, HeartOff, Plus } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import useFavoritesStore, { updateFavoritesDaysAgo } from '@/stores/favoritesStore';
import SEOHead from '@/components/SEO/SEOHead';
import { useAuth } from '@/contexts/AuthContextMock';

const LikedSongsPage: React.FC = () => {
  const { currentTrack, isPlaying, play, pause } = usePlayerStore();
  const { favorites, removeFavorite, loadFavorites, isLoading } = useFavoritesStore();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'artist' | 'title'>('recent');
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const downloadPopupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const seoDescription = 'Seus hinos favoritos em um só lugar. Acesse rapidamente seus favoritos salvos.';

  // Load favorites on component mount
  useEffect(() => {
    const uid = (user as any)?.id as number | undefined;
    loadFavorites(uid);
    updateFavoritesDaysAgo();
  }, [loadFavorites, user]);

  // Use real favorites data
  const likedSongs = favorites;
  const headerThumbs = Array.from(new Set(likedSongs.map(s => s.coverUrl).filter(Boolean))).slice(0, 4);

  const filteredSongs = likedSongs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDuration = likedSongs.reduce((acc, song) => {
    const [min, sec] = song.duration.split(':').map(Number);
    return acc + (min * 60) + sec;
  }, 0);

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  const handlePlaySong = (song: any) => {
    // Converter para o formato esperado pelo player
    const trackData = {
      id: song.id.toString(), // Converter para string para consistência
      title: song.title,
      artist: song.artist,
      coverUrl: song.coverUrl,
      audioUrl: `https://example.com/audio/${song.id}.mp3`, // URL de exemplo
      duration: song.duration
    };
    play(trackData as any);
  };

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      handlePlaySong(likedSongs[0]);
    }
  };

  const handleRemoveLike = (id: number) => {
    const uid = (user as any)?.id as number | undefined;
    removeFavorite(id, uid);
  };

  const handleDownloadClick = () => {
    setShowDownloadPopup(true);
    if (downloadPopupTimer.current) clearTimeout(downloadPopupTimer.current);
    downloadPopupTimer.current = setTimeout(() => setShowDownloadPopup(false), 2200);
  };

  useEffect(() => {
    return () => {
      if (downloadPopupTimer.current) clearTimeout(downloadPopupTimer.current);
    };
  }, []);

  return (
    <div className="min-h-screen pb-24">
      {/* Header with Gradient */}
      <div className="relative bg-gradient-to-b from-purple-900 via-purple-900/40 to-background-primary pt-16 pb-6 px-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-end max-w-7xl mx-auto">
          <div className="flex-shrink-0">
            {headerThumbs.length > 0 ? (
              headerThumbs.length >= 4 ? (
                <div className="w-48 h-48 md:w-64 md:h-64 grid grid-cols-2 grid-rows-2 gap-0.5 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl ring-1 ring-white/10 shadow-2xl overflow-hidden">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="relative w-full h-full bg-black/20">
                      {headerThumbs[i] ? (
                        <img src={headerThumbs[i]} alt="Capa" className="w-full h-full object-cover" loading="lazy" />
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl ring-1 ring-white/10 shadow-2xl overflow-hidden bg-background-tertiary">
                  <img src={headerThumbs[0]} alt="Capa" className="w-full h-full object-cover" loading="lazy" />
                </div>
              )
            ) : (
              <div className="w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl ring-1 ring-white/10 shadow-2xl flex items-center justify-center">
                <Heart className="w-20 h-20 md:w-28 md:h-28 text-white fill-white" />
              </div>
            )}
          </div>

          {/* Playlist Info */}
          <div className="flex-1 pb-4">
            <p className="text-sm font-semibold uppercase tracking-wider mb-2">Playlist</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight">
              Meus Favoritos
            </h1>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <span className="font-semibold">Você</span>
              <span>•</span>
              <span>{likedSongs.length} hinos</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline text-white/70">{formatTotalDuration(totalDuration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-gradient-to-b from-background-primary/95 to-background-primary px-6 py-6 sticky top-0 z-10 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-6 max-w-7xl mx-auto">
          <button
            onClick={() => {
              if (isPlaying) {
                pause();
              } else {
                handlePlayAll();
              }
            }}
            className="w-14 h-14 bg-primary-500 text-black rounded-full flex items-center justify-center hover:scale-105 hover:bg-primary-400 transition-all shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={handleDownloadClick}
              className="p-2 hover:scale-110 transition-transform"
              title="Download"
              aria-label="Download"
            >
              <Download className="w-6 h-6 text-text-muted hover:text-white" />
            </button>
            {showDownloadPopup && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-background-secondary border border-gray-700 text-white text-xs md:text-sm px-3 py-2 rounded-md shadow-xl whitespace-nowrap z-20">
                Download indisponível no momento
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-background-secondary border-r border-b border-gray-700 rotate-45"></div>
              </div>
            )}
          </div>

          <button className="p-2 hover:scale-110 transition-transform">
            <MoreHorizontal className="w-6 h-6 text-text-muted hover:text-white" />
          </button>

          {/* Search & Filter */}
          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar nas curtidas"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-background-secondary border border-gray-700 rounded-full text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 w-32 md:w-64"
              />
            </div>

            <button className="flex items-center gap-2 px-3 md:px-4 py-2 bg-background-secondary hover:bg-background-hover border border-gray-700 rounded-full text-white transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm hidden md:inline">Ordenar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Songs Table */}
      <div className="px-6 max-w-7xl mx-auto">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[16px_48px_4fr_2fr_2fr_1fr_80px] gap-4 px-4 py-2 border-b border-white/10 text-text-muted text-sm mb-2">
          <div className="text-center">#</div>
          <div></div>
          <div>Título</div>
          <div>Álbum</div>
          <div>Adicionado em</div>
          <div className="flex items-center justify-end">
            <Clock className="w-4 h-4" />
          </div>
          <div></div>
        </div>

        {/* Songs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-text-muted">Carregando favoritos...</p>
            </div>
          </div>
        ) : likedSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Heart className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum hino favorito</h3>
            <p className="text-text-muted mb-6 max-w-md">
              Você ainda não adicionou nenhum hino aos seus favoritos. 
              Explore nossa biblioteca e clique no coração para salvar seus hinos preferidos.
            </p>
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-primary-500 text-black font-semibold rounded-full hover:bg-primary-400 transition-colors"
            >
              Explorar Hinos
            </button>
          </div>
        ) : filteredSongs.length > 0 ? (
          <div className="space-y-1">
            {filteredSongs.map((song, index) => {
              const isCurrentTrack = currentTrack?.id === song.id.toString();
              const isCurrentPlaying = isCurrentTrack && isPlaying;

              return (
                <div
                  key={song.id}
                  className="md:grid md:grid-cols-[16px_48px_4fr_2fr_2fr_1fr_80px] md:gap-4 px-4 py-3 rounded-md hover:bg-white/5 group transition-colors"
                  onDoubleClick={() => handlePlaySong(song)}
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden flex items-center justify-start gap-3 w-full">
                    {/* Album Cover */}
                    <div className="flex-shrink-0">
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    </div>

                    {/* Content - Aligned Left */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`font-medium truncate ${isCurrentTrack ? 'text-primary-500' : 'text-white'}`}>
                        {song.title}
                      </p>
                      <p className="text-text-muted text-sm truncate">{song.artist}</p>
                    </div>

                    {/* Play Button & Duration - Aligned Right */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => handleRemoveLike(song.id)}
                        className="text-primary-500 hover:text-red-500 transition-colors"
                        title="Remover dos favoritos"
                      >
                        <Heart className="w-5 h-5 fill-current" />
                      </button>
                      <span className="text-text-muted text-sm">{song.duration}</span>
                      {isCurrentPlaying ? (
                        <Pause
                          className="w-6 h-6 text-primary-500 cursor-pointer"
                          onClick={() => pause()}
                        />
                      ) : (
                        <Play
                          className={`w-6 h-6 cursor-pointer ${isCurrentTrack ? 'text-primary-500' : 'text-text-muted hover:text-white'}`}
                          onClick={() => handlePlaySong(song)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:contents">
                    {/* Track Number / Play Icon */}
                    <div className="flex items-center justify-center text-text-muted group-hover:text-white">
                      {isCurrentPlaying ? (
                        <Pause
                          className="w-4 h-4 text-primary-500 cursor-pointer"
                          onClick={() => pause()}
                        />
                      ) : (
                        <>
                          <span className={`group-hover:hidden ${isCurrentTrack ? 'text-primary-500' : ''}`}>{index + 1}</span>
                          <Play
                            className={`hidden group-hover:block w-4 h-4 cursor-pointer ${isCurrentTrack ? 'text-primary-500' : ''}`}
                            onClick={() => handlePlaySong(song)}
                          />
                        </>
                      )}
                    </div>

                    {/* Album Cover */}
                    <div className="flex items-center">
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    </div>

                    {/* Title & Artist */}
                    <div className="flex flex-col justify-center min-w-0">
                      <p className={`font-medium truncate ${isCurrentTrack ? 'text-primary-500' : 'text-white'}`}>
                        {song.title}
                      </p>
                      <p className="text-text-muted text-sm truncate">{song.artist}</p>
                    </div>

                    {/* Album */}
                    <div className="flex items-center">
                      <p className="text-text-muted text-sm truncate hover:text-white hover:underline cursor-pointer">
                        {song.album}
                      </p>
                    </div>

                    {/* Added Date */}
                    <div className="flex items-center">
                      <p className="text-text-muted text-sm">
                        {song.addedDaysAgo === 1 ? 'Ontem' : `${song.addedDaysAgo} dias atrás`}
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleRemoveLike(song.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity mr-3"
                      >
                        <Heart className="w-4 h-4 text-primary-500 fill-primary-500 hover:text-white hover:fill-white" />
                      </button>
                      <p className="text-text-muted text-sm">{song.duration}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:bg-white/10 rounded">
                        <Plus className="w-4 h-4 text-text-muted hover:text-white" />
                      </button>
                      <button className="p-1 hover:bg-white/10 rounded">
                        <MoreHorizontal className="w-4 h-4 text-text-muted hover:text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Search State */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-background-tertiary rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-text-muted" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Nenhuma música encontrada
            </h3>
            <p className="text-text-muted mb-6">
              Tente buscar com outras palavras-chave
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="btn btn-primary"
            >
              Limpar busca
            </button>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {likedSongs.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mt-12">
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-text-muted text-sm mb-1">Total de hinos</p>
                <p className="text-white text-2xl font-bold">{likedSongs.length}</p>
              </div>
              <div>
                <p className="text-text-muted text-sm mb-1">Tempo total</p>
                <p className="text-white text-2xl font-bold">{formatTotalDuration(totalDuration)}</p>
              </div>
              <div>
                <p className="text-text-muted text-sm mb-1">Artistas únicos</p>
                <p className="text-white text-2xl font-bold">
                  {new Set(likedSongs.map(s => s.artist)).size}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-sm mb-1">Última adição</p>
                <p className="text-white text-2xl font-bold">
                  {likedSongs[0].addedDaysAgo === 1 ? 'Ontem' : `${likedSongs[0].addedDaysAgo}d`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LikedSongsPage;
