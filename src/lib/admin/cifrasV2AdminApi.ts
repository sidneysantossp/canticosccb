import {
  createCifraSong,
  fetchCifraSongById as fetchCifraSongByIdInternal,
} from '@/lib/cifras-v2/cifraSongsRepository';
import {
  createCifraVersion,
  fetchCifraVersionById as fetchCifraVersionByIdInternal,
} from '@/lib/cifras-v2/cifraVersionsRepository';
import { fetchCifraVersionSections as fetchCifraVersionSectionsInternal } from '@/lib/cifras-v2/cifraSectionsRepository';
import {
  fetchCifraVersionChordOverrides as fetchCifraVersionChordOverridesInternal,
  type FetchCifraVersionChordOverridesOptions,
} from '@/lib/cifras-v2/cifraVersionChordOverridesRepository';

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
  resolveCifraVersionChordOverride,
  upsertCifraVersionChordOverride,
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

export { createCifraSong, createCifraVersion, type FetchCifraVersionChordOverridesOptions };

export async function fetchCifraSongById(id: string) {
  return fetchCifraSongByIdInternal(id, { authenticated: true });
}

export async function fetchCifraVersionById(id: string) {
  return fetchCifraVersionByIdInternal(id, { authenticated: true });
}

export async function fetchCifraVersionSections(versionId: string) {
  return fetchCifraVersionSectionsInternal(versionId, { authenticated: true });
}

export async function fetchCifraVersionChordOverrides(
  versionId: string,
  options: FetchCifraVersionChordOverridesOptions = {},
) {
  return fetchCifraVersionChordOverridesInternal(versionId, {
    ...options,
    authenticated: options.authenticated ?? true,
  });
}
