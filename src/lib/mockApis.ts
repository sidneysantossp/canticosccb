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
}

export interface ComposerSearchResult {
  id: string;
  name: string;
  bio?: string;
  photo_url?: string;
}

export interface AlbumSearchResult {
  id: string;
  title: string;
  composer_name?: string;
  cover_url?: string;
}

export interface PlaylistSearchResult {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
}

export interface SearchResult {
  hymns: HymnSearchResult[];
  composers: ComposerSearchResult[];
  albums: AlbumSearchResult[];
  playlists: PlaylistSearchResult[];
}

// Busca rápida usando Supabase
export const quickSearch = async (query: string): Promise<SearchResult> => {
  console.log('🔍 quickSearch:', query);
  
  if (!query || query.trim().length < 1) {
    return { hymns: [], composers: [], albums: [], playlists: [] };
  }

  try {
    const searchTerm = `%${query.trim()}%`;
    
    const [hymnsRes, composersRes] = await Promise.all([
      supabase
        .from('hinos')
        .select('id, numero, titulo, compositor_nome, categoria, capa, audio_url')
        .or(`titulo.ilike.${searchTerm},compositor_nome.ilike.${searchTerm}`)
        .eq('ativo', 1)
        .limit(10),
      supabase
        .from('compositores')
        .select('id, name, artistic_name, bio, photo_url')
        .or(`name.ilike.${searchTerm},artistic_name.ilike.${searchTerm}`)
        .limit(5)
    ]);

    return {
      hymns: (hymnsRes.data || []).map((h: any) => ({
        id: String(h.id),
        number: h.numero || 0,
        title: h.titulo || 'Hino',
        composer_name: h.compositor_nome,
        category_name: h.categoria,
        cover_url: h.capa,
        audio_url: h.audio_url
      })),
      composers: (composersRes.data || []).map((c: any) => ({
        id: String(c.id),
        name: c.name || c.artistic_name || 'Compositor',
        bio: c.bio,
        photo_url: c.photo_url
      })),
      albums: [],
      playlists: []
    };
  } catch (error) {
    console.error('Erro na busca rápida:', error);
    return { hymns: [], composers: [], albums: [], playlists: [] };
  }
};

// Busca avançada usando Supabase
export const advancedSearch = async (params: { query: string; type?: string; limit?: number }): Promise<SearchResult> => {
  console.log('🔍 advancedSearch:', params);
  
  const { query, type = 'all', limit = 50 } = params;
  
  if (!query || query.trim().length < 1) {
    return { hymns: [], composers: [], albums: [], playlists: [] };
  }

  try {
    const searchTerm = `%${query.trim()}%`;
    const results: SearchResult = { hymns: [], composers: [], albums: [], playlists: [] };

    // Buscar hinos
    if (type === 'all' || type === 'hymns') {
      console.log('🔍 Buscando hinos com termo:', searchTerm);
      
      const { data: hymns, error: hymnsError } = await supabase
        .from('hinos')
        .select('id, numero, titulo, compositor_nome, categoria, capa, audio_url')
        .or(`titulo.ilike.${searchTerm},compositor_nome.ilike.${searchTerm}`)
        .limit(limit);

      if (hymnsError) {
        console.error('❌ Erro ao buscar hinos:', hymnsError);
      } else {
        console.log('✅ Hinos encontrados:', hymns?.length || 0);
        if (hymns && hymns.length > 0) {
          console.log('📋 Primeiro hino:', hymns[0]);
        }
        results.hymns = (hymns || []).map((h: any) => ({
          id: String(h.id),
          number: h.numero || 0,
          title: h.titulo || 'Hino',
          composer_name: h.compositor_nome,
          category_name: h.categoria,
          cover_url: h.capa,
          audio_url: h.audio_url
        }));
      }
    }

    // Buscar compositores
    if (type === 'all' || type === 'composers') {
      console.log('🔍 Buscando compositores com termo:', searchTerm);
      const { data: composers, error: composersError } = await supabase
        .from('compositores')
        .select('id, name, artistic_name, bio, photo_url')
        .or(`name.ilike.${searchTerm},artistic_name.ilike.${searchTerm}`)
        .limit(limit);

      if (composersError) {
        console.error('❌ Erro ao buscar compositores:', composersError);
      } else {
        console.log('✅ Compositores encontrados:', composers?.length || 0);
        results.composers = (composers || []).map((c: any) => ({
          id: String(c.id),
          name: c.name || c.artistic_name || 'Compositor',
          bio: c.bio,
          photo_url: c.photo_url
        }));
      }
    }

    // Buscar álbuns
    if (type === 'all' || type === 'albums') {
      console.log('🔍 Buscando álbuns com termo:', searchTerm);
      const { data: albums, error: albumsError } = await supabase
        .from('albums')
        .select('id, titulo, compositor_nome, capa')
        .ilike('titulo', searchTerm)
        .limit(limit);

      if (albumsError) {
        console.error('❌ Erro ao buscar álbuns:', albumsError);
      } else {
        console.log('✅ Álbuns encontrados:', albums?.length || 0);
        results.albums = (albums || []).map((a: any) => ({
          id: String(a.id),
          title: a.titulo || 'Álbum',
          composer_name: a.compositor_nome,
          cover_url: a.capa
        }));
      }
    }

    // Buscar playlists
    if (type === 'all' || type === 'playlists') {
      console.log('🔍 Buscando playlists com termo:', searchTerm);
      const { data: playlists, error: playlistsError } = await supabase
        .from('playlists')
        .select('id, name, description, cover_url')
        .ilike('name', searchTerm)
        .eq('is_public', 1)
        .limit(limit);

      if (playlistsError) {
        console.error('❌ Erro ao buscar playlists:', playlistsError);
      } else {
        console.log('✅ Playlists encontradas:', playlists?.length || 0);
        results.playlists = (playlists || []).map((p: any) => ({
          id: String(p.id),
          name: p.name || 'Playlist',
          description: p.description,
          cover_url: p.cover_url
        }));
      }
    }

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
  return { url: '/logo-canticos-ccb.svg' };
};
