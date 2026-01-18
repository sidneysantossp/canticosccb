import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authClient from '@/lib/supabase-auth';
import type { Usuario } from '@/lib/supabase-auth';
// WebPush removed - Firebase dependency eliminated

interface User {
  id: number;
  email: string;
  nome: string;
  avatar_url?: string;
  tipo: 'usuario' | 'compositor' | 'admin';
  ativo: number;
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
    // Verificar se há usuário logado no localStorage
    const loadUser = () => {
      const currentUser = authClient.getCurrentUser();
      console.log('🔍 loadUser chamado, currentUser:', currentUser);
      if (currentUser) {
        setUser(currentUser);
        setProfile({
          ...currentUser,
          plan: 'free',
          is_admin: currentUser.tipo === 'admin',
          is_composer: currentUser.tipo === 'compositor'
        });
        return true;
      }
      return false;
    };

    // Carregar usuário imediatamente
    const hasUser = loadUser();
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
          // Aguardar um pouco para garantir que o localStorage foi atualizado
          setTimeout(() => {
            loadUser();
            setLoading(false);
          }, 100);
        } else if (event === 'INITIAL_SESSION') {
          // Sessão inicial - verificar se há usuário
          if (session?.user) {
            setTimeout(() => {
              loadUser();
              setLoading(false);
            }, 100);
          } else {
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Token atualizado, recarregar usuário
          loadUser();
        }
      }
    );
    
    // Se já tem usuário carregado, podemos marcar como não loading
    if (hasUser) {
      setLoading(false);
    } else {
      // Timeout de segurança - se depois de 2s ainda estiver loading, desmarcar
      const timeout = setTimeout(() => {
        console.log('⏰ Timeout de loading - desmarcando');
        setLoading(false);
      }, 2000);
      
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
      const response = await authClient.login(email, password);
      setUser(response.usuario);
      setProfile({
        ...response.usuario,
        plan: 'free',
        is_admin: response.usuario.tipo === 'admin',
        is_composer: response.usuario.tipo === 'compositor'
      });
      // WebPush registration removed - Firebase dependency eliminated
    } catch (error) {
      console.error('Sign-in error:', error);
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
