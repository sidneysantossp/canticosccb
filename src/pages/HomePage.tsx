import React, { useState, useEffect, useRef } from 'react';
import SEOHead from '@/components/SEO/SEOHead';
import HeroSection from '@/components/home/HeroSection';
import CategoryGrid from '@/components/home/CategoryGrid';
import ComposersSection from '@/components/home/ComposersSection';
import CifrasHomeSection from '@/components/home/CifrasHomeSection';
import BannerCTA from '@/components/home/BannerCTA';
import BibleSection from '@/components/home/BibleSection';
import { getBibleNarratedSectionEnabled } from '@/api/bibleNarrated';
import { usePlayerStore } from '@/stores/playerStore';
import usePlaylistsStore from '@/stores/playlistsStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import { useTouchScroll } from '@/hooks/useTouchScroll';
import { useFavorites } from '@/hooks/useFavorites';
import { generateWebsiteSchema, generateOrganizationSchema, generateFAQSchema } from '@/utils/schemaGenerator';
import { getHomePageData, type HomePageData } from '@/lib/homeApi';
import { getPersonalizedHomeData, type PersonalizedData, type RecTrack } from '@/lib/recommendations';
import LoginRequiredModal from '@/components/modals/LoginRequiredModal';
import { useAuth } from '@/contexts/AuthContext';
import PersonalizedSection from '@/components/home/PersonalizedSection';
import { apiFetch } from '@/lib/api-helper';
import TrendsSection from '@/components/home/TrendsSection';
import AlbumsSection from '@/components/home/AlbumsSection';
import HymnsSection from '@/components/home/HymnsSection';
import { isSupabaseConfigured, supabaseFetch } from '@/lib/supabaseRest';
type PopularHino = {
  id: string;
  number: number;
  title: string;
  artist: string;
  category: string;
  duration: string;
  plays: number;
  isLiked: boolean;
  coverUrl: string;
  audioUrl: string;
  createdAt: string;
  rank: number;
  previousRank: number;
  trending: 'up' | 'down' | 'stable';
  youtubeSource?: string;
};

type SupabaseHymnRow = {
  id?: number | string;
  numero?: number;
  titulo?: string;
  compositor?: string;
  compositor_nome?: string;
  categoria?: string;
  cover_url?: string;
  audio_url?: string;
  duracao?: string;
  created_at?: string;
  youtube_source?: string;
};

/**
 * Diversifica itens por compositor: máx 1 por compositor primeiro,
 * depois preenche com extras (round-robin) se não houver compositores suficientes.
 */
function diversifyByArtist<T extends { artist?: string }>(items: T[], maxItems: number): T[] {
  if (items.length <= 1) return items.slice(0, maxItems);

  const artistKey = (item: T) => (item.artist || 'unknown').toLowerCase().trim();

  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = artistKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const result: T[] = [];
  const seen = new Set<string>();

  // Rodada 1: 1 hino por compositor
  for (const [key, group] of groups) {
    if (result.length >= maxItems) break;
    result.push(group[0]);
    seen.add(`${key}-0`);
  }

  // Rodadas extras: preencher slots vazios com round-robin
  if (result.length < maxItems) {
    let round = 1;
    let added = true;
    while (added && result.length < maxItems) {
      added = false;
      for (const [key, group] of groups) {
        if (result.length >= maxItems) break;
        if (round < group.length && !seen.has(`${key}-${round}`)) {
          result.push(group[round]);
          seen.add(`${key}-${round}`);
          added = true;
        }
      }
      round++;
    }
  }

  return result.slice(0, maxItems);
}

const mapSupabasePopularHino = (row: SupabaseHymnRow, index: number): PopularHino => ({
  id: String(row.id ?? `recent-${index}`),
  number: Number(row.numero ?? index + 1),
  title: row.titulo ?? 'Hino',
  artist: row.compositor_nome ?? row.compositor ?? 'Canticos CCB',
  category: row.categoria ?? 'Cantados',
  duration: row.duracao ?? '00:00',
  plays: 0,
  isLiked: false,
  coverUrl: row.cover_url ?? '',
  audioUrl: row.audio_url ?? '',
  createdAt: row.created_at ?? new Date().toISOString(),
  rank: index + 1,
  previousRank: index + 1,
  trending: 'stable',
  youtubeSource: row.youtube_source || undefined,
});

const HomePage: React.FC = () => {
  // FAQ data for SEO
  const homeFAQs = [
    {
      question: 'Como ouvir hinos da CCB online grátis?',
      answer: 'No Cânticos CCB você pode ouvir todos os hinos do Hinário 5 gratuitamente, tanto cantados quanto tocados (instrumentais). Basta acessar canticosccb.com.br e buscar pelo número ou nome do hino.'
    },
    {
      question: 'O que é o Hinário 5 da CCB?',
      answer: 'O Hinário 5, oficialmente chamado "Hinos de Louvores e Súplicas a Deus", é o livro de hinos utilizado nos cultos da Congregação Cristã no Brasil. Contém 480 hinos com letras e partituras musicais.'
    },
    {
      question: 'Quantos hinos tem o Hinário 5?',
      answer: 'O Hinário 5 possui 480 hinos numerados, utilizados nos cultos e reuniões da Congregação Cristã no Brasil.'
    },
    {
      question: 'O que são cifras de hinos da CCB?',
      answer: 'Cifras são representações simplificadas das notas musicais e acordes de um hino, permitindo que músicos toquem os hinos em instrumentos como violão, teclado e outros. O Cânticos CCB oferece cifras gratuitas com transposição de tom.'
    },
    {
      question: 'Posso criar playlists de hinos da CCB?',
      answer: 'Sim! No Cânticos CCB você pode criar uma conta gratuita, salvar seus hinos favoritos e criar playlists personalizadas para ouvir a qualquer momento.'
    },
  ];

  // Schema combinado para homepage
  const schemas = [
    generateWebsiteSchema(),
    generateOrganizationSchema(),
    generateFAQSchema(homeFAQs),
  ];
  const { play, pause, currentTrack, isPlaying } = usePlayerStore();
  const { openFullScreen } = usePlayerContext();
  const { favorites, toggleFavorite, isFavorited } = useFavorites();
  const { playlists, addTrackToPlaylist } = usePlaylistsStore();
  const scrollContainerRef = useTouchScroll<HTMLDivElement>();
  
  // Estados para playlist modal
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<any>(null);
  
  // Estados para dados do backend
  const [homeData, setHomeData] = useState<HomePageData>({
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
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBibleNarrated, setShowBibleNarrated] = useState(true);
  
  const [homepageTrends, setHomepageTrends] = useState<PopularHino[]>([]);

  const popularHinos: PopularHino[] = homepageTrends;
  const popularHinosFiltered: PopularHino[] = popularHinos.filter(h => !!h.coverUrl && h.coverUrl.trim() !== '');
  
  console.log('ðŸŽµ Popular Hinos:', popularHinos.length, 'items');

  // Scroll to top quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sem mock visual para álbuns/hinos
  
  // Carregar dados da API
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setIsLoading(true);
        console.log('ðŸ  HomePage - Loading data...');
        
        // Timeout de 8 segundos para toda a operaÃ§Ã£o
        const dataPromise = getHomePageData();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('HomePage timeout')), 8000)
        );
        
        const data = await Promise.race([dataPromise, timeoutPromise]) as any;
        
        console.log('ðŸ  HomePage - Data received:', data);
        console.log('ðŸŽ¯ HomePage - Banners count:', data.banners?.length || 0);
        console.log('ðŸŽ¯ HomePage - Banners data:', data.banners);
        
        setHomeData(data);
      } catch (error) {
        console.error('âŒ Error loading homepage data:', error);
        console.warn('âš ï¸ Using fallback homepage data');
        
        // FALLBACK COMPLETO
        setHomeData({
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
          categories: []
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHomeData();
    // Carregar preferência de exibição da Bíblia Narrada
    (async () => {
      try {
        const enabled = await getBibleNarratedSectionEnabled();
        setShowBibleNarrated(enabled);
      } catch {
        setShowBibleNarrated(true);
      }
    })();
  }, []);

  // Recomendação personalizada
  const { user } = useAuth();
  const [personalized, setPersonalized] = useState<PersonalizedData>({ byCategories: [], byFollowedComposers: [], mix: [] });
  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setPersonalized({ byCategories: [], byFollowedComposers: [], mix: [] }); return; }
      try {
        const data = await getPersonalizedHomeData(String(user.id));
        setPersonalized(data);
      } catch (e) {
        console.warn('⚠️ Personalized data error', e);
        setPersonalized({ byCategories: [], byFollowedComposers: [], mix: [] });
      }
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    const loadRecentPublished = async () => {
      try {
        const rows = await supabaseFetch<SupabaseHymnRow>('hinos', {
          select: 'id,numero,titulo,compositor_nome,categoria,cover_url,audio_url,duracao,created_at,youtube_source',
          ativo: 'eq.true',
          order: 'created_at.desc',
          limit: '30',
        });
        if (rows.length > 0) {
          const mapped = rows.map(mapSupabasePopularHino);
          const diversified = diversifyByArtist(mapped, 12);
          setHomepageTrends(diversified);
        }
      } catch (error) {
        console.error('❌ Error loading recent hymns:', error);
      }
    };
    loadRecentPublished();
  }, []);

  // Fallback: usar hinos do homeData quando supabaseFetch retorna vazio
  useEffect(() => {
    if (homepageTrends.length === 0 && !isLoading) {
      const allHymns = [
        ...(homeData.hymnsCantados || []),
        ...(homeData.hymnsTocados || []),
        ...(homeData.hymnsAvulsos || []),
      ];
      if (allHymns.length > 0) {
        setHomepageTrends(allHymns.map((h, i) => ({
          id: h.id,
          number: h.number,
          title: h.title,
          artist: h.composer_name || 'Cânticos CCB',
          category: h.category || 'Cantados',
          duration: h.duration || '00:00',
          plays: 0,
          isLiked: false,
          coverUrl: h.cover_url || '',
          audioUrl: h.audio_url || '',
          createdAt: h.created_at || new Date().toISOString(),
          rank: i + 1,
          previousRank: i + 1,
          trending: 'stable' as const,
        })));
      }
    }
  }, [isLoading, homeData, homepageTrends.length]);
  
  // Calculate items to show based on screen size - always even numbers and multiples of 3
  const getItemsToShow = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) return 6; // Mobile: show 6 (1 column, even number)
      if (width < 1024) return 9; // Tablet: show 9 (3x3, multiple of 3)
      return 12; // Desktop: show 12 (3x4, multiple of 3)
    }
    return 6; // Default fallback for mobile
  };

  const [itemsToShow, setItemsToShow] = useState(6); // Start with 6 for mobile

  // Update items to show on window resize and initial load
  useEffect(() => {
    const handleResize = () => {
      setItemsToShow(getItemsToShow());
    };

    // Set initial value
    setItemsToShow(getItemsToShow());
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Favoritos gerenciados pelo hook customizado (inclui sincronizaÃ§Ã£o automÃ¡tica)

  // Usar apenas álbuns reais do banco de dados (sem placeholders)
  console.log('💿 homeData.albums:', homeData.albums?.length || 0, homeData.albums);
  const albums = homeData.albums && homeData.albums.length > 0
    ? homeData.albums.map(album => ({
        id: album.id,
        title: album.title,
        subtitle: album.artist || 'Congregação Cristã',
        cover: album.cover_url || ''
      }))
    : [];
  
  console.log('ðŸ’¿ Albums (final):', albums.length, 'items');

  const normalizeCategory = (value: string | undefined | null) =>
    String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  
  // Converter hinos cantados do backend (apenas categoria Cantados)
  console.log('ðŸŽµ homeData.hymnsCantados:', homeData.hymnsCantados?.length || 0, homeData.hymnsCantados);
  const hinosCantados = (homeData.hymnsCantados || [])
    .filter((h) => {
      const normalized = normalizeCategory(h.category);
      return normalized === 'cantados' || normalized.includes('cantados');
    })
    .map(hymn => ({
      id: hymn.id,
      number: hymn.number,
      title: hymn.title,
      cover: hymn.cover_url || '',
      subtitle: hymn.composer_name || 'Hino Cantado',
      audioUrl: hymn.youtube_source ? '' : (hymn.audio_url || ''),
      youtubeSource: hymn.youtube_source || undefined,
      artist: hymn.composer_name || 'Hino Cantado',
      coverUrl: hymn.cover_url || '',
    }));
  const hinosCantadosDiversified = diversifyByArtist(hinosCantados, 12);
  const hinosCantadosFinal = hinosCantadosDiversified.filter(h => !!h.cover && h.cover.trim() !== '');
  
  console.log('ðŸŽµ Hinos Cantados (final):', hinosCantados.length, 'items');
  
  // Converter hinos tocados do backend (apenas categoria Tocados)
  console.log('ðŸŽ¹ homeData.hymnsTocados:', homeData.hymnsTocados?.length || 0, homeData.hymnsTocados);
  const hinosTocados = (homeData.hymnsTocados || [])
    .filter((h) => {
      const normalized = normalizeCategory(h.category);
      return normalized === 'tocados' || normalized.includes('tocados');
    })
    .map(hymn => ({
      id: hymn.id,
      number: hymn.number,
      title: hymn.title,
      cover: hymn.cover_url || '',
      subtitle: hymn.composer_name || 'Hino Tocado',
      audioUrl: hymn.youtube_source ? '' : (hymn.audio_url || ''),
      youtubeSource: hymn.youtube_source || undefined,
      artist: hymn.composer_name || 'Hino Tocado',
      coverUrl: hymn.cover_url || '',
    }));
  const hinosTocadosDiversified = diversifyByArtist(hinosTocados, 12);
  const hinosTocadosFinal = hinosTocadosDiversified.filter(h => !!h.cover && h.cover.trim() !== '');
  
  console.log('ðŸŽ¹ Hinos Tocados (final):', hinosTocados.length, 'items');
  
  // Converter hinos avulsos do backend (apenas categoria Avulsos)
  console.log('ðŸŽ¼ homeData.hymnsAvulsos:', homeData.hymnsAvulsos?.length || 0, homeData.hymnsAvulsos);
  const hinosAvulsos = (homeData.hymnsAvulsos || [])
    .filter((h) => {
      const normalized = normalizeCategory(h.category);
      return normalized === 'avulsos' || normalized.includes('avulsos');
    })
    .map(hymn => ({
      id: hymn.id,
      number: hymn.number,
      title: hymn.title,
      cover: hymn.cover_url || '',
      subtitle: hymn.composer_name || 'Hino Avulso',
      audioUrl: hymn.youtube_source ? '' : (hymn.audio_url || ''),
      youtubeSource: hymn.youtube_source || undefined,
      artist: hymn.composer_name || 'Hino Avulso',
      coverUrl: hymn.cover_url || '',
    }));
  const hinosAvulsosDiversified = diversifyByArtist(hinosAvulsos, 12);
  const hinosAvulsosFinal = hinosAvulsosDiversified.filter(h => !!h.cover && h.cover.trim() !== '');
  
  console.log('ðŸŽ¼ Hinos Avulsos (final):', hinosAvulsos.length, 'items');

  // FunÃ§Ã£o para calcular mudanÃ§a de ranking
  const getRankChange = (hino: any) => {
    if (!hino.previousRank || !hino.rank) return null;
    const change = hino.previousRank - hino.rank;
    
    if (change > 0) {
      return <span className="text-green-400 text-xs font-semibold ml-1">â†‘{change}</span>;
    } else if (change < 0) {
      return <span className="text-red-400 text-xs font-semibold ml-1">â†“{Math.abs(change)}</span>;
    } else {
      return <span className="text-gray-500 text-xs ml-1">âˆ’</span>;
    }
  };
  
  // FunÃ§Ã£o para obter apenas o Ã­cone de trending (para mobile)
  const getTrendingIcon = (hino: any) => {
    if (!hino.previousRank || !hino.rank) return null;
    const change = hino.previousRank - hino.rank;
    
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-400">
          <span className="text-xs">â†‘</span>
          <span className="text-xs font-semibold">{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-400">
          <span className="text-xs">â†“</span>
          <span className="text-xs font-semibold">{Math.abs(change)}</span>
        </div>
      );
    } else {
      return <span className="text-gray-500 text-xs">âˆ’</span>;
    }
  };
  
  // FunÃ§Ã£o para obter apenas a seta (acima do nÃºmero)
  const getTrendingArrow = (hino: any) => {
    if (!hino.previousRank || !hino.rank) return null;
    const change = hino.previousRank - hino.rank;
    
    if (change > 0) {
      return <span className="text-green-400 text-xs">â†‘</span>;
    } else if (change < 0) {
      return <span className="text-red-400 text-xs">â†“</span>;
    } else {
      return <span className="text-gray-500 text-xs">âˆ’</span>;
    }
  };
  
  const handleTogglePlay = (hino: any) => {
    if (currentTrack?.id === hino.id && isPlaying) {
      // Pause current track
      // This would be handled by the player store
      pause();
    } else {
      play(hino);
      
      // Adicionar prÃ³ximas mÃºsicas na fila automaticamente
      const currentIndex = popularHinos.findIndex(h => h.id === hino.id);
      const nextSongs = popularHinos.slice(currentIndex + 1, currentIndex + 6); // PrÃ³ximas 5
      const { addToQueue, clearQueue } = usePlayerStore.getState();
      clearQueue();
      nextSongs.forEach(song => addToQueue(song));
      
      // Small delay to allow state to update before opening full screen
      setTimeout(() => {
        if (window.innerWidth < 768) { // Only on mobile
          openFullScreen();
        }
      }, 300);
    }
  };

  const handlePlayTrack = (track: any) => {
    play(track);
    // Small delay to allow state to update before opening full screen
    setTimeout(() => {
      if (window.innerWidth < 768) { // Only on mobile
        openFullScreen();
      }
    }, 300);
  };

  // Scroll functions for albums carousel
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <SEOHead
        title="Cânticos CCB — Ouça Hinos da Congregação Cristã no Brasil | Hinário 5, Cifras e Compositores"
        description="Ouça hinos da CCB online grátis. Hinário 5 completo com hinos cantados e tocados, cifras, compositores e playlists da Congregação Cristã no Brasil. Crie sua conta e salve seus hinos favoritos."
        keywords="hinos CCB, hinário 5, congregação cristã no brasil, cifras CCB, hinos cantados, hinos tocados, compositores CCB, ouvir hinos CCB online grátis, hinos de louvores e súplicas a deus"
        canonical="/"
        ogImage="/logo-canticos-ccb.png"
        schemaData={schemas}
      />
      
      <div className="space-y-8">
        {/* Hero Section */}
        <HeroSection banners={homeData.banners} />

        {/* Personalized Sections */}
        {personalized.mix.length > 0 && (
          <PersonalizedSection
            title="Recomendado para você"
            items={personalized.mix}
            onPlay={(t: RecTrack) => handlePlayTrack({ id: t.id, title: t.title, artist: t.composer_name, coverUrl: t.cover_url, audioUrl: t.youtube_source ? '' : t.audio_url, youtubeSource: t.youtube_source || undefined })}
          />
        )}
        {(() => {
          const hasFollowed = !!user?.id && personalized.byFollowedComposers.length > 0;
          return hasFollowed;
        })() && (
          <PersonalizedSection
            title="Dos compositores que você segue"
            items={personalized.byFollowedComposers}
            onPlay={(t: RecTrack) => handlePlayTrack({ id: t.id, title: t.title, artist: t.composer_name, coverUrl: t.cover_url, audioUrl: t.youtube_source ? '' : t.audio_url, youtubeSource: t.youtube_source || undefined })}
          />
        )}

      {/* Popular Hinos Section */}
      <TrendsSection
        title="Recém publicados"
        items={popularHinosFiltered}
        currentTrackId={currentTrack?.id || null}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        isFavorited={isFavorited}
        onToggleFavorite={(hymnId: string) => toggleFavorite(hymnId, () => setShowLoginModal(true))}
      />

      {/* Albums Section */}
      <AlbumsSection
        albums={albums.map((a) => ({ id: a.id, title: a.title, artist: a.subtitle, coverUrl: a.cover }))}
      />

      <HymnsSection
        title={<>Hinos<br />Cantados</>}
        viewAllHref="/categoria/cantados"
        items={isLoading ? undefined : hinosCantadosFinal}
        onPlay={handleTogglePlay}
        onScrollLeft={scrollLeft}
        onScrollRight={scrollRight}
      />

      <HymnsSection
        title={<>Hinos<br />Tocados</>}
        viewAllHref="/categoria/tocados"
        items={isLoading ? undefined : hinosTocadosFinal}
        onPlay={handleTogglePlay}
        onScrollLeft={scrollLeft}
        onScrollRight={scrollRight}
      />

      <HymnsSection
        title={<>Hinos<br />Avulsos</>}
        viewAllHref="/categoria/avulsos"
        items={isLoading ? undefined : hinosAvulsosFinal}
        onPlay={handleTogglePlay}
        onScrollLeft={scrollLeft}
        onScrollRight={scrollRight}
      />

      {/* Category Grid */}
      <div className="px-6">
        <CategoryGrid />
      </div>

      {/* Composers Section */}
      <div className="px-6">
        <ComposersSection />
      </div>

      {/* Cifras Section */}
      <div className="px-6">
        <CifrasHomeSection />
      </div>

      {/* Bible Section (togglable) */}
      {showBibleNarrated && (
        <div className="px-6">
          <BibleSection />
        </div>
      )}

      {/* FAQ Section - SEO */}
      <div className="px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {homeFAQs.map((faq, i) => (
              <details key={i} className="group bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-white font-medium text-sm md:text-base hover:bg-gray-800/60 transition-colors list-none">
                  <span>{faq.question}</span>
                  <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform text-xs">▼</span>
                </summary>
                <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Banner CTA */}
      <div className="px-6">
        <BannerCTA />
      </div>
      </div>

      {/* Modal de Login Necessário */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Login Necessário"
        message="Você precisa estar logado para adicionar favoritos"
      />

      {/* Debug Panel - REMOVIDO TEMPORARIAMENTE PARA DEBUG */}
      {/* <DebugPanel data={homeData} isLoading={isLoading} /> */}
    </>
  );
};

export default HomePage;













