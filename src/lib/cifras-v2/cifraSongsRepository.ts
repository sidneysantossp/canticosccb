import { supabaseFetch, supabaseInsert, supabaseUpdate } from '@/lib/supabaseRest';
import { generateSlug } from '@/lib/utils/slugUtils';
import type { CifraSong, CifraSourceType } from '@/types/cifras-v2';

import { mapCifraSongRow } from './mappers';

export interface FetchCifraSongsParams {
  search?: string;
  sourceType?: CifraSourceType;
  hinoId?: string;
  hinarioNumero?: number;
  onlyActive?: boolean;
  onlyIndexable?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateCifraSongInput {
  canonicalSlug?: string;
  title: string;
  subtitle?: string | null;
  composerName?: string | null;
  hinoId?: string | null;
  hinarioNumero?: number | null;
  sourceType?: CifraSourceType;
  liturgicalContext?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  coverUrl?: string | null;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
  isIndexable?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export type UpdateCifraSongInput = Partial<CreateCifraSongInput>;

function buildSongSlug(data: CreateCifraSongInput | UpdateCifraSongInput): string {
  if (data.canonicalSlug?.trim()) {
    return generateSlug(data.canonicalSlug);
  }

  if (data.hinarioNumero) {
    return generateSlug(`hino-${data.hinarioNumero}-${data.title ?? ''}`);
  }

  return generateSlug(data.title ?? '');
}

function buildSongPayload(data: CreateCifraSongInput | UpdateCifraSongInput) {
  const payload: Record<string, unknown> = {};

  if (data.canonicalSlug !== undefined || data.title !== undefined || data.hinarioNumero !== undefined) {
    payload.canonical_slug = buildSongSlug(data);
  }

  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.subtitle !== undefined) payload.subtitle = data.subtitle?.trim() || null;
  if (data.composerName !== undefined) payload.composer_name = data.composerName?.trim() || null;
  if (data.hinoId !== undefined) payload.hino_id = data.hinoId?.trim() || null;
  if (data.hinarioNumero !== undefined) payload.hinario_numero = data.hinarioNumero ?? null;
  if (data.sourceType !== undefined) payload.source_type = data.sourceType;
  if (data.liturgicalContext !== undefined) payload.liturgical_context = data.liturgicalContext?.trim() || null;
  if (data.seoTitle !== undefined) payload.seo_title = data.seoTitle?.trim() || null;
  if (data.seoDescription !== undefined) payload.seo_description = data.seoDescription?.trim() || null;
  if (data.seoKeywords !== undefined) payload.seo_keywords = data.seoKeywords?.trim() || null;
  if (data.coverUrl !== undefined) payload.cover_url = data.coverUrl?.trim() || null;
  if (data.metadata !== undefined) payload.metadata = data.metadata ?? {};
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  if (data.isIndexable !== undefined) payload.is_indexable = data.isIndexable;
  if (data.createdBy !== undefined) payload.created_by = data.createdBy ?? null;
  if (data.updatedBy !== undefined) payload.updated_by = data.updatedBy ?? null;

  return payload;
}

export async function fetchCifraSongs(params: FetchCifraSongsParams = {}): Promise<CifraSong[]> {
  const filters: Record<string, string> = {
    select: '*',
    order: 'hinario_numero.asc.nullslast,title.asc',
  };

  if (params.search?.trim()) {
    const search = params.search.trim();
    filters.or = `(title.ilike.%${search}%,subtitle.ilike.%${search}%,composer_name.ilike.%${search}%,canonical_slug.ilike.%${search}%)`;
  }

  if (params.sourceType) {
    filters.source_type = `eq.${params.sourceType}`;
  }

  if (params.hinoId?.trim()) {
    filters.hino_id = `eq.${params.hinoId.trim()}`;
  }

  if (typeof params.hinarioNumero === 'number') {
    filters.hinario_numero = `eq.${params.hinarioNumero}`;
  }

  if (params.onlyActive !== undefined) {
    filters.is_active = `eq.${params.onlyActive}`;
  }

  if (params.onlyIndexable !== undefined) {
    filters.is_indexable = `eq.${params.onlyIndexable}`;
  }

  if (params.limit) {
    filters.limit = String(params.limit);
  }

  if (params.offset) {
    filters.offset = String(params.offset);
  }

  const rows = await supabaseFetch<any>('cifra_songs', filters);
  return rows.map(mapCifraSongRow);
}

export async function fetchCifraSongById(id: string): Promise<CifraSong | null> {
  const rows = await supabaseFetch<any>('cifra_songs', {
    id: `eq.${id}`,
    select: '*',
    limit: '1',
  });

  return rows[0] ? mapCifraSongRow(rows[0]) : null;
}

export async function fetchCifraSongByCanonicalSlug(canonicalSlug: string): Promise<CifraSong | null> {
  const rows = await supabaseFetch<any>('cifra_songs', {
    canonical_slug: `eq.${generateSlug(canonicalSlug)}`,
    select: '*',
    limit: '1',
  });

  return rows[0] ? mapCifraSongRow(rows[0]) : null;
}

export async function createCifraSong(data: CreateCifraSongInput): Promise<CifraSong | null> {
  const payload = buildSongPayload(data);
  const row = await supabaseInsert<any>('cifra_songs', payload);
  return row ? mapCifraSongRow(row) : null;
}

export async function updateCifraSong(id: string, data: UpdateCifraSongInput): Promise<CifraSong | null> {
  const payload = buildSongPayload(data);
  const rows = await supabaseUpdate<any>('cifra_songs', { id: `eq.${id}` }, payload);
  return rows[0] ? mapCifraSongRow(rows[0]) : null;
}
