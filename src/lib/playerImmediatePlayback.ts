import type { Hino } from '@/types';
import { resolveTrackAudioUrl } from '@/lib/playableAudio';
import { normalizeYoutubeSource } from '@/lib/youtubeSource';

export const IMMEDIATE_PLAYER_REQUEST_EVENT = 'canticos:immediate-player-request';

export type ImmediatePlaybackDetail = {
  trackId: string;
  audioUrl: string;
};

let sharedPlayerAudioElement: HTMLAudioElement | null = null;

export function getSharedPlayerAudioElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  if (sharedPlayerAudioElement && document.body.contains(sharedPlayerAudioElement)) {
    return sharedPlayerAudioElement;
  }

  const audio = document.createElement('audio');
  audio.preload = 'auto';
  audio.autoplay = false;
  audio.defaultMuted = false;
  audio.muted = false;
  audio.volume = 1;
  audio.style.display = 'none';
  audio.dataset.canticosSharedPlayer = 'true';
  (audio as any).playsInline = true;
  document.body.appendChild(audio);
  sharedPlayerAudioElement = audio;
  return sharedPlayerAudioElement;
}

export function requestImmediateTrackPlayback(track: Hino | null | undefined): void {
  if (typeof window === 'undefined' || !track) return;
  if (normalizeYoutubeSource(track.youtubeSource)) return;

  const audioUrl = resolveTrackAudioUrl(track);
  if (!audioUrl) return;

  const sharedAudio = getSharedPlayerAudioElement();
  if (sharedAudio) {
    try {
      const currentSrc = sharedAudio.currentSrc || sharedAudio.src || '';
      if (currentSrc !== audioUrl) {
        sharedAudio.pause();
        sharedAudio.currentTime = 0;
        sharedAudio.src = audioUrl;
        sharedAudio.load();
      }

      sharedAudio.muted = false;
      sharedAudio.volume = Math.max(0.1, sharedAudio.volume || 1);

      const playPromise = sharedAudio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((error) => {
          console.warn('⚠️ Reprodução imediata compartilhada falhou:', error);
        });
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível preparar o áudio compartilhado:', error);
    }
  }

  window.dispatchEvent(new CustomEvent<ImmediatePlaybackDetail>(IMMEDIATE_PLAYER_REQUEST_EVENT, {
    detail: {
      trackId: String(track.id || ''),
      audioUrl,
    },
  }));
}
