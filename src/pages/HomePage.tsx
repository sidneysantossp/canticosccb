import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { DEFAULT_COVER_IDENTIFIER } from '@/lib/config';
import { prewarmEmergencyPlaybackUrl } from '@/lib/emergencyAudioPlayback';
import { resolveTrackAudioUrl } from '@/lib/playableAudio';
import { getEmergencyCatalog, type EmergencyCatalog, type EmergencyHymn } from '@/lib/emergencyCatalog';
import { normalizeYoutubeSource } from '@/lib/youtubeSource';
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

type HomeSectionCard = {
  id: string;
  number: number;
  title: string;
  cover: string;
  subtitle: string;
  audioUrl: string;
  youtubeSource?: string;
  artist: string;
  coverUrl: string;
  category: string;
  duration: string;
  plays: number;
  isLiked: boolean;
  createdAt: string;
};

type PlaybackHomeTrack = {
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
  youtubeSource?: string;
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

const mapHomeHymnToPopular = (row: HomePageData['newReleases'][number], index: number): PopularHino => ({
  id: String(row.id ?? `home-${index}`),
  number: Number(row.number ?? index + 1),
  title: row.title ?? 'Hino',
  artist: row.composer_name ?? 'Canticos CCB',
  category: row.category ?? 'Cantados',
  duration: row.duration ?? '00:00',
  plays: 0,
  isLiked: false,
  coverUrl: row.cover_url ?? '',
  audioUrl: normalizeYoutubeSource(row.youtube_source) ? '' : (row.audio_url ?? ''),
  createdAt: row.created_at ?? new Date().toISOString(),
  rank: index + 1,
  previousRank: index + 1,
  trending: 'stable',
  youtubeSource: normalizeYoutubeSource(row.youtube_source),
});

const mapEmergencyHymnToHomeSectionCard = (hymn: EmergencyHymn, fallbackSubtitle: string): HomeSectionCard => ({
  id: String(hymn.id),
  number: Number(hymn.numero ?? 0),
  title: String(hymn.titulo || 'Hino'),
  cover: hymn.cover_url || '',
  subtitle: String(hymn.compositor_nome || fallbackSubtitle),
  audioUrl: normalizeYoutubeSource(hymn.youtube_source) ? '' : String(hymn.audio_url || ''),
  youtubeSource: normalizeYoutubeSource(hymn.youtube_source),
  artist: String(hymn.compositor_nome || fallbackSubtitle),
  coverUrl: hymn.cover_url || '',
  category: String(hymn.categoria || fallbackSubtitle),
  duration: hymn.duracao || '00:00',
  plays: 0,
  isLiked: false,
  createdAt: hymn.created_at || new Date().toISOString(),
});

const mapEmergencyHymnToPopular = (hymn: EmergencyHymn, index: number): PopularHino => ({
  id: String(hymn.id),
  number: Number(hymn.numero ?? index + 1),
  title: String(hymn.titulo || 'Hino'),
  artist: String(hymn.compositor_nome || 'Canticos CCB'),
  category: String(hymn.categoria || 'Cantados'),
  duration: hymn.duracao || '00:00',
  plays: 0,
  isLiked: false,
  coverUrl: hymn.cover_url || '',
  audioUrl: normalizeYoutubeSource(hymn.youtube_source) ? '' : String(hymn.audio_url || ''),
  createdAt: hymn.created_at || new Date().toISOString(),
  rank: index + 1,
  previousRank: index + 1,
  trending: 'stable',
  youtubeSource: normalizeYoutubeSource(hymn.youtube_source),
});

const isServerMediatedPlaybackUrl = (value?: string | null) => {
  const normalized = String(value || '').trim();
  return (
    normalized.includes('/api/emergency-audio-track')
    || normalized.includes('/api/hino-audio-fallback')
  );
};

const hasHomeReadyTrackSource = (track?: {
  id?: string | number | null;
  number?: number | string | null;
  title?: string;
  artist?: string;
  audioUrl?: string | null;
  youtubeSource?: string | null;
}) => {
  const youtubeSource = normalizeYoutubeSource(track?.youtubeSource);
  if (youtubeSource) return false;

  const resolvedUrl = resolveTrackAudioUrl({
    id: track?.id ?? track?.number ?? '',
    number: track?.number ?? 0,
    title: track?.title ?? '',
    audioUrl: track?.audioUrl ?? '',
    youtubeSource,
  });

  return Boolean(resolvedUrl);
};

const hasHomeVisibleTrackSource = (track?: Parameters<typeof hasHomeReadyTrackSource>[0]) =>
  Boolean(normalizeYoutubeSource(track?.youtubeSource)) || hasHomeReadyTrackSource(track);

const normalizeHomeCategory = (value: string | undefined | null) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const matchesAvulsoTitle = (value: string | undefined | null) => {
  const normalized = normalizeHomeCategory(value);
  return normalized.includes('hino avulso') || normalized.includes('hinos avulso');
};

const buildStableHomeSelections = (catalog: EmergencyCatalog) => {
  const activeHymns = catalog.hymns
    .filter((hymn) => hymn.ativo !== false)
    .sort((left, right) => {
      const leftDate = left.created_at ? new Date(left.created_at).getTime() : 0;
      const rightDate = right.created_at ? new Date(right.created_at).getTime() : 0;
      return rightDate - leftDate;
    });

  const directPlayable = activeHymns.filter((hymn) =>
    hasHomeReadyTrackSource({
      id: hymn.id,
      number: hymn.numero,
      title: hymn.titulo,
      artist: hymn.compositor_nome,
      audioUrl: hymn.audio_url || '',
      youtubeSource: hymn.youtube_source || '',
    })
  );

  const byCategory = (keyword: string, fallbackSubtitle: string) =>
    directPlayable
      .filter((hymn) => normalizeHomeCategory(hymn.categoria).includes(keyword))
      .map((hymn) => mapEmergencyHymnToHomeSectionCard(hymn, fallbackSubtitle));

  return {
    recent: diversifyByArtist(directPlayable.map(mapEmergencyHymnToPopular), 12),
    cantados: diversifyByArtist(byCategory('cantad', 'Hino Cantado'), 12),
    tocados: diversifyByArtist(
      directPlayable
        .filter((hymn) => {
          const normalizedCategory = normalizeHomeCategory(hymn.categoria);
          return normalizedCategory.includes('tocad') || normalizedCategory.includes('instrument');
        })
        .map((hymn) => mapEmergencyHymnToHomeSectionCard(hymn, 'Hino Tocado')),
      12
    ),
    avulsos: diversifyByArtist(
      activeHymns
        .filter((hymn) =>
          hasHomeVisibleTrackSource({
            id: hymn.id,
            number: hymn.numero,
            title: hymn.titulo,
            artist: hymn.compositor_nome,
            audioUrl: hymn.audio_url || '',
            youtubeSource: hymn.youtube_source || '',
          })
        )
        .filter((hymn) => matchesAvulsoTitle(hymn.titulo))
        .map((hymn) => mapEmergencyHymnToHomeSectionCard(hymn, 'Hino Avulso')),
      12
    ),
  };
};

const buildHomeTrackLookupKey = (title?: string, number?: number | string | null) =>
  `${Number(number || 0)}::${normalizeHomeCategory(title)}`;

const normalizeHomeTrackForPlayback = (track: any): PlaybackHomeTrack => ({
  id: String(track?.id || ''),
  number: Number(track?.number || 0),
  title: String(track?.title || 'Hino'),
  artist: String(track?.artist || track?.subtitle || 'Canticos CCB'),
  category: String(track?.category || 'Hinos CCB'),
  duration: String(track?.duration || '00:00'),
  plays: Number(track?.plays || 0),
  isLiked: Boolean(track?.isLiked),
  coverUrl: String(track?.coverUrl || track?.cover || ''),
  audioUrl: String(track?.audioUrl || ''),
  createdAt: String(track?.createdAt || new Date().toISOString()),
  youtubeSource: normalizeYoutubeSource(track?.youtubeSource),
});

const EMPTY_HOME_DATA: HomePageData = {
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

const HomePage: React.FC = () => {
  // FAQ data for SEO
  const homeFAQs = [
    {
      question: 'Como ouvir hinos da CCB online grátis?',
      answer: 'No Cânticos CCB você pode ouvir hinos publicados gratuitamente, tanto cantados quanto tocados (instrumentais). Basta acessar www.canticosccb.com.br e buscar pelo número ou nome do hino.'
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
      question: 'Onde ouvir Bíblia narrada CCB?',
      answer: 'O Cânticos CCB possui uma área pública de Bíblia narrada com navegação por livros, capítulos publicados e links para outros conteúdos relacionados da plataforma.'
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
  const [homeData, setHomeData] = useState<HomePageData>(EMPTY_HOME_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBibleNarrated, setShowBibleNarrated] = useState(true);
  
  const [homepageTrends, setHomepageTrends] = useState<PopularHino[]>([]);
  const [stableHomeSelections, setStableHomeSelections] = useState<{
    recent: PopularHino[];
    cantados: HomeSectionCard[];
    tocados: HomeSectionCard[];
    avulsos: HomeSectionCard[];
  }>({
    recent: [],
    cantados: [],
    tocados: [],
    avulsos: [],
  });

  const popularHinos: PopularHino[] = homepageTrends;
  const popularHinosFiltered: PopularHino[] = popularHinos.filter((hino) =>
    hasHomeReadyTrackSource({
      id: hino.id,
      number: hino.number,
      title: hino.title,
      artist: hino.artist,
      audioUrl: hino.audioUrl,
      youtubeSource: hino.youtubeSource,
    })
  );

  const stableTrackLookup = useMemo(() => {
    const byId = new Map<string, PlaybackHomeTrack>();
    const byKey = new Map<string, PlaybackHomeTrack>();
    const byTitle = new Map<string, PlaybackHomeTrack>();

    const register = (track: any) => {
      const normalized = normalizeHomeTrackForPlayback(track);
      if (!hasHomeReadyTrackSource(normalized)) return;

      if (normalized.id) {
        byId.set(normalized.id, normalized);
      }

      byKey.set(buildHomeTrackLookupKey(normalized.title, normalized.number), normalized);
      byTitle.set(normalizeHomeCategory(normalized.title), normalized);
    };

    stableHomeSelections.recent.forEach(register);
    stableHomeSelections.cantados.forEach(register);
    stableHomeSelections.tocados.forEach(register);
    stableHomeSelections.avulsos.forEach(register);

    return { byId, byKey, byTitle };
  }, [stableHomeSelections]);

  const resolveHomeTrackForPlayback = (track: any): PlaybackHomeTrack => {
    const normalized = normalizeHomeTrackForPlayback(track);
    const byIdMatch = stableTrackLookup.byId.get(normalized.id);
    const byKeyMatch = stableTrackLookup.byKey.get(buildHomeTrackLookupKey(normalized.title, normalized.number));
    const byTitleMatch = stableTrackLookup.byTitle.get(normalizeHomeCategory(normalized.title));
    const stableMatch = byIdMatch || byKeyMatch || byTitleMatch;

    if (!stableMatch) {
      return normalized;
    }

    return {
      ...normalized,
      category: normalized.category || stableMatch.category,
      duration: normalized.duration && normalized.duration !== '00:00' ? normalized.duration : stableMatch.duration,
      coverUrl: normalized.coverUrl || stableMatch.coverUrl,
      audioUrl: stableMatch.audioUrl || normalized.audioUrl,
      youtubeSource: stableMatch.youtubeSource || normalized.youtubeSource,
      createdAt: normalized.createdAt || stableMatch.createdAt,
    };
  };

  useEffect(() => {
    const timers: number[] = [];
    const warmCandidates = homepageTrends
      .slice(0, 4)
      .map((track) =>
        resolveTrackAudioUrl({
          id: track.id,
          number: track.number,
          title: track.title,
          artist: track.artist,
          audioUrl: track.audioUrl,
          youtubeSource: track.youtubeSource,
        })
      )
      .filter((url): url is string => Boolean(url) && !isServerMediatedPlaybackUrl(url));

    warmCandidates.forEach((audioUrl, index) => {
      const timer = window.setTimeout(() => {
        void prewarmEmergencyPlaybackUrl(audioUrl);
      }, index * 350);
      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [homepageTrends]);

  // Scroll to top quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sem mock visual para álbuns/hinos
  
  // Carregar dados da API
  useEffect(() => {
    const loadHomeData = async () => {
      let resolvedEmergency = false;
      try {
        setIsLoading(true);

        try {
          const emergencyCatalog = await getEmergencyCatalog();
          setStableHomeSelections(buildStableHomeSelections(emergencyCatalog));
          resolvedEmergency = true;
          setIsLoading(false);
        } catch (emergencyError) {
          console.warn('⚠️ Emergency catalog unavailable on homepage:', emergencyError);
          setStableHomeSelections({
            recent: [],
            cantados: [],
            tocados: [],
            avulsos: [],
          });
        }

        const dataPromise = getHomePageData();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('HomePage timeout')), 8000)
        );
        const data = await Promise.race([dataPromise, timeoutPromise]) as HomePageData;
        setHomeData(data);
      } catch (error) {
        console.error('âŒ Error loading homepage data:', error);
        setHomeData(EMPTY_HOME_DATA);
      } finally {
        if (!resolvedEmergency) {
          setIsLoading(false);
        }
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
  const personalizedMixPlayable = personalized.mix.filter((track) =>
    hasHomeReadyTrackSource({
      id: track.id,
      number: track.number,
      title: track.title,
      artist: track.composer_name,
      audioUrl: track.audio_url,
      youtubeSource: track.youtube_source,
    })
  );
  const personalizedFollowedPlayable = personalized.byFollowedComposers.filter((track) =>
    hasHomeReadyTrackSource({
      id: track.id,
      number: track.number,
      title: track.title,
      artist: track.composer_name,
      audioUrl: track.audio_url,
      youtubeSource: track.youtube_source,
    })
  );
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
    if (isLoading) return;

    if (stableHomeSelections.recent.length > 0) {
      setHomepageTrends(stableHomeSelections.recent);
      return;
    }

    const merged = [
      ...(homeData.newReleases || []),
      ...(homeData.hymnsCantados || []),
      ...(homeData.hymnsTocados || []),
      ...(homeData.hymnsAvulsos || []),
    ];

    if (merged.length === 0) {
      setHomepageTrends([]);
      return;
    }

    const unique = Array.from(
      new Map(merged.map((hymn) => [String(hymn.id), hymn])).values()
    )
      .sort((left, right) => {
        const leftDate = left.created_at ? new Date(left.created_at).getTime() : 0;
        const rightDate = right.created_at ? new Date(right.created_at).getTime() : 0;
        return rightDate - leftDate;
      })
      .map(mapHomeHymnToPopular)
      .filter((hino) =>
        hasHomeReadyTrackSource({
          id: hino.id,
          number: hino.number,
          title: hino.title,
          artist: hino.artist,
          audioUrl: hino.audioUrl,
          youtubeSource: hino.youtubeSource,
        })
      );

    const withCover = unique.filter((hino) => hino.coverUrl && hino.coverUrl.trim() !== '');
    const withoutCover = unique.filter((hino) => !hino.coverUrl || hino.coverUrl.trim() === '');
    const maxItems = 12;
    const diversifiedCover = diversifyByArtist(withCover, maxItems);
    const remaining = maxItems - diversifiedCover.length;
    const diversifiedNoCover = remaining > 0 ? diversifyByArtist(withoutCover, remaining) : [];

    setHomepageTrends([...diversifiedCover, ...diversifiedNoCover].slice(0, maxItems));
  }, [isLoading, homeData, stableHomeSelections]);
  
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
  const albums = homeData.albums && homeData.albums.length > 0
    ? homeData.albums.map(album => ({
        id: album.id,
        title: album.title,
        subtitle: album.artist || 'Congregação Cristã',
        cover: album.cover_url || ''
      }))
    : [];

  const DEFAULT_COVER = DEFAULT_COVER_IDENTIFIER;
  const hasRealCover = (url: string) => url && url.trim() !== '' && !url.includes(DEFAULT_COVER);
  const prioritizeRealCovers = (items: any[], max: number) => {
    // Dentro de cada compositor, priorizar itens com cover real
    const coverScore = (h: any) => hasRealCover(h.cover) ? 2 : (h.cover && h.cover.trim() !== '' ? 1 : 0);
    const sorted = [...items].sort((a, b) => coverScore(b) - coverScore(a));
    // Diversificar por compositor (1 por compositor, depois round-robin)
    return diversifyByArtist(sorted, max);
  };
  
  // Converter hinos cantados do backend (apenas categoria Cantados)
  const hinosCantados = (homeData.hymnsCantados || [])
    .filter((h) => {
      const normalized = normalizeHomeCategory(h.category);
      return normalized === 'cantados' || normalized.includes('cantados');
    })
    .map(hymn => ({
      id: hymn.id,
      number: hymn.number,
      title: hymn.title,
      cover: hymn.cover_url || '',
      subtitle: hymn.composer_name || 'Hino Cantado',
      audioUrl: normalizeYoutubeSource(hymn.youtube_source) ? '' : (hymn.audio_url || ''),
      youtubeSource: normalizeYoutubeSource(hymn.youtube_source),
      artist: hymn.composer_name || 'Hino Cantado',
      coverUrl: hymn.cover_url || '',
    }));
  const hinosCantadosFinal = stableHomeSelections.cantados.length > 0
    ? stableHomeSelections.cantados
    : prioritizeRealCovers(
        hinosCantados.filter((hino) =>
          hasHomeReadyTrackSource({
            id: hino.id,
            number: hino.number,
            title: hino.title,
            artist: hino.artist,
            audioUrl: hino.audioUrl,
            youtubeSource: hino.youtubeSource,
          })
        ),
        12
      );

  // Converter hinos tocados do backend (apenas categoria Tocados)
  const hinosTocados = (homeData.hymnsTocados || [])
    .filter((h) => {
      const normalized = normalizeHomeCategory(h.category);
      return normalized === 'tocados' || normalized.includes('tocados');
    })
    .map(hymn => ({
      id: hymn.id,
      number: hymn.number,
      title: hymn.title,
      cover: hymn.cover_url || '',
      subtitle: hymn.composer_name || 'Hino Tocado',
      audioUrl: normalizeYoutubeSource(hymn.youtube_source) ? '' : (hymn.audio_url || ''),
      youtubeSource: normalizeYoutubeSource(hymn.youtube_source),
      artist: hymn.composer_name || 'Hino Tocado',
      coverUrl: hymn.cover_url || '',
    }));
  const hinosTocadosFinal = stableHomeSelections.tocados.length > 0
    ? stableHomeSelections.tocados
    : prioritizeRealCovers(
        hinosTocados.filter((hino) =>
          hasHomeReadyTrackSource({
            id: hino.id,
            number: hino.number,
            title: hino.title,
            artist: hino.artist,
            audioUrl: hino.audioUrl,
            youtubeSource: hino.youtubeSource,
          })
        ),
        12
      );

  // Converter hinos avulsos do backend (apenas categoria Avulsos)
  const hinosAvulsos = (homeData.hymnsAvulsos || [])
    .filter((h) => {
      const normalized = normalizeHomeCategory(h.category);
      return normalized === 'avulsos' || normalized.includes('avulsos');
    })
    .map(hymn => ({
      id: hymn.id,
      number: hymn.number,
      title: hymn.title,
      cover: hymn.cover_url || '',
      subtitle: hymn.composer_name || 'Hino Avulso',
      audioUrl: normalizeYoutubeSource(hymn.youtube_source) ? '' : (hymn.audio_url || ''),
      youtubeSource: normalizeYoutubeSource(hymn.youtube_source),
      artist: hymn.composer_name || 'Hino Avulso',
      coverUrl: hymn.cover_url || '',
    }));
  const hinosAvulsosFinal = stableHomeSelections.avulsos.length > 0
    ? stableHomeSelections.avulsos
    : prioritizeRealCovers(
        hinosAvulsos.filter((hino) =>
          hasHomeVisibleTrackSource({
            id: hino.id,
            number: hino.number,
            title: hino.title,
            artist: hino.artist,
            audioUrl: hino.audioUrl,
            youtubeSource: hino.youtubeSource,
          })
        ),
        12
      );

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
    const track = resolveHomeTrackForPlayback(hino);

    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else {
      const started = play(track);
      if (started === false) return;

      const queueSource = popularHinosFiltered.length > 0
        ? popularHinosFiltered.map(resolveHomeTrackForPlayback)
        : [];
      const currentIndex = queueSource.findIndex(h => h.id === track.id);
      const nextSongs = currentIndex >= 0 ? queueSource.slice(currentIndex + 1, currentIndex + 6) : [];
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
    const started = play(resolveHomeTrackForPlayback(track));
    if (started === false) return;
    setTimeout(() => {
      if (window.innerWidth < 768) {
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
        description="Ouça hinos da CCB online grátis. Acesse hinos cantados, hinos tocados, hinos avulsos CCB, Hinário 5 completo, cifras, compositores e playlists da Congregação Cristã no Brasil."
        keywords="hinos CCB, hinos avulsos ccb, hinário 5, congregação cristã no brasil, cifras CCB, hinos cantados, hinos tocados, compositores CCB, ouvir hinos CCB online grátis, hinos de louvores e súplicas a deus"
        canonical="/"
        ogImage="/logo-canticos-ccb.png"
        schemaData={schemas}
      />
      
      <div className="space-y-8">
        {/* Hero Section */}
        <HeroSection banners={homeData.banners} />

        {/* Personalized Sections */}
        {personalizedMixPlayable.length > 0 && (
          <PersonalizedSection
            title="Recomendado para você"
            items={personalizedMixPlayable}
            onPlay={(t: RecTrack) => handlePlayTrack({ id: t.id, number: t.number, category: t.category || 'Hinos CCB', title: t.title, artist: t.composer_name, duration: '00:00', plays: 0, isLiked: false, createdAt: new Date().toISOString(), coverUrl: t.cover_url, audioUrl: normalizeYoutubeSource(t.youtube_source) ? '' : t.audio_url, youtubeSource: normalizeYoutubeSource(t.youtube_source) })}
          />
        )}
        {(() => {
          const hasFollowed = !!user?.id && personalizedFollowedPlayable.length > 0;
          return hasFollowed;
        })() && (
          <PersonalizedSection
            title="Dos compositores que você segue"
            items={personalizedFollowedPlayable}
            onPlay={(t: RecTrack) => handlePlayTrack({ id: t.id, number: t.number, category: t.category || 'Hinos CCB', title: t.title, artist: t.composer_name, duration: '00:00', plays: 0, isLiked: false, createdAt: new Date().toISOString(), coverUrl: t.cover_url, audioUrl: normalizeYoutubeSource(t.youtube_source) ? '' : t.audio_url, youtubeSource: normalizeYoutubeSource(t.youtube_source) })}
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
        viewAllHref="/hinos-cantados-ccb"
        items={isLoading ? undefined : hinosCantadosFinal}
        onPlay={handleTogglePlay}
        onScrollLeft={scrollLeft}
        onScrollRight={scrollRight}
      />

      <HymnsSection
        title={<>Hinos<br />Tocados</>}
        viewAllHref="/hinos-tocados-ccb"
        items={isLoading ? undefined : hinosTocadosFinal}
        onPlay={handleTogglePlay}
        onScrollLeft={scrollLeft}
        onScrollRight={scrollRight}
      />

      <HymnsSection
        title={<>Hinos<br />Avulsos</>}
        viewAllHref="/hinos-avulsos-ccb"
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
