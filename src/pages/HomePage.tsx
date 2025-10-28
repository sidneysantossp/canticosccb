import React, { useState, useEffect, useRef } from 'react';
import SEOHead from '@/components/SEO/SEOHead';
import HeroSection from '@/components/home/HeroSection';
import CategoryGrid from '@/components/home/CategoryGrid';
import ComposersSection from '@/components/home/ComposersSection';
import BannerCTA from '@/components/home/BannerCTA';
import BibleSection from '@/components/home/BibleSection';
import { getBibleNarratedSectionEnabled } from '@/api/bibleNarrated';
import { usePlayerStore } from '@/stores/playerStore';
import usePlaylistsStore from '@/stores/playlistsStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import { useTouchScroll } from '@/hooks/useTouchScroll';
import { useFavorites } from '@/hooks/useFavorites';
import { generateWebsiteSchema, generateOrganizationSchema } from '@/utils/schemaGenerator';
import { getHomePageData, type HomePageData } from '@/lib/homeApi';
import { getPersonalizedHomeData, type PersonalizedData, type RecTrack } from '@/lib/recommendations';
import LoginRequiredModal from '@/components/modals/LoginRequiredModal';
import { useAuth } from '@/contexts/AuthContext';
import PersonalizedSection from '@/components/home/PersonalizedSection';
import { apiFetch } from '@/lib/api-helper';
import TrendsSection from '@/components/home/TrendsSection';
import AlbumsSection from '@/components/home/AlbumsSection';
import HymnsSection from '@/components/home/HymnsSection';
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
};

const HomePage: React.FC = () => {
  // Schema combinado para homepage
  const schemas = [
    generateWebsiteSchema(),
    generateOrganizationSchema()
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
        const res = await apiFetch('/api/hinos/index.php?sort=recent&limit=9&ativo=1');
        if (!res.ok) throw new Error('Falha ao carregar hinos');
        const json = await res.json();
        const list = Array.isArray(json?.hinos) ? json.hinos : Array.isArray(json) ? json : [];
        const normalized: PopularHino[] = list.map((h: any, index: number) => ({
          id: String(h.id),
          number: Number(h.numero ?? index + 1),
          title: String(h.titulo || h.title || 'Hino'),
          artist: String(h.compositor || h.composer_name || 'Artista Desconhecido'),
          category: String(h.categoria || 'Cantados'),
          duration: String(h.duracao || '—'),
          plays: 0,
          isLiked: false,
          coverUrl: String(h.cover_url || ''),
          audioUrl: String(h.audio_url || ''),
          createdAt: String(h.created_at || new Date().toISOString()),
        }));
        setHomepageTrends(normalized);
      } catch (error) {
        console.error('❌ Error loading recent hymns:', error);
        setHomepageTrends([]);
      }
    };
    loadRecentPublished();
  }, []);
  
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
  
  // Converter hinos cantados do backend (apenas categoria Cantados)
  console.log('ðŸŽµ homeData.hymnsCantados:', homeData.hymnsCantados?.length || 0, homeData.hymnsCantados);
  const hinosCantados = (homeData.hymnsCantados || [])
    .filter((h) => (h.category || '').toLowerCase() === 'cantados')
    .map(hymn => ({
      id: hymn.id,
      number: hymn.number,
      title: hymn.title,
      cover: hymn.cover_url || '',
      subtitle: hymn.composer_name || 'Hino Cantado'
    }));
  const hinosCantadosFinal = hinosCantados.filter(h => !!h.cover && h.cover.trim() !== '');
  
  console.log('ðŸŽµ Hinos Cantados (final):', hinosCantados.length, 'items');
  
  // Converter hinos tocados do backend (apenas categoria Tocados)
  console.log('ðŸŽ¹ homeData.hymnsTocados:', homeData.hymnsTocados?.length || 0, homeData.hymnsTocados);
  const hinosTocados = (homeData.hymnsTocados || [])
    .filter((h) => (h.category || '').toLowerCase() === 'tocados')
    .map(hymn => ({
      id: hymn.id,
      number: hymn.number,
      title: hymn.title,
      cover: hymn.cover_url || '',
      subtitle: hymn.composer_name || 'Hino Tocado'
    }));
  const hinosTocadosFinal = hinosTocados.filter(h => !!h.cover && h.cover.trim() !== '');
  
  console.log('ðŸŽ¹ Hinos Tocados (final):', hinosTocados.length, 'items');
  
  // Converter hinos avulsos do backend (apenas categoria Avulsos)
  console.log('ðŸŽ¼ homeData.hymnsAvulsos:', homeData.hymnsAvulsos?.length || 0, homeData.hymnsAvulsos);
  const hinosAvulsos = (homeData.hymnsAvulsos || [])
    .filter((h) => (h.category || '').toLowerCase() === 'avulsos')
    .map(hymn => ({
      id: hymn.id,
      number: hymn.number,
      title: hymn.title,
      cover: hymn.cover_url || '',
      subtitle: hymn.composer_name || 'Hino Avulso'
    }));
  const hinosAvulsosFinal = hinosAvulsos.filter(h => !!h.cover && h.cover.trim() !== '');
  
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
        title="Início"
        description="Plataforma de música religiosa da Congregação Cristã no Brasil. Ouça hinos clássicos, louvor e adoração. Descubra compositores e crie suas playlists."
        keywords="ccb, congregação cristã, hinos, música religiosa, louvor, adoração, playlist gospel"
        canonical="/"
        ogImage="/images/og-home.jpg"
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
            onPlay={(t: RecTrack) => handlePlayTrack({ id: t.id, title: t.title, artist: t.composer_name, coverUrl: t.cover_url, audioUrl: t.audio_url })}
          />
        )}
        {(() => {
          const hasFollowed = !!user?.id && personalized.byFollowedComposers.length > 0;
          return hasFollowed;
        })() && (
          <PersonalizedSection
            title="Dos compositores que você segue"
            items={personalized.byFollowedComposers}
            onPlay={(t: RecTrack) => handlePlayTrack({ id: t.id, title: t.title, artist: t.composer_name, coverUrl: t.cover_url, audioUrl: t.audio_url })}
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
        getTrendingArrow={getTrendingArrow}
        getRankChange={getRankChange}
        getTrendingIcon={getTrendingIcon}
      />

      {/* Albums Section */}
      <AlbumsSection
        albums={albums.map((a) => ({ id: a.id, title: a.title, artist: a.subtitle, coverUrl: a.cover }))}
      />

      <HymnsSection
        title="Hinos Cantados"
        viewAllHref="/categoria/cantados"
        items={isLoading ? undefined : hinosCantadosFinal}
        onPlay={handleTogglePlay}
        onScrollLeft={scrollLeft}
        onScrollRight={scrollRight}
      />

      <HymnsSection
        title="Hinos Tocados"
        viewAllHref="/categoria/tocados"
        items={isLoading ? undefined : hinosTocadosFinal}
        onPlay={handleTogglePlay}
        onScrollLeft={scrollLeft}
        onScrollRight={scrollRight}
      />

      <HymnsSection
        title="Hinos Avulsos"
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

      {/* Bible Section (togglable) */}
      {showBibleNarrated && (
        <div className="px-6">
          <BibleSection />
        </div>
      )}

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













