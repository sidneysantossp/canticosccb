export type CifraInstrument =
  | 'violao'
  | 'ukulele'
  | 'teclado'
  | 'cavaco'
  | 'baixo'
  | 'bateria'
  | 'gaita'
  | 'viola'
  | 'guitarra'
  | 'outro';

export type CifraArrangementType =
  | 'simplificada'
  | 'completa'
  | 'culto'
  | 'estudo'
  | 'instrumental'
  | 'lead_sheet'
  | 'outro';

export type CifraDifficultyLevel =
  | 'iniciante'
  | 'basico'
  | 'intermediario'
  | 'avancado';

export type CifraVersionStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'published'
  | 'archived';

export type CifraPublicationLabel =
  | 'official'
  | 'reviewed'
  | 'community';

export type CifraSourceType =
  | 'hinario'
  | 'avulso'
  | 'album'
  | 'playlist'
  | 'other';

export type CifraSectionKey =
  | 'intro'
  | 'verse'
  | 'chorus'
  | 'bridge'
  | 'ending'
  | 'turnaround'
  | 'custom';

export type CifraReviewStatus =
  | 'pending'
  | 'changes_requested'
  | 'approved'
  | 'rejected';

export type CifraReportType =
  | 'wrong_chord'
  | 'wrong_key'
  | 'formatting'
  | 'duplicate'
  | 'copyright'
  | 'other';

export type CifraReportStatus =
  | 'open'
  | 'triaged'
  | 'resolved'
  | 'dismissed';

export type CifraUsageEventType =
  | 'view'
  | 'share'
  | 'print';

export interface CifraSong {
  id: string;
  canonical_slug: string;
  title: string;
  subtitle?: string | null;
  composer_name?: string | null;
  hino_id?: string | null;
  hinario_numero?: number | null;
  source_type: CifraSourceType;
  liturgical_context?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  cover_url?: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  is_indexable: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CifraVersion {
  id: string;
  song_id: string;
  public_slug: string;
  title: string;
  instrument: CifraInstrument;
  arrangement_type: CifraArrangementType;
  difficulty_level: CifraDifficultyLevel;
  tuning: string;
  capo: number;
  original_key: string;
  preferred_key?: string | null;
  tempo_bpm?: number | null;
  time_signature?: string | null;
  intro_notes?: string | null;
  default_study_section_order?: number | null;
  default_study_sync_audio: boolean;
  default_study_loop_section: boolean;
  body_text: string;
  body_ast: CifraDocumentAst;
  chords_index: string[];
  sections_count: number;
  lines_count: number;
  status: CifraVersionStatus;
  publication_label: CifraPublicationLabel;
  is_primary: boolean;
  is_active: boolean;
  is_searchable: boolean;
  views_count: number;
  shares_count: number;
  prints_count: number;
  favorites_count: number;
  reports_count: number;
  open_reports_count: number;
  last_interaction_at?: string | null;
  published_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CifraVersionSection {
  id: string;
  version_id: string;
  section_order: number;
  section_key: CifraSectionKey;
  section_label: string;
  cue_start_seconds?: number | null;
  cue_end_seconds?: number | null;
  loop_start_seconds?: number | null;
  loop_end_seconds?: number | null;
  content_ast: CifraLineNode[];
  section?: { section_label?: string } | null;
  plain_text: string;
  chords_index: string[];
  created_at: string;
  updated_at: string;
}

export interface CifraChordShape {
  id: string;
  instrument: CifraInstrument;
  chord_name: string;
  variation_name: string;
  fingering: Record<string, unknown>;
  base_fret: number;
  priority: number;
  is_left_handed_supported: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CifraVersionChordOverride {
  id: string;
  version_id: string;
  chord_name: string;
  applies_to_key?: string | null;
  preferred_shape_id: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CifraRevisionHistory {
  id: string;
  version_id: string;
  revision_number: number;
  change_summary?: string | null;
  snapshot: Record<string, unknown>;
  created_by?: string | null;
  created_at: string;
}

export interface CifraReviewQueueItem {
  id: string;
  version_id: string;
  status: CifraReviewStatus;
  reviewer_id?: string | null;
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CifraReport {
  id: string;
  version_id: string;
  report_type: CifraReportType;
  message: string;
  reporter_email?: string | null;
  reporter_user_id?: string | null;
  status: CifraReportStatus;
  created_at: string;
  updated_at: string;
}

export interface CifraFavorite {
  id: string;
  version_id: string;
  user_id: string;
  created_at: string;
}

export interface CifraUsageEvent {
  id: string;
  version_id: string;
  event_type: CifraUsageEventType;
  session_key?: string | null;
  user_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CifraPublicCatalogItem {
  version_id: string;
  public_slug: string;
  version_title: string;
  instrument: CifraInstrument;
  arrangement_type: CifraArrangementType;
  difficulty_level: CifraDifficultyLevel;
  original_key: string;
  preferred_key?: string | null;
  capo: number;
  tempo_bpm?: number | null;
  time_signature?: string | null;
  default_study_section_order?: number | null;
  default_study_sync_audio: boolean;
  default_study_loop_section: boolean;
  publication_label: CifraPublicationLabel;
  is_primary: boolean;
  published_at?: string | null;
  song_id: string;
  song_slug: string;
  song_title: string;
  song_subtitle?: string | null;
  composer_name?: string | null;
  hino_id?: string | null;
  hinario_numero?: number | null;
  source_type: CifraSourceType;
  cover_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  views_count: number;
  shares_count: number;
  prints_count: number;
  favorites_count: number;
  reports_count: number;
  open_reports_count: number;
  last_interaction_at?: string | null;
  sections_count: number;
  lines_count: number;
  chords_index: string[];
}

export interface CifraDocumentAst {
  sections: CifraSectionNode[];
}

export interface CifraSectionNode {
  key: CifraSectionKey;
  label: string;
  order: number;
  cueStartSeconds?: number | null;
  cueEndSeconds?: number | null;
  loopStartSeconds?: number | null;
  loopEndSeconds?: number | null;
  lines: CifraLineNode[];
}

export interface CifraLineNode {
  type: 'lyric' | 'chord_line' | 'annotation' | 'mixed';
  text?: string;
  segments?: CifraSegmentNode[];
}

export interface CifraSegmentNode {
  chord?: string;
  lyric?: string;
  beat?: number;
}

export const CIFRA_V2_INSTRUMENTS: { value: CifraInstrument; label: string }[] = [
  { value: 'violao', label: 'Violao' },
  { value: 'ukulele', label: 'Ukulele' },
  { value: 'teclado', label: 'Teclado' },
  { value: 'cavaco', label: 'Cavaco' },
  { value: 'baixo', label: 'Baixo' },
  { value: 'bateria', label: 'Bateria' },
  { value: 'gaita', label: 'Gaita' },
  { value: 'viola', label: 'Viola caipira' },
  { value: 'guitarra', label: 'Guitarra' },
  { value: 'outro', label: 'Outro' },
];

export const CIFRA_V2_ARRANGEMENTS: { value: CifraArrangementType; label: string }[] = [
  { value: 'simplificada', label: 'Simplificada' },
  { value: 'completa', label: 'Completa' },
  { value: 'culto', label: 'Culto' },
  { value: 'estudo', label: 'Estudo' },
  { value: 'instrumental', label: 'Instrumental' },
  { value: 'lead_sheet', label: 'Lead Sheet' },
  { value: 'outro', label: 'Outro' },
];

export const CIFRA_V2_STATUS: { value: CifraVersionStatus; label: string }[] = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'in_review', label: 'Em revisao' },
  { value: 'approved', label: 'Aprovada' },
  { value: 'published', label: 'Publicada' },
  { value: 'archived', label: 'Arquivada' },
];
