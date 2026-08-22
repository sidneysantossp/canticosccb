export interface BannerOverlayValue {
  gradient: string;
  opacity: number;
}

const DEFAULT_OPACITY = 100;

export function parseBannerOverlay(value?: string | null): BannerOverlayValue {
  const raw = String(value || '').trim();
  const match = raw.match(/^opacity=(\d{1,3});([\s\S]*)$/i);
  if (!match) return { gradient: raw, opacity: DEFAULT_OPACITY };

  const opacity = Math.min(100, Math.max(0, Number(match[1])));
  return { gradient: match[2].trim(), opacity: Number.isFinite(opacity) ? opacity : DEFAULT_OPACITY };
}

export function serializeBannerOverlay(gradient: string, opacity: number): string {
  const normalizedGradient = String(gradient || '').trim();
  const normalizedOpacity = Math.min(100, Math.max(0, Number(opacity) || 0));
  if (!normalizedGradient) return '';
  if (normalizedOpacity >= DEFAULT_OPACITY) return normalizedGradient;
  return `opacity=${normalizedOpacity};${normalizedGradient}`;
}

export function getBannerOverlayStyle(value?: string | null): { gradient: string; opacity: number } {
  return parseBannerOverlay(value);
}
