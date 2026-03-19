import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import { updatePassword } from '@/lib/supabase-auth';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validationError = useMemo(() => {
    if (!password && !confirmPassword) return null;
    if (password.length > 0 && password.length < 6) return 'A nova senha deve ter pelo menos 6 caracteres.';
    if (confirmPassword && password !== confirmPassword) return 'A confirmação da senha não confere.';
    return null;
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      if (err?.message?.toLowerCase().includes('same password')) {
        setError('Escolha uma senha diferente da anterior.');
      } else if (err?.message?.toLowerCase().includes('session')) {
        setError('Sessão de redefinição inválida ou expirada. Solicite um novo email.');
      } else {
        setError(err?.message || 'Não foi possível redefinir a senha.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-tertiary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Login
        </Link>

        <div className="bg-background-secondary rounded-lg shadow-xl p-8 border border-gray-800">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Redefinir Senha</h1>
            <p className="text-text-secondary">
              Defina uma nova senha para concluir a recuperação da sua conta.
            </p>
          </div>

          {success ? (
            <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Senha atualizada</h3>
              <p className="text-text-secondary">
                Sua senha foi redefinida com sucesso. Redirecionando para o login...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Nova senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Confirmar nova senha
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Digite a senha novamente"
                    className="w-full px-4 py-3 bg-background-tertiary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword || Boolean(validationError)}
                  className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
