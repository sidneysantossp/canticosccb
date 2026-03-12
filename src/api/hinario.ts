import { supabaseFetch, supabaseUpdate } from '@/lib/supabaseRest';

// =============================================
// Types
// =============================================

export interface HinarioHymn {
  id: number;
  numero: number;
  titulo: string;
  subtitulo: string | null;
  conteudo: string;
  categoria: string;
  tags: string | null;
  views_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const mapRow = (r: any): HinarioHymn => ({
  id: Number(r.id),
  numero: Number(r.numero) || 0,
  titulo: r.titulo || '',
  subtitulo: r.subtitulo || null,
  conteudo: r.conteudo || '',
  categoria: r.categoria || 'hinario5',
  tags: r.tags || null,
  views_count: r.views_count ?? 0,
  is_active: r.is_active !== false,
  created_at: r.created_at || new Date().toISOString(),
  updated_at: r.updated_at || new Date().toISOString(),
});

// =============================================
// Queries
// =============================================

export async function fetchHinarioList(params?: {
  search?: string;
  categoria?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}): Promise<HinarioHymn[]> {
  try {
    const filters: Record<string, string> = {
      select: 'id,numero,titulo,subtitulo,categoria,views_count,is_active,created_at',
      order: 'numero.asc',
    };
    if (params?.search) {
      filters['or'] = `(titulo.ilike.%${params.search}%,numero.eq.${isNaN(Number(params.search)) ? 0 : params.search})`;
    }
    if (params?.categoria) {
      filters['categoria'] = `eq.${params.categoria}`;
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
    const rows = await supabaseFetch<any>('hinario', filters);
    return rows.map(mapRow);
  } catch (error) {
    console.error('[hinario] fetchHinarioList error:', error);
    return [];
  }
}

export async function fetchHinarioByNumero(numero: number, categoria?: string): Promise<HinarioHymn | null> {
  try {
    const filters: Record<string, string> = {
      numero: `eq.${numero}`,
      is_active: 'eq.true',
      select: '*',
      limit: '1',
    };
    if (categoria) {
      filters['categoria'] = `eq.${categoria}`;
    }
    const rows = await supabaseFetch<any>('hinario', filters);
    return rows.length > 0 ? mapRow(rows[0]) : null;
  } catch (error) {
    console.error('[hinario] fetchHinarioByNumero error:', error);
    return null;
  }
}

export async function fetchHinarioById(id: number): Promise<HinarioHymn | null> {
  try {
    const rows = await supabaseFetch<any>('hinario', {
      id: `eq.${id}`,
      select: '*',
      limit: '1',
    });
    return rows.length > 0 ? mapRow(rows[0]) : null;
  } catch (error) {
    console.error('[hinario] fetchHinarioById error:', error);
    return null;
  }
}

export async function fetchHinarioTotal(categoria?: string): Promise<number> {
  try {
    const filters: Record<string, string> = {
      is_active: 'eq.true',
      select: 'id',
      order: 'numero.desc',
      limit: '1',
    };
    if (categoria) {
      filters['categoria'] = `eq.${categoria}`;
    }
    const rows = await supabaseFetch<any>('hinario', filters);
    return rows.length > 0 ? Number(rows[0].id) : 0;
  } catch (error) {
    console.error('[hinario] fetchHinarioTotal error:', error);
    return 0;
  }
}

export async function fetchHinarioCount(categoria?: string): Promise<number> {
  try {
    const filters: Record<string, string> = {
      is_active: 'eq.true',
      select: 'numero',
    };
    if (categoria) {
      filters['categoria'] = `eq.${categoria}`;
    }
    const rows = await supabaseFetch<any>('hinario', filters);
    return rows.length;
  } catch (error) {
    console.error('[hinario] fetchHinarioCount error:', error);
    return 0;
  }
}

export async function incrementHinarioViews(id: number): Promise<void> {
  try {
    const hymn = await fetchHinarioById(id);
    if (hymn) {
      await supabaseUpdate('hinario', { id: `eq.${id}` }, { views_count: hymn.views_count + 1 });
    }
  } catch (error) {
    console.error('[hinario] incrementHinarioViews error:', error);
  }
}

// =============================================
// Helpers
// =============================================

export interface HinarioVerse {
  number: number | null;
  lines: string[];
}

/**
 * Parses the raw `conteudo` field into structured verses.
 * Each verse block is separated by a blank line.
 * The first line of each block may start with a number followed by a dot or tab.
 */
export function parseVerses(conteudo: string): HinarioVerse[] {
  if (!conteudo) return [];

  const blocks = conteudo.split(/\n\s*\n/).filter(b => b.trim());
  return blocks.map(block => {
    const lines = block.split('\n').map(l => l.trimEnd());
    const firstLine = lines[0]?.trim() || '';

    // Check if first line starts with a number (verse number)
    const match = firstLine.match(/^(\d+)\s*(?:\.|-|\u2013|\))\s*(.*)/);
    if (match) {
      const num = parseInt(match[1], 10);
      const rest = match[2];
      const verseLines = rest ? [rest, ...lines.slice(1)] : lines.slice(1);
      return { number: num, lines: verseLines.map(l => l.trim()) };
    }

    return { number: null, lines: lines.map(l => l.trim()) };
  });
}

// =============================================
// Constants
// =============================================

export const HINARIO_CATEGORIES = [
  { value: 'hinario5', label: 'Hinário 5' },
  { value: 'hinario4', label: 'Hinário 4' },
] as const;
