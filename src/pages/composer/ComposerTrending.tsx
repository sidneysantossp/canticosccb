import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveComposer } from '@/hooks/useActiveComposer';
import { getComposerTrendingSongsByComposerId, type ComposerCatalogSong } from '@/lib/composerCatalogApi';
import { buildHinoUrl } from '@/utils/slugUrl';
import { DEFAULT_COVER_URL } from '@/lib/config';
import { Flame, Heart, Play, Sparkles, ExternalLink, PenSquare, Clock3 } from 'lucide-react';

const formatNumber = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
};

const formatAge = (value: string) => {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 30) return `${days} dias`;
  if (days < 365) return `${Math.floor(days / 30)} meses`;
  return `${Math.floor(days / 365)} anos`;
};

const ComposerTrending: React.FC = () => {
  const { composerId, loading: loadingComposer } = useActiveComposer();
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<ComposerCatalogSong[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!composerId || loadingComposer) return;
      setLoading(true);
      try {
        const rows = await getComposerTrendingSongsByComposerId(composerId, 24);
        setSongs(rows);
      } catch (error) {
        console.error('Erro ao carregar hinos em alta:', error);
        setSongs([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [composerId, loadingComposer]);

  const songsWithEngagement = songs.filter((song) => song.likes > 0 || song.plays > 0).length;
  const recentSongs = songs.filter((song) => {
    const createdAt = new Date(song.createdAt).getTime();
    return Date.now() - createdAt <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Hinos em Alta</h1>
          <p className="text-text-muted">
            Ranking atual do catálogo com base em plays, curtidas e atividade recente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <Flame className="w-6 h-6 text-orange-400" />
              <span className="text-white font-semibold">Faixas em destaque</span>
            </div>
            <p className="text-3xl font-bold text-white">{songsWithEngagement}</p>
          </div>
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <Clock3 className="w-6 h-6 text-blue-400" />
              <span className="text-white font-semibold">Lançamentos recentes</span>
            </div>
            <p className="text-3xl font-bold text-white">{recentSongs}</p>
          </div>
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-primary-400" />
              <span className="text-white font-semibold">Critério usado</span>
            </div>
            <p className="text-text-muted">Plays, curtidas e recência do catálogo</p>
          </div>
        </div>

        <div className="bg-background-secondary rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : songs.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {songs.map((song, index) => (
                <div key={song.id} className="p-4 md:p-6 flex flex-col gap-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary-500/10 text-primary-300 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
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
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="text-white font-semibold truncate">{song.title}</h2>
                          {song.number ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20">
                              Hino {song.number}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-text-muted text-sm">{song.composerName}</p>
                        <p className="text-text-muted text-xs mt-1">
                          Entrou no catálogo há {formatAge(song.createdAt)}
                          {song.albumTitles.length > 0 ? ` • ${song.albumTitles[0]}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-sm text-text-muted flex items-center gap-2">
                        <Play className="w-4 h-4 text-primary-400" />
                        <span className="text-white font-semibold">{formatNumber(song.plays)}</span>
                      </div>
                      <div className="text-sm text-text-muted flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span className="text-white font-semibold">{formatNumber(song.likes)}</span>
                      </div>
                      <div className="text-sm text-text-muted flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span className="text-white font-semibold">{song.trendScore}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-sm text-text-muted">
                      Motivo do destaque: <span className="text-white">{song.trendReason}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={buildHinoUrl(song.id, song.title, song.number || undefined)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-background-tertiary text-white hover:bg-gray-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden md:inline">Ver público</span>
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
              <Flame className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-white font-medium mb-2">Nenhum sinal de destaque ainda</p>
              <p className="text-text-muted">
                Assim que o catálogo acumular plays, curtidas ou novos lançamentos, esta página passa a refletir isso.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ComposerTrending;
