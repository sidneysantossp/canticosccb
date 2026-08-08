import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete } from '@/lib/supabaseRest';

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGenreData {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

const mapRow = (r: any): Genre => ({
  id: String(r.id),
  name: r.name || '',
  slug: r.slug || '',
  description: r.description || '',
  color: r.color || '#3b82f6',
  is_active: r.is_active !== false,
  created_at: r.created_at || '',
  updated_at: r.updated_at || ''
});

export const getAllGenres = async (): Promise<Genre[]> => {
  try {
    const rows = await supabaseFetch<any>('genres', { select: '*', order: 'name.asc' });
    return rows.map(mapRow);
  } catch (error) {
    console.error('[getAllGenres] Error:', error);
    return [];
  }
};

export const getGenreById = async (id: string): Promise<Genre | null> => {
  try {
    const rows = await supabaseFetch<any>('genres', { id: `eq.${id}`, select: '*', limit: '1' });
    return rows.length > 0 ? mapRow(rows[0]) : null;
  } catch (error) {
    console.error('[getGenreById] Error:', error);
    return null;
  }
};

export const createGenre = async (data: CreateGenreData): Promise<{ success: boolean; genre?: Genre }> => {
  try {
    const slug = data.slug || data.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const result = await supabaseInsert('genres', {
      name: data.name,
      slug,
      description: data.description || '',
      color: data.color || '#3b82f6',
      is_active: data.is_active !== false
    });
    return { success: true, genre: result as any };
  } catch (error) {
    console.error('[createGenre] Error:', error);
    return { success: false };
  }
};

export const updateGenre = async (id: string, data: Partial<Genre>): Promise<{ success: boolean }> => {
  try {
    await supabaseUpdate('genres', { id: `eq.${id}` }, data);
    return { success: true };
  } catch (error) {
    console.error('[updateGenre] Error:', error);
    return { success: false };
  }
};

export const deleteGenre = async (id: string): Promise<{ success: boolean }> => {
  try {
    await supabaseDelete('genres', { id: `eq.${id}` });
    return { success: true };
  } catch (error) {
    console.error('[deleteGenre] Error:', error);
    return { success: false };
  }
};

// Stubs for compatibility
export const getSiteSettings = async (..._args: any[]) => ({});
export const updateSiteSettings = async (..._args: any[]) => ({ success: true });
export const getComments = async (..._args: any[]) => [];
export const deleteComment = async (..._args: any[]) => ({ success: true });
export const approveComment = async (..._args: any[]) => ({ success: true });
export const getClaims = async (..._args: any[]) => [];
export const getCopyrightClaims = async (..._args: any[]) => [];
export const updateClaim = async (..._args: any[]) => ({ success: true });
export const getRoyalties = async (..._args: any[]) => [];
export const processPayment = async (..._args: any[]) => ({ success: true });
export const getAllPlaylists = async (..._args: any[]) => [];
export const createPlaylist = async (..._args: any[]) => ({ success: true });
export const updatePlaylist = async (..._args: any[]) => ({ success: true });
export const deletePlaylist = async (..._args: any[]) => ({ success: true });
export type SiteSettings = any;
export type Comment = any;
export type Claim = any;
export type CopyrightClaim = any;
export type Royalty = any;
export type Playlist = any;
