import { albunsApi, uploadApi } from '@/lib/api-client';

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

const mapCollection = (collection: any): Collection => ({
  id: String(collection.id),
  name: collection.title || collection.titulo || collection.name || '',
  description: collection.description || collection.descricao || '',
  cover_url: collection.cover_url || '',
  is_published: collection.is_published !== false && collection.status !== 'draft',
  items_count: Number(collection.total_tracks || 0),
  created_at: collection.created_at || '',
  updated_at: collection.updated_at || '',
});

export const getAllCollections = async (page: number = 1, limit: number = 20): Promise<{ data: Collection[]; count: number; totalPages: number }> => {
  const response = await albunsApi.list({ page, limit, tipo: 'coletanea' });

  if (response.error) {
    throw new Error(response.error);
  }

  const collections = (response.data?.albuns || []).map(mapCollection);
  return {
    data: collections,
    count: response.data?.total || collections.length,
    totalPages: response.data?.pages || 1,
  };
};

export const getAll = getAllCollections;

export const getById = async (id: string): Promise<Collection | null> => {
  const response = await albunsApi.get(id);
  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data || response.data.tipo !== 'coletanea') {
    return null;
  }

  return mapCollection(response.data);
};

export const createCollection = async (data: CreateCollectionData): Promise<{ success: boolean; collection?: Collection }> => {
  const response = await albunsApi.create({
    titulo: data.name,
    descricao: data.description,
    cover_url: data.cover_url,
    tipo: 'coletanea',
    is_published: data.is_published !== false,
    ativo: data.is_published === false ? 0 : 1,
  });

  if (response.error) {
    return { success: false };
  }

  return { success: true, collection: response.data ? mapCollection(response.data) : undefined };
};

export const create = createCollection;

export const updateCollection = async (id: string, data: Partial<Collection>): Promise<{ success: boolean }> => {
  const response = await albunsApi.update(id, {
    title: data.name,
    description: data.description,
    cover_url: data.cover_url,
    tipo: 'coletanea',
    is_published: data.is_published,
    ativo: data.is_published === undefined ? undefined : data.is_published ? 1 : 0,
  });

  return { success: !response.error };
};

export const update = updateCollection;

export const deleteCollection = async (id: string): Promise<{ success: boolean }> => {
  await albunsApi.delete(id);
  return { success: true };
};

export const deleteItem = deleteCollection;

export const toggleCollectionPublished = async (id: string, published: boolean): Promise<{ success: boolean }> => {
  const response = await albunsApi.update(id, {
    tipo: 'coletanea',
    is_published: published,
    ativo: published ? 1 : 0,
  });

  return { success: !response.error };
};

export const toggleCollectionActive = toggleCollectionPublished;

export const uploadCollectionCover = async (file: File): Promise<{ success: boolean; url: string }> => {
  const response = await uploadApi.cover(file);
  return {
    success: !response.error && !!response.data?.url,
    url: response.data?.url || '',
  };
};

export const uploadCollectionImage = uploadCollectionCover;
