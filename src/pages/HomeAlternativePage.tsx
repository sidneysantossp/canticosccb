import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import HeroSectionAlt from '@/components/home-alt/HeroSectionAlt';
import CategoryGridAlt from '@/components/home-alt/CategoryGridAlt';
import ComposersSectionAlt from '@/components/home-alt/ComposersSectionAlt';
import BannerCTAAlt from '@/components/home-alt/BannerCTAAlt';
import BibleSectionAlt from '@/components/home-alt/BibleSectionAlt';
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
import PersonalizedSectionAlt from '@/components/home-alt/PersonalizedSectionAlt';
import TrendsSectionAlt from '@/components/home-alt/TrendsSectionAlt';
import AlbumsSectionAlt from '@/components/home-alt/AlbumsSectionAlt';
import HymnsSectionAlt from '@/components/home-alt/HymnsSectionAlt';
import { supabaseFetch } from '@/lib/supabaseRest';
import { hasPlayableTrackSource } from '@/lib/playerFeedback';
import { resolveEmergencyArchiveTrack } from '@/lib/emergencyAudioResolver';
import { prewarmEmergencyPlaybackUrl } from '@/lib/emergencyAudioPlayback';

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

const HomeAlternativePage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const schemas = [
    generateWebsiteSchema(),
    generateOrganizationSchema()
  ];
  
  const { play, pause, currentTrack, isPlaying } = usePlayerStore();
  const { openFullScreen } = usePlayerContext();
  const { favorites, toggleFavorite, isFavorited } = useFavorites();
  const { playlists, addTrackToPlaylist } = usePlaylistsStore();
  const scrollContainerRef = useTouchScroll<HTMLDivElement>();
  
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<any>(null);
  
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
  const popularHinosFiltered: PopularHino[] = popularHinos.filter((h) =>
    !!h.coverUrl &&
    h.coverUrl.trim() !== '' &&
    hasPlayableTrackSource({
      number: h.number,
      title: h.title,
      artist: h.artist,
      audioUrl: h.audioUrl,
      youtubeSource: h.youtubeSource,
    })
  );

  useEffect(() => {
    const timers: number[] = [];
    const warmCandidates = homepageTrends
      .slice(0, 4)
      .map((track) => resolveEmergencyArchiveTrack({
        id: track.id,
        number: track.number,
        title: track.title,
        artist: track.artist,
        category: track.category,
        duration: track.duration,
        plays: track.plays,
        isLiked: track.isLiked,
        createdAt: track.createdAt,
        coverUrl: track.coverUrl,
        audioUrl: track.audioUrl,
        youtubeSource: track.youtubeSource,
      } as any))
      .filter((track): track is NonNullable<typeof track> => !!track?.audioUrl);

    warmCandidates.forEach((track, index) => {
      const timer = window.setTimeout(() => {
        void prewarmEmergencyPlaybackUrl(track.audioUrl);
      }, index * 350);
      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [homepageTrends]);
  
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setIsLoading(true);
        const dataPromise = getHomePageData();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('HomePage timeout')), 8000)
        );
        
        const data = await Promise.race([dataPromise, timeoutPromise]) as any;
        setHomeData(data);
      } catch (error) {
        console.error('Error loading homepage data:', error);
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
    (async () => {
      try {
        const enabled = await getBibleNarratedSectionEnabled();
        setShowBibleNarrated(enabled);
      } catch {
        setShowBibleNarrated(true);
      }
    })();
  }, []);

  const { user } = useAuth();
  const [personalized, setPersonalized] = useState<PersonalizedData>({ byCategories: [], byFollowedComposers: [], mix: [] });
  
  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setPersonalized({ byCategories: [], byFollowedComposers: [], mix: [] }); return; }
      try {
        const data = await getPersonalizedHomeData(String(user.id));
        setPersonalized(data);
      } catch (e) {
        setPersonalized({ byCategories: [], byFollowedComposers: [], mix: [] });
      }
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    const loadRecentPublished = async () => {
      try {
        let normalized: PopularHino[] = [];
        normalized = await supabaseFetch<SupabaseHymnRow>('hinos', {
          select: 'id,numero,titulo,compositor_nome,categoria,cover_url,audio_url,duracao,created_at,youtube_source',
          ativo: 'eq.true',
          status: 'eq.published',
          order: 'created_at.desc',
          limit: '12',
        }).then(rows => rows.map(mapSupabasePopularHino));
        setHomepageTrends(normalized);
      } catch (error) {
        setHomepageTrends([]);
      }
    };
    loadRecentPublished();
  }, []);
  
  const getItemsToShow = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) return 6;
      if (width < 1024) return 9;
      return 12;
    }
    return 6;
  };

  const [itemsToShow, setItemsToShow] = useState(6);

  useEffect(() => {
    const handleResize = () => {
      setItemsToShow(getItemsToShow());
    };

    setItemsToShow(getItemsToShow());
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const albums = homeData.albums && homeData.albums.length > 0
    ? homeData.albums.map(album => ({
        id: album.id,
        title: album.title,
        subtitle: album.artist || 'Congregação Cristã',
        cover: album.cover_url || ''
      }))
    : [];
  
  const hinosCantados = (homeData.hymnsCantados || [])
    .filter((h) => (h.category || '').toLowerCase() === 'cantados')
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
  const hinosCantadosFinal = hinosCantados.filter((h) =>
    !!h.cover &&
    h.cover.trim() !== '' &&
    hasPlayableTrackSource({
      number: h.number,
      title: h.title,
      artist: h.artist,
      audioUrl: h.audioUrl,
      youtubeSource: h.youtubeSource,
    })
  );
  
  const hinosTocados = (homeData.hymnsTocados || [])
    .filter((h) => (h.category || '').toLowerCase() === 'tocados')
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
  const hinosTocadosFinal = hinosTocados.filter((h) =>
    !!h.cover &&
    h.cover.trim() !== '' &&
    hasPlayableTrackSource({
      number: h.number,
      title: h.title,
      artist: h.artist,
      audioUrl: h.audioUrl,
      youtubeSource: h.youtubeSource,
    })
  );
  
  const hinosAvulsos = (homeData.hymnsAvulsos || [])
    .filter((h) => (h.category || '').toLowerCase() === 'avulsos')
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
  const hinosAvulsosFinal = hinosAvulsos.filter((h) =>
    !!h.cover &&
    h.cover.trim() !== '' &&
    hasPlayableTrackSource({
      number: h.number,
      title: h.title,
      artist: h.artist,
      audioUrl: h.audioUrl,
      youtubeSource: h.youtubeSource,
    })
  );

  const getRankChange = (hino: any) => {
    if (!hino.previousRank || !hino.rank) return null;
    const change = hino.previousRank - hino.rank;
    
    if (change > 0) {
      return <span className="text-green-400 text-xs font-semibold ml-1">↑{change}</span>;
    } else if (change < 0) {
      return <span className="text-red-400 text-xs font-semibold ml-1">↓{Math.abs(change)}</span>;
    } else {
      return <span className="text-gray-500 text-xs ml-1">−</span>;
    }
  };
  
  const getTrendingIcon = (hino: any) => {
    if (!hino.previousRank || !hino.rank) return null;
    const change = hino.previousRank - hino.rank;
    
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-400">
          <span className="text-xs">↑</span>
          <span className="text-xs font-semibold">{change}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-400">
          <span className="text-xs">↓</span>
          <span className="text-xs font-semibold">{Math.abs(change)}</span>
        </div>
      );
    } else {
      return <span className="text-gray-500 text-xs">−</span>;
    }
  };
  
  const getTrendingArrow = (hino: any) => {
    if (!hino.previousRank || !hino.rank) return null;
    const change = hino.previousRank - hino.rank;
    
    if (change > 0) {
      return <span className="text-green-400 text-xs">↑</span>;
    } else if (change < 0) {
      return <span className="text-red-400 text-xs">↓</span>;
    } else {
      return <span className="text-gray-500 text-xs">−</span>;
    }
  };
  
  const handleTogglePlay = (hino: any) => {
    if (currentTrack?.id === hino.id && isPlaying) {
      pause();
    } else {
      const started = play(hino);
      if (started === false) return;
      
      const currentIndex = popularHinos.findIndex(h => h.id === hino.id);
      const nextSongs = popularHinos.slice(currentIndex + 1, currentIndex + 6);
      const { addToQueue, clearQueue } = usePlayerStore.getState();
      clearQueue();
      nextSongs.forEach(song => addToQueue(song));
      
      setTimeout(() => {
        if (window.innerWidth < 768) {
          openFullScreen();
        }
      }, 300);
    }
  };

  const handlePlayTrack = (track: any) => {
    const started = play(track);
    if (started === false) return;
    setTimeout(() => {
      if (window.innerWidth < 768) {
        openFullScreen();
      }
    }, 300);
  };

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
        title="Início - Tema Alternativo"
        description="Plataforma de hinos da Congregação Cristã no Brasil. Ouça hinos clássicos, louvor e adoração. Descubra compositores e crie suas playlists."
        keywords="ccb, congregação cristã, hinos, hinos religiosos, louvor, adoração, playlist gospel"
        canonical="/home-alt"
        ogImage="/images/og-home.jpg"
        schemaData={schemas}
      />
      
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
        {/* Theme Toggle Button */}
        <div className="fixed top-20 right-6 z-50">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-gray-200' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="space-y-8 pb-24">
          {/* Hero Section */}
          <HeroSectionAlt banners={homeData.banners} isDarkMode={isDarkMode} />

          {/* Personalized Sections */}
          {personalized.mix.length > 0 && (
            <PersonalizedSectionAlt
              title="Recomendado para você"
              items={personalized.mix}
              onPlay={(t: RecTrack) => handlePlayTrack({ id: t.id, number: t.number, category: t.category || 'Hinos CCB', title: t.title, artist: t.composer_name, duration: '00:00', plays: 0, isLiked: false, createdAt: new Date().toISOString(), coverUrl: t.cover_url, audioUrl: t.youtube_source ? '' : t.audio_url, youtubeSource: t.youtube_source || undefined })}
              isDarkMode={isDarkMode}
            />
          )}
          {(() => {
            const hasFollowed = !!user?.id && personalized.byFollowedComposers.length > 0;
            return hasFollowed;
          })() && (
            <PersonalizedSectionAlt
              title="Dos compositores que você segue"
              items={personalized.byFollowedComposers}
              onPlay={(t: RecTrack) => handlePlayTrack({ id: t.id, number: t.number, category: t.category || 'Hinos CCB', title: t.title, artist: t.composer_name, duration: '00:00', plays: 0, isLiked: false, createdAt: new Date().toISOString(), coverUrl: t.cover_url, audioUrl: t.youtube_source ? '' : t.audio_url, youtubeSource: t.youtube_source || undefined })}
              isDarkMode={isDarkMode}
            />
          )}

          {/* Popular Hinos Section */}
          <TrendsSectionAlt
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
            isDarkMode={isDarkMode}
          />

          {/* Albums Section */}
          <AlbumsSectionAlt
            albums={albums.map((a) => ({ id: a.id, title: a.title, artist: a.subtitle, coverUrl: a.cover }))}
            isDarkMode={isDarkMode}
          />

          <HymnsSectionAlt
            title="Hinos Cantados"
            viewAllHref="/hinos-cantados-ccb"
            items={isLoading ? undefined : hinosCantadosFinal}
            onPlay={handleTogglePlay}
            onScrollLeft={scrollLeft}
            onScrollRight={scrollRight}
            isDarkMode={isDarkMode}
          />

          <HymnsSectionAlt
            title="Hinos Tocados"
            viewAllHref="/hinos-tocados-ccb"
            items={isLoading ? undefined : hinosTocadosFinal}
            onPlay={handleTogglePlay}
            onScrollLeft={scrollLeft}
            onScrollRight={scrollRight}
            isDarkMode={isDarkMode}
          />

          <HymnsSectionAlt
            title="Hinos Avulsos"
            viewAllHref="/hinos-avulsos-ccb"
            items={isLoading ? undefined : hinosAvulsosFinal}
            onPlay={handleTogglePlay}
            onScrollLeft={scrollLeft}
            onScrollRight={scrollRight}
            isDarkMode={isDarkMode}
          />

          {/* Category Grid */}
          <div className="px-6">
            <CategoryGridAlt isDarkMode={isDarkMode} />
          </div>

          {/* Composers Section */}
          <div className="px-6">
            <ComposersSectionAlt isDarkMode={isDarkMode} />
          </div>

          {/* Bible Section */}
          {showBibleNarrated && (
            <div className="px-6">
              <BibleSectionAlt isDarkMode={isDarkMode} />
            </div>
          )}

          {/* Banner CTA */}
          <div className="px-6">
            <BannerCTAAlt isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Modal de Login Necessário */}
        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Login Necessário"
          message="Você precisa estar logado para adicionar favoritos"
        />
      </div>
    </>
  );
};

export default HomeAlternativePage;
