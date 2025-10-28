// Sistema de autenticação simples como fallback
import { mockUsers } from '@/data/mockData';

const AUTH_KEY = 'simple-auth';

export interface SimpleAuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'composer' | 'admin';
  isPremium: boolean;
  createdAt: string;
}

export interface SimpleAuthState {
  isAuthenticated: boolean;
  user: SimpleAuthUser | null;
}

export function getSimpleAuth(): SimpleAuthState {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) {
      return { isAuthenticated: false, user: null };
    }
    
    const parsed = JSON.parse(stored);
    return {
      isAuthenticated: parsed.isAuthenticated || false,
      user: parsed.user || null
    };
  } catch (error) {
    console.error('Erro ao ler simple auth:', error);
    return { isAuthenticated: false, user: null };
  }
}

export function setSimpleAuth(user: SimpleAuthUser) {
  try {
    const authState: SimpleAuthState = {
      isAuthenticated: true,
      user
    };
    
    localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
    console.log('✅ Simple auth salvo:', authState);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar simple auth:', error);
    return false;
  }
}

export function clearSimpleAuth() {
  try {
    localStorage.removeItem(AUTH_KEY);
    console.log('✅ Simple auth limpo');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar simple auth:', error);
    return false;
  }
}

export function simpleLogin(email: string): SimpleAuthUser | null {
  const mockUser = mockUsers.find(u => u.email === email) || mockUsers[0];
  
  if (mockUser) {
    const user: SimpleAuthUser = {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role || 'user',
      isPremium: mockUser.isPremium,
      createdAt: mockUser.createdAt
    };
    
    if (setSimpleAuth(user)) {
      return user;
    }
  }
  
  return null;
}

export function debugSimpleAuth() {
  const auth = getSimpleAuth();
  console.log('=== SIMPLE AUTH DEBUG ===');
  console.log('isAuthenticated:', auth.isAuthenticated);
  console.log('user:', auth.user);
  console.log('localStorage:', localStorage.getItem(AUTH_KEY));
  return auth;
}
