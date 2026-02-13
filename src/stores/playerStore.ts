import { create } from 'zustand';
import { PlayerState, Hino } from '@/types';
import { useFreePlayGateStore } from '@/stores/freePlayGateStore';

// Helper: check if user is logged in (reads from localStorage where AuthContext persists)
function isUserLoggedIn(): boolean {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      return !!parsed && !!parsed.id;
    }
    // Also check Supabase session
    const sbKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (sbKey) {
      const session = JSON.parse(localStorage.getItem(sbKey) || '{}');
      return !!session?.user?.id;
    }
    return false;
  } catch {
    return false;
  }
}

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
  setDuration: (duration: number) => void;
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
    // Free play gate: block anonymous users after 1 free play
    if (!isUserLoggedIn()) {
      const gate = useFreePlayGateStore.getState();
      if (!gate.canPlay()) {
        // Limit reached – show gate modal instead of playing
        gate.showGate(track);
        return;
      }
      // Record this free play
      gate.recordPlay(track.id);
    }

    const { history } = get();
    set({
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
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
    const { queue } = get();
    if (queue.length > 0) {
      const nextTrack = queue[0];
      // Gate check for anonymous users
      if (!isUserLoggedIn()) {
        const gate = useFreePlayGateStore.getState();
        if (!gate.canPlay()) {
          gate.showGate(nextTrack);
          return;
        }
        gate.recordPlay(nextTrack.id);
      }
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
      // Gate check for anonymous users
      if (!isUserLoggedIn()) {
        const gate = useFreePlayGateStore.getState();
        if (!gate.canPlay()) {
          gate.showGate(nextTrack);
          set({ isPlaying: false });
          return;
        }
        gate.recordPlay(nextTrack.id);
      }
      set({
        currentTrack: nextTrack,
        queue: queue.slice(1),
        currentTime: 0,
        isPlaying: true
      });
    } else if (repeat === 'one' && currentTrack) {
      // Se repeat one, toca o mesmo hino
      set({
        currentTime: 0,
        isPlaying: true
      });
    } else if (repeat === 'all' && currentTrack) {
      // Se repeat all e não tem fila, volta ao início do mesmo hino
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

  setDuration: (duration: number) => {
    set({ duration });
  },

  setOnTrackEnd: (callback: (() => void) | null) => {
    set({ onTrackEnd: callback });
  },

  setPlaybackContext: (ctx) => {
    set({ playbackContext: ctx });
  }
}));
