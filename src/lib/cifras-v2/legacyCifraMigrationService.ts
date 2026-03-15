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
  fetchCifraSongByCanonicalSlug,
  fetchCifraSongs,
  updateCifraSong,
} from './cifraSongsRepository';
import {
  createCifraVersion,
  fetchCifraVersions,
} from './cifraVersionsRepository';
import { parseLegacyCifraContent } from './legacyCifraParser';

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
}

export interface LegacyCifraMigrationOptions {
  actorId?: string | null;
  publishActive?: boolean;
  forceSongRefresh?: boolean;
  markAsPrimary?: boolean;
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
  migratedAt: string | null;
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
    const byHino = await fetchCifraSongs({ hinoId: legacy.hino_id, limit: 10 });
    const exactLegacy = byHino.find((song) => Number(song.metadata.legacy_cifra_id) === legacy.id);
    if (exactLegacy) return exactLegacy;
    if (byHino[0]) return byHino[0];
  }

  if (hinarioNumero) {
    const byNumero = await fetchCifraSongs({ hinarioNumero, limit: 10 });
    const exactLegacy = byNumero.find((song) => Number(song.metadata.legacy_cifra_id) === legacy.id);
    if (exactLegacy) return exactLegacy;
    const exactSlug = byNumero.find((song) => song.canonical_slug === canonicalSlug);
    if (exactSlug) return exactSlug;
  }

  return fetchCifraSongByCanonicalSlug(canonicalSlug);
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
  });

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
    status: legacy.is_active && (options.publishActive ?? true) ? 'published' : 'draft',
    publicationLabel: inferPublicationLabel(),
    isPrimary: options.markAsPrimary ?? true,
    isActive: legacy.is_active,
    isSearchable: legacy.is_active,
    publishedAt: legacy.is_active ? new Date().toISOString() : null,
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
  const sections = parseLegacyCifraContent(legacy.content);
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

  const publish = legacy.is_active && (options.publishActive ?? true);
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
  const songs = await fetchCifraSongs({ limit: 1000 });
  const statuses: Record<number, LegacyCifraMigrationStatus> = {};

  for (const song of songs) {
    const legacyId = Number(song.metadata.legacy_cifra_id);
    if (!legacyId || (legacyIds?.length && !legacyIds.includes(legacyId))) {
      continue;
    }

    const versions = await fetchCifraVersions({ songId: song.id, limit: 20 });
    const preferredVersion =
      versions.find((version) => version.is_primary) ??
      versions.find((version) => version.status === 'published') ??
      versions[0] ??
      null;

    statuses[legacyId] = {
      legacyId,
      songId: song.id,
      songSlug: song.canonical_slug,
      versionId: preferredVersion?.id ?? null,
      versionSlug: preferredVersion?.public_slug ?? null,
      versionStatus: preferredVersion?.status ?? null,
      migratedAt: song.updated_at ?? song.created_at ?? null,
    };
  }

  return statuses;
}
