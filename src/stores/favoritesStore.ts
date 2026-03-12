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

const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isLoading: false,
      error: null,

      addFavorite: (hino, userId) => {
        console.log('💚 favoritesStore.addFavorite chamado:', { hino, userId });

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

        console.log('✅ Favorito adicionado ao estado local');

        if (userId) {
          const uid = Number(userId) || 0;
          console.log('🔄 Tentando salvar no Supabase:', { uid, hinoId: hino.id });
          if (uid) {
            apiAddFavorite(uid, hino.id)
              .then(success => {
                if (success) {
                  console.log('✅ Favorito salvo no Supabase com sucesso!');
                } else {
                  console.error('❌ Falha ao salvar favorito no Supabase');
                }
              })
              .catch(err => {
                console.error('❌ Erro ao salvar favorito no Supabase:', err);
              });
          }
        } else {
          console.warn('⚠️ userId não fornecido - favorito não será salvo no Supabase');
        }
      },

      removeFavorite: (id, userId) => {
        set((state) => ({
          favorites: state.favorites.filter(fav => String(fav.id) !== String(id)),
          error: null
        }));
        if (userId) {
          const uid = Number(userId) || 0;
          if (uid) apiRemoveFavorite(uid, id).catch(() => { });
        }
      },

      isFavorite: (id) => {
        return get().favorites.some(fav => String(fav.id) === String(id));
      },

      loadFavorites: async (userId?: string | number) => {
        console.log('🔄 loadFavorites chamado com userId:', userId);
        set({ isLoading: true, error: null });
        
        try {
          if (!userId) {
            console.log('⚠️ userId não fornecido, abortando carregamento');
            set({ isLoading: false, favorites: [] });
            return;
          }

          const uid = String(userId);
          console.log('🔍 Buscando favoritos no Supabase para usuário:', uid);
          
          // Buscar favoritos com join na tabela hinos
          const { data, error } = await supabase
            .from('favorites')
            .select(`
              id,
              created_at,
              hino_id,
              hinos:hino_id ( id, titulo, compositor_nome, duracao, cover_url, categoria )
            `)
            .eq('user_id', uid)
            .order('created_at', { ascending: false });

          console.log('📊 Resultado da consulta favorites:', { count: data?.length, error });

          if (error) {
            console.error('❌ Erro na consulta favorites:', error);
            // Fallback: buscar sem join
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('favorites')
              .select('id, created_at, hino_id')
              .eq('user_id', uid)
              .order('created_at', { ascending: false });

            if (fallbackError) {
              throw new Error(`Falha ao carregar favoritos: ${fallbackError.message}`);
            }

            const items = fallbackData || [];
            const mapped = items.map((it: any) => ({
              id: it.hino_id || it.id,
              title: 'Hino Favorito',
              artist: 'Cânticos CCB',
              album: 'Hinos CCB',
              duration: '00:00',
              coverUrl: '',
              likedAt: String(it.created_at || new Date().toISOString()),
              addedDaysAgo: 0,
            }));
            set({ favorites: mapped, isLoading: false });
            return;
          }

          const items = data || [];
          console.log('📝 Itens retornados:', items.length);

          const mapped = items.map((it: any) => {
            const hino = it.hinos;
            return {
              id: it.hino_id || it.id,
              title: hino?.titulo || 'Hino Favorito',
              artist: hino?.compositor_nome || 'Cânticos CCB',
              album: hino?.categoria || 'Hinos CCB',
              duration: hino?.duracao || '00:00',
              coverUrl: hino?.cover_url || '',
              likedAt: String(it.created_at || new Date().toISOString()),
              addedDaysAgo: 0,
            };
          });

          console.log('✅ Favoritos carregados com sucesso:', mapped.length);
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
