// Mock implementation - Replace with real Supabase queries when backend is ready

export interface FeaturedItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  content_type: 'song' | 'album' | 'playlist' | 'composer' | 'hymn' | 'custom';
  image_url: string;
  section: 'hero' | 'spotlight' | 'trending' | 'new' | 'recommended';
  position: number;
  priority: number;
  is_active: boolean;
  views_count: number;
  clicks_count: number;
  start_date?: string;
  end_date?: string;
  cta_text: string;
  created_at: string;
}

export interface FeaturedStats {
  total: number;
  active: number;
  totalViews: number;
  totalClicks: number;
}

// Mock database
let mockFeaturedItems: FeaturedItem[] = [
  {
    id: '1',
    title: 'Hino 5 - Chuvas de Bênçãos',
    subtitle: 'Mais Ouvido da Semana',
    description: 'Um dos hinos mais amados e cantados da CCB',
    content_type: 'hymn',
    image_url: 'https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Hino+5',
    section: 'hero',
    position: 1,
    priority: 100,
    is_active: true,
    views_count: 12547,
    clicks_count: 3421,
    cta_text: 'Ouvir Agora',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    title: 'Hino 249 - Ó Vem, Jesus',
    subtitle: 'Em Destaque',
    description: 'Hino especial para momentos de reflexão',
    content_type: 'hymn',
    image_url: 'https://via.placeholder.com/800x400/2a2a2a/ffffff?text=Hino+249',
    section: 'spotlight',
    position: 1,
    priority: 90,
    is_active: true,
    views_count: 8934,
    clicks_count: 2156,
    cta_text: 'Ver Mais',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    title: 'Hinário Completo CCB',
    subtitle: 'Nova Playlist',
    description: 'Todos os hinos organizados por número',
    content_type: 'playlist',
    image_url: 'https://via.placeholder.com/800x400/3a3a3a/ffffff?text=Playlist',
    section: 'new',
    position: 1,
    priority: 80,
    is_active: true,
    views_count: 5678,
    clicks_count: 1234,
    cta_text: 'Explorar',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    title: 'Hinos para Jovens',
    subtitle: 'Tendência',
    description: 'Seleção especial de hinos para a mocidade',
    content_type: 'playlist',
    image_url: 'https://via.placeholder.com/800x400/4a4a4a/ffffff?text=Jovens',
    section: 'trending',
    position: 1,
    priority: 75,
    is_active: false,
    views_count: 3456,
    clicks_count: 890,
    cta_text: 'Acessar',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const getFeaturedItems = async (filters?: any): Promise<FeaturedItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockFeaturedItems];
};

export const getFeaturedStats = async (): Promise<FeaturedStats> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const active = mockFeaturedItems.filter(item => item.is_active);
  const totalViews = mockFeaturedItems.reduce((sum, item) => sum + item.views_count, 0);
  const totalClicks = mockFeaturedItems.reduce((sum, item) => sum + item.clicks_count, 0);

  return {
    total: mockFeaturedItems.length,
    active: active.length,
    totalViews,
    totalClicks
  };
};

export const getById = async (id: string): Promise<FeaturedItem | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockFeaturedItems.find(item => item.id === id) || null;
};

export const create = async (data: Partial<FeaturedItem>): Promise<{ success: boolean; item?: FeaturedItem }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newItem: FeaturedItem = {
    id: String(Date.now()),
    title: data.title || '',
    subtitle: data.subtitle,
    description: data.description,
    content_type: data.content_type || 'hymn',
    image_url: data.image_url || '',
    section: data.section || 'hero',
    position: data.position || 0,
    priority: data.priority || 50,
    is_active: data.is_active ?? true,
    views_count: 0,
    clicks_count: 0,
    start_date: data.start_date,
    end_date: data.end_date,
    cta_text: data.cta_text || 'Ver Mais',
    created_at: new Date().toISOString()
  };
  mockFeaturedItems.push(newItem);
  return { success: true, item: newItem };
};

export const update = async (id: string, data: Partial<FeaturedItem>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockFeaturedItems.findIndex(item => item.id === id);
  if (index !== -1) {
    mockFeaturedItems[index] = { ...mockFeaturedItems[index], ...data };
    return { success: true };
  }
  return { success: false };
};

export const deleteItem = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockFeaturedItems.findIndex(item => item.id === id);
  if (index !== -1) {
    mockFeaturedItems.splice(index, 1);
    return { success: true };
  }
  return { success: false };
};

export const deleteFeaturedItem = async (id: string): Promise<{ success: boolean }> => {
  return deleteItem(id);
};

export const toggleFeaturedStatus = async (id: string, is_active: boolean): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockFeaturedItems.findIndex(item => item.id === id);
  if (index !== -1) {
    mockFeaturedItems[index].is_active = is_active;
    return { success: true };
  }
  return { success: false };
};

export const getAll = async (...args: any[]): Promise<FeaturedItem[]> => {
  return getFeaturedItems();
};

// Legacy exports for compatibility
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
