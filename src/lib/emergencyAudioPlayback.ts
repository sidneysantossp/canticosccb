import { inflateRaw } from 'pako';
import { getEmergencyAudioIndexBySegment } from '../../api/_emergencyAudioIndex.js';

interface EmergencyAudioEntry {
  name: string;
  generalPurposeBitFlag: number;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  relativeOffsetOfLocalHeader: number;
  dataStart?: number;
  dataEnd?: number;
}

interface EmergencyAudioSegmentIndex {
  segment: {
    id: string;
    start: number;
    end: number;
    albumSlug: string;
    albumTitle: string;
  };
  snapshotUrl: string;
  entries: EmergencyAudioEntry[];
}

const resolvedUrlCache = new Map<string, string>();
const resolvedRangeCache = new Map<string, { dataStart: number; dataEnd: number }>();
const pendingUrlCache = new Map<string, Promise<string>>();

function stripArchiveFileExtension(value: string): string {
  return String(value || '').replace(/\.(mp3|wma|mid|midi|wav|ogg|aac|m4a|zip)$/i, '').trim();
}

function stripArchiveSourceMarkers(value: string): string {
  return String(value || '')
    .replace(/\bhttps?:\/\/\S+/gi, ' ')
    .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\.[a-z]{2})?\b/gi, ' ')
    .replace(/\bwww\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(value: string): string {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (/^\d+$/.test(word)) return word;
      if (word.length <= 2) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\bCcb\b/g, 'CCB');
}

function cleanArchiveTrackTitle(
  fileName: string,
  context: { albumSlug: string; albumTitle: string },
): string {
  const baseName = String(fileName || '').split('/').pop() || String(fileName || '');
  const withoutExtension = stripArchiveFileExtension(baseName);
  const withoutSource = stripArchiveSourceMarkers(withoutExtension)
    .replace(new RegExp(`^${context.albumSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'), '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const cleaned = withoutSource
    .replace(/^\d+[\s._-]*/, '')
    .replace(/([0-9])([A-Za-zÀ-ÿ])/g, '$1 $2')
    .replace(/([a-zà-ÿ])([A-ZÀ-Ý])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  return titleCase(cleaned || 'Faixa do Acervo');
}

function normalizeComparableText(value?: string | null): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeEmergencyRouteUrl(routeUrl: string): URL | null {
  try {
    const parsed = new URL(routeUrl, window.location.origin);
    if (parsed.pathname !== '/api/emergency-audio-track') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getEmergencyApiOrigin(routeUrl?: string | null): string {
  const normalized = normalizeEmergencyRouteUrl(String(routeUrl || '').trim());
  if (normalized?.origin) {
    return normalized.origin;
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  return 'https://www.canticosccb.com.br';
}

export function isEmergencyArchiveRouteUrl(routeUrl?: string | null): boolean {
  return !!normalizeEmergencyRouteUrl(String(routeUrl || '').trim());
}

export function getCachedEmergencyPlaybackUrl(routeUrl: string): string | null {
  const normalized = normalizeEmergencyRouteUrl(routeUrl);
  if (!normalized) {
    return null;
  }

  const segmentId = String(normalized.searchParams.get('segment') || '').trim();
  const number = Number(normalized.searchParams.get('number') || 0);
  const title = String(normalized.searchParams.get('title') || '').trim();
  const indexedSegment = getEmergencyAudioIndexBySegment(segmentId) as EmergencyAudioSegmentIndex | undefined;

  if (!indexedSegment || !Array.isArray(indexedSegment.entries) || indexedSegment.entries.length === 0) {
    return null;
  }

  const selectedEntry = selectEntry(indexedSegment.entries, indexedSegment.segment, number, title);
  if (!selectedEntry) {
    return null;
  }

  const cachedCandidate = Array.from(resolvedUrlCache.entries()).find(([cacheKey]) =>
    cacheKey.startsWith(`${indexedSegment.segment.id}:${selectedEntry.name}:`)
  );

  return cachedCandidate?.[1] || null;
}

function selectEntry(
  entries: EmergencyAudioEntry[],
  segment: EmergencyAudioSegmentIndex['segment'],
  number: number,
  title: string,
): EmergencyAudioEntry | undefined {
  const normalizedTitle = normalizeComparableText(title);
  const expectedIndex = number - segment.start;
  const expectedEntry = expectedIndex >= 0 && expectedIndex < entries.length
    ? entries[expectedIndex]
    : undefined;

  if (!normalizedTitle) {
    return expectedEntry;
  }

  const scoredEntries = entries
    .map((entry) => {
      const cleaned = cleanArchiveTrackTitle(entry.name, {
        albumSlug: segment.albumSlug,
        albumTitle: segment.albumTitle,
      });
      const normalizedEntry = normalizeComparableText(cleaned);
      let score = 0;

      if (normalizedEntry === normalizedTitle) score += 100;
      if (normalizedEntry.includes(normalizedTitle) || normalizedTitle.includes(normalizedEntry)) score += 40;
      for (const token of normalizedTitle.split(' ')) {
        if (token.length >= 3 && normalizedEntry.includes(token)) {
          score += 6;
        }
      }

      return { entry, score };
    })
    .sort((left, right) => right.score - left.score);

  if (expectedEntry) {
    const expectedTitle = normalizeComparableText(cleanArchiveTrackTitle(expectedEntry.name, {
      albumSlug: segment.albumSlug,
      albumTitle: segment.albumTitle,
    }));
    if (
      expectedTitle === normalizedTitle ||
      expectedTitle.includes(normalizedTitle) ||
      normalizedTitle.includes(expectedTitle)
    ) {
      return expectedEntry;
    }
  }

  return scoredEntries[0]?.score > 0 ? scoredEntries[0].entry : expectedEntry;
}

async function fetchArchiveRangeViaProxy(
  snapshotUrl: string,
  start: number,
  endExclusive: number,
  apiOrigin?: string,
): Promise<Uint8Array> {
  const proxyUrl = new URL(
    `/api/archive-proxy?url=${encodeURIComponent(snapshotUrl)}`,
    apiOrigin || getEmergencyApiOrigin(),
  ).toString();
  const response = await fetch(proxyUrl, {
    headers: {
      Range: `bytes=${start}-${endExclusive - 1}`,
    },
  });

  if (!(response.ok || response.status === 206)) {
    throw new Error(`Não foi possível baixar a faixa do acervo (${response.status}).`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function resolveEntryDataRange(
  snapshotUrl: string,
  entry: EmergencyAudioEntry,
  cacheKey: string,
  apiOrigin?: string,
): Promise<{ dataStart: number; dataEnd: number }> {
  const cached = resolvedRangeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (
    Number.isFinite(entry.dataStart)
    && Number.isFinite(entry.dataEnd)
    && (entry.dataEnd as number) > (entry.dataStart as number)
  ) {
    const resolvedRange = {
      dataStart: entry.dataStart as number,
      dataEnd: entry.dataEnd as number,
    };
    resolvedRangeCache.set(cacheKey, resolvedRange);
    return resolvedRange;
  }

  const localHeader = await fetchArchiveRangeViaProxy(
    snapshotUrl,
    entry.relativeOffsetOfLocalHeader,
    entry.relativeOffsetOfLocalHeader + 30,
    apiOrigin,
  );

  const view = new DataView(localHeader.buffer, localHeader.byteOffset, localHeader.byteLength);
  if (view.getUint32(0, true) !== 0x04034b50) {
    throw new Error('Cabeçalho local inválido do acervo.');
  }

  const fileNameLength = view.getUint16(26, true);
  const extraFieldLength = view.getUint16(28, true);
  const resolvedRange = {
    dataStart: entry.relativeOffsetOfLocalHeader + 30 + fileNameLength + extraFieldLength,
    dataEnd: entry.relativeOffsetOfLocalHeader + 30 + fileNameLength + extraFieldLength + entry.compressedSize,
  };

  resolvedRangeCache.set(cacheKey, resolvedRange);
  return resolvedRange;
}

export async function resolveEmergencyPlaybackUrl(routeUrl: string): Promise<string> {
  const normalized = normalizeEmergencyRouteUrl(routeUrl);
  if (!normalized) {
    return routeUrl;
  }
  const apiOrigin = getEmergencyApiOrigin(normalized.toString());

  const pending = pendingUrlCache.get(routeUrl);
  if (pending) {
    return pending;
  }

  const run = (async () => {
    const segmentId = String(normalized.searchParams.get('segment') || '').trim();
    const number = Number(normalized.searchParams.get('number') || 0);
    const title = String(normalized.searchParams.get('title') || '').trim();
    const indexedSegment = getEmergencyAudioIndexBySegment(segmentId) as EmergencyAudioSegmentIndex | undefined;

    if (!indexedSegment || !Array.isArray(indexedSegment.entries) || indexedSegment.entries.length === 0) {
      throw new Error('Segmento do acervo não está disponível.');
    }

    const selectedEntry = selectEntry(indexedSegment.entries, indexedSegment.segment, number, title);
    if (!selectedEntry) {
      throw new Error('Faixa do acervo não encontrada.');
    }

    const { dataStart, dataEnd } = await resolveEntryDataRange(
      indexedSegment.snapshotUrl,
      selectedEntry,
      `${indexedSegment.segment.id}:${selectedEntry.name}`,
      apiOrigin,
    );
    const cacheKey = `${indexedSegment.segment.id}:${selectedEntry.name}:${dataStart}:${dataEnd}`;
    const cachedUrl = resolvedUrlCache.get(cacheKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    const compressedBody = await fetchArchiveRangeViaProxy(
      indexedSegment.snapshotUrl,
      dataStart,
      dataEnd,
      apiOrigin,
    );
    const decompressedBody = selectedEntry.compressionMethod === 8
      ? inflateRaw(compressedBody)
      : compressedBody;

    const objectUrl = URL.createObjectURL(new Blob(
      [(decompressedBody as Uint8Array).buffer as ArrayBuffer],
      { type: 'audio/mpeg' },
    ));

    resolvedUrlCache.set(cacheKey, objectUrl);
    return objectUrl;
  })();

  pendingUrlCache.set(routeUrl, run);

  try {
    return await run;
  } finally {
    pendingUrlCache.delete(routeUrl);
  }
}

export async function prewarmEmergencyPlaybackUrl(routeUrl?: string | null): Promise<string | null> {
  const normalized = normalizeEmergencyRouteUrl(String(routeUrl || '').trim());
  if (!normalized) {
    return null;
  }

  const cached = getCachedEmergencyPlaybackUrl(normalized.toString());
  if (cached) {
    return cached;
  }

  try {
    return await resolveEmergencyPlaybackUrl(normalized.toString());
  } catch (error) {
    console.warn('⚠️ Falha ao pré-aquecer áudio do acervo', error);
    return null;
  }
}
