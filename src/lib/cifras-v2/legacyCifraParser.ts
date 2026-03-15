import { isChordLine, isSectionLine } from '@/utils/chordUtils';
import type { CifraSectionKey, CifraLineNode } from '@/types/cifras-v2';

import type { CifraVersionSectionDraft } from './cifraPublicationService';

const SECTION_KEYWORDS: Array<{ match: RegExp; key: CifraSectionKey }> = [
  { match: /intro/i, key: 'intro' },
  { match: /refr[aã]o|coro/i, key: 'chorus' },
  { match: /ponte|bridge/i, key: 'bridge' },
  { match: /final|fim|ending/i, key: 'ending' },
  { match: /turnaround|virada/i, key: 'turnaround' },
  { match: /estrofe|verso|primeira parte|segunda parte|terceira parte|quarta parte/i, key: 'verse' },
];

function normalizeSectionLabel(rawLabel: string, fallbackIndex: number): string {
  const label = rawLabel.replace(/^\[|\]$/g, '').trim();
  return label || `Secao ${fallbackIndex}`;
}

function inferSectionKey(label: string): CifraSectionKey {
  const found = SECTION_KEYWORDS.find((entry) => entry.match.test(label));
  return found?.key ?? 'custom';
}

function createLineNode(rawLine: string): CifraLineNode {
  if (isChordLine(rawLine)) {
    return { type: 'chord_line', text: rawLine };
  }

  return { type: 'lyric', text: rawLine };
}

export function parsePlainTextSectionLines(content: string): CifraLineNode[] {
  return String(content || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => createLineNode(line.replace(/\s+$/, '')));
}

export function serializeSectionLines(lines: CifraLineNode[]): string {
  return lines
    .map((line) => {
      if (line.text !== undefined) {
        return line.text;
      }

      if (!line.segments?.length) {
        return '';
      }

      return line.segments
        .map((segment) => [segment.chord, segment.lyric].filter(Boolean).join(' '))
        .join(' ')
        .trim();
    })
    .join('\n');
}

export function parseLegacyCifraContent(content: string): CifraVersionSectionDraft[] {
  const lines = String(content || '').replace(/\r/g, '').split('\n');
  const sections: CifraVersionSectionDraft[] = [];

  let currentLabel = 'Corpo';
  let currentKey: CifraSectionKey = 'verse';
  let currentLines: CifraLineNode[] = [];

  const flushSection = () => {
    const hasMeaningfulContent = currentLines.some((line) => (line.text ?? '').trim().length > 0);
    if (!hasMeaningfulContent && sections.length > 0) {
      currentLines = [];
      return;
    }

    sections.push({
      key: currentKey,
      label: currentLabel,
      order: sections.length + 1,
      lines: currentLines.length > 0 ? [...currentLines] : [{ type: 'lyric', text: '' }],
    });
    currentLines = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.replace(/\s+$/, '');

    if (isSectionLine(line)) {
      const hasCurrentContent = currentLines.some((currentLine) => (currentLine.text ?? '').trim().length > 0);
      if (hasCurrentContent) {
        flushSection();
      }

      currentLabel = normalizeSectionLabel(line, sections.length + 1);
      currentKey = inferSectionKey(currentLabel);
      currentLines = [];
      return;
    }

    currentLines.push(createLineNode(line));
  });

  if (currentLines.length > 0 || sections.length === 0) {
    flushSection();
  }

  return sections.map((section, index) => ({
    ...section,
    order: index + 1,
    label: normalizeSectionLabel(section.label, index + 1),
  }));
}
