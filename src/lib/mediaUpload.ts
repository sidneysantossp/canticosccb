export const MEDIA_UPLOAD_FOLDER_BY_TYPE = {
  hinos: 'hinos',
  audio: 'hinos',
  albuns: 'albuns',
  covers: 'covers',
  cover: 'covers',
  avatars: 'avatars',
  banners: 'banners',
  imports: 'imports',
  exports: 'exports',
} as const;

export type MediaUploadType = keyof typeof MEDIA_UPLOAD_FOLDER_BY_TYPE;
export type MediaUploadFolder = (typeof MEDIA_UPLOAD_FOLDER_BY_TYPE)[MediaUploadType];

export function isMediaUploadType(value: string): value is MediaUploadType {
  return value in MEDIA_UPLOAD_FOLDER_BY_TYPE;
}

export function resolveMediaUploadFolder(type: MediaUploadType): MediaUploadFolder {
  return MEDIA_UPLOAD_FOLDER_BY_TYPE[type];
}

export function normalizeMediaUploadType(value: string): MediaUploadType {
  if (!isMediaUploadType(value)) {
    throw new Error(`Tipo de upload inválido: ${value}`);
  }

  return value;
}

export function createMediaUploadFileName(originalName: string): string {
  const extensionSource = String(originalName || '').split('.').pop() || 'bin';
  const extension = extensionSource.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;
}

