import type {
  CifraChordShape,
  CifraDocumentAst,
  CifraFavorite,
  CifraLineNode,
  CifraPublicCatalogItem,
  CifraReport,
  CifraRevisionHistory,
  CifraReviewQueueItem,
  CifraSectionKey,
  CifraSectionNode,
  CifraSegmentNode,
  CifraSong,
  CifraUsageEvent,
  CifraVersion,
  CifraVersionSection,
} from '@/types/cifras-v2';

const SECTION_KEYS: CifraSectionKey[] = [
  'intro',
  'verse',
  'chorus',
  'bridge',
  'ending',
  'turnaround',
  'custom',
];

const VERSION_STATUSES = ['draft', 'in_review', 'approved', 'published', 'archived'] as const;
const PUBLICATION_LABELS = ['official', 'reviewed', 'community'] as const;
const INSTRUMENTS = ['violao', 'ukulele', 'teclado', 'cavaco', 'guitarra', 'outro'] as const;
const ARRANGEMENT_TYPES = ['simplificada', 'completa', 'culto', 'estudo', 'instrumental', 'lead_sheet', 'outro'] as const;
const DIFFICULTY_LEVELS = ['iniciante', 'basico', 'intermediario', 'avancado'] as const;
const SOURCE_TYPES = ['hinario', 'avulso', 'album', 'playlist', 'other'] as const;
const REVIEW_STATUSES = ['pending', 'changes_requested', 'approved', 'rejected'] as const;
const REPORT_TYPES = ['wrong_chord', 'wrong_key', 'formatting', 'duplicate', 'copyright', 'other'] as const;
const REPORT_STATUSES = ['open', 'triaged', 'resolved', 'dismissed'] as const;

type EnumValue = string;

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function coerceEnum<T extends readonly EnumValue[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return typeof value === 'string' && allowed.includes(value) ? (value as T[number]) : fallback;
}

function mapSegment(segment: unknown): CifraSegmentNode {
  const row = asRecord(segment);
  const beat = asNullableNumber(row.beat);

  return {
    chord: asNullableString(row.chord) ?? undefined,
    lyric: asNullableString(row.lyric) ?? undefined,
    beat: beat ?? undefined,
  };
}

export function normalizeLineNodes(value: unknown): CifraLineNode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((line): CifraLineNode => {
    const row = asRecord(line);
    const rawType = asString(row.type, 'lyric');
    const type = rawType === 'annotation' || rawType === 'chord_line' || rawType === 'mixed' ? rawType : 'lyric';
    const segments = Array.isArray(row.segments) ? row.segments.map(mapSegment) : undefined;

    return {
      type,
      text: asNullableString(row.text) ?? undefined,
      segments: segments && segments.length > 0 ? segments : undefined,
    };
  });
}

export function normalizeSectionNode(value: unknown, fallbackOrder = 1): CifraSectionNode {
  const row = asRecord(value);
  const label = asString(row.label, '').trim();

  return {
    key: coerceEnum(row.key, SECTION_KEYS, 'custom'),
    label: label || `Secao ${fallbackOrder}`,
    order: Math.max(1, asNumber(row.order, fallbackOrder)),
    lines: normalizeLineNodes(row.lines),
  };
}

export function normalizeDocumentAst(value: unknown): CifraDocumentAst {
  const row = asRecord(value);
  const sections = Array.isArray(row.sections)
    ? row.sections.map((section, index) => normalizeSectionNode(section, index + 1))
    : [];

  return {
    sections: sections.sort((left, right) => left.order - right.order),
  };
}

export function mapCifraSongRow(row: any): CifraSong {
  return {
    id: asString(row.id),
    canonical_slug: asString(row.canonical_slug),
    title: asString(row.title),
    subtitle: asNullableString(row.subtitle),
    composer_name: asNullableString(row.composer_name),
    hino_id: asNullableString(row.hino_id),
    hinario_numero: asNullableNumber(row.hinario_numero),
    source_type: coerceEnum(row.source_type, SOURCE_TYPES, 'avulso'),
    liturgical_context: asNullableString(row.liturgical_context),
    seo_title: asNullableString(row.seo_title),
    seo_description: asNullableString(row.seo_description),
    seo_keywords: asNullableString(row.seo_keywords),
    cover_url: asNullableString(row.cover_url),
    metadata: asRecord(row.metadata),
    is_active: asBoolean(row.is_active, true),
    is_indexable: asBoolean(row.is_indexable, true),
    created_by: asNullableString(row.created_by),
    updated_by: asNullableString(row.updated_by),
    created_at: asString(row.created_at, new Date().toISOString()),
    updated_at: asString(row.updated_at, new Date().toISOString()),
  };
}

export function mapCifraVersionRow(row: any): CifraVersion {
  return {
    id: asString(row.id),
    song_id: asString(row.song_id),
    public_slug: asString(row.public_slug),
    title: asString(row.title),
    instrument: coerceEnum(row.instrument, INSTRUMENTS, 'violao'),
    arrangement_type: coerceEnum(row.arrangement_type, ARRANGEMENT_TYPES, 'completa'),
    difficulty_level: coerceEnum(row.difficulty_level, DIFFICULTY_LEVELS, 'intermediario'),
    tuning: asString(row.tuning, 'standard'),
    capo: asNumber(row.capo, 0),
    original_key: asString(row.original_key, 'C'),
    preferred_key: asNullableString(row.preferred_key),
    tempo_bpm: asNullableNumber(row.tempo_bpm),
    time_signature: asNullableString(row.time_signature),
    intro_notes: asNullableString(row.intro_notes),
    body_text: asString(row.body_text),
    body_ast: normalizeDocumentAst(row.body_ast),
    chords_index: asStringArray(row.chords_index),
    sections_count: asNumber(row.sections_count, 0),
    lines_count: asNumber(row.lines_count, 0),
    status: coerceEnum(row.status, VERSION_STATUSES, 'draft'),
    publication_label: coerceEnum(row.publication_label, PUBLICATION_LABELS, 'community'),
    is_primary: asBoolean(row.is_primary, false),
    is_active: asBoolean(row.is_active, true),
    is_searchable: asBoolean(row.is_searchable, true),
    views_count: asNumber(row.views_count, 0),
    shares_count: asNumber(row.shares_count, 0),
    prints_count: asNumber(row.prints_count, 0),
    favorites_count: asNumber(row.favorites_count, 0),
    reports_count: asNumber(row.reports_count, 0),
    open_reports_count: asNumber(row.open_reports_count, 0),
    last_interaction_at: asNullableString(row.last_interaction_at),
    published_at: asNullableString(row.published_at),
    created_by: asNullableString(row.created_by),
    updated_by: asNullableString(row.updated_by),
    created_at: asString(row.created_at, new Date().toISOString()),
    updated_at: asString(row.updated_at, new Date().toISOString()),
  };
}

export function mapCifraVersionSectionRow(row: any): CifraVersionSection {
  return {
    id: asString(row.id),
    version_id: asString(row.version_id),
    section_order: asNumber(row.section_order, 1),
    section_key: coerceEnum(row.section_key, SECTION_KEYS, 'custom'),
    section_label: asString(row.section_label),
    content_ast: normalizeLineNodes(row.content_ast),
    plain_text: asString(row.plain_text),
    chords_index: asStringArray(row.chords_index),
    created_at: asString(row.created_at, new Date().toISOString()),
    updated_at: asString(row.updated_at, new Date().toISOString()),
  };
}

export function mapCifraChordShapeRow(row: any): CifraChordShape {
  return {
    id: asString(row.id),
    instrument: coerceEnum(row.instrument, INSTRUMENTS, 'violao'),
    chord_name: asString(row.chord_name),
    variation_name: asString(row.variation_name, 'default'),
    fingering: asRecord(row.fingering),
    base_fret: asNumber(row.base_fret, 1),
    priority: asNumber(row.priority, 0),
    is_left_handed_supported: asBoolean(row.is_left_handed_supported, false),
    is_active: asBoolean(row.is_active, true),
    created_at: asString(row.created_at, new Date().toISOString()),
    updated_at: asString(row.updated_at, new Date().toISOString()),
  };
}

export function mapCifraRevisionHistoryRow(row: any): CifraRevisionHistory {
  return {
    id: asString(row.id),
    version_id: asString(row.version_id),
    revision_number: asNumber(row.revision_number, 1),
    change_summary: asNullableString(row.change_summary),
    snapshot: asRecord(row.snapshot),
    created_by: asNullableString(row.created_by),
    created_at: asString(row.created_at, new Date().toISOString()),
  };
}

export function mapCifraReviewQueueRow(row: any): CifraReviewQueueItem {
  return {
    id: asString(row.id),
    version_id: asString(row.version_id),
    status: coerceEnum(row.status, REVIEW_STATUSES, 'pending'),
    reviewer_id: asNullableString(row.reviewer_id),
    review_notes: asNullableString(row.review_notes),
    created_at: asString(row.created_at, new Date().toISOString()),
    updated_at: asString(row.updated_at, new Date().toISOString()),
  };
}

export function mapCifraReportRow(row: any): CifraReport {
  return {
    id: asString(row.id),
    version_id: asString(row.version_id),
    report_type: coerceEnum(row.report_type, REPORT_TYPES, 'other'),
    message: asString(row.message),
    reporter_email: asNullableString(row.reporter_email),
    reporter_user_id: asNullableString(row.reporter_user_id),
    status: coerceEnum(row.status, REPORT_STATUSES, 'open'),
    created_at: asString(row.created_at, new Date().toISOString()),
    updated_at: asString(row.updated_at, new Date().toISOString()),
  };
}

export function mapCifraFavoriteRow(row: any): CifraFavorite {
  return {
    id: asString(row.id),
    version_id: asString(row.version_id),
    user_id: asString(row.user_id),
    created_at: asString(row.created_at, new Date().toISOString()),
  };
}

export function mapCifraUsageEventRow(row: any): CifraUsageEvent {
  return {
    id: asString(row.id),
    version_id: asString(row.version_id),
    event_type: coerceEnum(row.event_type, ['view', 'share', 'print'] as const, 'view'),
    session_key: asNullableString(row.session_key),
    user_id: asNullableString(row.user_id),
    metadata: asRecord(row.metadata),
    created_at: asString(row.created_at, new Date().toISOString()),
  };
}

export function mapCifraPublicCatalogRow(row: any): CifraPublicCatalogItem {
  return {
    version_id: asString(row.version_id),
    public_slug: asString(row.public_slug),
    version_title: asString(row.version_title),
    instrument: coerceEnum(row.instrument, INSTRUMENTS, 'violao'),
    arrangement_type: coerceEnum(row.arrangement_type, ARRANGEMENT_TYPES, 'completa'),
    difficulty_level: coerceEnum(row.difficulty_level, DIFFICULTY_LEVELS, 'intermediario'),
    original_key: asString(row.original_key, 'C'),
    preferred_key: asNullableString(row.preferred_key),
    capo: asNumber(row.capo, 0),
    tempo_bpm: asNullableNumber(row.tempo_bpm),
    time_signature: asNullableString(row.time_signature),
    publication_label: coerceEnum(row.publication_label, PUBLICATION_LABELS, 'community'),
    is_primary: asBoolean(row.is_primary, false),
    published_at: asNullableString(row.published_at),
    song_id: asString(row.song_id),
    song_slug: asString(row.song_slug),
    song_title: asString(row.song_title),
    song_subtitle: asNullableString(row.song_subtitle),
    composer_name: asNullableString(row.composer_name),
    hino_id: asNullableString(row.hino_id),
    hinario_numero: asNullableNumber(row.hinario_numero),
    source_type: coerceEnum(row.source_type, SOURCE_TYPES, 'avulso'),
    cover_url: asNullableString(row.cover_url),
    seo_title: asNullableString(row.seo_title),
    seo_description: asNullableString(row.seo_description),
    seo_keywords: asNullableString(row.seo_keywords),
    views_count: asNumber(row.views_count, 0),
    shares_count: asNumber(row.shares_count, 0),
    prints_count: asNumber(row.prints_count, 0),
    favorites_count: asNumber(row.favorites_count, 0),
    reports_count: asNumber(row.reports_count, 0),
    open_reports_count: asNumber(row.open_reports_count, 0),
    last_interaction_at: asNullableString(row.last_interaction_at),
    sections_count: asNumber(row.sections_count, 0),
    lines_count: asNumber(row.lines_count, 0),
    chords_index: asStringArray(row.chords_index),
  };
}
