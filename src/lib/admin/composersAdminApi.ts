import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete, isSupabaseConfigured } from '../supabaseRest';

export interface Composer {
  id: string;
  user_id: string;
  name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  verification_status?: 'verified' | 'pending' | 'rejected';
  is_verified: boolean;
  is_featured: boolean;
  songs_count: number;
  followers_count: number;
  plays_count: number;
  created_at: string;
  approved_at?: string;
  location?: string;
}

export interface CreateComposerData {
  name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
}

const SELECT_FIELDS = 'id,user_id,name,artistic_name,email,bio,biography,avatar_url,photo_url,status,verified,is_featured,is_trending,followers_count,slug,category,created_at,updated_at';

const mapRow = (r: any): Composer => ({
  id: String(r.id),
  user_id: r.user_id || '',
  name: r.artistic_name || r.name || '',
  email: r.email || '',
  bio: r.biography || r.bio || '',
  avatar_url: r.avatar_url || r.photo_url || '',
  status: r.status || 'pending',
  verification_status: r.verified ? 'verified' : (r.status === 'rejected' ? 'rejected' : 'pending'),
  is_verified: Boolean(r.verified),
  is_featured: Boolean(r.is_featured),
  songs_count: 0,
  followers_count: r.followers_count || 0,
  plays_count: 0,
  created_at: r.created_at || new Date().toISOString(),
  approved_at: r.status === 'approved' ? (r.updated_at || r.created_at) : undefined,
  location: r.location || undefined,
});

export const getAllComposers = async (): Promise<Composer[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const rows = await supabaseFetch<any>('composers', {
      select: SELECT_FIELDS,
      order: 'created_at.desc',
    });
    return rows.map(mapRow);
  } catch (error) {
    console.error('❌ [composersAdminApi] getAllComposers error:', error);
    return [];
  }
};

export const getFeaturedComposers = async (): Promise<Composer[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const rows = await supabaseFetch<any>('composers', {
      select: SELECT_FIELDS,
      status: 'eq.approved',
      order: 'name.asc',
    });
    return rows.map(mapRow);
  } catch (error) {
    console.error('❌ [composersAdminApi] getFeaturedComposers error:', error);
    return [];
  }
};

export const getPendingComposers = async (): Promise<Composer[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const rows = await supabaseFetch<any>('composers', {
      select: SELECT_FIELDS,
      status: 'eq.pending',
      order: 'created_at.desc',
    });
    return rows.map(mapRow);
  } catch (error) {
    console.error('❌ [composersAdminApi] getPendingComposers error:', error);
    return [];
  }
};

export const getComposerById = async (id: string): Promise<Composer | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    const rows = await supabaseFetch<any>('composers', {
      id: `eq.${id}`,
      select: SELECT_FIELDS,
      limit: '1',
    });
    return rows.length > 0 ? mapRow(rows[0]) : null;
  } catch (error) {
    console.error('❌ [composersAdminApi] getComposerById error:', error);
    return null;
  }
};

export const createComposer = async (data: CreateComposerData): Promise<{ success: boolean; composer?: Composer }> => {
  if (!isSupabaseConfigured) return { success: false };
  try {
    const result = await supabaseInsert<any>('composers', {
      name: data.name,
      email: data.email,
      bio: data.bio || '',
      avatar_url: data.avatar_url || '',
      status: 'pending',
      verified: false,
      is_featured: false,
    });
    return { success: true, composer: result ? mapRow(result) : undefined };
  } catch (error) {
    console.error('❌ [composersAdminApi] createComposer error:', error);
    return { success: false };
  }
};

export const updateComposer = async (id: string, data: Partial<Composer>): Promise<{ success: boolean }> => {
  if (!isSupabaseConfigured) return { success: false };
  try {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.is_verified !== undefined) updateData.verified = data.is_verified;
    if (data.is_featured !== undefined) updateData.is_featured = data.is_featured;

    await supabaseUpdate('composers', { id: `eq.${id}` }, updateData);
    return { success: true };
  } catch (error) {
    console.error('❌ [composersAdminApi] updateComposer error:', error);
    return { success: false };
  }
};

export const deleteComposer = async (id: string): Promise<{ success: boolean }> => {
  if (!isSupabaseConfigured) return { success: false };
  try {
    await supabaseDelete('composers', { id: `eq.${id}` });
    return { success: true };
  } catch (error) {
    console.error('❌ [composersAdminApi] deleteComposer error:', error);
    return { success: false };
  }
};

export const approveComposer = async (id: string): Promise<{ success: boolean }> => {
  if (!isSupabaseConfigured) return { success: false };
  try {
    await supabaseUpdate('composers', { id: `eq.${id}` }, {
      status: 'approved',
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('❌ [composersAdminApi] approveComposer error:', error);
    return { success: false };
  }
};

export const rejectComposer = async (id: string): Promise<{ success: boolean }> => {
  if (!isSupabaseConfigured) return { success: false };
  try {
    await supabaseUpdate('composers', { id: `eq.${id}` }, {
      status: 'rejected',
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('❌ [composersAdminApi] rejectComposer error:', error);
    return { success: false };
  }
};

export const getComposers = async (filters: { search?: string; status?: string; verification?: string; location?: string } = {}): Promise<{ composers: Composer[] }> => {
  if (!isSupabaseConfigured) return { composers: [] };
  try {
    const queryFilters: Record<string, string> = {
      select: SELECT_FIELDS,
      order: 'created_at.desc',
    };

    if (filters.search) {
      queryFilters.or = `(name.ilike.%${filters.search}%,artistic_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%)`;
    }

    if (filters.status && filters.status !== 'all') {
      queryFilters.status = `eq.${filters.status}`;
    }

    if (filters.verification && filters.verification !== 'all') {
      if (filters.verification === 'verified') {
        queryFilters.verified = 'eq.true';
      } else if (filters.verification === 'pending') {
        queryFilters.status = 'eq.pending';
      } else if (filters.verification === 'rejected') {
        queryFilters.status = 'eq.rejected';
      }
    }

    const rows = await supabaseFetch<any>('composers', queryFilters);
    return { composers: rows.map(mapRow) };
  } catch (error) {
    console.error('❌ [composersAdminApi] getComposers error:', error);
    return { composers: [] };
  }
};

export const getComposerStats = async (): Promise<{ total: number; verified: number; pending: number; totalSongs: number; totalRoyalties: number }> => {
  if (!isSupabaseConfigured) return { total: 0, verified: 0, pending: 0, totalSongs: 0, totalRoyalties: 0 };
  try {
    const allRows = await supabaseFetch<any>('composers', { select: 'id,status,verified' });
    return {
      total: allRows.length,
      verified: allRows.filter((r: any) => r.verified === true).length,
      pending: allRows.filter((r: any) => r.status === 'pending').length,
      totalSongs: 0,
      totalRoyalties: 0,
    };
  } catch (error) {
    console.error('❌ [composersAdminApi] getComposerStats error:', error);
    return { total: 0, verified: 0, pending: 0, totalSongs: 0, totalRoyalties: 0 };
  }
};

export const verifyComposers = async (ids: string[]): Promise<{ success: boolean }> => {
  if (!isSupabaseConfigured) return { success: false };
  try {
    for (const id of ids) {
      await supabaseUpdate('composers', { id: `eq.${id}` }, { verified: true, status: 'approved', updated_at: new Date().toISOString() });
    }
    return { success: true };
  } catch (error) {
    console.error('❌ [composersAdminApi] verifyComposers error:', error);
    return { success: false };
  }
};

export const rejectComposers = async (ids: string[]): Promise<{ success: boolean }> => {
  if (!isSupabaseConfigured) return { success: false };
  try {
    for (const id of ids) {
      await supabaseUpdate('composers', { id: `eq.${id}` }, { status: 'rejected', updated_at: new Date().toISOString() });
    }
    return { success: true };
  } catch (error) {
    console.error('❌ [composersAdminApi] rejectComposers error:', error);
    return { success: false };
  }
};

export const deleteComposers = async (ids: string[]): Promise<{ success: boolean }> => {
  if (!isSupabaseConfigured) return { success: false };
  try {
    for (const id of ids) {
      await supabaseDelete('composers', { id: `eq.${id}` });
    }
    return { success: true };
  } catch (error) {
    console.error('❌ [composersAdminApi] deleteComposers error:', error);
    return { success: false };
  }
};

export const updateComposersStatus = async (ids: string[], status: 'pending' | 'approved' | 'rejected'): Promise<{ success: boolean }> => {
  if (!isSupabaseConfigured) return { success: false };
  try {
    for (const id of ids) {
      await supabaseUpdate('composers', { id: `eq.${id}` }, { status, updated_at: new Date().toISOString() });
    }
    return { success: true };
  } catch (error) {
    console.error('❌ [composersAdminApi] updateComposersStatus error:', error);
    return { success: false };
  }
};

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
