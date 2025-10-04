import React from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, Heart, Download, MoreHorizontal, Plus, Clock } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';

const PlaylistDetailPage: React.FC = () => {
  const { id } = useParams();
  const { currentTrack, isPlaying, play, pause } = usePlayerStore();

  // Mock playlist data
  const playlist = {
    id: parseInt(id || '1'),
    name: 'Hinos de Louvor',
    description: 'Os melhores hinos para momentos de louvor e adoração',
    coverUrl: 'https://picsum.photos/seed/playlist-detail/400/400',
    creator: 'Você',
    isPublic: true,
    followers: 1234,
    totalDuration: '2h 15min',
    songCount: 23
  };

  // Mock songs data
  const songs = [
    {
      id: 1,
      title: 'Hino 100 - Vencendo Vem Jesus',
      artist: 'Coral CCB',
      album: 'Hinos de Louvor Vol. 1',
      duration: '3:45',
      coverUrl: 'https://picsum.photos/seed/song1/100/100',
      plays: 45678,
      addedAt: '5 dias atrás'
    },
    {
      id: 2,
      title: 'Hino 50 - Saudosa Lembrança',
      artist: 'Coral CCB',
      album: 'Hinos Clássicos',
      duration: '4:12',
      coverUrl: 'https://picsum.photos/seed/song2/100/100',
      plays: 38945,
      addedAt: '1 semana atrás'
    },
    {
      id: 3,
      title: 'Hino 200 - Jerusalém Celeste',
      artist: 'Coral CCB',
      album: 'Hinos de Esperança',
      duration: '3:58',
      coverUrl: 'https://picsum.photos/seed/song3/100/100',
      plays: 52341,
      addedAt: '2 semanas atrás'
    },
    {
      id: 4,
      title: 'Hino 1 - Deus Eterno',
      artist: 'Coral CCB',
      album: 'Hinário Vol. 1',
      duration: '3:30',
      coverUrl: 'https://picsum.photos/seed/song4/100/100',
      plays: 67890,
      addedAt: '3 semanas atrás'
    },
    {
      id: 5,
      title: 'Hino 5 - Vem Pecador',
      artist: 'Coral CCB',
      album: 'Hinário Vol. 1',
      duration: '4:05',
      coverUrl: 'https://picsum.photos/seed/song5/100/100',
      plays: 43210,
      addedAt: '1 mês atrás'
    }
  ];

  const handlePlayPlaylist = () => {
    if (songs.length > 0) {
      play(songs[0]);
    }
  };

  const handlePlaySong = (song: any) => {
    play(song);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  return (
    <div className="min-h-screen">
      {/* Header with Gradient Background */}
      <div className="relative bg-gradient-to-b from-primary-900 to-background-primary pt-16 pb-6 px-6">
        <div className="flex flex-col md:flex-row gap-6 items-end max-w-7xl mx-auto">
          {/* Playlist Cover */}
          <div className="flex-shrink-0">
            <img
              src={playlist.coverUrl}
              alt={playlist.name}
              className="w-48 h-48 md:w-56 md:h-56 rounded-lg shadow-2xl"
            />
          </div>

          {/* Playlist Info */}
          <div className="flex-1 pb-4">
            <p className="text-sm font-semibold uppercase tracking-wider mb-2">Playlist</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              {playlist.name}
            </h1>
            <p className="text-white/80 text-base mb-4">{playlist.description}</p>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <span className="font-semibold">{playlist.creator}</span>
              <span>•</span>
              <span>{formatNumber(playlist.followers)} curtidas</span>
              <span>•</span>
              <span>{playlist.songCount} músicas</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline text-white/70">{playlist.totalDuration}</span>
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
        <div className="grid grid-cols-[16px_4fr_2fr_1fr_80px] md:grid-cols-[16px_6px_4fr_2fr_2fr_1fr_80px] gap-4 px-4 py-2 border-b border-white/10 text-text-muted text-sm mb-2">
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
          {songs.map((song, index) => {
            const isCurrentTrack = currentTrack?.id === song.id;
            const isCurrentPlaying = isCurrentTrack && isPlaying;

            return (
              <div
                key={song.id}
                className="grid grid-cols-[16px_4fr_2fr_1fr_80px] md:grid-cols-[16px_6px_4fr_2fr_2fr_1fr_80px] gap-4 px-4 py-3 rounded-md hover:bg-white/5 group transition-colors"
                onDoubleClick={() => handlePlaySong(song)}
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
                        onClick={() => handlePlaySong(song)}
                      />
                    </>
                  )}
                </div>

                {/* Album Cover - Desktop */}
                <div className="hidden md:flex items-center">
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

                {/* Album - Desktop */}
                <div className="hidden md:flex items-center">
                  <p className="text-text-muted text-sm truncate hover:text-white hover:underline cursor-pointer">
                    {song.album}
                  </p>
                </div>

                {/* Added At - Desktop */}
                <div className="hidden md:flex items-center">
                  <p className="text-text-muted text-sm">{song.addedAt}</p>
                </div>

                {/* Duration */}
                <div className="flex items-center justify-end">
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

        {/* Recommendations */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6">Recomendado</h2>
          <p className="text-text-muted mb-8">Baseado nesta playlist</p>
          {/* TODO: Add recommended songs component */}
        </div>
      </div>
    </div>
  );
};

export default PlaylistDetailPage;
