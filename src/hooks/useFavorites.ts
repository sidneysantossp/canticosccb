import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserFavorites, addFavorite, removeFavorite, syncLocalFavoritesWithBackend } from '@/lib/favoritesApi';

/**
 * Hook customizado para gerenciar favoritos de forma centralizada
 */
export const useFavorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Carregar favoritos ao montar ou quando usuário mudar
  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Usuário logado: buscar do banco
          console.log('💚 Carregando favoritos do banco...');
          const favIds = await getUserFavorites((user as any).id as number);
          setFavorites(new Set(favIds));
          console.log('✅ Favoritos carregados:', favIds.length);
        } else {
          // Usuário não logado: buscar do localStorage
          const savedFavorites = localStorage.getItem('favoriteHymns');
          if (savedFavorites) {
            setFavorites(new Set(JSON.parse(savedFavorites)));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [user]);

  // Sincronizar favoritos locais ao fazer login
  useEffect(() => {
    const syncFavorites = async () => {
      if (user) {
        const localFavorites = localStorage.getItem('favoriteHymns');
        if (localFavorites) {
          console.log('🔄 Sincronizando favoritos locais com o banco...');
          try {
            await syncLocalFavoritesWithBackend((user as any).id as number);
            // Recarregar favoritos do banco
            const favIds = await getUserFavorites((user as any).id as number);
            setFavorites(new Set(favIds));
            console.log('✅ Sincronização completa!');
          } catch (error) {
            console.error('Erro ao sincronizar favoritos:', error);
          }
        }
      }
    };

    syncFavorites();
  }, [user]);

  /**
   * Alternar favorito (adicionar ou remover)
   */
  const toggleFavorite = async (hymnId: string, showModalCallback?: () => void) => {
    // Verificar se o usuário está logado
    if (!user) {
      if (showModalCallback) {
        showModalCallback();
      } else {
        console.warn('Favoritos: usuário não logado');
        navigate('/login', { state: { from: window.location.pathname } });
      }
      return;
    }

    try {
      // Atualizar UI otimisticamente (antes da resposta do servidor)
      const wasRemoving = favorites.has(hymnId);
      
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (wasRemoving) {
          newFavorites.delete(hymnId);
        } else {
          newFavorites.add(hymnId);
        }
        return newFavorites;
      });

      // Chamar API do backend
      const uid = (user as any).id as number;
      const hid = Number(hymnId) || parseInt(hymnId, 10) || 0;
      let ok = false;
      if (hid) {
        ok = wasRemoving ? await removeFavorite(uid, hid) : await addFavorite(uid, hid);
      }

      if (ok) {
        // Sem toasts
      } else {
        // Reverter UI em caso de erro
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (wasRemoving) {
            newFavorites.add(hymnId);
          } else {
            newFavorites.delete(hymnId);
          }
          return newFavorites;
        });
        console.error('Erro ao atualizar favorito. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      console.error('Erro ao atualizar favorito. Tente novamente.');
      
      // Reverter UI em caso de erro
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        const wasRemoving = favorites.has(hymnId);
        if (wasRemoving) {
          newFavorites.add(hymnId);
        } else {
          newFavorites.delete(hymnId);
        }
        return newFavorites;
      });
    }
  };

  /**
   * Verificar se um hino está nos favoritos
   */
  const isFavorited = (hymnId: string): boolean => {
    return favorites.has(hymnId);
  };

  /**
   * Obter quantidade de favoritos
   */
  const getFavoritesCount = (): number => {
    return favorites.size;
  };

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorited,
    getFavoritesCount
  };
};
