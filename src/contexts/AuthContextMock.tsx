import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authClient from '@/lib/auth-client';
import type { Usuario } from '@/lib/auth-client';
import { registerWebPushToken } from '@/lib/push/registerWebPush';

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
    const currentUser = authClient.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setProfile({
        ...currentUser,
        plan: 'free',
        is_admin: currentUser.tipo === 'admin',
        is_composer: currentUser.tipo === 'compositor'
      });
      // Tentar registrar token de push para usuário logado
      try { registerWebPushToken(currentUser.id, 'web'); } catch {}
    }
    
    // Restaurar estado de gerenciamento se existir
    const storedComposerId = sessionStorage.getItem('managingComposerId');
    const storedComposerName = sessionStorage.getItem('managingComposerName');
    if (storedComposerId && storedComposerName) {
      setManagingComposerId(parseInt(storedComposerId));
      setManagingComposerName(storedComposerName);
    }
    
    setLoading(false);
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
      try { registerWebPushToken(response.usuario.id, 'web'); } catch {}
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
      authClient.logout();
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
