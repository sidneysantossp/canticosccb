import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete } from '@/lib/supabaseRest';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre: string;
  cover_url: string;
  audio_url: string;
  duration: string;
  status: 'published' | 'draft' | 'archived';
  is_featured: boolean;
  plays_count: number;
  likes_count: number;
  composer_id?: string;
  composer_name?: string;
  created_at: string;
  updated_at: string;
}

// Mapeamento de campos Supabase para interface Song
const mapHinoToSong = (hino: any): Song => ({
  id: String(hino.id),
  title: hino.titulo || hino.title || '',
  artist: hino.artista || hino.artist || 'CCB',
  album: hino.album,
  genre: hino.categoria || hino.genre || 'Hinos',
  cover_url: hino.cover_url || hino.capa_url || '',
  audio_url: hino.audio_url || '',
  duration: hino.duracao || hino.duration || '0:00',
  status: hino.status || 'draft',
  is_featured: hino.destaque || hino.is_featured || false,
  plays_count: hino.plays || hino.plays_count || 0,
  likes_count: hino.likes || hino.likes_count || 0,
  composer_id: hino.compositor_id || hino.composer_id,
  composer_name: hino.compositor_nome || hino.composer_name,
  created_at: hino.created_at || new Date().toISOString(),
  updated_at: hino.updated_at || new Date().toISOString()
});


export const getAllSongs = async (page: number = 1, limit: number = 20, filters: { status?: string; search?: string } = {}): Promise<{ data: Song[]; count: number; totalPages: number }> => {
  try {
    console.log('🔍 [getAllSongs] Fetching songs with filters:', filters);
    
    const queryFilters: Record<string, string> = {
      select: '*',
      order: 'created_at.desc'
    };
    
    // Filter by status
    if (filters.status && filters.status !== 'all') {
      queryFilters.status = `eq.${filters.status}`;
    }
    
    // Filter by search (titulo ou compositor)
    if (filters.search) {
      queryFilters.or = `(titulo.ilike.%${filters.search}%,compositor_nome.ilike.%${filters.search}%)`;
    }
    
    // Buscar total de registros
    const allRows = await supabaseFetch<any>('hinos', queryFilters);
    const totalCount = allRows.length;
    const totalPages = Math.ceil(totalCount / limit);
    
    // Buscar página específica
    queryFilters.limit = String(limit);
    if (page > 1) {
      const offset = (page - 1) * limit;
      queryFilters.offset = String(offset);
    }
    
    const rows = await supabaseFetch<any>('hinos', queryFilters);
    const songs = rows.map(mapHinoToSong);
    
    console.log(`✅ [getAllSongs] Found ${songs.length} songs (total: ${totalCount})`);
    
    return {
      data: songs,
      count: totalCount,
      totalPages
    };
  } catch (error: any) {
    console.error('❌ [getAllSongs] Error:', error);
    return {
      data: [],
      count: 0,
      totalPages: 0
    };
  }
};

export const getPendingSongs = async (): Promise<Song[]> => {
  try {
    const rows = await supabaseFetch<any>('hinos', {
      status: 'eq.draft',
      select: '*',
      order: 'created_at.desc'
    });
    return rows.map(mapHinoToSong);
  } catch (error) {
    console.error('❌ [getPendingSongs] Error:', error);
    return [];
  }
};

export const getSongById = async (id: string): Promise<Song | null> => {
  try {
    const rows = await supabaseFetch<any>('hinos', {
      id: `eq.${id}`,
      select: '*',
      limit: '1'
    });
    return rows.length > 0 ? mapHinoToSong(rows[0]) : null;
  } catch (error) {
    console.error('❌ [getSongById] Error:', error);
    return null;
  }
};

export const createSong = async (data: Partial<Song>): Promise<{ success: boolean; song?: Song }> => {
  try {
    const insertData = {
      titulo: data.title || '',
      artista: data.artist || 'CCB',
      album: data.album,
      categoria: data.genre || 'Hinos',
      cover_url: data.cover_url || '',
      audio_url: data.audio_url || '',
      duracao: data.duration || '0:00',
      status: data.status || 'draft',
      destaque: data.is_featured || false,
      plays: 0,
      likes: 0,
      compositor_nome: data.composer_name,
      compositor_id: data.composer_id
    };
    
    const result = await supabaseInsert<any>('hinos', insertData);
    const song = result ? mapHinoToSong(result) : undefined;
    
    return { success: true, song };
  } catch (error: any) {
    console.error('❌ [createSong] Error:', error);
    return { success: false };
  }
};

export const updateSong = async (id: string, data: Partial<Song>): Promise<{ success: boolean }> => {
  try {
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.titulo = data.title;
    if (data.artist !== undefined) updateData.artista = data.artist;
    if (data.album !== undefined) updateData.album = data.album;
    if (data.genre !== undefined) updateData.categoria = data.genre;
    if (data.cover_url !== undefined) updateData.cover_url = data.cover_url;
    if (data.audio_url !== undefined) updateData.audio_url = data.audio_url;
    if (data.duration !== undefined) updateData.duracao = data.duration;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.is_featured !== undefined) updateData.destaque = data.is_featured;
    if (data.composer_name !== undefined) updateData.compositor_nome = data.composer_name;
    if (data.composer_id !== undefined) updateData.compositor_id = data.composer_id;
    
    updateData.updated_at = new Date().toISOString();
    
    await supabaseUpdate('hinos', { id: `eq.${id}` }, updateData);
    return { success: true };
  } catch (error: any) {
    console.error('❌ [updateSong] Error:', error);
    return { success: false };
  }
};

export const deleteSong = async (id: string): Promise<{ success: boolean }> => {
  try {
    await supabaseDelete('hinos', { id: `eq.${id}` });
    return { success: true };
  } catch (error: any) {
    console.error('❌ [deleteSong] Error:', error);
    return { success: false };
  }
};

export const approveSong = async (id: string): Promise<{ success: boolean }> => {
  return updateSong(id, { status: 'published' });
};

export const rejectSong = async (id: string): Promise<{ success: boolean }> => {
  return updateSong(id, { status: 'archived' });
};

export const toggleSongStatus = async (id: string, status: 'published' | 'draft' | 'archived'): Promise<{ success: boolean }> => {
  return updateSong(id, { status });
};

export const toggleSongFeatured = async (id: string, featured: boolean): Promise<{ success: boolean }> => {
  return updateSong(id, { is_featured: featured });
};

// Funções de estatísticas
export const getSongStats = async (id: string) => {
  try {
    const song = await getSongById(id);
    if (!song) return null;
    
    return {
      plays_count: song.plays_count,
      likes_count: song.likes_count,
      status: song.status,
      is_featured: song.is_featured
    };
  } catch (error) {
    console.error('❌ [getSongStats] Error:', error);
    return null;
  }
};
export const getSiteSettings = async (...args: any[]) => ({});
export const updateSiteSettings = async (...args: any[]) => ({ success: true });
export const getComments = async (...args: any[]) => [];
export const deleteComment = async (...args: any[]) => ({ success: true });
export const approveComment = async (...args: any[]) => ({ success: true });
export const getClaims = async (...args: any[]) => [];
export const getCopyrightClaims = async (...args: any[]) => [];
export const updateClaim = async (...args: any[]) => ({ success: true });
export const getRoyalties = async (...args: any[]) => [];
export const processPayment = async (...args: any[]) => ({ success: true });
export const getAllPlaylists = async (...args: any[]) => [];
export const createPlaylist = async (...args: any[]) => ({ success: true });
export const updatePlaylist = async (...args: any[]) => ({ success: true });
export const deletePlaylist = async (...args: any[]) => ({ success: true });
export type SiteSettings = any;
export type Comment = any;
export type Claim = any;
export type CopyrightClaim = any;
export type Royalty = any;
export type Playlist = any;
