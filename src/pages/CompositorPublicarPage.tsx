import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, ArrowLeft } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { useAuth } from '@/contexts/AuthContext';

const CompositorPublicarPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isComposer } = useAuth();

  const handlePublicar = () => {
    if (!user) {
      navigate('/register');
      return;
    }
    if (isComposer) {
      navigate('/compositor/musica/criar');
      return;
    }
    navigate('/compositor/onboarding');
  };

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <SEOHead
        title="Publicar Composição - Cânticos CCB"
        description="Publique suas composições na plataforma Cânticos CCB."
      />

      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="text-text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Publicar Composição</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-6">
          <Upload className="w-8 h-8 text-primary-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-3">
          {isComposer ? 'Publique uma nova composição' : 'Torne-se compositor para publicar'}
        </h2>
        <p className="text-text-muted max-w-md mb-6">
          {isComposer
            ? 'Acesse o painel do compositor para enviar suas músicas e alcançar milhares de ouvintes.'
            : 'Cadastre-se como compositor para publicar suas composições na plataforma.'}
        </p>
        <button
          onClick={handlePublicar}
          className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-semibold transition-colors"
        >
          {isComposer ? 'Criar Nova Composição' : !user ? 'Criar Conta' : 'Cadastrar como Compositor'}
        </button>
      </div>
    </div>
  );
};

export default CompositorPublicarPage;
