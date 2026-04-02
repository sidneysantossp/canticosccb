import { generateSlug } from '@/lib/utils/slugUtils';

export const DEFAULT_ARCHIVE_ARTIST = 'Acervo Cânticos CCB';
export const PUBLIC_ARCHIVE_SOURCE_LABEL = 'Acervo Cânticos CCB';
export const PUBLIC_ARCHIVE_SITE_REFERENCE = 'canticosccb.com.br';
const HIDDEN_SOURCE_NAME = ['cc', 'bh', 'inos'].join('');
const HIDDEN_SOURCE_SITE = ['kit', 'net'].join('.');
const HIDDEN_SOURCE_NAME_REGEX = new RegExp(`\\b${HIDDEN_SOURCE_NAME}\\b`, 'gi');
const HIDDEN_SOURCE_SITE_REGEX = new RegExp(`\\b${['kit', 'net'].join('[-._\\\\s]*')}\\b`, 'gi');
const HIDDEN_HISTORICAL_SEED_URL = ['http://www.', HIDDEN_SOURCE_NAME, '.', HIDDEN_SOURCE_SITE, '/'].join('');

const ARCHIVE_FILE_EXTENSION_REGEX = /\.(mp3|wma|mid|midi|wav|ogg|aac|m4a|zip)$/i;

const stripArchiveSourceMarkers = (value: string) => String(value || '')
  .replace(/\bhttps?:\/\/\S+/gi, ' ')
  .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\.[a-z]{2})?\b/gi, ' ')
  .replace(HIDDEN_SOURCE_NAME_REGEX, ' ')
  .replace(HIDDEN_SOURCE_SITE_REGEX, ' ')
  .replace(/\bwww\b/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const stripArchiveFileExtension = (value: string) => String(value || '')
  .replace(ARCHIVE_FILE_EXTENSION_REGEX, '')
  .trim();

const INSTRUMENT_CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  { category: 'Acordeon', keywords: ['acordeon'] },
  { category: 'Clarinete', keywords: ['clarinete', 'clarone'] },
  { category: 'Fagote', keywords: ['fagote'] },
  { category: 'Flauta', keywords: ['flauta', 'flautas', 'flautim'] },
  { category: 'Gaita', keywords: ['gaita'] },
  { category: 'Oboé', keywords: ['oboe', 'oboé'] },
  { category: 'Órgão', keywords: ['orgao', 'órgao', 'órgão', 'organ'] },
  { category: 'Orquestra', keywords: ['orquestra', 'orquestrado', 'orquestrados', 'orquestrada', 'orquestradas'] },
  { category: 'Sax', keywords: ['sax', 'saxo', 'saxofone', 'saxofonista', 'saxapfone'] },
  { category: 'Trombone', keywords: ['trombone'] },
  { category: 'Trompa', keywords: ['trompa'] },
  { category: 'Trompete', keywords: ['trompete'] },
  { category: 'Tuba', keywords: ['tuba', 'bombardao', 'bombardão'] },
  { category: 'Ukulele', keywords: ['ukulele'] },
  { category: 'Viola', keywords: ['viola'] },
  { category: 'Violão', keywords: ['violao', 'violão', 'guitarra', 'guitarras', 'violoes', 'violões'] },
  { category: 'Violinos', keywords: ['violino', 'violinos'] },
];

const normalizeComparableText = (value: string) => stripArchiveSourceMarkers(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const titleCase = (value: string) => value
  .split(' ')
  .filter(Boolean)
  .map((word) => {
    if (/^\d+$/.test(word)) return word;
    if (word.length <= 2) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  })
  .join(' ')
  .replace(/\bCcb\b/g, 'CCB');

const stripSiteSuffix = (value: string) => stripArchiveFileExtension(stripArchiveSourceMarkers(value))
  .replace(/\s*-\s*$/g, '')
  .trim();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const VOCAL_CATEGORY_KEYWORDS = [
  'cantado',
  'cantados',
  'voz',
  'vozes',
  'coral',
  'a capela',
  'acapela',
  'cappella',
  'quarteto vocal',
  'dueto',
  'dupla',
  'solista',
  'solistas',
];

const INSTRUMENTAL_HINT_KEYWORDS = [
  'instrumental',
  'instrumentais',
  'orquestrad',
  'melodia',
  'melodias',
  'acompanhamento',
  'acompanhamentos',
  'piano',
  'teclado',
  'keyboard',
  'cello',
  'cellos',
  'violoncelo',
  'violoncelos',
  'violoncello',
  'violoncellos',
  'brass',
  'cordas',
  'cavaquinho',
  'guitarra',
  'guitarras',
  'havaiana',
  'sanfona',
];

const looksLikeAlbumInfoSegment = (segment: string, albumTitle: string, albumSlug: string) => {
  const comparableSegment = normalizeComparableText(segment);
  if (!comparableSegment) return true;
  if (/^\d+$/.test(comparableSegment)) return true;

  const comparableAlbum = normalizeComparableText(albumTitle);
  const comparableSlug = normalizeComparableText(albumSlug.replace(/-/g, ' '));

  if (comparableAlbum.includes(comparableSegment) || comparableSlug.includes(comparableSegment)) {
    return true;
  }

  const albumWords = new Set(`${comparableAlbum} ${comparableSlug}`.split(' ').filter(Boolean));
  const segmentWords = comparableSegment.split(' ').filter(Boolean);
  if (segmentWords.length === 0) return true;

  const overlap = segmentWords.filter((word) => albumWords.has(word)).length;
  return overlap / segmentWords.length >= 0.6;
};

export const extractArchiveSlug = (inputUrl: string) => {
  const decoded = decodeURIComponent(String(inputUrl || '').trim());
  const archiveMatch = decoded.match(/\/zip\/([^/?#]+?)(?:-www\.canticosccb\.com\.br)?\.zip/i);
  if (archiveMatch?.[1]) {
    return archiveMatch[1].trim();
  }

  return decoded
    .split('/')
    .pop()
    ?.replace(/\.zip$/i, '')
    .replace(/-www\.canticosccb\.com\.br$/i, '')
    .trim() || 'album-acervo';
};

export const slugToArchiveAlbumTitle = (slug: string) => titleCase(
  stripArchiveSourceMarkers(
    String(slug || '')
      .replace(/-www\.canticosccb\.com\.br$/i, '')
      .replace(/\.zip$/i, '')
  )
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

export const buildArchiveAlbumSlug = (archiveSlug: string) => {
  const normalized = generateSlug(stripArchiveSourceMarkers(archiveSlug)) || 'album-acervo';
  return `acervo-${normalized}`;
};

export const buildArchiveTrackSlug = (title: string, albumSlug: string, position: number) => {
  const trackSlug = generateSlug(stripArchiveSourceMarkers(title)) || `faixa-${position}`;
  return `${albumSlug}-${String(position).padStart(3, '0')}-${trackSlug}`;
};

export const parseArchiveUrlList = (value: string) => Array.from(
  new Set(
    String(value || '')
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
  )
);

const PRIMARY_ARCHIVE_CATEGORY_PRIORITY = [
  'Proclamação',
  'Hinos Cantados',
  'Hinos Tocados',
  'Hinos Avulsos',
  'Hinário 4',
  'Hinário 5',
];

export const pickPrimaryArchiveCategory = (names: string[]) => {
  const uniqueNames = Array.from(
    new Set(
      (names || [])
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  );

  for (const categoryName of PRIMARY_ARCHIVE_CATEGORY_PRIORITY) {
    if (uniqueNames.includes(categoryName)) {
      return categoryName;
    }
  }

  return uniqueNames[0] || '';
};

export const inferArchiveCategoryNames = (albumTitle: string) => {
  const comparableTitle = normalizeComparableText(albumTitle);
  const categories = new Set<string>();
  const hasExplicitAvulsoMarker = /\b(avuls|novos hinos|hinos novos|que sairam do hinario|fora do hinario)\b/.test(comparableTitle);

  if (/\b(ingles|english|oxford uk)\b/.test(comparableTitle)) {
    categories.add('Inglês');
  }

  if (/\b(italiano|italian|italia)\b/.test(comparableTitle)) {
    categories.add('Italiano');
  }

  const isProclamation = /\b(declam|proclam)\b/.test(comparableTitle);
  if (isProclamation) {
    categories.add('Proclamação');
    return Array.from(categories);
  }

  const hasVocalMarkers = VOCAL_CATEGORY_KEYWORDS.some((keyword) => comparableTitle.includes(keyword));
  let hasInstrument = INSTRUMENTAL_HINT_KEYWORDS.some((keyword) => comparableTitle.includes(keyword));

  for (const entry of INSTRUMENT_CATEGORY_KEYWORDS) {
    if (entry.keywords.some((keyword) => comparableTitle.includes(keyword))) {
      categories.add(entry.category);
      hasInstrument = true;
    }
  }

  categories.add(hasVocalMarkers ? 'Hinos Cantados' : hasInstrument ? 'Hinos Tocados' : 'Hinos Cantados');

  if (hasExplicitAvulsoMarker) {
    categories.add('Hinos Avulsos');
  } else if (/\b(?:hinario\s*(n|no|numero)?\s*)?0?4\b/.test(comparableTitle)) {
    categories.add('Hinário 4');
  } else if (/\b((hinario\s*(n|no|numero)?\s*)?0?5|hinario novo|livro\s*5)\b/.test(comparableTitle)) {
    categories.add('Hinário 5');
  } else {
    categories.add('Hinos Avulsos');
  }

  return Array.from(categories);
};

const getArchiveTrackParts = (
  fileName: string,
  context: { albumSlug: string; albumTitle: string }
) => {
  const baseName = String(fileName || '').split('/').pop() || String(fileName || '');
  let working = stripArchiveFileExtension(baseName).trim();

  working = stripSiteSuffix(working)
    .replace(new RegExp(`^${escapeRegExp(context.albumSlug)}`, 'i'), '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .trim();

  let segments = working.split(' - ').map((segment) => segment.trim()).filter(Boolean);

  while (segments.length > 1 && looksLikeAlbumInfoSegment(segments[0], context.albumTitle, context.albumSlug)) {
    segments.shift();
  }

  while (segments.length > 1 && normalizeComparableText(segments[segments.length - 1]).includes('canticosccb')) {
    segments.pop();
  }

  const merged = (segments.length > 0 ? segments.join(' - ') : working).trim();
  const leadingNumberMatch = merged.match(/^(\d{1,3})(?=[\s._-]|[A-Za-zÀ-ÿ]|$)/);
  const leadingNumber = leadingNumberMatch ? Number(leadingNumberMatch[1]) : undefined;

  let cleaned = merged
    .replace(/^\d+[\s._-]*/, '')
    .replace(/([0-9])([A-Za-zÀ-ÿ])/g, '$1 $2')
    .replace(/([a-zà-ÿ])([A-ZÀ-Ý])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    cleaned = stripSiteSuffix(baseName.replace(/\.mp3$/i, ''));
  }

  return {
    baseName,
    cleaned,
    leadingNumber,
  };
};

export const extractArchiveTrackNumber = (
  fileName: string,
  context: { albumSlug: string; albumTitle: string }
) => getArchiveTrackParts(fileName, context).leadingNumber;

export const cleanArchiveTrackTitle = (
  fileName: string,
  context: { albumSlug: string; albumTitle: string }
) => {
  const { cleaned, leadingNumber } = getArchiveTrackParts(fileName, context);
  if (cleaned) {
    return titleCase(cleaned);
  }

  return titleCase(leadingNumber ? `Faixa ${leadingNumber}` : 'Faixa do Acervo');
};

export interface WaybackDiscoveryPreset {
  id: string;
  label: string;
  description: string;
  seedUrl: string;
  inputSeedUrl?: string;
  extensions: string[];
  keywords: string[];
}

const normalizeDelimitedInput = (value: string) => Array.from(
  new Set(
    String(value || '')
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  )
);

export const parseWaybackKeywordsInput = (value: string) => normalizeDelimitedInput(value);

export const parseWaybackExtensionsInput = (value: string) => Array.from(
  new Set(
    normalizeDelimitedInput(value)
      .map((item) => item.replace(/^\./, '').toLowerCase())
      .filter(Boolean)
  )
);

export const normalizeWaybackDiscoverySeedUrl = (value: string) => {
  let normalized = String(value || '').trim();
  if (!normalized) return '';

  if (normalized.includes('web.archive.org/web/*/')) {
    normalized = normalized.split('web.archive.org/web/*/')[1] || normalized;
  }

  normalized = normalized.replace(/\*+$/g, '').trim();

  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `http://${normalized.replace(/^\/+/, '')}`;
  }

  if (!/\/$/.test(normalized) && !/\.[a-z0-9]{1,8}$/i.test(normalized)) {
    normalized += '/';
  }

  return normalized;
};

export const extractWaybackOriginalExtension = (value: string) => {
  const normalized = String(value || '').split('?')[0].split('#')[0];
  const extensionMatch = normalized.match(/\.([a-z0-9]{1,8})$/i);
  return extensionMatch?.[1]?.toLowerCase() || '';
};

export const isArchiveZipUrl = (value: string) => (
  /web\.archive\.org\/web\/\d+(?:if_)?\/http/i.test(String(value || ''))
  && /\.zip(?:[?#]|$)/i.test(String(value || ''))
);

export const WAYBACK_DISCOVERY_PRESETS: WaybackDiscoveryPreset[] = [
  {
    id: 'canticos-zip',
    label: 'Acervo Canticos CCB (ZIP)',
    description: 'Localiza os ZIPs do acervo principal do canticosccb.com.br, prontos para o importador existente.',
    seedUrl: 'http://www.canticosccb.com.br/zip/',
    inputSeedUrl: 'http://www.canticosccb.com.br/zip/',
    extensions: ['zip'],
    keywords: [],
  },
  {
    id: 'acervo-historico-midias',
    label: 'Acervo histórico (mídias)',
    description: 'Mapeia arquivos de áudio e mídia de um acervo histórico para pesquisa e importação, sem expor a origem externa.',
    seedUrl: HIDDEN_HISTORICAL_SEED_URL,
    inputSeedUrl: 'http://acervo-historico/',
    extensions: ['mp3', 'wma', 'mid', 'midi', 'zip'],
    keywords: ['avulsos', 'orquestrados', 'ingles', 'letras', 'audio'],
  },
  {
    id: 'custom',
    label: 'Fonte personalizada',
    description: 'Permite informar uma fonte protegida para descobrir referências do acervo por domínio ou caminho prefixo.',
    seedUrl: 'http://',
    extensions: ['zip'],
    keywords: [],
  },
];

export const getWaybackDiscoveryPreset = (presetId: string) => (
  WAYBACK_DISCOVERY_PRESETS.find((preset) => preset.id === presetId)
  || WAYBACK_DISCOVERY_PRESETS[0]
);
