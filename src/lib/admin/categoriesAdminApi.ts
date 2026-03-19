import { categoriasApi } from '@/lib/api-client';

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

const mapCategory = (category: any): Category => ({
  id: String(category.id),
  name: category.nome || category.name || '',
  slug: category.slug || '',
  description: category.descricao || category.description || '',
  icon: category.icon || '📁',
  color: category.cor || category.color || '#22c55e',
  background_color: category.background_color || category.cor || category.color || '#166534',
  image_url: category.imagem_url || category.image_url || '',
  is_active: category.ativo === undefined ? category.is_active !== false : category.ativo === 1 || category.ativo === true,
  display_order: Number(category.display_order || 0),
  created_at: category.created_at || '',
  updated_at: category.updated_at || '',
});

export const getAllCategories = async (): Promise<Category[]> => {
  const response = await categoriasApi.list({ limit: 1000 });
  if (response.error) {
    throw new Error(response.error);
  }

  return (Array.isArray(response.data) ? response.data : []).map(mapCategory);
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
  const response = await categoriasApi.get(id);
  if (response.error) {
    throw new Error(response.error);
  }

  return response.data ? mapCategory(response.data) : null;
};

export const createCategory = async (data: CreateCategoryData): Promise<{ success: boolean; category?: Category }> => {
  const response = await categoriasApi.create({
    nome: data.name,
    slug: data.slug,
    descricao: data.description,
    imagem_url: data.image_url,
    ativo: data.is_active === false ? 0 : 1,
    cor: data.color,
  });

  if (response.error) {
    return { success: false };
  }

  return { success: true, category: response.data ? mapCategory(response.data) : undefined };
};

export const updateCategory = async (id: string, data: Partial<Category>): Promise<{ success: boolean }> => {
  const response = await categoriasApi.update(id, {
    nome: data.name,
    slug: data.slug,
    descricao: data.description,
    imagem_url: data.image_url,
    ativo: data.is_active === undefined ? undefined : data.is_active ? 1 : 0,
    cor: data.color,
  });

  return { success: !response.error };
};

export const deleteCategory = async (id: string): Promise<{ success: boolean }> => {
  const response = await categoriasApi.delete(id);
  return { success: response.success === true };
};
