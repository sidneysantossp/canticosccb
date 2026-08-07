import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Disc3, ListMusic, Play, Radio, Sparkles } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { getHomePageData, type HomePageData, type HomeHymn } from '@/lib/homeApi';
import { usePlayerStore } from '@/stores/playerStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import type { Hino } from '@/types';
import { DEFAULT_COVER_URL } from '@/lib/config';
import { buildHinoUrl } from '@/utils/slugUrl';
import { hasPlayableTrackSource } from '@/lib/playerFeedback';

const emptyHomeData: HomePageData = {
  banners: [],
  featured: [],
  albums: [],
  hymnsCantados: [],
  hymnsTocados: [],
  hymnsAvulsos: [],
  newReleases: [],
  trending: [],
  composers: [],
  playlists: [],
  categories: [],
};

const toTrack = (hymn: HomeHymn): Hino => ({
  id: String(hymn.id),
  title: hymn.title,
  number: Number(hymn.number || 0),
  category: hymn.category || 'Hinos',
  artist: hymn.composer_name || 'Canticos CCB',
  duration: hymn.duration || '00:00',
  audioUrl: hymn.audio_url || '',
  coverUrl: hymn.cover_url || '',
  plays: 0,
  isLiked: false,
  createdAt: hymn.created_at || new Date().toISOString(),
  youtubeSource: hymn.youtube_source,
});

const uniqueById = (items: HomeHymn[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = String(item.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const RadioPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [homeData, setHomeData] = useState<HomePageData>(emptyHomeData);
  const { play, clearQueue, addToQueue, setPlaybackContext } = usePlayerStore();
  const { openFullScreen } = usePlayerContext();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getHomePageData();
        setHomeData(data);
      } catch (error) {
        console.error('Erro ao carregar a página de rádio:', error);
        setHomeData(emptyHomeData);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const lineup = useMemo(() => {
    const combined = uniqueById([
      ...homeData.featured,
      ...homeData.trending,
      ...homeData.newReleases,
      ...homeData.hymnsCantados,
      ...homeData.hymnsTocados,
    ]);
    return combined
      .filter((hymn) =>
        hasPlayableTrackSource({
          number: hymn.number,
          title: hymn.title,
          artist: hymn.composer_name,
          audioUrl: hymn.audio_url,
          youtubeSource: hymn.youtube_source,
        })
      )
      .slice(0, 16);
  }, [homeData]);

  const startRadio = (startAtIndex = 0) => {
    const tracks = lineup.map(toTrack);
    const currentTrack = tracks[startAtIndex];
    if (!currentTrack) return;

    clearQueue();
    tracks.slice(startAtIndex + 1).forEach((track) => addToQueue(track));
    setPlaybackContext({ type: 'unknown', id: 'radio-ccb' });
    const started = play(currentTrack);
    if (started === false) return;

    setTimeout(() => {
      if (window.innerWidth < 768) openFullScreen();
    }, 250);
  };

  const heroTrack = lineup[0];

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-8 pb-28 md:pb-12">
      <SEOHead
        title="Rádio CCB - Seleção Contínua de Hinos | Cânticos CCB"
        description="Ouça uma programação contínua com hinos cantados, tocados, álbuns e seleções da plataforma Cânticos CCB."
        canonical="/radio"
      />

      <div className="flex items-center gap-3">
        <Link to="/" className="text-text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Rádio CCB</h1>
      </div>

      <section className="rounded-3xl border border-gray-800 bg-gradient-to-br from-primary-500/10 via-background-secondary to-background-tertiary overflow-hidden">
        <div className="grid lg:grid-cols-[1.3fr_0.9fr] gap-0">
          <div className="p-6 md:p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-500/20 bg-primary-500/10 text-primary-300 text-sm mb-4">
              <Radio className="w-4 h-4" />
              Programação contínua
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
              Ouça hinos em sequência sem sair da plataforma
            </h2>
            <p className="text-text-muted text-base md:text-lg max-w-2xl mb-6">
              Esta página organiza uma fila contínua com destaques, lançamentos, hinos cantados e instrumentais para virar uma experiência de rádio dentro do Cânticos CCB.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                type="button"
                onClick={() => startRadio(0)}
                disabled={!heroTrack}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-black font-semibold hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5" />
                Tocar seleção agora
              </button>
              <Link
                to="/playlists"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-background-secondary text-white border border-gray-700 hover:bg-background-tertiary transition-colors"
              >
                <ListMusic className="w-5 h-5" />
                Ver playlists
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-black/20 border border-white/5 p-4">
                <p className="text-text-muted text-sm mb-1">Faixas na fila</p>
                <p className="text-white text-2xl font-bold">{lineup.length}</p>
              </div>
              <div className="rounded-2xl bg-black/20 border border-white/5 p-4">
                <p className="text-text-muted text-sm mb-1">Álbuns relacionados</p>
                <p className="text-white text-2xl font-bold">{homeData.albums.length}</p>
              </div>
              <div className="rounded-2xl bg-black/20 border border-white/5 p-4">
                <p className="text-text-muted text-sm mb-1">Categorias ligadas</p>
                <p className="text-white text-2xl font-bold">{homeData.categories.length}</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 border-t lg:border-t-0 lg:border-l border-gray-800 bg-black/10">
            {heroTrack ? (
              <div className="space-y-4">
                <img
                  src={heroTrack.cover_url || DEFAULT_COVER_URL}
                  alt={heroTrack.title}
                  className="w-full max-w-sm mx-auto aspect-square object-cover rounded-3xl shadow-2xl"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = DEFAULT_COVER_URL;
                  }}
                />
                <div className="text-center">
                  <p className="text-text-muted text-sm mb-1">Agora na seleção</p>
                  <h3 className="text-white text-2xl font-bold">{heroTrack.title}</h3>
                  <p className="text-text-muted">{heroTrack.composer_name}</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <Radio className="w-12 h-12 text-text-muted mb-4" />
                <p className="text-white font-semibold mb-2">Sem programação disponível agora</p>
                <p className="text-text-muted">Assim que o catálogo público estiver disponível, esta página monta a fila automaticamente.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
        <div className="bg-background-secondary rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Fila sugerida</h2>
              <p className="text-text-muted text-sm">Sequência baseada no repertório já público da plataforma.</p>
            </div>
            {lineup.length > 0 ? (
              <button
                type="button"
                onClick={() => startRadio(0)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-black font-medium hover:bg-primary-400 transition-colors"
              >
                <Play className="w-4 h-4" />
                Tocar tudo
              </button>
            ) : null}
          </div>

          <div className="divide-y divide-gray-800">
            {lineup.slice(0, 8).map((hymn, index) => (
              <div key={hymn.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-8 text-center text-primary-400 font-bold">{index + 1}</div>
                  <img
                    src={hymn.cover_url || DEFAULT_COVER_URL}
                    alt={hymn.title}
                    className="w-14 h-14 rounded-xl object-cover"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DEFAULT_COVER_URL;
                    }}
                  />
                  <div className="min-w-0">
                    <Link
                      to={buildHinoUrl(hymn.id, hymn.title, hymn.number || undefined)}
                      className="text-white font-semibold hover:text-primary-400 transition-colors line-clamp-1"
                    >
                      {hymn.title}
                    </Link>
                    <p className="text-text-muted text-sm line-clamp-1">{hymn.composer_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20">
                    {hymn.category || 'Hinos'}
                  </span>
                  <button
                    type="button"
                    onClick={() => startRadio(index)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-background-tertiary text-white hover:bg-gray-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Ouvir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-background-secondary rounded-2xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Rotas rápidas</h2>
            <div className="grid gap-3">
              {[
                { to: '/hinos-cantados-ccb', icon: Radio, title: 'Hinos cantados', description: 'Seleção para escuta contínua com vozes.' },
                { to: '/instrumentais', icon: Disc3, title: 'Instrumentais', description: 'Versões tocadas e repertório para estudo.' },
                { to: '/albuns', icon: Disc3, title: 'Álbuns', description: 'Escute coleções completas em sequência.' },
                { to: '/playlists', icon: ListMusic, title: 'Playlists', description: 'Listas públicas para momentos específicos.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-start gap-3 p-4 rounded-xl bg-background-tertiary border border-gray-800 hover:border-primary-500/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{item.title}</p>
                      <p className="text-text-muted text-sm">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-background-secondary rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-primary-400" />
              <h2 className="text-xl font-bold text-white">Como esta página funciona</h2>
            </div>
            <div className="space-y-3 text-sm text-text-muted">
              <p>Ela junta faixas públicas já disponíveis no catálogo e monta uma fila contínua para virar uma experiência de rádio dentro do site.</p>
              <p>Quando você toca a seleção, a primeira faixa inicia imediatamente e as próximas entram na fila do player.</p>
              <p>Use os hubs de cantados, instrumentais, álbuns e playlists para continuar a escuta por intenção.</p>
            </div>
          </div>
        </div>
      </section>

      {loading && lineup.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : null}
    </div>
  );
};

export default RadioPage;
