import { publicSupabase } from '@/lib/supabase-auth';
import { getEmergencyCatalog, isSupabaseQuotaRestrictionErrorMessage } from '@/lib/emergencyCatalog';

export interface HymnSearchResult {
  id: string;
  number: number;
  title: string;
  composer_name?: string;
  category_name?: string;
  category?: string;
  duration?: string;
  cover_url?: string;
  audio_url?: string;
  youtube_source?: string;
  matchScore?: number;
}

export interface ComposerSearchResult {
  id: string;
  name: string;
  bio?: string;
  photo_url?: string;
  matchScore?: number;
}

export interface AlbumSearchResult {
  id: string;
  title: string;
  artist?: string;
  cover_url?: string;
  matchScore?: number;
}

export interface PlaylistSearchResult {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  hymns_count?: number;
  matchScore?: number;
}

export interface SearchResult {
  hymns: HymnSearchResult[];
  composers: ComposerSearchResult[];
  albums: AlbumSearchResult[];
  playlists: PlaylistSearchResult[];
}

interface SearchContext {
  normalizedQuery: string;
  searchTerm: string;
  numericQuery: number | null;
  hymnFilter: string;
  composerFilter: string;
  albumFilter: string;
  playlistFilter: string;
  categoryFilter: string;
}

interface HymnRow {
  id: string | number;
  numero?: number | null;
  titulo?: string | null;
  compositor_nome?: string | null;
  categoria?: string | null;
  cover_url?: string | null;
  audio_url?: string | null;
  youtube_source?: string | null;
}

interface ComposerRow {
  id: string | number;
  name?: string | null;
  artistic_name?: string | null;
  email?: string | null;
  bio?: string | null;
  biography?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
}

interface AlbumRow {
  id: string | number;
  title?: string | null;
  artist?: string | null;
  genre?: string | null;
  cover_url?: string | null;
  active?: boolean | number | null;
}

interface PlaylistRow {
  id: string | number;
  name?: string | null;
  description?: string | null;
  cover_url?: string | null;
}

interface CategoryRow {
  id: string | number;
  nome?: string | null;
  descricao?: string | null;
}

interface AlbumHinoRow {
  album_id?: string | number | null;
  hino_id?: string | number | null;
}

interface PlaylistTrackRow {
  playlist_id?: string | number | null;
  song_id?: string | number | null;
}

interface HinoCategoriaRow {
  hino_id?: string | number | null;
  categoria_id?: string | number | null;
}

function isRestrictedSupabaseError(error: unknown): boolean {
  return isSupabaseQuotaRestrictionErrorMessage(String((error as any)?.message || error || ''));
}

const HYMN_SELECT = 'id,numero,titulo,compositor_nome,categoria,cover_url,audio_url,youtube_source';
const COMPOSER_SELECT = 'id,name,artistic_name,email,bio,biography,photo_url,avatar_url';
const ALBUM_SELECT = 'id,title,artist,genre,cover_url,active';
const PLAYLIST_SELECT = 'id,name,description,cover_url';

function normalizeSearchValue(value?: string | number | null): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeEntityId(value?: string | number | null): string {
  return String(value || '').trim();
}

function getMatchScore(query: string, values: Array<{ value?: string | number | null; weight?: number }>): number {
  if (!query) return 0;

  let bestScore = 0;

  for (const item of values) {
    const text = normalizeSearchValue(item.value);
    if (!text) continue;

    let score = 0;

    if (text === query) {
      score = 120;
    } else if (text.startsWith(query)) {
      score = 100;
    } else if (text.split(/\s+/).some((part) => part.startsWith(query))) {
      score = 85;
    } else {
      const index = text.indexOf(query);
      if (index >= 0) {
        score = Math.max(45, 70 - Math.min(index, 25));
      }
    }

    if (!score) continue;
    bestScore = Math.max(bestScore, Math.round(score * (item.weight ?? 1)));
  }

  return bestScore;
}

function getSearchContext(query: string): SearchContext | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const searchTerm = `%${trimmed}%`;
  const numericQuery = /^\d+$/.test(trimmed) ? Number(trimmed) : null;

  return {
    normalizedQuery: normalizeSearchValue(trimmed),
    searchTerm,
    numericQuery,
    hymnFilter: numericQuery != null
      ? `titulo.ilike.${searchTerm},compositor_nome.ilike.${searchTerm},categoria.ilike.${searchTerm},numero.eq.${numericQuery}`
      : `titulo.ilike.${searchTerm},compositor_nome.ilike.${searchTerm},categoria.ilike.${searchTerm}`,
    composerFilter: `name.ilike.${searchTerm},artistic_name.ilike.${searchTerm},bio.ilike.${searchTerm},biography.ilike.${searchTerm}`,
    albumFilter: `title.ilike.${searchTerm},artist.ilike.${searchTerm},genre.ilike.${searchTerm}`,
    playlistFilter: `name.ilike.${searchTerm},description.ilike.${searchTerm}`,
    categoryFilter: `nome.ilike.${searchTerm},descricao.ilike.${searchTerm}`,
  };
}

function chunkArray<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function pushUniqueMapValue(map: Map<string, string[]>, key: string, value?: string | null) {
  const normalizedKey = normalizeEntityId(key);
  const normalizedValue = String(value || '').trim();
  if (!normalizedKey || !normalizedValue) return;

  const current = new Set(map.get(normalizedKey) || []);
  current.add(normalizedValue);
  map.set(normalizedKey, Array.from(current));
}

function upsertHymnRow(map: Map<string, HymnRow>, row?: HymnRow | null) {
  const id = normalizeEntityId(row?.id);
  if (!id || !row) return;
  map.set(id, row);
}

async function fetchHymnsByIds(ids: string[]): Promise<HymnRow[]> {
  if (ids.length === 0) return [];

  const batches = chunkArray(Array.from(new Set(ids)), 100);
  const results = await Promise.all(
    batches.map(async (batch) => {
      const { data, error } = await publicSupabase
        .from('hinos')
        .select(HYMN_SELECT)
        .in('id', batch)
        .eq('ativo', 1);

      if (error) {
        console.error('❌ Erro ao buscar hinos por IDs:', error);
        if (isRestrictedSupabaseError(error)) {
          const catalog = await getEmergencyCatalog();
          return catalog.hymns.filter((hymn) => batch.includes(normalizeEntityId(hymn.id))) as HymnRow[];
        }
        return [] as HymnRow[];
      }

      return (data || []) as HymnRow[];
    })
  );

  return results.flat();
}

async function searchEmergencyHymns(context: SearchContext, limit: number): Promise<HymnSearchResult[]> {
  const catalog = await getEmergencyCatalog();
  const albumNamesByHymn = new Map<string, string[]>();
  const categoryNamesByHymn = new Map<string, string[]>();

  for (const relation of catalog.albumHymns) {
    const album = catalog.albums.find((item) => item.id === relation.album_id);
    if (!album) continue;
    const current = new Set(albumNamesByHymn.get(relation.hino_id) || []);
    current.add(album.title);
    albumNamesByHymn.set(relation.hino_id, Array.from(current));
  }

  for (const relation of catalog.hymnCategories) {
    const category = catalog.categories.find((item) => item.id === relation.categoria_id);
    if (!category) continue;
    const current = new Set(categoryNamesByHymn.get(relation.hino_id) || []);
    current.add(category.nome);
    categoryNamesByHymn.set(relation.hino_id, Array.from(current));
  }

  return catalog.hymns
    .map((hymn) => {
      const matchScore = getMatchScore(context.normalizedQuery, [
        { value: hymn.numero, weight: 1.4 },
        { value: hymn.titulo, weight: 1.2 },
        { value: hymn.compositor_nome, weight: 0.85 },
        { value: hymn.categoria, weight: 0.7 },
        ...((albumNamesByHymn.get(hymn.id) || []).map((value) => ({ value, weight: 0.6 }))),
        ...((categoryNamesByHymn.get(hymn.id) || []).map((value) => ({ value, weight: 0.8 }))),
      ]);

      return {
        id: hymn.id,
        number: hymn.numero,
        title: hymn.titulo,
        composer_name: hymn.compositor_nome || undefined,
        category_name: hymn.categoria,
        cover_url: hymn.cover_url || undefined,
        audio_url: hymn.audio_url || undefined,
        youtube_source: hymn.youtube_source || undefined,
        matchScore,
      };
    })
    .filter((hymn) => (hymn.matchScore || 0) > 0)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || a.title.localeCompare(b.title, 'pt-BR'))
    .slice(0, limit);
}

async function searchEmergencyComposers(context: SearchContext, limit: number): Promise<ComposerSearchResult[]> {
  const catalog = await getEmergencyCatalog();

  return catalog.composers
    .map((composer) => ({
      id: composer.id,
      name: composer.artistic_name || composer.name,
      bio: composer.biography || composer.bio || undefined,
      photo_url: composer.avatar_url || composer.photo_url || undefined,
      matchScore: getMatchScore(context.normalizedQuery, [
        { value: composer.artistic_name, weight: 1.2 },
        { value: composer.name, weight: 1.1 },
        { value: composer.bio, weight: 0.15 },
      ]),
    }))
    .filter((composer) => (composer.matchScore || 0) > 0)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || a.name.localeCompare(b.name, 'pt-BR'))
    .slice(0, limit);
}

async function searchEmergencyAlbums(context: SearchContext, limit: number): Promise<AlbumSearchResult[]> {
  const catalog = await getEmergencyCatalog();

  return catalog.albums
    .map((album) => ({
      id: album.id,
      title: album.title,
      artist: album.artist || undefined,
      cover_url: album.cover_url || undefined,
      matchScore: getMatchScore(context.normalizedQuery, [
        { value: album.title, weight: 1.1 },
        { value: album.artist, weight: 0.8 },
        { value: album.genre, weight: 0.6 },
      ]),
    }))
    .filter((album) => (album.matchScore || 0) > 0)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || a.title.localeCompare(b.title, 'pt-BR'))
    .slice(0, limit);
}

async function searchEmergencyPlaylists(context: SearchContext, limit: number): Promise<PlaylistSearchResult[]> {
  const catalog = await getEmergencyCatalog();

  return catalog.playlists
    .map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || undefined,
      cover_url: playlist.cover_url || undefined,
      matchScore: getMatchScore(context.normalizedQuery, [
        { value: playlist.name, weight: 1.1 },
        { value: playlist.description, weight: 0.35 },
      ]),
    }))
    .filter((playlist) => (playlist.matchScore || 0) > 0)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || a.name.localeCompare(b.name, 'pt-BR'))
    .slice(0, limit);
}

async function searchHymns(context: SearchContext, limit: number): Promise<HymnSearchResult[]> {
  const [directHymnsResult, matchedAlbumsResult, matchedPlaylistsResult, matchedCategoriesResult] = await Promise.all([
    publicSupabase
      .from('hinos')
      .select(HYMN_SELECT)
      .or(context.hymnFilter)
      .eq('ativo', 1)
      .limit(Math.max(limit * 2, 80)),
    publicSupabase
      .from('albums')
      .select(ALBUM_SELECT)
      .or(context.albumFilter)
      .eq('is_published', true)
      .limit(80),
    publicSupabase
      .from('playlists')
      .select(PLAYLIST_SELECT)
      .or(context.playlistFilter)
      .eq('is_public', true)
      .limit(80),
    publicSupabase
      .from('categorias')
      .select('id,nome,descricao')
      .or(context.categoryFilter)
      .limit(80),
  ]);

  if (
    isRestrictedSupabaseError(directHymnsResult.error) ||
    isRestrictedSupabaseError(matchedAlbumsResult.error) ||
    isRestrictedSupabaseError(matchedPlaylistsResult.error) ||
    isRestrictedSupabaseError(matchedCategoriesResult.error)
  ) {
    return searchEmergencyHymns(context, limit);
  }

  if (directHymnsResult.error) {
    console.error('❌ Erro ao buscar hinos:', directHymnsResult.error);
  }

  const hymnMap = new Map<string, HymnRow>();
  const hymnAlbumNames = new Map<string, string[]>();
  const hymnPlaylistNames = new Map<string, string[]>();
  const hymnCategoryNames = new Map<string, string[]>();

  for (const hymn of (directHymnsResult.data || []) as HymnRow[]) {
    upsertHymnRow(hymnMap, hymn);
  }

  const matchedAlbums = ((matchedAlbumsResult.data || []) as AlbumRow[]).filter((album) => album.active !== false);
  const matchedPlaylists = (matchedPlaylistsResult.data || []) as PlaylistRow[];
  const matchedCategories = (matchedCategoriesResult.data || []) as CategoryRow[];

  const matchedAlbumIds = matchedAlbums.map((album) => normalizeEntityId(album.id)).filter(Boolean);
  const matchedPlaylistIds = matchedPlaylists.map((playlist) => normalizeEntityId(playlist.id)).filter(Boolean);
  const matchedCategoryIds = matchedCategories.map((category) => normalizeEntityId(category.id)).filter(Boolean);

  if (matchedAlbumIds.length > 0) {
    const { data, error } = await publicSupabase
      .from('album_hinos')
      .select('album_id,hino_id')
      .in('album_id', matchedAlbumIds)
      .limit(4000);

    if (error) {
      console.error('❌ Erro ao buscar relações album_hinos:', error);
    } else {
      const relations = (data || []) as AlbumHinoRow[];
      const albumNamesById = new Map(
        matchedAlbums.map((album) => [
          normalizeEntityId(album.id),
          [album.title, album.artist, album.genre].filter(Boolean).join(' | '),
        ])
      );

      const hymnIds = new Set<string>();
      for (const relation of relations) {
        const albumId = normalizeEntityId(relation.album_id);
        const hymnId = normalizeEntityId(relation.hino_id);
        if (!albumId || !hymnId) continue;
        hymnIds.add(hymnId);
        pushUniqueMapValue(hymnAlbumNames, hymnId, albumNamesById.get(albumId));
      }

      const relatedHymns = await fetchHymnsByIds(Array.from(hymnIds));
      for (const hymn of relatedHymns) upsertHymnRow(hymnMap, hymn);
    }
  }

  if (matchedPlaylistIds.length > 0) {
    const { data, error } = await publicSupabase
      .from('playlist_songs')
      .select('playlist_id,song_id')
      .in('playlist_id', matchedPlaylistIds)
      .limit(4000);

    if (error) {
      console.error('❌ Erro ao buscar relações playlist_songs:', error);
    } else {
      const relations = (data || []) as PlaylistTrackRow[];
      const playlistNamesById = new Map(
        matchedPlaylists.map((playlist) => [
          normalizeEntityId(playlist.id),
          [playlist.name, playlist.description].filter(Boolean).join(' | '),
        ])
      );

      const hymnIds = new Set<string>();
      for (const relation of relations) {
        const playlistId = normalizeEntityId(relation.playlist_id);
        const hymnId = normalizeEntityId(relation.song_id);
        if (!playlistId || !hymnId) continue;
        hymnIds.add(hymnId);
        pushUniqueMapValue(hymnPlaylistNames, hymnId, playlistNamesById.get(playlistId));
      }

      const relatedHymns = await fetchHymnsByIds(Array.from(hymnIds));
      for (const hymn of relatedHymns) upsertHymnRow(hymnMap, hymn);
    }
  }

  if (matchedCategoryIds.length > 0) {
    const { data, error } = await publicSupabase
      .from('hino_categorias')
      .select('hino_id,categoria_id')
      .in('categoria_id', matchedCategoryIds)
      .limit(4000);

    if (error) {
      console.error('❌ Erro ao buscar relações hino_categorias:', error);
    } else {
      const relations = (data || []) as HinoCategoriaRow[];
      const categoryNamesById = new Map(
        matchedCategories.map((category) => [
          normalizeEntityId(category.id),
          [category.nome, category.descricao].filter(Boolean).join(' | '),
        ])
      );

      const hymnIds = new Set<string>();
      for (const relation of relations) {
        const categoryId = normalizeEntityId(relation.categoria_id);
        const hymnId = normalizeEntityId(relation.hino_id);
        if (!categoryId || !hymnId) continue;
        hymnIds.add(hymnId);
        pushUniqueMapValue(hymnCategoryNames, hymnId, categoryNamesById.get(categoryId));
      }

      const relatedHymns = await fetchHymnsByIds(Array.from(hymnIds));
      for (const hymn of relatedHymns) upsertHymnRow(hymnMap, hymn);
    }
  }

  return Array.from(hymnMap.values())
    .map((hymn) => {
      const hymnId = normalizeEntityId(hymn.id);
      const matchScore = getMatchScore(context.normalizedQuery, [
        { value: hymn.numero, weight: 1.4 },
        { value: hymn.titulo, weight: 1.2 },
        { value: hymn.compositor_nome, weight: 0.85 },
        { value: hymn.categoria, weight: 0.7 },
        ...((hymnCategoryNames.get(hymnId) || []).map((value) => ({ value, weight: 0.9 }))),
        ...((hymnAlbumNames.get(hymnId) || []).map((value) => ({ value, weight: 0.7 }))),
        ...((hymnPlaylistNames.get(hymnId) || []).map((value) => ({ value, weight: 0.6 }))),
      ]);

      return {
        id: hymnId,
        number: Number(hymn.numero || 0),
        title: hymn.titulo || 'Hino',
        composer_name: hymn.compositor_nome || undefined,
        category_name: hymn.categoria || hymnCategoryNames.get(hymnId)?.[0] || undefined,
        cover_url: hymn.cover_url || undefined,
        audio_url: hymn.audio_url || undefined,
        youtube_source: hymn.youtube_source || undefined,
        matchScore,
      };
    })
    .filter((hymn) => (hymn.matchScore || 0) > 0)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || a.title.localeCompare(b.title, 'pt-BR'))
    .slice(0, limit);
}

async function searchComposers(context: SearchContext, limit: number): Promise<ComposerSearchResult[]> {
  const { data, error } = await publicSupabase
    .from('composers')
    .select(COMPOSER_SELECT)
    .or(context.composerFilter)
    .limit(limit);

  if (error) {
    console.error('❌ Erro ao buscar compositores:', error);
    if (isRestrictedSupabaseError(error)) {
      return searchEmergencyComposers(context, limit);
    }
    return [];
  }

  return ((data || []) as ComposerRow[])
    .map((composer) => ({
      id: normalizeEntityId(composer.id),
      name: composer.artistic_name || composer.name || 'Compositor',
      bio: composer.biography || composer.bio || undefined,
      photo_url: composer.avatar_url || composer.photo_url || undefined,
      matchScore: getMatchScore(context.normalizedQuery, [
        { value: composer.artistic_name, weight: 1.2 },
        { value: composer.name, weight: 1.1 },
        { value: composer.email, weight: 0.35 },
        { value: composer.biography || composer.bio, weight: 0.15 },
      ]),
    }))
    .filter((composer) => (composer.matchScore || 0) > 0)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || a.name.localeCompare(b.name, 'pt-BR'));
}

async function searchAlbums(context: SearchContext, limit: number): Promise<AlbumSearchResult[]> {
  const { data, error } = await publicSupabase
    .from('albums')
    .select(ALBUM_SELECT)
    .or(context.albumFilter)
    .eq('is_published', true)
    .limit(limit);

  if (error) {
    console.error('❌ Erro ao buscar álbuns:', error);
    if (isRestrictedSupabaseError(error)) {
      return searchEmergencyAlbums(context, limit);
    }
    return [];
  }

  return ((data || []) as AlbumRow[])
    .filter((album) => album.active !== false)
    .map((album) => ({
      id: normalizeEntityId(album.id),
      title: album.title || 'Álbum',
      artist: album.artist || undefined,
      cover_url: album.cover_url || undefined,
      matchScore: getMatchScore(context.normalizedQuery, [
        { value: album.title, weight: 1.1 },
        { value: album.artist, weight: 0.8 },
        { value: album.genre, weight: 0.7 },
      ]),
    }))
    .filter((album) => (album.matchScore || 0) > 0)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || a.title.localeCompare(b.title, 'pt-BR'));
}

async function searchPlaylists(context: SearchContext, limit: number): Promise<PlaylistSearchResult[]> {
  const { data, error } = await publicSupabase
    .from('playlists')
    .select(PLAYLIST_SELECT)
    .or(context.playlistFilter)
    .eq('is_public', true)
    .limit(limit);

  if (error) {
    console.error('❌ Erro ao buscar playlists:', error);
    if (isRestrictedSupabaseError(error)) {
      return searchEmergencyPlaylists(context, limit);
    }
    return [];
  }

  return ((data || []) as PlaylistRow[])
    .map((playlist) => ({
      id: normalizeEntityId(playlist.id),
      name: playlist.name || 'Playlist',
      description: playlist.description || undefined,
      cover_url: playlist.cover_url || undefined,
      matchScore: getMatchScore(context.normalizedQuery, [
        { value: playlist.name, weight: 1.1 },
        { value: playlist.description, weight: 0.35 },
      ]),
    }))
    .filter((playlist) => (playlist.matchScore || 0) > 0)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || a.name.localeCompare(b.name, 'pt-BR'));
}

export const quickSearch = async (query: string): Promise<SearchResult> => {
  const context = getSearchContext(query);
  if (!context) {
    return { hymns: [], composers: [], albums: [], playlists: [] };
  }

  try {
    const [hymns, composers, albums, playlists] = await Promise.all([
      searchHymns(context, 6),
      searchComposers(context, 4),
      searchAlbums(context, 4),
      searchPlaylists(context, 4),
    ]);

    return { hymns, composers, albums, playlists };
  } catch (error) {
    console.error('❌ Erro na busca rápida:', error);
    return { hymns: [], composers: [], albums: [], playlists: [] };
  }
};

export const advancedSearch = async (params: { query: string; type?: string; limit?: number }): Promise<SearchResult> => {
  const { query, type = 'all', limit = 50 } = params;
  const context = getSearchContext(query);

  if (!context) {
    return { hymns: [], composers: [], albums: [], playlists: [] };
  }

  try {
    const [hymns, composers, albums, playlists] = await Promise.all([
      type === 'all' || type === 'hymns' ? searchHymns(context, limit) : Promise.resolve([]),
      type === 'all' || type === 'composers' ? searchComposers(context, limit) : Promise.resolve([]),
      type === 'all' || type === 'albums' ? searchAlbums(context, limit) : Promise.resolve([]),
      type === 'all' || type === 'playlists' ? searchPlaylists(context, limit) : Promise.resolve([]),
    ]);

    return { hymns, composers, albums, playlists };
  } catch (error) {
    console.error('❌ Erro crítico na busca avançada:', error);
    return { hymns: [], composers: [], albums: [], playlists: [] };
  }
};

export const getAll = async (..._args: any[]) => [];
export const getById = async (..._args: any[]) => null;
export const create = async (..._args: any[]) => ({ success: true });
export const update = async (..._args: any[]) => ({ success: true });
export const deleteItem = async (..._args: any[]) => ({ success: true });
