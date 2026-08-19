/// <reference types="@cloudflare/workers-types" />
// Cloudflare Pages Function — extrai MP3 de ZIP do archive.org
// Requer nodejs_compat flag para node:stream e node:zlib
import { Readable } from 'node:stream';
import { createInflateRaw, inflateRawSync } from 'node:zlib';
import { getEmergencyArchiveZipSegmentById } from './_emergencyAudioArchives.js';
import { getEmergencyAudioIndexBySegment } from './_emergencyAudioIndex.js';

interface EmergencyArchiveZipSegment {
  id: string;
  start: number;
  end: number;
  originalUrl: string;
  albumSlug: string;
  albumTitle: string;
}

const snapshotCache = new Map<string, string>();
const archiveSizeCache = new Map<string, number>();

const ARCHIVE_FILE_EXTENSION_REGEX = /\.(mp3|wma|mid|midi|wav|ogg|aac|m4a|zip)$/i;
const PRESET_SNAPSHOT_URLS: Record<string, string> = {
  'orquestrados-001-020': 'https://web.archive.org/web/20131016023836if_/http://canticosccb.com.br/zip/acompanhamentos-orquestrados-hinos-001-020-www.canticosccb.com.br.zip',
  'orquestrados-021-040': 'https://web.archive.org/web/20140819140058if_/http://canticosccb.com.br/zip/acompanhamentos-orquestrados-021-040-www.canticosccb.com.br.zip',
  'coletania-026-050': 'https://web.archive.org/web/20140828161051if_/http://canticosccb.com.br/zip/coletania-26-a-50-www.canticosccb.com.br.zip',
  'coletania-101-125': 'https://web.archive.org/web/20140825200915if_/http://canticosccb.com.br/zip/coletania-101-a-125-www.canticosccb.com.br.zip',
  'coletania-126-150': 'https://web.archive.org/web/20140828100005if_/http://canticosccb.com.br/zip/coletania-126-a-150-www.canticosccb.com.br.zip',
  'coletania-201-225': 'https://web.archive.org/web/20140825171156if_/http://canticosccb.com.br/zip/coletania-201-a-225-www.canticosccb.com.br.zip',
  'coletania-226-250': 'https://web.archive.org/web/20140826055502if_/http://canticosccb.com.br/zip/coletania-226-a-250-www.canticosccb.com.br.zip',
  'coletania-251-275': 'https://web.archive.org/web/20140829042046if_/http://canticosccb.com.br/zip/coletania-251-a-275-www.canticosccb.com.br.zip',
  'coletania-276-300': 'https://web.archive.org/web/20140825221806if_/http://canticosccb.com.br/zip/coletania-276-a-300-www.canticosccb.com.br.zip',
  'coletania-301-325': 'https://web.archive.org/web/20140825080110if_/http://canticosccb.com.br/zip/coletania-301-a-325-www.canticosccb.com.br.zip',
  'coletania-326-350': 'https://web.archive.org/web/20140825135416if_/http://canticosccb.com.br/zip/coletania-326-a-350-www.canticosccb.com.br.zip',
  'coletania-351-375': 'https://web.archive.org/web/20140825182807if_/http://canticosccb.com.br/zip/coletania-351-a-375-www.canticosccb.com.br.zip',
  'coletania-426-450': 'https://web.archive.org/web/20140825214657if_/http://canticosccb.com.br/zip/coletania-426-a-450-www.canticosccb.com.br.zip',
  'decio-361-380': 'https://web.archive.org/web/20131008213850if_/http://canticosccb.com.br/zip/decio-4-vozes-361-a380-www.canticosccb.com.br.zip',
  'decio-381-400': 'https://web.archive.org/web/20131016024807if_/http://canticosccb.com.br/zip/decio-4-vozes-hinos-381-a-400-www.canticosccb.com.br.zip',
  'decio-401-420': 'https://web.archive.org/web/20131017003745if_/http://canticosccb.com.br/zip/decio-4-vozes-hinos-401-a-420-www.canticosccb.com.br.zip',
  'decio-461-480': 'https://web.archive.org/web/20131008214125if_/http://canticosccb.com.br/zip/decio-4-vozes-hinos-461-a-480-coros-www.canticosccb.com.br.zip',
};

function stripArchiveSourceMarkers(value: string): string {
  return String(value || '')
    .replace(/\bhttps?:\/\/\S+/gi, ' ')
    .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\.[a-z]{2})?\b/gi, ' ')
    .replace(/\bwww\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripArchiveFileExtension(value: string): string {
  return String(value || '').replace(ARCHIVE_FILE_EXTENSION_REGEX, '').trim();
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
  context: { albumSlug: string; albumTitle: string }
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

async function resolveSnapshotUrl(segment: EmergencyArchiveZipSegment): Promise<string> {
  const cached = snapshotCache.get(segment.id);
  if (cached) {
    return cached;
  }

  const preset = PRESET_SNAPSHOT_URLS[segment.id];
  if (preset) {
    snapshotCache.set(segment.id, preset);
    return preset;
  }

  const timegateUrl = `https://web.archive.org/web/${encodeURIComponent(segment.originalUrl)}`;
  const timegateResponse = await fetch(timegateUrl, {
    method: 'HEAD',
    headers: { 'User-Agent': 'CanticosCCB/1.0 (emergency-audio)' },
    redirect: 'manual',
  });

  const redirectedLocation = timegateResponse.headers.get('location');
  if (redirectedLocation) {
    const resolved = redirectedLocation.replace(/\/web\/(\d+)\//, '/web/$1if_/');
    snapshotCache.set(segment.id, resolved);
    return resolved;
  }

  const cdxUrl =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(segment.originalUrl)}` +
    '&output=json&limit=-1&fl=timestamp,original,statuscode,mimetype';

  const cdxResponse = await fetch(cdxUrl, {
    headers: { 'User-Agent': 'CanticosCCB/1.0 (emergency-audio)' },
    redirect: 'follow',
  });

  if (!cdxResponse.ok) {
    throw new Error(`Wayback retornou ${timegateResponse.status}/${cdxResponse.status} para ${segment.id}.`);
  }

  const payload = await cdxResponse.json();
  const rows = Array.isArray(payload) ? payload.slice(1).filter(Array.isArray) : [];
  const goodRows = rows.filter((row: any[]) => String(row?.[2]) === '200');
  const bestRow = goodRows.length > 0 ? goodRows[goodRows.length - 1] : rows[rows.length - 1];

  if (!bestRow?.[0] || !bestRow?.[1]) {
    throw new Error(`Nenhuma captura válida encontrada para ${segment.id}.`);
  }

  const resolved = `https://web.archive.org/web/${bestRow[0]}if_/${bestRow[1]}`;
  snapshotCache.set(segment.id, resolved);
  return resolved;
}

async function resolveArchiveSize(segment: EmergencyArchiveZipSegment, snapshotUrl: string): Promise<number> {
  const cached = archiveSizeCache.get(segment.id);
  if (typeof cached === 'number' && cached > 0) {
    return cached;
  }

  const headResponse = await fetch(snapshotUrl, {
    method: 'HEAD',
    headers: { 'User-Agent': 'CanticosCCB/1.0 (emergency-audio)' },
    redirect: 'follow',
  });

  if (!headResponse.ok) {
    throw new Error(`O acervo respondeu ${headResponse.status} para ${segment.id}.`);
  }

  const contentLength = Number(headResponse.headers.get('content-length') || 0);
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    throw new Error(`Não foi possível determinar o tamanho do ZIP para ${segment.id}.`);
  }

  archiveSizeCache.set(segment.id, contentLength);
  return contentLength;
}

interface ArchiveZipEntry {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  relativeOffsetOfLocalHeader: number;
  generalPurposeBitFlag: number;
  dataStart?: number;
  dataEnd?: number;
}

async function fetchArchiveRange(snapshotUrl: string, start: number, endExclusive: number): Promise<Buffer> {
  if (endExclusive <= start) {
    return Buffer.alloc(0);
  }

  const response = await fetch(snapshotUrl, {
    headers: {
      'User-Agent': 'CanticosCCB/1.0 (emergency-audio)',
      Range: `bytes=${start}-${endExclusive - 1}`,
    },
    redirect: 'follow',
  });

  if (!(response.ok || response.status === 206)) {
    throw new Error(`Falha ao buscar bytes ${start}-${endExclusive - 1} do ZIP (${response.status}).`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function fetchArchiveRangeResponse(snapshotUrl: string, start: number, endExclusive: number): Promise<Response> {
  if (endExclusive <= start) {
    throw new Error('Faixa inválida solicitada ao acervo.');
  }

  const response = await fetch(snapshotUrl, {
    headers: {
      'User-Agent': 'CanticosCCB/1.0 (emergency-audio)',
      Range: `bytes=${start}-${endExclusive - 1}`,
    },
    redirect: 'follow',
  });

  if (!(response.ok || response.status === 206) || !response.body) {
    throw new Error(`Falha ao abrir bytes ${start}-${endExclusive - 1} do ZIP (${response.status}).`);
  }

  return response;
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  return -1;
}

async function listMp3Entries(
  segment: EmergencyArchiveZipSegment,
  snapshotUrl: string,
  archiveSize: number,
): Promise<ArchiveZipEntry[]> {
  const maxTailSize = 22 + 0xffff;
  const tailSize = Math.min(maxTailSize, archiveSize);
  const tailStart = archiveSize - tailSize;
  const tail = await fetchArchiveRange(snapshotUrl, tailStart, archiveSize);
  const eocdOffset = findEndOfCentralDirectory(tail);

  if (eocdOffset === -1) {
    throw new Error(`Diretório central não encontrado no ZIP de ${segment.id}.`);
  }

  const entryCount = tail.readUInt16LE(eocdOffset + 10);
  const centralDirectorySize = tail.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = tail.readUInt32LE(eocdOffset + 16);

  if (entryCount === 0xffff || centralDirectoryOffset === 0xffffffff || centralDirectorySize === 0xffffffff) {
    throw new Error(`ZIP64 não suportado para ${segment.id}.`);
  }

  const centralDirectory = await fetchArchiveRange(
    snapshotUrl,
    centralDirectoryOffset,
    centralDirectoryOffset + centralDirectorySize,
  );

  const entries: ArchiveZipEntry[] = [];
  let cursor = 0;

  while (cursor + 46 <= centralDirectory.length) {
    const signature = centralDirectory.readUInt32LE(cursor);
    if (signature !== 0x02014b50) {
      break;
    }

    const generalPurposeBitFlag = centralDirectory.readUInt16LE(cursor + 8);
    const compressionMethod = centralDirectory.readUInt16LE(cursor + 10);
    const compressedSize = centralDirectory.readUInt32LE(cursor + 20);
    const uncompressedSize = centralDirectory.readUInt32LE(cursor + 24);
    const fileNameLength = centralDirectory.readUInt16LE(cursor + 28);
    const extraFieldLength = centralDirectory.readUInt16LE(cursor + 30);
    const fileCommentLength = centralDirectory.readUInt16LE(cursor + 32);
    const relativeOffsetOfLocalHeader = centralDirectory.readUInt32LE(cursor + 42);
    const nameStart = cursor + 46;
    const nameEnd = nameStart + fileNameLength;
    const name = centralDirectory.toString('utf8', nameStart, nameEnd).replace(/\\/g, '/');

    if (!/\/$/.test(name) && /\.mp3$/i.test(name)) {
      entries.push({
        name,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        relativeOffsetOfLocalHeader,
        generalPurposeBitFlag,
      });
    }

    cursor = nameEnd + extraFieldLength + fileCommentLength;
  }

  return entries.sort((left, right) => (
    left.name.localeCompare(right.name, 'pt-BR', { numeric: true, sensitivity: 'base' })
  ));
}

async function readEntryBuffer(snapshotUrl: string, entry: ArchiveZipEntry): Promise<Buffer> {
  if ((entry.generalPurposeBitFlag & 0x1) !== 0) {
    throw new Error(`A faixa ${entry.name} está criptografada.`);
  }

  const localHeader = await fetchArchiveRange(
    snapshotUrl,
    entry.relativeOffsetOfLocalHeader,
    entry.relativeOffsetOfLocalHeader + 30,
  );

  if (localHeader.readUInt32LE(0) !== 0x04034b50) {
    throw new Error(`Cabeçalho local inválido para ${entry.name}.`);
  }

  const fileNameLength = localHeader.readUInt16LE(26);
  const extraFieldLength = localHeader.readUInt16LE(28);
  const dataStart = entry.relativeOffsetOfLocalHeader + 30 + fileNameLength + extraFieldLength;
  const dataEnd = dataStart + entry.compressedSize;
  const compressedBody = await fetchArchiveRange(snapshotUrl, dataStart, dataEnd);

  if (entry.compressionMethod === 0) {
    return compressedBody;
  }

  if (entry.compressionMethod === 8) {
    const inflated = inflateRawSync(compressedBody);
    if (entry.uncompressedSize > 0 && inflated.byteLength !== entry.uncompressedSize) {
      throw new Error(`Tamanho inesperado ao descompactar ${entry.name}.`);
    }
    return inflated;
  }

  throw new Error(`Método de compressão ${entry.compressionMethod} não suportado para ${entry.name}.`);
}

async function resolveEntryDataRange(snapshotUrl: string, entry: ArchiveZipEntry): Promise<{ dataStart: number; dataEnd: number }> {
  if (
    Number.isFinite(entry.dataStart)
    && Number.isFinite(entry.dataEnd)
    && (entry.dataEnd as number) > (entry.dataStart as number)
  ) {
    return {
      dataStart: entry.dataStart as number,
      dataEnd: entry.dataEnd as number,
    };
  }

  const localHeader = await fetchArchiveRange(
    snapshotUrl,
    entry.relativeOffsetOfLocalHeader,
    entry.relativeOffsetOfLocalHeader + 30,
  );

  if (localHeader.readUInt32LE(0) !== 0x04034b50) {
    throw new Error(`Cabeçalho local inválido para ${entry.name}.`);
  }

  const fileNameLength = localHeader.readUInt16LE(26);
  const extraFieldLength = localHeader.readUInt16LE(28);
  const dataStart = entry.relativeOffsetOfLocalHeader + 30 + fileNameLength + extraFieldLength;

  return {
    dataStart,
    dataEnd: dataStart + entry.compressedSize,
  };
}

function selectArchiveEntry(
  entries: ArchiveZipEntry[],
  segment: EmergencyArchiveZipSegment,
  number: number,
  title: string
): ArchiveZipEntry | undefined {
  const expectedIndex = number - segment.start;
  if (expectedIndex >= 0 && expectedIndex < entries.length) {
    return entries[expectedIndex];
  }

  const normalizedTarget = normalizeComparableText(title);
  if (!normalizedTarget) {
    return undefined;
  }

  const scored = entries
    .map((entry) => {
      const { name } = entry;
      const cleaned = cleanArchiveTrackTitle(name, {
        albumSlug: segment.albumSlug,
        albumTitle: segment.albumTitle,
      });
      const normalizedEntry = normalizeComparableText(cleaned);
      let score = 0;

      if (normalizedEntry === normalizedTarget) score += 100;
      if (normalizedEntry.includes(normalizedTarget) || normalizedTarget.includes(normalizedEntry)) score += 40;
      for (const token of normalizedTarget.split(' ')) {
        if (token.length >= 3 && normalizedEntry.includes(token)) score += 6;
      }

      return { name, entry, score };
    })
    .sort((left, right) => (
      right.score - left.score
      || left.name.localeCompare(right.name, 'pt-BR', { numeric: true, sensitivity: 'base' })
    ));

  return scored[0] && scored[0].score > 0 ? scored[0].entry : undefined;
}

async function handler(req: Request) {
  const requestUrl = new URL(req.url, 'http://127.0.0.1');
  const { searchParams } = requestUrl;
  const segmentId = String(searchParams.get('segment') || '').trim();
  const number = Number(searchParams.get('number') || 0);
  const title = String(searchParams.get('title') || '').trim();
  const responseFormat = String(searchParams.get('format') || '').trim().toLowerCase();

  if (!segmentId || !Number.isFinite(number) || number <= 0) {
    return new Response(JSON.stringify({ error: 'Parâmetros inválidos para o áudio do acervo.' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const segment = getEmergencyArchiveZipSegmentById(segmentId);
  if (!segment) {
    return new Response(JSON.stringify({ error: 'Segmento do acervo inválido.' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const indexedSegment = getEmergencyAudioIndexBySegment(segment.id);
    let snapshotUrl = typeof indexedSegment?.snapshotUrl === 'string' ? indexedSegment.snapshotUrl : '';
    let selected: ArchiveZipEntry | undefined;
    let dataStart: number | undefined;
    let dataEnd: number | undefined;

    if (snapshotUrl && Array.isArray(indexedSegment?.entries) && indexedSegment.entries.length > 0) {
      selected = selectArchiveEntry(indexedSegment.entries as ArchiveZipEntry[], segment, number, title);
      if (selected) {
        const resolvedRange = await resolveEntryDataRange(snapshotUrl, selected);
        dataStart = resolvedRange.dataStart;
        dataEnd = resolvedRange.dataEnd;
      }
    }

    if (!selected || dataStart === undefined || dataEnd === undefined) {
      snapshotUrl = snapshotUrl || await resolveSnapshotUrl(segment);
      const archiveSize = await resolveArchiveSize(segment, snapshotUrl);
      const entries = await listMp3Entries(segment, snapshotUrl, archiveSize);
      selected = selectArchiveEntry(entries, segment, number, title);

      if (selected) {
        const resolvedRange = await resolveEntryDataRange(snapshotUrl, selected);
        dataStart = resolvedRange.dataStart;
        dataEnd = resolvedRange.dataEnd;
      }
    }

    if (!selected) {
      return new Response(JSON.stringify({ error: 'Faixa não encontrada no segmento do acervo.' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (responseFormat === 'metadata') {
      return new Response(JSON.stringify({
        segmentId: segment.id,
        snapshotUrl,
        entryName: selected.name,
        compressionMethod: selected.compressionMethod,
        compressedSize: selected.compressedSize,
        uncompressedSize: selected.uncompressedSize,
        dataStart,
        dataEnd,
        mimeType: 'audio/mpeg',
        cacheKey: `${segment.id}:${selected.name}:${dataStart}:${dataEnd}:${selected.compressionMethod}`,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const rangeResponse = await fetchArchiveRangeResponse(snapshotUrl, dataStart, dataEnd);

    if (selected.compressionMethod === 0) {
      const contentLength = selected.uncompressedSize || selected.compressedSize;
      return new Response(rangeResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(contentLength),
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'Access-Control-Allow-Origin': '*',
          'Accept-Ranges': 'none',
          'Content-Disposition': `inline; filename="${encodeURIComponent(selected.name.split('/').pop() || 'hino.mp3')}"`,
        },
      });
    }

    if (selected.compressionMethod === 8) {
      const inflatedStream = Readable
        .fromWeb(rangeResponse.body as any)
        .pipe(createInflateRaw());

      return new Response(Readable.toWeb(inflatedStream) as any, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'Access-Control-Allow-Origin': '*',
          'Accept-Ranges': 'none',
          'Content-Disposition': `inline; filename="${encodeURIComponent(selected.name.split('/').pop() || 'hino.mp3')}"`,
        },
      });
    }

    const body = await readEntryBuffer(snapshotUrl, selected);
    return new Response(new Uint8Array(body), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(body.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': `inline; filename="${encodeURIComponent(selected.name.split('/').pop() || 'hino.mp3')}"`,
      },
    });
  } catch (error: any) {
    console.error('[emergency-audio-track]', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Falha ao montar o áudio do acervo.' }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export const onRequest: PagesFunction = async ({ request }) => handler(request);
