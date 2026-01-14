import { mockPlaylists, mockArtists, mockCategories } from '@/data/mockData';
import { apiFetch } from '@/lib/api-helper';
import { ASSETS } from '@/constants/index';
import { isSupabaseConfigured, supabaseFetch } from '@/lib/supabaseRest';
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
};

type SupabaseComposerRow = {
  id?: number | string;
  nome?: string;
  name?: string;
  nome_artistico?: string;
  artistic_name?: string;
  biografia?: string;
  bio?: string;
  avatar_url?: string;
  photo_url?: string;
  verificado?: boolean | number;
  verified?: boolean;
  is_trending?: boolean;
  followers_count?: number;
};

type SupabaseAlbumRow = {
  id?: number | string;
  titulo?: string;
  title?: string;
  cover_url?: string;
  compositor_id?: number;
  artist?: string;
  is_published?: boolean;
  active?: boolean;
};

type SupabaseBannerRow = {
  id?: number | string;
  title?: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  link_id?: string | number;
  gradient_overlay?: string;
  button_text?: string;
  type?: string;
  position?: number;
  is_active?: boolean;
};

const mapSupabaseHymn = (row: SupabaseHymnRow): HomeHymn => ({
  id: String(row.id ?? `${row.titulo ?? 'hino'}-${row.numero ?? Math.random()}`),
  number: Number(Number.isFinite(Number(row.numero)) ? Number(row.numero) : 0),
  title: String(row.titulo ?? 'Hino sem título'),
  composer_name: row.compositor_nome ?? row.compositor ?? 'Compositor Desconhecido',
  category: row.categoria ?? 'Outros',
  cover_url: row.cover_url ?? ASSETS.PLACEHOLDER_IMAGE,
  audio_url: row.audio_url ?? '',
  duration: row.duracao ?? '00:00',
  created_at: row.created_at ?? new Date().toISOString(),
});

const mapSupabaseComposer = (row: SupabaseComposerRow): HomeComposer => {
  const id = String(row.id ?? row.name ?? row.nome ?? Math.random());
  const name = row.artistic_name || row.nome_artistico || row.name || row.nome || 'Compositor CCB';
  return {
    id,
    name,
    avatar_url: row.photo_url ?? row.avatar_url ?? ASSETS.DEFAULT_AVATAR,
    followers_count: row.followers_count ?? 0,
    is_trending: Boolean(row.is_trending ?? row.verified ?? row.verificado),
    bio: row.bio ?? row.biografia ?? undefined,
  };
};

const mapSupabaseAlbum = (row: SupabaseAlbumRow, index: number): HomeAlbum => ({
  id: String(row.id ?? `album-${index}`),
  title: row.title ?? row.titulo ?? `Álbum ${index + 1}`,
  artist: row.artist ?? 'Canticos CCB',
  cover_url: row.cover_url ?? ASSETS.PLACEHOLDER_IMAGE,
});

const mapSupabaseBanner = (row: SupabaseBannerRow): HomeBanner => ({
  id: String(row.id ?? row.title ?? `banner-${Math.random()}`),
  title: row.title ?? '',
  description: row.description ?? '',
  image_url: row.image_url ?? ASSETS.PLACEHOLDER_IMAGE,
  button_text: row.button_text ?? undefined,
  link_type: row.type ?? undefined,
  link_url: row.link_url ?? undefined,
  link_id: row.link_id != null ? String(row.link_id) : undefined,
  gradient_overlay: row.gradient_overlay ?? undefined,
});

async function getHomePageDataFromSupabase(): Promise<HomePageData> {
  const heroBanners = supabaseFetch<SupabaseBannerRow>('banners', {
    select: 'id,title,description,image_url,link_url,link_id,gradient_overlay,button_text',
    is_active: 'eq.true',
    order: 'position.asc',
    limit: '6',
  });
  const composerRows = supabaseFetch<SupabaseComposerRow>('compositores', {
    select: 'id,name,artistic_name,bio,photo_url,verified,is_trending,followers_count',
    is_approved: 'eq.true',
    order: 'name.asc',
    limit: '20',
  });
  const albumRows = supabaseFetch<SupabaseAlbumRow>('albums', {
    select: 'id,title,cover_url,artist',
    is_published: 'eq.true',
    active: 'eq.true',
    order: 'created_at.desc',
    limit: '12',
  });
  const categoryRows = supabaseFetch<any>('categorias', {
    select: 'id,nome,slug,descricao,imagem_url',
    ativo: 'eq.true',
    order: 'nome.asc',
  });
  const hymnRows = supabaseFetch<SupabaseHymnRow>('hinos', {
    select: 'id,numero,titulo,compositor_nome,categoria,cover_url,audio_url,duracao,created_at',
    ativo: 'eq.true',
    status: 'eq.published',
    order: 'created_at.desc',
    limit: '60',
  });

  const [bannersData, composersData, albumsData, categoriesData, hymnsData] = await Promise.all([
    heroBanners,
    composerRows,
    albumRows,
    categoryRows,
    hymnRows,
  ]);

  const hymns = hymnsData.map(mapSupabaseHymn);
  const grouped = {
    cantados: hymns.filter((h) => (h.category || '').toLowerCase() === 'cantados'),
    tocados: hymns.filter((h) => (h.category || '').toLowerCase() === 'tocados'),
    avulsos: hymns.filter((h) => (h.category || '').toLowerCase() === 'avulsos'),
  };

  return {
    banners: bannersData.map(mapSupabaseBanner),
    featured: hymns.slice(0, 6),
    albums: albumsData.map((album, index) => mapSupabaseAlbum(album, index)),
    hymnsCantados: grouped.cantados,
    hymnsTocados: grouped.tocados,
    hymnsAvulsos: grouped.avulsos,
    newReleases: hymns.slice(0, 6),
    trending: hymns.slice(0, 6),
    composers: composersData.map(mapSupabaseComposer),
    playlists: [],
    categories: categoriesData.map((category: any) => ({
      id: String(category.id ?? category.slug ?? Math.random()),
      name: category.nome ?? category.name ?? 'Categoria',
      slug: category.slug ?? category.nome?.replace(/\s+/g, '-').toLowerCase() ?? 'categoria',
      background_color: '#10B981',
      description: category.descricao ?? undefined,
      image_url: category.imagem_url ?? ASSETS.PLACEHOLDER_IMAGE,
    })),
  };
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
  if (isSupabaseConfigured) {
    try {
      return await getHomePageDataFromSupabase();
    } catch (error) {
      console.warn('[homeApi] Supabase home data fetch falhou, usando fallback de API antiga', error);
    }
  }

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

  // Mock data for fallback
  const mockHinos = [
    { id: 1, numero: 1, titulo: 'Hino de Adoração', compositor: 'João de Deus', categoria: 'Hinos Cantados' },
    { id: 2, numero: 2, titulo: 'Hino de Louvor', compositor: 'Maria José', categoria: 'Hinos Cantados' },
    { id: 3, numero: 3, titulo: 'Hino de Comunhão', compositor: 'Carlos Silva', categoria: 'Hinos Tocados' },
    { id: 4, numero: 4, titulo: 'Hino Especial', compositor: 'Ana Santos', categoria: 'Hinos Avulsos' },
    { id: 5, numero: 5, titulo: 'Hino de Evangelização', compositor: 'Pedro Costa', categoria: 'Hinos Avulsos' }
  ];

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
      if (cantadosApi.length === 0) {
        console.warn('API returned empty cantados, using mock data');
        cantadosApi = mockHinos.filter(h => h.categoria === 'Hinos Cantados');
      }
    } else {
      console.warn('API failed for cantados, using mock data');
      cantadosApi = mockHinos.filter(h => h.categoria === 'Hinos Cantados');
    }
    if (rt.ok) {
      const json = await rt.json().catch(() => ({} as any));
      tocadosApi = Array.isArray(json?.hinos) ? json.hinos : (Array.isArray(json) ? json : []);
      if (tocadosApi.length === 0) {
        console.warn('API returned empty tocados, using mock data');
        tocadosApi = mockHinos.filter(h => h.categoria === 'Hinos Tocados');
      }
    } else {
      console.warn('API failed for tocados, using mock data');
      tocadosApi = mockHinos.filter(h => h.categoria === 'Hinos Tocados');
    }
    if (ra.ok) {
      const json = await ra.json().catch(() => ({} as any));
      avulsosApi = Array.isArray(json?.hinos) ? json.hinos : (Array.isArray(json) ? json : []);
      if (avulsosApi.length === 0) {
        console.warn('API returned empty avulsos, using mock data');
        avulsosApi = mockHinos.filter(h => h.categoria === 'Hinos Avulsos');
      }
    } else {
      console.warn('API failed for avulsos, using mock data');
      avulsosApi = mockHinos.filter(h => h.categoria === 'Hinos Avulsos');
    }
  } catch (e) {
    console.warn('API error for hymns, using mock data:', e);
    cantadosApi = mockHinos.filter(h => h.categoria === 'Hinos Cantados');
    tocadosApi = mockHinos.filter(h => h.categoria === 'Hinos Tocados');
    avulsosApi = mockHinos.filter(h => h.categoria === 'Hinos Avulsos');
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
