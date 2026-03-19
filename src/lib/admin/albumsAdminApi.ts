import { albunsApi } from '@/lib/api-client';

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

const mapAlbum = (album: any): Album => ({
  id: String(album.id),
  title: album.title || album.titulo || '',
  artist: album.artist || '',
  description: album.description || album.descricao || '',
  genre: album.genre || '',
  cover_url: album.cover_url || '',
  total_tracks: Number(album.total_tracks || 0),
  release_date: album.release_date || '',
  status: album.status === 'draft' || album.is_published === false ? 'draft' : 'published',
  composer_id: album.composer_id || album.compositor_id,
  created_at: album.created_at || '',
  updated_at: album.updated_at || '',
});

export const getAllAlbums = async (page: number = 1, limit: number = 12): Promise<{ data: Album[]; count: number; totalPages: number }> => {
  const response = await albunsApi.list({ page, limit });

  if (response.error) {
    throw new Error(response.error);
  }

  const albums = (response.data?.albuns || []).map(mapAlbum);
  return {
    data: albums,
    count: response.data?.total || albums.length,
    totalPages: response.data?.pages || 1,
  };
};

export const getAll = getAllAlbums;

export const getById = async (id: string): Promise<Album | null> => {
  const response = await albunsApi.get(id);
  if (response.error) {
    throw new Error(response.error);
  }

  return response.data ? mapAlbum(response.data) : null;
};

export const createAlbum = async (data: CreateAlbumData): Promise<{ success: boolean; album?: Album }> => {
  const response = await albunsApi.create({
    titulo: data.title,
    artist: data.artist,
    descricao: data.description,
    genre: data.genre,
    cover_url: data.cover_url,
    total_tracks: data.total_tracks,
    release_date: data.release_date,
    is_published: data.status !== 'draft',
  });

  if (response.error) {
    return { success: false };
  }

  return { success: true, album: response.data ? mapAlbum(response.data) : undefined };
};

export const create = createAlbum;

export const updateAlbum = async (id: string, data: Partial<Album>): Promise<{ success: boolean }> => {
  const response = await albunsApi.update(id, {
    title: data.title,
    artist: data.artist,
    description: data.description,
    genre: data.genre,
    cover_url: data.cover_url,
    total_tracks: data.total_tracks,
    release_date: data.release_date,
    is_published: data.status === undefined ? undefined : data.status !== 'draft',
    composer_id: data.composer_id,
  });

  return { success: !response.error };
};

export const update = updateAlbum;

export const deleteAlbum = async (id: string): Promise<{ success: boolean }> => {
  await albunsApi.delete(id);
  return { success: true };
};

export const deleteItem = deleteAlbum;
