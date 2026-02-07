import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete } from '@/lib/supabaseRest';

export interface BibleNarrated {
  id: number;
  youtube_url: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string;
  book_name: string;
  description: string;
  content: string;
  duration?: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type CreateBibleNarratedData = Omit<BibleNarrated, 'id' | 'created_at' | 'updated_at'>;
export type UpdateBibleNarratedData = Partial<CreateBibleNarratedData>;

const mapRow = (r: any): BibleNarrated => ({
  id: Number(r.id),
  youtube_url: r.youtube_url || '',
  youtube_video_id: r.youtube_video_id || '',
  title: r.title || '',
  thumbnail_url: r.thumbnail_url || '',
  book_name: r.book_name || '',
  description: r.description || '',
  content: r.content || '',
  duration: r.duration ?? 0,
  is_active: r.is_active !== false,
  display_order: r.display_order ?? 0,
  created_at: r.created_at || new Date().toISOString(),
  updated_at: r.updated_at || new Date().toISOString(),
});

// =============================================
// Toggle "Exibir seção na Home"
// Salva na tabela site_config do Supabase.
// Fallback para localStorage se a tabela não existir.
// =============================================

export async function getBibleNarratedSectionEnabled(): Promise<boolean> {
  try {
    const rows = await supabaseFetch<any>('site_config', {
      config_key: 'eq.bible_narrated_section_enabled',
      select: 'config_value',
      limit: '1',
    });
    if (rows.length > 0) {
      return rows[0].config_value === 'true';
    }
  } catch (e) {
    console.warn('[getBibleNarratedSectionEnabled] Supabase fallback to localStorage', e);
  }
  // Fallback: localStorage
  try {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('bibleNarratedSectionEnabled') : null;
    return v === null ? true : v === 'true';
  } catch {
    return true;
  }
}

export async function setBibleNarratedSectionEnabled(value: boolean): Promise<void> {
  // Sempre salvar no localStorage como fallback imediato
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('bibleNarratedSectionEnabled', String(value));
    }
  } catch {}

  // Tentar salvar no Supabase
  try {
    // Verificar se já existe
    const rows = await supabaseFetch<any>('site_config', {
      config_key: 'eq.bible_narrated_section_enabled',
      select: 'id',
      limit: '1',
    });
    if (rows.length > 0) {
      await supabaseUpdate('site_config', { config_key: 'eq.bible_narrated_section_enabled' }, { config_value: String(value) });
    } else {
      await supabaseInsert('site_config', { config_key: 'bible_narrated_section_enabled', config_value: String(value) });
    }
  } catch (e) {
    console.warn('[setBibleNarratedSectionEnabled] Supabase save failed, using localStorage only', e);
  }
}

// =============================================
// CRUD - Bíblia Narrada (tabela: bible_narrated)
// =============================================

export async function fetchBibleNarrated(): Promise<BibleNarrated[]> {
  try {
    const rows = await supabaseFetch<any>('bible_narrated', {
      select: '*',
      order: 'display_order.asc',
    });
    return rows.map(mapRow);
  } catch (error) {
    console.error('[fetchBibleNarrated] Error:', error);
    return [];
  }
}

export async function fetchActiveBibleNarrated(): Promise<BibleNarrated[]> {
  try {
    const rows = await supabaseFetch<any>('bible_narrated', {
      select: '*',
      is_active: 'eq.true',
      order: 'display_order.asc',
    });
    return rows.map(mapRow);
  } catch (error) {
    console.error('[fetchActiveBibleNarrated] Error:', error);
    return [];
  }
}

export async function fetchBibleNarratedById(id: number): Promise<BibleNarrated | null> {
  try {
    const rows = await supabaseFetch<any>('bible_narrated', {
      id: `eq.${id}`,
      select: '*',
      limit: '1',
    });
    return rows.length > 0 ? mapRow(rows[0]) : null;
  } catch (error) {
    console.error('[fetchBibleNarratedById] Error:', error);
    return null;
  }
}

export async function createBibleNarrated(data: CreateBibleNarratedData): Promise<BibleNarrated> {
  try {
    const result = await supabaseInsert('bible_narrated', {
      youtube_url: data.youtube_url,
      youtube_video_id: data.youtube_video_id,
      title: data.title,
      thumbnail_url: data.thumbnail_url,
      book_name: data.book_name,
      description: data.description,
      content: data.content,
      duration: data.duration || 0,
      is_active: data.is_active,
      display_order: data.display_order,
    });
    return mapRow(result);
  } catch (error) {
    console.error('[createBibleNarrated] Error:', error);
    throw error;
  }
}

export async function updateBibleNarrated(id: number, data: UpdateBibleNarratedData): Promise<BibleNarrated> {
  try {
    const rows = await supabaseUpdate<any>('bible_narrated', { id: `eq.${id}` }, data);
    return rows.length > 0 ? mapRow(rows[0]) : mapRow({ id, ...data });
  } catch (error) {
    console.error('[updateBibleNarrated] Error:', error);
    throw error;
  }
}

export async function deleteBibleNarrated(id: number): Promise<void> {
  try {
    await supabaseDelete('bible_narrated', { id: `eq.${id}` });
  } catch (error) {
    console.error('[deleteBibleNarrated] Error:', error);
    throw error;
  }
}

export async function toggleBibleNarratedActive(id: number): Promise<BibleNarrated> {
  try {
    const item = await fetchBibleNarratedById(id);
    if (!item) throw new Error('Item não encontrado');
    const rows = await supabaseUpdate<any>('bible_narrated', { id: `eq.${id}` }, {
      is_active: !item.is_active,
    });
    return rows.length > 0 ? mapRow(rows[0]) : { ...item, is_active: !item.is_active };
  } catch (error) {
    console.error('[toggleBibleNarratedActive] Error:', error);
    throw error;
  }
}

export async function reorderBibleNarrated(items: { id: number; display_order: number }[]): Promise<void> {
  try {
    for (const { id, display_order } of items) {
      await supabaseUpdate('bible_narrated', { id: `eq.${id}` }, { display_order });
    }
  } catch (error) {
    console.error('[reorderBibleNarrated] Error:', error);
    throw error;
  }
}
