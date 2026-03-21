import React from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn, UserPlus, Music } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-background-secondary rounded-full transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Continue ouvindo com cadastro gratuito</h1>
          <p className="text-text-muted">Crie sua conta para liberar a escuta completa da plataforma.</p>
        </div>
      </div>

      <div className="bg-background-secondary border border-gray-700 rounded-2xl p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary-500/15 text-primary-400">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Sem assinatura paga</h2>
            <p className="text-text-muted mt-2">
              A plataforma opera com cadastro gratuito. Basta criar sua conta para continuar ouvindo hinos sem bloqueio
              de continuidade.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-8">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-green-600 text-white font-semibold py-3 px-6 hover:bg-green-500 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Criar conta gratuita
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-600 text-white font-semibold py-3 px-6 hover:bg-background-tertiary transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Entrar na conta
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
