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

// Mock database
let mockPlaylists: EditorialPlaylist[] = [
  {
    id: '1',
    title: 'Hinos de Adoração',
    description: 'Os melhores hinos para momentos de adoração',
    category: 'worship',
    mood: 'Contemplativo',
    curator_name: 'Equipe Editorial CCB',
    cover_url: '',
    is_featured: true,
    is_active: true,
    plays_count: 15420,
    likes_count: 850,
    followers_count: 1200,
    items_count: 25,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    title: 'Devocional Matinal',
    description: 'Hinos para começar o dia com Deus',
    category: 'devotional',
    mood: 'Inspirador',
    curator_name: 'Equipe Editorial CCB',
    cover_url: '',
    is_featured: true,
    is_active: true,
    plays_count: 8900,
    likes_count: 520,
    followers_count: 890,
    items_count: 18,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    title: 'Hinos da Mocidade',
    description: 'Seleção especial para os jovens da CCB',
    category: 'youth',
    mood: 'Energético',
    curator_name: 'Equipe Editorial CCB',
    cover_url: '',
    is_featured: false,
    is_active: true,
    plays_count: 12350,
    likes_count: 720,
    followers_count: 1450,
    items_count: 30,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    title: 'Hinos Clássicos',
    description: 'Os hinos mais tradicionais da congregação',
    category: 'classic',
    mood: 'Tradicional',
    curator_name: 'Equipe Editorial CCB',
    cover_url: '',
    is_featured: false,
    is_active: true,
    plays_count: 20100,
    likes_count: 1100,
    followers_count: 2300,
    items_count: 40,
    created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    title: 'Infantil - Louvorzinho',
    description: 'Hinos para as crianças aprenderem',
    category: 'children',
    mood: 'Alegre',
    curator_name: 'Equipe Editorial CCB',
    cover_url: '',
    is_featured: false,
    is_active: false,
    plays_count: 3200,
    likes_count: 180,
    followers_count: 420,
    items_count: 15,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const getAll = async (): Promise<EditorialPlaylist[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockPlaylists];
};

export const getAllPlaylists = getAll;

export const getById = async (id: string): Promise<EditorialPlaylist | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockPlaylists.find(p => p.id === id) || null;
};

export const create = async (data: CreatePlaylistData): Promise<{ success: boolean; playlist?: EditorialPlaylist }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newPlaylist: EditorialPlaylist = {
    id: String(Date.now()),
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
  mockPlaylists.unshift(newPlaylist);
  return { success: true, playlist: newPlaylist };
};

export const createPlaylist = create;

export const update = async (id: string, data: Partial<EditorialPlaylist>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockPlaylists.findIndex(p => p.id === id);
  if (index !== -1) {
    mockPlaylists[index] = {
      ...mockPlaylists[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    return { success: true };
  }
  return { success: false };
};

export const updatePlaylist = update;

export const deleteItem = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockPlaylists.findIndex(p => p.id === id);
  if (index !== -1) {
    mockPlaylists.splice(index, 1);
    return { success: true };
  }
  return { success: false };
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
