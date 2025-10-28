// Mock implementation - Replace with real Supabase queries when backend is ready

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

// Mock database
let mockSongs: Song[] = [
  {
    id: '1',
    title: 'Louvai ao Senhor',
    artist: 'Compositor CCB',
    album: 'Álbum 2024',
    genre: 'Cantados',
    cover_url: '',
    audio_url: '',
    duration: '4:23',
    status: 'draft',
    is_featured: false,
    plays_count: 0,
    likes_count: 0,
    composer_name: 'João Silva',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    title: 'Glória a Deus nas Alturas',
    artist: 'Compositor CCB',
    album: 'Álbum 2024',
    genre: 'Congregação',
    cover_url: '',
    audio_url: '',
    duration: '3:45',
    status: 'draft',
    is_featured: false,
    plays_count: 0,
    likes_count: 0,
    composer_name: 'Maria Santos',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    title: 'Hosana ao Rei',
    artist: 'Compositor CCB',
    album: 'Álbum 2024',
    genre: 'Solo',
    cover_url: '',
    audio_url: '',
    duration: '5:12',
    status: 'draft',
    is_featured: false,
    plays_count: 0,
    likes_count: 0,
    composer_name: 'Pedro Oliveira',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    title: 'Aleluia, Cristo Vive',
    artist: 'Compositor CCB',
    album: 'Álbum 2024',
    genre: 'Cantados',
    cover_url: '',
    audio_url: '',
    duration: '4:56',
    status: 'published',
    is_featured: true,
    plays_count: 1500,
    likes_count: 450,
    composer_name: 'Ana Costa',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    title: 'Senhor, Meu Pastor',
    artist: 'Compositor CCB',
    genre: 'Mocidade',
    cover_url: '',
    audio_url: '',
    duration: '3:30',
    status: 'published',
    is_featured: false,
    plays_count: 890,
    likes_count: 230,
    composer_name: 'Carlos Ferreira',
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const getAllSongs = async (page: number = 1, limit: number = 20, filters: { status?: string; search?: string } = {}): Promise<{ data: Song[]; count: number; totalPages: number }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredSongs = [...mockSongs];
  
  // Filter by status
  if (filters.status) {
    filteredSongs = filteredSongs.filter(s => s.status === filters.status);
  }
  
  // Filter by search
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filteredSongs = filteredSongs.filter(s => 
      s.title.toLowerCase().includes(search) || 
      s.artist.toLowerCase().includes(search) ||
      s.composer_name?.toLowerCase().includes(search)
    );
  }
  
  const totalCount = filteredSongs.length;
  const totalPages = Math.ceil(totalCount / limit);
  const start = (page - 1) * limit;
  const paginatedSongs = filteredSongs.slice(start, start + limit);
  
  return {
    data: paginatedSongs,
    count: totalCount,
    totalPages
  };
};

export const getPendingSongs = async (): Promise<Song[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockSongs.filter(s => s.status === 'draft');
};

export const getSongById = async (id: string): Promise<Song | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockSongs.find(s => s.id === id) || null;
};

export const createSong = async (data: Partial<Song>): Promise<{ success: boolean; song?: Song }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newSong: Song = {
    id: String(Date.now()),
    title: data.title || '',
    artist: data.artist || 'Compositor CCB',
    album: data.album,
    genre: data.genre || 'Cantados',
    cover_url: data.cover_url || '',
    audio_url: data.audio_url || '',
    duration: data.duration || '0:00',
    status: data.status || 'draft',
    is_featured: false,
    plays_count: 0,
    likes_count: 0,
    composer_name: data.composer_name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockSongs.push(newSong);
  return { success: true, song: newSong };
};

export const updateSong = async (id: string, data: Partial<Song>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockSongs.findIndex(s => s.id === id);
  if (index !== -1) {
    mockSongs[index] = {
      ...mockSongs[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    return { success: true };
  }
  return { success: false };
};

export const deleteSong = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockSongs.findIndex(s => s.id === id);
  if (index !== -1) {
    mockSongs.splice(index, 1);
    return { success: true };
  }
  return { success: false };
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
