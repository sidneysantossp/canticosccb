import { supabaseAuthDelete, supabaseAuthInsert, supabaseAuthUpdate, supabaseFetch } from '@/lib/supabaseRest';
import type { CifraChordShape, CifraInstrument } from '@/types/cifras-v2';
import { parseChord } from '@/utils/chordUtils';

import { getCifraChordShapePresets, type CifraChordPresetGroup } from './chordShapePresets';
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

export interface SyncCifraChordShapePresetsResult {
  group: CifraChordPresetGroup;
  processed: number;
  created: number;
  updated: number;
}

export interface PrioritizeCifraChordShapeResult {
  target: CifraChordShape;
  updated: number;
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

export async function fetchCifraChordShapeById(id: string): Promise<CifraChordShape | null> {
  const rows = await supabaseFetch<any>('cifra_chord_shapes', {
    select: '*',
    id: `eq.${id}`,
    limit: '1',
  });

  if (!rows[0]) {
    return null;
  }

  return mapCifraChordShapeRow(rows[0]);
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

export async function prioritizeCifraChordShape(id: string): Promise<PrioritizeCifraChordShapeResult> {
  const target = await fetchCifraChordShapeById(id);
  if (!target) {
    throw new Error('Shape nao encontrado.');
  }

  const siblings = await fetchCifraChordShapes({
    instrument: target.instrument,
    chordNames: [target.chord_name],
    onlyActive: undefined,
    limit: 100,
  });

  const ordered = [
    target,
    ...siblings
      .filter((shape) => shape.id !== target.id)
      .sort((left, right) => {
        if (left.priority !== right.priority) {
          return right.priority - left.priority;
        }

        return left.variation_name.localeCompare(right.variation_name);
      }),
  ];

  let updated = 0;

  for (let index = 0; index < ordered.length; index += 1) {
    const shape = ordered[index];
    const nextPriority = ordered.length - index;
    if (shape.priority === nextPriority) {
      continue;
    }

    await updateCifraChordShape(shape.id, {
      instrument: shape.instrument,
      chord_name: shape.chord_name,
      variation_name: shape.variation_name,
      fingering: shape.fingering,
      base_fret: shape.base_fret,
      priority: nextPriority,
      is_left_handed_supported: shape.is_left_handed_supported,
      is_active: shape.is_active,
    });
    updated += 1;
  }

  return {
    target,
    updated,
  };
}

function buildShapeNaturalKey(input: Pick<UpsertCifraChordShapeInput, 'instrument' | 'chord_name' | 'variation_name'>): string {
  return `${input.instrument}::${input.chord_name.trim().toLowerCase()}::${(input.variation_name?.trim() || 'default').toLowerCase()}`;
}

export async function syncCifraChordShapePresets(group: CifraChordPresetGroup): Promise<SyncCifraChordShapePresetsResult> {
  const presets = getCifraChordShapePresets(group);
  if (presets.length === 0) {
    return {
      group,
      processed: 0,
      created: 0,
      updated: 0,
    };
  }

  const instruments = Array.from(new Set(presets.map((item) => item.instrument)));
  const existingRows = await Promise.all(
    instruments.map((instrument) => fetchCifraChordShapes({
      instrument,
      onlyActive: undefined,
      limit: 500,
    })),
  );

  const existingMap = new Map<string, CifraChordShape>();
  existingRows.flat().forEach((shape) => {
    existingMap.set(buildShapeNaturalKey(shape), shape);
  });

  let created = 0;
  let updated = 0;

  for (const preset of presets) {
    const existing = existingMap.get(buildShapeNaturalKey(preset));
    if (existing) {
      await updateCifraChordShape(existing.id, preset);
      updated += 1;
      continue;
    }

    const createdRow = await createCifraChordShape(preset);
    existingMap.set(buildShapeNaturalKey(createdRow), createdRow);
    created += 1;
  }

  return {
    group,
    processed: presets.length,
    created,
    updated,
  };
}

export async function fetchPreferredCifraChordShapes(
  instrument: CifraInstrument,
  chordNames: string[],
): Promise<Record<string, CifraChordShape>> {
  const groupedShapes = await fetchCifraChordShapeVariants(instrument, chordNames);
  return Object.fromEntries(
    Object.entries(groupedShapes)
      .map(([chordName, shapes]) => [chordName, shapes[0]])
      .filter((entry): entry is [string, CifraChordShape] => Boolean(entry[1])),
  );
}

export async function fetchCifraChordShapeVariants(
  instrument: CifraInstrument,
  chordNames: string[],
): Promise<Record<string, CifraChordShape[]>> {
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

  const result: Record<string, CifraChordShape[]> = {};

  for (const chordName of requests) {
    const candidates = buildChordCandidates(chordName);
    const matches = candidates.flatMap((candidate) => (
      shapes.filter((shape) => shape.chord_name === candidate)
    ));

    if (matches.length > 0) {
      result[chordName] = Array.from(new Map(
        matches.map((shape) => [shape.id, shape]),
      ).values());
    }
  }

  return result;
}
