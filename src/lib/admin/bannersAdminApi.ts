import { apiFetch } from '@/lib/api-helper';

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
  const qs = new URLSearchParams();
  if (params?.type) qs.append('type', params.type);
  if (typeof params?.active === 'boolean') qs.append('active', params.active ? '1' : '0');
  const url = `/api/banners/index.php${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await apiFetch(url);
  const data = await res.json();
  return data?.banners ?? [];
};

export const getBannerById = async (id: string): Promise<Banner | null> => {
  const res = await apiFetch(`/api/banners/index.php?id=${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  return await res.json();
};

export const createBanner = async (data: CreateBannerData): Promise<Banner> => {
  const res = await apiFetch('/api/banners/index.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return json as Banner;
};

export const updateBanner = async (id: string, data: Partial<CreateBannerData>): Promise<Banner> => {
  const res = await apiFetch(`/api/banners/index.php?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return json as Banner;
};

export const deleteBanner = async (id: string): Promise<{ success: boolean }> => {
  const res = await apiFetch(`/api/banners/index.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  return await res.json();
};

export const toggleBannerActive = async (id: string, newStatus: boolean): Promise<Banner> => {
  return updateBanner(id, { is_active: newStatus } as any);
};

export const uploadBannerImage = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append('file', file);
  const res = await apiFetch('/api/banners/upload.php', { method: 'POST', body: form });
  const json = await res.json();
  return json?.url as string;
};

export const getAll = getAllBanners;
export const getById = getBannerById;
export const create = createBanner;
export const update = updateBanner;
export const deleteItem = deleteBanner;

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
