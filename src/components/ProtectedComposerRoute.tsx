import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { compositoresApi } from '@/lib/api-client';
import { AlertCircle } from 'lucide-react';

interface ProtectedComposerRouteProps {
  children: React.ReactNode;
}

export const ProtectedComposerRoute: React.FC<ProtectedComposerRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [hasComposerProfile, setHasComposerProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkComposerStatus = React.useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await compositoresApi.getByUsuarioId(String(user.id), user.email);
      const compositor = response.data as any;

      if (compositor) {
        setHasComposerProfile(true);
        console.log('🔍 Compositor encontrado:', compositor);
        const verified = compositor.verificado === true || compositor.verificado === 1 || compositor.verified === true;
        console.log('✅ Status verificado (normalizado):', verified, '| verificado:', compositor.verificado, '| status:', compositor.status);
        setIsVerified(verified);
      } else {
        setHasComposerProfile(false);
        console.log('❌ Compositor não encontrado para usuario_id:', user.id);
        setIsVerified(user.tipo !== 'compositor');
      }
    } catch (error) {
      console.error('Erro ao verificar compositor:', error);
      setHasComposerProfile(false);
      setIsVerified(user.tipo !== 'compositor');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkComposerStatus();
  }, [checkComposerStatus]);

  // Ocultar sidebar quando compositor não está verificado
  useEffect(() => {
    if (hasComposerProfile && isVerified === false) {
      document.body.classList.add('hide-sidebar');
      return () => {
        document.body.classList.remove('hide-sidebar');
      };
    } else {
      document.body.classList.remove('hide-sidebar');
    }
  }, [hasComposerProfile, isVerified]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se não está logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se é compositor mas não está verificado, mostra mensagem SEM SIDEBAR
  if (hasComposerProfile && isVerified === false) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            Perfil em Análise
          </h2>

          <p className="text-gray-400 mb-6">
            Seu perfil de compositor está em processo de verificação.
            Nossa equipe está analisando seus documentos e em breve você terá acesso completo ao dashboard de compositor.
          </p>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-300 mb-2">
              <strong className="text-white">O que fazer enquanto aguarda?</strong>
            </p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Aguarde a análise dos seus documentos</li>
              <li>• Você receberá um email quando for aprovado</li>
              <li>• O processo pode levar até 48 horas</li>
            </ul>
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
          >
            Ver Meu Perfil
          </button>
        </div>
      </div>
    );
  }

  // Se está verificado ou é outro tipo de usuário, permite acesso
  return <>{children}</>;
};
