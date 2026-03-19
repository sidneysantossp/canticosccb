import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ComposerPageWrapper } from '@/components/ComposerPageWrapper';
import { useActiveComposer } from '@/hooks/useActiveComposer';
import { getComposerLikedSongsByComposerId, type ComposerCatalogSong } from '@/lib/composerCatalogApi';
import { buildHinoUrl } from '@/utils/slugUrl';
import { Heart, Play, Music, Search, ExternalLink, PenSquare } from 'lucide-react';
import { DEFAULT_COVER_URL } from '@/lib/config';

const formatNumber = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
};

const ComposerLiked: React.FC = () => {
  const { composerId, loading: loadingComposer } = useActiveComposer();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<ComposerCatalogSong[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!composerId || loadingComposer) return;
      setLoading(true);
      try {
        const rows = await getComposerLikedSongsByComposerId(composerId, 50);
        setSongs(rows);
      } catch (error) {
        console.error('Erro ao carregar hinos mais curtidos:', error);
        setSongs([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [composerId, loadingComposer]);

  const filteredSongs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return songs;

    return songs.filter((song) =>
      song.title.toLowerCase().includes(normalizedQuery) ||
      song.composerName.toLowerCase().includes(normalizedQuery) ||
      String(song.number || '').includes(normalizedQuery)
    );
  }, [query, songs]);

  const totalLikes = songs.reduce((sum, song) => sum + song.likes, 0);
  const songsWithLikes = songs.filter((song) => song.likes > 0).length;
  const averageLikes = songs.length > 0 ? Math.round(totalLikes / songs.length) : 0;

  return (
    <ComposerPageWrapper requireComposer>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mais Curtidas</h1>
          <p className="text-text-muted">Ranking real do seu catálogo por favoritamentos dos ouvintes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <p className="text-text-muted text-sm mb-2">Curtidas acumuladas</p>
            <p className="text-white text-3xl font-bold">{formatNumber(totalLikes)}</p>
          </div>
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <p className="text-text-muted text-sm mb-2">Hinos com curtidas</p>
            <p className="text-white text-3xl font-bold">{songsWithLikes}</p>
          </div>
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <p className="text-text-muted text-sm mb-2">Média por hino</p>
            <p className="text-white text-3xl font-bold">{formatNumber(averageLikes)}</p>
          </div>
        </div>

        <div className="bg-background-secondary rounded-xl border border-gray-800">
          <div className="p-6 border-b border-gray-800">
            <div className="relative">
              <Search className="w-5 h-5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por número, título ou compositor..."
                className="w-full bg-background-tertiary border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSongs.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {filteredSongs.map((song, index) => (
                <div key={song.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-8 text-center text-primary-400 font-bold">{index + 1}</div>
                    <img
                      src={song.coverUrl || DEFAULT_COVER_URL}
                      alt={song.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_COVER_URL;
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-white font-semibold truncate">{song.title}</h2>
                        {song.number ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20">
                            Hino {song.number}
                          </span>
                        ) : null}
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">
                          {song.status === 'published' ? 'Publicado' : song.status === 'pending' ? 'Em análise' : 'Rascunho'}
                        </span>
                      </div>
                      <p className="text-text-muted text-sm truncate">{song.composerName}</p>
                      {song.albumTitles.length > 0 ? (
                        <p className="text-text-muted text-xs truncate mt-1">
                          {song.albumTitles.slice(0, 2).join(' • ')}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:gap-6 md:justify-end">
                    <div className="text-sm text-text-muted flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span className="text-white font-semibold">{formatNumber(song.likes)}</span>
                    </div>
                    <div className="text-sm text-text-muted flex items-center gap-2">
                      <Play className="w-4 h-4 text-primary-400" />
                      <span className="text-white font-semibold">{formatNumber(song.plays)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={buildHinoUrl(song.id, song.title, song.number || undefined)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-background-tertiary text-white hover:bg-gray-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden md:inline">Ver</span>
                      </Link>
                      <Link
                        to={`/composer/songs/${song.id}/edit`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-500 text-black hover:bg-primary-400 transition-colors"
                      >
                        <PenSquare className="w-4 h-4" />
                        <span className="hidden md:inline">Editar</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <Music className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-white font-medium mb-2">Nenhum hino encontrado</p>
              <p className="text-text-muted">
                {songs.length === 0
                  ? 'Seu catálogo ainda não tem hinos com dados suficientes para montar esse ranking.'
                  : 'Ajuste a busca para ver outras faixas do catálogo.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </ComposerPageWrapper>
  );
};

export default ComposerLiked;
