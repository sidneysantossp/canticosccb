import type { CifraInstrument } from '@/types/cifras-v2';
import { parseChord } from '@/utils/chordUtils';

import type { UpsertCifraChordShapeInput } from './cifraChordShapesRepository';

export interface CifraChordShapePreset extends UpsertCifraChordShapeInput {
  variation_name: string;
}

const GUITAR_TUNING = 'E A D G B E';
const UKULELE_TUNING = 'G C E A';
const CAVACO_TUNING = 'D G B D';
const KEYBOARD_HANDING = 'mao direita';

type FretPresetTuple = [
  chord_name: string,
  frets: number[],
  fingers: number[],
  priority?: number,
  barres?: number[],
];

type NotesPresetTuple = [
  chord_name: string,
  notes: string[],
  priority?: number,
];

const GUITAR_FAMILY_PRESETS: FretPresetTuple[] = [
  ['C', [-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0], 100],
  ['D', [-1, -1, 0, 2, 3, 2], [0, 0, 0, 1, 3, 2], 100],
  ['E', [0, 2, 2, 1, 0, 0], [0, 2, 3, 1, 0, 0], 100],
  ['F', [1, 1, 2, 3, 3, 1], [1, 1, 2, 3, 4, 1], 100, [1]],
  ['G', [3, 2, 0, 0, 0, 3], [2, 1, 0, 0, 0, 3], 100],
  ['A', [-1, 0, 2, 2, 2, 0], [0, 0, 1, 2, 3, 0], 100],
  ['B', [-1, 2, 4, 4, 4, 2], [0, 1, 2, 3, 4, 1], 100, [2]],
  ['Am', [-1, 0, 2, 2, 1, 0], [0, 0, 2, 3, 1, 0], 100],
  ['Bm', [-1, 2, 4, 4, 3, 2], [0, 1, 3, 4, 2, 1], 100, [2]],
  ['Cm', [-1, 3, 5, 5, 4, 3], [0, 1, 3, 4, 2, 1], 100, [3]],
  ['Dm', [-1, -1, 0, 2, 3, 1], [0, 0, 0, 2, 3, 1], 100],
  ['Em', [0, 2, 2, 0, 0, 0], [0, 2, 3, 0, 0, 0], 100],
  ['Fm', [1, 1, 1, 3, 3, 1], [1, 1, 1, 3, 4, 1], 100, [1]],
  ['Gm', [3, 1, 0, 0, 3, 3], [2, 1, 0, 0, 3, 4], 100],
  ['Bb', [-1, 1, 3, 3, 3, 1], [0, 1, 2, 3, 4, 1], 100, [1]],
  ['C7', [-1, 3, 2, 3, 1, 0], [0, 3, 2, 4, 1, 0], 90],
  ['D7', [-1, -1, 0, 2, 1, 2], [0, 0, 0, 2, 1, 3], 90],
  ['E7', [0, 2, 0, 1, 0, 0], [0, 2, 0, 1, 0, 0], 90],
  ['G7', [3, 2, 0, 0, 0, 1], [3, 2, 0, 0, 0, 1], 90],
  ['A7', [-1, 0, 2, 0, 2, 0], [0, 0, 1, 0, 2, 0], 90],
  ['B7', [-1, 2, 1, 2, 0, 2], [0, 2, 1, 3, 0, 4], 90],
];

const UKULELE_PRESETS: FretPresetTuple[] = [
  ['C', [0, 0, 0, 3], [0, 0, 0, 3], 100],
  ['D', [2, 2, 2, 0], [1, 2, 3, 0], 100],
  ['E', [1, 4, 0, 2], [1, 4, 0, 2], 90],
  ['F', [2, 0, 1, 0], [2, 0, 1, 0], 100],
  ['G', [0, 2, 3, 2], [0, 1, 3, 2], 100],
  ['A', [2, 1, 0, 0], [2, 1, 0, 0], 100],
  ['Bb', [3, 2, 1, 1], [3, 2, 1, 1], 90, [1]],
  ['B', [4, 3, 2, 2], [4, 3, 1, 1], 90, [2]],
  ['Am', [2, 0, 0, 0], [2, 0, 0, 0], 100],
  ['Bm', [4, 2, 2, 2], [3, 1, 1, 1], 90, [2]],
  ['Cm', [0, 3, 3, 3], [0, 1, 2, 3], 90],
  ['Dm', [2, 2, 1, 0], [2, 3, 1, 0], 100],
  ['Em', [0, 4, 3, 2], [0, 3, 2, 1], 90],
  ['Fm', [1, 0, 1, 3], [1, 0, 2, 4], 80],
  ['Gm', [0, 2, 3, 1], [0, 2, 3, 1], 80],
  ['C7', [0, 0, 0, 1], [0, 0, 0, 1], 100],
  ['D7', [2, 2, 2, 3], [1, 1, 1, 3], 90, [2]],
  ['E7', [1, 2, 0, 2], [1, 2, 0, 3], 90],
  ['G7', [0, 2, 1, 2], [0, 2, 1, 3], 100],
  ['A7', [0, 1, 0, 0], [0, 1, 0, 0], 100],
  ['B7', [2, 3, 2, 2], [1, 3, 1, 1], 90, [2]],
];

const CAVACO_PRESETS: NotesPresetTuple[] = [
  ['C', ['C', 'E', 'G'], 70],
  ['D', ['D', 'F#', 'A'], 70],
  ['E', ['E', 'G#', 'B'], 70],
  ['F', ['F', 'A', 'C'], 70],
  ['G', ['G', 'B', 'D'], 70],
  ['A', ['A', 'C#', 'E'], 70],
  ['Bb', ['Bb', 'D', 'F'], 70],
  ['B', ['B', 'D#', 'F#'], 70],
  ['Am', ['A', 'C', 'E'], 70],
  ['Bm', ['B', 'D', 'F#'], 70],
  ['Cm', ['C', 'Eb', 'G'], 70],
  ['Dm', ['D', 'F', 'A'], 70],
  ['Em', ['E', 'G', 'B'], 70],
  ['Fm', ['F', 'Ab', 'C'], 70],
  ['Gm', ['G', 'Bb', 'D'], 70],
  ['C7', ['C', 'E', 'G', 'Bb'], 70],
  ['D7', ['D', 'F#', 'A', 'C'], 70],
  ['E7', ['E', 'G#', 'B', 'D'], 70],
  ['G7', ['G', 'B', 'D', 'F'], 70],
  ['A7', ['A', 'C#', 'E', 'G'], 70],
  ['B7', ['B', 'D#', 'F#', 'A'], 70],
];

const KEYBOARD_PRESETS: NotesPresetTuple[] = [
  ['C', ['C', 'E', 'G'], 80],
  ['D', ['D', 'F#', 'A'], 80],
  ['E', ['E', 'G#', 'B'], 80],
  ['F', ['F', 'A', 'C'], 80],
  ['G', ['G', 'B', 'D'], 80],
  ['A', ['A', 'C#', 'E'], 80],
  ['Bb', ['Bb', 'D', 'F'], 80],
  ['B', ['B', 'D#', 'F#'], 80],
  ['Am', ['A', 'C', 'E'], 80],
  ['Bm', ['B', 'D', 'F#'], 80],
  ['Cm', ['C', 'Eb', 'G'], 80],
  ['Dm', ['D', 'F', 'A'], 80],
  ['Em', ['E', 'G', 'B'], 80],
  ['Fm', ['F', 'Ab', 'C'], 80],
  ['Gm', ['G', 'Bb', 'D'], 80],
  ['C7', ['C', 'E', 'G', 'Bb'], 80],
  ['D7', ['D', 'F#', 'A', 'C'], 80],
  ['E7', ['E', 'G#', 'B', 'D'], 80],
  ['G7', ['G', 'B', 'D', 'F'], 80],
  ['A7', ['A', 'C#', 'E', 'G'], 80],
  ['B7', ['B', 'D#', 'F#', 'A'], 80],
];

function buildFretPresets(
  instrument: 'violao' | 'guitarra' | 'ukulele',
  tuning: string,
  rows: FretPresetTuple[],
  stringCount: number,
): CifraChordShapePreset[] {
  return rows.map(([chord_name, frets, fingers, priority = 100, barres = []]) => ({
    instrument,
    chord_name,
    variation_name: 'default',
    fingering: {
      frets,
      fingers,
      barres,
      stringCount,
      tuning,
    },
    base_fret: 1,
    priority,
    is_left_handed_supported: true,
    is_active: true,
  }));
}

function buildNotesPresets(
  instrument: 'cavaco' | 'teclado',
  rows: NotesPresetTuple[],
): CifraChordShapePreset[] {
  return rows.map(([chord_name, notes, priority = 70]) => ({
    instrument,
    chord_name,
    variation_name: 'default',
    fingering: instrument === 'cavaco'
      ? {
        notes,
        tuning: CAVACO_TUNING,
      }
      : {
        notes,
        handing: KEYBOARD_HANDING,
      },
    base_fret: 1,
    priority,
    is_left_handed_supported: false,
    is_active: true,
  }));
}

export const CIFRA_CHORD_SHAPE_PRESETS: Record<Exclude<CifraInstrument, 'outro'>, CifraChordShapePreset[]> = {
  violao: buildFretPresets('violao', GUITAR_TUNING, GUITAR_FAMILY_PRESETS, 6),
  guitarra: buildFretPresets('guitarra', GUITAR_TUNING, GUITAR_FAMILY_PRESETS, 6),
  ukulele: buildFretPresets('ukulele', UKULELE_TUNING, UKULELE_PRESETS, 4),
  cavaco: buildNotesPresets('cavaco', CAVACO_PRESETS),
  teclado: buildNotesPresets('teclado', KEYBOARD_PRESETS),
};

export type CifraChordPresetGroup = keyof typeof CIFRA_CHORD_SHAPE_PRESETS | 'all';

export const CIFRA_CHORD_PRESET_GROUPS: { value: CifraChordPresetGroup; label: string }[] = [
  { value: 'all', label: 'Pack completo' },
  { value: 'violao', label: 'Violao' },
  { value: 'guitarra', label: 'Guitarra' },
  { value: 'ukulele', label: 'Ukulele' },
  { value: 'cavaco', label: 'Cavaco' },
  { value: 'teclado', label: 'Teclado' },
];

export function getCifraChordShapePresets(group: CifraChordPresetGroup): CifraChordShapePreset[] {
  if (group === 'all') {
    return Object.values(CIFRA_CHORD_SHAPE_PRESETS).flat();
  }

  return CIFRA_CHORD_SHAPE_PRESETS[group] ?? [];
}

function buildChordPresetCandidates(chordName: string): string[] {
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

  return Array.from(new Set(candidates.filter(Boolean)));
}

export function findCifraChordShapePreset(
  instrument: CifraInstrument,
  chordName: string,
): CifraChordShapePreset | null {
  if (instrument === 'outro') {
    return null;
  }

  const presets = CIFRA_CHORD_SHAPE_PRESETS[instrument] ?? [];
  const candidates = buildChordPresetCandidates(chordName);

  for (const candidate of candidates) {
    const preset = presets.find((item) => item.chord_name === candidate);
    if (preset) {
      return preset;
    }
  }

  return null;
}
