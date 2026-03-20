export {
  createCifraChordShape,
  deleteCifraChordShape,
  fetchCifraChordShapeById,
  fetchCifraChordShapes,
  fetchCifraChordShapeVariants,
  prioritizeCifraChordShape,
  syncCifraChordShapePresets,
  updateCifraChordShape,
  type FetchCifraChordShapesParams,
  type PrioritizeCifraChordShapeResult,
  type SyncCifraChordShapePresetsResult,
  type UpsertCifraChordShapeInput,
} from '@/lib/cifras-v2/cifraChordShapesRepository';
export {
  deleteCifraVersionChordOverride,
  fetchCifraVersionChordOverrides,
  resolveCifraVersionChordOverride,
  upsertCifraVersionChordOverride,
  type FetchCifraVersionChordOverridesOptions,
  type UpsertCifraVersionChordOverrideInput,
} from '@/lib/cifras-v2/cifraVersionChordOverridesRepository';
export {
  CIFRA_CHORD_PRESET_GROUPS,
  findCifraChordShapePreset,
  findCifraChordShapePresetMatch,
  type CifraChordPresetGroup,
  type CifraChordShapePresetMatch,
  type CifraChordShapePresetMatchStrategy,
  type CifraChordShapePreset,
} from '@/lib/cifras-v2/chordShapePresets';
export {
  buildLegacyCifraMigrationPreview,
  fetchLegacyCifraMigrationStatuses,
  migrateLegacyCifra,
  migrateLegacyCifraById,
  migrateLegacyCifrasBatch,
  previewLegacyCifraMigrationById,
  type LegacyCifraMigrationStatus,
  type LegacyCifraMigrationOptions,
  type LegacyCifraMigrationPreview,
  type LegacyCifraMigrationResult,
} from '@/lib/cifras-v2/legacyCifraMigrationService';

export { createCifraSong, fetchCifraSongById } from '@/lib/cifras-v2/cifraSongsRepository';
export { createCifraVersion, fetchCifraVersionById } from '@/lib/cifras-v2/cifraVersionsRepository';
export { fetchCifraVersionSections } from '@/lib/cifras-v2/cifraSectionsRepository';
export {
  fetchCifraEngagementSnapshot,
  fetchCifraEngagementSnapshots,
  fetchCifraReportsByVersion,
  updateCifraReportStatus,
  type CifraEngagementSnapshot,
} from '@/lib/cifras-v2/cifraEngagementApi';
export {
  saveCifraVersionDraft,
  submitCifraVersionForReview,
  publishCifraVersion,
  type CifraVersionSectionDraft,
} from '@/lib/cifras-v2/cifraPublicationService';
export { parsePlainTextSectionLines, serializeSectionLines } from '@/lib/cifras-v2/legacyCifraParser';
