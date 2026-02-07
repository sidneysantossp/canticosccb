import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ArrowLeft } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';

const RadioPage: React.FC = () => {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <SEOHead
        title="Rádio CCB - Cânticos CCB"
        description="Ouça a Rádio CCB com hinos da Congregação Cristã no Brasil 24 horas."
      />

      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="text-text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Rádio CCB</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-6">
          <Radio className="w-8 h-8 text-primary-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-3">Em breve</h2>
        <p className="text-text-muted max-w-md">
          A Rádio CCB estará disponível em breve com hinos 24 horas por dia. Fique ligado!
        </p>
        <Link
          to="/"
          className="mt-6 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-medium transition-colors"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
};

export default RadioPage;
