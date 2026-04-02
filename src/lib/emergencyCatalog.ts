import { DEFAULT_COVER_URL } from '@/lib/config';
import { DEFAULT_SITE_URL, normalizeSiteUrl } from '@/utils/siteUrl';
import { extractUUID, slugifyText } from '@/utils/slugUrl';

export interface EmergencyHymn {
  id: string;
  numero: number;
  titulo: string;
  compositor_nome?: string;
  compositor_id?: string;
  categoria: string;
  cover_url?: string;
  audio_url?: string;
  letra?: string;
  duracao?: string;
  youtube_source?: string;
  created_at: string;
  updated_at: string;
  ativo: boolean;
  slug: string;
  source_path: string;
  is_emergency_fallback: true;
}

export interface EmergencyAlbum {
  id: string;
  title: string;
  artist?: string;
  description: string;
  cover_url?: string;
  total_tracks: number;
  release_date?: string | null;
  composer_id?: string | null;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  active: boolean;
  featured: boolean;
  featured_order: number;
  genre?: string | null;
  slug: string;
  related_hymn_ids: string[];
  is_emergency_fallback: true;
}

export interface EmergencyComposer {
  id: string;
  user_id?: string | null;
  name: string;
  artistic_name: string;
  email?: string | null;
  bio?: string;
  biography?: string;
  avatar_url?: string;
  photo_url?: string;
  status: 'approved';
  verified: true;
  is_featured: boolean;
  is_trending: boolean;
  followers_count: number;
  slug: string;
  category?: string | null;
  created_at: string;
  updated_at: string;
  is_emergency_fallback: true;
}

export interface EmergencyPlaylist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  is_emergency_fallback: true;
}

export interface EmergencyCategory {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  imagem_url?: string;
  ativo: boolean;
  cor: string;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
  is_emergency_fallback: true;
}

export interface EmergencyHinario {
  id: number;
  numero: number;
  titulo: string;
  subtitulo: string | null;
  conteudo: string;
  categoria: string;
  tags: string | null;
  views_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_emergency_fallback: true;
}

export interface EmergencyCatalog {
  hymns: EmergencyHymn[];
  albums: EmergencyAlbum[];
  composers: EmergencyComposer[];
  playlists: EmergencyPlaylist[];
  categories: EmergencyCategory[];
  albumHymns: Array<{ album_id: string; hino_id: string; position: number; track_number: number }>;
  hymnCategories: Array<{ hino_id: string; categoria_id: string }>;
  hinario: EmergencyHinario[];
}

const STATIC_NOW = '2026-03-23T12:00:00.000Z';
const DEFAULT_PLAYLIST_COVER = `${DEFAULT_COVER_URL}?v=playlist`;
const DEFAULT_AVATAR_BASE = 'https://ui-avatars.com/api/?background=111827&color=22c55e&size=512&name=';

const CATEGORY_DEFINITIONS = [
  {
    id: 'cantados',
    nome: 'Hinos Cantados',
    slug: 'cantados',
    descricao: 'Seleção pública em contingência dos hinos cantados do acervo.',
    cor: '#22c55e',
  },
  {
    id: 'tocados',
    nome: 'Hinos Tocados',
    slug: 'tocados',
    descricao: 'Seleção pública em contingência dos hinos tocados e instrumentais do acervo.',
    cor: '#3b82f6',
  },
  {
    id: 'avulsos',
    nome: 'Hinos Avulsos',
    slug: 'avulsos',
    descricao: 'Seleção pública em contingência dos hinos avulsos do acervo.',
    cor: '#f59e0b',
  },
  {
    id: 'hinario5',
    nome: 'Hinário 5',
    slug: 'hinario-5',
    descricao: 'Conteúdo programático do Hinário 5 reconstruído a partir do catálogo público.',
    cor: '#8b5cf6',
  },
  {
    id: 'instrumentais',
    nome: 'Instrumentais',
    slug: 'instrumentais',
    descricao: 'Seleção pública em contingência dos hinos instrumentais do acervo.',
    cor: '#06b6d4',
  },
] as const;

const SMALL_WORDS = new Set(['a', 'as', 'ao', 'aos', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na', 'nas', 'no', 'nos', 'o', 'os', 'para', 'por']);
const UPPERCASE_WORDS = new Map([
  ['ccb', 'CCB'],
  ['sp', 'SP'],
  ['mg', 'MG'],
  ['rj', 'RJ'],
  ['df', 'DF'],
  ['ii', 'II'],
  ['iii', 'III'],
  ['iv', 'IV'],
  ['v', 'V'],
]);
const STOP_TOKENS = new Set(['acervo', 'canticos', 'ccb', 'album', 'albuns', 'hino', 'hinos', 'parte', 'vol', 'volume', 'coletanea', 'colecao']);
const INSTRUMENT_KEYWORDS = [
  'acordeon',
  'acordeon',
  'baixo',
  'bandolim',
  'baritono',
  'cavaquinho',
  'cello',
  'clarinete',
  'flauta',
  'gaita',
  'guitarra',
  'harpa',
  'oboe',
  'orgao',
  'orquestra',
  'orquestrado',
  'orquestrados',
  'piano',
  'sax',
  'teclado',
  'tocado',
  'tocados',
  'trombone',
  'trompete',
  'tuba',
  'ukulele',
  'violao',
  'violino',
  'violinos',
  'violoncelo',
  'voz',
  'vozes',
];

let catalogPromise: Promise<EmergencyCatalog> | null = null;

function normalizeText(value?: string | number | null): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toTitleCase(value: string): string {
  const words = String(value || '')
    .split(/\s+/)
    .filter(Boolean);

  return words
    .map((word, index) => {
      const normalized = normalizeText(word);
      const upper = UPPERCASE_WORDS.get(normalized);
      if (upper) return upper;
      if (index > 0 && SMALL_WORDS.has(normalized)) return normalized;
      return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '';
    })
    .join(' ')
    .trim();
}

function parseLocTags(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/gi)).map((match) => String(match[1] || '').trim()).filter(Boolean);
}

function decodePath(urlOrPath: string): string {
  const path = String(urlOrPath || '').replace(/^https?:\/\/[^/]+/i, '');
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

function formatHumanSlug(raw: string): string {
  const cleaned = String(raw || '')
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return toTitleCase(cleaned);
}

function stripUuidSuffix(value: string): string {
  const id = extractUUID(value);
  if (!id || id === value) return value;
  return value.replace(new RegExp(`-${id}$`), '');
}

function buildAvatarUrl(name: string): string {
  return `${DEFAULT_AVATAR_BASE}${encodeURIComponent(name || 'Cânticos CCB')}`;
}

function tokenizeTitle(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token && token.length > 2 && !STOP_TOKENS.has(token));
}

function uniqueBy<T>(items: T[], keyGetter: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = keyGetter(item);
    if (!key || map.has(key)) continue;
    map.set(key, item);
  }
  return Array.from(map.values());
}

function inferHymnCategory(title: string, number: number): string {
  const normalized = normalizeText(title);
  const hasInstrument = INSTRUMENT_KEYWORDS.some((keyword) => normalized.includes(keyword));
  const hasCantadoHint = ['cantad', 'coral', 'a capela', 'voz', 'vozes'].some((keyword) => normalized.includes(keyword));

  if (normalized.includes('avulso') || normalized.includes('hinos novos') || normalized.includes('hino novo') || number <= 0 || number > 480) {
    return 'Avulsos';
  }

  if (hasInstrument && !hasCantadoHint) {
    return 'Tocados';
  }

  if (number >= 1 && number <= 480) {
    return 'Cantados';
  }

  return 'Cantados';
}

function inferCategoryIds(hymn: EmergencyHymn): string[] {
  const ids = new Set<string>();
  const normalizedTitle = normalizeText(hymn.titulo);
  const category = normalizeText(hymn.categoria);

  if (category.includes('tocado')) {
    ids.add('tocados');
    ids.add('instrumentais');
  } else if (category.includes('avulso')) {
    ids.add('avulsos');
  } else {
    ids.add('cantados');
  }

  if (hymn.numero >= 1 && hymn.numero <= 480) {
    ids.add('hinario5');
  }

  if (INSTRUMENT_KEYWORDS.some((keyword) => normalizedTitle.includes(keyword))) {
    ids.add('instrumentais');
    ids.add('tocados');
  }

  return Array.from(ids);
}

function getSitemapUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/sitemap.xml`;
  }

  const appUrl = normalizeSiteUrl(import.meta.env.VITE_APP_URL, DEFAULT_SITE_URL);
  return `${appUrl}/sitemap.xml`;
}

function isLikelyUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function parseComposerNameFromSlug(slugWithoutId: string): { slug: string; name: string } {
  return {
    slug: slugWithoutId,
    name: formatHumanSlug(slugWithoutId),
  };
}

function extractComposerSuffix(
  value: string,
  composers: Array<{ slug: string; name: string; id: string }>
): { cleaned: string; composerName?: string; composerId?: string } {
  const sorted = [...composers].sort((a, b) => b.slug.length - a.slug.length);
  for (const composer of sorted) {
    if (value.endsWith(`-por-${composer.slug}`)) {
      return {
        cleaned: value.slice(0, value.length - (`-por-${composer.slug}`).length),
        composerName: composer.name,
        composerId: composer.id,
      };
    }

    if (value.endsWith(`-${composer.slug}`)) {
      return {
        cleaned: value.slice(0, value.length - (`-${composer.slug}`).length),
        composerName: composer.name,
        composerId: composer.id,
      };
    }
  }

  return { cleaned: value };
}

function buildEmergencyPlaylists(paths: string[]): EmergencyPlaylist[] {
  return uniqueBy(
    paths
      .filter((path) => path.startsWith('/playlist/'))
      .map((path) => {
        const id = path.split('/playlist/')[1]?.trim() || '';
        const shortId = id.slice(0, 8).toUpperCase();
        return {
          id,
          name: shortId ? `Playlist ${shortId}` : 'Playlist da Comunidade',
          description: 'Playlist pública preservada em modo de contingência do acervo.',
          cover_url: DEFAULT_PLAYLIST_COVER,
          is_public: true,
          created_at: STATIC_NOW,
          updated_at: STATIC_NOW,
          is_emergency_fallback: true as const,
        };
      }),
    (playlist) => playlist.id
  );
}

function buildEmergencyComposers(paths: string[]): EmergencyComposer[] {
  return uniqueBy(
    paths
      .filter((path) => path.startsWith('/compositor/'))
      .map((path) => {
        const segment = path.split('/compositor/')[1] || '';
        const id = extractUUID(segment);
        const slugWithoutId = stripUuidSuffix(segment);
        const parsed = parseComposerNameFromSlug(slugWithoutId);
        return {
          id,
          user_id: null,
          name: parsed.name,
          artistic_name: parsed.name,
          email: null,
          bio: 'Perfil público reconstruído em modo de contingência do acervo.',
          biography: 'Perfil público reconstruído em modo de contingência do acervo.',
          avatar_url: buildAvatarUrl(parsed.name),
          photo_url: buildAvatarUrl(parsed.name),
          status: 'approved' as const,
          verified: true,
          is_featured: parsed.name === 'Acervo Canticos CCB',
          is_trending: parsed.name !== 'Acervo Canticos CCB',
          followers_count: 0,
          slug: parsed.slug,
          category: null,
          created_at: STATIC_NOW,
          updated_at: STATIC_NOW,
          is_emergency_fallback: true as const,
        };
      }),
    (composer) => composer.id
  );
}

function buildEmergencyHymns(
  paths: string[],
  composers: EmergencyComposer[]
): EmergencyHymn[] {
  return uniqueBy(
    paths
      .filter((path) => path.startsWith('/hino/'))
      .map((path) => {
        const segment = path.split('/hino/')[1] || '';
        const id = extractUUID(segment);
        const slugWithoutId = stripUuidSuffix(segment);
        let working = slugWithoutId.replace(/^hino-/, '');

        let number = 0;
        const numberMatch = working.match(/^(\d+)-/);
        if (numberMatch) {
          number = Number(numberMatch[1] || 0);
          working = working.slice(numberMatch[0].length);
        }

        working = working.replace(/^ccb-/, '').replace(/^-+/, '');

        const suffixMatch = extractComposerSuffix(working, composers.map((composer) => ({
          slug: composer.slug,
          name: composer.name,
          id: composer.id,
        })));

        const title = formatHumanSlug(suffixMatch.cleaned || working || `hino-${id}`);

        return {
          id,
          numero: Number.isFinite(number) ? number : 0,
          titulo: title || 'Hino do Acervo',
          compositor_nome: suffixMatch.composerName,
          compositor_id: suffixMatch.composerId,
          categoria: inferHymnCategory(title, number),
          cover_url: DEFAULT_COVER_URL,
          audio_url: '',
          letra: '',
          duracao: '',
          youtube_source: undefined,
          created_at: STATIC_NOW,
          updated_at: STATIC_NOW,
          ativo: true,
          slug: slugWithoutId,
          source_path: path,
          is_emergency_fallback: true as const,
        };
      }),
    (hymn) => hymn.id
  );
}

function buildEmergencyAlbums(
  paths: string[],
  composers: EmergencyComposer[],
  hymns: EmergencyHymn[]
): EmergencyAlbum[] {
  const composerRefs = composers.map((composer) => ({ slug: composer.slug, name: composer.name, id: composer.id }));

  return uniqueBy(
    paths
      .filter((path) => path.startsWith('/album/'))
      .map((path) => {
        const segment = path.split('/album/')[1] || '';
        const id = extractUUID(segment);
        const slugWithoutId = stripUuidSuffix(segment);
        const suffixMatch = extractComposerSuffix(slugWithoutId, composerRefs);
        const title = formatHumanSlug(suffixMatch.cleaned || slugWithoutId || `album-${id}`);
        const relatedHymns = selectRelatedHymnsForAlbum({ title, artist: suffixMatch.composerName }, hymns);

        return {
          id,
          title: title || 'Álbum do Acervo',
          artist: suffixMatch.composerName || 'Acervo Cânticos CCB',
          description: 'Catálogo público reconstruído em modo de contingência do acervo. Algumas faixas podem aparecer como relacionadas até a restauração completa do banco.',
          cover_url: DEFAULT_COVER_URL,
          total_tracks: relatedHymns.length,
          release_date: null,
          composer_id: suffixMatch.composerId || null,
          created_at: STATIC_NOW,
          updated_at: STATIC_NOW,
          is_published: true,
          active: true,
          featured: false,
          featured_order: 0,
          genre: normalizeText(title).includes('orquestr') ? 'instrumental' : null,
          slug: slugWithoutId,
          related_hymn_ids: relatedHymns.map((hymn) => hymn.id),
          is_emergency_fallback: true as const,
        };
      }),
    (album) => album.id
  );
}

function selectRelatedHymnsForAlbum(
  album: { title: string; artist?: string },
  hymns: EmergencyHymn[]
): EmergencyHymn[] {
  const albumTitle = normalizeText(album.title);
  const albumTokens = tokenizeTitle(album.title);
  const albumArtist = normalizeText(album.artist);
  const wantsAvulsos = albumTitle.includes('avulso') || albumTitle.includes('novos');
  const wantsHinario = albumTitle.includes('hinario') || albumTitle.includes('louvores e suplicas');
  const wantsTocados =
    albumTitle.includes('tocado') ||
    albumTitle.includes('instrument') ||
    INSTRUMENT_KEYWORDS.some((keyword) => albumTitle.includes(keyword));
  const wantsCantados = albumTitle.includes('cantad') || albumTitle.includes('voz') || albumTitle.includes('vozes');

  const scored = hymns.map((hymn) => {
    let score = 0;
    const hymnTitle = normalizeText(hymn.titulo);
    const hymnTokens = tokenizeTitle(hymn.titulo);
    const hymnComposer = normalizeText(hymn.compositor_nome);
    const hymnCategory = normalizeText(hymn.categoria);

    if (albumArtist && albumArtist !== 'acervo canticos ccb' && hymnComposer === albumArtist) {
      score += 120;
    }

    if (wantsAvulsos && hymnCategory.includes('avulso')) score += 35;
    if (wantsHinario && hymn.numero >= 1 && hymn.numero <= 480) score += 24;
    if (wantsTocados && (hymnCategory.includes('tocado') || hymnCategory.includes('instrument'))) score += 28;
    if (wantsCantados && hymnCategory.includes('cantado')) score += 24;

    for (const token of albumTokens) {
      if (hymnTitle.includes(token)) score += 6;
      if (hymnTokens.includes(token)) score += 4;
    }

    return { hymn, score };
  });

  const filtered = scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.hymn.numero - b.hymn.numero || a.hymn.titulo.localeCompare(b.hymn.titulo, 'pt-BR'))
    .slice(0, 24)
    .map((entry) => entry.hymn);

  if (filtered.length > 0) {
    return filtered;
  }

  return hymns
    .filter((hymn) => hymn.numero >= 1 && hymn.numero <= 480)
    .sort((a, b) => a.numero - b.numero || a.titulo.localeCompare(b.titulo, 'pt-BR'))
    .slice(0, 12);
}

function buildEmergencyCategories(): EmergencyCategory[] {
  return CATEGORY_DEFINITIONS.map((category) => ({
    id: category.id,
    nome: category.nome,
    slug: category.slug,
    descricao: category.descricao,
    imagem_url: DEFAULT_COVER_URL,
    ativo: true,
    cor: category.cor,
    meta_title: category.nome,
    meta_description: category.descricao,
    created_at: STATIC_NOW,
    updated_at: STATIC_NOW,
    is_emergency_fallback: true as const,
  }));
}

function buildEmergencyHinario(hymns: EmergencyHymn[]): EmergencyHinario[] {
  const bestByNumber = new Map<number, EmergencyHymn>();

  for (const hymn of hymns) {
    if (!(hymn.numero >= 1 && hymn.numero <= 480)) continue;
    const current = bestByNumber.get(hymn.numero);
    if (!current || hymn.titulo.length < current.titulo.length) {
      bestByNumber.set(hymn.numero, hymn);
    }
  }

  return Array.from(bestByNumber.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([numero, hymn]) => ({
      id: numero,
      numero,
      titulo: hymn.titulo,
      subtitulo: hymn.compositor_nome || null,
      conteudo: '',
      categoria: 'hinario5',
      tags: null,
      views_count: 0,
      is_active: true,
      created_at: STATIC_NOW,
      updated_at: STATIC_NOW,
      is_emergency_fallback: true as const,
    }));
}

function buildRelations(
  albums: EmergencyAlbum[],
  hymns: EmergencyHymn[]
): {
  albumHymns: Array<{ album_id: string; hino_id: string; position: number; track_number: number }>;
  hymnCategories: Array<{ hino_id: string; categoria_id: string }>;
} {
  const albumHymns = albums.flatMap((album) =>
    album.related_hymn_ids.map((hinoId, index) => ({
      album_id: album.id,
      hino_id: hinoId,
      position: index + 1,
      track_number: index + 1,
    }))
  );

  const hymnCategories = hymns.flatMap((hymn) =>
    inferCategoryIds(hymn).map((categoryId) => ({
      hino_id: hymn.id,
      categoria_id: categoryId,
    }))
  );

  return { albumHymns, hymnCategories };
}

async function buildCatalog(): Promise<EmergencyCatalog> {
  const response = await fetch(getSitemapUrl(), { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Falha ao carregar sitemap para contingência: ${response.status}`);
  }

  const xml = await response.text();
  const paths = parseLocTags(xml).map(decodePath);
  const composers = buildEmergencyComposers(paths);
  const hymns = buildEmergencyHymns(paths, composers);
  const albums = buildEmergencyAlbums(paths, composers, hymns);
  const playlists = buildEmergencyPlaylists(paths);
  const categories = buildEmergencyCategories();
  const hinario = buildEmergencyHinario(hymns);
  const relations = buildRelations(albums, hymns);

  return {
    hymns,
    albums,
    composers,
    playlists,
    categories,
    albumHymns: relations.albumHymns,
    hymnCategories: relations.hymnCategories,
    hinario,
  };
}

export function isSupabaseQuotaRestrictionErrorMessage(message?: string | null): boolean {
  const text = normalizeText(message);
  return (
    text.includes('402') ||
    text.includes('payment required') ||
    text.includes('service for this project is restricted') ||
    text.includes('exceed_egress_quota') ||
    text.includes('exceed_cached_egress_quota') ||
    text.includes('exceed_storage_size_quota') ||
    text.includes('pgrst205') ||
    text.includes('schema cache') ||
    text.includes('could not find the table') ||
    text.includes('does not exist') ||
    text.includes('relation') && text.includes('does not exist') ||
    text.includes('billing cycle') && text.includes('upgrade')
  );
}

export async function getEmergencyCatalog(): Promise<EmergencyCatalog> {
  if (!catalogPromise) {
    catalogPromise = buildCatalog().catch((error) => {
      catalogPromise = null;
      throw error;
    });
  }

  return catalogPromise;
}

function applyFilter(rows: any[], key: string, rawValue: string): any[] {
  const value = String(rawValue || '');

  if (value.startsWith('eq.')) {
    const expectedRaw = value.slice(3);
    const expected = expectedRaw === 'true' ? true : expectedRaw === 'false' ? false : expectedRaw;
    return rows.filter((row) => String(row?.[key]) === String(expected));
  }

  if (value.startsWith('neq.')) {
    const expected = value.slice(4);
    return rows.filter((row) => String(row?.[key]) !== String(expected));
  }

  if (value.startsWith('ilike.')) {
    const needle = normalizeText(value.slice(6).replace(/^%|%$/g, ''));
    return rows.filter((row) => normalizeText(row?.[key]).includes(needle));
  }

  if (value.startsWith('in.(') && value.endsWith(')')) {
    const allowed = new Set(value.slice(4, -1).split(',').map((item) => item.trim()).filter(Boolean));
    return rows.filter((row) => allowed.has(String(row?.[key])));
  }

  return rows;
}

function applyOrFilter(rows: any[], rawValue: string): any[] {
  const inner = String(rawValue || '').trim().replace(/^\(|\)$/g, '');
  const clauses = inner.split(',').map((item) => item.trim()).filter(Boolean);
  if (clauses.length === 0) return rows;

  return rows.filter((row) =>
    clauses.some((clause) => {
      const [key, ...rest] = clause.split('.');
      const operator = rest.shift();
      const raw = `${operator}.${rest.join('.')}`;
      return applyFilter([row], key, raw).length > 0;
    })
  );
}

function applyOrder(rows: any[], rawValue?: string): any[] {
  const value = String(rawValue || '').trim();
  if (!value) return rows;
  const [field, direction = 'asc'] = value.split('.');
  const multiplier = direction === 'desc' ? -1 : 1;

  return [...rows].sort((left, right) => {
    const a = left?.[field];
    const b = right?.[field];
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    const asNumber = Number(a);
    const bsNumber = Number(b);
    if (Number.isFinite(asNumber) && Number.isFinite(bsNumber)) {
      return (asNumber - bsNumber) * multiplier;
    }

    return String(a).localeCompare(String(b), 'pt-BR') * multiplier;
  });
}

function applySelect(rows: any[], rawValue?: string): any[] {
  const value = String(rawValue || '').trim();
  if (!value || value === '*') return rows;

  const fields = value
    .split(',')
    .map((field) => field.trim())
    .filter((field) => field && !field.includes('('));

  if (fields.length === 0) return rows;

  return rows.map((row) => {
    const selected: Record<string, unknown> = {};
    for (const field of fields) {
      selected[field] = row?.[field];
    }
    return selected;
  });
}

function applyParams(rows: any[], params: Record<string, string> = {}): any[] {
  let filtered = [...rows];

  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    if (['select', 'limit', 'offset', 'order', 'or'].includes(key)) continue;
    filtered = applyFilter(filtered, key, value);
  }

  if (params.or) {
    filtered = applyOrFilter(filtered, params.or);
  }

  filtered = applyOrder(filtered, params.order);

  const offset = Number(params.offset || 0);
  const limit = Number(params.limit || 0);
  const sliced = limit > 0 ? filtered.slice(offset, offset + limit) : filtered.slice(offset);

  return applySelect(sliced, params.select);
}

export async function getEmergencyRowsForTable(table: string, params: Record<string, string> = {}): Promise<any[]> {
  const catalog = await getEmergencyCatalog();

  const normalized = normalizeText(table);
  if (normalized === 'hinos') {
    return applyParams(catalog.hymns, params);
  }
  if (normalized === 'albums') {
    return applyParams(catalog.albums, params);
  }
  if (normalized === 'composers') {
    return applyParams(catalog.composers, params);
  }
  if (normalized === 'playlists') {
    return applyParams(catalog.playlists, params);
  }
  if (normalized === 'categorias') {
    return applyParams(catalog.categories, params);
  }
  if (normalized === 'album_hinos') {
    return applyParams(catalog.albumHymns, params);
  }
  if (normalized === 'hino_categorias') {
    return applyParams(catalog.hymnCategories, params);
  }
  if (normalized === 'hinario') {
    return applyParams(catalog.hinario, params);
  }
  if (normalized === 'user_follows' || normalized === 'historico' || normalized === 'playlist_tracks' || normalized === 'playlist_songs') {
    return [];
  }

  return [];
}

export async function getEmergencyDiscoveryData() {
  const catalog = await getEmergencyCatalog();
  return {
    hymns: catalog.hymns,
    composers: catalog.composers,
    albums: catalog.albums,
    playlists: catalog.playlists,
    categories: catalog.categories,
  };
}

export async function getEmergencyPlaylistById(id: string) {
  const catalog = await getEmergencyCatalog();
  return catalog.playlists.find((playlist) => String(playlist.id) === String(id)) || null;
}

export async function getEmergencyEditorialPlaylists() {
  const catalog = await getEmergencyCatalog();
  return catalog.playlists;
}
