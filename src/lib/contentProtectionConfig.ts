export type ContentProtectionDirectory = 'hinario' | 'cifras' | 'biblia';

export interface ContentProtectionSettings {
  hinario: boolean;
  cifras: boolean;
  biblia: boolean;
}

export const CONTENT_PROTECTION_CONFIG_KEYS: Record<ContentProtectionDirectory, string> = {
  hinario: 'content_copy_protection_hinario',
  cifras: 'content_copy_protection_cifras',
  biblia: 'content_copy_protection_biblia',
};

export const DEFAULT_CONTENT_PROTECTION_SETTINGS: ContentProtectionSettings = {
  hinario: true,
  cifras: true,
  biblia: true,
};
