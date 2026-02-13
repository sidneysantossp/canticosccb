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

// =============================================
// Chord Diagrams Data (Guitar/Violão)
// =============================================

export interface ChordDiagram {
  name: string;
  frets: number[];     // fret for each string (6 strings, -1 = muted, 0 = open)
  barres: number[];    // barre positions
  baseFret: number;    // starting fret (1 = open position)
  fingers: number[];   // finger assignments (0 = not played)
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

/**
 * Get chord diagram for a chord name (attempts transposed lookup)
 */
export function getChordDiagram(chordName: string): ChordDiagram | null {
  // Direct lookup
  if (GUITAR_CHORDS[chordName]) {
    return GUITAR_CHORDS[chordName];
  }

  // Try without slash bass note
  if (chordName.includes('/')) {
    const base = chordName.split('/')[0];
    if (GUITAR_CHORDS[base]) {
      return { ...GUITAR_CHORDS[base], name: chordName };
    }
  }

  // Try simplified (remove numbers/extensions for basic shape)
  const parsed = parseChord(chordName);
  if (parsed) {
    const simplified = parsed.root + (parsed.suffix.startsWith('m') ? 'm' : '');
    if (GUITAR_CHORDS[simplified]) {
      return { ...GUITAR_CHORDS[simplified], name: chordName };
    }
    // Just root
    if (GUITAR_CHORDS[parsed.root]) {
      return { ...GUITAR_CHORDS[parsed.root], name: chordName };
    }
  }

  return null;
}
