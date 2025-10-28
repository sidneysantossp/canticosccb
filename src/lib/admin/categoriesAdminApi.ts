// Mock implementation - Replace with real Supabase queries when backend is ready

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  background_color: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  background_color?: string;
  image_url?: string;
  is_active?: boolean;
  display_order?: number;
}

// Mock database
let mockCategories: Category[] = [
  {
    id: '1',
    name: 'Hinos Cantados',
    slug: 'hinos-cantados',
    description: 'Hinos tradicionais cantados pela congregação',
    icon: '🎵',
    color: '#3b82f6',
    background_color: '#1e3a8a',
    image_url: '',
    is_active: true,
    display_order: 1,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Solo',
    slug: 'solo',
    description: 'Hinos tocados em solo instrumental',
    icon: '🎹',
    color: '#8b5cf6',
    background_color: '#5b21b6',
    image_url: '',
    is_active: true,
    display_order: 2,
    created_at: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'Mocidade',
    slug: 'mocidade',
    description: 'Hinos especiais para a juventude',
    icon: '🎆',
    color: '#22c55e',
    background_color: '#166534',
    image_url: '',
    is_active: true,
    display_order: 3,
    created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    name: 'Congregação',
    slug: 'congregacao',
    description: 'Hinos gerais da congregação',
    icon: '⛪',
    color: '#f59e0b',
    background_color: '#b45309',
    image_url: '',
    is_active: true,
    display_order: 4,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    name: 'Crianças',
    slug: 'criancas',
    description: 'Hinos para as crianças',
    icon: '👶',
    color: '#ec4899',
    background_color: '#be185d',
    image_url: '',
    is_active: false,
    display_order: 5,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const getAllCategories = async (): Promise<Category[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockCategories].sort((a, b) => a.display_order - b.display_order);
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockCategories.find(c => c.id === id) || null;
};

export const createCategory = async (data: CreateCategoryData): Promise<{ success: boolean; category?: Category }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newCategory: Category = {
    id: String(Date.now()),
    name: data.name,
    slug: data.slug,
    description: data.description || '',
    icon: data.icon || '📁',
    color: data.color || '#3b82f6',
    background_color: data.background_color || '#1e3a8a',
    image_url: data.image_url || '',
    is_active: data.is_active !== false,
    display_order: data.display_order || mockCategories.length + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockCategories.push(newCategory);
  return { success: true, category: newCategory };
};

export const updateCategory = async (id: string, data: Partial<Category>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockCategories.findIndex(c => c.id === id);
  if (index !== -1) {
    mockCategories[index] = {
      ...mockCategories[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    return { success: true };
  }
  return { success: false };
};

export const deleteCategory = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockCategories.findIndex(c => c.id === id);
  if (index !== -1) {
    mockCategories.splice(index, 1);
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
