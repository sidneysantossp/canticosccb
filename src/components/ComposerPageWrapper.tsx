import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useActiveComposer } from '@/hooks/useActiveComposer';

interface ComposerPageWrapperProps {
  children: React.ReactNode;
  requireComposer?: boolean;
}

/**
 * Wrapper para páginas do compositor
 * Garante autenticação e perfil de compositor
 */
export const ComposerPageWrapper: React.FC<ComposerPageWrapperProps> = ({ 
  children, 
  requireComposer = true 
}) => {
  const { user, profile, loading, managingComposerId } = useAuth();
  const { composerId, loading: loadingComposer } = useActiveComposer();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || loadingComposer) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (requireComposer && !profile?.is_composer && !composerId) {
      navigate(managingComposerId ? '/manage-composers' : '/');
      return;
    }
  }, [user, profile, loading, loadingComposer, composerId, navigate, requireComposer, managingComposerId]);

  // Loading state
  if (loading || loadingComposer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null; // Vai redirecionar
  }

  // Not a composer
  if (requireComposer && !profile?.is_composer && !composerId) {
    return null; // Vai redirecionar
  }

  return <>{children}</>;
};
