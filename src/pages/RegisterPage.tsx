import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextMock';
import { checkEmailExists, googleLogin } from '@/lib/auth-client';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const logoSrc = 'https://canticosccb.com.br/logo-canticos-ccb.png';
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGsiReady, setIsGsiReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  // Load Google Identity Services script and render official button
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
              console.error('Google Sign-In error:', err);
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
      } catch (e) {
        console.error('GSI init error:', e);
      }
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

  // Sem fallback manual — apenas botão oficial do Google

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Resetar status do email quando o usuário digitar
    if (name === 'email') {
      setEmailStatus('idle');
    }
  };

  const handleEmailBlur = async () => {
    const email = formData.email.trim();
    
    // Validar formato
    if (!email || !email.includes('@')) {
      return;
    }
    
    setEmailStatus('checking');
    
    try {
      const exists = await checkEmailExists(email);
      setEmailStatus(exists ? 'taken' : 'available');
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      setEmailStatus('idle');
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return false;
    }

    if (emailStatus === 'taken') {
      setError('Este email já está cadastrado. Use outro email ou faça login.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    if (!acceptTerms) {
      setError('Você deve aceitar os termos de uso');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Mock de UX (pequeno delay)
      await new Promise(resolve => setTimeout(resolve, 500));

      await signUp(formData.email, formData.password, formData.name);
      navigate('/onboarding');
    } catch (err: any) {
      console.error('❌ Register error:', err);
      
      const msg = String(err?.message || '').toLowerCase();
      
      // Mensagens específicas por tipo de erro
      if (msg.includes('already registered') || msg.includes('user already exists')) {
        setError('Este email já está cadastrado. Tente fazer login ou use outro email.');
      } else if (msg.includes('invalid email')) {
        setError('Email inválido. Verifique e tente novamente.');
      } else if (msg.includes('password')) {
        setError('Senha muito fraca. Use pelo menos 6 caracteres com letras e números.');
      } else if (msg.includes('database error') || msg.includes('500')) {
        setError('Estamos com instabilidade. Tente novamente em instantes.');
      } else {
        setError('Erro ao criar conta. Verifique seus dados e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    const password = formData.password;
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    return Math.min(strength, 3);
  };

  const strengthLevel = passwordStrength();
  const strengthColors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthLabels = ['Fraca', 'Média', 'Forte'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-primary to-background-tertiary flex items-center justify-center p-4">
      <div className="w-full max-w-md relative pt-2">
        {/* Botão Voltar */}
        <Link
          to="/"
          className="fixed top-2 left-2 md:top-3 md:left-6 z-50 inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar para início</span>
        </Link>

        {/* Logo */}
        <div className="text-center mb-4">
          <img 
            src={logoSrc} 
            alt="Cânticos CCB" 
            className="w-[250px] mx-auto object-contain mb-2"
            referrerPolicy="no-referrer"
          />
          <p className="text-text-muted">Junte-se a milhares de ouvintes</p>
        </div>

        {/* Register Form */}
        <div className="bg-background-secondary rounded-2xl p-8 shadow-xl border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Nome completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="João Silva"
                className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  placeholder="seu@email.com"
                  className={`w-full px-4 py-3 bg-background-tertiary border rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    emailStatus === 'taken' 
                      ? 'border-red-500 focus:ring-red-500' 
                      : emailStatus === 'available'
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-700 focus:ring-primary-500'
                  }`}
                  required
                />
                {emailStatus === 'checking' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                  </div>
                )}
                {emailStatus === 'available' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                )}
                {emailStatus === 'taken' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>
              
              {/* Email Status Messages */}
              {emailStatus === 'available' && (
                <p className="mt-2 text-sm text-green-500 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Email disponível!
                </p>
              )}
              {emailStatus === 'taken' && (
                <div className="mt-2">
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Este email já está cadastrado
                  </p>
                  <Link 
                    to="/login" 
                    className="text-primary-500 hover:text-primary-400 text-sm font-medium mt-1 inline-block"
                  >
                    Já tem conta? Fazer login →
                  </Link>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
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
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          level < strengthLevel ? strengthColors[strengthLevel - 1] : 'bg-gray-700'
                        } transition-all`}
                      />
                    ))}
                  </div>
                  {strengthLevel > 0 && (
                    <p className="text-xs text-text-muted">
                      Força: <span className={`font-medium ${strengthLevel === 3 ? 'text-green-500' : strengthLevel === 2 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {strengthLabels[strengthLevel - 1]}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {formData.password && (
              <>
                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Digite a senha novamente"
                      className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <div className="flex items-center gap-1 mt-2 text-green-500 text-xs">
                      <Check className="w-3 h-3" />
                      <span>As senhas coincidem</span>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Terms */}
            <div>
              <label className="flex items-start cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-700 bg-background-tertiary text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                />
                <span className="ml-2 text-sm text-text-muted group-hover:text-white transition-colors">
                  Aceito os{' '}
                  <Link to="/terms" className="text-primary-500 hover:text-primary-400">
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link to="/privacy" className="text-primary-500 hover:text-primary-400">
                    Política de Privacidade
                  </Link>
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-500 text-sm">{error}</p>
                {error.includes('já está cadastrado') && (
                  <Link 
                    to="/login" 
                    className="text-primary-500 hover:text-primary-400 text-sm font-medium mt-2 inline-block"
                  >
                    Ir para o login →
                  </Link>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-500 text-black font-semibold py-3 rounded-full hover:bg-primary-400 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>

            <div ref={googleBtnRef} className="w-full mt-2 flex justify-center" />
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="text-primary-500 hover:text-primary-400 font-semibold transition-colors"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
