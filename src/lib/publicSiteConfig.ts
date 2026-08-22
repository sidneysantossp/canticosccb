import { publicSupabase } from '@/lib/supabase-auth';
import { DEFAULT_SITE_URL, normalizeAssetUrl, normalizeSiteUrl } from '@/utils/siteUrl';

export interface RuntimeThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
}

export interface RuntimeThemeSettings {
  colors: RuntimeThemeColors;
  fontFamily: string;
  fontSize: string;
  borderRadius: string;
  mode: 'light' | 'dark';
  applyPublicTheme: boolean;
}

export interface RuntimeSeoSettings {
  site_title: string;
  site_description: string;
  site_keywords: string;
  site_url: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_card: 'summary' | 'summary_large_image' | 'player';
  twitter_site: string;
  robots_index: boolean;
  robots_follow: boolean;
  google_search_console_id: string;
}

export interface PublicPromotion {
  id: string;
  title: string;
  description?: string;
  promotion_type: 'discount' | 'trial' | 'upgrade' | 'bundle' | 'referral';
  discount_type: 'percentage' | 'fixed' | 'free';
  discount_value: number;
  promo_code: string;
  max_uses?: number;
  uses_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  clicks_count: number;
  conversions_count: number;
  revenue_generated: number;
  created_at: string;
  updated_at: string;
}

export interface PublicTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface EditorialPlaylistMetadata {
  playlist_id: string;
  category: string;
  mood?: string;
  curator_name: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteRuntimeConfig {
  seo: RuntimeSeoSettings;
  theme: RuntimeThemeSettings;
  promotions: PublicPromotion[];
  tags: PublicTag[];
  editorialPlaylistMeta: Record<string, EditorialPlaylistMetadata>;
}

export const EDITORIAL_PLAYLISTS_CONFIG_KEY = 'admin_editorial_playlists';

const SITE_CONFIG_KEYS = [
  'site_title',
  'site_description',
  'site_keywords',
  'site_url',
  'og_title',
  'og_description',
  'og_image',
  'twitter_card',
  'twitter_site',
  'robots_index',
  'robots_follow',
  'google_search_console_id',
  'admin_theme_settings',
  'admin_promotions',
  'admin_tags',
  EDITORIAL_PLAYLISTS_CONFIG_KEY,
] as const;

const CACHE_TTL_MS = 5 * 60 * 1000;
const RUNTIME_CONFIG_STORAGE_KEY = 'canticosccb:runtime-config:v1';

const defaultSeoSettings: RuntimeSeoSettings = {
  site_title: 'Cânticos CCB',
  site_description: 'Plataforma independente de hinos, cifras, compositores e playlists relacionados à CCB',
  site_keywords: 'hinos CCB, hinário 5, congregação cristã no brasil',
  site_url: DEFAULT_SITE_URL,
  og_title: '',
  og_description: '',
  og_image: `${DEFAULT_SITE_URL}/logo-canticos-ccb.png`,
  twitter_card: 'summary_large_image',
  twitter_site: '@canticosccb',
  robots_index: true,
  robots_follow: true,
  google_search_console_id: '',
};

export const defaultRuntimeTheme: RuntimeThemeSettings = {
  colors: {
    primary: '#1db954',
    secondary: '#16a34a',
    accent: '#4ade80',
    background: '#121212',
    text: '#ffffff',
    border: '#374151',
  },
  fontFamily: 'Inter',
  fontSize: '16px',
  borderRadius: '8px',
  mode: 'dark',
  applyPublicTheme: false,
};

let runtimeConfigCache: { value: SiteRuntimeConfig; timestamp: number } | null = null;
let inflightRuntimeConfig: Promise<SiteRuntimeConfig> | null = null;

function readPersistedRuntimeConfig(): { value: SiteRuntimeConfig; timestamp: number } | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(RUNTIME_CONFIG_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { value?: SiteRuntimeConfig; timestamp?: number };
    if (!parsed?.value || typeof parsed.timestamp !== 'number') return null;
    if (Date.now() - parsed.timestamp >= CACHE_TTL_MS) {
      window.sessionStorage.removeItem(RUNTIME_CONFIG_STORAGE_KEY);
      return null;
    }

    return { value: parsed.value, timestamp: parsed.timestamp };
  } catch {
    return null;
  }
}

function persistRuntimeConfig(cache: { value: SiteRuntimeConfig; timestamp: number }) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(RUNTIME_CONFIG_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // O cache em memória continua disponível quando o sessionStorage está bloqueado.
  }
}

const parseBoolean = (value: unknown, fallback = false) => {
  if (value == null) return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const toNonEmptyString = (value: unknown, fallback = '') => {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
};

const parsePromotions = (value?: string): PublicPromotion[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((row: any) => ({
      id: String(row?.id || `promotion_${Date.now()}`),
      title: toNonEmptyString(row?.title),
      description: toNonEmptyString(row?.description) || undefined,
      promotion_type: row?.promotion_type || 'discount',
      discount_type: row?.discount_type || 'percentage',
      discount_value: Number(row?.discount_value || 0),
      promo_code: toNonEmptyString(row?.promo_code).toUpperCase(),
      max_uses: row?.max_uses != null ? Number(row.max_uses) : undefined,
      uses_count: Number(row?.uses_count || 0),
      start_date: toNonEmptyString(row?.start_date),
      end_date: toNonEmptyString(row?.end_date),
      is_active: row?.is_active !== false,
      clicks_count: Number(row?.clicks_count || 0),
      conversions_count: Number(row?.conversions_count || 0),
      revenue_generated: Number(row?.revenue_generated || 0),
      created_at: row?.created_at || new Date().toISOString(),
      updated_at: row?.updated_at || row?.created_at || new Date().toISOString(),
    })).filter((promotion) => promotion.title && promotion.promo_code);
  } catch {
    return [];
  }
};

const parseTags = (value?: string): PublicTag[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((row: any) => ({
      id: String(row?.id || `tag_${Date.now()}`),
      name: toNonEmptyString(row?.name),
      slug: toNonEmptyString(row?.slug),
      created_at: row?.created_at || new Date().toISOString(),
      updated_at: row?.updated_at || row?.created_at || new Date().toISOString(),
    })).filter((tag) => tag.name && tag.slug);
  } catch {
    return [];
  }
};

export const parseEditorialPlaylistMetadataMap = (
  value?: string
): Record<string, EditorialPlaylistMetadata> => {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    const rows = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed
        ? Object.values(parsed)
        : [];

    return rows.reduce<Record<string, EditorialPlaylistMetadata>>((acc, row: any) => {
      const playlistId = toNonEmptyString(row?.playlist_id || row?.playlistId || row?.id);
      if (!playlistId) return acc;

      acc[playlistId] = {
        playlist_id: playlistId,
        category: toNonEmptyString(row?.category, 'special'),
        mood: toNonEmptyString(row?.mood) || undefined,
        curator_name: toNonEmptyString(row?.curator_name || row?.curatorName, 'Equipe Editorial CCB'),
        is_featured: row?.is_featured === true,
        is_active: row?.is_active !== false,
        created_at: row?.created_at || new Date().toISOString(),
        updated_at: row?.updated_at || row?.created_at || new Date().toISOString(),
      };
      return acc;
    }, {});
  } catch {
    return {};
  }
};

const parseThemeSettings = (value?: string): RuntimeThemeSettings => {
  if (!value) return defaultRuntimeTheme;

  try {
    const parsed = JSON.parse(value);
    return {
      ...defaultRuntimeTheme,
      ...parsed,
      applyPublicTheme: parseBoolean(parsed?.applyPublicTheme, defaultRuntimeTheme.applyPublicTheme),
      colors: {
        ...defaultRuntimeTheme.colors,
        ...(parsed?.colors || {}),
      },
    };
  } catch {
    return defaultRuntimeTheme;
  }
};

async function fetchSiteConfigMap(
  keys: readonly string[]
): Promise<Record<string, string>> {
  const { data, error } = await publicSupabase
    .from('site_config')
    .select('config_key, config_value')
    .in('config_key', [...keys]);

  if (error) {
    throw error;
  }

  return (data || []).reduce<Record<string, string>>((acc, row: any) => {
    if (row?.config_key) {
      acc[row.config_key] = row.config_value ?? '';
    }
    return acc;
  }, {});
}

export function invalidateSiteRuntimeConfigCache() {
  runtimeConfigCache = null;
  inflightRuntimeConfig = null;

  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(RUNTIME_CONFIG_STORAGE_KEY);
    } catch {
      // Ignora falhas de storage; a invalidação em memória já foi aplicada.
    }
  }
}

export async function getSiteRuntimeConfig(force = false): Promise<SiteRuntimeConfig> {
  const now = Date.now();

  if (!force && !runtimeConfigCache) {
    runtimeConfigCache = readPersistedRuntimeConfig();
  }

  if (!force && runtimeConfigCache && now - runtimeConfigCache.timestamp < CACHE_TTL_MS) {
    return runtimeConfigCache.value;
  }

  if (!force && inflightRuntimeConfig) {
    return inflightRuntimeConfig;
  }

  inflightRuntimeConfig = (async () => {
    try {
      const config = await fetchSiteConfigMap(SITE_CONFIG_KEYS);
      const value: SiteRuntimeConfig = {
        seo: {
          site_title: toNonEmptyString(config.site_title, defaultSeoSettings.site_title),
          site_description: toNonEmptyString(config.site_description, defaultSeoSettings.site_description),
          site_keywords: toNonEmptyString(config.site_keywords, defaultSeoSettings.site_keywords),
          site_url: normalizeSiteUrl(
            toNonEmptyString(config.site_url, defaultSeoSettings.site_url),
            defaultSeoSettings.site_url
          ),
          og_title: toNonEmptyString(config.og_title, defaultSeoSettings.og_title),
          og_description: toNonEmptyString(config.og_description, defaultSeoSettings.og_description),
          og_image: normalizeAssetUrl(
            toNonEmptyString(config.og_image, defaultSeoSettings.og_image)
          ),
          twitter_card: (toNonEmptyString(config.twitter_card, defaultSeoSettings.twitter_card) as RuntimeSeoSettings['twitter_card']),
          twitter_site: toNonEmptyString(config.twitter_site, defaultSeoSettings.twitter_site),
          robots_index: parseBoolean(config.robots_index, defaultSeoSettings.robots_index),
          robots_follow: parseBoolean(config.robots_follow, defaultSeoSettings.robots_follow),
          google_search_console_id: toNonEmptyString(
            config.google_search_console_id,
            defaultSeoSettings.google_search_console_id
          ),
        },
        theme: parseThemeSettings(config.admin_theme_settings),
        promotions: parsePromotions(config.admin_promotions),
        tags: parseTags(config.admin_tags),
        editorialPlaylistMeta: parseEditorialPlaylistMetadataMap(
          config[EDITORIAL_PLAYLISTS_CONFIG_KEY]
        ),
      };

      runtimeConfigCache = { value, timestamp: Date.now() };
      persistRuntimeConfig(runtimeConfigCache);
      return value;
    } catch {
      const fallback: SiteRuntimeConfig = {
        seo: defaultSeoSettings,
        theme: defaultRuntimeTheme,
        promotions: [],
        tags: [],
        editorialPlaylistMeta: {},
      };
      runtimeConfigCache = { value: fallback, timestamp: Date.now() };
      persistRuntimeConfig(runtimeConfigCache);
      return fallback;
    } finally {
      inflightRuntimeConfig = null;
    }
  })();

  return inflightRuntimeConfig;
}

export async function getActivePublicPromotions(): Promise<PublicPromotion[]> {
  const { promotions } = await getSiteRuntimeConfig();
  const now = Date.now();

  return promotions.filter((promotion) => {
    if (!promotion.is_active) return false;
    const startsAt = promotion.start_date ? new Date(promotion.start_date).getTime() : 0;
    const endsAt = promotion.end_date ? new Date(promotion.end_date).getTime() : Number.POSITIVE_INFINITY;
    return now >= startsAt && now <= endsAt;
  });
}

export async function getPublicTags(): Promise<PublicTag[]> {
  const { tags } = await getSiteRuntimeConfig();
  return tags;
}

export async function getEditorialPlaylistMetadataMap(): Promise<Record<string, EditorialPlaylistMetadata>> {
  const { editorialPlaylistMeta } = await getSiteRuntimeConfig();
  return editorialPlaylistMeta;
}
