import {
  fetchCifraById,
  fetchCifras,
  type Cifra as LegacyCifra,
} from '@/api/cifras';
import { extractHymnNumber } from '@/lib/hymnConnectionsApi';
import { generateSlug } from '@/lib/utils/slugUtils';
import type {
  CifraArrangementType,
  CifraInstrument,
  CifraPublicationLabel,
  CifraSong,
  CifraSourceType,
  CifraVersionStatus,
  CifraVersion,
} from '@/types/cifras-v2';

import {
  buildCifraPublicationSnapshot,
  publishCifraVersion,
  saveCifraVersionDraft,
  type CifraVersionSectionDraft,
} from './cifraPublicationService';
import {
  createCifraSong,
  fetchAllCifraSongs,
  fetchCifraSongByCanonicalSlug,
  fetchCifraSongs,
  updateCifraSong,
} from './cifraSongsRepository';
import {
  createCifraVersion,
  fetchAllCifraVersions,
  fetchAllPublicCifraCatalog,
  fetchCifraVersions,
} from './cifraVersionsRepository';
import { parseLegacyCifraContent } from './legacyCifraParser';
import {
  auditLegacyCifraContent,
  type LegacyCifraQualityReport,
} from './legacyCifraQuality';

export interface LegacyCifraMigrationPreview {
  legacy: LegacyCifra;
  inferred: {
    canonicalSlug: string;
    publicSlug: string;
    hinarioNumero: number | null;
    sourceType: CifraSourceType;
    arrangementType: CifraArrangementType;
    publicationLabel: CifraPublicationLabel;
    sectionsCount: number;
    linesCount: number;
    chordsIndex: string[];
  };
  sections: CifraVersionSectionDraft[];
  quality: LegacyCifraQualityReport;
}

export interface LegacyCifraMigrationOptions {
  actorId?: string | null;
  publishActive?: boolean;
  forceSongRefresh?: boolean;
  markAsPrimary?: boolean;
  qualityApproved?: boolean;
}

export interface LegacyCifraMigrationResult {
  legacyId: number;
  song: CifraSong;
  version: CifraVersion;
  wasSongCreated: boolean;
  wasVersionCreated: boolean;
  status: 'draft' | 'published';
}

export interface LegacyCifraMigrationStatus {
  legacyId: number;
  songId: string;
  songSlug: string;
  versionId: string | null;
  versionSlug: string | null;
  versionStatus: CifraVersionStatus | null;
  versionIsPrimary: boolean;
  versionIsSearchable: boolean;
  publicCatalogVisible: boolean;
  sectionsCount: number;
  hasStudyDefaults: boolean;
  publicPath: string | null;
  migratedAt: string | null;
}

function toNumericLegacyId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function extractLegacyIdsFromSong(song: CifraSong): number[] {
  const metadata = song.metadata ?? {};
  const collected: number[] = [];

  const direct = toNumericLegacyId(metadata.legacy_cifra_id);
  if (direct) {
    collected.push(direct);
  }

  const list = metadata.legacy_cifra_ids;
  if (Array.isArray(list)) {
    for (const entry of list) {
      const parsed = toNumericLegacyId(entry);
      if (parsed) {
        collected.push(parsed);
      }
    }
  }

  return Array.from(new Set(collected));
}

function buildPreferredVersion(versions: CifraVersion[]): CifraVersion | null {
  if (versions.length === 0) {
    return null;
  }

  return (
    versions.find((version) => version.is_primary) ??
    versions.find((version) => version.status === 'published') ??
    versions[0]
  );
}

function getStatusScore(status: LegacyCifraMigrationStatus): number {
  if (status.publicCatalogVisible) return 400;
  if (status.versionStatus === 'published' && status.versionIsSearchable) return 320;
  if (status.versionStatus === 'published') return 300;
  if (status.versionStatus === 'approved') return 240;
  if (status.versionStatus === 'in_review') return 220;
  if (status.versionId) return 180;
  return 100;
}

function pickBestStatus(
  current: LegacyCifraMigrationStatus | undefined,
  candidate: LegacyCifraMigrationStatus,
): LegacyCifraMigrationStatus {
  if (!current) {
    return candidate;
  }

  const currentScore = getStatusScore(current);
  const candidateScore = getStatusScore(candidate);
  if (candidateScore !== currentScore) {
    return candidateScore > currentScore ? candidate : current;
  }

  const currentDate = current.migratedAt ? new Date(current.migratedAt).getTime() : 0;
  const candidateDate = candidate.migratedAt ? new Date(candidate.migratedAt).getTime() : 0;
  if (candidateDate !== currentDate) {
    return candidateDate > currentDate ? candidate : current;
  }

  return current;
}

function buildSongCanonicalSlug(legacy: LegacyCifra, hinarioNumero: number | null): string {
  if (hinarioNumero) {
    return generateSlug(`hino-${hinarioNumero}-${legacy.title}`);
  }

  return generateSlug(legacy.slug || legacy.title);
}

function buildVersionPublicSlug(
  songSlug: string,
  instrument: CifraInstrument,
  arrangementType: CifraArrangementType,
  legacySlug?: string | null,
): string {
  if (legacySlug?.trim()) {
    return generateSlug(legacySlug);
  }

  const suffix = arrangementType !== 'completa' ? `-${arrangementType}` : '';
  return generateSlug(`${songSlug}-${instrument}${suffix}`);
}

function inferHinarioNumero(legacy: LegacyCifra): number | null {
  return extractHymnNumber(legacy.title) ?? null;
}

function inferSourceType(legacy: LegacyCifra, hinarioNumero: number | null): CifraSourceType {
  if (legacy.hino_id || hinarioNumero) {
    return 'hinario';
  }

  return 'avulso';
}

function inferArrangementType(legacy: LegacyCifra): CifraArrangementType {
  if (legacy.category === 'tocados') {
    return 'instrumental';
  }

  return 'completa';
}

function inferPublicationLabel(): CifraPublicationLabel {
  return 'community';
}

function buildSongSeoTitle(legacy: LegacyCifra, hinarioNumero: number | null): string {
  if (hinarioNumero) {
    return `Hino ${hinarioNumero} CCB - ${legacy.title} | Cifra`;
  }

  return `${legacy.title} | Cifra CCB`;
}

function buildSongSeoDescription(legacy: LegacyCifra, hinarioNumero: number | null): string {
  const parts = [
    hinarioNumero ? `Cifra do Hino ${hinarioNumero} CCB.` : `Cifra de ${legacy.title}.`,
    legacy.artist ? `Compositor ou referencia: ${legacy.artist}.` : '',
    legacy.instrument ? `Instrumento principal: ${legacy.instrument}.` : '',
    legacy.original_key ? `Tom original: ${legacy.original_key}.` : '',
  ];

  return parts.filter(Boolean).join(' ');
}

function buildLegacySongMetadata(legacy: LegacyCifra) {
  return {
    legacy_cifra_id: legacy.id,
    legacy_slug: legacy.slug,
    legacy_category: legacy.category,
    legacy_instrument: legacy.instrument,
    legacy_views_count: legacy.views_count,
    legacy_cover_url: legacy.cover_url,
    migrated_from: 'cifras',
    migrated_at: new Date().toISOString(),
  };
}

async function findExistingSong(legacy: LegacyCifra, canonicalSlug: string, hinarioNumero: number | null): Promise<CifraSong | null> {
  if (legacy.hino_id) {
    const byHino = await fetchCifraSongs({ hinoId: legacy.hino_id, limit: 10 }, { authenticated: true });
    const exactLegacy = byHino.find((song) => Number(song.metadata.legacy_cifra_id) === legacy.id);
    if (exactLegacy) return exactLegacy;
    if (byHino[0]) return byHino[0];
  }

  if (hinarioNumero) {
    const byNumero = await fetchCifraSongs({ hinarioNumero, limit: 10 }, { authenticated: true });
    const exactLegacy = byNumero.find((song) => Number(song.metadata.legacy_cifra_id) === legacy.id);
    if (exactLegacy) return exactLegacy;
    const exactSlug = byNumero.find((song) => song.canonical_slug === canonicalSlug);
    if (exactSlug) return exactSlug;
  }

  return fetchCifraSongByCanonicalSlug(canonicalSlug, { authenticated: true });
}

async function ensureSongFromLegacy(
  legacy: LegacyCifra,
  options: LegacyCifraMigrationOptions,
): Promise<{ song: CifraSong; created: boolean }> {
  const hinarioNumero = inferHinarioNumero(legacy);
  const canonicalSlug = buildSongCanonicalSlug(legacy, hinarioNumero);
  const sourceType = inferSourceType(legacy, hinarioNumero);
  const metadata = buildLegacySongMetadata(legacy);
  const existingSong = await findExistingSong(legacy, canonicalSlug, hinarioNumero);

  if (existingSong) {
    if (options.forceSongRefresh) {
      const refreshedSong = await updateCifraSong(existingSong.id, {
        canonicalSlug,
        title: legacy.title,
        composerName: legacy.artist || null,
        hinoId: legacy.hino_id || null,
        hinarioNumero,
        sourceType,
        seoTitle: buildSongSeoTitle(legacy, hinarioNumero),
        seoDescription: buildSongSeoDescription(legacy, hinarioNumero),
        seoKeywords: [
          legacy.title,
          hinarioNumero ? `hino ${hinarioNumero} ccb cifra` : null,
          'cifras hinos ccb',
          legacy.instrument,
        ].filter(Boolean).join(', '),
        coverUrl: legacy.cover_url || null,
        metadata: {
          ...existingSong.metadata,
          ...metadata,
        },
        isActive: legacy.is_active,
        isIndexable: legacy.is_active,
        updatedBy: options.actorId ?? null,
      });

      return { song: refreshedSong ?? existingSong, created: false };
    }

    return { song: existingSong, created: false };
  }

  const song = await createCifraSong({
    canonicalSlug,
    title: legacy.title,
    composerName: legacy.artist || null,
    hinoId: legacy.hino_id || null,
    hinarioNumero,
    sourceType,
    seoTitle: buildSongSeoTitle(legacy, hinarioNumero),
    seoDescription: buildSongSeoDescription(legacy, hinarioNumero),
    seoKeywords: [
      legacy.title,
      hinarioNumero ? `hino ${hinarioNumero} ccb cifra` : null,
      'cifras hinos ccb',
      legacy.instrument,
    ].filter(Boolean).join(', '),
    coverUrl: legacy.cover_url || null,
    metadata,
    isActive: legacy.is_active,
    isIndexable: legacy.is_active,
    createdBy: options.actorId ?? null,
    updatedBy: options.actorId ?? null,
  });

  if (!song) {
    throw new Error(`Falha ao criar cifra_song para a cifra legada ${legacy.id}`);
  }

  return { song, created: true };
}

async function ensureVersionFromLegacy(
  legacy: LegacyCifra,
  song: CifraSong,
  options: LegacyCifraMigrationOptions,
): Promise<{ version: CifraVersion; created: boolean; arrangementType: CifraArrangementType }> {
  const arrangementType = inferArrangementType(legacy);
  const shouldPublish = legacy.is_active && options.publishActive === true && options.qualityApproved === true;
  const publicSlug = buildVersionPublicSlug(
    song.canonical_slug,
    legacy.instrument as CifraInstrument,
    arrangementType,
    legacy.slug,
  );
  const versions = await fetchCifraVersions({
    songId: song.id,
    instrument: legacy.instrument as CifraInstrument,
    limit: 20,
  }, { authenticated: true });

  const existingVersion = versions.find((version) => version.public_slug === publicSlug) || versions.find((version) => version.title === legacy.title);
  if (existingVersion) {
    return { version: existingVersion, created: false, arrangementType };
  }

  const version = await createCifraVersion({
    songId: song.id,
    publicSlug,
    title: legacy.title,
    instrument: legacy.instrument as CifraInstrument,
    arrangementType,
    difficultyLevel: 'intermediario',
    tuning: 'standard',
    capo: legacy.capo,
    originalKey: legacy.original_key || 'C',
    bodyText: '',
    bodyAst: { sections: [] },
    chordsIndex: [],
    sectionsCount: 0,
    linesCount: 0,
    status: shouldPublish ? 'published' : 'draft',
    publicationLabel: inferPublicationLabel(),
    isPrimary: options.markAsPrimary ?? true,
    isActive: legacy.is_active,
    isSearchable: shouldPublish,
    publishedAt: shouldPublish ? new Date().toISOString() : null,
    createdBy: options.actorId ?? null,
    updatedBy: options.actorId ?? null,
  });

  if (!version) {
    throw new Error(`Falha ao criar cifra_version para a cifra legada ${legacy.id}`);
  }

  return { version, created: true, arrangementType };
}

export function buildLegacyCifraMigrationPreview(legacy: LegacyCifra): LegacyCifraMigrationPreview {
  const hinarioNumero = inferHinarioNumero(legacy);
  const sourceType = inferSourceType(legacy, hinarioNumero);
  const arrangementType = inferArrangementType(legacy);
  const canonicalSlug = buildSongCanonicalSlug(legacy, hinarioNumero);
  const publicSlug = buildVersionPublicSlug(canonicalSlug, legacy.instrument as CifraInstrument, arrangementType);
  const quality = auditLegacyCifraContent(legacy.content);
  const sections = parseLegacyCifraContent(quality.normalizedContent);
  const snapshot = buildCifraPublicationSnapshot(sections);

  return {
    legacy,
    inferred: {
      canonicalSlug,
      publicSlug,
      hinarioNumero,
      sourceType,
      arrangementType,
      publicationLabel: inferPublicationLabel(),
      sectionsCount: snapshot.sectionsCount,
      linesCount: snapshot.linesCount,
      chordsIndex: snapshot.chordsIndex,
    },
    sections,
    quality,
  };
}

export async function previewLegacyCifraMigrationById(id: number): Promise<LegacyCifraMigrationPreview | null> {
  const legacy = await fetchCifraById(id);
  return legacy ? buildLegacyCifraMigrationPreview(legacy) : null;
}

export async function migrateLegacyCifra(legacy: LegacyCifra, options: LegacyCifraMigrationOptions = {}): Promise<LegacyCifraMigrationResult> {
  const preview = buildLegacyCifraMigrationPreview(legacy);
  const { song, created: wasSongCreated } = await ensureSongFromLegacy(legacy, options);
  const { version, created: wasVersionCreated } = await ensureVersionFromLegacy(legacy, song, options);

  const publish = legacy.is_active && options.publishActive === true && options.qualityApproved === true;
  const persistedVersion = publish
    ? await publishCifraVersion({
        versionId: version.id,
        sections: preview.sections,
        actorId: options.actorId ?? null,
        changeSummary: `Migracao da cifra legada #${legacy.id}`,
        publicationLabel: preview.inferred.publicationLabel,
        markAsPrimary: options.markAsPrimary ?? true,
        versionPatch: {
          songId: song.id,
          title: legacy.title,
          instrument: legacy.instrument as CifraInstrument,
          arrangementType: preview.inferred.arrangementType,
          difficultyLevel: 'intermediario',
          originalKey: legacy.original_key || 'C',
          capo: legacy.capo,
          introNotes: `Migrada do modulo legado de cifras (ID ${legacy.id}).`,
          isActive: legacy.is_active,
          isSearchable: legacy.is_active,
        },
      })
    : await saveCifraVersionDraft({
        versionId: version.id,
        sections: preview.sections,
        actorId: options.actorId ?? null,
        changeSummary: `Importacao em rascunho da cifra legada #${legacy.id}`,
        markAsPrimary: options.markAsPrimary ?? true,
        versionPatch: {
          songId: song.id,
          title: legacy.title,
          instrument: legacy.instrument as CifraInstrument,
          arrangementType: preview.inferred.arrangementType,
          difficultyLevel: 'intermediario',
          originalKey: legacy.original_key || 'C',
          capo: legacy.capo,
          introNotes: `Migrada do modulo legado de cifras (ID ${legacy.id}).`,
          isActive: legacy.is_active,
          isSearchable: false,
        },
      });

  if (!persistedVersion) {
    throw new Error(`Falha ao persistir a cifra legada ${legacy.id} no modelo v2`);
  }

  return {
    legacyId: legacy.id,
    song,
    version: persistedVersion,
    wasSongCreated,
    wasVersionCreated,
    status: publish ? 'published' : 'draft',
  };
}

export async function migrateLegacyCifraById(id: number, options: LegacyCifraMigrationOptions = {}): Promise<LegacyCifraMigrationResult | null> {
  const legacy = await fetchCifraById(id);
  if (!legacy) {
    return null;
  }

  return migrateLegacyCifra(legacy, options);
}

export async function migrateLegacyCifrasBatch(
  options: LegacyCifraMigrationOptions & {
    limit?: number;
    onlyActive?: boolean;
  } = {},
): Promise<LegacyCifraMigrationResult[]> {
  const legacyCifras = await fetchCifras({
    is_active: options.onlyActive,
    limit: options.limit,
  });

  const results: LegacyCifraMigrationResult[] = [];
  for (const legacy of legacyCifras) {
    const migrated = await migrateLegacyCifra(legacy, options);
    results.push(migrated);
  }

  return results;
}

export async function fetchLegacyCifraMigrationStatuses(legacyIds?: number[]): Promise<Record<number, LegacyCifraMigrationStatus>> {
  const legacyFilter = legacyIds?.length ? new Set(legacyIds) : null;
  const [songs, publicCatalog, versions] = await Promise.all([
    fetchAllCifraSongs({}, { authenticated: true, pageSize: 250 }),
    fetchAllPublicCifraCatalog({}, { pageSize: 250 }),
    fetchAllCifraVersions({}, { authenticated: true, pageSize: 250 }),
  ]);
  const statuses: Record<number, LegacyCifraMigrationStatus> = {};
  const publicVersionIds = new Set(publicCatalog.map((item) => item.version_id));
  const versionsBySongId = versions.reduce<Record<string, CifraVersion[]>>((acc, version) => {
    if (!acc[version.song_id]) {
      acc[version.song_id] = [];
    }
    acc[version.song_id].push(version);
    return acc;
  }, {});

  for (const song of songs) {
    const relatedLegacyIds = extractLegacyIdsFromSong(song).filter((legacyId) =>
      legacyFilter ? legacyFilter.has(legacyId) : true,
    );

    if (relatedLegacyIds.length === 0) {
      continue;
    }

    const preferredVersion = buildPreferredVersion(versionsBySongId[song.id] ?? []);

    for (const legacyId of relatedLegacyIds) {
      const candidate: LegacyCifraMigrationStatus = {
        legacyId,
        songId: song.id,
        songSlug: song.canonical_slug,
        versionId: preferredVersion?.id ?? null,
        versionSlug: preferredVersion?.public_slug ?? null,
        versionStatus: preferredVersion?.status ?? null,
        versionIsPrimary: preferredVersion?.is_primary ?? false,
        versionIsSearchable: preferredVersion?.is_searchable ?? false,
        publicCatalogVisible: preferredVersion?.id ? publicVersionIds.has(preferredVersion.id) : false,
        sectionsCount: preferredVersion?.sections_count ?? 0,
        hasStudyDefaults: Boolean(
          preferredVersion?.default_study_section_order ||
          preferredVersion?.default_study_sync_audio ||
          preferredVersion?.default_study_loop_section,
        ),
        publicPath: preferredVersion?.public_slug ? `/cifra/${preferredVersion.public_slug}` : null,
        migratedAt: song.updated_at ?? song.created_at ?? null,
      };

      statuses[legacyId] = pickBestStatus(statuses[legacyId], candidate);
    }
  }

  return statuses;
}
