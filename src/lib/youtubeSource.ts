export function normalizeYoutubeSource(value?: string | null): string | undefined {
  const normalized = String(value ?? '').trim();

  if (!normalized) return undefined;

  const lowered = normalized.toLowerCase();
  if (
    lowered === 'null'
    || lowered === 'undefined'
    || lowered === 'false'
    || lowered === 'none'
    || normalized === '#'
  ) {
    return undefined;
  }

  return normalized;
}

export function hasYoutubeSourceValue(value?: string | null): boolean {
  return Boolean(normalizeYoutubeSource(value));
}
