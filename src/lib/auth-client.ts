/**
 * Cliente de Autenticação - MySQL Auth
 * Substitui Firebase Auth
 */

// Usar proxy do Vite em desenvolvimento (/api → http://localhost/1canticosccb/api)
const API_BASE_URL = '/api';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  avatar_url?: string;
  tipo: 'usuario' | 'compositor' | 'admin';
  ativo: number;
  ultimo_acesso?: string;
  created_at?: string;
  updated_at?: string;
}

export async function googleLogin(idToken: string): Promise<GoogleLoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google-login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao autenticar com Google');
    }
    if (data.token && data.usuario) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.usuario));
    }
    return data;
  } catch (error) {
    console.error('Erro no Google Login:', error);
    throw error;
  }
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  usuario: Usuario;
}

export interface RegisterData {
  nome: string;
  email: string;
  senha: string;
}

export interface ChangePasswordData {
  email: string;
  senha_atual: string;
  senha_nova: string;
}

export interface GoogleLoginResponse {
  success: boolean;
  message: string;
  token: string;
  usuario: Usuario;
}

/**
 * Login
 */
export async function login(email: string, senha: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao fazer login');
    }

    // Salvar token no localStorage
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.usuario));
    }

    return data;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

/**
 * Registro
 */
export async function register(data: RegisterData): Promise<{ success: boolean; usuario: Usuario }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao registrar');
    }

    return result;
  } catch (error) {
    console.error('Erro no registro:', error);
    throw error;
  }
}

/**
 * Logout
 */
export function logout(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

/**
 * Verificar se está logado
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token');
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
 * Pegar token
 */
export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Alterar senha
 */
export async function changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/change-password.php`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao alterar senha');
    }

    return result;
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    throw error;
  }
}

/**
 * Verificar se email já existe
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check-email.php?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    
    if (!response.ok) {
      return false;
    }
    
    return data.exists || false;
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return false;
  }
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

// Exportações nomeadas
export const authClient = {
  login,
  register,
  googleLogin,
  logout,
  changePassword,
  checkEmailExists,
  isAuthenticated,
  getCurrentUser,
  getToken,
  isAdmin,
  isCompositor,
};

export default authClient;
