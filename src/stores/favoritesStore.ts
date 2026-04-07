import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addFavorite as apiAddFavorite, removeFavorite as apiRemoveFavorite } from '@/lib/favoritesApi';
import { supabase } from '@/lib/supabase-auth';

export interface FavoriteHino {
  id: string | number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  coverUrl: string;
  audioUrl?: string;
  youtubeSource?: string;
  number?: number;
  category?: string;
  likedAt: string;
  addedDaysAgo: number;
}

interface FavoritesState {
  favorites: FavoriteHino[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addFavorite: (hino: Omit<FavoriteHino, 'likedAt' | 'addedDaysAgo'>, userId?: string | number) => void;
  removeFavorite: (id: string | number, userId?: string | number) => void;
  isFavorite: (id: string | number) => boolean;
  loadFavorites: (userId?: string | number) => Promise<void>;
  clearError: () => void;
}

const normalizeDuration = (value: unknown): string => {
  if (value == null) return '0:00';

  if (typeof value === 'number' && Number.isFinite(value)) {
    const totalSeconds = Math.max(0, Math.floor(value));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  const text = String(value).trim();
  if (!text) return '0:00';
  if (text.includes(':')) return text;

  const numeric = Number(text);
  return Number.isFinite(numeric) ? normalizeDuration(numeric) : text;
};

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const buildFallbackFavorite = (favoriteRow: any): FavoriteHino => ({
  id: String(favoriteRow.hino_id || favoriteRow.id),
  title: 'Hino Favorito',
  artist: 'Cânticos CCB',
  album: 'Hinos CCB',
  duration: '0:00',
  coverUrl: '',
  audioUrl: undefined,
  youtubeSource: undefined,
  number: 0,
  category: 'favoritos',
  likedAt: String(favoriteRow.created_at || new Date().toISOString()),
  addedDaysAgo: 0,
});

const loadFavoriteHymnLookup = async (rawFavoriteIds: string[]) => {
  const favoriteIds = Array.from(new Set(rawFavoriteIds.map((value) => String(value).trim()).filter(Boolean)));
  const uuidIds = favoriteIds.filter(isUuidLike);
  const numericIds = favoriteIds
    .filter((value) => /^\d+$/.test(value))
    .map((value) => Number(value))
    .filter(Number.isFinite);

  const lookup = new Map<string, any>();

  if (uuidIds.length > 0) {
    const { data } = await supabase
      .from('hinos')
      .select('id, titulo, compositor_nome, duracao, cover_url, categoria, numero, audio_url, youtube_source')
      .in('id', uuidIds);

    for (const row of data || []) {
      lookup.set(String(row.id), row);
      if (row.numero != null) {
        lookup.set(String(row.numero), row);
      }
    }
  }

  if (numericIds.length > 0) {
    const { data } = await supabase
      .from('hinos')
      .select('id, titulo, compositor_nome, duracao, cover_url, categoria, numero, audio_url, youtube_source')
      .in('numero', numericIds);

    for (const row of data || []) {
      lookup.set(String(row.numero), row);
      lookup.set(String(row.id), row);
    }
  }

  return lookup;
};

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
          apiAddFavorite(userId, hino.id)
            .then(success => {
              if (!success) {
                console.error('❌ Falha ao salvar favorito no Supabase');
              }
            })
            .catch(err => {
              console.error('❌ Erro ao salvar favorito no Supabase:', err);
            });
        }
      },

      removeFavorite: (id, userId) => {
        set((state) => ({
          favorites: state.favorites.filter(fav => String(fav.id) !== String(id)),
          error: null
        }));
        if (userId) apiRemoveFavorite(userId, id).catch(() => { });
      },

      isFavorite: (id) => {
        return get().favorites.some(fav => String(fav.id) === String(id));
      },

      loadFavorites: async (userId?: string | number) => {
        set({ isLoading: true, error: null });
        
        try {
          if (!userId) {
            set({ isLoading: false, favorites: [] });
            return;
          }

          const uid = String(userId);
          const { data, error } = await supabase
            .from('favorites')
            .select('id, created_at, hino_id')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });

          if (error) {
            throw new Error(`Falha ao carregar favoritos: ${error.message}`);
          }

          const items = data || [];
          if (items.length === 0) {
            set({ favorites: [], isLoading: false });
            return;
          }

          const hymnLookup = await loadFavoriteHymnLookup(items.map((item: any) => String(item.hino_id)));

          const mapped = items.map((item: any) => {
            const hymn = hymnLookup.get(String(item.hino_id));

            if (!hymn) {
              return buildFallbackFavorite(item);
            }

            return {
              id: String(hymn.id || item.hino_id || item.id),
              title: hymn.titulo || 'Hino Favorito',
              artist: hymn.compositor_nome || 'Cânticos CCB',
              album: hymn.categoria || 'Hinos CCB',
              duration: normalizeDuration(hymn.duracao),
              coverUrl: hymn.cover_url || '',
              audioUrl: hymn.audio_url || undefined,
              youtubeSource: hymn.youtube_source || undefined,
              number: Number(hymn.numero) || 0,
              category: hymn.categoria || 'favoritos',
              likedAt: String(item.created_at || new Date().toISOString()),
              addedDaysAgo: 0,
            } satisfies FavoriteHino;
          });

          set({ favorites: mapped, isLoading: false });
        } catch (error: any) {
          console.error('❌ Erro completo em loadFavorites:', error);
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
