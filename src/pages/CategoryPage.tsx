import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Heart, Music, ListPlus, Share2, Plus, Search, X } from 'lucide-react';
import { DEFAULT_COVER_URL } from '@/lib/config';
import { supabaseFetch, isSupabaseConfigured } from '@/lib/supabaseRest';
import { getAll as getAllCategories } from '@/lib/categoriesApi';
import { getEmergencyCatalog } from '@/lib/emergencyCatalog';
import { usePlayerStore } from '@/stores/playerStore';
import useFavoritesStore from '@/stores/favoritesStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import AddToPlaylistModal from '@/components/modals/AddToPlaylistModal';
import LoginRequiredModal from '@/components/modals/LoginRequiredModal';
import SEOHead from '@/components/SEO/SEOHead';
import { generateBreadcrumbSchema, generateItemListSchema } from '@/utils/schemaGenerator';
import { buildHinoUrl } from '@/utils/slugUrl';
import { buildAlbumCoverUrl, buildHinoUrl as buildPlayableHinoUrl } from '@/lib/media-helper';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  background_color: string;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
}

interface Song {
  id: string;
  title: string;
  number?: number;
  artist: string;
  duration: string;
  cover_url?: string;
  audio_url?: string;
  plays_count?: number;
  youtube_source?: string;
}

const normalizeCategoryText = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const normalizeCategorySlug = (value: string) =>
  normalizeCategoryText(value)
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const CATEGORY_SLUG_ALIASES: Record<string, string[]> = {
  avulsos: ['avulsos', 'hinos-avulsos', 'hinos-avulsos-ccb'],
  'hinos-avulsos': ['avulsos', 'hinos-avulsos', 'hinos-avulsos-ccb'],
  'hinos-avulsos-ccb': ['avulsos', 'hinos-avulsos', 'hinos-avulsos-ccb'],
  cantados: ['cantados', 'hinos-cantados', 'hinos-cantados-ccb'],
  'hinos-cantados': ['cantados', 'hinos-cantados', 'hinos-cantados-ccb'],
  'hinos-cantados-ccb': ['cantados', 'hinos-cantados', 'hinos-cantados-ccb'],
  tocados: ['tocados', 'hinos-tocados', 'hinos-tocados-ccb', 'instrumentais'],
  'hinos-tocados': ['tocados', 'hinos-tocados', 'hinos-tocados-ccb', 'instrumentais'],
  'hinos-tocados-ccb': ['tocados', 'hinos-tocados', 'hinos-tocados-ccb', 'instrumentais'],
  instrumentais: ['instrumentais', 'tocados', 'hinos-tocados', 'hinos-tocados-ccb'],
  'hinario-5': ['hinario-5', 'hinario5', 'hinario-5-ccb'],
  hinario5: ['hinario-5', 'hinario5', 'hinario-5-ccb'],
  'hinario-5-ccb': ['hinario-5', 'hinario5', 'hinario-5-ccb'],
};

const slugToTitle = (value: string) =>
  String(value || '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const buildCategorySearchTerms = (slugValue: string, categoryName?: string) => {
  const candidates = [
    categoryName,
    slugToTitle(slugValue),
    String(slugValue || '').replace(/-/g, ' '),
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return candidates.filter((value, index, list) => {
    const normalized = normalizeCategoryText(value);
    return normalized && list.findIndex((candidate) => normalizeCategoryText(candidate) === normalized) === index;
  });
};

const buildCategorySlugCandidates = (slugValue: string, categoryName?: string) => {
  const normalizedSlug = normalizeCategorySlug(slugValue);
  const normalizedName = normalizeCategorySlug(categoryName || '');
  const directAliases = CATEGORY_SLUG_ALIASES[normalizedSlug] || CATEGORY_SLUG_ALIASES[normalizedName] || [];

  return Array.from(
    new Set(
      [
        normalizedSlug,
        normalizedName,
        normalizedSlug.replace(/^hinos-/, ''),
        normalizedSlug.replace(/-ccb$/, ''),
        normalizedName.replace(/^hinos-/, ''),
        normalizedName.replace(/-ccb$/, ''),
        ...directAliases,
      ].filter(Boolean)
    )
  );
};

const formatSongDuration = (seconds: number | string | null): string => {
  if (!seconds) return '3:45';
  const num = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (!Number.isFinite(num)) return '3:45';
  const mins = Math.floor(num / 60);
  const secs = num % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

async function buildEmergencyCategorySongs(
  slugValue: string,
  categoryName?: string,
  categoryId?: string
): Promise<Song[]> {
  const catalog = await getEmergencyCatalog();
  const slugCandidates = buildCategorySlugCandidates(slugValue, categoryName);
  const normalizedCandidates = new Set(
    [categoryId, ...slugCandidates, ...buildCategorySearchTerms(slugValue, categoryName)].map((value) => normalizeCategorySlug(String(value || ''))).filter(Boolean)
  );

  const matchingCategoryIds = new Set(
    catalog.categories
      .filter((category) => {
        const values = [
          normalizeCategorySlug(String(category.id || '')),
          normalizeCategorySlug(String(category.slug || '')),
          normalizeCategorySlug(String((category as any).nome || '')),
        ];
        return values.some((value) => normalizedCandidates.has(value));
      })
      .map((category) => String(category.id))
  );

  if (normalizedCandidates.has('avulsos') || normalizedCandidates.has('hinos-avulsos')) {
    matchingCategoryIds.add('avulsos');
  }
  if (normalizedCandidates.has('cantados') || normalizedCandidates.has('hinos-cantados')) {
    matchingCategoryIds.add('cantados');
  }
  if (
    normalizedCandidates.has('tocados')
    || normalizedCandidates.has('hinos-tocados')
    || normalizedCandidates.has('instrumentais')
  ) {
    matchingCategoryIds.add('tocados');
    if (normalizedCandidates.has('instrumentais')) {
      matchingCategoryIds.add('instrumentais');
    }
  }
  if (normalizedCandidates.has('hinario-5') || normalizedCandidates.has('hinario5')) {
    matchingCategoryIds.add('hinario5');
  }

  const hymnIds = new Set(
    catalog.hymnCategories
      .filter((relation) => matchingCategoryIds.has(String(relation.categoria_id)))
      .map((relation) => String(relation.hino_id))
  );

  let hymns = catalog.hymns.filter((hymn) => hymnIds.has(String(hymn.id)));

  if (hymns.length === 0) {
    const wantsAvulsos = matchingCategoryIds.has('avulsos');
    const wantsCantados = matchingCategoryIds.has('cantados');
    const wantsTocados = matchingCategoryIds.has('tocados');
    const wantsInstrumentais = matchingCategoryIds.has('instrumentais');
    const wantsHinario = matchingCategoryIds.has('hinario5');
    const searchTerms = buildCategorySearchTerms(slugValue, categoryName).map((term) => normalizeCategoryText(term));

    hymns = catalog.hymns.filter((hymn) => {
      const normalizedCategory = normalizeCategoryText(hymn.categoria);
      const normalizedTitle = normalizeCategoryText(hymn.titulo);

      if (wantsAvulsos) return normalizedCategory.includes('avulso');
      if (wantsCantados) return normalizedCategory.includes('cantado');
      if (wantsInstrumentais) return normalizedCategory.includes('instrument') || normalizedCategory.includes('tocado');
      if (wantsTocados) return normalizedCategory.includes('tocado');
      if (wantsHinario) return Number(hymn.numero || 0) >= 1 && Number(hymn.numero || 0) <= 480;

      return searchTerms.some((term) => normalizedCategory.includes(term) || normalizedTitle.includes(term));
    });
  }

  return hymns
    .filter((hymn) => hymn.ativo !== false)
    .sort((left, right) => {
      const leftNumber = Number(left.numero || 0);
      const rightNumber = Number(right.numero || 0);
      if (leftNumber !== rightNumber) return leftNumber - rightNumber;
      return String(left.titulo || '').localeCompare(String(right.titulo || ''), 'pt-BR');
    })
    .map((hymn) => ({
      id: String(hymn.id),
      title: String(hymn.titulo || 'Hino'),
      number: hymn.numero != null ? Number(hymn.numero) : undefined,
      artist: String(hymn.compositor_nome || 'Compositor Desconhecido'),
      duration: formatSongDuration(hymn.duracao),
      cover_url: buildAlbumCoverUrl({ id: String(hymn.id), cover_url: hymn.cover_url || '' }) || undefined,
      audio_url: buildPlayableHinoUrl({ id: String(hymn.id), audio_url: hymn.audio_url || '' }) || undefined,
      plays_count: undefined,
      youtube_source: hymn.youtube_source || undefined,
    }));
}

const chunkArray = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterNumber, setFilterNumber] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterComposer, setFilterComposer] = useState('');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [bulkTracksForModal, setBulkTracksForModal] = useState<any[] | null>(null);

  const { play, pause, currentTrack, isPlaying } = usePlayerStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const { openFullScreen } = usePlayerContext();
  const { user } = useAuth();

  useEffect(() => {
    if (slug) {
      loadCategoryData();
    }
  }, [slug]);

  const loadCategoryData = async () => {
    try {
      setIsLoading(true);

      // 1) Resolver metadados da categoria pelo slug
      const all = await getAllCategories({ limit: 1000 });
      const initialName = slugToTitle(String(slug));
      const slugCandidates = buildCategorySlugCandidates(String(slug), initialName);
      const found = (all || []).find((c: any) => {
        const categorySlug = normalizeCategorySlug(String(c?.slug || ''));
        const categoryName = normalizeCategorySlug(String(c?.name || ''));
        return slugCandidates.includes(categorySlug) || slugCandidates.includes(categoryName);
      });
      const resolvedName = found?.name || slugToTitle(String(slug));
      const searchTerms = buildCategorySearchTerms(String(slug), resolvedName);
      const emergencySongs = await buildEmergencyCategorySongs(String(slug), resolvedName, String(found?.id || ''));

      setCategory({
        id: String(found?.id || slug),
        name: resolvedName,
        slug: String(slug),
        description: found?.description,
        background_color: found?.background_color || '#6366f1',
        image_url: found?.image_url,
        meta_title: found?.meta_title,
        meta_description: found?.meta_description,
      });

      if (emergencySongs.length > 0) {
        setSongs(emergencySongs);
        return;
      }

      // 2) Buscar hinos dessa categoria no Supabase
      if (!isSupabaseConfigured) {
        setSongs(emergencySongs);
        return;
      }

      const hymnSelect = 'id,numero,titulo,compositor_nome,categoria,cover_url,audio_url,duracao,plays_count,youtube_source,ativo';
      const categoryIds = found?.id ? [String(found.id)] : [];

      const directCategoryIdsPromise = categoryIds.length > 0
        ? supabaseFetch<any>('hino_categorias', {
            categoria_id: `in.(${categoryIds.join(',')})`,
            select: 'hino_id',
            limit: '5000',
          }).catch((error) => {
            console.warn('hino_categorias lookup failed:', error);
            return [];
          })
        : Promise.resolve([]);

      const textMatchPromises = searchTerms.map((term) =>
        supabaseFetch<any>('hinos', {
          or: `(categoria.ilike.*${term}*,titulo.ilike.*${term}*,compositor_nome.ilike.*${term}*)`,
          select: hymnSelect,
          order: 'created_at.desc',
          limit: '200',
        }).catch((error) => {
          console.warn(`text hymn lookup failed for ${term}:`, error);
          return [];
        })
      );

      const albumMatchPromises = searchTerms.map((term) =>
        supabaseFetch<any>('albums', {
          or: `(title.ilike.*${term}*,description.ilike.*${term}*,artist.ilike.*${term}*)`,
          select: 'id',
          limit: '200',
        }).catch((error) => {
          console.warn(`album lookup failed for ${term}:`, error);
          return [];
        })
      );

      const [directRelations, ...queryGroups] = await Promise.all([
        directCategoryIdsPromise,
        ...textMatchPromises,
        ...albumMatchPromises,
      ]);

      const textMatchLists = queryGroups.slice(0, textMatchPromises.length) as any[][];
      const albumMatchLists = queryGroups.slice(textMatchPromises.length) as any[][];

      const directHymnIds = Array.from(
        new Set(directRelations.map((relation: any) => String(relation.hino_id || '')).filter(Boolean))
      );

      const matchedAlbums = albumMatchLists.flat();
      const matchedAlbumIds = Array.from(
        new Set(matchedAlbums.map((album: any) => String(album.id || '')).filter(Boolean))
      );

      const albumRelations = matchedAlbumIds.length > 0
        ? await supabaseFetch<any>('album_hinos', {
            album_id: `in.(${matchedAlbumIds.join(',')})`,
            select: 'hino_id',
            limit: '5000',
          }).catch((error) => {
            console.warn('album_hinos lookup failed:', error);
            return [];
          })
        : [];

      const albumHymnIds = Array.from(
        new Set(albumRelations.map((relation: any) => String(relation.hino_id || '')).filter(Boolean))
      );

      const idMatchedHymns = Array.from(new Set([...directHymnIds, ...albumHymnIds]));
      const directAndAlbumSongs: any[] = [];
      if (idMatchedHymns.length > 0) {
        for (const idChunk of chunkArray(idMatchedHymns, 150)) {
          const chunkRows = await supabaseFetch<any>('hinos', {
            id: `in.(${idChunk.join(',')})`,
            select: hymnSelect,
            order: 'created_at.desc',
            limit: String(idChunk.length),
          }).catch((error) => {
            console.warn('direct category hymn fetch chunk failed:', error);
            return [];
          });

          directAndAlbumSongs.push(...chunkRows);
        }
      }

      const list = [...directAndAlbumSongs];
      const seenIds = new Set(list.map((h: any) => String(h.id)));

      for (const group of textMatchLists) {
        for (const h of group) {
          const hymnId = String(h.id || '');
          if (hymnId && !seenIds.has(hymnId)) {
            list.push(h);
            seenIds.add(hymnId);
          }
        }
      }

      const formattedSongs: Song[] = list
        .filter((h: any) => h?.ativo === true || h?.ativo === 1 || h?.ativo == null)
        .map((h: any) => ({
        id: String(h.id),
        title: String(h.titulo || 'Hino'),
        number: h.numero != null ? Number(h.numero) : undefined,
        artist: String(h.compositor_nome || 'Compositor Desconhecido'),
        duration: formatSongDuration(h.duracao),
        cover_url: buildAlbumCoverUrl({ id: String(h.id), cover_url: h.cover_url || '' }) || undefined,
        audio_url: buildPlayableHinoUrl({ id: String(h.id), audio_url: h.audio_url || '' }) || undefined,
        plays_count: h.plays_count != null ? Number(h.plays_count) : undefined,
        youtube_source: h.youtube_source || undefined,
      }));

      if (formattedSongs.length > 0) {
        setSongs(formattedSongs);
      } else {
        setSongs(emergencySongs);
      }
    } catch (error) {
      console.error('Erro ao carregar categoria:', error);
      setSongs(await buildEmergencyCategorySongs(String(slug || ''), slugToTitle(String(slug || ''))));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToQueue = (song: Song) => {
    if (!user) { setShowLoginModal(true); return; }
    const track = resolveSongTrack(song);
    const { addToQueue } = (usePlayerStore as any).getState();
    addToQueue(track);
  };

  const resolveSongTrack = (song: Song) => {
    const coverUrl = buildAlbumCoverUrl({ id: String(song.id), cover_url: song.cover_url || '' })
      || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=1f2937&color=ffffff`;
    const ytSource = (song as any).youtube_source || undefined;
    const audioUrl = ytSource ? '' : (buildPlayableHinoUrl({ id: String(song.id), audio_url: song.audio_url || '' }) || '');
    return {
      id: song.id,
      title: song.title,
      number: song.number || 0,
      category: category?.name || 'Categoria',
      artist: song.artist || 'Compositor',
      duration: song.duration,
      audioUrl,
      coverUrl,
      lyrics: '',
      isLiked: false,
      createdAt: new Date().toISOString(),
      youtubeSource: ytSource,
    } as any;
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    const tracks = songs.map(resolveSongTrack);
    const first = tracks[0];
    const { clearQueue, addToQueue, setRepeat } = (usePlayerStore as any).getState();
    clearQueue();
    setRepeat('all');
    tracks.slice(1).forEach((t: any) => addToQueue(t));
    const started = play(first);
    if (started === false) return;
    openFullScreen();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const title = category?.name || 'Categoria';
    const text = `Confira os hinos da categoria ${title}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // ignore cancel
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copiado!');
      } catch {}
    }
  };

  const handlePlayPause = (song: Song) => {
    const ytSource = (song as any).youtube_source || undefined;
    const track = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      coverUrl: song.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=1f2937&color=ffffff`,
      audioUrl: ytSource ? '' : (song.audio_url || ''),
      number: song.number || 0,
      category: category?.name || 'Categoria',
      plays: song.plays_count || 0,
      isLiked: isFavorite(String(song.id)),
      createdAt: new Date().toISOString(),
      youtubeSource: ytSource,
    };

    if (currentTrack?.id === song.id && isPlaying) {
      pause();
    } else {
      const started = play(track);
      if (started === false) return;
      openFullScreen();
    }
  };

  const handleToggleFavorite = (song: Song) => {
    if (!user) { setShowLoginModal(true); return; }
    const songId = String(song.id);
    const uid = user?.id;
    const isFav = isFavorite(songId);
    
    if (isFav) {
      removeFavorite(songId, uid);
    } else {
      addFavorite({
        id: songId,
        title: song.title,
        artist: song.artist,
        album: category?.name || 'Categoria',
        duration: song.duration,
        coverUrl: song.cover_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title)}&background=1f2937&color=ffffff`,
        audioUrl: song.audio_url || undefined,
        youtubeSource: song.youtube_source || undefined,
        number: song.number || 0,
        category: category?.name || 'categoria',
      }, uid);
    }
  };

  const handleAddToPlaylist = (song: Song) => {
    if (!user) { setShowLoginModal(true); return; }
    setSelectedTrack({
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      coverUrl: song.cover_url
    });
    setBulkTracksForModal(null);
    setShowPlaylistModal(true);
  };

  const handleAddCategoryToPlaylist = () => {
    if (!user) { setShowLoginModal(true); return; }
    const tracks = songs.map((song) => ({
      id: song.id,
      title: song.number ? `Hino ${song.number} - ${song.title}` : song.title,
      artist: song.artist,
      duration: song.duration,
      coverUrl: song.cover_url,
    }));
    setSelectedTrack(null);
    setBulkTracksForModal(tracks);
    setShowPlaylistModal(true);
  };

  if (isLoading) {
  return (
      <div className="min-h-screen bg-background-primary pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-8 w-32 bg-gray-800 rounded animate-pulse mb-6"></div>
          <div className="h-12 w-64 bg-gray-800 rounded animate-pulse mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-800 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background-primary pt-20 pb-24 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Categoria não encontrada</h2>
          <p className="text-gray-400 mb-6">Esta categoria não existe ou foi removida.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-black font-bold rounded-full hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Home
          </Link>
        </div>
      </div>
    );
  }

  // Filtrar hinos por número, nome e compositor (client-side)
  const filteredSongs = songs.filter((song) => {
    if (filterNumber) {
      const query = filterNumber.trim();
      const numberText = String(song.number || '');
      const titleNumbers = (String(song.title || '').match(/\d+/g) || []).join(' ');
      if (!numberText.includes(query) && !titleNumbers.includes(query)) return false;
    }
    if (filterName) {
      const name = normalizeCategoryText(song.title);
      if (!name.includes(normalizeCategoryText(filterName))) return false;
    }
    if (filterComposer) {
      const artist = normalizeCategoryText(song.artist);
      if (!artist.includes(normalizeCategoryText(filterComposer))) return false;
    }
    return true;
  });

  const categoryImage = category.image_url || `https://picsum.photos/seed/category-${category.id}/400/400`;

  return (
    <>
      <SEOHead
        title={category.meta_title || `${category.name} - Cânticos CCB`}
        description={category.meta_description || category.description || `Explore hinos da categoria ${category.name} na Cânticos CCB`}
        keywords={`${category.name}, hinos, CCB, comunidade CCB, ${category.slug}`}
        canonical={`/categoria/${slug}`}
        ogImage={category.image_url}
        schemaData={[
          generateBreadcrumbSchema([
            { name: 'Início', url: '/' },
            { name: 'Categorias', url: '/categorias' },
            { name: category.name, url: `/categoria/${slug}` },
          ]),
          ...(songs.length > 0
            ? [generateItemListSchema({
                name: `${category.name} - Hinos CCB`,
                description: category.meta_description || category.description || `Lista de hinos da categoria ${category.name}`,
                url: `/categoria/${slug}`,
                items: songs.slice(0, 80).map((song, index) => ({
                  name: song.number ? `Hino ${song.number} - ${song.title}` : song.title,
                  url: buildHinoUrl(song.id, song.title, song.number),
                  position: index + 1,
                })),
              })]
            : []),
        ]}
      />

      <div className="min-h-screen bg-background-primary">
        <div className="-mx-6 text-white bg-gradient-to-b from-primary-600/35 via-primary-950/25 to-background-primary pt-20 pb-10 px-6 sm:-mx-8 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <div className="flex flex-col gap-6 items-center md:flex-row md:items-center md:gap-8">
              <img
                src={categoryImage}
                alt={category.name}
                className="h-40 w-40 object-cover ring-4 ring-primary-500/30 rounded-2xl mx-auto md:mx-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/seed/category-fallback-${category.id}/400/400`; }}
              />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-200 text-center md:text-left">Playlist pública</p>
                <h1 className="mt-2 text-3xl md:text-5xl font-bold text-white leading-tight text-center md:text-left">{category.name}</h1>
                {category.description && (
                  <p className="text-white/90 mt-1 max-w-2xl text-base text-center md:text-left">{category.description}</p>
                )}
                <div className="flex items-center justify-center md:justify-start gap-6 text-white/80 mt-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    <span className="font-semibold text-white">{songs.length}</span>
                    <span>{songs.length === 1 ? 'hino' : 'hinos'}</span>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3 w-full max-w-xl justify-center md:justify-start">
                  <button
                    onClick={handlePlayAll}
                    aria-label="Reproduzir categoria"
                    className="h-9 w-9 rounded-full bg-primary-500 hover:bg-primary-600 text-black font-semibold transition-colors flex items-center justify-center"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleAddCategoryToPlaylist}
                    className="h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ListPlus className="w-4 h-4" />
                    Adicionar à playlist
                  </button>
                  <button
                    onClick={handleShare}
                    aria-label="Compartilhar"
                    className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center justify-center"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-24">
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Hinos dessa Categoria</h2>

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={filterNumber}
                onChange={(e) => setFilterNumber(e.target.value)}
                placeholder="Número do hino"
                className="w-full pl-10 pr-9 py-2.5 bg-background-secondary border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {filterNumber && (
                <button onClick={() => setFilterNumber('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Nome do hino"
                className="w-full pl-10 pr-9 py-2.5 bg-background-secondary border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {filterName && (
                <button onClick={() => setFilterName('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={filterComposer}
                onChange={(e) => setFilterComposer(e.target.value)}
                placeholder="Compositor"
                className="w-full pl-10 pr-9 py-2.5 bg-background-secondary border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {filterComposer && (
                <button onClick={() => setFilterComposer('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {filteredSongs.length === 0 && songs.length > 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Nenhum resultado</h3>
              <p className="text-gray-400 text-sm">Tente ajustar os filtros de busca.</p>
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-16">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhum hino encontrado</h3>
              <p className="text-gray-400">Esta categoria ainda não possui hinos cadastrados.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSongs.map((song, _index) => (
                <div
                  key={song.id}
                  className="group bg-background-secondary hover:bg-background-tertiary rounded-lg p-4 transition-colors flex items-center gap-4"
                >
                  {/* Cover with Play Overlay */}
                  <button
                    onClick={() => handlePlayPause(song)}
                    aria-label={currentTrack?.id === song.id && isPlaying ? 'Pausar' : 'Reproduzir'}
                    className="relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden"
                  >
                    {song.cover_url ? (
                      <img
                        src={song.cover_url}
                        alt={song.title}
                        className="w-12 h-12 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVER_URL; }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-800 flex items-center justify-center">
                        <Music className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      {currentTrack?.id === song.id && isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </button>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate group-hover:text-primary-400 transition-colors">
                      {song.number && `${song.number} - `}{song.title}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                  </div>

                  {/* Duration */}
                  <span className="ml-auto text-gray-400 text-sm w-12 text-right">
                    {song.duration}
                  </span>

                  {/* Actions (hidden on mobile) */}
                  <div className="hidden md:flex items-center gap-3">
                    <button
                      onClick={() => handleAddToQueue(song)}
                      className="p-2 hover:bg-white/10 rounded-full transition-all"
                      title={user ? 'Adicionar à fila' : 'Faça login para adicionar à fila'}
                    >
                      <Plus className="w-5 h-5 text-gray-400 hover:text-primary-400" />
                    </button>
                    <button
                      onClick={() => handleAddToPlaylist(song)}
                      className="p-2 hover:bg-white/10 rounded-full transition-all"
                      title={user ? 'Adicionar à playlist' : 'Faça login para adicionar à playlist'}
                    >
                      <ListPlus className="w-5 h-5 text-gray-400 hover:text-primary-400" />
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(song)}
                      className={`p-2 hover:bg-white/10 rounded-full transition-all`}
                      title={user ? (isFavorite(String(song.id)) ? 'Remover dos favoritos' : 'Adicionar aos favoritos') : 'Faça login para favoritar'}
                    >
                      <Heart className={`w-5 h-5 ${
                        user && isFavorite(String(song.id)) 
                          ? 'text-red-500 fill-red-500' 
                          : 'text-gray-400 hover:text-red-500'
                      }`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Login Necessário"
        message="Você precisa estar logado para realizar esta ação"
      />

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => {
          setShowPlaylistModal(false);
          setSelectedTrack(null);
          setBulkTracksForModal(null);
        }}
        track={selectedTrack}
        bulkTracks={bulkTracksForModal || undefined}
      />
    </>
  );
};

export default CategoryPage;
