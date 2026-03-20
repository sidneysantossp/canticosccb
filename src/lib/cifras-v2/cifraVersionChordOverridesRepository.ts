import { supabaseAuthDelete, supabaseAuthFetch, supabaseAuthInsert, supabaseAuthUpdate, supabaseFetch } from '@/lib/supabaseRest';
import type { CifraVersionChordOverride } from '@/types/cifras-v2';

import { mapCifraVersionChordOverrideRow } from './mappers';

export interface UpsertCifraVersionChordOverrideInput {
  versionId: string;
  chordName: string;
  preferredShapeId: string;
  appliesToKey?: string | null;
  notes?: string | null;
}

export interface FetchCifraVersionChordOverridesOptions {
  authenticated?: boolean;
}

function normalizeOverrideText(value?: string | null): string {
  return String(value || '').trim().toLowerCase();
}

function buildOverridePayload(input: UpsertCifraVersionChordOverrideInput) {
  return {
    version_id: input.versionId,
    chord_name: input.chordName.trim(),
    applies_to_key: input.appliesToKey?.trim() || null,
    preferred_shape_id: input.preferredShapeId,
    notes: input.notes?.trim() || null,
  };
}

export async function fetchCifraVersionChordOverrides(
  versionId: string,
  options: FetchCifraVersionChordOverridesOptions = {},
): Promise<CifraVersionChordOverride[]> {
  const fetcher = options.authenticated ? supabaseAuthFetch : supabaseFetch;
  const rows = await fetcher<any>('cifra_version_chord_overrides', {
    select: '*',
    version_id: `eq.${versionId}`,
    order: 'chord_name.asc,applies_to_key.asc.nullsfirst,created_at.asc',
  });

  return rows.map(mapCifraVersionChordOverrideRow);
}

export function resolveCifraVersionChordOverride(
  overrides: CifraVersionChordOverride[],
  chordName: string,
  selectedKey?: string | null,
): CifraVersionChordOverride | null {
  const normalizedChordName = normalizeOverrideText(chordName);
  if (!normalizedChordName) {
    return null;
  }

  const candidates = overrides.filter((override) => normalizeOverrideText(override.chord_name) === normalizedChordName);
  if (candidates.length === 0) {
    return null;
  }

  const normalizedKey = normalizeOverrideText(selectedKey);
  if (normalizedKey) {
    const exactKeyMatch = candidates.find((override) => normalizeOverrideText(override.applies_to_key) === normalizedKey);
    if (exactKeyMatch) {
      return exactKeyMatch;
    }
  }

  return candidates.find((override) => !normalizeOverrideText(override.applies_to_key)) || null;
}

export async function upsertCifraVersionChordOverride(
  input: UpsertCifraVersionChordOverrideInput,
): Promise<CifraVersionChordOverride> {
  const payload = buildOverridePayload(input);
  const existingRows = await supabaseAuthFetch<any>('cifra_version_chord_overrides', {
    select: '*',
    version_id: `eq.${payload.version_id}`,
    chord_name: `eq.${payload.chord_name}`,
    ...(payload.applies_to_key
      ? { applies_to_key: `eq.${payload.applies_to_key}` }
      : { applies_to_key: 'is.null' }),
    limit: '1',
  });

  if (existingRows[0]) {
    const updatedRows = await supabaseAuthUpdate<any>(
      'cifra_version_chord_overrides',
      { id: `eq.${existingRows[0].id}` },
      payload,
    );

    if (!updatedRows[0]) {
      throw new Error('Nao foi possivel atualizar o override editorial do acorde.');
    }

    return mapCifraVersionChordOverrideRow(updatedRows[0]);
  }

  const insertedRows = await supabaseAuthInsert<any>('cifra_version_chord_overrides', payload);
  if (!insertedRows[0]) {
    throw new Error('Nao foi possivel criar o override editorial do acorde.');
  }

  return mapCifraVersionChordOverrideRow(insertedRows[0]);
}

export async function deleteCifraVersionChordOverride(
  versionId: string,
  chordName: string,
  appliesToKey?: string | null,
): Promise<void> {
  await supabaseAuthDelete<any>('cifra_version_chord_overrides', {
    version_id: `eq.${versionId}`,
    chord_name: `eq.${chordName.trim()}`,
    ...(appliesToKey?.trim()
      ? { applies_to_key: `eq.${appliesToKey.trim()}` }
      : { applies_to_key: 'is.null' }),
  });
}
