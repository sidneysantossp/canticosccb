import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Zap, TrendingUp, Gift, X } from 'lucide-react';

interface AdsSidebarProps {
  type?: 'user' | 'composer';
}

const AdsSidebar: React.FC<AdsSidebarProps> = ({ type = 'user' }) => {
  const userAds = [
    {
      id: 1,
      title: 'Playlist Personalizada',
      description: 'Descubra novos hinos baseados no seu gosto',
      icon: Zap,
      bgColor: 'from-purple-900/40 to-purple-600/20',
      borderColor: 'border-purple-500/20',
      iconColor: 'text-purple-400',
      cta: 'Explorar',
      link: '/library'
    }
  ];

  const composerAds = [
    {
      id: 1,
      title: 'Impulsione Suas Músicas',
      description: 'Alcance milhares de ouvintes com nosso plano de promoção',
      icon: TrendingUp,
      bgColor: 'from-primary-900/40 to-primary-600/20',
      borderColor: 'border-primary-500/20',
      iconColor: 'text-primary-400',
      cta: 'Saiba Mais',
      link: '/composer/analytics'
    },
    {
      id: 2,
      title: 'Compositor Premium',
      description: 'Ferramentas avançadas para compositores profissionais',
      icon: Crown,
      bgColor: 'from-yellow-900/40 to-yellow-600/20',
      borderColor: 'border-yellow-500/20',
      iconColor: 'text-yellow-400',
      cta: 'Fazer Upgrade',
      link: '/premium'
    },
    {
      id: 3,
      title: 'Analytics PRO',
      description: 'Relatórios detalhados e insights sobre seu público',
      icon: Zap,
      bgColor: 'from-blue-900/40 to-blue-600/20',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-400',
      cta: 'Ver Recursos',
      link: '/composer/analytics'
    }
  ];

  const ads = type === 'composer' ? composerAds : userAds;

  return (
    <div className="hidden xl:flex xl:flex-col xl:w-80 bg-black h-full fixed right-0 top-0 pt-6 pb-10 px-4 overflow-y-auto border-l border-gray-800">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-lg mb-1">Recomendado para você</h3>
        <p className="text-gray-400 text-sm">Aproveite nossos recursos premium</p>
      </div>

      {/* Ads */}
      <div className="space-y-4">
        {ads.map((ad) => {
          const Icon = ad.icon;
          return (
            <div
              key={ad.id}
              className={`bg-gradient-to-br ${ad.bgColor} rounded-xl p-5 border ${ad.borderColor} hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-lg bg-black/30 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${ad.iconColor}`} />
                </div>
              </div>
              
              <h4 className="text-white font-bold mb-2">{ad.title}</h4>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                {ad.description}
              </p>
              
              <Link
                to={ad.link}
                className="block w-full text-center px-4 py-2 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform text-sm"
              >
                {ad.cta}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="bg-background-secondary rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2 text-sm">💡 Dica do Dia</h4>
          <p className="text-gray-400 text-xs leading-relaxed">
            {type === 'composer' 
              ? 'Adicione tags relevantes às suas músicas para aumentar a descoberta por novos ouvintes.'
              : 'Crie playlists temáticas para organizar melhor seus hinos favoritos.'
            }
          </p>
        </div>
      </div>

    </div>
  );
};

export default AdsSidebar;
