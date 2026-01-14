/**
 * Cliente de Autenticação - Supabase Auth
 * Substitui completamente o sistema PHP
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rdogsfrplohxnemvtetn.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkb2dzZnJwbG9oeG5lbXZ0ZXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTM0OTYsImV4cCI6MjA3NTE2OTQ5Nn0.xCgnffZoXbw2W5eRsArjq2jKBZLLuRRi1Lr8xDPSK2g';

// Cliente Supabase para autenticação
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Usuario {
  id: number;
  auth_id: string;
  nome: string;
  email: string;
  avatar_url?: string;
  tipo: 'usuario' | 'compositor' | 'admin';
  ativo: number;
  plano?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  usuario: Usuario;
}

/**
 * Login com email e senha
 */
export async function login(email: string, senha: string): Promise<LoginResponse> {
  try {
    // 1. Autenticar com Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      throw new Error(authError.message === 'Invalid login credentials' 
        ? 'Email ou senha incorretos' 
        : authError.message);
    }

    if (!authData.user) {
      throw new Error('Usuário não encontrado');
    }

    // 2. Buscar dados do usuário na tabela usuarios
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (userError || !usuario) {
      console.error('User fetch error:', userError);
      throw new Error('Perfil de usuário não encontrado');
    }

    // 3. Salvar no localStorage para compatibilidade
    localStorage.setItem('user', JSON.stringify(usuario));

    return {
      success: true,
      message: 'Login realizado com sucesso',
      usuario,
    };
  } catch (error: any) {
    console.error('Erro no login:', error);
    throw error;
  }
}

/**
 * Registro de novo usuário
 */
export async function register(data: { nome: string; email: string; senha: string }): Promise<{ success: boolean; usuario: Usuario }> {
  try {
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.senha,
      options: {
        data: {
          nome: data.nome,
        },
      },
    });

    if (authError) {
      console.error('Supabase Auth signup error:', authError);
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Erro ao criar usuário');
    }

    // 2. Criar registro na tabela usuarios
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .insert({
        auth_id: authData.user.id,
        nome: data.nome,
        email: data.email,
        tipo: 'usuario',
        ativo: 1,
        plano: 'free',
      })
      .select()
      .single();

    if (userError) {
      console.error('User insert error:', userError);
      throw new Error('Erro ao criar perfil de usuário');
    }

    return {
      success: true,
      usuario,
    };
  } catch (error: any) {
    console.error('Erro no registro:', error);
    throw error;
  }
}

/**
 * Login com Google
 */
export async function googleLogin(idToken?: string): Promise<LoginResponse> {
  try {
    // Se tiver idToken, usar signInWithIdToken
    if (idToken) {
      const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Usuário não encontrado');

      // Buscar ou criar usuário
      let { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single();

      if (!usuario) {
        // Criar novo usuário
        const { data: newUser, error: insertError } = await supabase
          .from('usuarios')
          .insert({
            auth_id: authData.user.id,
            nome: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'Usuário',
            email: authData.user.email!,
            avatar_url: authData.user.user_metadata?.avatar_url,
            tipo: 'usuario',
            ativo: 1,
            plano: 'free',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        usuario = newUser;
      }

      localStorage.setItem('user', JSON.stringify(usuario));

      return {
        success: true,
        message: 'Login realizado com sucesso',
        usuario,
      };
    }

    // Fallback: OAuth popup
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (error) throw error;

    // O redirecionamento será feito automaticamente
    return {
      success: true,
      message: 'Redirecionando...',
      usuario: {} as Usuario,
    };
  } catch (error: any) {
    console.error('Erro no Google Login:', error);
    throw error;
  }
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
  localStorage.removeItem('user');
  localStorage.removeItem('auth_token');
}

/**
 * Verificar se está logado
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('user');
}

/**
 * Pegar usuário do localStorage
 */
export function getCurrentUser(): Usuario | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Pegar sessão atual do Supabase
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Atualizar dados do usuário
 */
export async function updateUserProfile(userId: number, data: Partial<Usuario>): Promise<Usuario> {
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .update(data)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  
  localStorage.setItem('user', JSON.stringify(usuario));
  return usuario;
}

/**
 * Verificar tipo de usuário
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.tipo === 'admin';
}

export function isCompositor(): boolean {
  const user = getCurrentUser();
  return user?.tipo === 'compositor';
}

/**
 * Listener de mudança de estado de auth
 */
export function onAuthStateChange(callback: (user: Usuario | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', session.user.id)
        .single();
      
      if (usuario) {
        localStorage.setItem('user', JSON.stringify(usuario));
        callback(usuario);
      } else {
        callback(null);
      }
    } else {
      localStorage.removeItem('user');
      callback(null);
    }
  });
}

// Exportação padrão
export const authClient = {
  login,
  register,
  googleLogin,
  logout,
  isAuthenticated,
  getCurrentUser,
  getSession,
  updateUserProfile,
  isAdmin,
  isCompositor,
  onAuthStateChange,
};

export default authClient;
