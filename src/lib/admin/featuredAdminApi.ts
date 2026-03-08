import { supabase } from '@/lib/supabase-auth';

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

const mapFeaturedItem = (row: any): FeaturedItem => ({
  id: String(row.id),
  title: row.title || '',
  subtitle: row.subtitle || undefined,
  description: row.description || undefined,
  content_type: row.content_type || 'custom',
  image_url: row.image_url || row.banner_url || row.thumbnail_url || '',
  section: row.section || 'hero',
  position: Number(row.position || 0),
  priority: Number(row.priority || 0),
  is_active: row.is_active !== false,
  views_count: Number(row.views_count || 0),
  clicks_count: Number(row.clicks_count || 0),
  start_date: row.start_date || undefined,
  end_date: row.end_date || undefined,
  cta_text: row.cta_text || 'Ver Mais',
  created_at: row.created_at || new Date().toISOString(),
});

export const getFeaturedItems = async (filters?: {
  section?: string;
  content_type?: string;
  active?: boolean;
}): Promise<FeaturedItem[]> => {
  let query = supabase
    .from('featured_items')
    .select('*')
    .order('section', { ascending: true })
    .order('position', { ascending: true })
    .order('priority', { ascending: false });

  if (filters?.section && filters.section !== 'all') {
    query = query.eq('section', filters.section);
  }

  if (filters?.content_type && filters.content_type !== 'all') {
    query = query.eq('content_type', filters.content_type);
  }

  if (typeof filters?.active === 'boolean') {
    query = query.eq('is_active', filters.active);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapFeaturedItem);
};

export const getFeaturedStats = async (): Promise<FeaturedStats> => {
  const items = await getFeaturedItems();
  return {
    total: items.length,
    active: items.filter((item) => item.is_active).length,
    totalViews: items.reduce((sum, item) => sum + item.views_count, 0),
    totalClicks: items.reduce((sum, item) => sum + item.clicks_count, 0),
  };
};

export const getById = async (id: string): Promise<FeaturedItem | null> => {
  const { data, error } = await supabase
    .from('featured_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;
  return data ? mapFeaturedItem(data) : null;
};

const sanitizePayload = (data: Partial<FeaturedItem>) => ({
  title: data.title?.trim() || '',
  subtitle: data.subtitle?.trim() || null,
  description: data.description?.trim() || null,
  content_type: data.content_type || 'custom',
  image_url: data.image_url || '',
  section: data.section || 'hero',
  position: Number(data.position || 0),
  priority: Number(data.priority || 0),
  is_active: data.is_active ?? true,
  start_date: data.start_date || null,
  end_date: data.end_date || null,
  cta_text: data.cta_text?.trim() || 'Ver Mais',
});

export const create = async (
  data: Partial<FeaturedItem>
): Promise<{ success: boolean; item?: FeaturedItem }> => {
  const { data: created, error } = await supabase
    .from('featured_items')
    .insert({
      ...sanitizePayload(data),
      views_count: 0,
      clicks_count: 0,
    })
    .select('*')
    .single();

  if (error) throw error;
  return { success: true, item: mapFeaturedItem(created) };
};

export const update = async (
  id: string,
  data: Partial<FeaturedItem>
): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('featured_items')
    .update(sanitizePayload(data))
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const deleteItem = async (id: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('featured_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const deleteFeaturedItem = deleteItem;

export const toggleFeaturedStatus = async (
  id: string,
  is_active: boolean
): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('featured_items')
    .update({ is_active })
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const getAll = async () => getFeaturedItems();
