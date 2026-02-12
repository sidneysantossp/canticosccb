import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase-auth';

const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const email = (location.state as any)?.email || '';
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/callback?type=email_verification`,
        },
      });
      if (error) throw error;
      setResent(true);
      setCountdown(60);
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      console.error('Erro ao reenviar email:', err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-primary to-background-tertiary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Botão Voltar */}
        <Link
          to="/register"
          className="fixed top-2 left-2 md:top-3 md:left-6 z-50 inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </Link>

        <div className="bg-background-secondary rounded-2xl p-8 shadow-xl border border-gray-800 text-center">
          {/* Ícone de email */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-500/20 rounded-full mb-6">
            <Mail className="w-12 h-12 text-primary-500" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">
            Verifique seu email
          </h1>

          <p className="text-gray-400 mb-2">
            Enviamos um link de confirmação para:
          </p>

          {email && (
            <p className="text-primary-400 font-semibold text-lg mb-6 break-all">
              {email}
            </p>
          )}

          {!email && (
            <p className="text-primary-400 font-semibold text-lg mb-6">
              seu email cadastrado
            </p>
          )}

          {/* Instruções */}
          <div className="bg-background-tertiary rounded-xl p-5 mb-6 text-left space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-500 text-xs font-bold">1</span>
              </div>
              <p className="text-gray-300 text-sm">
                Abra sua caixa de entrada do email
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-500 text-xs font-bold">2</span>
              </div>
              <p className="text-gray-300 text-sm">
                Procure o email de <strong className="text-white">Cânticos CCB</strong>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-500 text-xs font-bold">3</span>
              </div>
              <p className="text-gray-300 text-sm">
                Clique no link <strong className="text-white">"Confirmar email"</strong> para ativar sua conta
              </p>
            </div>
          </div>

          {/* Aviso spam */}
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
            <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-yellow-200 text-xs text-left">
              Não encontrou? Verifique a pasta de <strong>spam</strong> ou <strong>lixo eletrônico</strong>.
            </p>
          </div>

          {/* Botão reenviar */}
          {email && (
            <button
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Reenviando...
                </>
              ) : resent ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Email reenviado!</span>
                </>
              ) : countdown > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  Reenviar em {countdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Reenviar email de confirmação
                </>
              )}
            </button>
          )}

          {/* Link para login */}
          <p className="text-gray-500 text-sm">
            Já confirmou?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-400 font-semibold">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
