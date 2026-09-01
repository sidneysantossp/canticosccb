/**
 * Cliente de Autenticação - Supabase Auth
 * Usa a tabela "users" que sincroniza com auth.users
 */
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_SITE_URL, normalizeSiteUrl } from '@/utils/siteUrl';
import { rememberAuthReturnTo } from '@/lib/authReturnTo';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠️ Supabase credentials not found in environment variables');
}

// Cliente Supabase para autenticação
const createSupabaseClient = (options?: Parameters<typeof createClient>[2]) => (
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options)
    : createClient('https://placeholder.supabase.co', 'placeholder', options)
);

export const supabase = createSupabaseClient();

// Cliente público sem sessão do usuário, para buscas e listagens abertas.
export const publicSupabase = createSupabaseClient({
  auth: {
    storageKey: 'canticosccb-public-auth',
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Interface usando a estrutura real da tabela users
export interface Usuario {
  id: string; // UUID
  email: string;
  name?: string;
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

const USER_STORAGE_KEY = 'user';
const AUTH_TOKEN_STORAGE_KEY = 'auth_token';
const AUTH_FALLBACK_STORAGE_KEY = 'auth_fallback';
const ENABLE_GOOGLE_AUTH = String(import.meta.env.VITE_ENABLE_GOOGLE_AUTH || '').trim().toLowerCase() === 'true';

/**
 * Papéis administrativos e de compositor são definidos exclusivamente no
 * perfil autorizado pelo banco. Nunca derive privilégios de e-mail, variáveis
 * VITE_* ou valores persistidos no navegador.
 */

export function isGoogleAuthEnabled(): boolean {
  return ENABLE_GOOGLE_AUTH;
}

export function cacheCurrentUser(usuario: Usuario | null): void {
  if (typeof localStorage === 'undefined') return;

  if (!usuario) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));
}

export function clearAuthStorage(): void {
  if (typeof localStorage === 'undefined') return;

  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_FALLBACK_STORAGE_KEY);
}

function getAuthRedirectBase(): string {
  const envUrl = String(import.meta.env.VITE_APP_URL || '').trim();
  if (envUrl) {
    return normalizeSiteUrl(envUrl, DEFAULT_SITE_URL);
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeSiteUrl(window.location.origin, DEFAULT_SITE_URL);
  }

  return DEFAULT_SITE_URL;
}

// Função helper para mapear campos para compatibilidade
function mapUserForCompatibility(user: any): Usuario {
  const isAdmin = user.is_admin === true;
  const isComposer = user.is_composer === true;
  return {
    ...user,
    is_admin: isAdmin,
    is_composer: isComposer,
    nome: user.name,
    plano: user.plan || 'free',
    tipo: isAdmin ? 'admin' : isComposer ? 'compositor' : 'usuario',
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
    cacheCurrentUser(usuario);

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
          name: data.nome,
        },
        emailRedirectTo: `${getAuthRedirectBase()}/auth/callback?type=email_verification`,
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

    // 2. Criar/atualizar registro na tabela users
    let user = null;
    let userError = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
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
          break;
        }
      } catch (e: any) {
        console.error(`❌ Tentativa ${attempt} falhou:`, e.message);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    // Se falhou ao criar, tentar buscar (pode já existir)
    if (!user) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();
      
      if (existingUser) {
        user = existingUser;
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

    // Só persiste no cliente quando existe sessão ativa.
    if (authData.session) {
      cacheCurrentUser(usuario);
      localStorage.removeItem(AUTH_FALLBACK_STORAGE_KEY);
    } else {
      cacheCurrentUser(null);
      localStorage.removeItem(AUTH_FALLBACK_STORAGE_KEY);
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
 * Disparar email de recuperação de senha
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const redirectBase = getAuthRedirectBase();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${redirectBase}/auth/callback?type=recovery`,
  });

  if (error) {
    throw error;
  }
}

/**
 * Atualizar senha do usuário autenticado no fluxo de recovery
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
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
export async function googleOAuthLogin(returnTo?: string | null): Promise<void> {
  if (!isGoogleAuthEnabled()) {
    throw new Error('Login com Google temporariamente indisponível.');
  }

  try {
    const currentPage = typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : null;
    rememberAuthReturnTo(returnTo || currentPage);
    const redirectBase = getAuthRedirectBase();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${redirectBase}/auth/callback`,
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
    cacheCurrentUser(usuario);

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
  clearAuthStorage();
}

/**
 * Verificar se está logado
 */
export function isAuthenticated(): boolean {
  return !!getCurrentUser();
}

/**
 * Pegar usuário do localStorage
 */
export function getCurrentUser(): Usuario | null {
  if (typeof localStorage === 'undefined') return null;

  const userStr = localStorage.getItem(USER_STORAGE_KEY);
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
  cacheCurrentUser(usuario);
  return usuario;
}

/**
 * Verificar tipo de usuário
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.is_admin === true;
}

export function isCompositor(): boolean {
  const user = getCurrentUser();
  return user?.is_composer === true;
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
        cacheCurrentUser(usuario);
        callback(usuario);
      } else {
        callback(null);
      }
    } else {
      cacheCurrentUser(null);
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
  requestPasswordReset,
  updatePassword,
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
