import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { removeFavorite as apiRemoveFavorite } from '@/lib/favoritesApi';
import { supabase } from '@/lib/supabase-auth';

export interface FavoriteHino {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  coverUrl: string;
  likedAt: string;
  addedDaysAgo: number;
}

interface FavoritesState {
  favorites: FavoriteHino[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addFavorite: (hino: Omit<FavoriteHino, 'likedAt' | 'addedDaysAgo'>, userId?: number) => void;
  removeFavorite: (id: number, userId?: number) => void;
  isFavorite: (id: number) => boolean;
  loadFavorites: (userId?: number) => Promise<void>;
  clearError: () => void;
}

const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isLoading: false,
      error: null,

      addFavorite: (hino, userId) => {
        const now = new Date().toISOString();
        const newFavorite: FavoriteHino = {
          ...hino,
          likedAt: now,
          addedDaysAgo: 0
        };

        set((state) => ({
          favorites: [newFavorite, ...state.favorites],
          error: null
        }));
        if (userId) {
          const uid = Number(userId) || 0;
          if (uid) import('@/lib/favoritesApi').then(m => m.addFavorite(uid, hino.id).catch(() => {}));
        }
      },

      removeFavorite: (id, userId) => {
        set((state) => ({
          favorites: state.favorites.filter(fav => fav.id !== id),
          error: null
        }));
        if (userId) {
          const uid = Number(userId) || 0;
          if (uid) apiRemoveFavorite(uid, id).catch(() => {});
        }
      },

      isFavorite: (id) => {
        return get().favorites.some(fav => fav.id === id);
      },

      loadFavorites: async (userId?: number) => {
        set({ isLoading: true, error: null });
        try {
          if (!userId) {
            set({ isLoading: false });
            return;
          }
          
          const { data, error } = await supabase
            .from('favoritos')
            .select(`
              id,
              created_at,
              hinos (
                id,
                titulo,
                compositor_nome,
                duracao,
                capa
              )
            `)
            .eq('usuario_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw new Error('Falha ao carregar favoritos');
          
          const items = data || [];
          const mapped = items.map((it: any) => ({
            id: Number(it.hinos?.id || it.id),
            title: String(it.hinos?.titulo || ''),
            artist: String(it.hinos?.compositor_nome || ''),
            album: 'Hinos CCB',
            duration: String(it.hinos?.duracao || '00:00'),
            coverUrl: String(it.hinos?.capa || ''),
            likedAt: String(it.created_at || new Date().toISOString()),
            addedDaysAgo: 0,
          }));
          set({ favorites: mapped, isLoading: false });
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Erro ao carregar favoritos'
          });
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'favorites-storage',
      partialize: (state) => ({ favorites: state.favorites })
    }
  )
);

// Helper function to calculate days ago
export const updateFavoritesDaysAgo = () => {
  const { favorites } = useFavoritesStore.getState();
  const now = new Date();
  
  const updatedFavorites = favorites.map(fav => ({
    ...fav,
    addedDaysAgo: Math.floor((now.getTime() - new Date(fav.likedAt).getTime()) / (1000 * 60 * 60 * 24))
  }));

  useFavoritesStore.setState({ favorites: updatedFavorites });
};

export default useFavoritesStore;
