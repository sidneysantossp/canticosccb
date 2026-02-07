import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Music, Shield, BarChart3 } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { useAuth } from '@/contexts/AuthContext';

const CompositorCadastroPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isComposer } = useAuth();

  const handleCadastro = () => {
    if (!user) {
      navigate('/compositor/onboarding');
      return;
    }
    if (isComposer) {
      navigate('/composer/dashboard');
      return;
    }
    navigate('/compositor/onboarding');
  };

  const beneficios = [
    { icon: Music, title: 'Publique suas composições', desc: 'Compartilhe suas músicas com milhares de ouvintes da CCB.' },
    { icon: BarChart3, title: 'Acompanhe suas métricas', desc: 'Veja reproduções, seguidores e analytics detalhados.' },
    { icon: Shield, title: 'Proteção de direitos', desc: 'Gerencie direitos autorais e reivindicações de conteúdo.' },
  ];

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <SEOHead
        title="Cadastro de Compositor - Cânticos CCB"
        description="Cadastre-se como compositor na plataforma Cânticos CCB e publique suas composições."
      />

      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="text-text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Sou Compositor</h1>
      </div>

      <div className="max-w-2xl mx-auto text-center mb-12">
        <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserPlus className="w-8 h-8 text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Publique suas composições na Cânticos CCB
        </h2>
        <p className="text-text-muted text-lg">
          Junte-se à nossa comunidade de compositores e alcance milhares de ouvintes.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {beneficios.map((item, i) => (
          <div key={i} className="bg-background-secondary rounded-xl p-6 border border-white/5">
            <item.icon className="w-8 h-8 text-primary-400 mb-4" />
            <h3 className="text-white font-semibold mb-2">{item.title}</h3>
            <p className="text-text-muted text-sm">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={handleCadastro}
          className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-semibold text-lg transition-colors"
        >
          {!user ? 'Criar Conta e Cadastrar' : isComposer ? 'Ir para Painel do Compositor' : 'Iniciar Cadastro'}
        </button>
      </div>
    </div>
  );
};

export default CompositorCadastroPage;
