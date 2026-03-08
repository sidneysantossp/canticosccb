import { supabase } from '@/lib/supabase-auth';

export const parseBooleanConfig = (value: unknown, fallback = false): boolean => {
  if (value == null) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

export const parseNumberConfig = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const coerceString = (value: unknown, fallback = ''): string => {
  if (value == null) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
};

export const slugifyAdminText = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export async function getSiteConfigMap(keys: string[]): Promise<Record<string, string>> {
  if (keys.length === 0) return {};

  const { data, error } = await supabase
    .from('site_config')
    .select('config_key, config_value')
    .in('config_key', keys);

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

export async function upsertSiteConfigEntries(
  entries: Record<string, string | number | boolean | null | undefined>
): Promise<void> {
  const payload = Object.entries(entries)
    .filter(([, value]) => value !== undefined)
    .map(([config_key, value]) => ({
      config_key,
      config_value: value == null ? '' : String(value),
    }));

  if (payload.length === 0) return;

  for (const entry of payload) {
    const { data: existing, error: existingError } = await supabase
      .from('site_config')
      .select('id')
      .eq('config_key', entry.config_key)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing?.id) {
      const { error } = await supabase
        .from('site_config')
        .update({ config_value: entry.config_value })
        .eq('id', existing.id);

      if (error) throw error;
      continue;
    }

    const { error } = await supabase
      .from('site_config')
      .insert(entry);

    if (error) throw error;
  }
}

export const downloadTextFile = (
  content: string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8;'
) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
