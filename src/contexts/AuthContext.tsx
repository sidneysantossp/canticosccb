import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authClient from '@/lib/supabase-auth';
import type { Usuario } from '@/lib/supabase-auth';
// WebPush removed - Firebase dependency eliminated

interface User {
  id: string;
  email: string;
  nome: string;
  avatar_url?: string;
  tipo: 'usuario' | 'compositor' | 'admin';
  ativo: number | boolean;
}

interface UserProfile extends User {
  plan: 'free' | 'premium';
  is_admin: boolean;
  is_composer: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isComposer: boolean;
  // Gerenciamento de compositores
  managingComposerId: string | null;
  managingComposerName: string | null;
  switchToComposer: (composerId: string | number, composerName: string) => void;
  switchBackToSelf: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const resolveUserFlags = (
  email?: string | null,
  isAdmin?: boolean,
  isComposer?: boolean,
  tipo?: User['tipo']
) => {
  // Papéis são autorizados pelo perfil retornado sob uma sessão Supabase válida.
  // Valores de e-mail, aliases de compatibilidade e cache local nunca concedem privilégios.
  const resolvedIsAdmin = isAdmin === true;
  const resolvedIsComposer = isComposer === true;
  const resolvedTipo: User['tipo'] = resolvedIsAdmin ? 'admin' : resolvedIsComposer ? 'compositor' : 'usuario';

  return {
    resolvedIsAdmin,
    resolvedIsComposer,
    resolvedTipo,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [managingComposerId, setManagingComposerId] = useState<string | null>(null);
  const [managingComposerName, setManagingComposerName] = useState<string | null>(null);

  const applyUser = (usuario: Partial<Usuario> & { id: string; email: string }) => {
    const { resolvedIsAdmin, resolvedIsComposer, resolvedTipo } = resolveUserFlags(
      usuario.email,
      usuario.is_admin,
      usuario.is_composer,
      usuario.tipo
    );

    const userCompat: User = {
      id: String(usuario.id),
      email: usuario.email,
      nome: usuario.nome || usuario.name || usuario.email.split('@')[0] || 'Usuário',
      avatar_url: usuario.avatar_url,
      tipo: resolvedTipo,
      ativo: usuario.ativo ?? (usuario.status !== 'inactive' && !usuario.is_blocked),
    };

    authClient.cacheCurrentUser({
      ...usuario,
      ...userCompat,
      is_admin: resolvedIsAdmin,
      is_composer: resolvedIsComposer,
    });
    setUser(userCompat);
    setProfile({
      ...userCompat,
      plan: usuario.plan === 'premium' || usuario.plano === 'premium' ? 'premium' : 'free',
      is_admin: resolvedIsAdmin,
      is_composer: resolvedIsComposer,
    });
  };

  const applySessionUser = (session: any) => {
    if (!session?.user) return false;

    applyUser({
      id: String(session.user.id),
      email: session.user.email!,
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
      avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
      plan: 'free',
      status: 'active',
      is_admin: false,
      is_composer: false,
      is_blocked: false,
      email_verified: !!session.user.email_confirmed_at,
    });
    return true;
  };

  useEffect(() => {
    const clearStoredUser = () => {
      setUser(null);
      setProfile(null);
      authClient.clearAuthStorage();
    };

    // Função para buscar/criar usuário baseado na sessão Supabase
    const syncUserFromSession = async (session: any) => {
      if (!session?.user) return false;

      try {
        // Buscar usuário pelo id (UUID)
        const profileColumns = 'id,email,name,avatar_url,plan,status,is_admin,is_composer,is_blocked,email_verified';
        const { data: dbUser } = await authClient.supabase
          .from('users')
          .select(profileColumns)
          .eq('id', session.user.id)
          .single();

        let user = dbUser;

        if (user) {
          const updates: Record<string, any> = {};
          const sessionName = session.user.user_metadata?.name || session.user.user_metadata?.full_name;
          const sessionAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;

          if (session.user.email_confirmed_at && !user.email_verified) {
            updates.email_verified = true;
          }

          if (!user.name && sessionName) {
            updates.name = sessionName;
          }

          if (sessionAvatar && sessionAvatar !== user.avatar_url) {
            updates.avatar_url = sessionAvatar;
          }

          if (Object.keys(updates).length > 0) {
              const { data: updatedUser, error: updateError } = await authClient.supabase
              .from('users')
              .update(updates)
              .eq('id', session.user.id)
              .select(profileColumns)
              .single();

            if (!updateError && updatedUser) {
              user = updatedUser;
            }
          }

          const { resolvedIsAdmin, resolvedIsComposer, resolvedTipo } = resolveUserFlags(
            user.email,
            user.is_admin,
            user.is_composer
          );

          // Mapear para compatibilidade com a interface User
          const usuarioCompat: User = {
            id: String(user.id),
            email: user.email,
            nome: user.name,
            avatar_url: user.avatar_url,
            tipo: resolvedTipo,
            ativo: user.status !== 'inactive' && !user.is_blocked,
          };

          authClient.cacheCurrentUser({
            ...usuarioCompat,
            is_admin: resolvedIsAdmin,
            is_composer: resolvedIsComposer,
          });
          setUser(usuarioCompat);
          setProfile({
            ...usuarioCompat,
            plan: user.plan === 'premium' ? 'premium' : 'free',
            is_admin: resolvedIsAdmin,
            is_composer: resolvedIsComposer
          });
          return true;
        } else {
          // Usar upsert para evitar erro de duplicate key
          const { data: newUser, error } = await authClient.supabase
            .from('users')
            .upsert({
              id: session.user.id, // UUID do auth.users
              email: session.user.email!,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
              avatar_url: session.user.user_metadata?.avatar_url,
              plan: 'free',
              status: 'active',
              is_admin: false,
              is_composer: false,
              is_blocked: false,
              email_verified: !!session.user.email_confirmed_at,
            }, { onConflict: 'id' })
            .select(profileColumns)
            .single();

          if (!error && newUser) {
            const { resolvedIsAdmin, resolvedIsComposer, resolvedTipo } = resolveUserFlags(
              newUser.email,
              newUser.is_admin,
              newUser.is_composer
            );

            // Mapear para compatibilidade
            const usuarioCompat: User = {
              id: String(newUser.id),
              email: newUser.email,
              nome: newUser.name,
              avatar_url: newUser.avatar_url,
              tipo: resolvedTipo,
              ativo: true,
            };

            authClient.cacheCurrentUser({
              ...usuarioCompat,
              is_admin: resolvedIsAdmin,
              is_composer: resolvedIsComposer,
            });
            setUser(usuarioCompat);
            setProfile({
              ...usuarioCompat,
              plan: 'free',
              is_admin: resolvedIsAdmin,
              is_composer: resolvedIsComposer
            });
            return true;
          } else if (error) {
            console.error('❌ Erro ao criar usuário:', error);
          }
        }
      } catch (err: any) {
        console.error('❌ Erro ao sincronizar usuário:', err);
        const { resolvedIsAdmin, resolvedIsComposer, resolvedTipo } = resolveUserFlags(
          session.user.email,
          false,
          false
        );

        // Se falhar (tabela não existe, RLS, AbortError), criar perfil mínimo em memória
        const usuarioCompat: User = {
          id: String(session.user.id),
          email: session.user.email!,
          nome: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
          avatar_url: session.user.user_metadata?.avatar_url,
          tipo: resolvedTipo,
          ativo: true,
        };

        authClient.cacheCurrentUser({
          ...usuarioCompat,
          is_admin: resolvedIsAdmin,
          is_composer: resolvedIsComposer,
        });
        setUser(usuarioCompat);
        setProfile({
          ...usuarioCompat,
          plan: 'free',
          is_admin: resolvedIsAdmin,
          is_composer: resolvedIsComposer
        });
        return true;
      }
      return false;
    };

    const syncSessionWithFallback = async (session: any) => {
      if (!session?.user) return false;

      const synced = await Promise.race([
        syncUserFromSession(session),
        new Promise<boolean>((resolve) => {
          window.setTimeout(() => resolve(false), 4000);
        }),
      ]);

      if (!synced) {
        applySessionUser(session);
      }

      return true;
    };

    // O cache local serve apenas para compatibilidade visual após uma sessão válida.
    // Ele não pode restaurar uma sessão nem conceder autorização de forma autônoma.
    const hasUser = false;
    const hasFallbackAuth = false;
    localStorage.removeItem('auth_fallback');

    // Restaurar estado de gerenciamento se existir
    const storedComposerId = sessionStorage.getItem('managingComposerId');
    const storedComposerName = sessionStorage.getItem('managingComposerName');
    if (storedComposerId && storedComposerName) {
      setManagingComposerId(storedComposerId);
      setManagingComposerName(storedComposerName);
    }

    // Listener para mudanças de autenticação do Supabase
    const { data: { subscription } } = authClient.supabase.auth.onAuthStateChange(
      (event, session) => {
        const run = async () => {
        if (event === 'SIGNED_IN' && session?.user) {
          await syncSessionWithFallback(session);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION') {
          // Sessão inicial - verificar se há usuário
          if (session?.user) {
            await syncSessionWithFallback(session);
          } else if (!hasFallbackAuth) {
            clearStoredUser();
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          clearStoredUser();
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          await syncSessionWithFallback(session);
        }
        };

        setTimeout(() => {
          void run();
        }, 0);
      }
    );

    // Se já tem usuário carregado, podemos marcar como não loading
    if (hasUser && hasFallbackAuth) {
      setLoading(false);
    } else {
      // Timeout de segurança - se depois de 3s ainda estiver loading, desmarcar
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 3000);

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    }

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await authClient.supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        // Não há login de contingência sem JWT. Uma falha de Auth não pode abrir
        // uma sessão baseada em leitura anônima de perfis ou e-mails.
        throw new Error(
          error.message === 'Invalid login credentials'
            ? 'Email ou senha incorretos.'
            : error.message
        );
      }
      localStorage.removeItem('auth_fallback');
      if (data.session?.user) {
        const profileSynced = await Promise.race([
          Promise.resolve(
            authClient.supabase
              .from('users')
              .select('*')
              .eq('id', data.session.user.id)
              .single()
          )
            .then(({ data: dbUser }) => {
              if (!dbUser) return false;
              applyUser(dbUser);
              return true;
            })
            .catch(() => false),
          new Promise<boolean>((resolve) => {
            window.setTimeout(() => resolve(false), 4000);
          }),
        ]);

        if (!profileSynced) {
          applySessionUser(data.session);
        }

        setLoading(false);
      }
    } catch (error: any) {
      console.error('Sign-in error:', error?.message || error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, nome: string) => {
    try {
      await authClient.register({ nome, email, senha: password });
    } catch (error) {
      console.error('Sign-up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authClient.logout();
      setUser(null);
      setProfile(null);
      // Limpar estado de gerenciamento
      setManagingComposerId(null);
      setManagingComposerName(null);
      sessionStorage.removeItem('managingComposerId');
      sessionStorage.removeItem('managingComposerName');
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  const switchToComposer = (composerId: string | number, composerName: string) => {
    const resolvedComposerId = String(composerId);
    setManagingComposerId(resolvedComposerId);
    setManagingComposerName(composerName);
    sessionStorage.setItem('managingComposerId', resolvedComposerId);
    sessionStorage.setItem('managingComposerName', composerName);
  };

  const switchBackToSelf = () => {
    setManagingComposerId(null);
    setManagingComposerName(null);
    sessionStorage.removeItem('managingComposerId');
    sessionStorage.removeItem('managingComposerName');
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: profile?.is_admin || false,
    isComposer: profile?.is_composer || false,
    managingComposerId,
    managingComposerName,
    switchToComposer,
    switchBackToSelf,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
