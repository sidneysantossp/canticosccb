// Mock implementation - Replace with real Supabase queries when backend is ready

export interface Collection {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  is_published: boolean;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  cover_url?: string;
  is_published?: boolean;
}

// Mock database
let mockCollections: Collection[] = [
  {
    id: '1',
    name: 'Hinos Mais Tocados 2024',
    description: 'Os hinos mais ouvidos da Congregação Cristã em 2024',
    cover_url: '',
    is_published: true,
    items_count: 25,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Hinos da Mocidade',
    description: 'Seleção especial de hinos para os jovens',
    cover_url: '',
    is_published: true,
    items_count: 18,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'Hinos Clássicos',
    description: 'Os hinos tradicionais mais amados',
    cover_url: '',
    is_published: true,
    items_count: 30,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    name: 'Hinos de Natal',
    description: 'Coleção especial para o período natalino',
    cover_url: '',
    is_published: false,
    items_count: 12,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    name: 'Hinos Solo',
    description: 'Melhores solos instrumentais',
    cover_url: '',
    is_published: true,
    items_count: 15,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const getAllCollections = async (page: number = 1, limit: number = 20): Promise<{ data: Collection[]; count: number; totalPages: number }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const totalCount = mockCollections.length;
  const totalPages = Math.ceil(totalCount / limit);
  const start = (page - 1) * limit;
  const paginatedCollections = mockCollections.slice(start, start + limit);
  
  return {
    data: paginatedCollections,
    count: totalCount,
    totalPages
  };
};

export const getAll = getAllCollections;

export const getById = async (id: string): Promise<Collection | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockCollections.find(c => c.id === id) || null;
};

export const createCollection = async (data: CreateCollectionData): Promise<{ success: boolean; collection?: Collection }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newCollection: Collection = {
    id: String(Date.now()),
    name: data.name,
    description: data.description || '',
    cover_url: data.cover_url || '',
    is_published: data.is_published || false,
    items_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockCollections.unshift(newCollection);
  return { success: true, collection: newCollection };
};

export const create = createCollection;

export const updateCollection = async (id: string, data: Partial<Collection>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockCollections.findIndex(c => c.id === id);
  if (index !== -1) {
    mockCollections[index] = {
      ...mockCollections[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    return { success: true };
  }
  return { success: false };
};

export const update = updateCollection;

export const deleteCollection = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockCollections.findIndex(c => c.id === id);
  if (index !== -1) {
    mockCollections.splice(index, 1);
    return { success: true };
  }
  return { success: false };
};

export const deleteItem = deleteCollection;

export const toggleCollectionPublished = async (id: string, published: boolean): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockCollections.findIndex(c => c.id === id);
  if (index !== -1) {
    mockCollections[index].is_published = published;
    mockCollections[index].updated_at = new Date().toISOString();
    return { success: true };
  }
  return { success: false };
};

export const toggleCollectionActive = toggleCollectionPublished;

export const uploadCollectionCover = async (file: File): Promise<{ success: boolean; url: string }> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  // Mock upload - return a placeholder URL
  const mockUrl = `https://picsum.photos/seed/${Date.now()}/800/400`;
  return { success: true, url: mockUrl };
};

export const uploadCollectionImage = uploadCollectionCover;
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
