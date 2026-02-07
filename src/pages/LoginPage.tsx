import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { googleLogin } from '@/lib/supabase-auth';

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

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setError('');
      await googleLogin();
      // O redirecionamento será feito automaticamente pelo Supabase
    } catch (err: any) {
      console.error('Erro no Google Login:', err);
      setError('Falha no login com Google. Tente novamente.');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔑 LoginPage - Chamando signIn...');
      await signIn(email, password);
      console.log('✅ LoginPage - Login bem-sucedido!');
    } catch (err: any) {
      console.error('❌ Login error:', err?.message || err);
      const msg = String(err?.message || '');
      if (msg.includes('timeout') || msg.includes('Failed to fetch')) {
        setError('Tempo esgotado. Verifique sua conexão e tente novamente.');
      } else if (msg.toLowerCase().includes('credentials') || msg.toLowerCase().includes('incorretos')) {
        setError('Email ou senha incorretos.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }

      setIsLoading(false);
    }
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

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full mt-4 bg-white text-gray-700 font-semibold py-3 px-4 rounded-full border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {isGoogleLoading ? 'Conectando...' : 'Continuar com Google'}
          </button>

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
