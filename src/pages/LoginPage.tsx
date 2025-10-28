import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextMock';
import { googleLogin } from '@/lib/auth-client';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, profile } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const logoSrc = 'https://canticosccb.com.br/logo-canticos-ccb.png';
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGsiReady, setIsGsiReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  // Redirecionar quando o perfil carregar após login
  useEffect(() => {
    if (profile) {
      console.log('✅ LoginPage - Profile loaded, redirecting...', profile);
      
      // Redirecionamento imediato para rotas corretas
      if (profile.is_composer) {
        navigate('/composer');
      } else if (profile.is_admin) {
        navigate('/admin');
      } else {
        navigate('/profile'); // Redireciona usuário comum para o perfil
      }
      
      // Resetar loading após redirecionamento
      setIsLoading(false);
    }
  }, [profile, navigate, location.state]);

  useEffect(() => {
    const id = 'google-identity-services';
    const initGsi = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id) return;
      try {
        g.accounts.id.initialize({
          client_id: '183469535157-5dlvid5od5i2ogq6g4e6bqq25rsj3mo3.apps.googleusercontent.com',
          callback: async (response: any) => {
            try {
              const idToken = response?.credential;
              if (!idToken) throw new Error('Credencial inválida');
              await googleLogin(idToken);
              window.location.href = '/onboarding';
            } catch (err) {
              setError('Falha no login com Google. Tente novamente.');
            } finally {
              setIsGoogleLoading(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          itp_support: true,
          ux_mode: 'popup',
        });

        if (googleBtnRef.current) {
          const container = googleBtnRef.current;
          const targetWidth = Math.min(container.offsetWidth || 360, 400);
          container.innerHTML = '';
          g.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            locale: 'pt-BR',
            width: targetWidth,
          });
        }

        setIsGsiReady(true);
      } catch (e) {}
    };

    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).google?.accounts?.id) {
        initGsi();
      } else {
        existing.addEventListener('load', initGsi as any, { once: true } as any);
      }
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = initGsi;
    document.head.appendChild(s);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔑 LoginPage - Chamando signIn...');
      
      // Removido timeout temporariamente para debug
      await signIn(email, password);
      
      console.log('✅ LoginPage - Login bem-sucedido!');
      // O redirecionamento acontecerá automaticamente via useEffect quando profile carregar
    } catch (err: any) {
      console.error('❌ Login error:', err);
      const msg = String(err?.message || '');
      const isSchema500 = msg.includes('Database error querying schema') || msg.includes('500');
      if (msg.includes('timeout')) {
        setError('Tempo esgotado. Verifique sua conexão e tente novamente.');
      } else if (msg.toLowerCase().includes('credentials')) {
        setError('Email ou senha incorretos.');
      } else if (isSchema500) {
        setError('Estamos com instabilidade. Tente novamente em instantes.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
      
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    console.log('🧹 Limpando sessão...');
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-primary to-background-tertiary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Botão Voltar */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar para início</span>
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <img 
              src={logoSrc} 
              alt="Cânticos CCB" 
              className="w-[250px] mx-auto object-contain mb-2"
              referrerPolicy="no-referrer"
            />
          </Link>
          <p className="text-text-muted">Entre para continuar ouvindo</p>
        </div>

        {/* Login Form */}
        <div className="bg-background-secondary rounded-2xl p-8 shadow-xl border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 bg-background-tertiary text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                />
                <span className="ml-2 text-sm text-text-muted">Lembrar-me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-500 hover:text-primary-400 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white font-semibold py-3 rounded-full hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div ref={googleBtnRef} className="w-full mt-2 flex justify-center" />

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              Não tem uma conta?{' '}
              <Link
                to="/register"
                className="text-primary-500 hover:text-primary-400 font-semibold transition-colors"
              >
                Registre-se
              </Link>
            </p>
          </div>
        </div>

        {/* Botão Limpar Sessão */}
        <div className="mt-6 text-center">
          <button
            onClick={clearSession}
            className="text-xs text-red-400 hover:text-red-300 transition-colors underline"
          >
            🧹 Limpar Sessão (Debug)
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-text-muted text-xs">
          <p>
            Ao continuar, você concorda com nossos{' '}
            <Link to="/terms" className="hover:text-white transition-colors">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link to="/privacy" className="hover:text-white transition-colors">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
