import { mockPlaylists, mockArtists, mockCategories } from '@/data/mockData';
import { apiFetch } from '@/lib/api-helper';
// import { getDocuments } from './firebaseHelpers';

// const isFirebaseConfigured = Boolean(import.meta.env && import.meta.env.VITE_FIREBASE_PROJECT_ID);

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ensureImage = (seed: string, width: number = 800, height: number = 400) => {
  const normalizedSeed = encodeURIComponent(seed.toLowerCase().replace(/\s+/g, '-'));
  return `https://picsum.photos/seed/${normalizedSeed}/${width}/${height}`;
};

export interface HomeBanner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  button_text?: string;
  link_type?: string;
  link_url?: string;
  link_id?: string;
  gradient_overlay?: string;
}

export interface HomeHymn {
  id: string;
  number: number;
  title: string;
  composer_name: string;
  category?: string;
  cover_url: string;
  audio_url?: string;
  duration?: string;
  created_at?: string;
}

export interface HomeAlbum {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
}

export interface HomeComposer {
  id: string;
  name: string;
  avatar_url: string;
  followers_count: number;
  is_trending: boolean;
  bio?: string;
}

export interface HomePlaylist {
  id: string;
  name: string;
  description?: string;
  cover_url: string;
}

export interface HomeCategory {
  id: string;
  name: string;
  slug: string;
  background_color: string;
  description?: string;
  image_url?: string;
}

export interface HomePageData {
  banners: HomeBanner[];
  featured: HomeHymn[];
  albums: HomeAlbum[];
  hymnsCantados: HomeHymn[];
  hymnsTocados: HomeHymn[];
  hymnsAvulsos: HomeHymn[];
  newReleases: HomeHymn[];
  trending: HomeHymn[];
  composers: HomeComposer[];
  playlists: HomePlaylist[];
  categories: HomeCategory[];
}


async function tryGetCollection<T>(collectionName: string): Promise<T[]> {
  // Firebase disabled - using mock data only
  // if (!isFirebaseConfigured) return [];
  // try {
  //   return await getDocuments<T>(collectionName);
  // } catch (error) {
  //   console.warn(`[homeApi] Falha ao buscar ${collectionName}, usando mock.`, error);
  //   return [];
  // }
  return [];
}

const mapHymn = (hymn: any, fallbackId: string, index: number): HomeHymn => {
  const id = String(hymn.id ?? hymn.documentId ?? `${fallbackId}-${index}`);
  const title = hymn.title ?? hymn.name ?? `Hino ${index + 1}`;
  const cover = hymn.cover_url ?? hymn.coverUrl ?? '';

  return {
    id,
    number: Number(hymn.number ?? index + 1),
    title,
    composer_name: hymn.composer_name ?? hymn.artist ?? 'Compositor Desconhecido',
    category: hymn.category ?? 'Cantados',
    cover_url: cover,
    audio_url: hymn.audio_url ?? hymn.audioUrl ?? '',
    duration: hymn.duration ?? '4:00',
    created_at: hymn.created_at ?? hymn.createdAt ?? new Date().toISOString(),
  };
};

const mapAlbum = (album: any, index: number): HomeAlbum => {
  const id = String(album.id ?? `album-${index}`);
  return {
    id,
    title: String(album.title ?? ''),
    artist: String(album.artist ?? album.artist_name ?? ''),
    cover_url: String(album.cover_url ?? album.coverUrl ?? ''),
  };
};

const mapComposer = (composer: any, index: number): HomeComposer => {
  const id = String(composer.id ?? `composer-${index}`);
  const name = composer.name ?? composer.full_name ?? `Compositor ${index + 1}`;
  const avatar = composer.avatar_url ?? composer.photo_url ?? composer.image ?? composer.imageUrl;
  const followers = composer.followers_count ?? composer.followers ?? 0;

  return {
    id,
    name,
    avatar_url: avatar && avatar.trim() !== '' ? avatar : ensureImage(`composer-${id}`, 200, 200),
    followers_count: followers,
    is_trending: Boolean(composer.is_trending ?? composer.trending ?? followers > 75000),
    bio: composer.bio ?? composer.description ?? undefined,
  };
};

const mapPlaylist = (playlist: any, index: number): HomePlaylist => {
  const id = String(playlist.id ?? `playlist-${index}`);
  return {
    id,
    name: playlist.name ?? `Playlist ${index + 1}`,
    description: playlist.description ?? undefined,
    cover_url: playlist.cover_url ?? playlist.coverUrl ?? ensureImage(`playlist-${id}`, 320, 320),
  };
};

const mapCategory = (category: any, index: number): HomeCategory => {
  const name = category.name ?? `Categoria ${index + 1}`;
  const id = String(category.id ?? `category-${index}`);
  return {
    id,
    name,
    slug: category.slug ?? slugify(name),
    background_color: category.background_color ?? category.color ?? '#6366f1',
    description: category.description ?? undefined,
    image_url: category.image_url ?? ensureImage(`category-${id}`, 600, 360),
  };
};

export async function getHomePageData(): Promise<HomePageData> {
  const [
    bannersDocs,
    featuredDocs,
    albumsDocs,
    cantadosDocs,
    tocadosDocs,
    avulsosDocs,
    trendingDocs,
    composersDocs,
    playlistsDocs,
    categoriesDocs,
  ] = await Promise.all([
    tryGetCollection<any>('home_banners'),
    tryGetCollection<any>('home_featured_hymns'),
    tryGetCollection<any>('albums'),
    tryGetCollection<any>('home_hymns_cantados'),
    tryGetCollection<any>('home_hymns_tocados'),
    tryGetCollection<any>('home_hymns_avulsos'),
    tryGetCollection<any>('home_trending_hymns'),
    tryGetCollection<any>('composers'),
    tryGetCollection<any>('playlists'),
    tryGetCollection<any>('categories'),
  ]);

  let apiBanners: any[] = [];
  try {
    const res = await apiFetch('/api/banners/index.php?type=hero&active=1');
    if (res.ok) {
      const json = await res.json();
      const arr = Array.isArray(json)
        ? json
        : (Array.isArray(json?.banners)
            ? json.banners
            : (Array.isArray(json?.data) ? json.data : []));
      apiBanners = arr || [];
    }
  } catch (e) {
    // fallback silencioso
  }

  // Buscar hinos por categoria diretamente do backend
  let cantadosApi: any[] = [];
  let tocadosApi: any[] = [];
  let avulsosApi: any[] = [];
  try {
    const cat1 = encodeURIComponent('Hinos Cantados');
    const cat2 = encodeURIComponent('Hinos Tocados');
    const cat3 = encodeURIComponent('Hinos Avulsos');
    const [rc, rt, ra] = await Promise.all([
      apiFetch(`/api/hinos/index.php?categoria=${cat1}&ativo=1&limit=12`),
      apiFetch(`/api/hinos/index.php?categoria=${cat2}&ativo=1&limit=12`),
      apiFetch(`/api/hinos/index.php?categoria=${cat3}&ativo=1&limit=12`),
    ]);
    if (rc.ok) {
      const json = await rc.json().catch(() => ({} as any));
      cantadosApi = Array.isArray(json?.hinos) ? json.hinos : (Array.isArray(json) ? json : []);
    }
    if (rt.ok) {
      const json = await rt.json().catch(() => ({} as any));
      tocadosApi = Array.isArray(json?.hinos) ? json.hinos : (Array.isArray(json) ? json : []);
    }
    if (ra.ok) {
      const json = await ra.json().catch(() => ({} as any));
      avulsosApi = Array.isArray(json?.hinos) ? json.hinos : (Array.isArray(json) ? json : []);
    }
  } catch (e) {
    // manter arrays vazios em caso de erro
  }

  const fallbackSortedHymns: any[] = [];
  // Não usar mocks para hinos; manter vazio quando API não retornar

  const banners = (apiBanners || []).map((banner: any, index: number) => ({
    id: String(banner.id ?? `banner-${index}`),
    title: String(banner.title ?? ''),
    description: banner.description ?? '',
    image_url: String(banner.image_url ?? ''),
    button_text: banner.button_text ?? undefined,
    link_type: banner.link_type ?? undefined,
    link_url: banner.link_url ?? undefined,
    link_id: banner.link_id != null ? String(banner.link_id) : undefined,
    gradient_overlay: banner.gradient_overlay ?? undefined,
  } satisfies HomeBanner));

  const featured = (featuredDocs.length ? featuredDocs : []).map((hymn, index) =>
    mapHymn(hymn, 'featured', index),
  );

  const albums = (albumsDocs.length ? albumsDocs : []).map((album, index) => mapAlbum(album, index));

  const hymnsCantados = (cantadosApi.length ? cantadosApi : cantadosDocs).map((h: any, index: number) =>
    mapHymn(
      {
        id: h.id ?? h.documentId,
        title: h.titulo ?? h.title,
        composer_name: h.compositor ?? h.composer_name ?? h.artist,
        category: 'Cantados',
        cover_url: h.cover_url ?? h.coverUrl,
        audio_url: h.audio_url ?? h.audioUrl,
        duration: h.duracao ?? h.duration,
        created_at: h.created_at ?? h.createdAt,
      },
      'cantado',
      index,
    ),
  );

  const hymnsTocados = (tocadosApi.length ? tocadosApi : tocadosDocs).map((h: any, index: number) =>
    mapHymn(
      {
        id: h.id ?? h.documentId,
        title: h.titulo ?? h.title,
        composer_name: h.compositor ?? h.composer_name ?? h.artist,
        category: 'Tocados',
        cover_url: h.cover_url ?? h.coverUrl,
        audio_url: h.audio_url ?? h.audioUrl,
        duration: h.duracao ?? h.duration,
        created_at: h.created_at ?? h.createdAt,
      },
      'tocado',
      index,
    ),
  );

  const hymnsAvulsos = (avulsosApi.length ? avulsosApi : avulsosDocs).map((h: any, index: number) =>
    mapHymn(
      {
        id: h.id ?? h.documentId,
        title: h.titulo ?? h.title,
        composer_name: h.compositor ?? h.composer_name ?? h.artist,
        category: 'Avulsos',
        cover_url: h.cover_url ?? h.coverUrl,
        audio_url: h.audio_url ?? h.audioUrl,
        duration: h.duracao ?? h.duration,
        created_at: h.created_at ?? h.createdAt,
      },
      'avulso',
      index,
    ),
  );

  const trendingSource = trendingDocs.length ? trendingDocs : [];
  const trending = trendingSource.map((hymn, index) => mapHymn(hymn, 'trending', index));

  const newReleases: HomeHymn[] = [];

  const composers = (composersDocs.length ? composersDocs : mockArtists).map((composer, index) =>
    mapComposer(
      {
        ...composer,
        followers_count: composer.followers_count ?? composer.followers ?? composer.monthlyListeners ?? 0,
      },
      index,
    ),
  );

  const playlists = (playlistsDocs.length ? playlistsDocs : mockPlaylists).map((playlist, index) =>
    mapPlaylist(playlist, index),
  );

  const categories = (categoriesDocs.length ? categoriesDocs : mockCategories).map((category, index) =>
    mapCategory(
      {
        ...category,
        background_color: category.background_color ?? category.color,
        image_url: category.image_url ?? category.imageUrl,
      },
      index,
    ),
  );

  return {
    banners,
    featured,
    albums,
    hymnsCantados,
    hymnsTocados,
    hymnsAvulsos,
    newReleases,
    trending,
    composers,
    playlists,
    categories,
  } satisfies HomePageData;
}
