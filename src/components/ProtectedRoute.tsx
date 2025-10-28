import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireComposer?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireComposer = false 
}) => {
  const { user, loading, isAdmin, isComposer } = useAuth();

  // Debug logs
  React.useEffect(() => {
    console.log('🔐 ProtectedRoute state:', { 
      hasUser: !!user, 
      loading, 
      isAdmin, 
      isComposer,
      requireAdmin,
      requireComposer
    });
  }, [user, loading, isAdmin, isComposer]);

  // Enquanto carrega, não renderiza spinner nem conteúdo
  if (loading) {
    console.log('⏳ ProtectedRoute: Aguardando auth...');
    return null;
  }

  // Se não estiver logado, redirecionar para login
  if (!user) {
    console.warn('❌ ProtectedRoute: Sem usuário, redirecionando para /login');
    return <Navigate to="/login" replace />;
  }

  // Se requer admin e não é admin, redirecionar
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Se requer compositor e não é compositor, redirecionar
  if (requireComposer && !isComposer) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
