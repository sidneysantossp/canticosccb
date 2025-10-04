import { create } from 'zustand';
import { PlayerState, Hino } from '@/types';

interface PlayerStore extends PlayerState {
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

  // Actions
  play: (track: Hino) => {
    const { history } = get();
    set({
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
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
  }
}));
