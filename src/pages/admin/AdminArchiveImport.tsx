import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle,
  Copy,
  Download,
  Link2,
  List,
  Loader2,
  Music,
  Search,
  Upload,
  XCircle,
} from 'lucide-react';
import JSZip from 'jszip';
import bundledArchiveCatalogText from '../../../wayback-archive-urls.txt?raw';
import { uploadApi } from '@/lib/api-client';
import { DEFAULT_COVER_URL } from '@/lib/config';
import {
  extractAudioDuration,
  importArchiveTrackServerSide,
  signR2UploadBatch,
  uploadArchiveMediaToR2,
  uploadFileWithSignedR2Url,
  type SignedR2UploadPayload,
} from '@/lib/supabase-upload';
import {
  DEFAULT_ARCHIVE_ARTIST,
  PUBLIC_ARCHIVE_SITE_REFERENCE,
  PUBLIC_ARCHIVE_SOURCE_LABEL,
  buildArchiveAlbumSlug,
  buildArchiveTrackSlug,
  cleanArchiveTrackTitle,
  extractArchiveTrackNumber,
  extractArchiveSlug,
  inferArchiveCategoryNames,
  isArchiveZipUrl,
  parseArchiveUrlList,
  parseWaybackExtensionsInput,
  parseWaybackKeywordsInput,
  pickPrimaryArchiveCategory,
  slugToArchiveAlbumTitle,
  WAYBACK_DISCOVERY_PRESETS,
  extractWaybackOriginalExtension,
  getWaybackDiscoveryPreset,
  normalizeWaybackDiscoverySeedUrl,
} from '@/lib/admin/archiveImportAutomation';
import {
  supabaseFetch,
  supabaseFetchWithOptions,
  supabasePublicDelete,
  supabasePublicInsert,
  supabasePublicUpsert,
} from '@/lib/supabaseRest';

interface TrackInfo {
  fileName: string;
  title: string;
  number?: number;
  categoryNames?: string[];
  file: Blob;
  size: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  audioUrl?: string;
  duration?: string;
  error?: string;
  note?: string;
  lyrics?: string;
  sourceArchiveUrl?: string;
  mimeType?: string;
}

interface ImportState {
  step: 'idle' | 'resolving' | 'downloading' | 'extracting' | 'preview' | 'importing' | 'done' | 'error';
  progress: number;
  message: string;
  albumTitle: string;
  albumSlug: string;
  albumArtist: string;
  tracks: TrackInfo[];
  archiveUrl: string;
  albumId?: string;
  error?: string;
  categoryNames: string[];
}

interface BatchItem {
  inputUrl: string;
  archiveUrl?: string;
  albumId?: string;
  albumTitle: string;
  albumSlug: string;
  categoryNames: string[];
  tracksCount: number;
  importedTracks: number;
  sourceFormat?: 'zip' | 'media';
  status: 'pending' | 'running' | 'done' | 'error' | 'skipped';
  message?: string;
  error?: string;
}

interface CategoryRow {
  id: string;
  nome: string;
}

interface HinarioLookupEntry {
  numero: number;
  titulo: string;
  categoria: string;
  conteudo: string;
}

interface ExistingAlbumRow {
  id: string;
  slug?: string | null;
  title?: string | null;
  total_tracks?: number | null;
  metadata?: {
    source?: string | null;
    import_origin?: string | null;
  } | null;
}

interface PreparedArchive {
  inputUrl: string;
  archiveUrl: string;
  rawArchiveSlug: string;
  albumTitle: string;
  albumSlug: string;
  categoryNames: string[];
  tracks: TrackInfo[];
  sourceFormat?: 'zip' | 'media';
  sourceSite?: string;
  sourcePath?: string;
}

interface ImportPreparedResult {
  albumId: string;
  importedTracks: number;
  errorCount: number;
  updatedTracks: TrackInfo[];
  skipped?: boolean;
  message: string;
}

interface ImportProgressEvent {
  current: number;
  total: number;
  title: string;
  track: TrackInfo;
  phase: 'uploading' | 'done' | 'error';
}

interface PreparedTrackUpload {
  file: File;
  signedUpload: SignedR2UploadPayload;
}

interface WaybackDiscoveryItem {
  timestamp: string;
  originalUrl: string;
  archiveUrl: string;
  extension: string;
  mimetype: string;
}

interface WaybackMediaAlbumGroup {
  key: string;
  sourceHost: string;
  sourcePath: string;
  rawArchiveSlug: string;
  albumTitle: string;
  albumSlug: string;
  categorySeed: string;
  items: WaybackDiscoveryItem[];
}

const WAYBACK_TIMEMAP_URL = 'https://web.archive.org/web/timemap/json?url=http://www.canticosccb.com.br/zip/&fl=timestamp,original,urlkey,mimetype,statuscode&matchType=prefix&filter=statuscode:200&collapse=urlkey&limit=100000';
const DIRECT_WAYBACK_MEDIA_EXTENSIONS = new Set(['mp3', 'wma', 'mid', 'midi', 'wav', 'ogg', 'aac', 'm4a']);
const WAYBACK_MEDIA_MIME_TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  wma: 'audio/x-ms-wma',
  mid: 'audio/midi',
  midi: 'audio/midi',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
};
const HIDDEN_SOURCE_NAME_REGEX = new RegExp(`\\b${['cc', 'bh', 'inos'].join('')}\\b`, 'gi');
const HIDDEN_SOURCE_SITE_REGEX = new RegExp(`\\b${['kit', 'net'].join('[-._\\\\s]*')}\\b`, 'gi');

async function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs: number = 45000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`Timeout após ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function createWaybackDiscoveryDraft(presetId: string = WAYBACK_DISCOVERY_PRESETS[0]?.id || 'canticos-zip') {
  const preset = getWaybackDiscoveryPreset(presetId);
  return {
    presetId: preset.id,
    seedUrl: preset.inputSeedUrl ?? preset.seedUrl,
    extensionsInput: preset.extensions.join(', '),
    keywordsInput: preset.keywords.join(', '),
  };
}

function resolveDiscoverySeedUrl(draft: ReturnType<typeof createWaybackDiscoveryDraft>) {
  const preset = getWaybackDiscoveryPreset(draft.presetId);
  const normalizedDraftSeed = normalizeWaybackDiscoverySeedUrl(draft.seedUrl);
  const normalizedVisibleSeed = normalizeWaybackDiscoverySeedUrl(preset.inputSeedUrl ?? preset.seedUrl);

  if (preset.id !== 'custom' && (!normalizedDraftSeed || normalizedDraftSeed === normalizedVisibleSeed)) {
    return preset.seedUrl;
  }

  return normalizedDraftSeed;
}

function getPublicArchivePathLabel(pathSegments: string[]) {
  const normalizedPath = pathSegments
    .map((segment) => toReadableArchiveTitle(segment))
    .filter(Boolean)
    .join(' / ');

  return normalizedPath || 'Arquivo do acervo';
}

function isPublicArchiveHost(host: string): boolean {
  const normalizedHost = String(host || '')
    .replace(/^www\./i, '')
    .replace(/:80$/i, '')
    .trim()
    .toLowerCase();

  return normalizedHost === PUBLIC_ARCHIVE_SITE_REFERENCE;
}

function toPublicZipImportReference(value: string): string {
  try {
    const parsed = new URL(String(value || '').trim());
    const host = parsed.host.replace(/:80$/i, '');

    if (!isPublicArchiveHost(host) || !/\/zip\/.+\.zip$/i.test(parsed.pathname)) {
      return '';
    }

    return `${parsed.protocol}//${host}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '';
  }
}

function normalizeDiscoveryExtension(value: string): string {
  const extension = String(value || '').trim().toLowerCase();
  if (extension === 'htm') return 'html';
  if (extension === 'jpeg') return 'jpg';
  return extension;
}

function toReadableArchiveTitle(value: string): string {
  return String(value || '')
    .replace(/\bhttps?:\/\/\S+/gi, ' ')
    .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\.[a-z]{2})?\b/gi, ' ')
    .replace(HIDDEN_SOURCE_NAME_REGEX, ' ')
    .replace(HIDDEN_SOURCE_SITE_REGEX, ' ')
    .replace(/\bwww\b/gi, ' ')
    .replace(/\.(mp3|wma|mid|midi|wav|ogg|aac|m4a|zip)$/i, '')
    .replace(/[_+]+/g, ' ')
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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

function isGenericWaybackCollectionSegment(value: string): boolean {
  return /\b(avuls|orquestrad|ingles|english|letras|midia|midias|audio|hinos)\b/.test(
    normalizeLookupText(value)
  );
}

function getWaybackOriginalUrlMeta(originalUrl: string) {
  try {
    const parsed = new URL(originalUrl);
    const pathSegments = parsed.pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment).trim())
      .filter(Boolean);

    return {
      host: parsed.host.replace(/:80$/i, ''),
      pathSegments,
    };
  } catch {
    return {
      host: '',
      pathSegments: [] as string[],
    };
  }
}

function getArchiveAlbumDescription(_prepared: PreparedArchive): string {
  return 'Álbum do Acervo canticosccb.com.br.';
}

function getWaybackMediaFileName(item: WaybackDiscoveryItem): string {
  const { pathSegments } = getWaybackOriginalUrlMeta(item.originalUrl);
  return pathSegments[pathSegments.length - 1] || String(item.originalUrl).split('/').pop() || 'faixa';
}

function getWaybackMediaMimeType(item: WaybackDiscoveryItem): string {
  const extension = normalizeDiscoveryExtension(item.extension);
  if (WAYBACK_MEDIA_MIME_TYPES[extension]) return WAYBACK_MEDIA_MIME_TYPES[extension];
  if (item.mimetype && item.mimetype.includes('/')) return item.mimetype;
  return 'application/octet-stream';
}

function createWaybackMediaAlbumGroup(item: WaybackDiscoveryItem): WaybackMediaAlbumGroup | null {
  const extension = normalizeDiscoveryExtension(item.extension);
  if (!DIRECT_WAYBACK_MEDIA_EXTENSIONS.has(extension)) {
    return null;
  }

  const { host, pathSegments } = getWaybackOriginalUrlMeta(item.originalUrl);
  if (!host || pathSegments.length < 2) {
    return null;
  }

  const folders = pathSegments.slice(0, -1);
  if (folders.length === 0) {
    return null;
  }

  const lastFolder = folders[folders.length - 1];
  const previousFolder = folders.length > 1 ? folders[folders.length - 2] : '';
  const titleSegments = previousFolder && isGenericWaybackCollectionSegment(previousFolder)
    ? [previousFolder, lastFolder]
    : [lastFolder];
  const albumTitle = titleSegments.map(toReadableArchiveTitle).join(' - ') || toReadableArchiveTitle(lastFolder || host);
  const categorySeed = folders.slice(-2).map(toReadableArchiveTitle).join(' ');
  const sourcePath = folders.join('/');
  const rawArchiveSlug = folders.join('-');

  return {
    key: `${host}/${sourcePath}`,
    sourceHost: host,
    sourcePath,
    rawArchiveSlug,
    albumTitle,
    albumSlug: buildArchiveAlbumSlug(rawArchiveSlug),
    categorySeed,
    items: [item],
  };
}

function groupWaybackMediaItems(items: WaybackDiscoveryItem[]): WaybackMediaAlbumGroup[] {
  const grouped = new Map<string, WaybackMediaAlbumGroup>();

  for (const item of items) {
    const group = createWaybackMediaAlbumGroup(item);
    if (!group) continue;

    const existing = grouped.get(group.key);
    if (existing) {
      existing.items.push(item);
      continue;
    }

    grouped.set(group.key, group);
  }

  return Array.from(grouped.values())
    .map((group) => ({
      ...group,
      items: [...group.items].sort((left, right) => (
        getWaybackMediaFileName(left).localeCompare(
          getWaybackMediaFileName(right),
          'pt-BR',
          { numeric: true, sensitivity: 'base' }
        )
      )),
    }))
    .sort((left, right) => left.albumTitle.localeCompare(right.albumTitle, 'pt-BR', { numeric: true, sensitivity: 'base' }));
}

function isUnsupportedArchiveImportInput(value: string): boolean {
  const input = String(value || '').trim();
  if (!input) return false;

  if (/web\.archive\.org\/web\/\d+(?:if_)?\/http/i.test(input)) {
    return !isArchiveZipUrl(input);
  }

  return /^https?:\/\//i.test(input) && /\.(mp3|wma|mid|midi|gif|png|jpe?g|html?|pdf)(?:[?#]|$)/i.test(input);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createInitialState(): ImportState {
  return {
    step: 'idle',
    progress: 0,
    message: '',
    albumTitle: '',
    albumSlug: '',
    albumArtist: DEFAULT_ARCHIVE_ARTIST,
    tracks: [],
    archiveUrl: '',
    categoryNames: [],
  };
}

function parseCategoryNamesInput(value: string): string[] {
  return Array.from(
    new Set(
      String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function normalizeBundledArchiveCatalog(value: string): string[] {
  return Array.from(
    new Set(
      parseArchiveUrlList(value)
        .map((url) => {
          const match = String(url || '').match(/web\.archive\.org\/web\/\d+(?:if_)?\/(https?:\/\/.+)$/i);
          return toPublicZipImportReference(match?.[1] || url);
        })
        .filter(Boolean)
    )
  );
}

function extractArchiveUrlsFromTimemap(payload: any): string[] {
  if (!Array.isArray(payload) || payload.length < 2) {
    return [];
  }

  return Array.from(
    new Set(
      payload
        .slice(1)
        .filter(Array.isArray)
        .map((row: any[]) => {
          const timestamp = String(row?.[0] || '').trim();
          const originalUrl = String(row?.[1] || '').trim();

          if (!timestamp || !originalUrl || !/\/zip\/.+\.zip$/i.test(originalUrl)) {
            return '';
          }

          return toPublicZipImportReference(originalUrl);
        })
        .filter(Boolean)
    )
  );
}

function normalizeLookupText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasExplicitAvulsoHint(albumTitle: string): boolean {
  return /\b(avuls|novos hinos|hinos novos|que sairam do hinario|fora do hinario)\b/.test(
    normalizeLookupText(albumTitle)
  );
}

function isGenericArchiveTrackTitle(title: string): boolean {
  const normalized = normalizeLookupText(title);
  if (!normalized) return true;

  const genericTitles = new Set([
    'ingles',
    'english',
    'italiano',
    'italian',
    'espanhol',
    'spanish',
    'cantado',
    'cantados',
    'voz',
    'vozes',
    'instrumental',
    'instrumentais',
    'melodia',
    'melodias',
    'hino',
    'hinos',
  ]);

  return genericTitles.has(normalized);
}

function shouldApplyOfficialHinarioTitle(currentTitle: string, officialTitle: string): boolean {
  const normalizedCurrent = normalizeLookupText(currentTitle);
  const normalizedOfficial = normalizeLookupText(officialTitle);
  if (!normalizedCurrent || !normalizedOfficial) return false;
  if (normalizedCurrent === normalizedOfficial) return true;
  if (normalizedCurrent.length < 8 || normalizedOfficial.length < 8) return false;
  return normalizedCurrent.includes(normalizedOfficial) || normalizedOfficial.includes(normalizedCurrent);
}

function appendTrackNote(track: TrackInfo, message: string): TrackInfo {
  const notes = Array.from(
    new Set(
      String(track.note || '')
        .split(' | ')
        .map((item) => item.trim())
        .filter(Boolean)
        .concat(message)
    )
  );

  return {
    ...track,
    note: notes.join(' | '),
  };
}

function mapHinarioCategoryName(value?: string | null): string | null {
  const normalized = normalizeLookupText(String(value || ''));
  if (normalized === 'hinario4' || normalized === 'hinario 4') return 'Hinário 4';
  if (normalized === 'hinario5' || normalized === 'hinario 5') return 'Hinário 5';
  return null;
}

async function findExistingAlbumBySlug(slug: string): Promise<ExistingAlbumRow | null> {
  const rows = await supabaseFetchWithOptions<ExistingAlbumRow>('albums', {
    select: 'id,slug,title,total_tracks,metadata',
    slug: `eq.${slug}`,
    limit: '1',
  }, { bypassCache: true });

  return rows[0] || null;
}

async function getExistingAlbumTrackOrders(albumId: string): Promise<Set<number>> {
  const rows = await supabaseFetchWithOptions<{ position?: number | null; track_number?: number | null }>('album_hinos', {
    select: 'position,track_number',
    album_id: `eq.${albumId}`,
    order: 'position.asc',
    limit: '2000',
  }, { bypassCache: true });

  return new Set(
    rows
      .map((row) => Number(row?.position ?? row?.track_number ?? 0))
      .filter((position) => Number.isFinite(position) && position > 0)
  );
}

async function upsertAlbumHinoLink(albumId: string, hinoId: string, position: number) {
  await supabasePublicUpsert('album_hinos', {
    album_id: albumId,
    hino_id: hinoId,
    position,
    track_number: position,
  }, 'album_id,hino_id');
}

async function attachHinoCategories(hinoId: string, categoryIds: string[]) {
  if (categoryIds.length === 0) return;

  const rows = categoryIds.map((categoryId) => ({
    hino_id: hinoId,
    categoria_id: categoryId,
  }));

  await supabasePublicUpsert('hino_categorias', rows, 'hino_id,categoria_id');
}

const AdminArchiveImport: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [state, setState] = useState<ImportState>(createInitialState());
  const [discoveryDraft, setDiscoveryDraft] = useState(() => createWaybackDiscoveryDraft());
  const [discoveredItems, setDiscoveredItems] = useState<WaybackDiscoveryItem[]>([]);
  const [selectedMediaGroupKeys, setSelectedMediaGroupKeys] = useState<string[]>([]);
  const [mediaGroupSearch, setMediaGroupSearch] = useState('');
  const [mediaGroupVisibleCount, setMediaGroupVisibleCount] = useState(24);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string>();
  const [discoveryMessage, setDiscoveryMessage] = useState<string>();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string>();
  const [hinarioByNumber, setHinarioByNumber] = useState<Record<number, HinarioLookupEntry>>({});
  const [hinarioTitleMap, setHinarioTitleMap] = useState<Record<string, string[]>>({});
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string>();

  const parsedUrls = parseArchiveUrlList(urlInput);
  const discoveryExtensions = parseWaybackExtensionsInput(discoveryDraft.extensionsInput);
  const discoveryKeywords = parseWaybackKeywordsInput(discoveryDraft.keywordsInput);
  const discoveredZipUrls = discoveredItems
    .map((item) => (
      normalizeDiscoveryExtension(item.extension) === 'zip'
        ? toPublicZipImportReference(item.originalUrl)
        : ''
    ))
    .filter(Boolean);
  const discoveredMediaGroups = groupWaybackMediaItems(discoveredItems);
  const selectedDiscoveredMediaGroups = discoveredMediaGroups.filter((group) => selectedMediaGroupKeys.includes(group.key));
  const normalizedMediaGroupSearch = normalizeLookupText(mediaGroupSearch);
  const filteredDiscoveredMediaGroups = discoveredMediaGroups.filter((group) => {
    if (!normalizedMediaGroupSearch) return true;
    return normalizeLookupText(
      `${group.albumTitle} ${group.sourcePath} ${group.albumSlug}`
    ).includes(normalizedMediaGroupSearch);
  });
  const visibleDiscoveredMediaGroups = filteredDiscoveredMediaGroups.slice(0, mediaGroupVisibleCount);
  const discoveryExtensionCounts = discoveredItems.reduce<Record<string, number>>((accumulator, item) => {
    const key = normalizeDiscoveryExtension(item.extension) || 'sem-extensao';
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const isPreviewBusy = ['resolving', 'downloading', 'extracting', 'importing'].includes(state.step);
  const isInteractionLocked = isPreviewBusy || batchRunning || catalogLoading || discoveryLoading;

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(undefined);

      try {
        const [categoriesResult, hinarioResult] = await Promise.allSettled([
          supabaseFetch<CategoryRow>('categorias', {
            select: 'id,nome',
            order: 'nome.asc',
          }),
          supabaseFetch<any>('hinario', {
            select: 'id,numero,titulo,conteudo,categoria,is_active',
            order: 'numero.asc',
            is_active: 'eq.true',
            limit: '1000',
          }),
        ]);

        if (!active) return;

        if (categoriesResult.status === 'fulfilled') {
          setCategories(categoriesResult.value.filter((row) => row?.id && row?.nome));
        } else {
          throw categoriesResult.reason;
        }

        if (hinarioResult.status === 'fulfilled') {
          const nextMap: Record<string, string[]> = {};
          const nextByNumber: Record<number, HinarioLookupEntry> = {};

          for (const item of hinarioResult.value) {
            const normalizedTitle = normalizeLookupText(item?.titulo);
            if (!normalizedTitle) continue;

            const current = new Set(nextMap[normalizedTitle] || []);
            current.add(item?.categoria || 'hinario5');
            nextMap[normalizedTitle] = Array.from(current);

            const numero = Number(item?.numero || 0);
            if (numero > 0) {
              nextByNumber[numero] = {
                numero,
                titulo: String(item?.titulo || ''),
                categoria: item?.categoria || 'hinario5',
                conteudo: String(item?.conteudo || '').trim(),
              };
            }
          }

          setHinarioTitleMap(nextMap);
          setHinarioByNumber(nextByNumber);
        }
      } catch (error: any) {
        if (!active) return;
        setCategoriesError(error?.message || 'Não foi possível carregar as categorias.');
      } finally {
        if (active) {
          setCategoriesLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const applyKnownCategories = useCallback((names: string[]) => {
    const uniqueNames = Array.from(
      new Set(
        (names || [])
          .map((item) => String(item || '').trim())
          .filter(Boolean)
      )
    );

    if (uniqueNames.length === 0) return uniqueNames;
    if (categories.length === 0) return uniqueNames;

    const known = uniqueNames.filter((name) => categories.some((category) => category.nome === name));
    return known.length > 0 ? known : uniqueNames;
  }, [categories]);

  const resolveCategoryIds = useCallback((names: string[]) => {
    const categoryMap = new Map(categories.map((category) => [category.nome, category.id]));
    return applyKnownCategories(names)
      .map((name) => categoryMap.get(name))
      .filter((value): value is string => Boolean(value));
  }, [applyKnownCategories, categories]);

  const resolveArchiveCategoryNames = useCallback((albumTitle: string, tracks: TrackInfo[]) => {
    const initialCategoryNames = applyKnownCategories(inferArchiveCategoryNames(albumTitle));

    if (
      initialCategoryNames.includes('Proclamação') ||
      initialCategoryNames.includes('Hinário 4') ||
      initialCategoryNames.includes('Hinário 5') ||
      hasExplicitAvulsoHint(albumTitle) ||
      Object.keys(hinarioTitleMap).length === 0
    ) {
      return initialCategoryNames;
    }

    const matchCounts = {
      hinario4: 0,
      hinario5: 0,
    };

    for (const track of tracks) {
      if (typeof track.number === 'number' && hinarioByNumber[track.number]) {
        const matchedCategory = hinarioByNumber[track.number].categoria;
        if (matchedCategory === 'hinario4') matchCounts.hinario4 += 1;
        if (matchedCategory === 'hinario5') matchCounts.hinario5 += 1;
        continue;
      }

      const normalizedTitle = normalizeLookupText(track.title);
      if (!normalizedTitle || normalizedTitle.length < 4) continue;

      const matchedCategories = hinarioTitleMap[normalizedTitle] || [];
      for (const matchedCategory of matchedCategories) {
        if (matchedCategory === 'hinario4') matchCounts.hinario4 += 1;
        if (matchedCategory === 'hinario5') matchCounts.hinario5 += 1;
      }
    }

    const dominantCategory = matchCounts.hinario4 > matchCounts.hinario5 ? 'Hinário 4' : 'Hinário 5';
    const dominantCount = Math.max(matchCounts.hinario4, matchCounts.hinario5);
    const threshold = Math.max(2, Math.ceil(tracks.length * 0.35));

    if (dominantCount < threshold) {
      return initialCategoryNames;
    }

    const refinedCategories = new Set(initialCategoryNames);
    refinedCategories.delete('Hinos Avulsos');
    refinedCategories.add(dominantCategory);

    return applyKnownCategories(Array.from(refinedCategories));
  }, [applyKnownCategories, hinarioByNumber, hinarioTitleMap]);

  const resolveTrackCategoryNames = useCallback((
    albumTitle: string,
    track: TrackInfo,
    albumCategoryNames: string[]
  ) => {
    const inferredCategories = new Set(
      applyKnownCategories(inferArchiveCategoryNames(`${albumTitle} ${track.title}`))
    );

    for (const categoryName of albumCategoryNames) {
      if (categoryName === 'Inglês' || categoryName === 'Italiano' || categoryName === 'Proclamação') {
        inferredCategories.add(categoryName);
      }
    }

    let matchedHinarioCategory = typeof track.number === 'number'
      ? mapHinarioCategoryName(hinarioByNumber[track.number]?.categoria)
      : null;

    if (!matchedHinarioCategory) {
      const normalizedTitle = normalizeLookupText(track.title);
      const matchedCategories = normalizedTitle.length >= 4 ? hinarioTitleMap[normalizedTitle] || [] : [];
      const uniqueMatchedCategories = Array.from(new Set(matchedCategories.map(mapHinarioCategoryName).filter(Boolean)));
      if (uniqueMatchedCategories.length === 1) {
        matchedHinarioCategory = uniqueMatchedCategories[0];
      }
    }

    inferredCategories.delete('Hinário 4');
    inferredCategories.delete('Hinário 5');

    if (matchedHinarioCategory) {
      inferredCategories.delete('Hinos Avulsos');
      inferredCategories.add(matchedHinarioCategory);
    } else if (albumCategoryNames.includes('Hinário 4')) {
      inferredCategories.delete('Hinos Avulsos');
      inferredCategories.add('Hinário 4');
    } else if (albumCategoryNames.includes('Hinário 5')) {
      inferredCategories.delete('Hinos Avulsos');
      inferredCategories.add('Hinário 5');
    } else if (albumCategoryNames.includes('Hinos Avulsos') || hasExplicitAvulsoHint(`${albumTitle} ${track.title}`)) {
      inferredCategories.add('Hinos Avulsos');
    }

    return applyKnownCategories(Array.from(inferredCategories));
  }, [applyKnownCategories, hinarioByNumber, hinarioTitleMap]);

  const refreshTrackCategories = useCallback((
    albumTitle: string,
    albumCategoryNames: string[],
    tracks: TrackInfo[]
  ) => tracks.map((track) => ({
    ...track,
    categoryNames: resolveTrackCategoryNames(albumTitle, track, albumCategoryNames),
  })), [resolveTrackCategoryNames]);

  const normalizeTrackFromHinario = useCallback((track: TrackInfo): TrackInfo => {
    if (typeof track.number !== 'number') return track;

    const officialHinarioTrack = hinarioByNumber[track.number];
    if (!officialHinarioTrack) return track;

    let nextTrack = { ...track };

    if (officialHinarioTrack.conteudo && !String(nextTrack.lyrics || '').trim()) {
      nextTrack = appendTrackNote(
        {
          ...nextTrack,
          lyrics: officialHinarioTrack.conteudo,
        },
        'Letra oficial do hinário anexada automaticamente.'
      );
    }

    if (track.title !== officialHinarioTrack.titulo && isGenericArchiveTrackTitle(track.title)) {
      return appendTrackNote(
        {
          ...nextTrack,
          title: officialHinarioTrack.titulo,
        },
        'Título oficial do hinário aplicado automaticamente.'
      );
    }

    if (track.title !== officialHinarioTrack.titulo && shouldApplyOfficialHinarioTitle(track.title, officialHinarioTrack.titulo)) {
      return appendTrackNote(
        {
          ...nextTrack,
          title: officialHinarioTrack.titulo,
        },
        'Título padronizado com base no hinário.'
      );
    }

    return nextTrack;
  }, [hinarioByNumber]);

  const fetchArchiveJson = useCallback(async (targetUrl: string) => {
    const errors: string[] = [];

    try {
      const proxyUrl = `/api/archive-proxy?url=${encodeURIComponent(targetUrl)}`;
      const response = await fetchWithTimeout(proxyUrl, undefined, 45000);
      if (response.ok) {
        return await response.json();
      }

      errors.push(`Serviço protegido indisponível (${response.status}).`);
    } catch (error: any) {
      errors.push(`Serviço protegido indisponível: ${error?.message || 'erro de rede'}`);
    }

    try {
      const proxyUrl = `/api/archive-json?url=${encodeURIComponent(targetUrl)}`;
      const response = await fetchWithTimeout(proxyUrl, undefined, 45000);
      if (response.ok) {
        return await response.json();
      }

      errors.push(`Serviço protegido auxiliar indisponível (${response.status}).`);
    } catch (error: any) {
      errors.push(`Serviço protegido auxiliar indisponível: ${error?.message || 'erro de rede'}`);
    }

    try {
      const response = await fetchWithTimeout(targetUrl, undefined, 30000);
      if (response.ok) {
        return await response.json();
      }

      errors.push(`Consulta complementar indisponível (${response.status}).`);
    } catch (error: any) {
      errors.push(`Consulta complementar indisponível: ${error?.message || 'erro de rede'}`);
    }

    throw new Error(
      'Não foi possível consultar a fonte protegida do acervo.\n' +
      errors.join('\n')
    );
  }, []);

  const handleDiscoveryPresetChange = useCallback((presetId: string) => {
    setDiscoveryDraft(createWaybackDiscoveryDraft(presetId));
    setDiscoveredItems([]);
    setSelectedMediaGroupKeys([]);
    setMediaGroupSearch('');
    setMediaGroupVisibleCount(24);
    setDiscoveryError(undefined);
    setDiscoveryMessage(getWaybackDiscoveryPreset(presetId).description);
  }, []);

  const handleToggleMediaGroupSelection = useCallback((groupKey: string) => {
    setSelectedMediaGroupKeys((current) => (
      current.includes(groupKey)
        ? current.filter((item) => item !== groupKey)
        : [...current, groupKey]
    ));
  }, []);

  const handleSelectAllMediaGroups = useCallback(() => {
    setSelectedMediaGroupKeys((current) => Array.from(new Set([
      ...current,
      ...filteredDiscoveredMediaGroups.map((group) => group.key),
    ])));
  }, [filteredDiscoveredMediaGroups]);

  const handleClearMediaGroupSelection = useCallback(() => {
    setSelectedMediaGroupKeys([]);
  }, []);

  const handleShowMoreMediaGroups = useCallback(() => {
    setMediaGroupVisibleCount((current) => current + 24);
  }, []);

  const handleDiscoverWaybackUrls = useCallback(async () => {
    const normalizedSeedUrl = resolveDiscoverySeedUrl(discoveryDraft);
    if (!normalizedSeedUrl) {
      setDiscoveryError('Informe uma referência base para pesquisar no acervo protegido.');
      return;
    }

    setDiscoveryLoading(true);
    setDiscoveryError(undefined);
    setDiscoveryMessage(undefined);

    try {
      const extensionSet = new Set(discoveryExtensions.map(normalizeDiscoveryExtension));
      const keywordSet = discoveryKeywords.map((keyword) => keyword.toLowerCase());
      const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(normalizedSeedUrl)}&output=json&fl=timestamp,original,urlkey,mimetype,statuscode&matchType=prefix&filter=statuscode:200&collapse=urlkey&limit=10000`;
      const payload = await fetchArchiveJson(cdxUrl);

      if (!Array.isArray(payload) || payload.length < 2) {
        throw new Error('A pesquisa do acervo não retornou capturas para esta fonte.');
      }

      const nextItems = Array.from(
        new Map(
          payload
            .slice(1)
            .filter(Array.isArray)
            .map((row: any[]) => {
              const timestamp = String(row?.[0] || '').trim();
              const originalUrl = String(row?.[1] || '').trim();
              const mimetype = String(row?.[3] || '').trim();
              const extension = normalizeDiscoveryExtension(
                extractWaybackOriginalExtension(originalUrl)
                || (mimetype.includes('html') ? 'html' : '')
              );

              if (!timestamp || !originalUrl) return null;
              if (extensionSet.size > 0 && !extensionSet.has(extension)) return null;

              const comparable = `${originalUrl} ${mimetype}`.toLowerCase();
              if (keywordSet.length > 0 && !keywordSet.some((keyword) => comparable.includes(keyword))) {
                return null;
              }

              const archiveUrl = `https://web.archive.org/web/${timestamp}if_/${originalUrl}`;
              return [
                archiveUrl,
                {
                  timestamp,
                  originalUrl,
                  archiveUrl,
                  extension,
                  mimetype,
                } satisfies WaybackDiscoveryItem,
              ] as const;
            })
            .filter(Boolean) as Array<readonly [string, WaybackDiscoveryItem]>
        ).values()
      );

      setDiscoveredItems(nextItems);
      setSelectedMediaGroupKeys(groupWaybackMediaItems(nextItems).map((group) => group.key));
      setMediaGroupSearch('');
      setMediaGroupVisibleCount(24);

      if (nextItems.length === 0) {
        setDiscoveryMessage('Nenhuma referência compatível foi encontrada com os filtros atuais.');
      } else {
        const zipCount = nextItems.filter((item) => item.extension === 'zip').length;
        setDiscoveryMessage(
          `${nextItems.length} referência(s) encontradas no acervo. ${zipCount} ZIP(s) compatíveis com o importador atual.`
        );
      }
    } catch (error: any) {
      setDiscoveredItems([]);
      setSelectedMediaGroupKeys([]);
      setMediaGroupSearch('');
      setMediaGroupVisibleCount(24);
      setDiscoveryError(error?.message || 'Não foi possível descobrir referências nesta fonte protegida do acervo.');
    } finally {
      setDiscoveryLoading(false);
    }
  }, [discoveryDraft, discoveryExtensions, discoveryKeywords, fetchArchiveJson]);

  const handleCopyDiscoveredUrls = useCallback(async () => {
    if (discoveredItems.length === 0) return;

    try {
      await navigator.clipboard.writeText(
        discoveredItems
          .map((item) => getPublicArchivePathLabel(getWaybackOriginalUrlMeta(item.originalUrl).pathSegments))
          .join('\n')
      );
      setDiscoveryError(undefined);
      setDiscoveryMessage(`${discoveredItems.length} referência(s) do acervo copiadas para a área de transferência.`);
    } catch (error: any) {
      setDiscoveryError(error?.message || 'Não foi possível copiar as referências do acervo.');
    }
  }, [discoveredItems]);

  const handleUseDiscoveredZipUrls = useCallback(() => {
    if (discoveredZipUrls.length === 0) return;
    setUrlInput(discoveredZipUrls.join('\n'));
    setBatchItems([]);
    setCatalogError(undefined);
  }, [discoveredZipUrls]);

  const resolveArchiveUrl = useCallback(async (inputUrl: string): Promise<string> => {
    if (/\/zip\/\*/i.test(inputUrl)) {
      throw new Error('Use "Carregar catálogo completo" ou cole referências individuais dos arquivos ZIP.');
    }

    const timestampMatch = inputUrl.match(/web\.archive\.org\/web\/(\d+)(if_)?\//);
    if (timestampMatch) {
      if (!timestampMatch[2]) {
        return inputUrl.replace(`/web/${timestampMatch[1]}/`, `/web/${timestampMatch[1]}if_/`);
      }
      return inputUrl;
    }

    let originalUrl = inputUrl.trim();
    if (inputUrl.includes('web.archive.org/web/*/')) {
      originalUrl = inputUrl.split('web.archive.org/web/*/')[1];
    }

    if (!originalUrl.startsWith('http')) {
      originalUrl = `http://www.canticosccb.com.br/zip/${originalUrl}`;
    }

    if (!originalUrl.endsWith('.zip')) {
      originalUrl += '-www.canticosccb.com.br.zip';
    }

    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(originalUrl)}&output=json&limit=-1&fl=timestamp,original,statuscode,mimetype`;
    const payload = await fetchArchiveJson(cdxUrl);

    if (!Array.isArray(payload) || payload.length < 2) {
      throw new Error('Referência não encontrada no acervo protegido. Verifique se a referência está correta.');
    }

    const snapshots = payload.slice(1).filter(Array.isArray);
    const goodSnapshots = snapshots.filter((snapshot: any[]) => String(snapshot[2]) === '200');
    const bestSnapshot = goodSnapshots.length > 0
      ? goodSnapshots[goodSnapshots.length - 1]
      : snapshots[snapshots.length - 1];

    if (!bestSnapshot?.[0] || !bestSnapshot?.[1]) {
      throw new Error('Não foi possível resolver uma captura válida para este ZIP.');
    }

    return `https://web.archive.org/web/${bestSnapshot[0]}if_/${bestSnapshot[1]}`;
  }, [fetchArchiveJson]);

  const downloadZip = useCallback(async (archiveUrl: string): Promise<Blob> => {
    const errors: string[] = [];

    try {
      const proxyUrl = `/api/archive-proxy?url=${encodeURIComponent(archiveUrl)}`;
      const response = await fetchWithTimeout(proxyUrl);
      if (response.ok) {
        const blob = await response.blob();
        const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
        if (blob.size > 1024 && header[0] === 0x50 && header[1] === 0x4b) {
          return blob;
        }
        errors.push('O serviço protegido retornou um arquivo inválido em vez do ZIP.');
      } else {
        errors.push(`O serviço protegido retornou ${response.status}.`);
      }
    } catch (error: any) {
      errors.push(`O serviço protegido falhou: ${error?.message || 'erro de rede'}`);
    }

    try {
      const response = await fetchWithTimeout(archiveUrl, { redirect: 'follow' });
      if (response.ok) {
        const blob = await response.blob();
        const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
        if (blob.size > 1024 && header[0] === 0x50 && header[1] === 0x4b) {
          return blob;
        }
        errors.push('A consulta complementar retornou um arquivo inválido em vez do ZIP.');
      } else {
        errors.push(`A consulta complementar retornou ${response.status}.`);
      }
    } catch (error: any) {
      errors.push(`A consulta complementar falhou: ${error?.message || 'erro de rede'}`);
    }

    throw new Error(
      'Não foi possível baixar o arquivo do acervo.\n' +
      errors.join('\n') +
      '\n\nSe estiver em ambiente local, ative o serviço de importação do acervo.'
    );
  }, []);

  const extractTracksFromZip = useCallback(async (
    zipBlob: Blob,
    context: { rawArchiveSlug: string; albumTitle: string },
    onProgress?: (progress: number, message: string) => void
  ): Promise<TrackInfo[]> => {
    const zip = await JSZip.loadAsync(zipBlob);
    const entries = Object.entries(zip.files)
      .filter(([name, file]) => !file.dir && /\.mp3$/i.test(name))
      .sort(([left], [right]) => left.localeCompare(right, 'pt-BR', { numeric: true, sensitivity: 'base' }));

    if (entries.length === 0) {
      throw new Error('Nenhum arquivo MP3 foi encontrado dentro do ZIP.');
    }

    const tracks: TrackInfo[] = [];

    for (let index = 0; index < entries.length; index += 1) {
      const [name, file] = entries[index];
      const blob = await file.async('blob');
      const fileName = name.split('/').pop() || name;

      tracks.push(normalizeTrackFromHinario({
        fileName,
        number: extractArchiveTrackNumber(fileName, {
          albumSlug: context.rawArchiveSlug,
          albumTitle: context.albumTitle,
        }),
        title: cleanArchiveTrackTitle(fileName, {
          albumSlug: context.rawArchiveSlug,
          albumTitle: context.albumTitle,
        }),
        file: blob,
        size: blob.size,
        status: 'pending',
      }));

      if (onProgress) {
        const progress = 50 + Math.round(((index + 1) / entries.length) * 30);
        onProgress(progress, `Extraindo: ${fileName} (${index + 1}/${entries.length})`);
      }
    }

    return tracks;
  }, [normalizeTrackFromHinario]);

  const prepareWaybackMediaGroup = useCallback(async (
    group: WaybackMediaAlbumGroup,
    onProgress?: (progress: number, message: string) => void
  ): Promise<PreparedArchive> => {
    if (group.items.length === 0) {
      throw new Error('Nenhuma mídia foi encontrada neste agrupamento do acervo.');
    }

    const tracks: TrackInfo[] = [];
    const albumContextTitle = `${group.albumTitle} ${group.categorySeed}`.trim();

    for (let index = 0; index < group.items.length; index += 1) {
      const item = group.items[index];
      const fileName = getWaybackMediaFileName(item);
      const mimeType = getWaybackMediaMimeType(item);
      const placeholderFile = new File([], fileName, { type: mimeType });

      tracks.push(normalizeTrackFromHinario({
        fileName,
        number: extractArchiveTrackNumber(fileName, {
          albumSlug: group.rawArchiveSlug,
          albumTitle: group.albumTitle,
        }),
        title: cleanArchiveTrackTitle(fileName, {
          albumSlug: group.rawArchiveSlug,
          albumTitle: group.albumTitle,
        }),
        file: placeholderFile,
        size: 0,
        status: 'pending',
        sourceArchiveUrl: item.archiveUrl,
        mimeType,
      }));

      if (onProgress) {
        const progress = 15 + Math.round(((index + 1) / group.items.length) * 45);
        onProgress(progress, `Preparando faixa ${index + 1}/${group.items.length}: ${fileName}`);
      }
    }

    const categoryNames = resolveArchiveCategoryNames(albumContextTitle || group.albumTitle, tracks);
    const tracksWithCategories = refreshTrackCategories(albumContextTitle || group.albumTitle, categoryNames, tracks);

    return {
      inputUrl: group.items[0].originalUrl,
      archiveUrl: group.items[0].archiveUrl,
      rawArchiveSlug: group.rawArchiveSlug,
      albumTitle: group.albumTitle,
      albumSlug: group.albumSlug,
      categoryNames,
      tracks: tracksWithCategories,
      sourceFormat: 'media',
      sourceSite: PUBLIC_ARCHIVE_SITE_REFERENCE,
      sourcePath: group.sourcePath,
    };
  }, [normalizeTrackFromHinario, refreshTrackCategories, resolveArchiveCategoryNames]);

  const analyzeArchiveUrl = useCallback(async (
    inputUrl: string,
    onProgress?: (patch: Partial<ImportState>) => void
  ): Promise<PreparedArchive> => {
    onProgress?.({
      step: 'resolving',
      progress: 5,
      message: 'Resolvendo referência do acervo...',
      error: undefined,
    });

    const archiveUrl = await resolveArchiveUrl(inputUrl);
    const rawArchiveSlug = extractArchiveSlug(archiveUrl);
    const albumTitle = slugToArchiveAlbumTitle(rawArchiveSlug);
    const albumSlug = buildArchiveAlbumSlug(rawArchiveSlug);

    onProgress?.({
      step: 'downloading',
      progress: 10,
      message: 'Baixando arquivo do acervo...',
    });

    const zipBlob = await downloadZip(archiveUrl);

    onProgress?.({
      step: 'extracting',
      progress: 50,
      message: 'Extraindo arquivos MP3...',
    });

    const tracks = await extractTracksFromZip(
      zipBlob,
      { rawArchiveSlug, albumTitle },
      (progress, message) => onProgress?.({ step: 'extracting', progress, message })
    );

    const categoryNames = resolveArchiveCategoryNames(albumTitle, tracks);
    const tracksWithCategories = refreshTrackCategories(albumTitle, categoryNames, tracks);

    return {
      inputUrl,
      archiveUrl,
      rawArchiveSlug,
      albumTitle,
      albumSlug,
      categoryNames,
      tracks: tracksWithCategories,
      sourceFormat: 'zip',
      sourceSite: PUBLIC_ARCHIVE_SITE_REFERENCE,
    };
  }, [downloadZip, extractTracksFromZip, refreshTrackCategories, resolveArchiveCategoryNames, resolveArchiveUrl]);

  const createTrackUploadFile = useCallback((track: TrackInfo) => (
    new File([track.file], track.fileName, {
      type: (track.file as File)?.type || 'application/octet-stream',
    })
  ), []);

  const prepareArchiveTrackUploads = useCallback(async (tracks: TrackInfo[]): Promise<PreparedTrackUpload[]> => {
    if (tracks.length === 0) return [];

    const files = tracks.map(createTrackUploadFile);
    const signedUploads = await signR2UploadBatch(
      files.map((file) => ({
        file,
        type: 'hinos',
        expiresIn: 7200,
      })),
      { expiresIn: 7200 }
    );

    return files.map((file, index) => ({
      file,
      signedUpload: signedUploads[index],
    }));
  }, [createTrackUploadFile]);

  const uploadPreparedTrackFile = useCallback(async (track: TrackInfo, preparedUpload?: PreparedTrackUpload) => {
    const uploadFile = preparedUpload?.file || createTrackUploadFile(track);
    const extension = normalizeDiscoveryExtension(uploadFile.name.split('.').pop() || '');
    const canResolveDurationFromLocalFile = uploadFile.size > 0 && extension !== 'wma' && extension !== 'mid' && extension !== 'midi';
    const resolveDurationIfPossible = async (url: string) => {
      if (extension === 'wma' || extension === 'mid' || extension === 'midi') {
        return {
          url,
          duration: '',
        };
      }

      try {
        const duration = await extractAudioDuration(uploadFile);
        return { url, duration };
      } catch (error: any) {
        console.warn('⚠️ Não foi possível extrair a duração do áudio após upload, continuando sem esse campo:', error?.message || error);
        return { url, duration: '' };
      }
    };

    if (track.sourceArchiveUrl) {
      const url = await uploadArchiveMediaToR2({
        archiveUrl: track.sourceArchiveUrl,
        fileName: uploadFile.name,
        contentType: uploadFile.type || track.mimeType || 'application/octet-stream',
        type: 'hinos',
      });

      if (!canResolveDurationFromLocalFile) {
        return {
          url,
          duration: '',
        };
      }

      return await resolveDurationIfPossible(url);
    }

    if (preparedUpload?.signedUpload) {
      try {
        const url = await uploadFileWithSignedR2Url(uploadFile, preparedUpload.signedUpload);
        return await resolveDurationIfPossible(url);
      } catch (error: any) {
        console.warn(
          '⚠️ Upload com assinatura em lote falhou; tentando fallback da faixa...',
          error?.message || error
        );

        try {
          const url = await uploadApi.uploadFile(uploadFile, 'hinos');
          return await resolveDurationIfPossible(url);
        } catch (retryError: any) {
          throw retryError instanceof Error
            ? retryError
            : new Error(retryError?.message || 'Falha ao reenviar a faixa para o armazenamento de mídia.');
        }
      }
    }

    if (extension === 'wma' || extension === 'mid' || extension === 'midi') {
      const { url } = await uploadApi.uploadFile(uploadFile, 'hinos');
      return {
        url,
        duration: '',
      };
    }

    const { url, duration } = await uploadApi.uploadAudio(uploadFile);
    return { url, duration };
  }, []);

  const importPreparedArchive = useCallback(async (
    prepared: PreparedArchive,
    options?: {
      albumTitle?: string;
      categoryNames?: string[];
      tracks?: TrackInfo[];
    },
    onProgress?: (event: ImportProgressEvent) => void
  ): Promise<ImportPreparedResult> => {
    const albumTitle = String(options?.albumTitle || prepared.albumTitle).trim() || prepared.albumTitle;
    const tracks = (options?.tracks && options.tracks.length > 0 ? options.tracks : prepared.tracks)
      .map((track) => ({
        ...track,
        status: 'pending' as const,
        error: undefined,
      }));
    const fallbackCategories = resolveArchiveCategoryNames(albumTitle, tracks);
    const categoryNames = applyKnownCategories(
      options?.categoryNames && options.categoryNames.length > 0
        ? options.categoryNames
        : prepared.categoryNames.length > 0
          ? prepared.categoryNames
          : fallbackCategories
    );
    const primaryCategory = pickPrimaryArchiveCategory(categoryNames);

    const existingAlbum = await findExistingAlbumBySlug(prepared.albumSlug);
    const existingTrackOrders = existingAlbum?.id
      ? await getExistingAlbumTrackOrders(existingAlbum.id)
      : new Set<number>();
    const isResume = Boolean(existingAlbum?.id && existingTrackOrders.size < tracks.length);
    const pendingTrackIndexes = tracks.reduce<number[]>((accumulator, _track, index) => {
      if (!existingTrackOrders.has(index + 1)) {
        accumulator.push(index);
      }
      return accumulator;
    }, []);

    if (existingAlbum?.id && existingTrackOrders.size >= tracks.length) {
      return {
        albumId: existingAlbum.id,
        importedTracks: tracks.length,
        errorCount: 0,
        updatedTracks: tracks.map((track, index) => (
          existingTrackOrders.has(index + 1)
            ? { ...track, status: 'done', note: 'Faixa já existente no álbum.' }
            : track
        )),
        skipped: true,
        message: `Álbum já existente: ${existingAlbum.title || prepared.albumSlug}.`,
      };
    }

    const preparedTrackUploads = prepared.sourceFormat === 'media'
      ? []
      : await prepareArchiveTrackUploads(
          pendingTrackIndexes.map((trackIndex) => tracks[trackIndex])
        );
    const preparedTrackUploadMap = new Map<number, PreparedTrackUpload>();
    pendingTrackIndexes.forEach((trackIndex, batchIndex) => {
      const preparedUpload = preparedTrackUploads[batchIndex];
      if (preparedUpload) {
        preparedTrackUploadMap.set(trackIndex, preparedUpload);
      }
    });

    let albumId = existingAlbum?.id || '';
    let createdAlbumInThisRun = false;
    if (!albumId) {
      const albumResult = await supabasePublicInsert<{ id: string }>('albums', {
        title: albumTitle,
        slug: prepared.albumSlug,
        artist: DEFAULT_ARCHIVE_ARTIST,
        genre: categoryNames.join(', '),
        is_published: false,
        active: false,
        total_tracks: tracks.length,
        cover_url: DEFAULT_COVER_URL,
        description: getArchiveAlbumDescription(prepared),
        metadata: {
          source: 'acervo',
          import_origin: 'acervo',
          source_format: prepared.sourceFormat || 'zip',
          source_label: PUBLIC_ARCHIVE_SOURCE_LABEL,
          source_site: PUBLIC_ARCHIVE_SITE_REFERENCE,
          public_url: `https://www.${PUBLIC_ARCHIVE_SITE_REFERENCE}`,
          source_path: prepared.sourcePath,
          category_names: categoryNames,
        },
      });

      if (!albumResult?.id) {
        throw new Error('Falha ao criar o álbum no banco de dados.');
      }

      albumId = albumResult.id;
      createdAlbumInThisRun = true;
    }

    const categoryIds = resolveCategoryIds(categoryNames);
    const updatedTracks = [...tracks];
    let importedTracks = 0;
    let errorCount = 0;

    for (let index = 0; index < updatedTracks.length; index += 1) {
      if (!existingTrackOrders.has(index + 1)) continue;
      updatedTracks[index] = {
        ...updatedTracks[index],
        status: 'done',
        note: 'Faixa já existente no álbum.',
      };
      importedTracks += 1;
    }

    for (let index = 0; index < updatedTracks.length; index += 1) {
      const track = updatedTracks[index];
      if (existingTrackOrders.has(index + 1)) {
        onProgress?.({
          current: index + 1,
          total: updatedTracks.length,
          title: track.title,
          track: updatedTracks[index],
          phase: 'done',
        });
        continue;
      }

      const uploadingTrack: TrackInfo = {
        ...track,
        status: 'uploading',
        error: undefined,
      };

      updatedTracks[index] = uploadingTrack;
      onProgress?.({
        current: index + 1,
        total: updatedTracks.length,
        title: uploadingTrack.title,
        track: uploadingTrack,
        phase: 'uploading',
      });

      try {
        const trackCategoryNames = applyKnownCategories(
          track.categoryNames && track.categoryNames.length > 0
            ? track.categoryNames
            : resolveTrackCategoryNames(albumTitle, track, categoryNames)
        );
        const trackPrimaryCategory = pickPrimaryArchiveCategory(trackCategoryNames) || primaryCategory;
        const trackCategoryIds = resolveCategoryIds(trackCategoryNames);

        let url = '';
        let duration = '';
        let hinoId = '';

        if (track.sourceArchiveUrl) {
          const serverResult = await importArchiveTrackServerSide({
            archiveUrl: track.sourceArchiveUrl,
            fileName: track.fileName,
            contentType: track.mimeType || (track.file as File)?.type || 'application/octet-stream',
            albumId,
            position: index + 1,
            title: track.title,
            slug: buildArchiveTrackSlug(track.title, prepared.albumSlug, index + 1),
            number: track.number ?? null,
            primaryCategory: trackPrimaryCategory,
            categoryIds: trackCategoryIds.length > 0 ? trackCategoryIds : categoryIds,
            lyrics: track.lyrics,
          });

          url = serverResult.publicUrl;
          duration = serverResult.duration;
          hinoId = serverResult.hinoId;
        } else {
          const uploadResult = await uploadPreparedTrackFile(track, preparedTrackUploadMap.get(index));
          url = uploadResult.url;
          duration = uploadResult.duration;

          const hinoResult = await supabasePublicInsert<{ id: string }>('hinos', {
            titulo: track.title,
            slug: buildArchiveTrackSlug(track.title, prepared.albumSlug, index + 1),
            numero: track.number || null,
            categoria: trackPrimaryCategory,
            compositor_nome: DEFAULT_ARCHIVE_ARTIST,
            audio_url: url,
            cover_url: DEFAULT_COVER_URL,
            duracao: duration,
            letra: track.lyrics || undefined,
            status: 'draft',
            ativo: false,
          });

          if (!hinoResult?.id) {
            throw new Error('Falha ao criar o hino no banco de dados.');
          }

          hinoId = hinoResult.id;
          await upsertAlbumHinoLink(albumId, hinoId, index + 1);
          await attachHinoCategories(hinoId, trackCategoryIds.length > 0 ? trackCategoryIds : categoryIds);
        }

        const doneTrack: TrackInfo = {
          ...track,
          status: 'done',
          audioUrl: url,
          duration,
          note: hinoId ? `Hino ${hinoId}` : track.note,
        };

        updatedTracks[index] = doneTrack;
        existingTrackOrders.add(index + 1);
        importedTracks += 1;

        onProgress?.({
          current: index + 1,
          total: updatedTracks.length,
          title: doneTrack.title,
          track: doneTrack,
          phase: 'done',
        });
      } catch (error: any) {
        const errorTrack: TrackInfo = {
          ...track,
          status: 'error',
          error: error?.message || 'Erro ao importar a faixa.',
        };

        updatedTracks[index] = errorTrack;
        errorCount += 1;

        onProgress?.({
          current: index + 1,
          total: updatedTracks.length,
          title: errorTrack.title,
          track: errorTrack,
          phase: 'error',
        });
      }
    }

    const actionLabel = isResume ? 'Álbum retomado como rascunho' : 'Álbum importado como rascunho';

    const shouldCleanupEmptyArchiveAlbum = importedTracks === 0
      && errorCount > 0
      && (
        createdAlbumInThisRun
        || (
          Boolean(existingAlbum?.id)
          && existingTrackOrders.size === 0
          && (
            existingAlbum?.metadata?.source === 'acervo'
            || existingAlbum?.metadata?.import_origin === 'acervo'
          )
        )
      );

    if (shouldCleanupEmptyArchiveAlbum) {
      try {
        await supabasePublicDelete('albums', { id: `eq.${albumId}` });
      } catch (cleanupError) {
        console.warn('Falha ao remover álbum vazio após erro de upload:', cleanupError);
      }

      throw new Error(
        updatedTracks.find((item) => item.status === 'error')?.error
        || 'Nenhuma faixa pôde ser enviada para o armazenamento de mídia.'
      );
    }

    const message = errorCount > 0
      ? `${actionLabel} com ${importedTracks}/${updatedTracks.length} faixas concluídas.`
      : `${actionLabel} com ${importedTracks} faixas.`;

    return {
      albumId,
      importedTracks,
      errorCount,
      updatedTracks,
      message,
    };
  }, [applyKnownCategories, prepareArchiveTrackUploads, resolveArchiveCategoryNames, resolveCategoryIds, resolveTrackCategoryNames, uploadPreparedTrackFile]);

  const updateBatchItem = useCallback((index: number, patch: Partial<BatchItem>) => {
    setBatchItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    )));
  }, []);

  const handleLoadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(undefined);

    try {
      const bundledUrls = normalizeBundledArchiveCatalog(bundledArchiveCatalogText);
      const urls = bundledUrls.length > 0
        ? bundledUrls
        : extractArchiveUrlsFromTimemap(await fetchArchiveJson(WAYBACK_TIMEMAP_URL));

      if (urls.length === 0) {
        throw new Error('Nenhuma referência ZIP foi encontrada no catálogo publicado do acervo.');
      }

      setUrlInput(urls.join('\n'));
      setBatchItems([]);
    } catch (error: any) {
      setCatalogError(error?.message || 'Não foi possível carregar o catálogo publicado do acervo.');
    } finally {
      setCatalogLoading(false);
    }
  }, [fetchArchiveJson]);

  const handleAnalyze = useCallback(async () => {
    if (parsedUrls.length === 0) return;
    if (parsedUrls.some(isUnsupportedArchiveImportInput)) {
      setState((current) => ({
        ...current,
        step: 'error',
        message: '',
        error: 'Este campo continua focado em arquivos ZIP do acervo. Para mídias diretas (.mp3/.wma/.mid), use a seção "Mapear fontes do acervo" e clique em "Importar mídias descobertas".',
      }));
      return;
    }

    const firstUrl = parsedUrls[0];
    setState({
      ...createInitialState(),
      step: 'resolving',
      progress: 5,
      message: 'Resolvendo referência do acervo...',
    });

    try {
      const prepared = await analyzeArchiveUrl(firstUrl, (patch) => {
        setState((current) => ({
          ...current,
          ...patch,
          albumArtist: DEFAULT_ARCHIVE_ARTIST,
        }));
      });

      setState((current) => ({
        ...current,
        step: 'preview',
        progress: 80,
        message: parsedUrls.length > 1
          ? `${prepared.tracks.length} faixas encontradas. Preview da primeira referência de ${parsedUrls.length}.`
          : `${prepared.tracks.length} faixas encontradas. Revise e clique em Importar.`,
        albumTitle: prepared.albumTitle,
        albumSlug: prepared.albumSlug,
        albumArtist: DEFAULT_ARCHIVE_ARTIST,
        archiveUrl: prepared.archiveUrl,
        tracks: prepared.tracks,
        categoryNames: prepared.categoryNames,
        error: undefined,
        albumId: undefined,
      }));
    } catch (error: any) {
      setState((current) => ({
        ...current,
        step: 'error',
        message: '',
        error: error?.message || 'Erro ao processar o arquivo.',
      }));
    }
  }, [analyzeArchiveUrl, parsedUrls]);

  const handleImport = useCallback(async () => {
    if (!state.archiveUrl || state.tracks.length === 0) return;

    const prepared: PreparedArchive = {
      inputUrl: parsedUrls[0] || state.archiveUrl,
      archiveUrl: state.archiveUrl,
      rawArchiveSlug: extractArchiveSlug(state.archiveUrl),
      albumTitle: state.albumTitle,
      albumSlug: state.albumSlug || buildArchiveAlbumSlug(extractArchiveSlug(state.archiveUrl)),
      categoryNames: state.categoryNames,
      tracks: state.tracks,
    };

    setState((current) => ({
      ...current,
      step: 'importing',
      progress: 0,
      message: 'Criando álbum rascunho...',
      error: undefined,
      albumArtist: DEFAULT_ARCHIVE_ARTIST,
    }));

    try {
      const result = await importPreparedArchive(
        prepared,
        {
          albumTitle: state.albumTitle,
          categoryNames: state.categoryNames,
          tracks: state.tracks,
        },
        (event) => {
          setState((current) => {
            const updatedTracks = [...current.tracks];
            updatedTracks[event.current - 1] = event.track;

            const progress = event.phase === 'uploading'
              ? Math.round(((event.current - 1) / Math.max(event.total, 1)) * 100)
              : Math.round((event.current / Math.max(event.total, 1)) * 100);

            return {
              ...current,
              step: 'importing',
              progress,
              message: `Importando faixa ${event.current}/${event.total}: ${event.title}`,
              tracks: updatedTracks,
            };
          });
        }
      );

      setState((current) => ({
        ...current,
        step: 'done',
        progress: 100,
        albumId: result.albumId,
        message: result.message,
        tracks: result.updatedTracks,
        error: undefined,
      }));
    } catch (error: any) {
      setState((current) => ({
        ...current,
        step: 'error',
        error: error?.message || 'Erro na importação.',
      }));
    }
  }, [importPreparedArchive, parsedUrls, state]);

  const handleBatchImport = useCallback(async () => {
    if (parsedUrls.length === 0) return;
    if (parsedUrls.some(isUnsupportedArchiveImportInput)) {
      setCatalogError('A fila atual contém referências de mídia direta. Para esse caso, use o botão "Importar mídias descobertas como rascunho" na seção de descoberta.');
      return;
    }

    const initialItems: BatchItem[] = parsedUrls.map((inputUrl) => ({
      inputUrl,
      albumTitle: '',
      albumSlug: buildArchiveAlbumSlug(extractArchiveSlug(inputUrl)),
      categoryNames: [],
      tracksCount: 0,
      importedTracks: 0,
      sourceFormat: 'zip',
      status: 'pending',
    }));

    setBatchItems(initialItems);
    setBatchRunning(true);

    try {
      for (let index = 0; index < parsedUrls.length; index += 1) {
        const inputUrl = parsedUrls[index];
        const optimisticAlbumSlug = buildArchiveAlbumSlug(extractArchiveSlug(inputUrl));

        updateBatchItem(index, {
          status: 'running',
          albumSlug: optimisticAlbumSlug,
          message: 'Verificando se o álbum já existe...',
          error: undefined,
        });

        try {
          const existingAlbum = await findExistingAlbumBySlug(optimisticAlbumSlug);
          if (existingAlbum?.id) {
            const existingTrackOrders = await getExistingAlbumTrackOrders(existingAlbum.id);
            const expectedTracks = Number(existingAlbum.total_tracks || 0);
            if (expectedTracks > 0 && existingTrackOrders.size >= expectedTracks) {
              updateBatchItem(index, {
                status: 'skipped',
                albumId: existingAlbum.id,
                importedTracks: existingTrackOrders.size,
                tracksCount: expectedTracks,
                message: `Álbum já existente: ${existingAlbum.title || optimisticAlbumSlug}.`,
              });
              continue;
            }

            updateBatchItem(index, {
              status: 'running',
              albumId: existingAlbum.id,
              importedTracks: existingTrackOrders.size,
              tracksCount: expectedTracks || 0,
              message: `Retomando álbum existente: ${existingAlbum.title || optimisticAlbumSlug}.`,
            });
          }

          const prepared = await analyzeArchiveUrl(inputUrl);
          updateBatchItem(index, {
            albumTitle: prepared.albumTitle,
            albumSlug: prepared.albumSlug,
            archiveUrl: prepared.archiveUrl,
            categoryNames: prepared.categoryNames,
            tracksCount: prepared.tracks.length,
            message: 'Criando álbum rascunho...',
          });

          const result = await importPreparedArchive(prepared, undefined, (event) => {
            updateBatchItem(index, {
              status: 'running',
              importedTracks: event.phase === 'done' ? event.current : Math.max(event.current - 1, 0),
              message: `Importando faixa ${event.current}/${event.total}: ${event.title}`,
            });
          });

          updateBatchItem(index, {
            status: result.skipped ? 'skipped' : result.errorCount > 0 ? 'error' : 'done',
            albumId: result.albumId,
            importedTracks: result.importedTracks,
            tracksCount: prepared.tracks.length,
            message: result.message,
            error: result.errorCount > 0 ? `${result.errorCount} faixa(s) com erro.` : undefined,
          });
        } catch (error: any) {
          updateBatchItem(index, {
            status: 'error',
            message: 'Falha ao importar este álbum.',
            error: error?.message || 'Erro desconhecido.',
          });
        }
      }
    } finally {
      setBatchRunning(false);
    }
  }, [analyzeArchiveUrl, importPreparedArchive, parsedUrls, updateBatchItem]);

  const handleImportDiscoveredMedia = useCallback(async () => {
    if (selectedDiscoveredMediaGroups.length === 0) return;

    const initialItems: BatchItem[] = selectedDiscoveredMediaGroups.map((group) => ({
      inputUrl: group.items[0]?.archiveUrl || `https://${group.sourceHost}/${group.sourcePath}`,
      archiveUrl: group.items[0]?.archiveUrl,
      albumTitle: group.albumTitle,
      albumSlug: group.albumSlug,
      categoryNames: [],
      tracksCount: group.items.length,
      importedTracks: 0,
      sourceFormat: 'media',
      status: 'pending',
    }));

    setCatalogError(undefined);
    setBatchItems(initialItems);
    setBatchRunning(true);

    try {
      for (let index = 0; index < selectedDiscoveredMediaGroups.length; index += 1) {
        const group = selectedDiscoveredMediaGroups[index];

        updateBatchItem(index, {
          status: 'running',
          albumTitle: group.albumTitle,
          albumSlug: group.albumSlug,
          tracksCount: group.items.length,
          message: 'Verificando se o álbum já existe...',
          error: undefined,
        });

        try {
          const existingAlbum = await findExistingAlbumBySlug(group.albumSlug);
          if (existingAlbum?.id) {
            const existingTrackOrders = await getExistingAlbumTrackOrders(existingAlbum.id);
            if (existingTrackOrders.size >= group.items.length) {
              updateBatchItem(index, {
                status: 'skipped',
                albumId: existingAlbum.id,
                importedTracks: existingTrackOrders.size,
                tracksCount: group.items.length,
                message: `Álbum já existente: ${existingAlbum.title || group.albumSlug}.`,
              });
              continue;
            }

            updateBatchItem(index, {
              status: 'running',
              albumId: existingAlbum.id,
              importedTracks: existingTrackOrders.size,
              tracksCount: group.items.length,
              message: `Retomando álbum existente: ${existingAlbum.title || group.albumSlug}.`,
            });
          }

          const prepared = await prepareWaybackMediaGroup(group, (_progress, message) => {
            updateBatchItem(index, {
              status: 'running',
              message,
            });
          });

          updateBatchItem(index, {
            archiveUrl: prepared.archiveUrl,
            albumTitle: prepared.albumTitle,
            albumSlug: prepared.albumSlug,
            categoryNames: prepared.categoryNames,
            tracksCount: prepared.tracks.length,
            message: 'Criando álbum rascunho...',
          });

          const result = await importPreparedArchive(prepared, undefined, (event) => {
            updateBatchItem(index, {
              status: 'running',
              importedTracks: event.phase === 'done' ? event.current : Math.max(event.current - 1, 0),
              message: `Importando faixa ${event.current}/${event.total}: ${event.title}`,
            });
          });

          updateBatchItem(index, {
            status: result.skipped ? 'skipped' : result.errorCount > 0 ? 'error' : 'done',
            albumId: result.albumId,
            importedTracks: result.importedTracks,
            tracksCount: prepared.tracks.length,
            message: result.message,
            error: result.errorCount > 0 ? `${result.errorCount} faixa(s) com erro.` : undefined,
          });
        } catch (error: any) {
          updateBatchItem(index, {
            status: 'error',
            message: 'Falha ao importar este álbum de mídia direta.',
            error: error?.message || 'Erro desconhecido.',
          });
        }
      }
    } finally {
      setBatchRunning(false);
    }
  }, [importPreparedArchive, prepareWaybackMediaGroup, selectedDiscoveredMediaGroups, updateBatchItem]);

  const doneCount = state.tracks.filter((track) => track.status === 'done').length;
  const errorCount = state.tracks.filter((track) => track.status === 'error').length;
  const batchDoneCount = batchItems.filter((item) => item.status === 'done').length;
  const batchSkippedCount = batchItems.filter((item) => item.status === 'skipped').length;
  const batchErrorCount = batchItems.filter((item) => item.status === 'error').length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Archive className="w-8 h-8 text-primary-400" />
          Importar do Acervo
        </h1>
        <p className="text-gray-400">
          Automatize o acervo histórico em lote, criando álbuns e hinos como rascunho.
        </p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 className="text-white font-semibold text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-primary-400" />
              Mapear fontes do acervo
            </h2>
            <p className="text-gray-400 text-sm mt-1 max-w-3xl">
              Mapeie referências protegidas por domínio, caminho e extensão antes de importar. Para o acervo principal, os ZIPs descobertos podem ser enviados direto ao importador abaixo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Fonte predefinida</label>
            <select
              value={discoveryDraft.presetId}
              onChange={(event) => handleDiscoveryPresetChange(event.target.value)}
              disabled={isInteractionLocked}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none disabled:opacity-60"
            >
              {WAYBACK_DISCOVERY_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
            <p className="text-gray-500 text-xs mt-2">
              {getWaybackDiscoveryPreset(discoveryDraft.presetId).description}
            </p>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Fonte base do acervo</label>
            <input
              type="text"
              value={discoveryDraft.seedUrl}
              onChange={(event) => setDiscoveryDraft((current) => ({ ...current, seedUrl: event.target.value }))}
              disabled={isInteractionLocked}
              placeholder="http://acervo-historico/"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none disabled:opacity-60"
            />
            <p className="text-gray-500 text-xs mt-2">
              Exemplos: <code>http://www.canticosccb.com.br/zip/</code> ou <code>http://acervo-historico/</code>
            </p>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Extensões alvo</label>
            <input
              type="text"
              value={discoveryDraft.extensionsInput}
              onChange={(event) => setDiscoveryDraft((current) => ({ ...current, extensionsInput: event.target.value }))}
              disabled={isInteractionLocked}
              placeholder="zip, mp3, wma, mid"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Palavras-chave opcionais</label>
            <input
              type="text"
              value={discoveryDraft.keywordsInput}
              onChange={(event) => setDiscoveryDraft((current) => ({ ...current, keywordsInput: event.target.value }))}
              disabled={isInteractionLocked}
              placeholder="avulsos, orquestrados, ingles, letras"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none disabled:opacity-60"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <button
            onClick={handleDiscoverWaybackUrls}
            disabled={discoveryLoading || isPreviewBusy || batchRunning || catalogLoading}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {discoveryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Descobrir referências
          </button>

          <button
            onClick={handleCopyDiscoveredUrls}
            disabled={discoveredItems.length === 0 || isInteractionLocked}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Copy className="w-5 h-5" />
            Copiar referências
          </button>

          <button
            onClick={handleUseDiscoveredZipUrls}
            disabled={discoveredZipUrls.length === 0 || isInteractionLocked}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Archive className="w-5 h-5" />
            Usar ZIPs no importador
          </button>

          <button
            onClick={handleImportDiscoveredMedia}
            disabled={selectedDiscoveredMediaGroups.length === 0 || isInteractionLocked}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Music className="w-5 h-5" />
            {selectedDiscoveredMediaGroups.length > 0
              ? `Importar ${selectedDiscoveredMediaGroups.length} grupo(s) de mídia`
              : 'Importar mídias descobertas'}
          </button>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
          <span>Filtro atual: {discoveryExtensions.length > 0 ? discoveryExtensions.join(', ') : 'todas as extensões'}</span>
          <span>Palavras-chave: {discoveryKeywords.length > 0 ? discoveryKeywords.join(', ') : 'sem filtro'}</span>
          {discoveredItems.length > 0 && (
            <span>{discoveredItems.length} referência(s) descobertas • {discoveredZipUrls.length} ZIP(s) aproveitáveis no importador atual</span>
          )}
          {discoveredMediaGroups.length > 0 && (
            <span>{discoveredMediaGroups.length} álbum(ns) agrupados a partir de mídias diretas</span>
          )}
          {selectedDiscoveredMediaGroups.length > 0 && (
            <span>{selectedDiscoveredMediaGroups.length} álbum(ns) selecionados para importação</span>
          )}
        </div>

        {discoveryMessage && (
          <p className="text-blue-300 text-sm">{discoveryMessage}</p>
        )}
        {discoveryError && (
          <p className="text-red-300 text-sm whitespace-pre-line">{discoveryError}</p>
        )}

        {discoveredItems.length > 0 && (
          <div className="bg-gray-800/40 border border-gray-700/60 rounded-xl p-4 space-y-4">
            {discoveredMediaGroups.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <h3 className="text-white text-sm font-semibold">Álbuns agrupados a partir das mídias</h3>
                    <p className="text-gray-500 text-xs">
                      Selecione os grupos que deseja importar. A seleção atual é usada pelo botão <strong className="text-white">Importar mídias descobertas</strong>.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAllMediaGroups}
                      disabled={filteredDiscoveredMediaGroups.length === 0 || isInteractionLocked}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      {normalizedMediaGroupSearch ? 'Selecionar filtrados' : 'Selecionar todos'}
                    </button>
                    <button
                      onClick={handleClearMediaGroupSelection}
                      disabled={selectedMediaGroupKeys.length === 0 || isInteractionLocked}
                      className="px-3 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg border border-gray-700 transition-colors"
                    >
                      Limpar seleção
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={mediaGroupSearch}
                    onChange={(event) => {
                      setMediaGroupSearch(event.target.value);
                      setMediaGroupVisibleCount(24);
                    }}
                    disabled={isInteractionLocked}
                    placeholder="Filtrar grupos por título, pasta ou slug"
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white text-sm focus:border-primary-500 outline-none disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {visibleDiscoveredMediaGroups.map((group) => {
                    const isSelected = selectedMediaGroupKeys.includes(group.key);

                    return (
                      <label
                        key={group.key}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-primary-500/60 bg-primary-500/10'
                            : 'border-gray-700/60 bg-gray-900/30 hover:bg-gray-900/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleMediaGroupSelection(group.key)}
                            disabled={isInteractionLocked}
                            className="mt-1 rounded border-gray-600 bg-gray-900 text-primary-500 focus:ring-primary-500"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-sm font-medium">{group.albumTitle}</p>
                            <p className="text-gray-500 text-xs mt-1 break-all">
                              Pasta do acervo: {getPublicArchivePathLabel(group.sourcePath.split('/').filter(Boolean))}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="px-2 py-1 rounded-full bg-gray-950 text-gray-300 text-[11px] border border-gray-700">
                                {group.items.length} faixa(s)
                              </span>
                              <span className="px-2 py-1 rounded-full bg-gray-950 text-gray-300 text-[11px] border border-gray-700">
                                slug: {group.albumSlug}
                              </span>
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {filteredDiscoveredMediaGroups.length === 0 && (
                  <p className="text-yellow-300 text-xs">
                    Nenhum grupo corresponde ao filtro atual. Ajuste a busca para voltar a exibir os álbuns descobertos.
                  </p>
                )}

                {filteredDiscoveredMediaGroups.length > 0 && (
                  <p className="text-gray-500 text-xs">
                    Mostrando {visibleDiscoveredMediaGroups.length} de {filteredDiscoveredMediaGroups.length} grupo(s)
                    {normalizedMediaGroupSearch ? ` filtrados de ${discoveredMediaGroups.length} total(is)` : ''}.
                  </p>
                )}

                {filteredDiscoveredMediaGroups.length > visibleDiscoveredMediaGroups.length && (
                  <button
                    onClick={handleShowMoreMediaGroups}
                    disabled={isInteractionLocked}
                    className="px-3 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg border border-gray-700 transition-colors"
                  >
                    Mostrar mais 24 grupos
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {Object.entries(discoveryExtensionCounts)
                .sort(([left], [right]) => left.localeCompare(right, 'pt-BR'))
                .map(([extension, count]) => (
                  <span
                    key={extension}
                    className="px-2.5 py-1 rounded-full bg-gray-900 text-gray-300 text-xs border border-gray-700"
                  >
                    .{extension} ({count})
                  </span>
                ))}
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {discoveredItems.slice(0, 80).map((item, index) => (
                <div
                  key={`${item.archiveUrl}-${index}`}
                  className="p-3 rounded-lg border border-gray-700/60 bg-gray-900/40"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-1 rounded bg-gray-950 text-primary-300 text-[11px] border border-gray-700">
                      .{item.extension || 'sem-extensao'}
                    </span>
                    <span className="text-gray-500 text-xs">{item.timestamp}</span>
                  </div>
                  <p className="text-white text-sm break-all">
                    {getPublicArchivePathLabel(getWaybackOriginalUrlMeta(item.originalUrl).pathSegments)}
                  </p>
                  <p className="text-primary-400 text-xs">Referência protegida do acervo</p>
                </div>
              ))}
            </div>

            {discoveredItems.length > 80 && (
              <p className="text-gray-500 text-xs">
                Mostrando 80 de {discoveredItems.length} resultados. Use <strong className="text-white">Copiar referências</strong> para obter a lista completa em formato sanitizado.
              </p>
            )}

            {discoveredZipUrls.length === 0 && (
              <p className="text-yellow-300 text-xs">
                Esta descoberta não retornou ZIPs. Se houver mídias diretas agrupadas acima, use <strong className="text-white">Importar mídias descobertas</strong> para criar os rascunhos automaticamente por pasta/álbum.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-white font-medium mb-2">Referências ZIP do Acervo</label>
          <p className="text-gray-400 text-sm mb-3">
            Cole uma referência por linha ou carregue o catálogo completo do acervo. Esta etapa de importação ainda trabalha com
            <strong className="text-white"> arquivos ZIP</strong>. Para mídias diretas descobertas no mapeamento do acervo, use o botão
            <strong className="text-white"> Importar mídias descobertas</strong> acima. O importador cria álbuns em rascunho, fixa o autor em
            <strong className="text-white"> {DEFAULT_ARCHIVE_ARTIST}</strong> e aplica limpeza automática nos títulos das faixas.
          </p>
          <div className="relative">
            <Link2 className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
            <textarea
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              placeholder={`http://canticosccb.com.br/zip/exemplo-www.canticosccb.com.br.zip\nhttp://canticosccb.com.br/zip/outro-album-www.canticosccb.com.br.zip`}
              className="w-full min-h-[170px] pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-y"
              disabled={isInteractionLocked}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <button
            onClick={handleAnalyze}
            disabled={parsedUrls.length === 0 || isInteractionLocked}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            Analisar primeira referência
          </button>

          <button
            onClick={handleBatchImport}
            disabled={parsedUrls.length === 0 || isInteractionLocked}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {batchRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            Importar em lote como rascunho
          </button>

          <button
            onClick={handleLoadCatalog}
            disabled={isInteractionLocked}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {catalogLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Archive className="w-5 h-5" />}
            Carregar catálogo completo
          </button>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
          <span>{parsedUrls.length} referência(s) detectada(s)</span>
          {parsedUrls.length > 1 && <span>O preview usa apenas a primeira linha.</span>}
          <span>Referência pública: {PUBLIC_ARCHIVE_SITE_REFERENCE}</span>
        </div>

        {categoriesLoading && (
          <p className="text-gray-500 text-sm">Carregando categorias atuais do banco para vincular automaticamente.</p>
        )}
        {categoriesError && (
          <p className="text-yellow-300 text-sm">
            Categorias não carregadas. O importador ainda funciona, mas pode não criar os vínculos em `hino_categorias`.
          </p>
        )}
        {catalogError && (
          <p className="text-red-300 text-sm">{catalogError}</p>
        )}
      </div>

      {(state.step === 'resolving' || state.step === 'downloading' || state.step === 'extracting' || state.step === 'importing') && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
            <span className="text-white font-medium">{state.message}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-primary-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">{state.progress}%</p>
        </div>
      )}

      {state.step === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-400 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Erro na importação</p>
              <p className="text-red-300 text-sm mt-1 whitespace-pre-line">{state.error}</p>
              <button
                onClick={() => setState(createInitialState())}
                className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {(state.step === 'preview' || state.step === 'importing' || state.step === 'done') && (
        <>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg flex items-center gap-2">
              <Music className="w-5 h-5 text-primary-400" />
              Dados do Álbum
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
	              <div>
	                <label className="block text-gray-400 text-sm mb-1">Título do Álbum</label>
	                <input
	                  type="text"
	                  value={state.albumTitle}
	                  onChange={(event) => setState((current) => {
                    const nextAlbumTitle = event.target.value;
                    return {
                      ...current,
                      albumTitle: nextAlbumTitle,
                      tracks: refreshTrackCategories(nextAlbumTitle, current.categoryNames, current.tracks),
                    };
                  })}
	                  disabled={state.step !== 'preview'}
	                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none disabled:opacity-60"
	                />
	              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Autor padrão</label>
                <input
                  type="text"
                  value={state.albumArtist}
                  disabled
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white opacity-70"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Slug do Álbum</label>
                <input
                  type="text"
                  value={state.albumSlug}
                  disabled
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white opacity-70"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Categorias inferidas</label>
	                <input
	                  type="text"
	                  value={state.categoryNames.join(', ')}
	                  onChange={(event) => setState((current) => ({
	                    ...current,
	                    categoryNames: parseCategoryNamesInput(event.target.value),
                      tracks: refreshTrackCategories(
                        current.albumTitle,
                        parseCategoryNamesInput(event.target.value),
                        current.tracks
                      ),
	                  }))}
	                  disabled={state.step !== 'preview'}
	                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none disabled:opacity-60"
	                />
	              </div>

              <div className="md:col-span-2 flex flex-wrap gap-4 text-sm text-gray-400">
                <span>{state.tracks.length} faixa(s)</span>
                <span>{formatFileSize(state.tracks.reduce((sum, track) => sum + track.size, 0))} total</span>
                <span>Origem pública: {PUBLIC_ARCHIVE_SOURCE_LABEL}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <List className="w-5 h-5 text-primary-400" />
              Faixas ({state.tracks.length})
              {state.step === 'done' && (
                <span className="text-sm font-normal text-gray-400 ml-2">
                  {doneCount} importadas, {errorCount} erros
                </span>
              )}
            </h2>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {state.tracks.map((track, index) => (
                <div
                  key={`${track.fileName}-${index}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    track.status === 'done' ? 'bg-green-500/5 border-green-500/20' :
                    track.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                    track.status === 'uploading' ? 'bg-blue-500/5 border-blue-500/20' :
                    'bg-gray-800/50 border-gray-700/50'
                  }`}
                >
                  <span className="text-gray-500 text-sm w-8 text-right">{index + 1}.</span>

                  {track.status === 'done' && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                  {track.status === 'error' && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  {track.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />}
                  {track.status === 'pending' && <Music className="w-4 h-4 text-gray-500 flex-shrink-0" />}

                  <div className="flex-1 min-w-0">
                    {state.step === 'preview' ? (
                      <div className="flex items-center gap-3">
                        {typeof track.number === 'number' && (
                          <span className="px-2 py-1 rounded bg-gray-900 text-primary-300 text-xs border border-gray-700">
                            #{track.number}
                          </span>
                        )}
	                        <input
	                          type="text"
	                          value={track.title}
	                          onChange={(event) => {
	                            const updatedTracks = [...state.tracks];
	                            const updatedTrack = { ...track, title: event.target.value };
	                            updatedTracks[index] = {
                                ...updatedTrack,
                                categoryNames: resolveTrackCategoryNames(state.albumTitle, updatedTrack, state.categoryNames),
                              };
	                            setState((current) => ({ ...current, tracks: updatedTracks }));
	                          }}
	                          className="w-full bg-transparent border-b border-gray-700 text-white text-sm py-1 focus:border-primary-500 outline-none"
	                        />
	                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {typeof track.number === 'number' && (
                          <span className="px-2 py-1 rounded bg-gray-900 text-primary-300 text-xs border border-gray-700">
                            #{track.number}
                          </span>
                        )}
                        <p className="text-white text-sm truncate">{track.title}</p>
                      </div>
                    )}
	                    {track.error && <p className="text-red-400 text-xs mt-1">{track.error}</p>}
	                    {track.note && !track.error && <p className="text-blue-300 text-xs mt-1">{track.note}</p>}
                      {track.categoryNames && track.categoryNames.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {track.categoryNames.map((name) => (
                            <span
                              key={`${track.fileName}-${name}`}
                              className="px-2 py-1 rounded-full bg-gray-900 text-gray-300 text-[11px] border border-gray-700"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
	                    {track.duration && <p className="text-gray-500 text-xs">{track.duration}</p>}
	                  </div>

                  <span className="text-gray-500 text-xs flex-shrink-0">{formatFileSize(track.size)}</span>
                </div>
              ))}
            </div>
          </div>

          {state.step === 'preview' && (
            <div className="flex gap-3">
              <button
                onClick={handleImport}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Importar álbum como rascunho
              </button>
              <button
                onClick={() => setState(createInitialState())}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          {state.step === 'done' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 mt-0.5" />
                <div>
                  <p className="text-green-400 font-medium">{state.message}</p>
                  {state.albumId && (
                    <p className="text-green-300 text-sm mt-1">
                      ID do álbum: <code className="bg-green-500/20 px-2 py-0.5 rounded">{state.albumId}</code>
                    </p>
                  )}
                  <button
                    onClick={() => setState(createInitialState())}
                    className="mt-3 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm transition-colors"
                  >
                    Preparar outro preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {batchItems.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                {batchRunning ? (
                  <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                ) : (
                  <List className="w-5 h-5 text-primary-400" />
                )}
                Importação em lote
              </h2>
              <p className="text-gray-400 text-sm">
                {batchItems.length} álbum(ns) na fila • {batchDoneCount} concluído(s) • {batchSkippedCount} ignorado(s) • {batchErrorCount} com erro
              </p>
            </div>
            {batchRunning && (
              <p className="text-primary-300 text-sm">
                Processando sequencialmente para evitar conflitos de upload e duplicidade.
              </p>
            )}
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {batchItems.map((item, index) => (
              <div
                key={`${item.inputUrl}-${index}`}
                className={`p-4 rounded-lg border ${
                  item.status === 'done' ? 'bg-green-500/5 border-green-500/20' :
                  item.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                  item.status === 'skipped' ? 'bg-yellow-500/5 border-yellow-500/20' :
                  item.status === 'running' ? 'bg-blue-500/5 border-blue-500/20' :
                  'bg-gray-800/50 border-gray-700/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 text-sm w-8 text-right pt-0.5">{index + 1}.</span>

                  {item.status === 'done' && <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />}
                  {item.status === 'error' && <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                  {item.status === 'skipped' && <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />}
                  {item.status === 'running' && <Loader2 className="w-4 h-4 text-blue-400 mt-0.5 animate-spin flex-shrink-0" />}
                  {item.status === 'pending' && <Archive className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />}

                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {item.albumTitle || item.albumSlug || `Álbum do Acervo ${index + 1}`}
                    </p>
                    {item.sourceFormat && (
                      <p className="text-gray-500 text-[11px] mt-1 uppercase tracking-wide">
                        Fonte: {item.sourceFormat === 'media' ? 'midia direta' : 'zip'}
                      </p>
                    )}
                    <p className="text-gray-400 text-xs mt-1 break-all">
                      Referência pública: {PUBLIC_ARCHIVE_SOURCE_LABEL}
                    </p>
                    {item.message && <p className="text-gray-300 text-xs mt-2">{item.message}</p>}
                    {item.error && <p className="text-red-300 text-xs mt-1 whitespace-pre-line">{item.error}</p>}
                    {item.categoryNames.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.categoryNames.map((name) => (
                          <span
                            key={`${item.albumSlug}-${name}`}
                            className="px-2 py-1 rounded-full bg-gray-800 text-gray-300 text-xs border border-gray-700"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right text-xs text-gray-400 min-w-[92px]">
                    <p>{item.importedTracks}/{item.tracksCount || 0} faixas</p>
                    {item.albumId && (
                      <p className="mt-1 text-gray-500 break-all">{item.albumId}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.step === 'idle' && batchItems.length === 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Como usar
          </h3>
          <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
            <li>Use <strong className="text-white">Mapear fontes do acervo</strong> quando quiser mapear um novo acervo histórico.</li>
            <li>Se a fonte retornar <strong className="text-white">ZIPs</strong>, clique em <strong className="text-white">Usar ZIPs no importador</strong> ou carregue o catálogo completo.</li>
            <li>Se a fonte retornar <strong className="text-white">mídias diretas</strong> (.mp3/.wma/.mid), selecione os grupos desejados e clique em <strong className="text-white">Importar mídias descobertas</strong>.</li>
            <li>Use <strong className="text-white">Analisar primeira referência</strong> quando quiser revisar manualmente um álbum antes de importar.</li>
            <li>Use <strong className="text-white">Importar em lote como rascunho</strong> para criar todos os álbuns automaticamente.</li>
            <li>O autor é fixado como <strong className="text-white">{DEFAULT_ARCHIVE_ARTIST}</strong> e os títulos das faixas passam por limpeza automática.</li>
            <li>As categorias são inferidas por regras: instrumentos geram <strong className="text-white">Hinos Tocados</strong>; sem instrumento, o padrão é <strong className="text-white">Hinos Cantados</strong>; depois o sistema tenta classificar em <strong className="text-white">Hinário 4</strong>, <strong className="text-white">Hinário 5</strong> ou <strong className="text-white">Hinos Avulsos</strong>.</li>
            <li>Quando a faixa traz um número reconhecido do hinário, o preview também pode aplicar o título oficial e anexar a letra automaticamente.</li>
          </ol>
          <p className="text-gray-500 text-xs mt-4">
            Os registros novos são criados em rascunho (`albums.is_published = false`, `hinos.status = draft`) para revisão posterior no admin.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminArchiveImport;
