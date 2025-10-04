import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, Heart, MoreHorizontal, Check, Disc } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';

const ArtistPage: React.FC = () => {
  const { id } = useParams();
  const { play, currentTrack, isPlaying } = usePlayerStore();
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock artist data
  const artist = {
    id: parseInt(id || '1'),
    name: 'Coral CCB',
    image: 'https://picsum.photos/seed/artist-profile/600/600',
    coverImage: 'https://picsum.photos/seed/artist-cover/1400/400',
    followers: '1.234.567',
    monthlyListeners: '2.5M',
    verified: true,
    bio: 'O Coral da Congregação Cristã no Brasil é conhecido por sua tradição musical que remonta a mais de um século, preservando os hinos sagrados com reverência e devoção.'
  };

  // Mock popular songs
  const popularSongs = [
    {
      id: 1,
      title: 'Hino 100 - Vencendo Vem Jesus',
      plays: 12345678,
      duration: '3:45',
      coverUrl: 'https://picsum.photos/seed/song1/100/100'
    },
    {
      id: 2,
      title: 'Hino 50 - Saudosa Lembrança',
      plays: 9876543,
      duration: '4:12',
      coverUrl: 'https://picsum.photos/seed/song2/100/100'
    },
    {
      id: 3,
      title: 'Hino 200 - Jerusalém Celeste',
      plays: 8765432,
      duration: '3:58',
      coverUrl: 'https://picsum.photos/seed/song3/100/100'
    },
    {
      id: 4,
      title: 'Hino 1 - Deus Eterno',
      plays: 7654321,
      duration: '3:30',
      coverUrl: 'https://picsum.photos/seed/song4/100/100'
    },
    {
      id: 5,
      title: 'Hino 5 - Vem Pecador',
      plays: 6543210,
      duration: '4:05',
      coverUrl: 'https://picsum.photos/seed/song5/100/100'
    }
  ];

  // Mock albums/discography
  const albums = [
    {
      id: 1,
      title: 'Hinos de Louvor Vol. 1',
      year: '2023',
      coverUrl: 'https://picsum.photos/seed/album1/300/300',
      tracks: 15
    },
    {
      id: 2,
      title: 'Hinos Clássicos',
      year: '2022',
      coverUrl: 'https://picsum.photos/seed/album2/300/300',
      tracks: 20
    },
    {
      id: 3,
      title: 'Hinos de Esperança',
      year: '2022',
      coverUrl: 'https://picsum.photos/seed/album3/300/300',
      tracks: 18
    },
    {
      id: 4,
      title: 'Hinário Vol. 1',
      year: '2021',
      coverUrl: 'https://picsum.photos/seed/album4/300/300',
      tracks: 25
    }
  ];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(num);
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Section with Cover Image */}
      <div
        className="relative h-96 bg-cover bg-center"
        style={{ backgroundImage: `url(${artist.coverImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-background-primary" />
        
        <div className="relative h-full flex items-end p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 w-full max-w-7xl mx-auto">
            {/* Artist Image */}
            <img
              src={artist.image}
              alt={artist.name}
              className="w-48 h-48 rounded-full shadow-2xl border-4 border-background-primary"
            />

            {/* Artist Info */}
            <div className="flex-1 pb-2">
              {artist.verified && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                  <span className="text-sm font-semibold text-white">Artista Verificado</span>
                </div>
              )}
              <h1 className="text-5xl md:text-7xl font-black text-white mb-4">
                {artist.name}
              </h1>
              <p className="text-white/90 text-lg">
                {artist.monthlyListeners} ouvintes mensais • {artist.followers} seguidores
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-gradient-to-b from-background-primary/95 to-background-primary px-6 md:px-8 py-6 sticky top-0 z-10 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-6 max-w-7xl mx-auto">
          <button className="w-14 h-14 bg-primary-500 text-black rounded-full flex items-center justify-center hover:scale-105 hover:bg-primary-400 transition-all shadow-lg">
            <Play className="w-6 h-6 ml-1" />
          </button>

          <button
            onClick={handleFollowToggle}
            className={`px-8 py-3 rounded-full font-semibold transition-all ${
              isFollowing
                ? 'bg-transparent border-2 border-white text-white hover:border-primary-500 hover:text-primary-500'
                : 'bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black'
            }`}
          >
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </button>

          <button className="p-2 hover:scale-110 transition-transform">
            <MoreHorizontal className="w-6 h-6 text-text-muted hover:text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 md:px-8 max-w-7xl mx-auto">
        {/* Popular Songs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Populares</h2>
          <div className="space-y-2">
            {popularSongs.map((song, index) => {
              const isCurrentTrack = currentTrack?.id === song.id;
              const isCurrentPlaying = isCurrentTrack && isPlaying;

              return (
                <div
                  key={song.id}
                  className="grid grid-cols-[40px_1fr_120px_60px] md:grid-cols-[40px_1fr_120px_80px_60px] gap-4 px-4 py-3 rounded-md hover:bg-white/5 group transition-colors"
                  onDoubleClick={() => play(song)}
                >
                  {/* Rank & Play */}
                  <div className="flex items-center justify-center">
                    {isCurrentPlaying ? (
                      <Pause className="w-5 h-5 text-primary-500 cursor-pointer" />
                    ) : (
                      <>
                        <span className="group-hover:hidden text-text-muted font-medium">
                          {index + 1}
                        </span>
                        <Play
                          className="hidden group-hover:block w-5 h-5 text-white cursor-pointer"
                          onClick={() => play(song)}
                        />
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex items-center min-w-0">
                    <h4 className={`font-medium truncate ${
                      isCurrentTrack ? 'text-primary-500' : 'text-white'
                    }`}>
                      {song.title}
                    </h4>
                  </div>

                  {/* Plays */}
                  <div className="flex items-center">
                    <p className="text-text-muted text-sm">
                      {formatNumber(song.plays)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="hidden md:flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-white/10 rounded">
                      <Heart className="w-4 h-4 text-text-muted hover:text-white" />
                    </button>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center justify-end">
                    <p className="text-text-muted text-sm">{song.duration}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Discography */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Discografia</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {albums.map((album) => (
              <div key={album.id} className="group cursor-pointer">
                <div className="relative mb-4">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full aspect-square object-cover rounded-lg shadow-lg"
                  />
                  <button className="absolute bottom-2 right-2 w-12 h-12 bg-primary-500 text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:scale-105">
                    <Play className="w-5 h-5 ml-0.5" />
                  </button>
                </div>
                <h3 className="text-white font-medium mb-1 truncate">{album.title}</h3>
                <p className="text-text-muted text-sm">
                  {album.year} • {album.tracks} músicas
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Sobre</h2>
          <div className="bg-background-secondary rounded-2xl p-8 border border-gray-800">
            <div className="flex flex-col md:flex-row gap-8">
              <img
                src={artist.image}
                alt={artist.name}
                className="w-48 h-48 rounded-lg object-cover shadow-xl"
              />
              <div className="flex-1">
                <p className="text-text-muted leading-relaxed mb-6">
                  {artist.bio}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background-tertiary rounded-lg">
                    <p className="text-text-muted text-sm mb-1">Seguidores</p>
                    <p className="text-white text-2xl font-bold">{artist.followers}</p>
                  </div>
                  <div className="p-4 bg-background-tertiary rounded-lg">
                    <p className="text-text-muted text-sm mb-1">Ouvintes mensais</p>
                    <p className="text-white text-2xl font-bold">{artist.monthlyListeners}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ArtistPage;
