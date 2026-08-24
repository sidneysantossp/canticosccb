import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete } from '@/lib/supabaseRest';

const LEGACY_VIEW_DEDUP_PREFIX = 'legacy-cifra-view:';
const pendingLegacyViewIncrements = new Set<string>();

export interface Cifra {
  id: number;
  title: string;
  artist: string;
  slug: string;
  content: string;
  original_key: string;
  instrument: string;
  capo: number;
  cover_url: string | null;
  hino_id: string | null;
  category: string;
  views_count: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateCifraData = Omit<Cifra, 'id' | 'created_at' | 'updated_at' | 'views_count'>;
export type UpdateCifraData = Partial<CreateCifraData>;

const mapRow = (r: any): Cifra => ({
  id: Number(r.id),
  title: r.title || '',
  artist: r.artist || '',
  slug: r.slug || '',
  content: r.content || '',
  original_key: r.original_key || 'C',
  instrument: r.instrument || 'violao',
  capo: r.capo ?? 0,
  cover_url: r.cover_url || null,
  hino_id: r.hino_id || null,
  category: r.category || 'avulsos',
  views_count: r.views_count ?? 0,
  is_active: r.is_active !== false,
  created_by: r.created_by || null,
  created_at: r.created_at || new Date().toISOString(),
  updated_at: r.updated_at || new Date().toISOString(),
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

function getLegacyViewDedupKey(id: number) {
  return `${LEGACY_VIEW_DEDUP_PREFIX}${id}`;
}

// =============================================
// CRUD Operations
// =============================================

export async function fetchCifras(params?: {
  search?: string;
  instrument?: string;
  category?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Cifra[]> {
  try {
    const filters: Record<string, string> = {
      select: '*',
      order: 'created_at.desc',
    };
    if (params?.search) {
      filters['or'] = `(title.ilike.%${params.search}%,artist.ilike.%${params.search}%)`;
    }
    if (params?.instrument) {
      filters['instrument'] = `eq.${params.instrument}`;
    }
    if (params?.category) {
      filters['category'] = `eq.${params.category}`;
    }
    if (params?.is_active !== undefined) {
      filters['is_active'] = `eq.${params.is_active}`;
    }
    if (params?.limit) {
      filters['limit'] = String(params.limit);
    }
    if (params?.offset) {
      filters['offset'] = String(params.offset);
    }
    const rows = await supabaseFetch<any>('cifras', filters);
    return rows.map(mapRow);
  } catch (error) {
    console.error('[cifras] fetchCifras error:', error);
    return [];
  }
}

export async function fetchCifraById(id: number): Promise<Cifra | null> {
  try {
    const rows = await supabaseFetch<any>('cifras', {
      id: `eq.${id}`,
      select: '*',
      limit: '1',
    });
    return rows.length > 0 ? mapRow(rows[0]) : null;
  } catch (error) {
    console.error('[cifras] fetchCifraById error:', error);
    return null;
  }
}

export async function fetchCifraBySlug(slug: string, instrument?: string): Promise<Cifra | null> {
  try {
    const rows = await supabaseFetch<any>('cifras', {
      slug: `eq.${slug}`,
      select: '*',
      limit: '1',
      ...(instrument ? { instrument: `eq.${instrument}` } : {}),
    });
    return rows.length > 0 ? mapRow(rows[0]) : null;
  } catch (error) {
    console.error('[cifras] fetchCifraBySlug error:', error);
    return null;
  }
}

/**
 * Resolves the former imported Hinário URL so existing shared links can be
 * replaced in the client with the current descriptive URL.
 */
export async function fetchCifraByLegacyHinarioSlug(slug: string): Promise<Cifra | null> {
  const match = slug.match(/^(?:cifra-)?hino-(\d{1,3})-ccb(?:-.+)?(?:-violao)?$/i);
  if (!match) return null;

  try {
    const number = Number(match[1]);
    const rows = await supabaseFetch<any>('cifras', {
      select: '*',
      title: `ilike.Hino ${number} - %`,
      instrument: 'eq.violao',
      category: 'eq.hinario',
      limit: '1',
    });
    return rows.length > 0 ? mapRow(rows[0]) : null;
  } catch (error) {
    console.error('[cifras] fetchCifraByLegacyHinarioSlug error:', error);
    return null;
  }
}

export async function createCifra(data: CreateCifraData): Promise<Cifra | null> {
  try {
    const slug = data.slug || generateSlug(data.title);
    const payload = { ...data, slug };
    const result = await supabaseInsert('cifras', payload);
    if (result && Array.isArray(result) && result.length > 0) {
      return mapRow(result[0]);
    }
    return null;
  } catch (error) {
    console.error('[cifras] createCifra error:', error);
    throw error;
  }
}

export async function updateCifra(id: number, data: UpdateCifraData): Promise<Cifra | null> {
  try {
    const result = await supabaseUpdate('cifras', { id: `eq.${id}` }, data);
    if (result && Array.isArray(result) && result.length > 0) {
      return mapRow(result[0]);
    }
    return null;
  } catch (error) {
    console.error('[cifras] updateCifra error:', error);
    throw error;
  }
}

export async function deleteCifra(id: number): Promise<boolean> {
  try {
    await supabaseDelete('cifras', { id: `eq.${id}` });
    return true;
  } catch (error) {
    console.error('[cifras] deleteCifra error:', error);
    return false;
  }
}

export async function toggleCifraActive(id: number): Promise<boolean> {
  try {
    const cifra = await fetchCifraById(id);
    if (!cifra) return false;
    await supabaseUpdate('cifras', { id: `eq.${id}` }, { is_active: !cifra.is_active });
    return true;
  } catch (error) {
    console.error('[cifras] toggleCifraActive error:', error);
    return false;
  }
}

export async function incrementCifraViews(id: number): Promise<void> {
  const dedupeKey = getLegacyViewDedupKey(id);

  if (canUseSessionStorage()) {
    if (pendingLegacyViewIncrements.has(dedupeKey) || sessionStorage.getItem(dedupeKey) === '1') {
      return;
    }
  }

  pendingLegacyViewIncrements.add(dedupeKey);

  try {
    const cifra = await fetchCifraById(id);
    if (cifra) {
      await supabaseUpdate('cifras', { id: `eq.${id}` }, { views_count: cifra.views_count + 1 });
      if (canUseSessionStorage()) {
        sessionStorage.setItem(dedupeKey, '1');
      }
    }
  } catch (error) {
    console.error('[cifras] incrementCifraViews error:', error);
  } finally {
    pendingLegacyViewIncrements.delete(dedupeKey);
  }
}

// =============================================
// Constants
// =============================================

export const INSTRUMENTS = [
  { value: 'violao', label: 'Violão & Guitarra' },
  { value: 'ukulele', label: 'Ukulele' },
  { value: 'teclado', label: 'Teclado' },
  { value: 'cavaco', label: 'Cavaco' },
] as const;

export const CATEGORIES = [
  { value: 'avulsos', label: 'Hinos Avulsos' },
  { value: 'cantados', label: 'Hinos Cantados' },
  { value: 'tocados', label: 'Hinos Tocados' },
] as const;

export const ALL_KEYS: string[] = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm',
];
