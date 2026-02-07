/**
 * Hook para reproduzir áudio de vídeos do YouTube de forma oculta.
 * Usa YouTube IFrame Player API com o player invisível.
 * Cada play conta como visualização no YouTube (monetização).
 * O usuário nunca vê referência ao YouTube.
 */
import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

// Tipo global para YouTube IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

let ytApiLoaded = false;
let ytApiLoading = false;
const ytApiCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiLoaded && window.YT?.Player) {
      resolve();
      return;
    }

    ytApiCallbacks.push(resolve);

    if (ytApiLoading) return;
    ytApiLoading = true;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(tag, firstScript);

    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      ytApiLoading = false;
      ytApiCallbacks.forEach(cb => cb());
      ytApiCallbacks.length = 0;
    };
  });
}

export const useYoutubePlayer = () => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentVideoIdRef = useRef<string | null>(null);
  const isActiveRef = useRef(false);

  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    setCurrentTime,
    setDuration,
  } = usePlayerStore();

  // Detectar se a faixa atual usa YouTube
  const youtubeSource = (currentTrack as any)?.youtubeSource || null;

  // Criar container oculto para o player
  useEffect(() => {
    if (!containerRef.current) {
      const div = document.createElement('div');
      div.id = 'yt-hidden-player-container';
      div.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;';
      document.body.appendChild(div);

      const inner = document.createElement('div');
      inner.id = 'yt-hidden-player';
      div.appendChild(inner);

      containerRef.current = div;
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.remove();
        containerRef.current = null;
      }
    };
  }, []);

  // Limpar intervalo de tracking
  const clearTrackingInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Iniciar tracking de tempo
  const startTrackingInterval = useCallback(() => {
    clearTrackingInterval();
    intervalRef.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        if (typeof time === 'number' && !isNaN(time)) {
          setCurrentTime(time);
        }
      }
    }, 250);
  }, [clearTrackingInterval, setCurrentTime]);

  // Carregar e reproduzir vídeo YouTube
  useEffect(() => {
    if (!youtubeSource) {
      // Se não é YouTube, destruir player e limpar
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
      clearTrackingInterval();
      currentVideoIdRef.current = null;
      isActiveRef.current = false;
      return;
    }

    // Se é o mesmo vídeo, não recriar
    if (currentVideoIdRef.current === youtubeSource && playerRef.current) {
      isActiveRef.current = true;
      return;
    }

    isActiveRef.current = true;
    currentVideoIdRef.current = youtubeSource;

    const initPlayer = async () => {
      await loadYouTubeAPI();

      // Destruir player anterior se existir
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }

      // Recriar div interna
      const container = containerRef.current;
      if (container) {
        const existing = container.querySelector('#yt-hidden-player');
        if (existing) existing.remove();
        const inner = document.createElement('div');
        inner.id = 'yt-hidden-player';
        container.appendChild(inner);
      }

      playerRef.current = new window.YT.Player('yt-hidden-player', {
        height: '1',
        width: '1',
        videoId: youtubeSource,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            const player = event.target;
            // Obter duração
            const dur = player.getDuration();
            if (dur && !isNaN(dur)) {
              setDuration(dur);
            }
            // Definir volume
            player.setVolume(volume * 100);
            // Iniciar reprodução
            if (usePlayerStore.getState().isPlaying) {
              player.playVideo();
            }
            // Iniciar tracking
            startTrackingInterval();
          },
          onStateChange: (event: any) => {
            const state = event.data;
            // YT.PlayerState: ENDED=0, PLAYING=1, PAUSED=2, BUFFERING=3, CUED=5
            if (state === 0) {
              // Vídeo terminou
              clearTrackingInterval();
              usePlayerStore.getState().playNext();
            } else if (state === 1) {
              // Reproduzindo - atualizar duração se necessário
              const dur = event.target.getDuration();
              if (dur && !isNaN(dur) && dur > 0) {
                setDuration(dur);
              }
              startTrackingInterval();
            }
          },
          onError: (event: any) => {
            console.warn('YouTube player error:', event.data);
            clearTrackingInterval();
          },
        },
      });
    };

    initPlayer();

    return () => {
      clearTrackingInterval();
    };
  }, [youtubeSource, clearTrackingInterval, startTrackingInterval, setDuration, volume]);

  // Controlar play/pause
  useEffect(() => {
    if (!isActiveRef.current || !playerRef.current?.getPlayerState) return;

    try {
      if (isPlaying) {
        playerRef.current.playVideo();
        startTrackingInterval();
      } else {
        playerRef.current.pauseVideo();
        clearTrackingInterval();
      }
    } catch {}
  }, [isPlaying, startTrackingInterval, clearTrackingInterval]);

  // Controlar volume
  useEffect(() => {
    if (!isActiveRef.current || !playerRef.current?.setVolume) return;
    try {
      playerRef.current.setVolume(volume * 100);
    } catch {}
  }, [volume]);

  // Controlar seek (posição)
  useEffect(() => {
    if (!isActiveRef.current || !playerRef.current?.seekTo) return;
    try {
      const ytTime = playerRef.current.getCurrentTime();
      if (typeof ytTime === 'number' && Math.abs(ytTime - currentTime) > 2) {
        playerRef.current.seekTo(currentTime, true);
      }
    } catch {}
  }, [currentTime]);

  return {
    isYoutubeActive: isActiveRef.current && !!youtubeSource,
    youtubeSource,
  };
};
