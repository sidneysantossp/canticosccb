import { supabaseFetch } from '@/lib/supabaseRest';
import type { CifraChordShape, CifraInstrument } from '@/types/cifras-v2';
import { parseChord } from '@/utils/chordUtils';

import { mapCifraChordShapeRow } from './mappers';

export interface FetchCifraChordShapesParams {
  instrument?: CifraInstrument;
  chordNames?: string[];
  onlyActive?: boolean;
  limit?: number;
}

function normalizeChordNames(chordNames: string[]): string[] {
  return Array.from(
    new Set(
      chordNames
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function buildInFilter(values: string[]): string | null {
  const normalized = normalizeChordNames(values);
  if (normalized.length === 0) {
    return null;
  }

  return `in.(${normalized.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(',')})`;
}

function buildChordCandidates(chordName: string): string[] {
  const trimmed = chordName.trim();
  if (!trimmed) {
    return [];
  }

  const candidates = [trimmed];

  if (trimmed.includes('/')) {
    candidates.push(trimmed.split('/')[0].trim());
  }

  const parsed = parseChord(trimmed);
  if (parsed) {
    candidates.push(`${parsed.root}${parsed.suffix.startsWith('m') ? 'm' : ''}`);
    candidates.push(parsed.root);
  }

  return normalizeChordNames(candidates);
}

export async function fetchCifraChordShapes(params: FetchCifraChordShapesParams = {}): Promise<CifraChordShape[]> {
  const filters: Record<string, string> = {
    select: '*',
    order: 'priority.desc,chord_name.asc,variation_name.asc',
  };

  if (params.instrument) {
    filters.instrument = `eq.${params.instrument}`;
  }

  if (params.onlyActive !== undefined) {
    filters.is_active = `eq.${params.onlyActive}`;
  }

  if (params.chordNames?.length) {
    const inFilter = buildInFilter(params.chordNames);
    if (inFilter) {
      filters.chord_name = inFilter;
    }
  }

  if (params.limit) {
    filters.limit = String(params.limit);
  }

  const rows = await supabaseFetch<any>('cifra_chord_shapes', filters);
  return rows.map(mapCifraChordShapeRow);
}

export async function fetchPreferredCifraChordShapes(
  instrument: CifraInstrument,
  chordNames: string[],
): Promise<Record<string, CifraChordShape>> {
  const requests = normalizeChordNames(chordNames);
  if (requests.length === 0) {
    return {};
  }

  const allCandidates = normalizeChordNames(requests.flatMap((item) => buildChordCandidates(item)));
  const shapes = await fetchCifraChordShapes({
    instrument,
    chordNames: allCandidates,
    onlyActive: true,
    limit: Math.max(50, allCandidates.length * 4),
  });

  const result: Record<string, CifraChordShape> = {};

  for (const chordName of requests) {
    const candidates = buildChordCandidates(chordName);
    const match = candidates
      .map((candidate) => shapes.find((shape) => shape.chord_name === candidate))
      .find((shape): shape is CifraChordShape => Boolean(shape));

    if (match) {
      result[chordName] = match;
    }
  }

  return result;
}
