import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Erro ao enviar email:', err);
      
      if (err.code === 'auth/user-not-found') {
        setError('Usuário não encontrado com este email');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido');
      } else {
        setError('Erro ao enviar email. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-tertiary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Login
        </Link>

        {/* Card */}
        <div className="bg-background-secondary rounded-lg shadow-xl p-8 border border-gray-800">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Esqueceu a Senha?
            </h1>
            <p className="text-text-secondary">
              Digite seu email e enviaremos instruções para redefinir sua senha
            </p>
          </div>

          {/* Success Message */}
          {success ? (
            <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Email Enviado!
              </h3>
              <p className="text-text-secondary mb-6">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <Link
                to="/login"
                className="btn-primary inline-block"
              >
                Voltar para Login
              </Link>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar Email de Recuperação'}
                </button>
              </form>

              {/* Additional Links */}
              <div className="mt-6 text-center">
                <p className="text-text-muted text-sm">
                  Lembrou da senha?{' '}
                  <Link to="/login" className="text-primary-500 hover:text-primary-400 transition-colors">
                    Fazer Login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-text-muted text-sm">
            Não recebeu o email? Verifique sua pasta de spam ou{' '}
            <button
              onClick={() => setSuccess(false)}
              className="text-primary-500 hover:text-primary-400 underline"
            >
              tente novamente
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
