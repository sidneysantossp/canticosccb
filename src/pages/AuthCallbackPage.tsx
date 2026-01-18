import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleOAuthCallback } from '@/lib/supabase-auth';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const result = await handleOAuthCallback();
        
        if (result.success) {
          console.log('✅ OAuth callback processado com sucesso:', result.usuario);
          
          // Aguardar um pouco para garantir que o AuthContext foi atualizado
          // Especialmente importante no mobile
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Redirecionar baseado no tipo de usuário
          if (result.usuario.tipo === 'compositor') {
            navigate('/composer', { replace: true });
          } else if (result.usuario.tipo === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/onboarding', { replace: true });
          }
        }
      } catch (err: any) {
        console.error('Erro ao processar callback:', err);
        setError(err.message || 'Erro ao processar autenticação');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ {error}</div>
          <p className="text-gray-400">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Processando autenticação...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
