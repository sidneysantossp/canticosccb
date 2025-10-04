import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, Plus, Search, Grid, List, MoreHorizontal } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';

const LibraryPage: React.FC = () => {
  const { play } = usePlayerStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for playlists and liked songs
  const playlists = [
    {
      id: 1,
      name: 'Meus Favoritos',
      description: 'Suas músicas curtidas',
      coverUrl: 'https://picsum.photos/seed/liked/300/300',
      songCount: 47,
      type: 'liked',
      isOwner: true
    },
    {
      id: 2,
      name: 'Hinos de Louvor',
      description: 'Criada por você • 23 músicas',
      coverUrl: 'https://picsum.photos/seed/louvor/300/300',
      songCount: 23,
      type: 'playlist',
      isOwner: true
    },
    {
      id: 3,
      name: 'Hinos Clássicos',
      description: 'Criada por você • 31 músicas',
      coverUrl: 'https://picsum.photos/seed/classicos/300/300',
      songCount: 31,
      type: 'playlist',
      isOwner: true
    },
    {
      id: 4,
      name: 'Coral CCB - Essenciais',
      description: 'Por Coral CCB • 45 músicas',
      coverUrl: 'https://picsum.photos/seed/essenciais/300/300',
      songCount: 45,
      type: 'playlist',
      isOwner: false
    },
    {
      id: 5,
      name: 'Reflexão e Oração',
      description: 'Criada por você • 18 músicas',
      coverUrl: 'https://picsum.photos/seed/reflexao/300/300',
      songCount: 18,
      type: 'playlist',
      isOwner: true
    },
    {
      id: 6,
      name: 'Hinos Instrumentais',
      description: 'Criada por você • 26 músicas',
      coverUrl: 'https://picsum.photos/seed/instrumental/300/300',
      songCount: 26,
      type: 'playlist',
      isOwner: true
    }
  ];

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayPlaylist = (playlist: any) => {
    // TODO: Implement playlist play functionality
    console.log('Playing playlist:', playlist.name);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sua Biblioteca</h1>
          <p className="text-text-muted">
            {filteredPlaylists.length} {filteredPlaylists.length === 1 ? 'playlist' : 'playlists'}
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar na biblioteca"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-background-tertiary border border-gray-700 rounded-full text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-background-tertiary rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-background-hover text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-background-hover text-white' : 'text-text-muted hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Playlist Button */}
      <div className="mb-8">
        <button className="flex items-center gap-3 p-4 bg-background-secondary hover:bg-background-hover rounded-lg transition-colors group">
          <div className="w-12 h-12 bg-background-tertiary rounded-lg flex items-center justify-center group-hover:bg-background-hover">
            <Plus className="w-6 h-6 text-text-muted group-hover:text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">Criar playlist</h3>
            <p className="text-text-muted text-sm">É fácil, vamos te ajudar</p>
          </div>
        </button>
      </div>

      {/* Playlists Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredPlaylists.map((playlist) => (
            <div key={playlist.id} className="group cursor-pointer">
              <div className="relative mb-4">
                <img
                  src={playlist.coverUrl}
                  alt={playlist.name}
                  className="w-full aspect-square object-cover rounded-lg shadow-lg"
                />
                <button
                  onClick={() => handlePlayPlaylist(playlist)}
                  className="absolute bottom-2 right-2 w-12 h-12 bg-primary-500 text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:scale-105"
                >
                  <Play className="w-5 h-5 ml-0.5" />
                </button>
              </div>
              <Link to={`/playlist/${playlist.id}`}>
                <h3 className="text-white font-medium truncate mb-1 hover:underline">
                  {playlist.name}
                </h3>
                <p className="text-text-muted text-sm truncate">
                  {playlist.description}
                </p>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPlaylists.map((playlist, index) => (
            <div
              key={playlist.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors group"
            >
              {/* Cover */}
              <div className="relative">
                <img
                  src={playlist.coverUrl}
                  alt={playlist.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <button
                  onClick={() => handlePlayPlaylist(playlist)}
                  className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link to={`/playlist/${playlist.id}`}>
                  <h3 className="text-white font-medium truncate hover:underline">
                    {playlist.name}
                  </h3>
                </Link>
                <p className="text-text-muted text-sm truncate">
                  {playlist.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 rounded-full hover:bg-background-tertiary">
                  <Heart className="w-4 h-4 text-text-muted hover:text-white" />
                </button>
                <button className="p-2 rounded-full hover:bg-background-tertiary">
                  <MoreHorizontal className="w-4 h-4 text-text-muted hover:text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredPlaylists.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-background-tertiary rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-text-muted" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Nenhuma playlist encontrada
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
  );
};

export default LibraryPage;
