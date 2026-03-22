import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete, isSupabaseConfigured } from '@/lib/supabaseRest';

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  background_color?: string;
  description?: string;
  image_url?: string;
  meta_title?: string;
  meta_description?: string;
  ativo?: number;
};

function mapCategory(raw: any): CategoryRecord {
  return {
    id: String(raw.id),
    name: String(raw.name ?? raw.nome ?? ''),
    slug: String(raw.slug ?? ''),
    background_color: String(raw.background_color ?? raw.color ?? raw.cor ?? '#6366f1'),
    description: raw.description ?? raw.descricao ?? undefined,
    image_url: raw.image_url ?? raw.imagem_url ?? undefined,
    ativo: raw.is_active != null ? (raw.is_active ? 1 : 0) : (raw.ativo != null ? Number(raw.ativo) : 1),
  };
}

export const getAll = async (params?: { search?: string; page?: number; limit?: number }) => {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ [categoriesApi] Supabase NOT configured');
    return [];
  }

  try {
    const filters: Record<string, string> = {
      select: 'id,nome,slug,descricao,imagem_url,ativo',
      order: 'nome.asc',
    };
    
    if (params?.limit) filters.limit = String(params.limit);
    if (params?.search) filters['nome'] = `ilike.%${params.search}%`;
    
    const rows = await supabaseFetch<any>('categorias', filters);
    return rows.map(mapCategory);
  } catch (error) {
    console.error('❌ [categoriesApi] Supabase error:', error);
    return [];
  }
};

export const get = getAll;

export const fetchActiveCategories = async () => {
  const all = await getAll({ limit: 100 });
  return all.filter((c) => c.ativo === 1 || c.ativo === undefined);
};

export const getById = async (id: number | string) => {
  if (!isSupabaseConfigured) return null;
  
  try {
    const rows = await supabaseFetch<any>('categorias', { 
      id: `eq.${id}`,
      select: 'id,nome,slug,descricao,imagem_url,ativo'
    });
    return rows.length > 0 ? mapCategory(rows[0]) : null;
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    return null;
  }
};

export const create = async (data: { name: string; slug: string; background_color?: string; description?: string; image_url?: string }) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const payload = {
    nome: data.name,
    slug: data.slug,
    cor: data.background_color || '#6366f1',
    descricao: data.description,
    imagem_url: data.image_url,
    ativo: 1,
  };

  const result = await supabaseInsert<any>('categorias', payload);
  if (!result) throw new Error('Failed to create category');
  return mapCategory(result);
};

export const update = async (id: number | string, data: Partial<CategoryRecord>) => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const payload: any = {};
    if (data.name) payload.nome = data.name;
    if (data.slug) payload.slug = data.slug;
    if (data.description !== undefined) payload.descricao = data.description;
    if (data.image_url !== undefined) payload.imagem_url = data.image_url;
    if (data.background_color) payload.cor = data.background_color;
    if (data.ativo !== undefined) payload.ativo = data.ativo;
    
    const results = await supabaseUpdate<any>('categorias', { id: `eq.${id}` }, payload);
    return { success: true, data: results.length > 0 ? mapCategory(results[0]) : null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao atualizar categoria' };
  }
};

export const deleteItem = async (id: number | string) => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const success = await supabaseDelete('categorias', { id: `eq.${id}` });
    return { success, data: success ? { id } : null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao deletar categoria' };
  }
};

export default {
  get,
  getAll,
  fetchActiveCategories,
  getById,
  create,
  update,
  deleteItem,
};
