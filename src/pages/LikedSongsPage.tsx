import React, { useState } from 'react';
import { Heart, Play, Pause, Plus, Download, MoreHorizontal, Clock, Search, SlidersHorizontal } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';

const LikedSongsPage: React.FC = () => {
  const { currentTrack, isPlaying, play, pause } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'artist' | 'title'>('recent');

  // Mock liked songs data
  const likedSongs = [
    {
      id: 1,
      title: 'Hino 100 - Vencendo Vem Jesus',
      artist: 'Coral CCB',
      album: 'Hinos de Louvor Vol. 1',
      duration: '3:45',
      coverUrl: 'https://picsum.photos/seed/liked1/100/100',
      likedAt: '2024-01-15',
      addedDaysAgo: 5
    },
    {
      id: 2,
      title: 'Hino 50 - Saudosa Lembrança',
      artist: 'Coral CCB',
      album: 'Hinos Clássicos',
      duration: '4:12',
      coverUrl: 'https://picsum.photos/seed/liked2/100/100',
      likedAt: '2024-01-10',
      addedDaysAgo: 10
    },
    {
      id: 3,
      title: 'Hino 200 - Jerusalém Celeste',
      artist: 'Coral CCB',
      album: 'Hinos de Esperança',
      duration: '3:58',
      coverUrl: 'https://picsum.photos/seed/liked3/100/100',
      likedAt: '2024-01-08',
      addedDaysAgo: 12
    },
    {
      id: 4,
      title: 'Hino 1 - Deus Eterno',
      artist: 'Coral CCB',
      album: 'Hinário Vol. 1',
      duration: '3:30',
      coverUrl: 'https://picsum.photos/seed/liked4/100/100',
      likedAt: '2024-01-05',
      addedDaysAgo: 15
    },
    {
      id: 5,
      title: 'Hino 5 - Vem Pecador',
      artist: 'Coral CCB',
      album: 'Hinário Vol. 1',
      duration: '4:05',
      coverUrl: 'https://picsum.photos/seed/liked5/100/100',
      likedAt: '2024-01-01',
      addedDaysAgo: 19
    }
  ];

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

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      play(likedSongs[0]);
    }
  };

  const handleRemoveLike = (id: number) => {
    // TODO: Implement unlike functionality
    console.log('Unlike song:', id);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header with Gradient */}
      <div className="relative bg-gradient-to-b from-purple-900 via-purple-900/40 to-background-primary pt-16 pb-6 px-6">
        <div className="flex flex-col md:flex-row gap-6 items-end max-w-7xl mx-auto">
          {/* Large Heart Icon */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 md:w-56 md:h-56 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg shadow-2xl flex items-center justify-center">
              <Heart className="w-24 h-24 md:w-28 md:h-28 text-white fill-white" />
            </div>
          </div>

          {/* Playlist Info */}
          <div className="flex-1 pb-4">
            <p className="text-sm font-semibold uppercase tracking-wider mb-2">Playlist</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Músicas Curtidas
            </h1>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <span className="font-semibold">Você</span>
              <span>•</span>
              <span>{likedSongs.length} músicas</span>
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
            onClick={handlePlayAll}
            className="w-14 h-14 bg-primary-500 text-black rounded-full flex items-center justify-center hover:scale-105 hover:bg-primary-400 transition-all shadow-lg"
          >
            <Play className="w-6 h-6 ml-1" />
          </button>

          <button className="p-2 hover:scale-110 transition-transform">
            <Download className="w-6 h-6 text-text-muted hover:text-white" />
          </button>

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
                className="pl-10 pr-4 py-2 bg-background-secondary border border-gray-700 rounded-full text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
              />
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-background-secondary hover:bg-background-hover border border-gray-700 rounded-full text-white transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm">Ordenar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Songs Table */}
      <div className="px-6 max-w-7xl mx-auto">
        {/* Table Header */}
        <div className="grid grid-cols-[16px_6px_4fr_2fr_2fr_1fr_80px] gap-4 px-4 py-2 border-b border-white/10 text-text-muted text-sm mb-2">
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
        {filteredSongs.length > 0 ? (
          <div className="space-y-1">
            {filteredSongs.map((song, index) => {
              const isCurrentTrack = currentTrack?.id === song.id;
              const isCurrentPlaying = isCurrentTrack && isPlaying;

              return (
                <div
                  key={song.id}
                  className="grid grid-cols-[16px_6px_4fr_2fr_2fr_1fr_80px] gap-4 px-4 py-3 rounded-md hover:bg-white/5 group transition-colors"
                  onDoubleClick={() => play(song)}
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
                          onClick={() => play(song)}
                        />
                      </>
                    )}
                  </div>

                  {/* Album Cover */}
                  <div className="flex items-center">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-10 h-10 rounded"
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
                <p className="text-text-muted text-sm mb-1">Total de músicas</p>
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
