import { getEmergencyArchiveZipSegmentByNumber } from '@/lib/emergencyAudioArchives';
import { buildHinoUrl as buildHinoAudioUrl } from '@/lib/media-helper';
import { DEFAULT_SITE_URL } from '@/utils/siteUrl';
import { normalizeYoutubeSource } from '@/lib/youtubeSource';

type TrackLike = {
  id?: string | number | null;
  title?: string;
  artist?: string | null;
  audioUrl?: string | null;
  youtubeSource?: string | null;
  number?: number | string | null;
};

const LEGACY_STORAGE_PREFIX = 'https://rdogsfrplohxnemvtetn.supabase.co/storage/v1/object/public/';

function normalizeMaybeUrl(value?: string | null): string {
  return String(value || '').trim();
}

function normalizeMaybeNumber(value?: number | string | null): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPlaybackApiOrigin(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_SITE_URL;
  }

  const host = String(window.location.hostname || '').toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') {
    return DEFAULT_SITE_URL;
  }

  return window.location.origin || DEFAULT_SITE_URL;
}

function buildPlaybackApiUrl(pathname: string, params: Record<string, string>): string {
  const url = new URL(pathname, getPlaybackApiOrigin());
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    url.searchParams.set(key, value);
  });
  return url.toString();
}

function getNormalizedTrackMediaUrl(track?: TrackLike | null): string {
  const audioUrl = normalizeMaybeUrl(track?.audioUrl);
  if (!audioUrl || ['undefined', 'null', '#'].includes(audioUrl)) {
    return '';
  }

  return normalizeMaybeUrl(
    buildHinoAudioUrl({
      id: String(track?.id ?? track?.number ?? ''),
      audio_url: audioUrl,
    })
  );
}

function isManagedMediaAudioUrl(value?: string | null): boolean {
  const normalized = normalizeMaybeUrl(value);
  if (!normalized) return false;

  try {
    const parsed = new URL(normalized, DEFAULT_SITE_URL);
    return (
      parsed.hostname.toLowerCase() === 'media.canticosccb.com.br'
      && parsed.pathname.startsWith('/hinos/')
    );
  } catch {
    return false;
  }
}

export function isLegacyBlockedAudioUrl(value?: string | null): boolean {
  const normalized = normalizeMaybeUrl(value);
  return normalized.startsWith(LEGACY_STORAGE_PREFIX);
}

export function getEmergencyArchiveRouteForTrack(track?: TrackLike | null): string {
  const number = normalizeMaybeNumber(track?.number);
  if (number <= 0) return '';

  const segment = getEmergencyArchiveZipSegmentByNumber(number);
  if (!segment) return '';

  return buildPlaybackApiUrl('/api/emergency-audio-track', {
    segment: segment.id,
    number: String(number),
    title: String(track?.title || ''),
  });
}

export function getServerAudioFallbackRouteForTrack(track?: TrackLike | null): string {
  const id = String(track?.id ?? '').trim();
  const title = String(track?.title || '').trim();
  const number = normalizeMaybeNumber(track?.number);
  const rawAudioUrl = normalizeMaybeUrl(track?.audioUrl);
  const normalizedMediaUrl = getNormalizedTrackMediaUrl(track);
  const audioUrl = normalizedMediaUrl || rawAudioUrl;

  if (!id && number <= 0 && !audioUrl) {
    return '';
  }

  return buildPlaybackApiUrl('/api/hino-audio-fallback', {
    hinoId: id,
    title,
    number: number > 0 ? String(number) : '',
    audioUrl,
  });
}

export function resolveTrackAudioUrl(track?: TrackLike | null): string {
  const audioUrl = normalizeMaybeUrl(track?.audioUrl);
  const youtubeSource = normalizeYoutubeSource(track?.youtubeSource);
  const emergencyRoute = getEmergencyArchiveRouteForTrack(track);
  const serverFallbackRoute = getServerAudioFallbackRouteForTrack(track);
  const normalizedMediaUrl = getNormalizedTrackMediaUrl(track);

  if (youtubeSource) {
    return '';
  }

  if (!audioUrl || ['undefined', 'null', '#'].includes(audioUrl)) {
    return serverFallbackRoute || emergencyRoute;
  }

  if (
    serverFallbackRoute
    && (
      isLegacyBlockedAudioUrl(audioUrl)
      || isManagedMediaAudioUrl(normalizedMediaUrl || audioUrl)
    )
  ) {
    return serverFallbackRoute;
  }

  return normalizedMediaUrl || serverFallbackRoute || audioUrl;
}

export function hasResolvedTrackSource(track?: TrackLike | null): boolean {
  if (normalizeYoutubeSource(track?.youtubeSource)) {
    return true;
  }

  return Boolean(resolveTrackAudioUrl(track));
}
