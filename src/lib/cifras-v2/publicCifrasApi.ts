import { fetchCifras, type Cifra } from '@/api/cifras';
import type {
  CifraInstrument,
  CifraPublicCatalogItem,
  CifraVersion,
  CifraVersionChordOverride,
  CifraVersionSection,
} from '@/types/cifras-v2';

import { fetchCifraVersionSections } from './cifraSectionsRepository';
import { fetchCifraVersionChordOverrides } from './cifraVersionChordOverridesRepository';
import { serializeSectionLines } from './legacyCifraParser';
import {
  fetchCifraVersionById,
  fetchPublicCifraCatalog,
  fetchPublicCifraCatalogBySlug,
} from './cifraVersionsRepository';

export interface PublicCifraVersionOption {
  version_id: string;
  slug: string;
  title: string;
  instrument: CifraInstrument;
  arrangement_type: string;
  publication_label: string;
  is_primary: boolean;
  original_key: string;
  preferred_key?: string | null;
}

export interface PublicCifraPageData extends Omit<Cifra, 'id'> {
  id: string;
  source: 'v2';
  song_id: string;
  hinario_numero: number | null;
  available_versions: PublicCifraVersionOption[];
  sections: CifraVersionSection[];
  chord_overrides: CifraVersionChordOverride[];
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  publication_label: string;
  arrangement_type: string;
  difficulty_level: string;
  tuning: string;
  preferred_key?: string | null;
  tempo_bpm?: number | null;
  time_signature?: string | null;
  intro_notes?: string | null;
  sections_count: number;
  lines_count: number;
  chords_index: string[];
  shares_count: number;
  prints_count: number;
  favorites_count: number;
  reports_count: number;
  open_reports_count: number;
  last_interaction_at?: string | null;
}

function buildDisplayContent(version: CifraVersion, sections: CifraVersionSection[]): string {
  if (sections.length === 0) {
    return version.body_text;
  }

  return sections
    .map((section) => {
      const header = section.section_label?.trim() ? `[${section.section_label.trim()}]` : '';
      const body = serializeSectionLines(section.content_ast);
      return [header, body].filter(Boolean).join('\n');
    })
    .join('\n\n')
    .trim();
}

function mapCategory(item: CifraPublicCatalogItem): string {
  if (item.arrangement_type === 'instrumental') {
    return 'tocados';
  }

  if (item.source_type === 'avulso') {
    return 'avulsos';
  }

  return 'cantados';
}

function mapSiblingVersions(items: CifraPublicCatalogItem[]): PublicCifraVersionOption[] {
  const seen = new Set<string>();

  return items
    .filter((item) => {
      if (seen.has(item.public_slug)) {
        return false;
      }

      seen.add(item.public_slug);
      return true;
    })
    .sort((left, right) => {
      if (left.is_primary !== right.is_primary) {
        return left.is_primary ? -1 : 1;
      }

      if (left.instrument !== right.instrument) {
        return left.instrument.localeCompare(right.instrument);
      }

      return left.version_title.localeCompare(right.version_title);
    })
    .map((item) => ({
      version_id: item.version_id,
      slug: item.public_slug,
      title: item.version_title || item.song_title,
      instrument: item.instrument,
      arrangement_type: item.arrangement_type,
      publication_label: item.publication_label,
      is_primary: item.is_primary,
      original_key: item.original_key,
      preferred_key: item.preferred_key,
    }));
}

function mapPublicCifraPageData(
  catalog: CifraPublicCatalogItem,
  version: CifraVersion,
  sections: CifraVersionSection[],
  chordOverrides: CifraVersionChordOverride[],
  siblings: CifraPublicCatalogItem[],
): PublicCifraPageData {
  return {
    id: version.id,
    source: 'v2',
    song_id: catalog.song_id,
    title: catalog.song_title || version.title,
    artist: catalog.composer_name || '',
    slug: catalog.public_slug,
    content: buildDisplayContent(version, sections),
    original_key: version.original_key,
    preferred_key: version.preferred_key,
    instrument: version.instrument,
    capo: version.capo,
    cover_url: catalog.cover_url || null,
    hino_id: catalog.hino_id || null,
    hinario_numero: catalog.hinario_numero ?? null,
    category: mapCategory(catalog),
    views_count: catalog.views_count,
    is_active: version.is_active,
    created_by: version.created_by || null,
    created_at: version.created_at,
    updated_at: version.updated_at,
    available_versions: mapSiblingVersions(siblings),
    sections,
    chord_overrides: chordOverrides,
    seo_title: catalog.seo_title,
    seo_description: catalog.seo_description,
    seo_keywords: catalog.seo_keywords,
    publication_label: version.publication_label,
    arrangement_type: version.arrangement_type,
    difficulty_level: version.difficulty_level,
    tuning: version.tuning,
    tempo_bpm: version.tempo_bpm,
    time_signature: version.time_signature,
    intro_notes: version.intro_notes,
    sections_count: version.sections_count,
    lines_count: version.lines_count,
    chords_index: version.chords_index,
    shares_count: catalog.shares_count,
    prints_count: catalog.prints_count,
    favorites_count: catalog.favorites_count,
    reports_count: catalog.reports_count,
    open_reports_count: catalog.open_reports_count,
    last_interaction_at: catalog.last_interaction_at,
  };
}

export async function fetchPublicCifraPageBySlug(publicSlug: string): Promise<PublicCifraPageData | null> {
  const catalog = await fetchPublicCifraCatalogBySlug(publicSlug);
  if (!catalog) {
    return null;
  }

  const [version, sections, chordOverrides, siblings] = await Promise.all([
    fetchCifraVersionById(catalog.version_id),
    fetchCifraVersionSections(catalog.version_id),
    fetchCifraVersionChordOverrides(catalog.version_id),
    fetchPublicCifraCatalog({ songId: catalog.song_id, limit: 50 }),
  ]);

  if (!version) {
    return null;
  }

  return mapPublicCifraPageData(catalog, version, sections, chordOverrides, siblings);
}

export async function fetchMergedPublicCifrasList(): Promise<Array<Cifra | PublicCifraPageData>> {
  const [publicCatalog, legacyCifras] = await Promise.all([
    fetchPublicCifraCatalog({ limit: 500 }),
    fetchCifras({ is_active: true, limit: 500 }),
  ]);

  const groupedByVersion = new Map<string, CifraPublicCatalogItem>();
  publicCatalog.forEach((item) => {
    if (!groupedByVersion.has(item.version_id)) {
      groupedByVersion.set(item.version_id, item);
    }
  });

  const v2Items = Array.from(groupedByVersion.values()).map((item) => ({
    id: item.version_id,
    source: 'v2',
    song_id: item.song_id,
    title: item.song_title || item.version_title,
    artist: item.composer_name || '',
    slug: item.public_slug,
    content: '',
    original_key: item.original_key,
    preferred_key: item.preferred_key,
    instrument: item.instrument,
    capo: item.capo,
    cover_url: item.cover_url || null,
    hino_id: item.hino_id || null,
    hinario_numero: item.hinario_numero ?? null,
    category: mapCategory(item),
    views_count: item.views_count,
    is_active: true,
    created_by: null,
    created_at: item.published_at || new Date().toISOString(),
    updated_at: item.published_at || new Date().toISOString(),
    available_versions: [],
    sections: [],
    chord_overrides: [],
    seo_title: item.seo_title,
    seo_description: item.seo_description,
    seo_keywords: item.seo_keywords,
    publication_label: item.publication_label,
    arrangement_type: item.arrangement_type,
    difficulty_level: item.difficulty_level,
    tuning: 'standard',
    tempo_bpm: item.tempo_bpm,
    time_signature: item.time_signature,
    intro_notes: null,
    sections_count: item.sections_count,
    lines_count: item.lines_count,
    chords_index: item.chords_index,
    shares_count: item.shares_count,
    prints_count: item.prints_count,
    favorites_count: item.favorites_count,
    reports_count: item.reports_count,
    open_reports_count: item.open_reports_count,
    last_interaction_at: item.last_interaction_at,
  }));

  const usedSlugs = new Set(v2Items.map((item) => item.slug));
  const remainingLegacy = legacyCifras.filter((item) => !usedSlugs.has(item.slug));

  return [...v2Items, ...remainingLegacy];
}
