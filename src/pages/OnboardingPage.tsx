import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Music2, Check, Music, Download, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Aguardar um pouco para garantir que o contexto está atualizado
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    console.log('🎵 Navegando para /profile, usuário:', user);
    navigate('/profile', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-800 flex items-center justify-center p-4">
      <Link to="/profile" className="fixed top-4 right-4 text-primary-500 hover:text-primary-400 font-semibold">Pular</Link>
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-primary-500 rounded-full mb-8 animate-pulse">
          <Check className="w-16 h-16 text-black" />
        </div>

        <h1 className="text-5xl font-bold text-white mb-4">
          Bem-vindo, {user?.nome || 'Usuário'}!
        </h1>

        <p className="text-gray-400 text-xl mb-8">
          Sua conta foi criada com sucesso! 🎉
        </p>

        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-8">
          <div className="p-6 bg-gray-800/50 rounded-xl backdrop-blur-sm">
            <Music className="w-10 h-10 mb-3 text-primary-400 mx-auto" />
            <p className="text-sm text-gray-300">Milhares de hinos</p>
          </div>
          <div className="p-6 bg-gray-800/50 rounded-xl backdrop-blur-sm">
            <Download className="w-10 h-10 mb-3 text-primary-400 mx-auto" />
            <p className="text-sm text-gray-300">Ouça offline</p>
          </div>
          <div className="p-6 bg-gray-800/50 rounded-xl backdrop-blur-sm">
            <Heart className="w-10 h-10 mb-3 text-primary-400 mx-auto" />
            <p className="text-sm text-gray-300">Suas playlists</p>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!isReady}
          className="px-8 py-4 bg-primary-500 text-black font-bold rounded-full hover:bg-primary-400 transition-all transform hover:scale-105 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isReady ? 'Começar a ouvir →' : 'Carregando...'}
        </button>


      </div>
    </div>
  );
};

export default OnboardingPage;
