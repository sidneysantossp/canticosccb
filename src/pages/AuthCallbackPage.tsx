import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase-auth';
import { consumeAuthReturnTo } from '@/lib/authReturnTo';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const callbackType = searchParams.get('type');
        const isEmailVerification = callbackType === 'email_verification';
        const isPasswordRecovery = callbackType === 'recovery';

        const navigateAfterAuth = (fallback: string) => {
          navigate(consumeAuthReturnTo() || fallback, { replace: true });
        };

        const resolvePostAuthDestination = async (sessionUser: { id: string; email?: string | null; user_metadata?: Record<string, any> }) => {
          const { data: dbUser } = await supabase
            .from('users')
            .select('id,email,name,is_admin,is_composer')
            .eq('id', sessionUser.id)
            .maybeSingle();

          if (dbUser?.is_admin) {
            return '/admin';
          }

          let composer: { id: string } | null = null;

          const { data: composerByUserId } = await supabase
            .from('composers')
            .select('id')
            .eq('user_id', sessionUser.id)
            .maybeSingle();

          composer = composerByUserId || null;

          if (!composer && sessionUser.email) {
            const { data: composerByEmail } = await supabase
              .from('composers')
              .select('id')
              .eq('email', sessionUser.email)
              .maybeSingle();

            composer = composerByEmail || null;

            if (composer) {
              await supabase
                .from('composers')
                .update({ user_id: sessionUser.id })
                .eq('id', composer.id);
            }
          }

          if (composer || dbUser?.is_composer) {
            await supabase
              .from('users')
              .upsert({
                id: sessionUser.id,
                email: sessionUser.email || dbUser?.email || '',
                name: dbUser?.name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Usuário',
                plan: 'free',
                status: 'active',
                is_admin: dbUser?.is_admin || false,
                is_composer: true,
                is_blocked: false,
              }, { onConflict: 'id' });

            return '/composer/dashboard';
          }

          return '/onboarding';
        };

        const callbackError = searchParams.get('error_description') || searchParams.get('error');
        if (callbackError) throw new Error(callbackError);

        // Novos acessos usam PKCE. initialize() aguarda a troca do code pela
        // sessão antes de permitir que a página decida o redirecionamento.
        const { error: initializationError } = await supabase.auth.initialize();

        let { data: { session }, error: sessionError } = await supabase.auth.getSession();

        // Compatibilidade com links/tentativas iniciados antes da migração para
        // PKCE, que ainda podem voltar com os tokens no fragmento da URL.
        if (!session && typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.slice(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const legacyError = hashParams.get('error_description') || hashParams.get('error');

          if (legacyError) throw new Error(legacyError);

          if (accessToken && refreshToken) {
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setSessionError) throw setSessionError;
            session = data.session;
            window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
          }
        }

        if (!session) {
          throw initializationError || sessionError || new Error('Não foi possível concluir o login. Inicie novamente pelo botão do Google.');
        }

        if (isPasswordRecovery && session) {
          await new Promise(resolve => setTimeout(resolve, 300));
          navigate('/reset-password', { replace: true });
          return;
        }

        if (isPasswordRecovery) {
          throw new Error('Link de recuperação inválido ou expirado. Solicite um novo email.');
        }

        // If this is an email verification callback, go to onboarding
        if (isEmailVerification || session) {
          const destination = session?.user
            ? await resolvePostAuthDestination(session.user)
            : '/onboarding';
          await new Promise(resolve => setTimeout(resolve, 500));
          navigateAfterAuth(isEmailVerification ? '/onboarding' : destination);
          return;
        }

      } catch (err: any) {
        console.error('Erro ao processar callback:', err);
        setError(err.message || 'Erro ao processar autenticação');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processCallback();
  }, [navigate, searchParams]);

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
