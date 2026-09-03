import { albunsApi } from '@/lib/api-client';
import { supabaseAuthUpdate, supabaseFetch } from '@/lib/supabaseRest';

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

export const getPendingAlbums = async (
  page: number = 1,
  limit: number = 12
): Promise<{ data: Album[]; count: number; totalPages: number }> => {
  const from = (page - 1) * limit;
  const pendingFilter = '(is_published.eq.false,active.eq.false)';

  const [allPendingRows, rows] = await Promise.all([
    supabaseFetch<any>('albums', {
      select: 'id',
      or: pendingFilter,
      order: 'created_at.desc',
    }),
    supabaseFetch<any>('albums', {
      select:
        'id,title,artist,description,cover_url,total_tracks,release_date,composer_id,created_at,updated_at,is_published,active,featured,featured_order,genre',
      or: pendingFilter,
      order: 'created_at.desc',
      limit: String(limit),
      offset: String(from),
    }),
  ]);

  const albumIds = (rows || []).map((row: any) => String(row.id));
  const trackCounts: Record<string, number> = {};

  if (albumIds.length > 0) {
    const albumHinos = await supabaseFetch<any>('album_hinos', {
      select: 'album_id',
      album_id: `in.(${albumIds.join(',')})`,
    });

    for (const item of albumHinos || []) {
      const albumId = String((item as any).album_id);
      trackCounts[albumId] = (trackCounts[albumId] || 0) + 1;
    }
  }

  const albums = (rows || []).map((row: any) => mapAlbum({
    ...row,
    total_tracks: trackCounts[String(row.id)] || row.total_tracks || 0,
  }));

  const total = allPendingRows.length;

  return {
    data: albums,
    count: total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

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

export const approveAlbum = async (id: string): Promise<{ success: boolean }> => {
  const response = await albunsApi.update(id, { is_published: true, ativo: 1 } as any);
  if (response.error) {
    throw new Error(response.error);
  }

  const relations = await supabaseFetch<any>('album_hinos', {
    select: 'hino_id',
    album_id: `eq.${id}`,
  });
  const hinoIds = [...new Set((relations || []).map((item: any) => String(item.hino_id)).filter(Boolean))];
  if (hinoIds.length > 0) {
    await supabaseAuthUpdate<any>('hinos', { id: `in.(${hinoIds.join(',')})` }, {
      status: 'published',
      ativo: true,
      updated_at: new Date().toISOString(),
    });
  }

  // Álbuns criados pela recuperação usam a mesma aprovação do painel.
  // Instalações antigas podem ainda não ter a tabela; isso não bloqueia
  // a aprovação de um álbum criado por outros fluxos.
  try {
    const now = new Date().toISOString();
    await supabaseAuthUpdate<any>('archive_recovery_imports', { album_id: `eq.${id}` }, {
      status: 'approved',
      approved_at: now,
      updated_at: now,
    });
  } catch (error) {
    console.warn('[approveAlbum] Recovery status was not updated:', error);
  }

  return { success: true };
};

export const deleteAlbum = async (id: string): Promise<{ success: boolean }> => {
  const response = await albunsApi.delete(id);
  if (response.error) throw new Error(response.error);
  return { success: true };
};

export const deleteItem = deleteAlbum;
