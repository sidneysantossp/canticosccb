// Mock implementation - Replace with real Supabase queries when backend is ready

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

// Mock database
let mockGenres: Genre[] = [
  {
    id: '1',
    name: 'Gospel',
    slug: 'gospel',
    description: 'M\u00fasica gospel e evang\u00e9lica',
    color: '#3b82f6',
    is_active: true,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Louvor',
    slug: 'louvor',
    description: 'M\u00fasicas de louvor e adora\u00e7\u00e3o',
    color: '#8b5cf6',
    is_active: true,
    created_at: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'Adoração',
    slug: 'adoracao',
    description: 'M\u00fasicas de adora\u00e7\u00e3o',
    color: '#ec4899',
    is_active: true,
    created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    name: 'Instrumental',
    slug: 'instrumental',
    description: 'M\u00fasicas instrumentais sem vocal',
    color: '#22c55e',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    name: 'Contempor\u00e2neo',
    slug: 'contemporaneo',
    description: 'M\u00fasica gospel contempor\u00e2nea',
    color: '#f59e0b',
    is_active: false,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const getAllGenres = async (): Promise<Genre[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockGenres];
};

export const getGenreById = async (id: string): Promise<Genre | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockGenres.find(g => g.id === id) || null;
};

export const createGenre = async (data: CreateGenreData): Promise<{ success: boolean; genre?: Genre }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate slug if not provided
  const slug = data.slug || data.name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  const newGenre: Genre = {
    id: String(Date.now()),
    name: data.name,
    slug: slug,
    description: data.description || '',
    color: data.color || '#3b82f6',
    is_active: data.is_active !== false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockGenres.push(newGenre);
  return { success: true, genre: newGenre };
};

export const updateGenre = async (id: string, data: Partial<Genre>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockGenres.findIndex(g => g.id === id);
  if (index !== -1) {
    mockGenres[index] = {
      ...mockGenres[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    return { success: true };
  }
  return { success: false };
};

export const deleteGenre = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockGenres.findIndex(g => g.id === id);
  if (index !== -1) {
    mockGenres.splice(index, 1);
    return { success: true };
  }
  return { success: false };
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
