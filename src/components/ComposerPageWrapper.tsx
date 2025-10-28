import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      console.warn('⚠️ ComposerPageWrapper: No user found, redirecting to login');
      navigate('/login');
      return;
    }

    if (requireComposer && !profile?.is_composer) {
      console.warn('⚠️ ComposerPageWrapper: User is not a composer, redirecting to home');
      navigate('/');
      return;
    }

    console.log('✅ ComposerPageWrapper: User authenticated', {
      userId: user.id,
      isComposer: profile?.is_composer
    });
  }, [user, profile, loading, navigate, requireComposer]);

  // Loading state
  if (loading) {
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
  if (requireComposer && !profile?.is_composer) {
    return null; // Vai redirecionar
  }

  return <>{children}</>;
};
