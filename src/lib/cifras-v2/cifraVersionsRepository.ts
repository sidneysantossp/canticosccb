import { supabaseAuthFetch, supabaseFetch, supabaseInsert, supabaseUpdate } from '@/lib/supabaseRest';
import { generateSlug } from '@/lib/utils/slugUtils';
import type {
  CifraArrangementType,
  CifraDifficultyLevel,
  CifraDocumentAst,
  CifraInstrument,
  CifraPublicCatalogItem,
  CifraPublicationLabel,
  CifraVersion,
  CifraVersionStatus,
} from '@/types/cifras-v2';

import { mapCifraPublicCatalogRow, mapCifraVersionRow } from './mappers';

export interface FetchCifraVersionsParams {
  songId?: string;
  search?: string;
  instrument?: CifraInstrument;
  arrangementType?: CifraArrangementType;
  status?: CifraVersionStatus;
  publicationLabel?: CifraPublicationLabel;
  isPrimary?: boolean;
  onlyActive?: boolean;
  onlySearchable?: boolean;
  limit?: number;
  offset?: number;
}

export interface FetchCifraVersionsOptions {
  authenticated?: boolean;
}

interface FetchAllCifraVersionsOptions extends FetchCifraVersionsOptions {
  pageSize?: number;
}

interface FetchAllCifraPublicCatalogOptions {
  pageSize?: number;
}

export interface CreateCifraVersionInput {
  songId: string;
  publicSlug?: string;
  title: string;
  instrument: CifraInstrument;
  arrangementType?: CifraArrangementType;
  difficultyLevel?: CifraDifficultyLevel;
  tuning?: string;
  capo?: number;
  originalKey?: string;
  preferredKey?: string | null;
  tempoBpm?: number | null;
  timeSignature?: string | null;
  introNotes?: string | null;
  defaultStudySectionOrder?: number | null;
  defaultStudySyncAudio?: boolean;
  defaultStudyLoopSection?: boolean;
  bodyText?: string;
  bodyAst?: CifraDocumentAst;
  chordsIndex?: string[];
  sectionsCount?: number;
  linesCount?: number;
  status?: CifraVersionStatus;
  publicationLabel?: CifraPublicationLabel;
  isPrimary?: boolean;
  isActive?: boolean;
  isSearchable?: boolean;
  publishedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export type UpdateCifraVersionInput = Partial<CreateCifraVersionInput>;

function buildVersionSlug(data: CreateCifraVersionInput | UpdateCifraVersionInput): string {
  if (data.publicSlug?.trim()) {
    return generateSlug(data.publicSlug);
  }

  const parts = [data.title ?? '', data.instrument ?? 'violao'];
  if (data.arrangementType && data.arrangementType !== 'completa') {
    parts.push(data.arrangementType);
  }

  return generateSlug(parts.filter(Boolean).join(' '));
}

function buildVersionPayload(data: CreateCifraVersionInput | UpdateCifraVersionInput) {
  const payload: Record<string, unknown> = {};

  if (data.songId !== undefined) payload.song_id = data.songId;
  if (data.publicSlug !== undefined || data.title !== undefined || data.instrument !== undefined || data.arrangementType !== undefined) {
    payload.public_slug = buildVersionSlug(data);
  }
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.instrument !== undefined) payload.instrument = data.instrument;
  if (data.arrangementType !== undefined) payload.arrangement_type = data.arrangementType;
  if (data.difficultyLevel !== undefined) payload.difficulty_level = data.difficultyLevel;
  if (data.tuning !== undefined) payload.tuning = data.tuning?.trim() || 'standard';
  if (data.capo !== undefined) payload.capo = data.capo;
  if (data.originalKey !== undefined) payload.original_key = data.originalKey?.trim() || 'C';
  if (data.preferredKey !== undefined) payload.preferred_key = data.preferredKey?.trim() || null;
  if (data.tempoBpm !== undefined) payload.tempo_bpm = data.tempoBpm ?? null;
  if (data.timeSignature !== undefined) payload.time_signature = data.timeSignature?.trim() || null;
  if (data.introNotes !== undefined) payload.intro_notes = data.introNotes?.trim() || null;
  if (data.defaultStudySectionOrder !== undefined) payload.default_study_section_order = data.defaultStudySectionOrder ?? null;
  if (data.defaultStudySyncAudio !== undefined) payload.default_study_sync_audio = data.defaultStudySyncAudio;
  if (data.defaultStudyLoopSection !== undefined) payload.default_study_loop_section = data.defaultStudyLoopSection;
  if (data.bodyText !== undefined) payload.body_text = data.bodyText;
  if (data.bodyAst !== undefined) payload.body_ast = data.bodyAst;
  if (data.chordsIndex !== undefined) payload.chords_index = data.chordsIndex;
  if (data.sectionsCount !== undefined) payload.sections_count = data.sectionsCount;
  if (data.linesCount !== undefined) payload.lines_count = data.linesCount;
  if (data.status !== undefined) payload.status = data.status;
  if (data.publicationLabel !== undefined) payload.publication_label = data.publicationLabel;
  if (data.isPrimary !== undefined) payload.is_primary = data.isPrimary;
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  if (data.isSearchable !== undefined) payload.is_searchable = data.isSearchable;
  if (data.publishedAt !== undefined) payload.published_at = data.publishedAt ?? null;
  if (data.createdBy !== undefined) payload.created_by = data.createdBy ?? null;
  if (data.updatedBy !== undefined) payload.updated_by = data.updatedBy ?? null;

  return payload;
}

export async function fetchCifraVersions(
  params: FetchCifraVersionsParams = {},
  options: FetchCifraVersionsOptions = {},
): Promise<CifraVersion[]> {
  const filters: Record<string, string> = {
    select: '*',
    order: 'is_primary.desc,published_at.desc.nullslast,created_at.desc',
  };

  if (params.songId) {
    filters.song_id = `eq.${params.songId}`;
  }

  if (params.search?.trim()) {
    const search = params.search.trim();
    filters.or = `(title.ilike.%${search}%,public_slug.ilike.%${search}%)`;
  }

  if (params.instrument) {
    filters.instrument = `eq.${params.instrument}`;
  }

  if (params.arrangementType) {
    filters.arrangement_type = `eq.${params.arrangementType}`;
  }

  if (params.status) {
    filters.status = `eq.${params.status}`;
  }

  if (params.publicationLabel) {
    filters.publication_label = `eq.${params.publicationLabel}`;
  }

  if (params.isPrimary !== undefined) {
    filters.is_primary = `eq.${params.isPrimary}`;
  }

  if (params.onlyActive !== undefined) {
    filters.is_active = `eq.${params.onlyActive}`;
  }

  if (params.onlySearchable !== undefined) {
    filters.is_searchable = `eq.${params.onlySearchable}`;
  }

  if (params.limit) {
    filters.limit = String(params.limit);
  }

  if (params.offset) {
    filters.offset = String(params.offset);
  }

  const fetcher = options.authenticated ? supabaseAuthFetch : supabaseFetch;
  const rows = await fetcher<any>('cifra_versions', filters);
  return rows.map(mapCifraVersionRow);
}

export async function fetchAllCifraVersions(
  params: Omit<FetchCifraVersionsParams, 'limit' | 'offset'> = {},
  options: FetchAllCifraVersionsOptions = {},
): Promise<CifraVersion[]> {
  const pageSize = Math.max(50, Math.min(options.pageSize ?? 200, 500));
  const allVersions: CifraVersion[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchCifraVersions(
      {
        ...params,
        limit: pageSize,
        offset,
      },
      options,
    );

    allVersions.push(...page);

    if (page.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return allVersions;
}

export async function fetchCifraVersionById(
  id: string,
  options: FetchCifraVersionsOptions = {},
): Promise<CifraVersion | null> {
  const fetcher = options.authenticated ? supabaseAuthFetch : supabaseFetch;
  const rows = await fetcher<any>('cifra_versions', {
    id: `eq.${id}`,
    select: '*',
    limit: '1',
  });

  return rows[0] ? mapCifraVersionRow(rows[0]) : null;
}

export async function fetchCifraVersionByPublicSlug(
  publicSlug: string,
  options: FetchCifraVersionsOptions = {},
): Promise<CifraVersion | null> {
  const fetcher = options.authenticated ? supabaseAuthFetch : supabaseFetch;
  const rows = await fetcher<any>('cifra_versions', {
    public_slug: `eq.${generateSlug(publicSlug)}`,
    select: '*',
    limit: '1',
  });

  return rows[0] ? mapCifraVersionRow(rows[0]) : null;
}

export async function fetchPublicCifraCatalog(params: {
  search?: string;
  instrument?: CifraInstrument;
  sourceType?: string;
  hinarioNumero?: number;
  songId?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<CifraPublicCatalogItem[]> {
  const filters: Record<string, string> = {
    select: [
      'version_id', 'public_slug', 'version_title', 'instrument',
      'arrangement_type', 'difficulty_level', 'original_key', 'preferred_key',
      'capo', 'tempo_bpm', 'time_signature', 'publication_label',
      'is_primary', 'published_at', 'song_id', 'song_slug', 'song_title',
      'song_subtitle', 'composer_name', 'hino_id', 'hinario_numero', 'source_type',
      'cover_url', 'seo_title', 'seo_description', 'seo_keywords', 'views_count',
      'shares_count', 'prints_count', 'favorites_count', 'reports_count',
      'open_reports_count', 'last_interaction_at', 'sections_count', 'lines_count',
      'chords_index',
    ].join(','),
  };

  if (params.search?.trim()) {
    const search = params.search.trim();
    filters.or = `(song_title.ilike.%${search}%,composer_name.ilike.%${search}%,version_title.ilike.%${search}%,song_slug.ilike.%${search}%)`;
  }

  if (params.instrument) {
    filters.instrument = `eq.${params.instrument}`;
  }

  if (params.sourceType) {
    filters.source_type = `eq.${params.sourceType}`;
  }

  if (typeof params.hinarioNumero === 'number') {
    filters.hinario_numero = `eq.${params.hinarioNumero}`;
  }

  if (params.songId) {
    filters.song_id = `eq.${params.songId}`;
  }

  if (params.limit) {
    filters.limit = String(params.limit);
  }

  if (params.offset) {
    filters.offset = String(params.offset);
  }

  const rows = await supabaseFetch<any>('cifra_public_catalog', filters);
  return rows.map(mapCifraPublicCatalogRow);
}

export async function fetchAllPublicCifraCatalog(
  params: Omit<Parameters<typeof fetchPublicCifraCatalog>[0], 'limit' | 'offset'> = {},
  options: FetchAllCifraPublicCatalogOptions = {},
): Promise<CifraPublicCatalogItem[]> {
  const pageSize = Math.max(50, Math.min(options.pageSize ?? 200, 500));
  const allItems: CifraPublicCatalogItem[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchPublicCifraCatalog({
      ...params,
      limit: pageSize,
      offset,
    });

    allItems.push(...page);

    if (page.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return allItems;
}

export async function fetchPublicCifraCatalogBySlug(publicSlug: string): Promise<CifraPublicCatalogItem | null> {
  const rows = await supabaseFetch<any>('cifra_public_catalog', {
    public_slug: `eq.${generateSlug(publicSlug)}`,
    select: '*',
    limit: '1',
  });

  return rows[0] ? mapCifraPublicCatalogRow(rows[0]) : null;
}

export async function createCifraVersion(data: CreateCifraVersionInput): Promise<CifraVersion | null> {
  const row = await supabaseInsert<any>('cifra_versions', buildVersionPayload(data));
  return row ? mapCifraVersionRow(row) : null;
}

export async function updateCifraVersion(id: string, data: UpdateCifraVersionInput): Promise<CifraVersion | null> {
  const rows = await supabaseUpdate<any>('cifra_versions', { id: `eq.${id}` }, buildVersionPayload(data));
  return rows[0] ? mapCifraVersionRow(rows[0]) : null;
}
