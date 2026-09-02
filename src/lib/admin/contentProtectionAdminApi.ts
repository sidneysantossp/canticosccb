import {
  getSiteConfigMap,
  parseBooleanConfig,
  upsertSiteConfigEntries,
} from '@/lib/admin/adminTableUtils';
import {
  CONTENT_PROTECTION_CONFIG_KEYS,
  DEFAULT_CONTENT_PROTECTION_SETTINGS,
  type ContentProtectionSettings,
} from '@/lib/contentProtectionConfig';

export async function getContentProtectionSettings(): Promise<ContentProtectionSettings> {
  const config = await getSiteConfigMap(Object.values(CONTENT_PROTECTION_CONFIG_KEYS));

  return {
    hinario: parseBooleanConfig(
      config[CONTENT_PROTECTION_CONFIG_KEYS.hinario],
      DEFAULT_CONTENT_PROTECTION_SETTINGS.hinario
    ),
    cifras: parseBooleanConfig(
      config[CONTENT_PROTECTION_CONFIG_KEYS.cifras],
      DEFAULT_CONTENT_PROTECTION_SETTINGS.cifras
    ),
    biblia: parseBooleanConfig(
      config[CONTENT_PROTECTION_CONFIG_KEYS.biblia],
      DEFAULT_CONTENT_PROTECTION_SETTINGS.biblia
    ),
  };
}

export async function saveContentProtectionSettings(
  settings: ContentProtectionSettings
): Promise<void> {
  await upsertSiteConfigEntries({
    [CONTENT_PROTECTION_CONFIG_KEYS.hinario]: settings.hinario,
    [CONTENT_PROTECTION_CONFIG_KEYS.cifras]: settings.cifras,
    [CONTENT_PROTECTION_CONFIG_KEYS.biblia]: settings.biblia,
  });
}
