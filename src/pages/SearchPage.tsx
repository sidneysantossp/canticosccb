import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Play, Music, Mic, Disc, List } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';

const SearchPage: React.FC = () => {
  const { play } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'songs' | 'artists' | 'playlists'>('all');

  // Mock search results
  const searchResults = {
    songs: [
      {
        id: 1,
        title: 'Hino 100 - Vencendo Vem Jesus',
        artist: 'Coral CCB',
        album: 'Hinos de Louvor',
        duration: '3:45',
        coverUrl: 'https://picsum.photos/seed/search1/100/100'
      },
      {
        id: 2,
        title: 'Hino 50 - Saudosa Lembrança',
        artist: 'Coral CCB',
        album: 'Hinos Clássicos',
        duration: '4:12',
        coverUrl: 'https://picsum.photos/seed/search2/100/100'
      },
      {
        id: 3,
        title: 'Hino 200 - Jerusalém Celeste',
        artist: 'Coral CCB',
        album: 'Hinos de Esperança',
        duration: '3:58',
        coverUrl: 'https://picsum.photos/seed/search3/100/100'
      }
    ],
    artists: [
      {
        id: 1,
        name: 'Coral CCB',
        followers: '1.2M',
        image: 'https://picsum.photos/seed/artist1/150/150'
      },
      {
        id: 2,
        name: 'Orquestra CCB',
        followers: '856K',
        image: 'https://picsum.photos/seed/artist2/150/150'
      }
    ],
    playlists: [
      {
        id: 1,
        name: 'Hinos Essenciais',
        description: 'Os hinos mais populares',
        songCount: 50,
        image: 'https://picsum.photos/seed/playlist1/150/150'
      },
      {
        id: 2,
        name: 'Louvor e Adoração',
        description: 'Para momentos de conexão',
        songCount: 35,
        image: 'https://picsum.photos/seed/playlist2/150/150'
      }
    ]
  };

  const recentSearches = [
    'Hino 100',
    'Vencendo Vem Jesus',
    'Coral CCB',
    'Hinos de Louvor'
  ];

  const popularSearches = [
    { term: 'Hinos Clássicos', icon: '📖' },
    { term: 'Louvor', icon: '🙏' },
    { term: 'Adoração', icon: '❤️' },
    { term: 'Instrumental', icon: '🎹' },
    { term: 'Coral', icon: '🎤' },
    { term: 'Oração', icon: '🕊️' }
  ];

  const filters = [
    { id: 'all', label: 'Tudo', icon: List },
    { id: 'songs', label: 'Músicas', icon: Music },
    { id: 'artists', label: 'Artistas', icon: Mic },
    { id: 'playlists', label: 'Playlists', icon: Disc }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement actual search functionality
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const filteredResults = {
    songs: activeFilter === 'all' || activeFilter === 'songs' ? searchResults.songs : [],
    artists: activeFilter === 'all' || activeFilter === 'artists' ? searchResults.artists : [],
    playlists: activeFilter === 'all' || activeFilter === 'playlists' ? searchResults.playlists : []
  };

  const hasResults = searchQuery.length > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="O que você quer ouvir?"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-background-secondary border border-gray-700 rounded-full text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {hasResults && (
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? 'bg-primary-500 text-black'
                    : 'bg-background-secondary text-white hover:bg-background-hover'
                }`}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Search Results */}
      {hasResults ? (
        <div className="space-y-12">
          {/* Songs */}
          {filteredResults.songs.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Músicas</h2>
              <div className="space-y-2">
                {filteredResults.songs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors group"
                  >
                    <div className="relative">
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-14 h-14 rounded"
                      />
                      <button
                        onClick={() => play(song)}
                        className="absolute inset-0 bg-black/50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{song.title}</h3>
                      <p className="text-text-muted text-sm truncate">{song.artist}</p>
                    </div>
                    <span className="text-text-muted text-sm">{song.duration}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Artists */}
          {filteredResults.artists.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Artistas</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredResults.artists.map((artist) => (
                  <Link
                    key={artist.id}
                    to={`/artist/${artist.id}`}
                    className="group"
                  >
                    <div className="relative mb-4">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-full aspect-square object-cover rounded-full shadow-lg"
                      />
                      <button className="absolute bottom-2 right-2 w-12 h-12 bg-primary-500 text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:scale-105">
                        <Play className="w-5 h-5 ml-0.5" />
                      </button>
                    </div>
                    <h3 className="text-white font-medium text-center mb-1">{artist.name}</h3>
                    <p className="text-text-muted text-sm text-center">Artista • {artist.followers} seguidores</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Playlists */}
          {filteredResults.playlists.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Playlists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredResults.playlists.map((playlist) => (
                  <Link
                    key={playlist.id}
                    to={`/playlist/${playlist.id}`}
                    className="group"
                  >
                    <div className="relative mb-4">
                      <img
                        src={playlist.image}
                        alt={playlist.name}
                        className="w-full aspect-square object-cover rounded-lg shadow-lg"
                      />
                      <button className="absolute bottom-2 right-2 w-12 h-12 bg-primary-500 text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:scale-105">
                        <Play className="w-5 h-5 ml-0.5" />
                      </button>
                    </div>
                    <h3 className="text-white font-medium mb-1 truncate">{playlist.name}</h3>
                    <p className="text-text-muted text-sm truncate">{playlist.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* No Search - Show Suggestions */
        <div className="space-y-12">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Buscas recentes</h2>
              <div className="space-y-2">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(term)}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors group w-full text-left"
                  >
                    <div className="w-12 h-12 bg-background-tertiary rounded flex items-center justify-center">
                      <Search className="w-5 h-5 text-text-muted" />
                    </div>
                    <span className="text-white font-medium flex-1">{term}</span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-5 h-5 text-text-muted hover:text-white" />
                    </button>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Popular Searches */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Busque por categoria</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {popularSearches.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(item.term)}
                  className="p-6 bg-gradient-to-br from-primary-900/40 to-background-secondary rounded-xl hover:from-primary-900/60 hover:to-background-hover transition-all group"
                >
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="text-white font-semibold text-lg">{item.term}</h3>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
