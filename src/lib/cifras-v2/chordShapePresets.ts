import type { CifraInstrument } from '@/types/cifras-v2';
import { parseChord } from '@/utils/chordUtils';

import type { UpsertCifraChordShapeInput } from './cifraChordShapesRepository';

export interface CifraChordShapePreset extends UpsertCifraChordShapeInput {
  variation_name: string;
}

export type CifraChordShapePresetMatchStrategy =
  | 'exact'
  | 'slash_root'
  | 'enharmonic'
  | 'minor_base'
  | 'extension_family'
  | 'root_only';

export interface CifraChordShapePresetMatch {
  requestedChordName: string;
  matchedChordName: string;
  strategy: CifraChordShapePresetMatchStrategy;
  preset: CifraChordShapePreset;
}

export interface CifraChordNameMatchExplanation {
  strategy: CifraChordShapePresetMatchStrategy | 'same_root' | 'fallback';
  label: string;
  detail: string;
}

export interface CifraChordShapePresetMatchOptions {
  preferredKey?: string | null;
  originalKey?: string | null;
  progression?: string[] | null;
}

const GUITAR_TUNING = 'E A D G B E';
const UKULELE_TUNING = 'G C E A';
const CAVACO_TUNING = 'D G B D';
const KEYBOARD_HANDING = 'mao direita';
const FLAT_PREFERRED_KEYS = new Set([
  'F',
  'Bb',
  'Eb',
  'Ab',
  'Db',
  'Gb',
  'Dm',
  'Gm',
  'Cm',
  'Fm',
  'Bbm',
  'Ebm',
]);
const ENHARMONIC_EQUIVALENTS: Record<string, string> = {
  'A#': 'Bb',
  'Bb': 'A#',
  'C#': 'Db',
  'Db': 'C#',
  'D#': 'Eb',
  'Eb': 'D#',
  'F#': 'Gb',
  'Gb': 'F#',
  'G#': 'Ab',
  'Ab': 'G#',
};

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

function getRootAccidental(note: string): 'flat' | 'sharp' | 'natural' {
  if (note.includes('b')) {
    return 'flat';
  }
  if (note.includes('#')) {
    return 'sharp';
  }
  return 'natural';
}

function inferFlatPreference(options?: CifraChordShapePresetMatchOptions): boolean | null {
  const contextualKeys = [options?.preferredKey, options?.originalKey]
    .map((key) => key?.trim())
    .filter((key): key is string => Boolean(key));

  for (const key of contextualKeys) {
    const parsed = parseChord(key);
    const normalized = parsed ? `${parsed.root}${parsed.suffix}` : key;
    if (FLAT_PREFERRED_KEYS.has(normalized) || normalized.includes('b')) {
      return true;
    }
    if (normalized.includes('#')) {
      return false;
    }
  }

  const progression = options?.progression ?? [];
  if (progression.length > 0) {
    let flats = 0;
    let sharps = 0;

    progression.forEach((chord) => {
      const parsed = parseChord(chord);
      if (!parsed) {
        return;
      }
      const accidental = getRootAccidental(parsed.root);
      if (accidental === 'flat') {
        flats += 1;
      } else if (accidental === 'sharp') {
        sharps += 1;
      }
    });

    if (flats > sharps) {
      return true;
    }
    if (sharps > flats) {
      return false;
    }
  }

  return null;
}

function getStrategyBaseScore(strategy: CifraChordShapePresetMatchStrategy): number {
  switch (strategy) {
    case 'exact':
      return 600;
    case 'slash_root':
      return 520;
    case 'enharmonic':
      return 470;
    case 'minor_base':
      return 430;
    case 'extension_family':
      return 390;
    case 'root_only':
      return 340;
    default:
      return 0;
  }
}

function scorePresetCandidate(
  requestedChordName: string,
  candidate: string,
  strategy: CifraChordShapePresetMatchStrategy,
  options?: CifraChordShapePresetMatchOptions,
): number {
  const parsedCandidate = parseChord(candidate);
  const parsedRequested = parseChord(requestedChordName);
  const flatPreference = inferFlatPreference(options);
  const candidateAccidental = parsedCandidate ? getRootAccidental(parsedCandidate.root) : 'natural';
  const requestedAccidental = parsedRequested ? getRootAccidental(parsedRequested.root) : 'natural';

  let score = getStrategyBaseScore(strategy);

  if (flatPreference === true) {
    if (candidateAccidental === 'flat') {
      score += 35;
    } else if (candidateAccidental === 'sharp') {
      score -= 20;
    }
  } else if (flatPreference === false) {
    if (candidateAccidental === 'sharp') {
      score += 35;
    } else if (candidateAccidental === 'flat') {
      score -= 20;
    }
  }

  if (candidateAccidental === requestedAccidental && requestedAccidental !== 'natural') {
    score += 12;
  }

  if (options?.preferredKey) {
    const preferredRoot = parseChord(options.preferredKey)?.root;
    if (preferredRoot && parsedCandidate?.root === preferredRoot) {
      score += 10;
    }
  }

  return score;
}

function getChordMatchStrategy(
  requestedChordName: string,
  matchedChordName: string,
): CifraChordShapePresetMatchStrategy | null {
  const normalizedMatched = matchedChordName.trim();
  if (!normalizedMatched) {
    return null;
  }

  return buildChordPresetCandidates(requestedChordName).find(
    ({ candidate }) => candidate === normalizedMatched,
  )?.strategy ?? null;
}

function buildNotationContextHint(
  requestedChordName: string,
  matchedChordName: string,
  options?: CifraChordShapePresetMatchOptions,
): string | null {
  const flatPreference = inferFlatPreference(options);
  const requestedRoot = parseChord(requestedChordName)?.root || '';
  const matchedRoot = parseChord(matchedChordName)?.root || '';

  if (flatPreference === true && matchedRoot.includes('b') && requestedRoot !== matchedRoot) {
    return 'O contexto tonal atual favorece a grafia com bemol.';
  }

  if (flatPreference === false && matchedRoot.includes('#') && requestedRoot !== matchedRoot) {
    return 'O contexto tonal atual favorece a grafia com sustenido.';
  }

  return null;
}

export function explainCifraChordNameMatch(
  requestedChordName: string,
  matchedChordName: string,
  options?: CifraChordShapePresetMatchOptions,
): CifraChordNameMatchExplanation {
  const strategy = getChordMatchStrategy(requestedChordName, matchedChordName);
  const notationHint = buildNotationContextHint(requestedChordName, matchedChordName, options);

  if (strategy) {
    switch (strategy) {
      case 'exact':
        return {
          strategy,
          label: 'Acorde exato',
          detail: 'Esta variação corresponde exatamente ao acorde exibido na cifra atual.',
        };
      case 'slash_root':
        return {
          strategy,
          label: 'Baixo alternativo',
          detail: `Esta leitura usa a base de ${matchedChordName} para representar ${requestedChordName}.`,
        };
      case 'enharmonic':
        return {
          strategy,
          label: 'Equivalente enarmônico',
          detail: [`${matchedChordName} foi priorizado como equivalente de ${requestedChordName}.`, notationHint]
            .filter(Boolean)
            .join(' '),
        };
      case 'minor_base':
        return {
          strategy,
          label: 'Base menor',
          detail: `Esta variação simplifica ${requestedChordName} para a base ${matchedChordName}.`,
        };
      case 'extension_family':
        return {
          strategy,
          label: 'Mesma família harmônica',
          detail: `Esta opção aproxima ${requestedChordName} por uma extensão compatível em ${matchedChordName}.`,
        };
      case 'root_only':
        return {
          strategy,
          label: 'Raiz do acorde',
          detail: `Esta sugestão preserva a tônica de ${requestedChordName} em ${matchedChordName}.`,
        };
    }
  }

  const parsedRequested = parseChord(requestedChordName);
  const parsedMatched = parseChord(matchedChordName);

  if (parsedRequested && parsedMatched && parsedRequested.root === parsedMatched.root) {
    return {
      strategy: 'same_root',
      label: 'Mesma tônica',
      detail: `A variação mantém a mesma tônica de ${requestedChordName} no instrumento atual.`,
    };
  }

  return {
    strategy: 'fallback',
    label: 'Shape disponível',
    detail: 'Esta foi a melhor variação disponível encontrada para o acorde e instrumento atuais.',
  };
}

export function scoreCifraChordNameMatch(
  requestedChordName: string,
  matchedChordName: string,
  options?: CifraChordShapePresetMatchOptions,
): number {
  const strategy = getChordMatchStrategy(requestedChordName, matchedChordName);
  if (strategy) {
    return scorePresetCandidate(requestedChordName, matchedChordName, strategy, options);
  }

  const parsedRequested = parseChord(requestedChordName);
  const parsedMatched = parseChord(matchedChordName);
  if (parsedRequested && parsedMatched && parsedRequested.root === parsedMatched.root) {
    return scorePresetCandidate(requestedChordName, matchedChordName, 'root_only', options) - 40;
  }

  return -1000;
}

function buildChordPresetCandidates(
  chordName: string,
): Array<{ candidate: string; strategy: CifraChordShapePresetMatchStrategy }> {
  const trimmed = chordName.trim();
  if (!trimmed) {
    return [];
  }

  const candidates: Array<{ candidate: string; strategy: CifraChordShapePresetMatchStrategy }> = [
    { candidate: trimmed, strategy: 'exact' },
  ];

  if (trimmed.includes('/')) {
    candidates.push({
      candidate: trimmed.split('/')[0].trim(),
      strategy: 'slash_root',
    });
  }

  const parsed = parseChord(trimmed);
  if (parsed) {
    const rawSuffix = parsed.suffix.trim();
    const normalizedSuffix = rawSuffix
      .replace(/\s+/g, '')
      .replace(/[Δ△]/g, 'maj')
      .toLowerCase();
    const isMinorQuality = normalizedSuffix.startsWith('m') && !normalizedSuffix.startsWith('maj');
    const isMajorSeventhFamily =
      normalizedSuffix.includes('maj') ||
      normalizedSuffix.includes('7m') ||
      normalizedSuffix.includes('9m') ||
      normalizedSuffix.includes('11m') ||
      normalizedSuffix.includes('13m');
    const hasExtendedDominant =
      /(7|9|11|13)/.test(normalizedSuffix) && !isMajorSeventhFamily && !isMinorQuality;
    const hasOtherExtension = /(add|sus|dim|aug|6|°|ø|\+)/.test(normalizedSuffix);
    const minorBase = `${parsed.root}${isMinorQuality ? 'm' : ''}`;
    const enharmonicRoot = ENHARMONIC_EQUIVALENTS[parsed.root] || null;

    if (enharmonicRoot) {
      const enharmonicExact = `${enharmonicRoot}${rawSuffix}`;
      if (enharmonicExact !== trimmed) {
        candidates.push({
          candidate: enharmonicExact,
          strategy: 'enharmonic',
        });
      }
    }

    if (minorBase !== trimmed) {
      candidates.push({
        candidate: minorBase,
        strategy: 'minor_base',
      });
    }

    if (enharmonicRoot) {
      const enharmonicQualityBase = `${enharmonicRoot}${isMinorQuality ? 'm' : ''}`;
      if (enharmonicQualityBase !== trimmed && enharmonicQualityBase !== minorBase) {
        candidates.push({
          candidate: enharmonicQualityBase,
          strategy: 'enharmonic',
        });
      }
    }

    if (hasExtendedDominant) {
      const dominantBase = `${parsed.root}7`;
      if (dominantBase !== trimmed && dominantBase !== minorBase) {
        candidates.push({
          candidate: dominantBase,
          strategy: 'extension_family',
        });
      }

      if (enharmonicRoot) {
        const enharmonicDominantBase = `${enharmonicRoot}7`;
        if (
          enharmonicDominantBase !== trimmed &&
          enharmonicDominantBase !== dominantBase &&
          enharmonicDominantBase !== minorBase
        ) {
          candidates.push({
            candidate: enharmonicDominantBase,
            strategy: 'enharmonic',
          });
        }
      }
    }

    if (hasOtherExtension || isMajorSeventhFamily) {
      if (minorBase !== trimmed) {
        candidates.push({
          candidate: minorBase,
          strategy: 'extension_family',
        });
      }

      if (enharmonicRoot) {
        const enharmonicExtensionBase = `${enharmonicRoot}${isMinorQuality ? 'm' : ''}`;
        if (
          enharmonicExtensionBase !== trimmed &&
          enharmonicExtensionBase !== minorBase
        ) {
          candidates.push({
            candidate: enharmonicExtensionBase,
            strategy: 'enharmonic',
          });
        }
      }
    }

    if (parsed.root !== trimmed) {
      candidates.push({
        candidate: parsed.root,
        strategy: 'root_only',
      });
    }

    if (enharmonicRoot && enharmonicRoot !== parsed.root) {
      candidates.push({
        candidate: enharmonicRoot,
        strategy: 'enharmonic',
      });
    }
  }

  const seen = new Set<string>();
  return candidates.filter(({ candidate }) => {
    const normalized = candidate.trim();
    if (!normalized || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

export function findCifraChordShapePreset(
  instrument: CifraInstrument,
  chordName: string,
  options?: CifraChordShapePresetMatchOptions,
): CifraChordShapePreset | null {
  return findCifraChordShapePresetMatch(instrument, chordName, options)?.preset ?? null;
}

export function findCifraChordShapePresetMatch(
  instrument: CifraInstrument,
  chordName: string,
  options?: CifraChordShapePresetMatchOptions,
): CifraChordShapePresetMatch | null {
  if (instrument === 'outro') {
    return null;
  }

  const presets = CIFRA_CHORD_SHAPE_PRESETS[instrument] ?? [];
  const candidates = buildChordPresetCandidates(chordName);
  const matches: CifraChordShapePresetMatch[] = [];

  for (const { candidate, strategy } of candidates) {
    const preset = presets.find((item) => item.chord_name === candidate);
    if (preset) {
      matches.push({
        requestedChordName: chordName.trim(),
        matchedChordName: candidate,
        strategy,
        preset,
      });
    }
  }

  if (matches.length === 0) {
    return null;
  }

  matches.sort((left, right) => {
    const rightScore = scorePresetCandidate(chordName, right.matchedChordName, right.strategy, options);
    const leftScore = scorePresetCandidate(chordName, left.matchedChordName, left.strategy, options);
    return rightScore - leftScore;
  });

  return matches[0];
}
