import { isChordLine, isSectionLine } from '@/utils/chordUtils';

export type LegacyCifraQualitySeverity = 'blocker' | 'warning' | 'info';

export type LegacyCifraQualityIssueCode =
  | 'missing_chords'
  | 'missing_lyrics'
  | 'unpaired_chord_line'
  | 'possible_multi_column_import'
  | 'duplicated_progression'
  | 'dense_chord_line'
  | 'stanza_label_removed'
  | 'excess_blank_lines_removed';

export interface LegacyCifraQualityIssue {
  code: LegacyCifraQualityIssueCode;
  severity: LegacyCifraQualitySeverity;
  message: string;
  line?: number;
  autoFixed: boolean;
}

export interface LegacyCifraQualityReport {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  status: 'ready' | 'review_required' | 'blocked';
  canAutoPublish: boolean;
  originalContent: string;
  normalizedContent: string;
  issues: LegacyCifraQualityIssue[];
  stats: {
    chordLines: number;
    lyricLines: number;
    sectionLines: number;
    automaticFixes: number;
    blockers: number;
    warnings: number;
  };
}

const STANZA_LABEL_PATTERNS = [
  /^\s*\[\s*hino\s+\d+\s*\]\s*$/i,
  /^\s*\[?\s*(?:estrofe|verso)\s+\d+\s*\]?\s*$/i,
  /^\s*\d+\s*[ªaºo]?\s*(?:estrofe|verso)\s*:?[\s.]*$/i,
  /^\s*\d+\s*[.)-]\s*$/,
];

const CHORD_TOKEN_PATTERN = /^[A-G](?:#|b)?(?:m|M|maj|min|dim|aug|sus|add|º|°|ø)?\d*(?:\/[A-G](?:#|b)?)?$/;

function isRemovableStanzaLabel(line: string): boolean {
  if (/coro|refr[aã]o/i.test(line)) return false;
  return STANZA_LABEL_PATTERNS.some((pattern) => pattern.test(line));
}

function chordTokens(line: string): string[] {
  return line
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/[()[\],;:]/g, ''))
    .filter((token) => CHORD_TOKEN_PATTERN.test(token));
}

function normalizedChordSignature(line: string): string {
  return chordTokens(line).join(' ');
}

function normalizeSafeContent(content: string, issues: LegacyCifraQualityIssue[]): string {
  const sourceLines = String(content || '').replace(/\r/g, '').split('\n');
  const normalized: string[] = [];
  let blankRun = 0;
  let removedStanzaLabels = 0;
  let removedBlankLines = 0;

  sourceLines.forEach((rawLine) => {
    const line = rawLine.replace(/[ \t]+$/, '');
    if (isRemovableStanzaLabel(line)) {
      removedStanzaLabels += 1;
      return;
    }

    if (!line.trim()) {
      blankRun += 1;
      if (blankRun > 2 || normalized.length === 0) {
        removedBlankLines += 1;
        return;
      }
    } else {
      blankRun = 0;
    }

    normalized.push(line);
  });

  while (normalized.length > 0 && !normalized[normalized.length - 1].trim()) {
    normalized.pop();
    removedBlankLines += 1;
  }

  if (removedStanzaLabels > 0) {
    issues.push({
      code: 'stanza_label_removed',
      severity: 'info',
      message: `${removedStanzaLabels} rótulo(s) de estrofe removido(s); marcações de Coro foram preservadas.`,
      autoFixed: true,
    });
  }

  if (removedBlankLines > 0) {
    issues.push({
      code: 'excess_blank_lines_removed',
      severity: 'info',
      message: `${removedBlankLines} linha(s) vazia(s) excedente(s) removida(s).`,
      autoFixed: true,
    });
  }

  return normalized.join('\n');
}

export function auditLegacyCifraContent(content: string): LegacyCifraQualityReport {
  const originalContent = String(content || '');
  const issues: LegacyCifraQualityIssue[] = [];
  const normalizedContent = normalizeSafeContent(originalContent, issues);
  const lines = normalizedContent.split('\n');
  let chordLines = 0;
  let lyricLines = 0;
  let sectionLines = 0;
  let previousChordSignature = '';

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (isSectionLine(line)) {
      sectionLines += 1;
      return;
    }

    if (!isChordLine(line)) {
      lyricLines += 1;
      return;
    }

    chordLines += 1;
    const signature = normalizedChordSignature(line);
    const tokens = chordTokens(line);
    const nextMeaningful = lines.slice(index + 1).find((candidate) => candidate.trim().length > 0) ?? '';

    if (!nextMeaningful || isChordLine(nextMeaningful) || isSectionLine(nextMeaningful)) {
      issues.push({
        code: 'unpaired_chord_line',
        severity: 'warning',
        message: 'Linha de acordes sem uma linha de letra imediatamente associada.',
        line: index + 1,
        autoFixed: false,
      });
    }

    if (signature && signature === previousChordSignature && tokens.length >= 3) {
      issues.push({
        code: 'duplicated_progression',
        severity: 'warning',
        message: 'Possível progressão de acordes duplicada na importação.',
        line: index + 1,
        autoFixed: false,
      });
    }

    if (/\t.*\t.*\t/.test(line) && /\s{10,}/.test(line)) {
      issues.push({
        code: 'possible_multi_column_import',
        severity: 'blocker',
        message: 'Possível conteúdo importado em duas colunas; exige conferência editorial.',
        line: index + 1,
        autoFixed: false,
      });
    }

    if (tokens.length >= 10) {
      issues.push({
        code: 'dense_chord_line',
        severity: 'warning',
        message: 'Quantidade incomum de acordes em uma única linha.',
        line: index + 1,
        autoFixed: false,
      });
    }

    previousChordSignature = signature;
  });

  if (chordLines === 0) {
    issues.push({
      code: 'missing_chords',
      severity: 'blocker',
      message: 'Nenhuma linha de acordes foi reconhecida.',
      autoFixed: false,
    });
  }

  if (lyricLines === 0) {
    issues.push({
      code: 'missing_lyrics',
      severity: 'blocker',
      message: 'Nenhuma linha de letra foi reconhecida.',
      autoFixed: false,
    });
  }

  const blockers = issues.filter((issue) => issue.severity === 'blocker').length;
  const warnings = issues.filter((issue) => issue.severity === 'warning').length;
  const automaticFixes = issues.filter((issue) => issue.autoFixed).length;
  const score = Math.max(0, 100 - blockers * 35 - warnings * 8);
  const status = blockers > 0 ? 'blocked' : warnings > 0 ? 'review_required' : 'ready';

  return {
    score,
    confidence: blockers > 0 ? 'low' : warnings > 0 ? 'medium' : 'high',
    status,
    // Musical accuracy always needs a human approval, even when formatting is clean.
    canAutoPublish: false,
    originalContent,
    normalizedContent,
    issues,
    stats: {
      chordLines,
      lyricLines,
      sectionLines,
      automaticFixes,
      blockers,
      warnings,
    },
  };
}
