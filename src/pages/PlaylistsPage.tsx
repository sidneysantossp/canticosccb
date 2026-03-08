import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListMusic, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import {
  getAllPlaylists as getEditorialPlaylists,
  type EditorialPlaylist,
} from '@/lib/admin/playlistsAdminApi';

const PlaylistsPage: React.FC = () => {
  const [playlists, setPlaylists] = useState<EditorialPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaylists = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setPlaylists(await getEditorialPlaylists());
    } catch (err: any) {
      console.error('Erro ao carregar playlists editoriais:', err);
      setError(err?.message || 'Erro ao carregar playlists');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPlaylists();
  }, []);

  const activePlaylists = playlists.filter((playlist) => playlist.is_active);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <SEOHead
        title="Playlists - Cânticos CCB"
        description="Explore playlists de hinos da Congregação Cristã no Brasil."
      />

      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="text-text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Playlists</h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-text-muted">Carregando playlists editoriais...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Erro ao carregar playlists</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={() => loadPlaylists()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      ) : activePlaylists.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {activePlaylists.map((playlist) => (
              <Link
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                className="group rounded-2xl bg-background-secondary border border-gray-800 p-4 hover:border-primary-500/40 transition-colors"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-background-tertiary mb-4">
                  <img
                    src={playlist.cover_url || 'https://picsum.photos/seed/editorial-playlist/400/400'}
                    alt={playlist.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h2 className="text-white font-semibold line-clamp-2">{playlist.title}</h2>
                <p className="text-text-muted text-sm mt-1 line-clamp-2">
                  {playlist.description || `Curadoria de ${playlist.curator_name}`}
                </p>
                <p className="text-primary-400 text-xs mt-3 uppercase tracking-wide">
                  {playlist.curator_name}
                </p>
              </Link>
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-6">
            <ListMusic className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-3">Nenhuma playlist editorial publicada</h2>
          <p className="text-text-muted max-w-md">
            Quando o admin cadastrar playlists editoriais, elas aparecerão aqui automaticamente.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
