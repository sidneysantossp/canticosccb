import { fetchHinarioByNumero, type HinarioHymn } from '@/api/hinario';
import { supabaseFetch } from '@/lib/supabaseRest';

export type RelatedHymnSummary = {
  id: string;
  numero: number;
  titulo: string;
  compositor_nome?: string;
  categoria?: string;
};

export type RelatedCifraSummary = {
  slug: string;
  title: string;
  original_key?: string;
  instrument?: string;
  hino_id?: string | null;
};

const normalizeConnectionText = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const cleanTitle = (value: string, numero?: number | null) => {
  let normalized = String(value || '').trim();
  if (numero != null && numero > 0) {
    const escapedNumber = String(numero).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const leadingPattern = new RegExp(`^hino\\s*${escapedNumber}(?:\\s*ccb)?\\s*(?:-|:|\\u2013)?\\s*`, 'i');
    normalized = normalized.replace(leadingPattern, '').trim();
  }
  return normalized || String(value || '').trim();
};

export const extractHymnNumber = (value?: string | null): number | null => {
  const normalized = String(value || '').trim();
  const match = normalized.match(/(?:^|\b)hino\s*(\d{1,3})\b|^(\d{1,3})\s*(?:-|:|\u2013|\))/i);
  const number = Number(match?.[1] || match?.[2] || 0);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const tokenize = (value: string) =>
  normalizeConnectionText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && token !== 'ccb' && token !== 'hino');

const scoreTitleMatch = (candidateTitle: string, targetTitle: string, candidateNumber?: number | null, targetNumber?: number | null) => {
  const normalizedCandidate = normalizeConnectionText(cleanTitle(candidateTitle, candidateNumber ?? undefined));
  const normalizedTarget = normalizeConnectionText(cleanTitle(targetTitle, targetNumber ?? undefined));
  if (!normalizedCandidate || !normalizedTarget) return 0;

  let score = 0;
  if (normalizedCandidate === normalizedTarget) score += 10;
  if (normalizedCandidate.includes(normalizedTarget) || normalizedTarget.includes(normalizedCandidate)) score += 6;
  const targetTokens = tokenize(normalizedTarget);
  for (const token of targetTokens) {
    if (normalizedCandidate.includes(token)) score += 2;
  }
  return score;
};

export async function findRelatedHinario(numero?: number | null): Promise<HinarioHymn | null> {
  if (!numero || numero <= 0) return null;
  return fetchHinarioByNumero(numero);
}

export async function findRelatedHymn(params: {
  hymnId?: string | null;
  numero?: number | null;
  titulo?: string | null;
}): Promise<RelatedHymnSummary | null> {
  const numero = Number(params.numero || 0);

  if (params.hymnId) {
    const exactRows = await supabaseFetch<any>('hinos', {
      id: `eq.${params.hymnId}`,
      or: '(ativo.eq.true,ativo.eq.1)',
      select: 'id,numero,titulo,compositor_nome,categoria',
      limit: '1',
    });
    if (exactRows[0]) {
      return {
        id: String(exactRows[0].id),
        numero: Number(exactRows[0].numero || 0),
        titulo: String(exactRows[0].titulo || 'Hino CCB'),
        compositor_nome: exactRows[0].compositor_nome || undefined,
        categoria: exactRows[0].categoria || undefined,
      };
    }
  }

  const candidates: any[] = [];
  const seen = new Set<string>();

  if (numero > 0) {
    const numberRows = await supabaseFetch<any>('hinos', {
      numero: `eq.${numero}`,
      or: '(ativo.eq.true,ativo.eq.1)',
      select: 'id,numero,titulo,compositor_nome,categoria',
      limit: '20',
    });
    for (const row of numberRows) {
      const key = String(row.id);
      if (!seen.has(key)) {
        candidates.push(row);
        seen.add(key);
      }
    }
  }

  const title = cleanTitle(String(params.titulo || ''), numero || undefined);
  const searchToken = tokenize(title).slice(0, 4).join(' ');
  if (searchToken.length >= 3) {
    const titleRows = await supabaseFetch<any>('hinos', {
      titulo: `ilike.%${searchToken}%`,
      or: '(ativo.eq.true,ativo.eq.1)',
      select: 'id,numero,titulo,compositor_nome,categoria',
      limit: '50',
    });
    for (const row of titleRows) {
      const key = String(row.id);
      if (!seen.has(key)) {
        candidates.push(row);
        seen.add(key);
      }
    }
  }

  if (candidates.length === 0) return null;

  const best = candidates
    .map((row) => {
      const candidateNumber = Number(row.numero || 0);
      let score = 0;
      if (numero > 0 && candidateNumber === numero) score += 14;
      score += scoreTitleMatch(String(row.titulo || ''), title, candidateNumber, numero);
      return { row, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  if (!best || best.score <= 0) return null;

  return {
    id: String(best.row.id),
    numero: Number(best.row.numero || 0),
    titulo: String(best.row.titulo || 'Hino CCB'),
    compositor_nome: best.row.compositor_nome || undefined,
    categoria: best.row.categoria || undefined,
  };
}

export async function findRelatedCifra(params: {
  hymnId?: string | null;
  numero?: number | null;
  titulo?: string | null;
}): Promise<RelatedCifraSummary | null> {
  if (params.hymnId) {
    const exactRows = await supabaseFetch<any>('cifras', {
      hino_id: `eq.${params.hymnId}`,
      is_active: 'eq.true',
      select: 'slug,title,original_key,instrument,hino_id',
      limit: '1',
    });
    if (exactRows[0]) {
      return {
        slug: String(exactRows[0].slug),
        title: String(exactRows[0].title || 'Cifra'),
        original_key: exactRows[0].original_key || undefined,
        instrument: exactRows[0].instrument || undefined,
        hino_id: exactRows[0].hino_id || null,
      };
    }
  }

  const rows = await supabaseFetch<any>('cifras', {
    is_active: 'eq.true',
    select: 'slug,title,original_key,instrument,hino_id',
    limit: '500',
  });

  if (rows.length === 0) return null;

  const numero = Number(params.numero || 0);
  const title = cleanTitle(String(params.titulo || ''), numero || undefined);

  const best = rows
    .map((row) => {
      const candidateNumber = extractHymnNumber(row.title);
      let score = 0;
      if (params.hymnId && row.hino_id === params.hymnId) score += 20;
      if (numero > 0 && candidateNumber === numero) score += 12;
      score += scoreTitleMatch(String(row.title || ''), title, candidateNumber, numero);
      return { row, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  if (!best || best.score <= 0) return null;

  return {
    slug: String(best.row.slug),
    title: String(best.row.title || 'Cifra'),
    original_key: best.row.original_key || undefined,
    instrument: best.row.instrument || undefined,
    hino_id: best.row.hino_id || null,
  };
}
