import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X, Play, Music, Mic, Disc, List, Mic2, Sparkles } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import SEOHead from '@/components/SEO/SEOHead';
import { generateWebsiteSchema } from '@/utils/schemaGenerator';
import { buildHinoUrl, buildCompositorUrl, buildAlbumUrl } from '@/utils/slugUrl';
import { advancedSearch, type HymnSearchResult, type ComposerSearchResult, type AlbumSearchResult, type PlaylistSearchResult } from '@/lib/searchApi';
import { useAuth } from '@/contexts/AuthContext';
import { publicSupabase, supabase } from '@/lib/supabase-auth';
import { getPublicTags, type PublicTag } from '@/lib/publicSiteConfig';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';

type DiscoveryComposer = {
  id: string;
  name: string;
  imageUrl?: string;
  totalHymns?: number;
};

type DiscoveryAlbum = {
  id: string;
  title: string;
  artist?: string;
  coverUrl?: string;
};

type DiscoveryPlaylist = {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
};

const mapComposerDiscovery = (composer: any): DiscoveryComposer => ({
  id: String(composer.id),
  name: composer.artistic_name || composer.name || 'Compositor',
  imageUrl: composer.photo_url || composer.avatar_url || undefined,
});

const mapAlbumDiscovery = (album: any): DiscoveryAlbum => ({
  id: String(album.id),
  title: album.title || 'Álbum',
  artist: album.artist || 'Acervo Cânticos CCB',
  coverUrl: album.cover_url || undefined,
});

const mapPlaylistDiscovery = (playlist: any): DiscoveryPlaylist => ({
  id: String(playlist.id),
  name: playlist.name || 'Playlist',
  description: playlist.description || undefined,
  coverUrl: playlist.cover_url || undefined,
});

const SearchPage: React.FC = () => {
  const { play } = usePlayerStore();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'songs' | 'artists' | 'albums' | 'playlists'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [hymns, setHymns] = useState<HymnSearchResult[]>([]);
  const [composers, setComposers] = useState<ComposerSearchResult[]>([]);
  const [albums, setAlbums] = useState<AlbumSearchResult[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [tags, setTags] = useState<PublicTag[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; nome: string; slug: string; descricao?: string; imagem_url?: string }>>([]);
  const [discoveryComposers, setDiscoveryComposers] = useState<DiscoveryComposer[]>([]);
  const [discoveryAlbums, setDiscoveryAlbums] = useState<DiscoveryAlbum[]>([]);
  const [discoveryPlaylists, setDiscoveryPlaylists] = useState<DiscoveryPlaylist[]>([]);
  const [catalogHymns, setCatalogHymns] = useState<HymnSearchResult[]>([]);
  const [catalogComposers, setCatalogComposers] = useState<DiscoveryComposer[]>([]);
  const [catalogAlbums, setCatalogAlbums] = useState<DiscoveryAlbum[]>([]);
  const [catalogPlaylists, setCatalogPlaylists] = useState<DiscoveryPlaylist[]>([]);
  const {
    supported: voiceSupported,
    isListening: isVoiceListening,
    error: voiceError,
    clearError: clearVoiceError,
    toggleListening,
  } = useVoiceSearch({
    onInterimResult: (text) => setSearchQuery(text),
    onFinalResult: (text) => handleSearch(text),
  });

  const schema = generateWebsiteSchema();
  const playSearchResult = (song: HymnSearchResult) => {
    const ytSrc = (song as any).youtube_source || undefined;

    play({
      id: song.id,
      title: song.title,
      number: Number(song.number || 0),
      category: song.category || 'Hinos CCB',
      artist: song.composer_name || 'Coral CCB',
      duration: song.duration || '00:00',
      coverUrl: song.cover_url || '',
      audioUrl: ytSrc ? '' : (song.audio_url || ''),
      plays: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
      youtubeSource: ytSrc,
    } as any);
  };

  const filters = [
    { id: 'all', label: 'Tudo', icon: List },
    { id: 'songs', label: 'Hinos', icon: Music },
    { id: 'artists', label: 'Compositores', icon: Mic },
    { id: 'albums', label: 'Álbuns', icon: Disc },
    { id: 'playlists', label: 'Playlists', icon: List }
  ];

  // Carregar categorias do banco de dados
  useEffect(() => {
    const loadDiscoveryData = async () => {
      try {
        const [categoriesRes, composersRes, albumsRes, playlistsRes] = await Promise.all([
          publicSupabase
            .from('categorias')
            .select('id, nome, slug, descricao, imagem_url')
            .eq('ativo', true)
            .order('nome', { ascending: true })
            .limit(8),
          publicSupabase
            .from('composer_public_profiles')
            .select('id, name, artistic_name, avatar_url, followers_count')
            .order('followers_count', { ascending: false })
            .limit(8),
          publicSupabase
            .from('albums')
            .select('id, title, artist, cover_url')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(8),
          publicSupabase
            .from('playlists')
            .select('id, name, description, cover_url')
            .eq('is_public', true)
            .order('updated_at', { ascending: false })
            .limit(8),
        ]);

        if (!categoriesRes.error && categoriesRes.data) {
          setCategories(categoriesRes.data);
        }

        if (!composersRes.error && composersRes.data) {
          setDiscoveryComposers(composersRes.data.map(mapComposerDiscovery));
        }

        if (!albumsRes.error && albumsRes.data) {
          setDiscoveryAlbums(
            albumsRes.data
              .filter((album: any) => album.active !== false)
              .map(mapAlbumDiscovery)
          );
        }

        if (!playlistsRes.error && playlistsRes.data) {
          setDiscoveryPlaylists(playlistsRes.data.map(mapPlaylistDiscovery));
        }
      } catch (error) {
        console.error('Erro ao carregar dados de descoberta do Supabase:', error);
      }
    };

    loadDiscoveryData();
  }, []);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const fetchedTags = await getPublicTags();
        setTags(fetchedTags.slice(0, 8));
      } catch (error) {
        console.error('Erro ao carregar tags públicas:', error);
      }
    };

    void loadTags();
  }, []);

  // Carregar buscas recentes do histórico do usuário
  useEffect(() => {
    const loadRecentSearches = async () => {
      if (!user?.id) {
        setRecentSearches([]);
        return;
      }

      try {
        const { data: history } = await supabase
          .from('historico')
          .select('hinos(titulo)')
          .eq('usuario_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (history) {
          const searches = history
            .map((h: any) => h.hinos?.titulo)
            .filter((t: string | null) => t != null)
            .slice(0, 4);
          setRecentSearches(searches);
        }
      } catch (error) {
        console.error('Erro ao carregar buscas recentes:', error);
      }
    };

    loadRecentSearches();
  }, [user?.id]);

  useEffect(() => {
    setSearchQuery((prev) => (prev === urlQuery ? prev : urlQuery));
  }, [urlQuery]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!searchQuery.trim()) {
        setHymns([]);
        setComposers([]);
        setAlbums([]);
        setPlaylists([]);
        return;
      }
      setIsLoading(true);
      try {
        const type =
          activeFilter === 'songs' ? 'hymns' :
            activeFilter === 'artists' ? 'composers' :
              activeFilter === 'albums' ? 'albums' :
                activeFilter === 'playlists' ? 'playlists' : 'all';
        const { hymns: h, composers: c, albums: a, playlists: p } = await advancedSearch({ query: searchQuery, type, limit: 50 });
        if (!isMounted) return;
        setHymns(h);
        setComposers(c);
        setAlbums(a || []);
        setPlaylists(p || []);
      } catch (err) {
        console.error('SearchPage - advancedSearch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    // Debounce rápido para busca instantânea
    const t = setTimeout(run, 150);
    return () => {
      isMounted = false;
      clearTimeout(t);
    };
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    let isMounted = true;

    const loadFullCatalogForActiveFilter = async () => {
      if (searchQuery.trim()) return;

      if (activeFilter === 'songs' && catalogHymns.length === 0) {
        setIsLoading(true);
        try {
          const { data, error } = await publicSupabase
            .from('hinos')
            .select('id,numero,titulo,compositor_nome,categoria,cover_url,audio_url,youtube_source')
            .eq('ativo', 1)
            .order('numero', { ascending: true })
            .limit(1000);

          if (!error && data && isMounted) {
            setCatalogHymns(
              data.map((hymn: any) => ({
                id: String(hymn.id),
                number: Number(hymn.numero || 0),
                title: hymn.titulo || 'Hino',
                composer_name: hymn.compositor_nome || undefined,
                category_name: hymn.categoria || undefined,
                cover_url: hymn.cover_url || undefined,
                audio_url: hymn.audio_url || undefined,
                youtube_source: hymn.youtube_source || undefined,
                matchScore: 0,
              }))
            );
          }
        } catch (error) {
          console.error('Erro ao carregar catálogo de hinos:', error);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }

      if (activeFilter === 'artists' && catalogComposers.length === 0) {
        setIsLoading(true);
        try {
          const { data, error } = await publicSupabase
            .from('composer_public_profiles')
            .select('id, name, artistic_name, avatar_url, followers_count')
            .order('name', { ascending: true })
            .limit(1000);

          if (!error && data && isMounted) {
            setCatalogComposers(data.map(mapComposerDiscovery));
          }
        } catch (error) {
          console.error('Erro ao carregar catálogo de compositores:', error);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }

      if (activeFilter === 'albums' && catalogAlbums.length === 0) {
        setIsLoading(true);
        try {
          const { data, error } = await publicSupabase
            .from('albums')
            .select('id, title, artist, cover_url, active')
            .eq('is_published', true)
            .order('title', { ascending: true })
            .limit(1000);

          if (!error && data && isMounted) {
            setCatalogAlbums(
              data
                .filter((album: any) => album.active !== false)
                .map(mapAlbumDiscovery)
            );
          }
        } catch (error) {
          console.error('Erro ao carregar catálogo de álbuns:', error);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }

      if (activeFilter === 'playlists' && catalogPlaylists.length === 0) {
        setIsLoading(true);
        try {
          const { data, error } = await publicSupabase
            .from('playlists')
            .select('id, name, description, cover_url')
            .eq('is_public', true)
            .order('name', { ascending: true })
            .limit(1000);

          if (!error && data && isMounted) {
            setCatalogPlaylists(data.map(mapPlaylistDiscovery));
          }
        } catch (error) {
          console.error('Erro ao carregar catálogo de playlists:', error);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    };

    void loadFullCatalogForActiveFilter();

    return () => {
      isMounted = false;
    };
  }, [
    activeFilter,
    searchQuery,
    catalogHymns.length,
    catalogAlbums.length,
    catalogComposers.length,
    catalogPlaylists.length,
  ]);

  const handleSearch = (query: string) => {
    if (voiceError) {
      clearVoiceError();
    }
    setSearchQuery(query);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (query.trim()) next.set('q', query);
      else next.delete('q');
      return next;
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      return next;
    });
  };

  const hasResults = searchQuery.trim().length > 0 && ((hymns.length > 0) || (composers.length > 0) || (albums.length > 0) || (playlists.length > 0));
  const hasSearchQuery = searchQuery.trim().length > 0;
  const sectionPriority: Record<string, number> = {
    composers: 4,
    albums: 3,
    hymns: 2,
    playlists: 1,
  };
  const showAllFilters = activeFilter === 'all';
  const showSongsFilter = showAllFilters || activeFilter === 'songs';
  const showArtistsFilter = showAllFilters || activeFilter === 'artists';
  const showAlbumsFilter = showAllFilters || activeFilter === 'albums';
  const showPlaylistsFilter = showAllFilters || activeFilter === 'playlists';
  const displayedHymns = !hasSearchQuery && activeFilter === 'songs' && catalogHymns.length > 0
    ? catalogHymns
    : [];
  const displayedComposers = !hasSearchQuery && activeFilter === 'artists' && catalogComposers.length > 0
    ? catalogComposers
    : discoveryComposers;
  const displayedAlbums = !hasSearchQuery && activeFilter === 'albums' && catalogAlbums.length > 0
    ? catalogAlbums
    : discoveryAlbums;
  const displayedPlaylists = !hasSearchQuery && activeFilter === 'playlists' && catalogPlaylists.length > 0
    ? catalogPlaylists
    : discoveryPlaylists;

  return (
    <>
      <SEOHead
        title="Buscar Hinos, Compositores, Álbuns e Playlists"
        description="Encontre hinos, descubra compositores, explore álbuns e playlists na plataforma CCB."
        keywords="buscar hinos, busca ccb, compositores ccb, álbuns ccb, playlists ccb"
        canonical="/search"
        schemaData={schema}
        noindex={Boolean(searchQuery.trim())}
      />

      <div className="p-6 min-h-screen">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
            <input
              type="text"
              placeholder="Digite um hino, número, compositor, álbum, instrumento ou playlist"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-20 py-3 bg-background-tertiary border border-gray-700 rounded-full text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchQuery && (
              <button onClick={handleClearSearch} className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-background-hover transition-colors">
                <X className="w-5 h-5 text-text-muted hover:text-white" />
              </button>
            )}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute ${searchQuery ? 'right-12' : 'right-4'} top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                  isVoiceListening ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-background-hover text-text-muted hover:text-white'
                }`}
                aria-label={isVoiceListening ? 'Parar busca por voz' : 'Iniciar busca por voz'}
                title={isVoiceListening ? 'Ouvindo...' : 'Buscar por voz'}
              >
                <Mic2 className="w-5 h-5" />
              </button>
            )}
          </div>
          {voiceError && (
            <p className="text-red-300 text-sm mt-3 text-center">{voiceError}</p>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 justify-center min-w-max px-4 md:px-0">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const active = activeFilter === (filter.id as any);
              return (
                <button
                  key={filter.id}
                  className={`px-4 py-2 rounded-full border ${active ? 'bg-primary-600 text-white border-transparent' : 'bg-background-tertiary text-text-primary border-gray-700'} flex items-center gap-2 whitespace-nowrap flex-shrink-0`}
                  onClick={() => setActiveFilter(filter.id as any)}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center text-text-muted">Carregando resultados...</div>
        )}

        {/* Results or Suggestions */}
        {hasResults ? (
          <div className="space-y-12">
            {[
              (showSongsFilter && hymns.length > 0) ? {
                key: 'hymns',
                score: hymns[0]?.matchScore || 0,
                node: (
                  <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Hinos</h2>
                    <div className="space-y-2">
                      {hymns.map((song) => (
                        <Link
                          key={song.id}
                          to={buildHinoUrl(song.id, song.title, song.number)}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors group w-full"
                        >
                          <img src={song.cover_url || 'https://picsum.photos/seed/search1/100/100'} alt={song.title} className="w-12 h-12 rounded object-cover" />
                          <div className="flex-1">
                            <div className="text-white font-medium">{(() => {
                              const t = String(song.title || '');
                              const n = Number(song.number || 0);
                              const lower = t.toLowerCase();
                              const hasNum = n > 0 && (
                                lower.includes(`hino ${n}`) ||
                                lower.startsWith(`${n} -`) ||
                                lower.includes(`${n} -`) ||
                                lower.includes(`#${n}`) ||
                                lower.includes(`nº ${n}`)
                              );
                              return n > 0 && !hasNum ? `${n} - ${t}` : t;
                            })()}</div>
                            <div className="text-text-muted text-sm">{song.composer_name || song.category_name || 'Hino'}</div>
                          </div>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-background-tertiary"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              playSearchResult(song);
                            }}
                          >
                            <Play className="w-5 h-5 text-white" />
                          </button>
                        </Link>
                      ))}
                    </div>
                  </section>
                ),
              } : null,
              (showArtistsFilter && composers.length > 0) ? {
                key: 'composers',
                score: composers[0]?.matchScore || 0,
                node: (
                  <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Compositores</h2>
                    <div className="space-y-2">
                      {composers.map((artist) => (
                        <Link key={artist.id} to={buildCompositorUrl(artist.id, artist.name)} className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors group w-full">
                          <div className="w-12 h-12 bg-background-tertiary rounded flex items-center justify-center overflow-hidden">
                            <img src={artist.photo_url || 'https://picsum.photos/seed/artist1/150/150'} className="w-12 h-12 object-cover" alt={artist.name} />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">{artist.name}</div>
                            <div className="text-text-muted text-sm">Compositor</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ),
              } : null,
              (showAlbumsFilter && albums.length > 0) ? {
                key: 'albums',
                score: albums[0]?.matchScore || 0,
                node: (
                  <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Álbuns</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {albums.map((album) => (
                        <Link key={album.id} to={buildAlbumUrl(album.id, album.title, album.artist)} className="p-3 rounded-lg hover:bg-background-hover transition-colors">
                          <img src={album.cover_url || 'https://picsum.photos/seed/album1/200/200'} alt={album.title} className="w-full h-36 object-cover rounded mb-3" />
                          <div className="text-white font-medium truncate">{album.title}</div>
                          <div className="text-text-muted text-sm truncate">{album.artist || 'Álbum'}</div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ),
              } : null,
              (showPlaylistsFilter && playlists.length > 0) ? {
                key: 'playlists',
                score: playlists[0]?.matchScore || 0,
                node: (
                  <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Playlists</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {playlists.map((pl) => (
                        <Link key={pl.id} to={`/playlist/${pl.id}`} className="p-3 rounded-lg hover:bg-background-hover transition-colors">
                          <img src={pl.cover_url || 'https://picsum.photos/seed/playlist1/200/200'} alt={pl.name} className="w-full h-36 object-cover rounded mb-3" />
                          <div className="text-white font-medium truncate">{pl.name}</div>
                          <div className="text-text-muted text-sm truncate">{pl.hymns_count ? `${pl.hymns_count} hinos` : (pl.description || 'Playlist')}</div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ),
              } : null,
            ]
              .filter(Boolean)
              .sort((a: any, b: any) =>
                activeFilter === 'all'
                  ? (b.score - a.score) || ((sectionPriority[b.key] || 0) - (sectionPriority[a.key] || 0))
                  : 0
              )
              .map((section: any) => (
                <React.Fragment key={section.key}>{section.node}</React.Fragment>
              ))}
          </div>
        ) : (
          <div className="space-y-12">
            {activeFilter === 'songs' && !hasSearchQuery && displayedHymns.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">Todos os hinos</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {displayedHymns.length} hinos públicos encontrados. Use a busca acima para filtrar por nome, número, compositor, álbum, instrumento ou playlist.
                  </p>
                </div>
                <div className="space-y-2">
                  {displayedHymns.map((song) => (
                    <Link
                      key={song.id}
                      to={buildHinoUrl(song.id, song.title, song.number)}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors group w-full"
                    >
                      <img
                        src={song.cover_url || `https://picsum.photos/seed/search-song-${song.id}/100/100`}
                        alt={song.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">
                          {song.number > 0 ? `${song.number} - ${song.title}` : song.title}
                        </div>
                        <div className="text-text-muted text-sm truncate">
                          {song.composer_name || song.category_name || 'Hino'}
                        </div>
                      </div>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-background-tertiary"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          playSearchResult(song);
                        }}
                      >
                        <Play className="w-5 h-5 text-white" />
                      </button>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {showAllFilters && recentSearches.length > 0 && (
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
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-5 h-5 text-text-muted hover:text-white" />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {showSongsFilter && tags.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary-400" />
                    Tags em destaque
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Atalhos rápidos definidos pelo admin</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleSearch(tag.name)}
                      className="px-4 py-2 rounded-full bg-background-tertiary border border-gray-700 text-white hover:bg-primary-600 hover:border-primary-600 transition-colors"
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {showSongsFilter && categories.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">Explore por Categoria</h2>
                  <p className="text-gray-400 text-sm mt-1">Navegue por diferentes estilos e tipos de hino</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/categoria/${category.slug}`}
                      className="group flex items-center gap-4 bg-background-secondary hover:bg-background-tertiary p-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={category.imagem_url || `https://picsum.photos/seed/category-${category.id}/200/200`}
                          alt={category.nome}
                          className="w-12 h-12 rounded object-cover"
                          loading="lazy"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/seed/category-fallback-${category.id}/200/200`; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
                          {category.nome}
                        </h3>
                        {category.descricao && (
                          <p className="text-sm text-gray-400 truncate">{category.descricao}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {showArtistsFilter && displayedComposers.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    {activeFilter === 'artists' && !hasSearchQuery ? 'Todos os compositores' : 'Compositores em destaque'}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {activeFilter === 'artists' && !hasSearchQuery
                      ? `${displayedComposers.length} compositores públicos encontrados`
                      : 'Perfis públicos para você explorar'}
                  </p>
                </div>
                <div className="space-y-3">
                  {displayedComposers.map((composer) => (
                    <Link
                      key={composer.id}
                      to={buildCompositorUrl(composer.id, composer.name)}
                      className="group flex items-center gap-4 bg-background-secondary hover:bg-background-tertiary p-4 rounded-lg transition-all duration-300"
                    >
                      <img
                        src={composer.imageUrl || `https://picsum.photos/seed/composer-${composer.id}/200/200`}
                        alt={composer.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
                          {composer.name}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                          {composer.totalHymns ? `${composer.totalHymns} hinos publicados` : 'Compositor'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {showAlbumsFilter && displayedAlbums.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    {activeFilter === 'albums' && !hasSearchQuery ? 'Todos os álbuns' : 'Álbuns em destaque'}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {activeFilter === 'albums' && !hasSearchQuery
                      ? `${displayedAlbums.length} álbuns públicos encontrados`
                      : 'Coleções para ouvir agora'}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayedAlbums.map((album) => (
                    <Link
                      key={album.id}
                      to={buildAlbumUrl(album.id, album.title, album.artist)}
                      className="p-3 rounded-lg hover:bg-background-hover transition-colors"
                    >
                      <img
                        src={album.coverUrl || `https://picsum.photos/seed/discovery-album-${album.id}/300/300`}
                        alt={album.title}
                        className="w-full h-36 object-cover rounded mb-3"
                      />
                      <div className="text-white font-medium truncate">{album.title}</div>
                      <div className="text-text-muted text-sm truncate">{album.artist || 'Álbum'}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {showPlaylistsFilter && displayedPlaylists.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    {activeFilter === 'playlists' && !hasSearchQuery ? 'Todas as playlists públicas' : 'Playlists públicas'}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {activeFilter === 'playlists' && !hasSearchQuery
                      ? `${displayedPlaylists.length} playlists públicas encontradas`
                      : 'Seleções para ouvir sem buscar'}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayedPlaylists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      to={`/playlist/${playlist.id}`}
                      className="p-3 rounded-lg hover:bg-background-hover transition-colors"
                    >
                      <img
                        src={playlist.coverUrl || `https://picsum.photos/seed/discovery-playlist-${playlist.id}/300/300`}
                        alt={playlist.name}
                        className="w-full h-36 object-cover rounded mb-3"
                      />
                      <div className="text-white font-medium truncate">{playlist.name}</div>
                      <div className="text-text-muted text-sm truncate">{playlist.description || 'Playlist'}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {!hasSearchQuery &&
              ((showArtistsFilter && displayedComposers.length === 0) ||
                (showAlbumsFilter && displayedAlbums.length === 0) ||
                (showPlaylistsFilter && displayedPlaylists.length === 0)) &&
              !showAllFilters && (
                <section className="text-center py-12">
                  <p className="text-gray-400">Nenhum conteúdo disponível para este filtro no momento.</p>
                </section>
              )}
          </div>
        )}
      </div>
    </>
  );
};

export default SearchPage;
