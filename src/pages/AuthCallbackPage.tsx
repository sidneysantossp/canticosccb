import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleOAuthCallback } from '@/lib/supabase-auth';
import { supabase } from '@/lib/supabase-auth';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const callbackType = searchParams.get('type');
        const isEmailVerification = callbackType === 'email_verification';

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

        // Supabase email confirmation links use hash fragments with access_token
        // The Supabase client auto-exchanges these tokens on page load
        // Wait for the session to be established
        let { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Wait a bit for Supabase to process the hash token
          await new Promise(resolve => setTimeout(resolve, 1500));
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          session = retrySession;
          
          if (!session) {
            // Try OAuth callback as fallback
            const result = await handleOAuthCallback();
            if (result.success) {
              await new Promise(resolve => setTimeout(resolve, 500));
              if (result.usuario.tipo === 'compositor') {
                navigate('/composer', { replace: true });
              } else if (result.usuario.tipo === 'admin') {
                navigate('/admin', { replace: true });
              } else {
                navigate('/onboarding', { replace: true });
              }
              return;
            }
          }
        }

        // If this is an email verification callback, go to onboarding
        if (isEmailVerification || session) {
          console.log('✅ Email verificado com sucesso!');
          const destination = session?.user
            ? await resolvePostAuthDestination(session.user)
            : '/onboarding';
          await new Promise(resolve => setTimeout(resolve, 500));
          navigate(destination, { replace: true });
          return;
        }

        // Fallback: try OAuth callback
        const result = await handleOAuthCallback();
        
        if (result.success) {
          console.log('✅ OAuth callback processado com sucesso:', result.usuario);
          await new Promise(resolve => setTimeout(resolve, 500));
          
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
