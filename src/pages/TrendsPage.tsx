import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Pause, TrendingUp, Clock, Heart, MoreVertical, ArrowLeft } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import useFavoritesStore from '@/stores/favoritesStore';
import { useAuth } from '@/contexts/AuthContext';
import SEOHead from '@/components/SEO/SEOHead';
import { apiFetch } from '@/lib/api-helper';
import { buildAlbumCoverUrl, buildHinoUrl } from '@/lib/media-helper';
import { usePlayerContext } from '@/contexts/PlayerContext';
// Backend simples via PHP: consumir via apiFetch para suportar host dinâmico

interface TrendItem {
  id: string;
  albumId: string;
  number: number;
  title: string;
  artist: string;
  coverUrl: string;
  duration: string;
  plays: number;
  rank: number;
  previousRank: number;
  trending: 'up' | 'down' | 'stable';
  albumTitle?: string;
}

const TrendsPage: React.FC = () => {
  const [trendsData, setTrendsData] = useState<TrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 20;
  
  const { currentTrack, isPlaying, play, pause } = usePlayerStore();
  const { openFullScreen } = usePlayerContext();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    setIsLoading(true);
    try {
      // Buscar hinos publicados (ativo=1), limite razoável
      const res = await apiFetch(`api/hinos/?ativo=1&limit=100`);
      if (!res.ok) throw new Error('Erro ao listar hinos publicados');
      const data = await res.json();
      const arr: any[] = Array.isArray(data) ? data : (data.data || data.hinos || data.items || []);

      // Normalizar e ordenar por created_at desc (mais recentes primeiro)
      const hymns = arr.slice();
      hymns.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      const topSet = new Set(
        [...hymns]
          .sort((a, b) => (b.plays || 0) - (a.plays || 0))
          .slice(0, 5)
          .map((x) => String(x.id))
      );

      const normalized: TrendItem[] = hymns.slice(0, 20).map((h, index) => ({
        id: String(h.id),
        albumId: String(h.album_id || h.id),
        number: h.numero || 0,
        title: h.titulo,
        artist: h.compositor || 'Artista Desconhecido',
        coverUrl: buildAlbumCoverUrl({ id: String(h.id), cover_url: h.cover_url }),
        duration: h.duracao || '—',
        plays: h.plays || 0,
        rank: index + 1,
        previousRank: index + 1,
        trending: topSet.has(String(h.id)) ? 'up' : 'stable',
        albumTitle: h.album_titulo || undefined,
      }));

      setTrendsData(normalized);
      setPage(1);
    } catch (error) {
      console.error('Erro ao carregar trends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async (hymn: TrendItem) => {
    if (currentTrack?.id === hymn.id && isPlaying) {
      pause();
    } else {
      const track = {
        id: hymn.id,
        number: hymn.number,
        category: 'Cantados',
        title: hymn.title,
        artist: hymn.artist,
        coverUrl: hymn.coverUrl,
        audioUrl: '', // será resolvido abaixo
        duration: hymn.duration,
        plays: hymn.plays,
        isLiked: false,
        createdAt: new Date().toISOString()
      };
      // Tentar obter o audio_url real deste hino
      try {
        const r = await apiFetch(`api/hinos/${hymn.id}`);
        if (r.ok) {
          const d = await r.json();
          const item = d?.data || d?.hino || d;
          if (item?.audio_url) (track as any).audioUrl = buildHinoUrl({ id: String(hymn.id), audio_url: item.audio_url });
        }
      } catch {}
      play(track as any);
      // Open full screen on mobile for a consistent UX
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          openFullScreen();
        }
      }, 250);
    }
  };

  const handleToggleFavorite = (hymnId: string) => {
    const id = parseInt(hymnId);
    const uid = user?.id ? Number(user.id) : undefined;
    if (isFavorite(id)) {
      removeFavorite(id, uid);
    } else {
      const hymn = trendsData.find(h => h.id === hymnId);
      if (hymn) {
        addFavorite({
          id,
          title: hymn.title,
          artist: hymn.artist,
          album: hymn.albumTitle || 'Álbum Desconhecido',
          duration: hymn.duration,
          coverUrl: hymn.coverUrl
        }, uid);
      }
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (trend === 'up') {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    }

    if (trend === 'down') {
      return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
    }

    return <div className="w-4 h-4" />;
  };

  const getRankChange = (hymn: TrendItem) => {
    const change = hymn.previousRank - hymn.rank;
    if (change > 0) {
      return (
        <div className="flex items-center text-green-400 text-xs">
          <TrendingUp className="w-3 h-3" />
          <span>+{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-400 text-xs">
          <TrendingUp className="w-3 h-3 rotate-180" />
          <span>{change}</span>
        </div>
      );
    }
    return (
      <div className="text-gray-500 text-xs">
        <span>-</span>
      </div>
    );
  };

  // Badge para ranking
  const getTrendBadge = (index: number) => {
    if (index === 0) return { label: 'TOP 1', className: 'bg-primary-600 text-black' };
    if (index === 1) return { label: 'TOP 2', className: 'bg-gray-400 text-black' };
    if (index === 2) return { label: 'TOP 3', className: 'bg-amber-500 text-black' };
    return { label: `#${index + 1}`, className: 'bg-gray-700 text-white' };
  };

  return (
    <>
      <SEOHead
        title="Recém chegados - Últimos hinos adicionados"
        description="Ouça os hinos adicionados mais recentemente, com métricas de reproduções."
        keywords="recém chegados, últimos hinos, novos, CCB"
      />

      <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary pb-24">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary-900 to-background pt-20 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>

            <div className="mb-4">
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                Recém chegados
                <TrendingUp className="w-8 h-8 text-primary-400" />
              </h1>
              <p className="text-gray-300 mt-2">
                Os últimos hinos adicionados recentemente
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 -mt-6">
          {/* Stats Card */}
          <div className="bg-gradient-to-br from-primary-900/50 to-gray-900/50 backdrop-blur-sm border border-primary-800/30 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary-400">
                  {trendsData.length}
                </div>
                <div className="text-sm text-gray-400 mt-1">Hinos em Alta</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">
                  {trendsData.filter(h => h.trending === 'up').length}
                </div>
                <div className="text-sm text-gray-400 mt-1">Subindo</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-400">
                  {trendsData.reduce((acc, h) => acc + h.plays, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-400 mt-1">Reproduções</div>
              </div>
            </div>
          </div>

          {/* Trends List (Paginação 20 por página) */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-gray-900/50 rounded-xl p-4 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-800 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-800 rounded w-3/4" />
                      <div className="h-4 bg-gray-800 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {trendsData.slice((page-1)*perPage, page*perPage).map((hymn, idx) => {
                const index = (page-1)*perPage + idx;
                return (
                <div
                  key={hymn.id}
                  className={`group relative bg-gradient-to-r ${
                    index === 0
                      ? 'from-primary-900/30 to-gray-900/30 border-primary-700/50'
                      : 'from-gray-900/50 to-gray-800/30 border-gray-800/50'
                  } backdrop-blur-sm border rounded-xl p-4 hover:scale-[1.02] transition-all duration-200`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank (hide on mobile) */}
                    <div className="hidden md:flex flex-col items-center gap-1">
                      <div
                        className={`text-2xl font-bold ${
                          index === 0
                            ? 'text-primary-400'
                            : index === 1
                            ? 'text-gray-300'
                            : index === 2
                            ? 'text-amber-600'
                            : 'text-gray-500'
                        }`}
                      >
                        #{hymn.rank}
                      </div>
                      {getRankChange(hymn)}
                    </div>

                    {/* Cover */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={hymn.coverUrl}
                        alt={hymn.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <button
                        onClick={() => handlePlayPause(hymn)}
                        className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {currentTrack?.id === hymn.id && isPlaying ? (
                          <Pause className="w-6 h-6 text-white fill-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white fill-white" />
                        )}
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/album/${hymn.albumId}`}
                        className="block hover:underline"
                      >
                        <h3 className="text-white font-semibold truncate">
                          {hymn.title}
                        </h3>
                      </Link>
                      <p className="text-gray-400 text-sm truncate">
                        {hymn.artist}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {hymn.duration}
                        </span>
                        <span className="text-xs text-gray-500">
                          {hymn.plays.toLocaleString()} plays
                        </span>
                        {getTrendIcon(hymn.trending)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleFavorite(hymn.id)}
                        className={`hidden md:inline-flex p-2 rounded-full hover:bg-white/10 transition-colors ${
                          isFavorite(parseInt(hymn.id))
                            ? 'text-primary-500'
                            : 'text-gray-400'
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isFavorite(parseInt(hymn.id)) ? 'fill-current' : ''
                          }`}
                        />
                      </button>
                      <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Top Badge */}
                  {index < 10 && (
                    <div
                      className={`absolute -top-2 -right-2 ${getTrendBadge(index).className} text-xs font-bold px-3 py-1 rounded-full shadow-lg`}
                    >
                      {getTrendBadge(index).label}
                    </div>
                  )}
                </div>
                );
              })}
              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1.5 rounded-lg border ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'} border-gray-700 text-white`}
                >
                  Anterior
                </button>
                <span className="text-gray-400 text-sm">Página {page} de {Math.max(1, Math.ceil(trendsData.length / perPage))}</span>
                <button
                  onClick={() => setPage((p) => Math.min(Math.ceil(trendsData.length / perPage), p + 1))}
                  disabled={page >= Math.ceil(trendsData.length / perPage)}
                  className={`px-3 py-1.5 rounded-lg border ${page >= Math.ceil(trendsData.length / perPage) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'} border-gray-700 text-white`}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}

          {/* Bottom Info */}
          <div className="mt-8 p-6 bg-gray-900/30 rounded-xl border border-gray-800">
            <p className="text-gray-400 text-sm text-center">
              Os rankings são atualizados a cada hora com base nas reproduções da irmandade.
              <br />
              <span className="text-primary-400">
                Última atualização: {new Date().toLocaleTimeString('pt-BR')}
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrendsPage;
