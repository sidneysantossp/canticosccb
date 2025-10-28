// Mock implementation - Replace with real Supabase queries when backend is ready

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

// Mock database
let mockComposers: Composer[] = [
  {
    id: '1',
    user_id: 'u1',
    name: 'João Silva',
    email: 'joao.silva@compositor.com',
    bio: 'Compositor de hinos há 15 anos, focado em músicas de adoração',
    avatar_url: '',
    status: 'approved',
    verification_status: 'verified',
    is_verified: true,
    is_featured: true,
    songs_count: 45,
    followers_count: 2340,
    plays_count: 125000,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    approved_at: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'São Paulo, SP'
  },
  {
    id: '2',
    user_id: 'u2',
    name: 'Maria Santos',
    email: 'maria.santos@compositor.com',
    bio: 'Compositora dedicada a hinos devocionais e de louvor',
    avatar_url: '',
    status: 'approved',
    verification_status: 'verified',
    is_verified: true,
    is_featured: true,
    songs_count: 32,
    followers_count: 1850,
    plays_count: 98000,
    created_at: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
    approved_at: new Date(Date.now() - 290 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Rio de Janeiro, RJ'
  },
  {
    id: '3',
    user_id: 'u3',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@compositor.com',
    bio: 'Especialista em hinos clássicos e arranjos tradicionais',
    avatar_url: '',
    status: 'approved',
    verification_status: 'pending',
    is_verified: false,
    is_featured: false,
    songs_count: 18,
    followers_count: 890,
    plays_count: 42000,
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    approved_at: new Date(Date.now() - 170 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Belo Horizonte, MG'
  },
  {
    id: '4',
    user_id: 'u4',
    name: 'Ana Costa',
    email: 'ana.costa@compositor.com',
    bio: 'Compositora iniciante com foco em hinos para jovens',
    avatar_url: '',
    status: 'pending',
    verification_status: 'pending',
    is_verified: false,
    is_featured: false,
    songs_count: 5,
    followers_count: 120,
    plays_count: 3200,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Curitiba, PR'
  },
  {
    id: '5',
    user_id: 'u5',
    name: 'Carlos Ferreira',
    email: 'carlos.ferreira@compositor.com',
    bio: 'Compositor de hinos infantis e educativos',
    avatar_url: '',
    status: 'pending',
    verification_status: 'pending',
    is_verified: false,
    is_featured: false,
    songs_count: 8,
    followers_count: 250,
    plays_count: 5800,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Salvador, BA'
  },
  {
    id: '6',
    user_id: 'u6',
    name: 'Lucia Mendes',
    email: 'lucia.mendes@compositor.com',
    bio: 'Rejeitada por não atender aos critérios',
    avatar_url: '',
    status: 'rejected',
    verification_status: 'rejected',
    is_verified: false,
    is_featured: false,
    songs_count: 2,
    followers_count: 45,
    plays_count: 890,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Porto Alegre, RS'
  }
];

export const getAllComposers = async (): Promise<Composer[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockComposers];
};

export const getFeaturedComposers = async (): Promise<Composer[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockComposers.filter(c => c.is_featured && c.status === 'approved');
};

export const getPendingComposers = async (): Promise<Composer[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockComposers.filter(c => c.status === 'pending');
};

export const getComposerById = async (id: string): Promise<Composer | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockComposers.find(c => c.id === id) || null;
};

export const createComposer = async (data: CreateComposerData): Promise<{ success: boolean; composer?: Composer }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newComposer: Composer = {
    id: String(Date.now()),
    user_id: String(Date.now() + 1),
    name: data.name,
    email: data.email,
    bio: data.bio,
    avatar_url: data.avatar_url,
    status: 'pending',
    is_verified: false,
    is_featured: false,
    songs_count: 0,
    followers_count: 0,
    plays_count: 0,
    created_at: new Date().toISOString()
  };
  mockComposers.unshift(newComposer);
  return { success: true, composer: newComposer };
};

export const updateComposer = async (id: string, data: Partial<Composer>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockComposers.findIndex(c => c.id === id);
  if (index !== -1) {
    mockComposers[index] = {
      ...mockComposers[index],
      ...data
    };
    return { success: true };
  }
  return { success: false };
};

export const deleteComposer = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockComposers.findIndex(c => c.id === id);
  if (index !== -1) {
    mockComposers.splice(index, 1);
    return { success: true };
  }
  return { success: false };
};

export const approveComposer = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockComposers.findIndex(c => c.id === id);
  if (index !== -1) {
    mockComposers[index].status = 'approved';
    mockComposers[index].approved_at = new Date().toISOString();
    return { success: true };
  }
  return { success: false };
};

export const rejectComposer = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockComposers.findIndex(c => c.id === id);
  if (index !== -1) {
    mockComposers[index].status = 'rejected';
    return { success: true };
  }
  return { success: false };
};

// Additional functions for AdminSettingsComposers
export const getComposers = async (filters: { search?: string; status?: string; verification?: string; location?: string } = {}): Promise<{ composers: Composer[] }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  let filtered = [...mockComposers];
  
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search)
    );
  }
  
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(c => c.status === filters.status);
  }
  
  if (filters.verification && filters.verification !== 'all') {
    if (filters.verification === 'verified') {
      filtered = filtered.filter(c => c.is_verified);
    } else if (filters.verification === 'pending') {
      filtered = filtered.filter(c => c.status === 'pending');
    } else if (filters.verification === 'rejected') {
      filtered = filtered.filter(c => c.status === 'rejected');
    }
  }
  
  if (filters.location && filters.location !== 'all') {
    filtered = filtered.filter(c => c.location === filters.location);
  }
  
  return { composers: filtered };
};

export const getComposerStats = async (): Promise<{ total: number; verified: number; pending: number; totalSongs: number; totalRoyalties: number }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    total: mockComposers.length,
    verified: mockComposers.filter(c => c.is_verified).length,
    pending: mockComposers.filter(c => c.status === 'pending').length,
    totalSongs: mockComposers.reduce((sum, c) => sum + c.songs_count, 0),
    totalRoyalties: mockComposers.reduce((sum, c) => sum + c.plays_count * 0.01, 0)
  };
};

export const verifyComposers = async (ids: string[]): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  ids.forEach(id => {
    const composer = mockComposers.find(c => c.id === id);
    if (composer) {
      composer.is_verified = true;
      composer.status = 'approved';
    }
  });
  return { success: true };
};

export const rejectComposers = async (ids: string[]): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  ids.forEach(id => {
    const composer = mockComposers.find(c => c.id === id);
    if (composer) {
      composer.status = 'rejected';
    }
  });
  return { success: true };
};

export const deleteComposers = async (ids: string[]): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  mockComposers = mockComposers.filter(c => !ids.includes(c.id));
  return { success: true };
};

export const updateComposersStatus = async (ids: string[], status: 'pending' | 'approved' | 'rejected'): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  ids.forEach(id => {
    const composer = mockComposers.find(c => c.id === id);
    if (composer) {
      composer.status = status;
    }
  });
  return { success: true };
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
