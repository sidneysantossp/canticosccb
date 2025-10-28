import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, Plus, Search, Grid, List, MoreHorizontal } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import { Hino } from '@/types';
import SEOHead from '@/components/SEO/SEOHead';
import usePlaylistsStore from '@/stores/playlistsStore';
import { useAuth } from '@/contexts/AuthContext';
import * as playlistsApi from '@/lib/playlistsApi';

const LibraryPage: React.FC = () => {
  const { play, setPlaybackContext } = usePlayerStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const { playlists, setPlaylists } = usePlaylistsStore();
  const { openFullScreen } = usePlayerContext();
  const { user } = useAuth();

  // Carregar playlists do backend ao abrir a Biblioteca
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        if (!user?.id) return;
        const dtos = await playlistsApi.list(Number(user.id));
        const mapped = dtos.map((p) => ({
          id: String(p.id),
          name: p.name,
          description: p.description || undefined,
          coverUrl: p.cover_url || `https://picsum.photos/seed/${p.id}/300/300`,
          tracks: (p.tracks || []).map((t) => ({
            id: isNaN(parseInt(String(t.id))) ? Date.now() : parseInt(String(t.id)),
            title: t.title,
            artist: t.artist,
            coverUrl: t.cover_url || '',
            duration: t.duration || '0:00',
            backendTrackId: String(t.id),
          })),
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));
        // Manter playlists locais não persistidas (ids não numéricos)
        const locals = playlists.filter((pl) => !/^\d+$/.test(pl.id));
        setPlaylists([...mapped, ...locals]);
      } catch (e) {
        console.error('Erro ao carregar playlists do backend:', e);
      }
    };
    fetchPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayPlaylist = (playlist: any) => {
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) return;
    const t = playlist.tracks[0];
    const track: Hino = {
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
    };
    setPlaybackContext({ type: 'playlist', id: String(playlist.id) });
    play(track);
    openFullScreen();
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
        <Link to="/playlist/criar" className="flex items-center gap-3 p-4 bg-background-secondary hover:bg-background-hover rounded-lg transition-colors group">
          <div className="w-12 h-12 bg-background-tertiary rounded-lg flex items-center justify-center group-hover:bg-background-hover">
            <Plus className="w-6 h-6 text-text-muted group-hover:text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">Criar playlist</h3>
            <p className="text-text-muted text-sm">É fácil, vamos te ajudar</p>
          </div>
        </Link>
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
                  {playlist.description || `${playlist.tracks.length} ${playlist.tracks.length === 1 ? 'hino' : 'hinos'}`}
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
                  {playlist.description || `${playlist.tracks.length} ${playlist.tracks.length === 1 ? 'hino' : 'hinos'}`}
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
