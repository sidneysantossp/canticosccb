import {
  createCifraSong,
  fetchAllCifraSongs,
  fetchCifraSongById as fetchCifraSongByIdInternal,
} from '@/lib/cifras-v2/cifraSongsRepository';
import {
  fetchAllCifraVersions,
  fetchAllPublicCifraCatalog,
  createCifraVersion,
  fetchCifraVersionById as fetchCifraVersionByIdInternal,
  updateCifraVersion,
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
  eligibleCatalogVersions: number;
  pendingCatalogVersions: number;
  catalogCoveragePercent: number;
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
    fetchAllCifraSongs({}, { authenticated: true, pageSize: 250 }),
    fetchAllCifraVersions({}, { authenticated: true, pageSize: 250 }),
    fetchAllPublicCifraCatalog({}, { pageSize: 250 }),
  ]);
  const publicVersionIds = new Set(publicCatalog.map((item) => item.version_id));
  const eligibleCatalogVersions = versions.filter(
    (version) =>
      version.status === 'published' &&
      version.is_searchable &&
      version.is_active &&
      version.sections_count > 0,
  ).length;
  const pendingCatalogVersions = versions.filter(
    (version) =>
      version.status === 'published' &&
      version.is_searchable &&
      version.is_active &&
      version.sections_count > 0 &&
      !publicVersionIds.has(version.id),
  ).length;
  const catalogCoveragePercent =
    eligibleCatalogVersions > 0
      ? Math.round(((eligibleCatalogVersions - pendingCatalogVersions) / eligibleCatalogVersions) * 100)
      : 100;

  return {
    songsTotal: songs.length,
    versionsTotal: versions.length,
    publishedVersions: versions.filter((version) => version.status === 'published').length,
    searchableVersions: versions.filter((version) => version.is_searchable).length,
    publicCatalogItems: publicCatalog.length,
    eligibleCatalogVersions,
    pendingCatalogVersions,
    catalogCoveragePercent,
    versionsWithSections: versions.filter((version) => version.sections_count > 0).length,
    versionsWithStudyDefaults: versions.filter(
      (version) =>
        Boolean(version.default_study_section_order) ||
        version.default_study_sync_audio ||
        version.default_study_loop_section,
    ).length,
  };
}

export async function setCifraVersionSearchable(versionId: string, isSearchable: boolean) {
  return updateCifraVersion(versionId, { isSearchable });
}

export async function promoteCifraVersionToCatalog(versionId: string) {
  const version = await fetchCifraVersionById(versionId);
  if (!version) {
    throw new Error('Versão V2 não encontrada.');
  }

  if (version.sections_count <= 0) {
    throw new Error('A versão não possui seções publicáveis. Abra o editor V2 antes de enviar ao catálogo.');
  }

  if (version.status !== 'published') {
    const sections = await fetchCifraVersionSections(versionId);
    if (sections.length === 0) {
      throw new Error('A versão não possui seções persistidas. Abra o editor V2 antes de publicar.');
    }

    return publishCifraVersion({
      versionId,
      sections: sections.map((section) => ({
        key: section.section_key,
        label: section.section_label,
        order: section.section_order,
        cueStartSeconds: section.cue_start_seconds,
        cueEndSeconds: section.cue_end_seconds,
        loopStartSeconds: section.loop_start_seconds,
        loopEndSeconds: section.loop_end_seconds,
        lines: section.content_ast,
      })),
      versionPatch: {
        isActive: true,
        isSearchable: true,
      },
    });
  }

  if (!version.is_searchable || !version.is_active) {
    return updateCifraVersion(versionId, {
      isSearchable: true,
      isActive: true,
    });
  }

  return version;
}
