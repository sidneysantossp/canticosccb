import { getEmergencyArchiveZipSegmentByNumber } from '@/lib/emergencyAudioArchives';

type TrackLike = {
  title?: string;
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

export function isLegacyBlockedAudioUrl(value?: string | null): boolean {
  const normalized = normalizeMaybeUrl(value);
  return normalized.startsWith(LEGACY_STORAGE_PREFIX);
}

export function getEmergencyArchiveRouteForTrack(track?: TrackLike | null): string {
  const number = normalizeMaybeNumber(track?.number);
  if (number <= 0) return '';

  const segment = getEmergencyArchiveZipSegmentByNumber(number);
  if (!segment) return '';

  return (
    `/api/emergency-audio-track?segment=${encodeURIComponent(segment.id)}` +
    `&number=${encodeURIComponent(String(number))}` +
    `&title=${encodeURIComponent(String(track?.title || ''))}`
  );
}

export function resolveTrackAudioUrl(track?: TrackLike | null): string {
  const audioUrl = normalizeMaybeUrl(track?.audioUrl);
  if (!audioUrl || ['undefined', 'null', '#'].includes(audioUrl)) {
    return '';
  }

  if (isLegacyBlockedAudioUrl(audioUrl)) {
    return getEmergencyArchiveRouteForTrack(track);
  }

  return audioUrl;
}

export function hasResolvedTrackSource(track?: TrackLike | null): boolean {
  const youtubeSource = normalizeMaybeUrl(track?.youtubeSource);
  if (youtubeSource && youtubeSource !== 'undefined' && youtubeSource !== 'null') {
    return true;
  }

  return Boolean(resolveTrackAudioUrl(track));
}
