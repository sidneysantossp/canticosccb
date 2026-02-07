// Mock implementation - Replace with real Supabase queries when backend is ready

export interface EditorialPlaylist {
  id: string;
  title: string;
  description: string;
  category: string;
  mood?: string;
  curator_name: string;
  cover_url: string;
  is_featured: boolean;
  is_active: boolean;
  plays_count: number;
  likes_count: number;
  followers_count: number;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlaylistData {
  title: string;
  description?: string;
  category: string;
  mood?: string;
  curator_name?: string;
  cover_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
}

export type Playlist = EditorialPlaylist;

// Mock data removed - using Supabase real data

export const getAll = async (): Promise<EditorialPlaylist[]> => {
  try {
    const { supabaseFetch } = await import('@/lib/supabaseRest');
    console.log('🔍 [playlistsAdminApi] Fetching playlists from Supabase...');
    
    const rows = await supabaseFetch<any>('playlists', {
      select: '*',
      order: 'created_at.desc'
    });
    
    console.log(`✅ [playlistsAdminApi] Found ${rows.length} playlists`);
    
    // Map Supabase data to EditorialPlaylist interface
    const playlists: EditorialPlaylist[] = rows.map(row => ({
      id: String(row.id),
      title: row.titulo || row.title || '',
      description: row.descricao || row.description || '',
      category: row.categoria || row.category || 'general',
      mood: row.mood || undefined,
      curator_name: row.curator_name || 'Equipe Editorial CCB',
      cover_url: row.cover_url || row.imagem_url || '',
      is_featured: row.is_featured || row.destaque || false,
      is_active: row.is_active != null ? row.is_active : (row.ativo != null ? row.ativo === 1 : true),
      plays_count: row.plays_count || row.total_plays || 0,
      likes_count: row.likes_count || row.total_likes || 0,
      followers_count: row.followers_count || row.total_followers || 0,
      items_count: row.items_count || row.total_items || 0,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || row.created_at || new Date().toISOString()
    }));
    
    return playlists;
  } catch (error) {
    console.error('❌ [playlistsAdminApi] Error fetching playlists:', error);
    return [];
  }
};

export const getAllPlaylists = getAll;

export const getById = async (id: string): Promise<EditorialPlaylist | null> => {
  try {
    const { supabaseFetch } = await import('@/lib/supabaseRest');
    const rows = await supabaseFetch<any>('playlists', {
      id: `eq.${id}`,
      select: '*',
      limit: '1'
    });
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: String(row.id),
      title: row.titulo || row.title || '',
      description: row.descricao || row.description || '',
      category: row.categoria || row.category || 'general',
      mood: row.mood || undefined,
      curator_name: row.curator_name || 'Equipe Editorial CCB',
      cover_url: row.cover_url || row.imagem_url || '',
      is_featured: row.is_featured || row.destaque || false,
      is_active: row.is_active != null ? row.is_active : (row.ativo != null ? row.ativo === 1 : true),
      plays_count: row.plays_count || row.total_plays || 0,
      likes_count: row.likes_count || row.total_likes || 0,
      followers_count: row.followers_count || row.total_followers || 0,
      items_count: row.items_count || row.total_items || 0,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || row.created_at || new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ [playlistsAdminApi.getById] Error:', error);
    return null;
  }
};

export const create = async (data: CreatePlaylistData): Promise<{ success: boolean; playlist?: EditorialPlaylist }> => {
  try {
    const { supabaseInsert } = await import('@/lib/supabaseRest');
    
    const insertData = {
      titulo: data.title,
      descricao: data.description || '',
      categoria: data.category,
      mood: data.mood,
      curator_name: data.curator_name || 'Equipe Editorial CCB',
      cover_url: data.cover_url || '',
      is_featured: data.is_featured || false,
      is_active: data.is_active !== false,
      plays_count: 0,
      likes_count: 0,
      followers_count: 0,
      items_count: 0
    };
    
    const result = await supabaseInsert('playlists', insertData) as any;
    
    const newPlaylist: EditorialPlaylist = {
      id: String(result.id || result[0]?.id),
      title: data.title,
      description: data.description || '',
      category: data.category,
      mood: data.mood,
      curator_name: data.curator_name || 'Equipe Editorial CCB',
      cover_url: data.cover_url || '',
      is_featured: data.is_featured || false,
      is_active: data.is_active !== false,
      plays_count: 0,
      likes_count: 0,
      followers_count: 0,
      items_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return { success: true, playlist: newPlaylist };
  } catch (error) {
    console.error('❌ [playlistsAdminApi.create] Error:', error);
    return { success: false };
  }
};

export const createPlaylist = create;

export const update = async (id: string, data: Partial<EditorialPlaylist>): Promise<{ success: boolean }> => {
  try {
    const { supabaseUpdate } = await import('@/lib/supabaseRest');
    
    const updateData: any = {};
    if (data.title !== undefined) updateData.titulo = data.title;
    if (data.description !== undefined) updateData.descricao = data.description;
    if (data.category !== undefined) updateData.categoria = data.category;
    if (data.mood !== undefined) updateData.mood = data.mood;
    if (data.curator_name !== undefined) updateData.curator_name = data.curator_name;
    if (data.cover_url !== undefined) updateData.cover_url = data.cover_url;
    if (data.is_featured !== undefined) updateData.is_featured = data.is_featured;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    
    updateData.updated_at = new Date().toISOString();
    
    await supabaseUpdate('playlists', { id: `eq.${id}` }, updateData);
    return { success: true };
  } catch (error) {
    console.error('❌ [playlistsAdminApi.update] Error:', error);
    return { success: false };
  }
};

export const updatePlaylist = update;

export const deleteItem = async (id: string): Promise<{ success: boolean }> => {
  try {
    const { supabaseDelete } = await import('@/lib/supabaseRest');
    await supabaseDelete('playlists', { id: `eq.${id}` });
    return { success: true };
  } catch (error) {
    console.error('❌ [playlistsAdminApi.deleteItem] Error:', error);
    return { success: false };
  }
};

export const deletePlaylist = deleteItem;
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
export type SiteSettings = any;
export type Comment = any;
export type Claim = any;
export type CopyrightClaim = any;
export type Royalty = any;
