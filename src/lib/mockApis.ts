// APIs de Busca usando Supabase
import { publicSupabase } from '@/lib/supabase-auth';

export interface HymnSearchResult {
  id: string;
  number: number;
  title: string;
  composer_name?: string;
  category_name?: string;
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
  total_hymns?: number;
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
  searchTerm: string;
  normalizedQuery: string;
  hymnFilter: string;
  composerFilter: string;
  albumFilter: string;
  playlistFilter: string;
}

function normalizeSearchValue(value?: string | number | null): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
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

    const weight = item.weight ?? 1;
    bestScore = Math.max(bestScore, Math.round(score * weight));
  }

  return bestScore;
}

function getSearchContext(query: string): SearchContext | null {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return null;

  const searchTerm = `%${normalizedQuery}%`;
  const numericQuery = /^\d+$/.test(normalizedQuery) ? Number(normalizedQuery) : null;

  return {
    searchTerm,
    normalizedQuery: normalizeSearchValue(normalizedQuery),
    hymnFilter: numericQuery != null
      ? `titulo.ilike.${searchTerm},compositor_nome.ilike.${searchTerm},numero.eq.${numericQuery}`
      : `titulo.ilike.${searchTerm},compositor_nome.ilike.${searchTerm}`,
    composerFilter: `name.ilike.${searchTerm},artistic_name.ilike.${searchTerm}`,
    albumFilter: `title.ilike.${searchTerm},artist.ilike.${searchTerm}`,
    playlistFilter: `name.ilike.${searchTerm},description.ilike.${searchTerm}`,
  };
}

async function searchHymns(context: SearchContext, limit: number): Promise<HymnSearchResult[]> {
  const client = publicSupabase;
  const { data, error } = await client
    .from('hinos')
    .select('id, numero, titulo, compositor_nome, categoria, cover_url, audio_url, youtube_source')
    .or(context.hymnFilter)
    .eq('ativo', 1)
    .limit(limit);

  if (error) {
    console.error('❌ Erro ao buscar hinos:', error);
    return [];
  }

  return (data || [])
    .map((h: any) => ({
      id: String(h.id),
      number: h.numero || 0,
      title: h.titulo || 'Hino',
      composer_name: h.compositor_nome,
      category_name: h.categoria,
      cover_url: h.cover_url,
      audio_url: h.audio_url,
      youtube_source: h.youtube_source || undefined,
      matchScore: getMatchScore(context.normalizedQuery, [
        { value: h.numero, weight: 1.3 },
        { value: h.titulo, weight: 1.1 },
        { value: h.compositor_nome, weight: 0.55 },
        { value: h.categoria, weight: 0.2 },
      ]),
    }))
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || a.title.localeCompare(b.title, 'pt-BR'));
}

async function searchComposers(context: SearchContext, limit: number): Promise<ComposerSearchResult[]> {
  const client = publicSupabase;
  const { data, error } = await client
    .from('composers')
    .select('id, name, artistic_name, email, bio, biography, photo_url, avatar_url')
    .or(context.composerFilter)
    .limit(limit);

  if (error) {
    console.error('❌ Erro ao buscar compositores:', error);
    return [];
  }

  return (data || [])
    .map((c: any) => ({
      id: String(c.id),
      name: c.artistic_name || c.name || 'Compositor',
      bio: c.biography || c.bio,
      photo_url: c.avatar_url || c.photo_url,
      matchScore: getMatchScore(context.normalizedQuery, [
        { value: c.artistic_name, weight: 1.2 },
        { value: c.name, weight: 1.1 },
        { value: c.email, weight: 0.35 },
        { value: c.biography || c.bio, weight: 0.15 },
      ]),
    }))
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || a.name.localeCompare(b.name, 'pt-BR'));
}

async function searchAlbums(context: SearchContext, limit: number): Promise<AlbumSearchResult[]> {
  const client = publicSupabase;
  const { data, error } = await client
    .from('albums')
    .select('id, title, artist, cover_url, active')
    .or(context.albumFilter)
    .eq('is_published', true)
    .limit(limit);

  if (error) {
    console.error('❌ Erro ao buscar álbuns:', error);
    return [];
  }

  return (data || [])
    .filter((a: any) => a.active !== false)
    .map((a: any) => ({
      id: String(a.id),
      title: a.title || 'Álbum',
      artist: a.artist,
      cover_url: a.cover_url,
      matchScore: getMatchScore(context.normalizedQuery, [
        { value: a.title, weight: 1.05 },
        { value: a.artist, weight: 0.75 },
      ]),
    }))
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || a.title.localeCompare(b.title, 'pt-BR'));
}

async function searchPlaylists(context: SearchContext, limit: number): Promise<PlaylistSearchResult[]> {
  const client = publicSupabase;
  const { data, error } = await client
    .from('playlists')
    .select('id, name, description, cover_url')
    .or(context.playlistFilter)
    .eq('is_public', 1)
    .limit(limit);

  if (error) {
    console.error('❌ Erro ao buscar playlists:', error);
    return [];
  }

  return (data || [])
    .map((p: any) => ({
      id: String(p.id),
      name: p.name || 'Playlist',
      description: p.description,
      cover_url: p.cover_url,
      matchScore: getMatchScore(context.normalizedQuery, [
        { value: p.name, weight: 1.05 },
        { value: p.description, weight: 0.25 },
      ]),
    }))
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0) || a.name.localeCompare(b.name, 'pt-BR'));
}

// Busca rápida usando Supabase
export const quickSearch = async (query: string): Promise<SearchResult> => {
  console.log('🔍 quickSearch:', query);

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
    console.error('Erro na busca rápida:', error);
    return { hymns: [], composers: [], albums: [], playlists: [] };
  }
};

// Busca avançada usando Supabase
export const advancedSearch = async (params: { query: string; type?: string; limit?: number }): Promise<SearchResult> => {
  console.log('🔍 advancedSearch:', params);
  
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

    const results: SearchResult = { hymns, composers, albums, playlists };

    console.log('✅ Resultados totais da busca:', {
      hymns: results.hymns.length,
      composers: results.composers.length,
      albums: results.albums.length,
      playlists: results.playlists.length
    });

    return results;
  } catch (error) {
    console.error('❌ Erro crítico na busca avançada:', error);
    return { hymns: [], composers: [], albums: [], playlists: [] };
  }
};

// Consulta o logo público salvo no painel e usa cache apenas como fallback.
export const getLogoByType = async (type: string): Promise<{ url: string } | null> => {
  try {
    const { data, error } = await publicSupabase
      .from('site_logos')
      .select('url')
      .eq('type', type)
      .limit(1);
    const savedUrl = String(data?.[0]?.url || '').trim();
    if (!error && savedUrl) return { url: normalizeAssetUrl(savedUrl) };
  } catch {}

  try {
    const cacheKey = `${type}LogoUrl`;
    const cached = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(cacheKey))
      || (typeof localStorage !== 'undefined' && localStorage.getItem(cacheKey));
    if (cached) return { url: normalizeAssetUrl(cached) };
  } catch {}

  return type === 'favicon'
    ? { url: '/icons/favicon.svg' }
    : { url: 'https://www.canticosccb.com.br/logo-canticos-ccb.png' };
};
import { normalizeAssetUrl } from '@/utils/siteUrl';
