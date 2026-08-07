import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';

const NotFoundPage: React.FC = () => {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <SEOHead
        title="Página não encontrada - Cânticos CCB"
        description="A página que você está procurando não foi encontrada."
        noindex
        nofollow
      />

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-8xl font-bold text-primary-500/30 mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-3">Página não encontrada</h1>
        <p className="text-text-muted max-w-md mb-8">
          A página que você está procurando não existe ou foi movida. Verifique o endereço ou volte ao início.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Ir ao Início
          </Link>
          <Link
            to="/buscar"
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-white/20 hover:border-white/40 text-white rounded-full font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            Buscar
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
