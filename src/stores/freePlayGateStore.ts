import { create } from 'zustand';
import { Hino } from '@/types';

const STORAGE_KEY = 'ccb_free_plays';
const MAX_FREE_PLAYS = 1;

interface FreePlayGateState {
  // Modal state
  isModalOpen: boolean;
  blockedTrack: Hino | null;

  // Actions
  canPlay: () => boolean;
  recordPlay: (trackId: string) => void;
  showGate: (track: Hino) => void;
  closeGate: () => void;
  getPlayCount: () => number;
  resetPlays: () => void;
}

function getPlayedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePlayedIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage full or blocked
  }
}

export const useFreePlayGateStore = create<FreePlayGateState>((set) => ({
  isModalOpen: false,
  blockedTrack: null,

  canPlay: () => {
    const played = getPlayedIds();
    return played.length < MAX_FREE_PLAYS;
  },

  recordPlay: (trackId: string) => {
    const played = getPlayedIds();
    if (!played.includes(trackId)) {
      played.push(trackId);
      savePlayedIds(played);
    }
  },

  showGate: (track: Hino) => {
    set({ isModalOpen: true, blockedTrack: track });
  },

  closeGate: () => {
    set({ isModalOpen: false, blockedTrack: null });
  },

  getPlayCount: () => {
    return getPlayedIds().length;
  },

  resetPlays: () => {
    localStorage.removeItem(STORAGE_KEY);
  },
}));

export default useFreePlayGateStore;
