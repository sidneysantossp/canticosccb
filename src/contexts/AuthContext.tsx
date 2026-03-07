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
  managingComposerId: number | null;
  managingComposerName: string | null;
  switchToComposer: (composerId: number, composerName: string) => void;
  switchBackToSelf: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [managingComposerId, setManagingComposerId] = useState<number | null>(null);
  const [managingComposerName, setManagingComposerName] = useState<string | null>(null);

  useEffect(() => {
    const clearStoredUser = () => {
      setUser(null);
      setProfile(null);
      localStorage.removeItem('user');
    };

    // Verificar se há usuário logado no localStorage
    const loadUser = () => {
      const currentUser = authClient.getCurrentUser();
      console.log('🔍 loadUser chamado, currentUser:', currentUser);
      if (currentUser) {
        console.log('🔐 Permissões (loadUser):', { tipo: currentUser.tipo });
        // Mapear para compatibilidade com interface User
        const userCompat: User = {
          id: String(currentUser.id),
          email: currentUser.email,
          nome: currentUser.nome || currentUser.name,
          avatar_url: currentUser.avatar_url,
          tipo: currentUser.tipo || 'usuario',
          ativo: currentUser.ativo ?? 1,
        };
        setUser(userCompat);
        setProfile({
          ...userCompat,
          plan: currentUser.plano === 'premium' ? 'premium' : 'free',
          is_admin: currentUser.is_admin || currentUser.tipo === 'admin',
          is_composer: currentUser.is_composer || currentUser.tipo === 'compositor'
        });
        return true;
      }
      return false;
    };

    // Função para buscar/criar usuário baseado na sessão Supabase
    const syncUserFromSession = async (session: any) => {
      if (!session?.user) return false;
      
      try {
        // Buscar usuário pelo id (UUID)
        const { data: dbUser } = await authClient.supabase
          .from('users')
          .select('*')
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
              .select('*')
              .single();

            if (!updateError && updatedUser) {
              user = updatedUser;
            }
          }

          console.log('✅ Usuário encontrado no banco:', user.name);
          console.log('🔐 Permissões:', { is_admin: user.is_admin, is_composer: user.is_composer });
          
          // Mapear para compatibilidade com a interface User
          const usuarioCompat: User = {
            id: String(user.id),
            email: user.email,
            nome: user.name,
            avatar_url: user.avatar_url,
            tipo: user.is_admin ? 'admin' : user.is_composer ? 'compositor' : 'usuario',
            ativo: user.status !== 'inactive' && !user.is_blocked,
          };
          
          localStorage.setItem('user', JSON.stringify(usuarioCompat));
          setUser(usuarioCompat);
          setProfile({
            ...usuarioCompat,
            plan: user.plan === 'premium' ? 'premium' : 'free',
            is_admin: user.is_admin,
            is_composer: user.is_composer
          });
          return true;
        } else {
          console.log('⚠️ Usuário não encontrado no banco, criando/atualizando...');
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
            .select()
            .single();
          
          if (!error && newUser) {
            console.log('✅ Usuário criado/atualizado:', newUser.name);
            
            // Mapear para compatibilidade
            const usuarioCompat: User = {
              id: String(newUser.id),
              email: newUser.email,
              nome: newUser.name,
              avatar_url: newUser.avatar_url,
              tipo: 'usuario',
              ativo: true,
            };
            
            localStorage.setItem('user', JSON.stringify(usuarioCompat));
            setUser(usuarioCompat);
            setProfile({
              ...usuarioCompat,
              plan: 'free',
              is_admin: false,
              is_composer: false
            });
            return true;
          } else if (error) {
            console.error('❌ Erro ao criar usuário:', error);
          }
        }
      } catch (err: any) {
        console.error('❌ Erro ao sincronizar usuário:', err);
        // Se falhar (tabela não existe, RLS, AbortError), criar perfil mínimo em memória
        console.log('🔄 Criando perfil mínimo em memória...');
        const usuarioCompat: User = {
          id: String(session.user.id),
          email: session.user.email!,
          nome: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
          avatar_url: session.user.user_metadata?.avatar_url,
          tipo: 'usuario',
          ativo: true,
        };
        
        localStorage.setItem('user', JSON.stringify(usuarioCompat));
        setUser(usuarioCompat);
        setProfile({
          ...usuarioCompat,
          plan: 'free',
          is_admin: false,
          is_composer: false
        });
        console.log('✅ Perfil mínimo criado em memória - login não bloqueado');
        return true;
      }
      return false;
    };

    // Carregar usuário imediatamente
    const hasUser = loadUser();
    const hasFallbackAuth = localStorage.getItem('auth_fallback') === 'true';
    console.log('🔐 Auth init, hasUser:', hasUser);
    
    // Restaurar estado de gerenciamento se existir
    const storedComposerId = sessionStorage.getItem('managingComposerId');
    const storedComposerName = sessionStorage.getItem('managingComposerName');
    if (storedComposerId && storedComposerName) {
      setManagingComposerId(parseInt(storedComposerId));
      setManagingComposerName(storedComposerName);
    }
    
    // Listener para mudanças de autenticação do Supabase
    const { data: { subscription } } = authClient.supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Sincronizar usuário do banco
          const synced = await syncUserFromSession(session);
          console.log('🔄 Sync após SIGNED_IN:', synced);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION') {
          // Sessão inicial - verificar se há usuário
          if (session?.user) {
            // Tentar carregar do localStorage primeiro
            if (!loadUser()) {
              // Se não encontrou, sincronizar do banco
              await syncUserFromSession(session);
            }
          } else if (!hasFallbackAuth) {
            clearStoredUser();
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          clearStoredUser();
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Token atualizado, recarregar usuário
          loadUser();
        }
      }
    );
    
    // Se já tem usuário carregado, podemos marcar como não loading
    if (hasUser && hasFallbackAuth) {
      setLoading(false);
    } else {
      // Timeout de segurança - se depois de 3s ainda estiver loading, desmarcar
      const timeout = setTimeout(() => {
        console.log('⏰ Timeout de loading - desmarcando');
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
      console.log('🔑 [signIn] Tentando signInWithPassword...');
      const { data, error } = await authClient.supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('🔑 [signIn] Erro do Supabase Auth:', error.message, 'status:', error.status);

        // Se Auth retorna 500 (RLS quebrando schema), usar fallback REST
        if (error.message?.includes('Database error querying schema') || error.status === 500) {
          console.warn('⚠️ Auth 500 - usando fallback REST para login...');

          // Buscar usuário via REST (funciona com anon key)
          const { data: dbUser, error: dbError } = await authClient.supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          if (dbError || !dbUser) {
            throw new Error('Email ou senha incorretos.');
          }

          // Marcar como sessão fallback (sem JWT)
          const usuarioCompat: User = {
            id: String(dbUser.id),
            email: dbUser.email,
            nome: dbUser.name,
            avatar_url: dbUser.avatar_url,
            tipo: dbUser.is_admin ? 'admin' : dbUser.is_composer ? 'compositor' : 'usuario',
            ativo: dbUser.status !== 'inactive' && !dbUser.is_blocked,
          };

          localStorage.setItem('user', JSON.stringify(usuarioCompat));
          localStorage.setItem('auth_fallback', 'true');
          setUser(usuarioCompat);
          setProfile({
            ...usuarioCompat,
            plan: dbUser.plan === 'premium' ? 'premium' : 'free',
            is_admin: dbUser.is_admin === true,
            is_composer: dbUser.is_composer === true,
          });
          console.log('✅ Fallback login OK:', dbUser.name, '| admin:', dbUser.is_admin);
          console.warn('⚠️ ATENÇÃO: Login sem JWT. Operações admin usarão REST API.');
          return;
        }

        throw new Error(
          error.message === 'Invalid login credentials'
            ? 'Email ou senha incorretos.'
            : error.message
        );
      }
      console.log('✅ [signIn] Login OK, session:', !!data?.session, 'user:', data?.user?.email);
      localStorage.removeItem('auth_fallback');
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

  const switchToComposer = (composerId: number, composerName: string) => {
    setManagingComposerId(composerId);
    setManagingComposerName(composerName);
    sessionStorage.setItem('managingComposerId', composerId.toString());
    sessionStorage.setItem('managingComposerName', composerName);
    console.log(`🔄 Alternando para gerenciar: ${composerName} (ID: ${composerId})`);
  };

  const switchBackToSelf = () => {
    setManagingComposerId(null);
    setManagingComposerName(null);
    sessionStorage.removeItem('managingComposerId');
    sessionStorage.removeItem('managingComposerName');
    console.log('🔄 Voltando para conta própria');
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
