import { isSupabaseConfigured, supabaseFetch } from '@/lib/supabaseRest';

export interface Composer {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar_url?: string;
  ativo?: number;
}

const mapComposer = (row: any): Composer => ({
  id: String(row.id),
  name: String(row.artistic_name || row.name || ''),
  slug: String(row.slug || ''),
  bio: row.biography || row.bio || undefined,
  avatar_url: row.avatar_url || row.photo_url || undefined,
  ativo: row.status === 'approved' || row.verified ? 1 : 0,
});

export const getAll = async (): Promise<Composer[]> => {
  if (!isSupabaseConfigured) return [];

  try {
    const rows = await supabaseFetch<any>('composers', {
      select: 'id,name,artistic_name,slug,bio,biography,avatar_url,photo_url,status,verified',
      or: '(verified.eq.true,status.eq.approved)',
      order: 'name.asc',
    });
    return rows.map(mapComposer);
  } catch (error) {
    console.error('❌ [composerApi] getAll error:', error);
    return [];
  }
};

export const getById = async (id: string | number): Promise<Composer | null> => {
  if (!isSupabaseConfigured) return null;

  try {
    const rows = await supabaseFetch<any>('composers', {
      id: `eq.${id}`,
      select: 'id,name,artistic_name,slug,bio,biography,avatar_url,photo_url,status,verified',
      limit: '1',
    });
    return rows.length > 0 ? mapComposer(rows[0]) : null;
  } catch (error) {
    console.error('❌ [composerApi] getById error:', error);
    return null;
  }
};

export const create = async () => ({ success: false });
export const update = async () => ({ success: false });
export const deleteItem = async () => ({ success: false });
