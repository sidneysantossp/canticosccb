import {
  createCifraSong,
  fetchCifraSongs as fetchCifraSongsInternal,
  fetchCifraSongById as fetchCifraSongByIdInternal,
} from '@/lib/cifras-v2/cifraSongsRepository';
import {
  createCifraVersion,
  fetchCifraVersions as fetchCifraVersionsInternal,
  fetchPublicCifraCatalog,
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

export interface CifraV2RolloutStats {
  songsTotal: number;
  versionsTotal: number;
  publishedVersions: number;
  searchableVersions: number;
  publicCatalogItems: number;
  versionsWithSections: number;
  versionsWithStudyDefaults: number;
}

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

export async function fetchCifraV2RolloutStats(): Promise<CifraV2RolloutStats> {
  const [songs, versions, publicCatalog] = await Promise.all([
    fetchCifraSongsInternal({ limit: 1000 }, { authenticated: true }),
    fetchCifraVersionsInternal({ limit: 1000 }, { authenticated: true }),
    fetchPublicCifraCatalog({ limit: 1000 }),
  ]);

  return {
    songsTotal: songs.length,
    versionsTotal: versions.length,
    publishedVersions: versions.filter((version) => version.status === 'published').length,
    searchableVersions: versions.filter((version) => version.is_searchable).length,
    publicCatalogItems: publicCatalog.length,
    versionsWithSections: versions.filter((version) => version.sections_count > 0).length,
    versionsWithStudyDefaults: versions.filter(
      (version) =>
        Boolean(version.default_study_section_order) ||
        version.default_study_sync_audio ||
        version.default_study_loop_section,
    ).length,
  };
}
