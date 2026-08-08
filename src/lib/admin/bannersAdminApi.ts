import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete, isSupabaseConfigured, invalidateSupabaseCache } from '@/lib/supabaseRest';
import { uploadFile } from '@/lib/supabase-upload';

export type BannerType = 'hero' | 'promotional' | 'contextual' | 'announcement' | 'featured';

export interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  link_type?: string;
  link_id?: string;
  type: BannerType;
  position: number;
  is_active: boolean;
  gradient_overlay?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBannerData {
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  link_type?: string;
  link_id?: string;
  type: BannerType;
  position: number;
  is_active: boolean;
  gradient_overlay?: string;
}

export const getAllBanners = async (params?: { type?: BannerType; active?: boolean }): Promise<Banner[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const filters: Record<string, string> = {
      select: '*',
      order: 'position.asc'
    };
    
    if (params?.type) filters.type = `eq.${params.type}`;
    if (typeof params?.active === 'boolean') filters.is_active = `eq.${params.active}`;
    
    const rows = await supabaseFetch<any>('banners', filters);
    console.log('🎯 [bannersAdminApi] Raw rows from Supabase:', rows.length, rows);
    return rows.map((row: any) => ({
      id: String(row.id),
      title: row.title || '',
      description: row.description || '',
      image_url: row.image_url || '',
      link_url: row.link_url || '',
      link_type: row.link_type || row.type || '',
      link_id: row.link_id ? String(row.link_id) : '',
      type: row.type || 'hero',
      position: row.position ?? 0,
      is_active: row.is_active ?? true,
      gradient_overlay: row.gradient_overlay || '',
      created_at: row.created_at || '',
      updated_at: row.updated_at || '',
    }));
  } catch (error) {
    console.error('❌ Error fetching banners:', error);
    return [];
  }
};

export const getBannerById = async (id: string): Promise<Banner | null> => {
  if (!isSupabaseConfigured) return null;

  try {
    const rows = await supabaseFetch<any>('banners', { id: `eq.${id}` });
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: String(row.id),
      title: row.title,
      description: row.description,
      image_url: row.image_url,
      link_url: row.link_url,
      link_type: row.link_type,
      link_id: row.link_id,
      type: row.type,
      position: row.position,
      is_active: row.is_active,
      gradient_overlay: row.gradient_overlay,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch (error) {
    console.error('Error fetching banner:', error);
    return null;
  }
};

export const createBanner = async (data: CreateBannerData): Promise<Banner> => {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const result = await supabaseInsert<any>('banners', data);
  if (!result) throw new Error('Failed to create banner');
  invalidateSupabaseCache('banners');
  return result as Banner;
};

export const updateBanner = async (id: string, data: Partial<CreateBannerData>): Promise<Banner> => {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');

  const results = await supabaseUpdate<any>('banners', { id: `eq.${id}` }, data);
  if (results.length === 0) throw new Error('Failed to update banner');
  invalidateSupabaseCache('banners');
  return results[0] as Banner;
};

export const deleteBanner = async (id: string): Promise<{ success: boolean }> => {
  if (!isSupabaseConfigured) return { success: false };

  const success = await supabaseDelete('banners', { id: `eq.${id}` });
  if (success) invalidateSupabaseCache('banners');
  return { success };
};

export const toggleBannerActive = async (id: string, newStatus: boolean): Promise<Banner> => {
  return updateBanner(id, { is_active: newStatus } as any);
};

export const uploadBannerImage = async (file: File): Promise<string> => {
  return uploadFile(file, 'banners');
};

export const getAll = getAllBanners;
export const getById = getBannerById;
export const create = createBanner;
export const update = updateBanner;
export const deleteItem = deleteBanner;

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
