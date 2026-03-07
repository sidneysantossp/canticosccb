// APIs de Busca usando Supabase
import { supabase } from '@/lib/supabase-auth';

export interface HymnSearchResult {
  id: string;
  number: number;
  title: string;
  composer_name?: string;
  category_name?: string;
  cover_url?: string;
  audio_url?: string;
  youtube_source?: string;
}

export interface ComposerSearchResult {
  id: string;
  name: string;
  bio?: string;
  photo_url?: string;
  total_hymns?: number;
}

export interface AlbumSearchResult {
  id: string;
  title: string;
  artist?: string;
  cover_url?: string;
}

export interface PlaylistSearchResult {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  hymns_count?: number;
}

export interface SearchResult {
  hymns: HymnSearchResult[];
  composers: ComposerSearchResult[];
  albums: AlbumSearchResult[];
  playlists: PlaylistSearchResult[];
}

interface SearchContext {
  searchTerm: string;
  hymnFilter: string;
  composerFilter: string;
  albumFilter: string;
  playlistFilter: string;
}

function getSearchContext(query: string): SearchContext | null {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return null;

  const searchTerm = `%${normalizedQuery}%`;
  const numericQuery = /^\d+$/.test(normalizedQuery) ? Number(normalizedQuery) : null;

  return {
    searchTerm,
    hymnFilter: numericQuery != null
      ? `titulo.ilike.${searchTerm},compositor_nome.ilike.${searchTerm},numero.eq.${numericQuery}`
      : `titulo.ilike.${searchTerm},compositor_nome.ilike.${searchTerm}`,
    composerFilter: `name.ilike.${searchTerm},artistic_name.ilike.${searchTerm}`,
    albumFilter: `title.ilike.${searchTerm},artist.ilike.${searchTerm}`,
    playlistFilter: `name.ilike.${searchTerm},description.ilike.${searchTerm}`,
  };
}

async function searchHymns(context: SearchContext, limit: number): Promise<HymnSearchResult[]> {
  const { data, error } = await supabase
    .from('hinos')
    .select('id, numero, titulo, compositor_nome, categoria, cover_url, audio_url, youtube_source')
    .or(context.hymnFilter)
    .eq('ativo', 1)
    .limit(limit);

  if (error) {
    console.error('❌ Erro ao buscar hinos:', error);
    return [];
  }

  return (data || []).map((h: any) => ({
    id: String(h.id),
    number: h.numero || 0,
    title: h.titulo || 'Hino',
    composer_name: h.compositor_nome,
    category_name: h.categoria,
    cover_url: h.cover_url,
    audio_url: h.audio_url,
    youtube_source: h.youtube_source || undefined,
  }));
}

async function searchComposers(context: SearchContext, limit: number): Promise<ComposerSearchResult[]> {
  const { data, error } = await supabase
    .from('composers')
    .select('id, name, artistic_name, bio, photo_url')
    .or(context.composerFilter)
    .limit(limit);

  if (error) {
    console.error('❌ Erro ao buscar compositores:', error);
    return [];
  }

  return (data || []).map((c: any) => ({
    id: String(c.id),
    name: c.name || c.artistic_name || 'Compositor',
    bio: c.bio,
    photo_url: c.photo_url,
  }));
}

async function searchAlbums(context: SearchContext, limit: number): Promise<AlbumSearchResult[]> {
  const { data, error } = await supabase
    .from('albums')
    .select('id, title, artist, cover_url')
    .or(context.albumFilter)
    .eq('is_published', true)
    .eq('active', true)
    .limit(limit);

  if (error) {
    console.error('❌ Erro ao buscar álbuns:', error);
    return [];
  }

  return (data || []).map((a: any) => ({
    id: String(a.id),
    title: a.title || 'Álbum',
    artist: a.artist,
    cover_url: a.cover_url,
  }));
}

async function searchPlaylists(context: SearchContext, limit: number): Promise<PlaylistSearchResult[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select('id, name, description, cover_url')
    .or(context.playlistFilter)
    .eq('is_public', 1)
    .limit(limit);

  if (error) {
    console.error('❌ Erro ao buscar playlists:', error);
    return [];
  }

  return (data || []).map((p: any) => ({
    id: String(p.id),
    name: p.name || 'Playlist',
    description: p.description,
    cover_url: p.cover_url,
  }));
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

// Logo mock: lê do sessionStorage (preenchido pela área admin) e retorna um fallback
export const getLogoByType = async (type: string): Promise<{ url: string } | null> => {
  try {
    // Prioriza cache específico do tipo, senão usa 'primary'
    const cacheKey = `${type}LogoUrl`;
    const fromSession = (typeof sessionStorage !== 'undefined')
      ? (sessionStorage.getItem(cacheKey) || sessionStorage.getItem('primaryLogoUrl'))
      : null;
    const fromLocal = (typeof localStorage !== 'undefined')
      ? (localStorage.getItem(cacheKey) || localStorage.getItem('primaryLogoUrl'))
      : null;
    const cached = fromSession || fromLocal;
    if (cached) return { url: cached };
  } catch {}

  // Fallback seguro local (garante UI funcional)
  return { url: 'https://canticosccb.com.br/logo-canticos-ccb.png' };
};
