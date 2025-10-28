import { useState, useEffect, useCallback, useRef } from 'react';
import { useOfflineDownloads } from './useOfflineDownloads';
import { usePWA } from './usePWA';

export interface OfflineTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
  duration?: string;
  isOffline: boolean;
  category?: string;
  number?: number;
}

export interface PlayerState {
  currentTrack: OfflineTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  playbackRate: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
}

export const useOfflinePlayer = () => {
  const { downloads, getDownloadedHymn } = useOfflineDownloads();
  const { isOnline } = usePWA();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isLoading: false,
    error: null,
    playbackRate: 1,
    isShuffled: false,
    repeatMode: 'none'
  });

  const [playlist, setPlaylist] = useState<OfflineTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playHistory, setPlayHistory] = useState<string[]>([]);

  // Inicializar player de áudio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      const audio = audioRef.current;
      
      // Event listeners
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('volumechange', handleVolumeChange);
      audio.addEventListener('error', handleError);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // Configurações iniciais
      audio.volume = state.volume;
      audio.playbackRate = state.playbackRate;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Event handlers
  const handleLoadStart = () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
  };

  const handleCanPlay = () => {
    setState(prev => ({ ...prev, isLoading: false }));
  };

  const handlePlay = () => {
    setState(prev => ({ ...prev, isPlaying: true }));
  };

  const handlePause = () => {
    setState(prev => ({ ...prev, isPlaying: false }));
  };

  const handleEnded = () => {
    setState(prev => ({ ...prev, isPlaying: false }));
    handleNext();
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setState(prev => ({ ...prev, currentTime: audioRef.current!.currentTime }));
    }
  };

  const handleDurationChange = () => {
    if (audioRef.current) {
      setState(prev => ({ ...prev, duration: audioRef.current!.duration || 0 }));
    }
  };

  const handleVolumeChange = () => {
    if (audioRef.current) {
      setState(prev => ({ 
        ...prev, 
        volume: audioRef.current!.volume,
        isMuted: audioRef.current!.muted
      }));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setState(prev => ({ ...prev, duration: audioRef.current!.duration || 0 }));
    }
  };

  const handleError = (e: Event) => {
    const audio = e.target as HTMLAudioElement;
    let errorMessage = 'Erro desconhecido';
    
    if (audio.error) {
      switch (audio.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Reprodução abortada';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Erro de rede';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Erro de decodificação';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Formato não suportado';
          break;
      }
    }
    
    setState(prev => ({ 
      ...prev, 
      isLoading: false, 
      isPlaying: false,
      error: errorMessage 
    }));
  };

  // Carregar e reproduzir track
  const loadTrack = useCallback(async (track: OfflineTrack) => {
    if (!audioRef.current) return false;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Verificar se é offline e se está disponível
      if (!isOnline && !track.isOffline) {
        const downloadedHymn = getDownloadedHymn(track.id);
        if (!downloadedHymn) {
          throw new Error('Hino não disponível offline');
        }
        track = {
          ...track,
          audioUrl: downloadedHymn.localAudioUrl || downloadedHymn.audio_url,
          isOffline: true
        };
      }

      // Pausar áudio atual
      audioRef.current.pause();
      
      // Definir nova fonte
      audioRef.current.src = track.audioUrl;
      audioRef.current.load();

      // Atualizar estado
      setState(prev => ({ 
        ...prev, 
        currentTrack: track,
        error: null
      }));

      // Adicionar ao histórico
      setPlayHistory(prev => {
        const newHistory = [track.id, ...prev.filter(id => id !== track.id)];
        return newHistory.slice(0, 50); // Manter apenas os últimos 50
      });

      return true;

    } catch (error) {
      console.error('Error loading track:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar hino'
      }));
      return false;
    }
  }, [isOnline, getDownloadedHymn]);

  // Reproduzir
  const play = useCallback(async (track?: OfflineTrack) => {
    if (!audioRef.current) return;

    try {
      if (track && track.id !== state.currentTrack?.id) {
        const loaded = await loadTrack(track);
        if (!loaded) return;
      }

      if (audioRef.current.src) {
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao reproduzir hino',
        isPlaying: false
      }));
    }
  }, [state.currentTrack, loadTrack]);

  // Pausar
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  // Alternar play/pause
  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else if (state.currentTrack) {
      play();
    }
  }, [state.isPlaying, state.currentTrack, play, pause]);

  // Buscar posição
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, state.duration));
    }
  }, [state.duration]);

  // Controlar volume
  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  // Alternar mudo
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
    }
  }, []);

  // Controlar velocidade
  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setState(prev => ({ ...prev, playbackRate: rate }));
    }
  }, []);

  // Próximo
  const handleNext = useCallback(() => {
    if (playlist.length === 0) return;

    let nextIndex: number;

    if (state.repeatMode === 'one') {
      // Repetir atual
      nextIndex = currentIndex;
    } else if (state.isShuffled) {
      // Modo aleatório
      const availableIndices = playlist
        .map((_, index) => index)
        .filter(index => index !== currentIndex);
      
      if (availableIndices.length === 0) {
        nextIndex = 0;
      } else {
        nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      }
    } else {
      // Sequencial
      nextIndex = currentIndex + 1;
      
      if (nextIndex >= playlist.length) {
        if (state.repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return; // Fim da playlist
        }
      }
    }

    setCurrentIndex(nextIndex);
    play(playlist[nextIndex]);
  }, [playlist, currentIndex, state.repeatMode, state.isShuffled, play]);

  // Anterior
  const handlePrevious = useCallback(() => {
    if (playlist.length === 0) return;

    // Se está tocando há mais de 3 segundos, reiniciar música atual
    if (state.currentTime > 3) {
      seek(0);
      return;
    }

    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      if (state.repeatMode === 'all') {
        prevIndex = playlist.length - 1;
      } else {
        prevIndex = 0;
      }
    }

    setCurrentIndex(prevIndex);
    play(playlist[prevIndex]);
  }, [playlist, currentIndex, state.currentTime, state.repeatMode, seek, play]);

  // Alternar shuffle
  const toggleShuffle = useCallback(() => {
    setState(prev => ({ ...prev, isShuffled: !prev.isShuffled }));
  }, []);

  // Alternar repeat
  const toggleRepeat = useCallback(() => {
    setState(prev => {
      const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
      const currentModeIndex = modes.indexOf(prev.repeatMode);
      const nextMode = modes[(currentModeIndex + 1) % modes.length];
      return { ...prev, repeatMode: nextMode };
    });
  }, []);

  // Definir playlist
  const setPlaylistTracks = useCallback((tracks: OfflineTrack[], startIndex = 0) => {
    setPlaylist(tracks);
    setCurrentIndex(startIndex);
    
    if (tracks.length > 0 && startIndex < tracks.length) {
      play(tracks[startIndex]);
    }
  }, [play]);

  // Adicionar à playlist
  const addToPlaylist = useCallback((track: OfflineTrack) => {
    setPlaylist(prev => [...prev, track]);
  }, []);

  // Remover da playlist
  const removeFromPlaylist = useCallback((trackId: string) => {
    setPlaylist(prev => {
      const newPlaylist = prev.filter(track => track.id !== trackId);
      const removedIndex = prev.findIndex(track => track.id === trackId);
      
      if (removedIndex === currentIndex) {
        // Se removeu a música atual, tocar a próxima
        if (newPlaylist.length > 0) {
          const nextIndex = Math.min(currentIndex, newPlaylist.length - 1);
          setCurrentIndex(nextIndex);
          play(newPlaylist[nextIndex]);
        } else {
          pause();
          setState(prev => ({ ...prev, currentTrack: null }));
        }
      } else if (removedIndex < currentIndex) {
        // Ajustar índice se removeu uma música anterior
        setCurrentIndex(prev => prev - 1);
      }
      
      return newPlaylist;
    });
  }, [currentIndex, play, pause]);

  // Limpar playlist
  const clearPlaylist = useCallback(() => {
    pause();
    setPlaylist([]);
    setCurrentIndex(-1);
    setState(prev => ({ ...prev, currentTrack: null }));
  }, [pause]);

  return {
    // Estado
    ...state,
    playlist,
    currentIndex,
    playHistory,
    
    // Controles básicos
    play,
    pause,
    togglePlay,
    seek,
    
    // Controles de áudio
    setVolume,
    toggleMute,
    setPlaybackRate,
    
    // Navegação
    next: handleNext,
    previous: handlePrevious,
    
    // Modos de reprodução
    toggleShuffle,
    toggleRepeat,
    
    // Gerenciamento de playlist
    setPlaylistTracks,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    
    // Utilitários
    loadTrack
  };
};
