import type { Hino } from '@/types';
import { hasResolvedTrackSource } from '@/lib/playableAudio';

export const PLAYER_UNAVAILABLE_EVENT = 'canticos:player-unavailable';

type PlaybackLikeTrack = Partial<Pick<Hino, 'title' | 'artist' | 'audioUrl' | 'youtubeSource'>> & {
  title?: string;
  artist?: string;
  audioUrl?: string;
  youtubeSource?: string;
  number?: number | string | null;
};

export function hasPlayableTrackSource(track?: PlaybackLikeTrack | null): boolean {
  return hasResolvedTrackSource(track);
}

export function emitPlayerUnavailable(track?: PlaybackLikeTrack | null): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent(PLAYER_UNAVAILABLE_EVENT, {
    detail: {
      title: track?.title || 'Hino',
      artist: track?.artist || '',
    },
  }));
}
