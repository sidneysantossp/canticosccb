import { supabaseAuthDelete, supabaseAuthInsert, supabaseAuthUpdate, supabaseFetch } from '@/lib/supabaseRest';
import type { CifraChordShape, CifraInstrument } from '@/types/cifras-v2';
import { parseChord } from '@/utils/chordUtils';

import { mapCifraChordShapeRow } from './mappers';

export interface FetchCifraChordShapesParams {
  instrument?: CifraInstrument;
  chordNames?: string[];
  onlyActive?: boolean;
  limit?: number;
}

export interface UpsertCifraChordShapeInput {
  instrument: CifraInstrument;
  chord_name: string;
  variation_name?: string;
  fingering?: Record<string, unknown>;
  base_fret?: number;
  priority?: number;
  is_left_handed_supported?: boolean;
  is_active?: boolean;
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

function normalizeShapePayload(input: UpsertCifraChordShapeInput) {
  return {
    instrument: input.instrument,
    chord_name: input.chord_name.trim(),
    variation_name: input.variation_name?.trim() || 'default',
    fingering: input.fingering ?? {},
    base_fret: Number(input.base_fret ?? 1) || 1,
    priority: Number(input.priority ?? 0) || 0,
    is_left_handed_supported: Boolean(input.is_left_handed_supported),
    is_active: input.is_active !== false,
  };
}

export async function createCifraChordShape(input: UpsertCifraChordShapeInput): Promise<CifraChordShape> {
  const rows = await supabaseAuthInsert<any>('cifra_chord_shapes', normalizeShapePayload(input));
  if (!rows[0]) {
    throw new Error('Nao foi possivel criar o shape do acorde.');
  }
  return mapCifraChordShapeRow(rows[0]);
}

export async function updateCifraChordShape(id: string, input: UpsertCifraChordShapeInput): Promise<CifraChordShape> {
  const rows = await supabaseAuthUpdate<any>('cifra_chord_shapes', { id: `eq.${id}` }, normalizeShapePayload(input));
  if (!rows[0]) {
    throw new Error('Nao foi possivel atualizar o shape do acorde.');
  }
  return mapCifraChordShapeRow(rows[0]);
}

export async function deleteCifraChordShape(id: string): Promise<void> {
  await supabaseAuthDelete<any>('cifra_chord_shapes', { id: `eq.${id}` });
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
