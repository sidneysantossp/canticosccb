import React from 'react';
import { Link } from 'react-router-dom';
import { Music, ArrowRight } from 'lucide-react';

const BannerCTA: React.FC = () => {
  return (
    <section className="mb-12">
      <div className="relative bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 rounded-lg overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Background Image */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20">
          <img 
            src="https://picsum.photos/seed/composer-bg/600/300"
            alt="Compositor background"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="relative z-10 p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Music className="w-6 h-6 text-white" />
              </div>
              <span className="text-white/90 font-medium">Para Compositores</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Compartilhe Seus Hinos
            </h2>
            
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              Faça parte da nossa comunidade de compositores. Envie seus hinos e 
              alcance milhares de irmãos em todo o Brasil.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/compositor/cadastro"
                className="inline-flex items-center justify-center gap-2 bg-white text-green-600 font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors group"
              >
                Cadastrar Hino
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/compositores"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
              >
                Ver Compositores
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-8 right-20 w-12 h-12 bg-white/5 rounded-full blur-lg"></div>
      </div>
    </section>
  );
};

export default BannerCTA;
