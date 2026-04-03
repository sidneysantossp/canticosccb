import { writeFile } from 'node:fs/promises';
import { EMERGENCY_ARCHIVE_ZIP_SEGMENTS } from '../api/_emergencyAudioArchives.js';

const OUTPUT_PATH = new URL('../api/_emergencyAudioIndex.js', import.meta.url);
const USER_AGENT = 'CanticosCCB/1.0 (emergency-audio-index)';
const PRESET_SNAPSHOT_URLS = {
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const findEocd = (buffer) => {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
};

async function fetchWithRetry(url, options = {}, label = 'request', retries = 4) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        ...options,
        headers: { 'User-Agent': USER_AGENT, ...(options.headers || {}) },
      });
      if (response.ok || response.status === 206) return response;
      lastError = new Error(`${label} failed with ${response.status}`);
      if (response.status < 500 && response.status !== 429) throw lastError;
    } catch (error) {
      lastError = error;
    }
    if (attempt < retries) await sleep(1000 * attempt);
  }
  throw lastError;
}

async function fetchRange(snapshotUrl, start, endExclusive, label) {
  const response = await fetchWithRetry(snapshotUrl, { headers: { Range: `bytes=${start}-${endExclusive - 1}` } }, label);
  return Buffer.from(await response.arrayBuffer());
}

async function resolveEntryDataRange(snapshotUrl, entry, label) {
  const localHeader = await fetchRange(
    snapshotUrl,
    entry.relativeOffsetOfLocalHeader,
    entry.relativeOffsetOfLocalHeader + 30,
    `${label} local-header ${entry.name}`,
  );

  if (localHeader.readUInt32LE(0) !== 0x04034b50) {
    throw new Error(`Invalid local header for ${entry.name}`);
  }

  const fileNameLength = localHeader.readUInt16LE(26);
  const extraFieldLength = localHeader.readUInt16LE(28);
  const dataStart = entry.relativeOffsetOfLocalHeader + 30 + fileNameLength + extraFieldLength;

  return {
    dataStart,
    dataEnd: dataStart + entry.compressedSize,
  };
}

async function buildSegmentIndex(segment) {
  const snapshotUrl = PRESET_SNAPSHOT_URLS[segment.id];
  if (!snapshotUrl) return null;
  const head = await fetchWithRetry(snapshotUrl, { method: 'HEAD' }, `HEAD ${segment.id}`);
  const archiveSize = Number(head.headers.get('content-length') || 0);
  if (!archiveSize) throw new Error(`No content-length for ${segment.id}`);
  const tailSize = Math.min(22 + 0xffff, archiveSize);
  const tail = await fetchRange(snapshotUrl, archiveSize - tailSize, archiveSize, `tail ${segment.id}`);
  const eocdOffset = findEocd(tail);
  if (eocdOffset === -1) throw new Error(`EOCD not found for ${segment.id}`);
  const centralDirectorySize = tail.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = tail.readUInt32LE(eocdOffset + 16);
  const centralDirectory = await fetchRange(snapshotUrl, centralDirectoryOffset, centralDirectoryOffset + centralDirectorySize, `central ${segment.id}`);
  const entries = [];
  let cursor = 0;
  while (cursor + 46 <= centralDirectory.length) {
    if (centralDirectory.readUInt32LE(cursor) !== 0x02014b50) break;
    const fileNameLength = centralDirectory.readUInt16LE(cursor + 28);
    const extraFieldLength = centralDirectory.readUInt16LE(cursor + 30);
    const fileCommentLength = centralDirectory.readUInt16LE(cursor + 32);
    const nameStart = cursor + 46;
    const nameEnd = nameStart + fileNameLength;
    const name = centralDirectory.toString('utf8', nameStart, nameEnd).replace(/\\/g, '/');
    if (!/\/$/.test(name) && /\.mp3$/i.test(name)) {
      const baseEntry = {
        name,
        generalPurposeBitFlag: centralDirectory.readUInt16LE(cursor + 8),
        compressionMethod: centralDirectory.readUInt16LE(cursor + 10),
        compressedSize: centralDirectory.readUInt32LE(cursor + 20),
        uncompressedSize: centralDirectory.readUInt32LE(cursor + 24),
        relativeOffsetOfLocalHeader: centralDirectory.readUInt32LE(cursor + 42),
      };
      const { dataStart, dataEnd } = await resolveEntryDataRange(snapshotUrl, baseEntry, segment.id);
      entries.push({
        ...baseEntry,
        dataStart,
        dataEnd,
      });
    }
    cursor = nameEnd + extraFieldLength + fileCommentLength;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true, sensitivity: 'base' }));
  return { segment, snapshotUrl, archiveSize, entries };
}

const index = {};
for (const segment of EMERGENCY_ARCHIVE_ZIP_SEGMENTS) {
  console.log(`Indexing ${segment.id}...`);
  index[segment.id] = await buildSegmentIndex(segment);
  console.log(`  -> ${index[segment.id]?.entries?.length || 0} MP3(s)`);
}

await writeFile(
  OUTPUT_PATH,
  `export const EMERGENCY_AUDIO_INDEX = ${JSON.stringify(index, null, 2)};\n\nexport function getEmergencyAudioIndexBySegment(id) {\n  return EMERGENCY_AUDIO_INDEX[id];\n}\n`,
  'utf8',
);

console.log(`✅ Wrote ${OUTPUT_PATH.pathname}`);
