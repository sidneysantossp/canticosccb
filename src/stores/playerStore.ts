import { create } from 'zustand';
import { PlayerState, Hino } from '@/types';

interface PlaybackContext {
  type: 'playlist' | 'album' | 'category' | 'unknown';
  id?: string;
}

interface PlayerStore extends PlayerState {
  playbackContext: PlaybackContext | null;
  play: (track: Hino) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setRepeat: (repeat: 'none' | 'one' | 'all') => void;
  toggleShuffle: () => void;
  addToQueue: (track: Hino) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  stop: () => void;
  playNext: () => void;
  onTrackEnd: (() => void) | null;
  setOnTrackEnd: (callback: (() => void) | null) => void;
  setPlaybackContext: (ctx: PlaybackContext | null) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Initial state
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  queue: [],
  history: [],
  repeat: 'none',
  shuffle: false,
  onTrackEnd: null,
  playbackContext: null,

  // Actions
  play: (track: Hino) => {
    const { history } = get();
    set({
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      duration: 225, // Mock duration - 3:45
      history: [track, ...history.slice(0, 49)] // Keep last 50 tracks
    });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  resume: () => {
    set({ isPlaying: true });
  },

  next: () => {
    const { queue, currentTrack } = get();
    if (queue.length > 0) {
      const nextTrack = queue[0];
      const newQueue = queue.slice(1);
      set({
        currentTrack: nextTrack,
        queue: newQueue,
        currentTime: 0
      });
    }
  },

  previous: () => {
    const { history } = get();
    if (history.length > 1) {
      const previousTrack = history[1];
      set({
        currentTrack: previousTrack,
        currentTime: 0
      });
    }
  },

  setVolume: (volume: number) => {
    set({ volume: Math.max(0, Math.min(1, volume)) });
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: time });
  },

  setRepeat: (repeat: 'none' | 'one' | 'all') => {
    set({ repeat });
  },

  toggleShuffle: () => {
    set(state => ({ shuffle: !state.shuffle }));
  },

  addToQueue: (track: Hino) => {
    set(state => ({
      queue: [...state.queue, track]
    }));
  },

  removeFromQueue: (trackId: string) => {
    set(state => ({
      queue: state.queue.filter(track => track.id !== trackId)
    }));
  },

  clearQueue: () => {
    set({ queue: [] });
  },

  stop: () => {
    set({ 
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackContext: null
    });
  },

  playNext: () => {
    const { queue, repeat, currentTrack, onTrackEnd } = get();
    
    // Se tem callback personalizado (para álbuns), usa ele
    if (onTrackEnd) {
      console.log('PlayerStore: Executando callback personalizado de fim de faixa');
      onTrackEnd();
      return;
    }
    
    if (queue.length > 0) {
      // Se tem fila, toca próxima da fila
      const nextTrack = queue[0];
      set({
        currentTrack: nextTrack,
        queue: queue.slice(1),
        currentTime: 0,
        isPlaying: true
      });
    } else if (repeat === 'one' && currentTrack) {
      // Se repeat one, toca a mesma música
      set({
        currentTime: 0,
        isPlaying: true
      });
    } else if (repeat === 'all' && currentTrack) {
      // Se repeat all e não tem fila, volta ao início da mesma música
      set({
        currentTime: 0,
        isPlaying: true
      });
    } else {
      // Para a reprodução
      set({
        isPlaying: false,
        currentTime: 0
      });
    }
  },

  setOnTrackEnd: (callback: (() => void) | null) => {
    set({ onTrackEnd: callback });
  },

  setPlaybackContext: (ctx) => {
    set({ playbackContext: ctx });
  }
}));
