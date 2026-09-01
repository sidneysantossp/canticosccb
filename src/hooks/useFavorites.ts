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
          const favIds = await getUserFavorites((user as any).id as string);
          setFavorites(new Set(favIds));
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
          try {
            await syncLocalFavoritesWithBackend((user as any).id as string);
            // Recarregar favoritos do banco
            const favIds = await getUserFavorites((user as any).id as string);
            setFavorites(new Set(favIds));
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
        const from = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        navigate('/login', { state: { from, reason: 'favorite' } });
      }
      return;
    }

    try {
      // Normalizar ID para string
      const normalizedId = String(hymnId);
      
      // Atualizar UI otimisticamente (antes da resposta do servidor)
      const wasRemoving = favorites.has(normalizedId);
      
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (wasRemoving) {
          newFavorites.delete(normalizedId);
        } else {
          newFavorites.add(normalizedId);
        }
        return newFavorites;
      });

      // Chamar API do backend
      const uid = String((user as any).id || '');
      const hid = String(hymnId || '').trim();
      let ok = false;
      if (hid) {
        ok = wasRemoving ? await removeFavorite(uid, hid) : await addFavorite(uid, hid);
      }

      if (!ok) {
        console.error('❌ Erro ao atualizar favorito no backend');
        // Reverter UI em caso de erro
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          if (wasRemoving) {
            newFavorites.add(normalizedId);
          } else {
            newFavorites.delete(normalizedId);
          }
          return newFavorites;
        });
        console.error('Erro ao atualizar favorito. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro ao alternar favorito:', error);
      console.error('Erro ao atualizar favorito. Tente novamente.');
      
      // Reverter UI em caso de erro
      const normalizedId = String(hymnId);
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        const wasRemoving = favorites.has(normalizedId);
        if (wasRemoving) {
          newFavorites.add(normalizedId);
        } else {
          newFavorites.delete(normalizedId);
        }
        return newFavorites;
      });
    }
  };

  /**
   * Verificar se um hino está nos favoritos
   */
  const isFavorited = (hymnId: string): boolean => {
    // Normalizar ID para string para garantir comparação correta
    const normalizedId = String(hymnId);
    return favorites.has(normalizedId);
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
