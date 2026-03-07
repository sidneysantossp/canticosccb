/**
 * Cliente de Autenticação - Supabase Auth
 * Usa a tabela "users" que sincroniza com auth.users
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠️ Supabase credentials not found in environment variables');
}

// Cliente Supabase para autenticação
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createClient('https://placeholder.supabase.co', 'placeholder');

// Interface usando a estrutura real da tabela users
export interface Usuario {
  id: string; // UUID
  email: string;
  name: string;
  nome?: string; // Alias para compatibilidade
  avatar_url?: string;
  phone?: string;
  birthdate?: string;
  location?: string;
  plan?: string;
  plano?: string; // Alias para compatibilidade
  status?: string;
  email_verified?: boolean;
  is_admin?: boolean;
  is_composer?: boolean;
  is_blocked?: boolean;
  tipo_usuario?: string;
  tipo?: 'usuario' | 'compositor' | 'admin'; // Alias para compatibilidade
  ativo?: number | boolean; // Alias para compatibilidade
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  usuario: Usuario;
}

// Função helper para mapear campos para compatibilidade
function mapUserForCompatibility(user: any): Usuario {
  return {
    ...user,
    nome: user.name,
    plano: user.plan || 'free',
    tipo: user.is_admin ? 'admin' : user.is_composer ? 'compositor' : 'usuario',
    ativo: user.status !== 'inactive' && !user.is_blocked,
  };
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

    // 2. Buscar dados do usuário na tabela users (id = auth.user.id)
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !user) {
      console.error('User fetch error:', userError);

      // Tentar criar/atualizar o próprio perfil (caso não exista ainda)
      try {
        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .upsert(
            {
              id: authData.user.id,
              email: authData.user.email!,
              name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'Usuário',
              plan: 'free',
              status: 'active',
              is_admin: false,
              is_composer: false,
              is_blocked: false,
              email_verified: !!authData.user.email_confirmed_at,
            },
            { onConflict: 'id' }
          )
          .select()
          .single();

        if (!createError && createdUser) {
          user = createdUser;
          userError = null;
        }
      } catch {}

      // Se ainda falhar, não bloquear o login: retornar um usuário mínimo
      if (!user) {
        user = {
          id: authData.user.id,
          email: authData.user.email!,
          name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'Usuário',
          plan: 'free',
          status: 'active',
          is_admin: false,
          is_composer: false,
          is_blocked: false,
          email_verified: !!authData.user.email_confirmed_at,
        } as any;
      }
    }

    const usuario = mapUserForCompatibility(user);

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
    console.log('🔵 Iniciando registro para:', data.email);
    
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.senha,
      options: {
        data: {
          name: data.nome,
        },
        emailRedirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/callback?type=email_verification`,
      },
    });

    if (authError) {
      console.error('❌ Supabase Auth signup error:', authError);
      
      if (authError.message.includes('already registered')) {
        throw new Error('Este email já está cadastrado. Tente fazer login.');
      } else if (authError.message.includes('invalid email')) {
        throw new Error('Email inválido. Verifique e tente novamente.');
      } else if (authError.message.includes('password')) {
        throw new Error('Senha muito fraca. Use pelo menos 6 caracteres.');
      }
      
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Erro ao criar usuário');
    }

    console.log('✅ Usuário criado no Supabase Auth:', authData.user.id);

    // 2. Criar/atualizar registro na tabela users
    let user = null;
    let userError = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt} de criar perfil na tabela users...`);
        
        const result = await supabase
          .from('users')
          .upsert({
            id: authData.user.id, // UUID do auth.users
            email: data.email,
            name: data.nome,
            plan: 'free',
            status: 'active',
            is_admin: false,
            is_composer: false,
            is_blocked: false,
            email_verified: !!authData.user.email_confirmed_at,
          }, { onConflict: 'id' })
          .select()
          .single();
        
        user = result.data;
        userError = result.error;
        
        if (!userError && user) {
          console.log(`✅ Perfil criado na tentativa ${attempt}`);
          break;
        }
        
        console.log(`⚠️ Tentativa ${attempt} - erro:`, result.error?.message);
      } catch (e: any) {
        console.error(`❌ Tentativa ${attempt} falhou:`, e.message);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    // Se falhou ao criar, tentar buscar (pode já existir)
    if (!user) {
      console.log('🔄 Tentando buscar usuário existente...');
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();
      
      if (existingUser) {
        user = existingUser;
        console.log('✅ Usuário já existia:', user.email);
      }
    }

    if (!user) {
      console.error('❌ Não foi possível criar/buscar perfil');
      // Mesmo assim, retornar um objeto mínimo para permitir o registro
      user = {
        id: authData.user.id,
        email: data.email,
        name: data.nome,
        plan: 'free',
        status: 'active',
        is_admin: false,
        is_composer: false,
      };
    }

    const usuario = mapUserForCompatibility(user);
    console.log('✅ Registro concluído:', usuario.email);

    // Só persiste no cliente quando existe sessão ativa.
    if (authData.session) {
      localStorage.setItem('user', JSON.stringify(usuario));
      localStorage.removeItem('auth_fallback');
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_fallback');
    }

    return {
      success: true,
      usuario,
    };
  } catch (error: any) {
    console.error('❌ Erro no registro:', error);
    throw error;
  }
}

/**
 * Login com Google usando ID Token (Google Identity Services)
 */
export async function googleLogin(idToken: string): Promise<void> {
  try {
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      console.error('Erro no Google ID Token Login:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Erro no Google Login:', error);
    throw error;
  }
}

/**
 * Login com Google usando OAuth do Supabase (Redirect)
 */
export async function googleOAuthLogin(): Promise<void> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Erro no Google OAuth:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Erro no Google Login:', error);
    throw error;
  }
}

/**
 * Processar callback do OAuth (chamar após redirecionamento)
 */
export async function handleOAuthCallback(): Promise<LoginResponse> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw new Error('Sessão não encontrada');
    }

    // Buscar ou criar usuário
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!user || !user.email_verified) {
      const { data: syncedUser, error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          name: user?.name || session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email!,
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || user?.avatar_url,
          plan: user?.plan || 'free',
          status: user?.status || 'active',
          is_admin: user?.is_admin || false,
          is_composer: user?.is_composer || false,
          is_blocked: user?.is_blocked || false,
          email_verified: !!session.user.email_confirmed_at,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (upsertError) throw upsertError;
      user = syncedUser;
    }

    const usuario = mapUserForCompatibility(user);
    localStorage.setItem('user', JSON.stringify(usuario));

    return {
      success: true,
      message: 'Login realizado com sucesso',
      usuario,
    };
  } catch (error: any) {
    console.error('Erro ao processar callback OAuth:', error);
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
  localStorage.removeItem('auth_fallback');
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
export async function updateUserProfile(userId: string, data: Partial<Usuario>): Promise<Usuario> {
  // Mapear campos de compatibilidade para campos reais
  const updateData: any = { ...data };
  if (data.nome) updateData.name = data.nome;
  if (data.plano) updateData.plan = data.plano;
  delete updateData.nome;
  delete updateData.plano;
  delete updateData.tipo;
  delete updateData.ativo;

  const { data: user, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  const usuario = mapUserForCompatibility(user);
  localStorage.setItem('user', JSON.stringify(usuario));
  return usuario;
}

/**
 * Verificar tipo de usuário
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.is_admin === true || user?.tipo === 'admin';
}

export function isCompositor(): boolean {
  const user = getCurrentUser();
  return user?.is_composer === true || user?.tipo === 'compositor';
}

/**
 * Listener de mudança de estado de auth
 */
export function onAuthStateChange(callback: (user: Usuario | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (user) {
        const usuario = mapUserForCompatibility(user);
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
  handleOAuthCallback,
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
