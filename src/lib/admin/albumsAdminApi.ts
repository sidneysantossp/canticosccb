// Mock implementation - Replace with real Supabase queries when backend is ready

export interface Album {
  id: string;
  title: string;
  artist: string;
  description?: string;
  genre: string;
  cover_url: string;
  total_tracks: number;
  release_date: string;
  status: 'published' | 'draft';
  composer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAlbumData {
  title: string;
  artist: string;
  description?: string;
  genre: string;
  cover_url?: string;
  total_tracks?: number;
  release_date?: string;
  status?: 'published' | 'draft';
}

// Mock database
let mockAlbums: Album[] = [
  {
    id: '1',
    title: 'Hinos da Congregação 2024',
    artist: 'Congregação Cristã',
    description: 'Coletânea de hinos cantados em 2024',
    genre: 'Cantados',
    cover_url: '',
    total_tracks: 12,
    release_date: '2024-01-15',
    status: 'published',
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    title: 'Louvores da Mocidade',
    artist: 'Mocidade CCB',
    description: 'Músicas especiais para a mocidade',
    genre: 'Mocidade',
    cover_url: '',
    total_tracks: 8,
    release_date: '2024-03-20',
    status: 'published',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    title: 'Hinos Clássicos',
    artist: 'Congregação Cristã',
    description: 'Os hinos mais tradicionais da CCB',
    genre: 'Cantados',
    cover_url: '',
    total_tracks: 15,
    release_date: '2023-11-10',
    status: 'published',
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    title: 'Novos Louvores 2024',
    artist: 'Diversos Compositores',
    description: 'Compilação de novas músicas',
    genre: 'Solo',
    cover_url: '',
    total_tracks: 10,
    release_date: '2024-06-01',
    status: 'draft',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const getAllAlbums = async (page: number = 1, limit: number = 12): Promise<{ data: Album[]; count: number; totalPages: number }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const totalCount = mockAlbums.length;
  const totalPages = Math.ceil(totalCount / limit);
  const start = (page - 1) * limit;
  const paginatedAlbums = mockAlbums.slice(start, start + limit);
  
  return {
    data: paginatedAlbums,
    count: totalCount,
    totalPages
  };
};

export const getAll = getAllAlbums;

export const getById = async (id: string): Promise<Album | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockAlbums.find(a => a.id === id) || null;
};

export const createAlbum = async (data: CreateAlbumData): Promise<{ success: boolean; album?: Album }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newAlbum: Album = {
    id: String(Date.now()),
    title: data.title,
    artist: data.artist,
    description: data.description,
    genre: data.genre,
    cover_url: data.cover_url || '',
    total_tracks: data.total_tracks || 0,
    release_date: data.release_date || new Date().toISOString().split('T')[0],
    status: data.status || 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockAlbums.unshift(newAlbum);
  return { success: true, album: newAlbum };
};

export const create = createAlbum;

export const updateAlbum = async (id: string, data: Partial<Album>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockAlbums.findIndex(a => a.id === id);
  if (index !== -1) {
    mockAlbums[index] = {
      ...mockAlbums[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    return { success: true };
  }
  return { success: false };
};

export const update = updateAlbum;

export const deleteAlbum = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockAlbums.findIndex(a => a.id === id);
  if (index !== -1) {
    mockAlbums.splice(index, 1);
    return { success: true };
  }
  return { success: false };
};

export const deleteItem = deleteAlbum;
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
