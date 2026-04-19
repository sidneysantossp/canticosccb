/**
 * Hook para reproduzir áudio de vídeos do YouTube de forma oculta.
 * Usa YouTube IFrame Player API com o player invisível.
 * Cada play conta como visualização no YouTube (monetização).
 * O usuário nunca vê referência ao YouTube.
 */
import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { normalizeYoutubeSource } from '@/lib/youtubeSource';

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

// ID único para o container do player
const YT_CONTAINER_ID = 'yt-hidden-player-wrap';
const YT_PLAYER_ID = 'yt-hidden-player';

export const useYoutubePlayer = () => {
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentVideoIdRef = useRef<string | null>(null);
  const seekLockRef = useRef(false);

  // Seletores Zustand individuais para minimizar re-renders
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);

  const youtubeSource = normalizeYoutubeSource((currentTrack as any)?.youtubeSource) || null;

  // Garantir container no DOM (uma vez, fora do ciclo de vida do React)
  const ensureContainer = useCallback(() => {
    let wrap = document.getElementById(YT_CONTAINER_ID);
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = YT_CONTAINER_ID;
      // Pequeno, fora da tela, mas tecnicamente no DOM
      wrap.style.cssText =
        'position:fixed;bottom:0;right:0;width:2px;height:2px;overflow:hidden;opacity:0.01;pointer-events:none;z-index:-1;';
      document.body.appendChild(wrap);
    }
    // Garantir div interna do player
    let inner = document.getElementById(YT_PLAYER_ID);
    if (!inner) {
      inner = document.createElement('div');
      inner.id = YT_PLAYER_ID;
      wrap.appendChild(inner);
    }
    return wrap;
  }, []);

  // Recriar a div interna do player (necessário ao trocar vídeo)
  const recreatePlayerDiv = useCallback(() => {
    const wrap = document.getElementById(YT_CONTAINER_ID);
    if (!wrap) return;
    const old = document.getElementById(YT_PLAYER_ID);
    if (old) old.remove();
    const inner = document.createElement('div');
    inner.id = YT_PLAYER_ID;
    wrap.appendChild(inner);
  }, []);

  const clearTrackingInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTrackingInterval = useCallback(() => {
    clearTrackingInterval();
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      try {
        const time = p.getCurrentTime();
        if (typeof time === 'number' && !isNaN(time)) {
          seekLockRef.current = true;
          usePlayerStore.getState().setCurrentTime(time);
          // Liberar lock após 100ms para não bloquear seek manual
          setTimeout(() => { seekLockRef.current = false; }, 100);
        }
      } catch {}
    }, 500);
  }, [clearTrackingInterval]);

  // ===== Efeito principal: carregar/destruir player YouTube =====
  useEffect(() => {
    if (!youtubeSource) {
      // Não é YouTube: limpar tudo
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
      clearTrackingInterval();
      currentVideoIdRef.current = null;
      return;
    }

    // Mesmo vídeo já carregado: não recriar
    if (currentVideoIdRef.current === youtubeSource && playerRef.current) {
      return;
    }
    currentVideoIdRef.current = youtubeSource;

    const initPlayer = async () => {
      try {
        await loadYouTubeAPI();
      } catch (err) {
        console.error('[YT-Player] Erro ao carregar YouTube API:', err);
        return;
      }

      // Destruir player anterior
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }

      ensureContainer();
      recreatePlayerDiv();

      const vol = usePlayerStore.getState().volume;
      try {
        playerRef.current = new window.YT.Player(YT_PLAYER_ID, {
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
              const p = event.target;

              const dur = p.getDuration();
              if (dur && !isNaN(dur) && dur > 0) {
                usePlayerStore.getState().setDuration(dur);
              }

              p.setVolume(vol * 100);

              if (usePlayerStore.getState().isPlaying) {
                p.playVideo();
              }

              startTrackingInterval();
            },
            onStateChange: (event: any) => {
              const state = event.data;
              const stateNames: Record<number, string> = {
                [-1]: 'UNSTARTED', 0: 'ENDED', 1: 'PLAYING',
                2: 'PAUSED', 3: 'BUFFERING', 5: 'CUED'
              };
              void stateNames;

              if (state === 0) {
                clearTrackingInterval();
                usePlayerStore.getState().playNext();
              } else if (state === 1) {
                const dur = event.target.getDuration();
                if (dur && !isNaN(dur) && dur > 0) {
                  usePlayerStore.getState().setDuration(dur);
                }
                startTrackingInterval();
              }
            },
            onError: (event: any) => {
              const errorCodes: Record<number, string> = {
                2: 'ID inválido', 5: 'Conteúdo HTML5 erro',
                100: 'Vídeo não encontrado', 101: 'Reprodução bloqueada',
                150: 'Reprodução bloqueada (101)',
              };
              console.error('[YT-Player] ERRO:', errorCodes[event.data] || event.data);
              clearTrackingInterval();
            },
          },
        });
      } catch (err) {
        console.error('[YT-Player] Erro ao criar player:', err);
      }
    };

    initPlayer();

    return () => {
      clearTrackingInterval();
    };
    // NÃO incluir volume aqui - volume é controlado por efeito separado
  }, [youtubeSource, clearTrackingInterval, startTrackingInterval, ensureContainer, recreatePlayerDiv]);

  // ===== Play/Pause =====
  useEffect(() => {
    if (!currentVideoIdRef.current || !playerRef.current) return;
    // Verificar se player está pronto
    if (typeof playerRef.current.getPlayerState !== 'function') return;

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

  // ===== Volume =====
  useEffect(() => {
    if (!currentVideoIdRef.current || !playerRef.current?.setVolume) return;
    try {
      playerRef.current.setVolume(volume * 100);
    } catch {}
  }, [volume]);

  // ===== Seek manual (via barra de progresso) =====
  useEffect(() => {
    let prevTime = usePlayerStore.getState().currentTime;
    const unsub = usePlayerStore.subscribe((state) => {
      const newTime = state.currentTime;
      if (newTime === prevTime) return;
      prevTime = newTime;
      // Se o lock está ativo, foi atualização do tracking interval, ignorar
      if (seekLockRef.current) return;
      if (!currentVideoIdRef.current || !playerRef.current?.seekTo) return;
      try {
        const ytTime = playerRef.current.getCurrentTime();
        if (typeof ytTime === 'number' && Math.abs(ytTime - newTime) > 2) {
          playerRef.current.seekTo(newTime, true);
        }
      } catch {}
    });
    return unsub;
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      clearTrackingInterval();
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
      const wrap = document.getElementById(YT_CONTAINER_ID);
      if (wrap) wrap.remove();
    };
  }, [clearTrackingInterval]);

  return { youtubeSource };
};
