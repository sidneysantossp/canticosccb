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

  // Enquanto carrega, não renderiza spinner nem conteúdo
  if (loading) {
    return null;
  }

  // Se não estiver logado, redirecionar para login
  if (!user) {
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
