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
  youtube_source?: string;
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
  youtube_source?: string;
};

type SupabaseComposerRow = {
  id?: number | string;
  name?: string;
  artistic_name?: string;
  bio?: string;
  biography?: string;
  verified?: boolean;
  status?: string;
  avatar_url?: string;
  photo_url?: string;
  slug?: string;
  category?: string;
  is_featured?: boolean;
  is_trending?: boolean;
  followers_count?: number;
};

type SupabaseAlbumRow = {
  id?: number | string;
  title?: string;
  description?: string;
  cover_url?: string;
  artist?: string;
  created_at?: string;
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
  youtube_source: row.youtube_source || undefined,
});

const mapSupabaseComposer = (row: SupabaseComposerRow): HomeComposer => {
  const id = String(row.id ?? Math.random());
  const name = row.artistic_name ?? row.name ?? 'Compositor CCB';
  const rowAvatar = row.avatar_url || row.photo_url;
  const avatarUrl = rowAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=400&background=1a1a1a&color=00D1FF`;
  return {
    id,
    name,
    avatar_url: avatarUrl,
    followers_count: row.followers_count ?? 0,
    is_trending: Boolean(row.is_trending || row.verified),
    bio: row.biography ?? row.bio ?? undefined,
  };
};

const mapSupabaseAlbum = (
  row: SupabaseAlbumRow,
  index: number,
  composerNames: Record<string, string>
): HomeAlbum => {
  return {
    id: String(row.id ?? `album-${index}`),
    title: row.title ?? `Álbum ${index + 1}`,
    artist: row.artist ?? 'Canticos CCB',
    cover_url: row.cover_url ?? ASSETS.PLACEHOLDER_IMAGE,
  };
};

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

const normalizeHomeCategory = (value: string | undefined | null) => slugify(String(value ?? ''));

/**
 * Diversifica hinos por compositor: máx 1 por compositor primeiro,
 * depois preenche com extras (round-robin) se não houver compositores suficientes.
 */
function diversifyByComposer<T extends { composer_name?: string }>(items: T[], maxItems: number): T[] {
  if (items.length <= 1) return items.slice(0, maxItems);

  const composerKey = (item: T) => (item.composer_name || 'unknown').toLowerCase().trim();

  // Agrupar por compositor mantendo a ordem original
  const composerGroups = new Map<string, T[]>();
  for (const item of items) {
    const key = composerKey(item);
    if (!composerGroups.has(key)) composerGroups.set(key, []);
    composerGroups.get(key)!.push(item);
  }

  const result: T[] = [];
  const seen = new Set<string>();

  // Rodada 1: 1 hino por compositor (o mais recente, que já vem primeiro por created_at.desc)
  for (const [key, group] of composerGroups) {
    if (result.length >= maxItems) break;
    result.push(group[0]);
    seen.add(`${key}-0`);
  }

  // Rodadas extras: preencher slots vazios com hinos adicionais (round-robin)
  if (result.length < maxItems) {
    let round = 1;
    let added = true;
    while (added && result.length < maxItems) {
      added = false;
      for (const [key, group] of composerGroups) {
        if (result.length >= maxItems) break;
        if (round < group.length) {
          const id = `${key}-${round}`;
          if (!seen.has(id)) {
            result.push(group[round]);
            seen.add(id);
            added = true;
          }
        }
      }
      round++;
    }
  }

  return result.slice(0, maxItems);
}

async function getHomePageDataFromSupabase(): Promise<HomePageData> {
  const heroBanners = supabaseFetch<SupabaseBannerRow>('banners', {
    select: 'id,title,description,image_url,link_url,link_id,gradient_overlay,button_text,type',
    is_active: 'eq.true',
    order: 'position.asc',
    limit: '6',
  }).then(rows => {
    console.log('🎬 [homeApi] Banners retornados do Supabase:', rows.length, rows);
    return rows;
  });
  const composerRows = supabaseFetch<SupabaseComposerRow>('composers', {
    select: 'id,name,artistic_name,bio,biography,verified,status,avatar_url,photo_url,slug,category,is_featured,is_trending,followers_count',
    or: '(verified.eq.true,status.eq.approved)',
    order: 'name.asc',
    limit: '20',
  });
  const albumRows = supabaseFetch<SupabaseAlbumRow>('albums', {
    select: 'id,title,description,cover_url,artist,created_at',
    is_published: 'eq.true',
    order: 'created_at.desc',
    limit: '12',
  });
  const categoryRows = supabaseFetch<any>('categorias', {
    select: 'id,nome,slug,descricao,imagem_url',
    ativo: 'eq.true',
    order: 'nome.asc',
  });
  const hymnRows = supabaseFetch<SupabaseHymnRow>('hinos', {
    select: 'id,numero,titulo,compositor_nome,categoria,cover_url,audio_url,duracao,created_at,youtube_source',
    ativo: 'eq.true',
    order: 'created_at.desc',
    limit: '60',
  });
  // Buscar relações hino_categorias para suportar múltiplas categorias por hino
  const hinoCatRows = supabaseFetch<{ hino_id: string; categoria_id: string }>('hino_categorias', {
    select: 'hino_id,categoria_id',
  }).catch(() => [] as { hino_id: string; categoria_id: string }[]);

  const [bannersData, composersData, albumsData, categoriesData, hymnsData, hinoCategorias] = await Promise.all([
    heroBanners,
    composerRows,
    albumRows,
    categoryRows,
    hymnRows,
    hinoCatRows,
  ]);

  const composerNameById = composersData.reduce<Record<string, string>>((acc, row) => {
    if (row.id == null) return acc;
    const id = String(row.id);
    acc[id] = row.artistic_name ?? row.name ?? 'Compositor CCB';
    return acc;
  }, {});

  // Construir mapa categoriaId -> nome
  const catIdToName: Record<string, string> = {};
  for (const cat of categoriesData) {
    if (cat.id && cat.nome) catIdToName[String(cat.id)] = cat.nome;
  }

  // Construir mapa hinoId -> [nomes de categorias] (da tabela hino_categorias)
  const hinoAllCategories: Record<string, string[]> = {};
  for (const rel of hinoCategorias) {
    const hid = String(rel.hino_id);
    const catName = catIdToName[String(rel.categoria_id)];
    if (catName) {
      if (!hinoAllCategories[hid]) hinoAllCategories[hid] = [];
      hinoAllCategories[hid].push(catName);
    }
  }

  const hymns = hymnsData.map(mapSupabaseHymn);

  // Função auxiliar: verifica se um hino pertence a uma categoria
  // Usa hino_categorias (múltiplas) com fallback para a coluna categoria (única)
  const hymnMatchesCategory = (h: HomeHymn, keyword: string): boolean => {
    const allCats = hinoAllCategories[String(h.id)];
    if (allCats && allCats.length > 0) {
      return allCats.some(c => normalizeHomeCategory(c).includes(keyword));
    }
    // Fallback: coluna categoria única
    const normalized = normalizeHomeCategory(h.category);
    return normalized === keyword || normalized.includes(keyword);
  };

  const grouped = {
    cantados: diversifyByComposer(
      hymns
        .filter((h) => hymnMatchesCategory(h, 'cantados'))
        .map((h) => ({ ...h, category: 'Cantados' })),
      12
    ),
    tocados: diversifyByComposer(
      hymns
        .filter((h) => hymnMatchesCategory(h, 'tocados'))
        .map((h) => ({ ...h, category: 'Tocados' })),
      12
    ),
    avulsos: diversifyByComposer(
      hymns
        .filter((h) => hymnMatchesCategory(h, 'avulsos'))
        .map((h) => ({ ...h, category: 'Avulsos' })),
      12
    ),
  };

  return {
    banners: bannersData.map(mapSupabaseBanner),
    featured: diversifyByComposer(hymns, 6),
    albums: albumsData.map((album, index) => mapSupabaseAlbum(album, index, composerNameById)),
    hymnsCantados: grouped.cantados,
    hymnsTocados: grouped.tocados,
    hymnsAvulsos: grouped.avulsos,
    newReleases: diversifyByComposer(hymns, 6),
    trending: diversifyByComposer(hymns, 6),
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
    youtube_source: hymn.youtube_source || undefined,
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

  const apiBanners: any[] = [];

  let cantadosApi: any[] = [];
  let tocadosApi: any[] = [];
  let avulsosApi: any[] = [];

  const mockHinos = [
    { id: 1, numero: 1, titulo: 'Hino de Adoração', compositor_nome: 'João de Deus', categoria: 'Hinos Cantados', cover_url: 'https://picsum.photos/seed/hino-1/400/400', audio_url: '' },
    { id: 2, numero: 2, titulo: 'Hino de Louvor', compositor_nome: 'Maria José', categoria: 'Hinos Cantados', cover_url: 'https://picsum.photos/seed/hino-2/400/400', audio_url: '' },
    { id: 6, numero: 6, titulo: 'Hino de Graça', compositor_nome: 'José Lima', categoria: 'Hinos Cantados', cover_url: 'https://picsum.photos/seed/hino-6/400/400', audio_url: '' },
    { id: 7, numero: 7, titulo: 'Hino de Fé', compositor_nome: 'Ruth Oliveira', categoria: 'Hinos Cantados', cover_url: 'https://picsum.photos/seed/hino-7/400/400', audio_url: '' },
    { id: 3, numero: 3, titulo: 'Hino de Comunhão', compositor_nome: 'Carlos Silva', categoria: 'Hinos Tocados', cover_url: 'https://picsum.photos/seed/hino-3/400/400', audio_url: '' },
    { id: 8, numero: 8, titulo: 'Hino Instrumental', compositor_nome: 'Paulo Mendes', categoria: 'Hinos Tocados', cover_url: 'https://picsum.photos/seed/hino-8/400/400', audio_url: '' },
    { id: 9, numero: 9, titulo: 'Hino de Reverência', compositor_nome: 'Lucas Almeida', categoria: 'Hinos Tocados', cover_url: 'https://picsum.photos/seed/hino-9/400/400', audio_url: '' },
    { id: 10, numero: 10, titulo: 'Hino de Paz', compositor_nome: 'Marcos Reis', categoria: 'Hinos Tocados', cover_url: 'https://picsum.photos/seed/hino-10/400/400', audio_url: '' },
    { id: 4, numero: 4, titulo: 'Hino Especial', compositor_nome: 'Ana Santos', categoria: 'Hinos Avulsos', cover_url: 'https://picsum.photos/seed/hino-4/400/400', audio_url: '' },
    { id: 5, numero: 5, titulo: 'Hino de Evangelização', compositor_nome: 'Pedro Costa', categoria: 'Hinos Avulsos', cover_url: 'https://picsum.photos/seed/hino-5/400/400', audio_url: '' },
    { id: 11, numero: 11, titulo: 'Hino de Esperança', compositor_nome: 'Sara Nunes', categoria: 'Hinos Avulsos', cover_url: 'https://picsum.photos/seed/hino-11/400/400', audio_url: '' },
    { id: 12, numero: 12, titulo: 'Hino de Alegria', compositor_nome: 'Daniel Souza', categoria: 'Hinos Avulsos', cover_url: 'https://picsum.photos/seed/hino-12/400/400', audio_url: '' },
  ];

  if (isSupabaseConfigured) {
    try {
      const [cantados, tocados, avulsos] = await Promise.all([
        supabaseFetch<any>('hinos', {
          categoria: 'ilike.%Hinos Cantados%',
          ativo: 'eq.true',
          select: 'id,numero,titulo,compositor_nome,categoria,audio_url,cover_url,youtube_source',
          limit: '50'
        }),
        supabaseFetch<any>('hinos', {
          categoria: 'ilike.%Hinos Tocados%',
          ativo: 'eq.true',
          select: 'id,numero,titulo,compositor_nome,categoria,audio_url,cover_url,youtube_source',
          limit: '50'
        }),
        supabaseFetch<any>('hinos', {
          categoria: 'ilike.%Hinos Avulsos%',
          ativo: 'eq.true',
          select: 'id,numero,titulo,compositor_nome,categoria,audio_url,cover_url,youtube_source',
          limit: '50'
        })
      ]);
      cantadosApi = cantados;
      tocadosApi = tocados;
      avulsosApi = avulsos;
    } catch (e) {
      console.warn('Supabase error loading hinos by category:', e);
      cantadosApi = [];
      tocadosApi = [];
      avulsosApi = [];
    }
  } else {
    cantadosApi = [];
    tocadosApi = [];
    avulsosApi = [];
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
        composer_name: h.compositor_nome ?? h.composer_name ?? h.artist,
        category: 'Cantados',
        cover_url: h.cover_url ?? h.coverUrl,
        audio_url: h.audio_url ?? h.audioUrl,
        duration: h.duracao ?? h.duration,
        created_at: h.created_at ?? h.createdAt,
        youtube_source: h.youtube_source,
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
        composer_name: h.compositor_nome ?? h.composer_name ?? h.artist,
        category: 'Tocados',
        cover_url: h.cover_url ?? h.coverUrl,
        audio_url: h.audio_url ?? h.audioUrl,
        duration: h.duracao ?? h.duration,
        created_at: h.created_at ?? h.createdAt,
        youtube_source: h.youtube_source,
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
        composer_name: h.compositor_nome ?? h.composer_name ?? h.artist,
        category: 'Avulsos',
        cover_url: h.cover_url ?? h.coverUrl,
        audio_url: h.audio_url ?? h.audioUrl,
        duration: h.duracao ?? h.duration,
        created_at: h.created_at ?? h.createdAt,
        youtube_source: h.youtube_source,
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
