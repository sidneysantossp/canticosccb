import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { resolveActiveComposer, type ActiveComposer } from '@/lib/activeComposer';

export function useActiveComposer() {
  const { user, managingComposerId } = useAuth();
  const [composer, setComposer] = useState<ActiveComposer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadComposer = async () => {
      if (!user?.id && !managingComposerId) {
        setComposer(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const resolved = await resolveActiveComposer({
          userId: user?.id,
          userEmail: user?.email,
          managingComposerId,
        });

        if (!cancelled) {
          setComposer(resolved);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Erro ao resolver compositor ativo:', error);
          setComposer(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadComposer();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email, managingComposerId]);

  return {
    composer,
    composerId: composer?.id || null,
    composerName: composer?.nome_artistico || composer?.nome || '',
    isManagingComposer: Boolean(managingComposerId),
    loading,
  };
}
