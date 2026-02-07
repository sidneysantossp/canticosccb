import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlaylistTrack {
  id: number;
  title: string;
  artist: string;
  coverUrl: string;
  duration: string;
  backendTrackId?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl: string;
  tracks: PlaylistTrack[];
  createdAt: string;
  updatedAt: string;
}

interface PlaylistsState {
  playlists: Playlist[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createPlaylist: (name: string, description?: string) => Playlist;
  addTrackToPlaylist: (playlistId: string, track: PlaylistTrack) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: number) => void;
  deletePlaylist: (playlistId: string) => void;
  updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => void;
  getPlaylistById: (playlistId: string) => Playlist | undefined;
  loadPlaylists: () => Promise<void>;
  clearError: () => void;
  setPlaylists: (playlists: Playlist[]) => void;
  upsertPlaylist: (playlist: Playlist) => void;
}

const usePlaylistsStore = create<PlaylistsState>()(
  persist(
    (set, get) => ({
      playlists: [],
      isLoading: false,
      error: null,

      createPlaylist: (name, description) => {
        const now = new Date().toISOString();
        const id = `playlist_${Date.now()}`;
        const newPlaylist: Playlist = {
          id,
          name,
          description,
          coverUrl: `https://picsum.photos/seed/${Date.now()}/300/300`,
          tracks: [],
          createdAt: now,
          updatedAt: now
        };

        set((state) => ({
          playlists: [newPlaylist, ...state.playlists],
          error: null
        }));

        // Async sync with backend
        import('@/lib/playlistsApi').then(api => {
          // Check if we have a user (we need user_id)
          // Since store doesn't have user, we might need a better way, 
          // but for now we look for user in localStorage or AuthContext state (if we could)
          // Ideally, the caller should handle the sync or we pass userId
        });

        return newPlaylist;
      },

      addTrackToPlaylist: (playlistId, track) => {
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                ...playlist,
                tracks: [...playlist.tracks, track],
                updatedAt: new Date().toISOString()
              }
              : playlist
          ),
          error: null
        }));

        // Async sync with backend if playlistId is a real database ID (numeric)
        const isNumeric = /^\d+$/.test(String(playlistId));
        if (isNumeric) {
          import('@/lib/playlistsApi').then(api => {
            api.addTrack({
              playlistId: Number(playlistId),
              trackId: track.backendTrackId || String(track.id),
              title: track.title,
              artist: track.artist,
              duration: track.duration,
              coverUrl: track.coverUrl
            }).catch(err => console.error('❌ Sync error:', err));
          });
        }
      },

      removeTrackFromPlaylist: (playlistId: string, trackId: number) => {
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId
              ? {
                ...playlist,
                tracks: playlist.tracks.filter((t) => t.id !== trackId),
                updatedAt: new Date().toISOString()
              }
              : playlist
          ),
          error: null
        }));
      },

      deletePlaylist: (playlistId: string) => {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== playlistId),
          error: null
        }));
      },

      updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => {
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === playlistId
              ? { ...playlist, ...updates, updatedAt: new Date().toISOString() }
              : playlist
          ),
          error: null
        }));
      },

      getPlaylistById: (playlistId: string) => {
        return get().playlists.find((p) => p.id === playlistId);
      },

      loadPlaylists: async () => {
        set({ isLoading: true, error: null });

        try {
          // TODO: Replace with real API call
          // const response = await fetch('/api/playlists');
          // const playlists = await response.json();

          // For now, keep existing playlists from localStorage
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao carregar playlists'
          });
        }
      },

      clearError: () => set({ error: null })
      ,
      setPlaylists: (playlists: Playlist[]) => set({ playlists }),
      upsertPlaylist: (playlist: Playlist) => {
        set((state) => {
          const exists = state.playlists.some(p => p.id === playlist.id);
          return {
            playlists: exists
              ? state.playlists.map(p => p.id === playlist.id ? { ...p, ...playlist } : p)
              : [playlist, ...state.playlists]
          };
        });
      }
    }),
    {
      name: 'playlists-storage',
      partialize: (state) => ({ playlists: state.playlists })
    }
  )
);

export default usePlaylistsStore;
