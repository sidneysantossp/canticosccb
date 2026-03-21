import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useAuth } from '@/contexts/AuthContext';
import { getSignedSupabaseUrl } from '@/lib/supabaseMedia';

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const trackIdRef = useRef<number | string | null>(null);
  const listenersAttachedRef = useRef(false);
  const latestPrefsRef = useRef<{ autoplay: boolean; gaplessPlayback: boolean; crossfade: boolean } | null>(null);
  const latestVolumeRef = useRef<number>(1);
  const { user } = useAuth();

  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    setCurrentTime,
    pause,
    resume,
    setOnTrackEnd,
    playNext
  } = usePlayerStore();

  const SETTINGS_STORAGE_KEY = 'user_settings_prefs_v1';
  const [prefs, setPrefs] = useState<{ autoplay: boolean; gaplessPlayback: boolean; crossfade: boolean } | null>(null);

  const attemptPlayback = (audio: HTMLAudioElement) => {
    console.log('▶️ Tentando reproduzir áudio...', {
      src: audio.src,
      readyState: audio.readyState,
      networkState: audio.networkState,
      error: audio.error
    });

    const playAttempt = () => {
      audio.muted = false;
      audio.volume = 1.0;

      try {
        audio.setAttribute('volume', '1.0');
        audio.removeAttribute('muted');
      } catch { }

      console.log('🔊 Antes de play():', {
        volume: audio.volume,
        muted: audio.muted,
        paused: audio.paused,
        ended: audio.ended,
        currentTime: audio.currentTime,
        duration: audio.duration
      });

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('❌ Erro ao reproduzir:', {
            name: error.name,
            message: error.message,
            src: audio.src,
            readyState: audio.readyState,
            networkState: audio.networkState,
            audioError: audio.error
          });

          if (error.name === 'NotAllowedError') {
            console.warn('⚠️ Autoplay bloqueado - aguardando interação do usuário');
            pause();
          } else if (error.name === 'NotSupportedError') {
            console.error('❌ Formato de áudio não suportado ou URL inválida');
            console.error('URL problemática:', audio.src);
            pause();
          } else if (error.name === 'AbortError') {
            console.warn('⚠️ Play interrompido - tentando novamente...');
            setTimeout(() => {
              if (audioRef.current && usePlayerStore.getState().isPlaying) {
                audioRef.current.play().catch(() => { });
              }
            }, 100);
          } else {
            setTimeout(() => {
              if (audioRef.current && usePlayerStore.getState().isPlaying) {
                audioRef.current.play().catch(() => {
                  console.warn('⚠️ Segunda tentativa falhou');
                  pause();
                });
              }
            }, 150);
          }
        });
      }
    };

    if (audio.readyState < 2) {
      const onCanPlay = () => {
        audio.removeEventListener('canplay', onCanPlay);
        if (usePlayerStore.getState().isPlaying) {
          playAttempt();
        }
      };
      audio.addEventListener('canplay', onCanPlay, { once: true });
    } else {
      playAttempt();
    }
  };

  useEffect(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SETTINGS_STORAGE_KEY) : null;
      if (raw) {
        const saved = JSON.parse(raw);
        setPrefs({
          autoplay: !!saved.autoplay,
          gaplessPlayback: !!saved.gaplessPlayback,
          crossfade: !!saved.crossfade,
        });
      } else {
        setPrefs({ autoplay: true, gaplessPlayback: true, crossfade: false });
      }
    } catch {
      setPrefs({ autoplay: true, gaplessPlayback: true, crossfade: false });
    }
  }, []);

  // Manter refs com os últimos valores para uso nos listeners
  useEffect(() => { latestPrefsRef.current = prefs; }, [prefs]);
  useEffect(() => { latestVolumeRef.current = volume; }, [volume]);

  // Criar e configurar elemento de áudio persistente e listeners uma única vez
  useEffect(() => {
    if (!audioRef.current) {
      try {
        audioRef.current = new Audio();
        try { (audioRef.current as any).crossOrigin = 'anonymous'; } catch { }
        try { audioRef.current.setAttribute('crossorigin', 'anonymous'); } catch { }
        audioRef.current.preload = 'auto';
        (audioRef.current as any).playsInline = true;
        audioRef.current.defaultMuted = false;
        audioRef.current.muted = false;
        audioRef.current.volume = 1.0;
        // iOS: adicionar ao DOM para garantir que o áudio funcione
        audioRef.current.style.display = 'none';
        document.body.appendChild(audioRef.current);
      } catch { }
    }
    // Garante volume inicial não-zero
    try {
      audioRef.current.volume = 1.0;
      audioRef.current.muted = false;
    } catch { }

    if (audioRef.current && !listenersAttachedRef.current) {
      const audio = audioRef.current;

      const onLoadedData = () => {
        setIsLoading(false);
      };

      const onLoadedMetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          usePlayerStore.getState().setDuration(audio.duration);
        }
      };

      const onError = (e: Event) => {
        setIsLoading(false);
        const src = audio.currentSrc || audio.src || '';
        if (!src) {
          return;
        }

        console.warn('⚠️ Erro ao carregar áudio:', {
          src,
          code: audio.error?.code,
          message: audio.error?.message,
          event: e.type,
        });
      };

      const onPlaying = () => {
        console.log('🔊 playing:', {
          volume: audio.volume,
          muted: audio.muted,
          readyState: audio.readyState,
          networkState: audio.networkState
        });
      };

      const onTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
        const prefsNow = latestPrefsRef.current;
        const volNow = latestVolumeRef.current;
        if (prefsNow?.autoplay && prefsNow?.gaplessPlayback && audio.duration && !isNaN(audio.duration)) {
          const remaining = audio.duration - audio.currentTime;
          if (remaining <= 0.1) {
            usePlayerStore.getState().playNext();
          }
        }
        if (prefsNow?.autoplay && prefsNow?.crossfade && audio.duration && !isNaN(audio.duration)) {
          const remaining = audio.duration - audio.currentTime;
          const fadeWindow = 3;
          if (remaining <= fadeWindow && remaining > 0) {
            const factor = Math.max(0, Math.min(1, remaining / fadeWindow));
            audio.volume = volNow * factor;
          } else {
            audio.volume = volNow;
          }
        }
      };

      const onEnded = () => {
        // Restaura volume após crossfade
        try { audio.volume = latestVolumeRef.current; } catch { }
        const uid = (user as any)?.id;
        const hid = trackIdRef.current;
        const started = startedAtRef.current;
        if (uid && hid && typeof started === 'number') {
          const durationSec = Math.max(0, Math.floor((Date.now() - started) / 1000));
          if (durationSec >= 1) {
            const hinoId = Number(hid) || parseInt(String(hid), 10) || 0;
            if (hinoId) {
              // O registro de plays agora é tratado centralmente pelo PlayerProvider.
            }
          }
        }
        const prefsNow = latestPrefsRef.current;
        if (prefsNow?.autoplay) {
          usePlayerStore.getState().playNext();
        } else {
          usePlayerStore.getState().pause();
        }
      };

      audio.addEventListener('loadeddata', onLoadedData);
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('error', onError);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('playing', onPlaying);
      audio.addEventListener('ended', onEnded);

      listenersAttachedRef.current = true;

      return () => {
        audio.removeEventListener('loadeddata', onLoadedData);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('playing', onPlaying);
        audio.removeEventListener('ended', onEnded);
        listenersAttachedRef.current = false;
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      };
    }
  }, [setCurrentTime, user]);

  // Carregar e reproduzir quando há uma nova faixa
  useEffect(() => {
    // Se a faixa usa YouTube oculto, não carregar no <Audio> HTML
    const hasYoutubeSource = !!(currentTrack as any)?.youtubeSource;
    if (hasYoutubeSource) {
      // Pausar áudio HTML se estiver tocando (YouTube player cuida)
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setIsLoading(false);
      return;
    }

    console.log('🎵 useAudioPlayer - Track mudou:', {
      hasTrack: !!currentTrack,
      title: currentTrack?.title,
      audioUrl: currentTrack?.audioUrl,
      audioUrlType: typeof currentTrack?.audioUrl
    });

    if (currentTrack?.audioUrl) {
      let audioUrl = currentTrack.audioUrl;

      // Validar URL
      if (!audioUrl || audioUrl.trim() === '' || audioUrl === 'undefined' || audioUrl === 'null') {
        console.error('❌ URL de áudio inválida:', audioUrl);
        setIsLoading(false);
        return;
      }

      const prepareAndLoad = async () => {
        setIsLoading(true);
        const audio = audioRef.current || new Audio();
        audioRef.current = audio;
        startedAtRef.current = Date.now();
        const t: any = currentTrack as any;
        const resolvedId = t?.id || t?.hino_id || t?.hymn?.id || t?.numero || t?.slug_id || null;
        trackIdRef.current = resolvedId;

        try {
          audioUrl = await getSignedSupabaseUrl(audioUrl, 'hinos');

          console.log('🎵 Carregando URL no Audio element:', audioUrl);
          if (audio.src && audio.src !== audioUrl) {
            audio.pause();
          }
          audio.src = audioUrl;
          audio.muted = false;
          audio.volume = Math.max(0.1, volume);
          audio.load();
          console.log('🔊 Volume configurado:', { volume: audio.volume, muted: audio.muted });

          if (usePlayerStore.getState().isPlaying) {
            attemptPlayback(audio);
          }
        } catch (e) {
          setIsLoading(false);
          console.warn('⚠️ Erro ao preparar áudio:', e);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      prepareAndLoad();

    }
  }, [currentTrack?.audioUrl, volume]);

  // Controlar play/pause
  useEffect(() => {
    // Se é YouTube, o useYoutubePlayer controla
    const hasYoutubeSource = !!(currentTrack as any)?.youtubeSource;
    if (hasYoutubeSource) return;

    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      attemptPlayback(audio);
    } else {
      console.log('⏸️ Pausando áudio...');
      audio.pause();
    }
  }, [isPlaying, pause, currentTrack?.audioUrl]);

  // iOS: tentar retomar reprodução ao voltar para a aba (backgrounding pode pausar)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && audioRef.current && isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(() => { });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying]);

  // Controlar volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Controlar posição
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 1) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  return {
    isLoading,
    audioElement: audioRef.current
  };
};
