// =============================================
// Chord Transposition & Parsing Utilities
// =============================================

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Keys that prefer flats
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm'];

function noteIndex(note: string): number {
  const n = note.replace('b', 'b').replace('#', '#');
  let idx = NOTES_SHARP.indexOf(n);
  if (idx === -1) idx = NOTES_FLAT.indexOf(n);
  return idx;
}

function isFlat(key: string): boolean {
  return FLAT_KEYS.includes(key);
}

/**
 * Parse a chord string into root note + suffix
 * e.g. "Am7" -> { root: "A", suffix: "m7" }
 *      "C#m" -> { root: "C#", suffix: "m" }
 *      "Bb7M" -> { root: "Bb", suffix: "7M" }
 */
export function parseChord(chord: string): { root: string; suffix: string } | null {
  const match = chord.match(/^([A-G][#b]?)(.*)/);
  if (!match) return null;
  return { root: match[1], suffix: match[2] };
}

/**
 * Transpose a single chord by a number of semitones
 */
export function transposeChord(chord: string, semitones: number, targetKey?: string): string {
  // Handle slash chords like G/B
  if (chord.includes('/')) {
    const parts = chord.split('/');
    return parts.map(p => transposeChord(p.trim(), semitones, targetKey)).join('/');
  }

  const parsed = parseChord(chord);
  if (!parsed) return chord;

  const idx = noteIndex(parsed.root);
  if (idx === -1) return chord;

  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  const useFlats = targetKey ? isFlat(targetKey) : isFlat(parsed.root + parsed.suffix);
  const notes = useFlats ? NOTES_FLAT : NOTES_SHARP;

  return notes[newIdx] + parsed.suffix;
}

/**
 * Transpose all chords in a line of text
 */
export function transposeChordLine(line: string, semitones: number, targetKey?: string): string {
  if (semitones === 0) return line;
  return line.replace(/\b([A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]?(?:\/[A-G][#b]?)?)\b/g, (match) => {
    return transposeChord(match, semitones, targetKey);
  });
}

/**
 * Check if a line is a chord line (contains mostly chords, not lyrics)
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Section markers are not chord lines
  if (/^\[.*\]$/.test(trimmed)) return false;

  // Split by spaces and check if most tokens are chords
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  const chordCount = tokens.filter(t => {
    // Remove parentheses
    const clean = t.replace(/[()]/g, '');
    return /^[A-G][#b]?(?:m|M|maj|min|dim|aug|sus|add|7|9|11|13|6|4|2|°|ø)?(?:\d+)?(?:\/[A-G][#b]?)?$/.test(clean);
  }).length;

  return chordCount / tokens.length >= 0.5;
}

/**
 * Check if a line is a section marker like [Intro], [Refrão], etc.
 */
export function isSectionLine(line: string): boolean {
  return /^\s*\[.*\]\s*$/.test(line);
}

/**
 * Extract all unique chords from cifra content
 */
export function extractChords(content: string): string[] {
  const chords = new Set<string>();
  const lines = content.split('\n');

  for (const line of lines) {
    if (isChordLine(line)) {
      const tokens = line.trim().split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        const clean = token.replace(/[()]/g, '');
        if (parseChord(clean)) {
          chords.add(clean);
        }
      }
    }
  }

  return Array.from(chords);
}

/**
 * Calculate semitone difference from one key to another
 */
export function getSemitonesBetweenKeys(fromKey: string, toKey: string): number {
  const fromRoot = parseChord(fromKey)?.root;
  const toRoot = parseChord(toKey)?.root;
  if (!fromRoot || !toRoot) return 0;

  const fromIdx = noteIndex(fromRoot);
  const toIdx = noteIndex(toRoot);
  if (fromIdx === -1 || toIdx === -1) return 0;

  return ((toIdx - fromIdx) % 12 + 12) % 12;
}

/**
 * Transpose entire cifra content
 */
export function transposeCifraContent(content: string, semitones: number, targetKey?: string): string {
  if (semitones === 0) return content;

  const lines = content.split('\n');
  return lines.map(line => {
    if (isChordLine(line)) {
      return transposeChordLine(line, semitones, targetKey);
    }
    return line;
  }).join('\n');
}

/**
 * Reduces a chord chart to the four most approachable harmonic functions.
 * It is a reading aid for beginners: the original chart is never changed.
 */
export function simplifyCifraContent(content: string, key: string): string {
  const tonic = parseChord(key);
  if (!tonic) return content;
  const tonicIndex = noteIndex(tonic.root);
  if (tonicIndex === -1) return content;
  const isMinorKey = tonic.suffix.startsWith('m');

  const simplifyChord = (chord: string) => {
    const parsed = parseChord(chord.replace(/[()]/g, '').split('/')[0]);
    if (!parsed) return chord;
    const chordIndex = noteIndex(parsed.root);
    if (chordIndex === -1) return chord;
    const degree = (chordIndex - tonicIndex + 12) % 12;

    const targetDegree = isMinorKey
      ? ({ 0: 0, 2: 7, 3: 8, 5: 8, 7: 7, 8: 8, 10: 10 }[degree] ?? 7)
      : ({ 0: 0, 2: 2, 4: 9, 5: 5, 7: 7, 9: 9, 11: 7 }[degree] ?? 0);
    const root = transposeChord(tonic.root, targetDegree, key);
    const minor = (isMinorKey && targetDegree === 0) || (!isMinorKey && targetDegree === 9);
    const seventh = !isMinorKey && targetDegree === 2 && parsed.suffix.includes('7');
    return `${root}${minor ? 'm' : seventh ? '7' : ''}`;
  };

  return content.split('\n').map((line) => {
    if (!isChordLine(line)) return line;
    return line.replace(/(?<![A-Za-z0-9#b])([A-G][#b]?(?:m|M|maj|min|dim|aug|sus|add)?[0-9]?(?:\/[A-G][#b]?)?)(?![A-Za-z0-9#b])/g, simplifyChord);
  }).join('\n');
}

// =============================================
// Chord Diagrams Data (Guitar/Violão)
// =============================================

export interface ChordDiagram {
  name: string;
  frets: number[];     // fret for each string (6 strings, -1 = muted, 0 = open)
  barres: number[];    // barre positions
  baseFret: number;    // starting fret (1 = open position)
  fingers: number[];   // finger assignments (0 = not played)
  stringCount?: number;
}

// Common guitar chord diagrams
export const GUITAR_CHORDS: Record<string, ChordDiagram> = {
  'C':    { name: 'C',    frets: [-1, 3, 2, 0, 1, 0], barres: [], baseFret: 1, fingers: [0, 3, 2, 0, 1, 0] },
  'D':    { name: 'D',    frets: [-1, -1, 0, 2, 3, 2], barres: [], baseFret: 1, fingers: [0, 0, 0, 1, 3, 2] },
  'E':    { name: 'E',    frets: [0, 2, 2, 1, 0, 0], barres: [], baseFret: 1, fingers: [0, 2, 3, 1, 0, 0] },
  'F':    { name: 'F',    frets: [1, 1, 2, 3, 3, 1], barres: [1], baseFret: 1, fingers: [1, 1, 2, 3, 4, 1] },
  'G':    { name: 'G',    frets: [3, 2, 0, 0, 0, 3], barres: [], baseFret: 1, fingers: [2, 1, 0, 0, 0, 3] },
  'A':    { name: 'A',    frets: [-1, 0, 2, 2, 2, 0], barres: [], baseFret: 1, fingers: [0, 0, 1, 2, 3, 0] },
  'B':    { name: 'B',    frets: [-1, 2, 4, 4, 4, 2], barres: [2], baseFret: 1, fingers: [0, 1, 2, 3, 4, 1] },
  'Am':   { name: 'Am',   frets: [-1, 0, 2, 2, 1, 0], barres: [], baseFret: 1, fingers: [0, 0, 2, 3, 1, 0] },
  'Bm':   { name: 'Bm',   frets: [-1, 2, 4, 4, 3, 2], barres: [2], baseFret: 1, fingers: [0, 1, 3, 4, 2, 1] },
  'Cm':   { name: 'Cm',   frets: [-1, 3, 5, 5, 4, 3], barres: [3], baseFret: 1, fingers: [0, 1, 3, 4, 2, 1] },
  'Dm':   { name: 'Dm',   frets: [-1, -1, 0, 2, 3, 1], barres: [], baseFret: 1, fingers: [0, 0, 0, 2, 3, 1] },
  'Em':   { name: 'Em',   frets: [0, 2, 2, 0, 0, 0], barres: [], baseFret: 1, fingers: [0, 2, 3, 0, 0, 0] },
  'Fm':   { name: 'Fm',   frets: [1, 1, 1, 3, 3, 1], barres: [1], baseFret: 1, fingers: [1, 1, 1, 3, 4, 1] },
  'Gm':   { name: 'Gm',   frets: [3, 1, 0, 0, 3, 3], barres: [], baseFret: 1, fingers: [2, 1, 0, 0, 3, 4] },
  'C#':   { name: 'C#',   frets: [-1, 4, 3, 1, 2, 1], barres: [1], baseFret: 1, fingers: [0, 4, 3, 1, 2, 1] },
  'Db':   { name: 'Db',   frets: [-1, 4, 3, 1, 2, 1], barres: [1], baseFret: 1, fingers: [0, 4, 3, 1, 2, 1] },
  'Eb':   { name: 'Eb',   frets: [-1, -1, 1, 3, 4, 3], barres: [], baseFret: 1, fingers: [0, 0, 1, 2, 4, 3] },
  'F#':   { name: 'F#',   frets: [2, 2, 3, 4, 4, 2], barres: [2], baseFret: 1, fingers: [1, 1, 2, 3, 4, 1] },
  'Gb':   { name: 'Gb',   frets: [2, 2, 3, 4, 4, 2], barres: [2], baseFret: 1, fingers: [1, 1, 2, 3, 4, 1] },
  'Ab':   { name: 'Ab',   frets: [4, 4, 5, 6, 6, 4], barres: [4], baseFret: 1, fingers: [1, 1, 2, 3, 4, 1] },
  'Bb':   { name: 'Bb',   frets: [-1, 1, 3, 3, 3, 1], barres: [1], baseFret: 1, fingers: [0, 1, 2, 3, 4, 1] },
  'C#m':  { name: 'C#m',  frets: [-1, 4, 2, 1, 2, 0], barres: [], baseFret: 1, fingers: [0, 4, 2, 1, 3, 0] },
  'Ebm':  { name: 'Ebm',  frets: [-1, -1, 1, 3, 4, 2], barres: [], baseFret: 1, fingers: [0, 0, 1, 3, 4, 2] },
  'F#m':  { name: 'F#m',  frets: [2, 2, 2, 4, 4, 2], barres: [2], baseFret: 1, fingers: [1, 1, 1, 3, 4, 1] },
  'Abm':  { name: 'Abm',  frets: [4, 4, 4, 6, 6, 4], barres: [4], baseFret: 1, fingers: [1, 1, 1, 3, 4, 1] },
  'Bbm':  { name: 'Bbm',  frets: [-1, 1, 3, 3, 2, 1], barres: [1], baseFret: 1, fingers: [0, 1, 3, 4, 2, 1] },
  // 7th chords
  'C7':   { name: 'C7',   frets: [-1, 3, 2, 3, 1, 0], barres: [], baseFret: 1, fingers: [0, 3, 2, 4, 1, 0] },
  'D7':   { name: 'D7',   frets: [-1, -1, 0, 2, 1, 2], barres: [], baseFret: 1, fingers: [0, 0, 0, 2, 1, 3] },
  'E7':   { name: 'E7',   frets: [0, 2, 0, 1, 0, 0], barres: [], baseFret: 1, fingers: [0, 2, 0, 1, 0, 0] },
  'G7':   { name: 'G7',   frets: [3, 2, 0, 0, 0, 1], barres: [], baseFret: 1, fingers: [3, 2, 0, 0, 0, 1] },
  'A7':   { name: 'A7',   frets: [-1, 0, 2, 0, 2, 0], barres: [], baseFret: 1, fingers: [0, 0, 1, 0, 2, 0] },
  'B7':   { name: 'B7',   frets: [-1, 2, 1, 2, 0, 2], barres: [], baseFret: 1, fingers: [0, 2, 1, 3, 0, 4] },
};

// Standard ukulele tuning: G-C-E-A. These shapes are used when no editorial
// shape has been registered in the database yet.
export const UKULELE_CHORDS: Record<string, ChordDiagram> = {
  C: { name: 'C', frets: [0, 0, 0, 3], barres: [], baseFret: 1, fingers: [0, 0, 0, 3], stringCount: 4 },
  D: { name: 'D', frets: [2, 2, 2, 0], barres: [2], baseFret: 1, fingers: [1, 1, 1, 0], stringCount: 4 },
  E: { name: 'E', frets: [1, 4, 0, 2], barres: [], baseFret: 1, fingers: [1, 4, 0, 2], stringCount: 4 },
  F: { name: 'F', frets: [2, 0, 1, 0], barres: [], baseFret: 1, fingers: [2, 0, 1, 0], stringCount: 4 },
  G: { name: 'G', frets: [0, 2, 3, 2], barres: [], baseFret: 1, fingers: [0, 1, 3, 2], stringCount: 4 },
  A: { name: 'A', frets: [2, 1, 0, 0], barres: [], baseFret: 1, fingers: [2, 1, 0, 0], stringCount: 4 },
  B: { name: 'B', frets: [4, 3, 2, 2], barres: [2], baseFret: 1, fingers: [3, 2, 1, 1], stringCount: 4 },
  Am: { name: 'Am', frets: [2, 0, 0, 0], barres: [], baseFret: 1, fingers: [2, 0, 0, 0], stringCount: 4 },
  Bm: { name: 'Bm', frets: [4, 2, 2, 2], barres: [2], baseFret: 1, fingers: [3, 1, 1, 1], stringCount: 4 },
  Cm: { name: 'Cm', frets: [0, 3, 3, 3], barres: [3], baseFret: 1, fingers: [0, 1, 1, 1], stringCount: 4 },
  Dm: { name: 'Dm', frets: [2, 2, 1, 0], barres: [], baseFret: 1, fingers: [2, 3, 1, 0], stringCount: 4 },
  Em: { name: 'Em', frets: [0, 4, 3, 2], barres: [], baseFret: 1, fingers: [0, 3, 2, 1], stringCount: 4 },
  Fm: { name: 'Fm', frets: [1, 0, 1, 3], barres: [], baseFret: 1, fingers: [1, 0, 2, 4], stringCount: 4 },
  Gm: { name: 'Gm', frets: [0, 2, 3, 1], barres: [], baseFret: 1, fingers: [0, 2, 3, 1], stringCount: 4 },
  'C#': { name: 'C#', frets: [1, 1, 1, 4], barres: [1], baseFret: 1, fingers: [1, 1, 1, 4], stringCount: 4 },
  Db: { name: 'Db', frets: [1, 1, 1, 4], barres: [1], baseFret: 1, fingers: [1, 1, 1, 4], stringCount: 4 },
  Eb: { name: 'Eb', frets: [3, 3, 3, 1], barres: [3], baseFret: 1, fingers: [2, 3, 4, 1], stringCount: 4 },
  'F#': { name: 'F#', frets: [3, 1, 2, 1], barres: [], baseFret: 1, fingers: [3, 1, 2, 1], stringCount: 4 },
  Gb: { name: 'Gb', frets: [3, 1, 2, 1], barres: [], baseFret: 1, fingers: [3, 1, 2, 1], stringCount: 4 },
  Ab: { name: 'Ab', frets: [5, 3, 4, 3], barres: [], baseFret: 1, fingers: [3, 1, 2, 1], stringCount: 4 },
  Bb: { name: 'Bb', frets: [3, 2, 1, 1], barres: [1], baseFret: 1, fingers: [3, 2, 1, 1], stringCount: 4 },
  C7: { name: 'C7', frets: [0, 0, 0, 1], barres: [], baseFret: 1, fingers: [0, 0, 0, 1], stringCount: 4 },
  D7: { name: 'D7', frets: [2, 2, 2, 3], barres: [2], baseFret: 1, fingers: [1, 1, 1, 2], stringCount: 4 },
  E7: { name: 'E7', frets: [1, 2, 0, 2], barres: [], baseFret: 1, fingers: [1, 2, 0, 3], stringCount: 4 },
  F7: { name: 'F7', frets: [2, 3, 1, 3], barres: [], baseFret: 1, fingers: [2, 3, 1, 4], stringCount: 4 },
  G7: { name: 'G7', frets: [0, 2, 1, 2], barres: [], baseFret: 1, fingers: [0, 2, 1, 3], stringCount: 4 },
  A7: { name: 'A7', frets: [0, 1, 0, 0], barres: [], baseFret: 1, fingers: [0, 1, 0, 0], stringCount: 4 },
  B7: { name: 'B7', frets: [2, 3, 2, 2], barres: [2], baseFret: 1, fingers: [1, 2, 1, 1], stringCount: 4 },
};

/**
 * Get chord diagram for a chord name (attempts transposed lookup)
 */
export function getChordDiagram(chordName: string): ChordDiagram | null {
  return getChordDiagramForInstrument(chordName, 'violao');
}

export function getChordDiagramForInstrument(chordName: string, instrument: string): ChordDiagram | null {
  const dictionary = instrument === 'ukulele' ? UKULELE_CHORDS : GUITAR_CHORDS;
  // Direct lookup
  if (dictionary[chordName]) {
    return dictionary[chordName];
  }

  // Try without slash bass note
  if (chordName.includes('/')) {
    const base = chordName.split('/')[0];
    if (dictionary[base]) {
      return { ...dictionary[base], name: chordName };
    }
  }

  // Try simplified (remove numbers/extensions for basic shape)
  const parsed = parseChord(chordName);
  if (parsed) {
    const simplified = parsed.root + (parsed.suffix.startsWith('m') ? 'm' : '');
    if (dictionary[simplified]) {
      return { ...dictionary[simplified], name: chordName };
    }
    // Just root
    if (dictionary[parsed.root]) {
      return { ...dictionary[parsed.root], name: chordName };
    }
  }

  return null;
}
