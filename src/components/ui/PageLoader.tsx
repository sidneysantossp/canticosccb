import React from 'react';
import { useLocation } from 'react-router-dom';

const PageLoader: React.FC = () => {
  const { pathname } = useLocation();
  const normalizedPath = pathname.toLowerCase();
  const isAdminRoute = normalizedPath === '/admin' || normalizedPath.startsWith('/admin/');
  const isComposerRoute =
    normalizedPath === '/composer' ||
    normalizedPath.startsWith('/composer/') ||
    normalizedPath === '/compositor' ||
    normalizedPath.startsWith('/compositor/');

  const loaderConfig = isAdminRoute
    ? {
        accentClass: 'from-red-600 to-red-700',
        glowClass: 'bg-red-600',
        title: 'Carregando painel...',
        message: 'Preparando ferramentas administrativas',
        icon: (
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        ),
      }
    : isComposerRoute
      ? {
          accentClass: 'from-blue-600 to-sky-500',
          glowClass: 'bg-blue-500',
          title: 'Carregando área do compositor...',
          message: 'Preparando seu painel criativo',
          icon: (
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A9 9 0 1118 20.25H8.25a3.75 3.75 0 01-3.129-2.446zM15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ),
        }
      : {
          accentClass: 'from-emerald-500 to-green-600',
          glowClass: 'bg-emerald-500',
          title: 'Carregando...',
          message: 'Preparando a pagina',
          icon: (
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-2v13M9 19A2 2 0 105 19a2 2 0 004 0zm12-2a2 2 0 100 4 2 2 0 000-4zM9 10l12-2"
              />
            </svg>
          ),
        };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className={`w-20 h-20 bg-gradient-to-br ${loaderConfig.accentClass} rounded-2xl flex items-center justify-center animate-pulse mx-auto`}>
            {loaderConfig.icon}
          </div>
          <div className={`absolute inset-0 w-20 h-20 ${loaderConfig.glowClass} rounded-2xl blur-xl opacity-50 animate-pulse mx-auto`}></div>
        </div>

        {/* Loading Text */}
        <h3 className="text-white text-xl font-semibold mb-2">{loaderConfig.title}</h3>
        <p className="text-gray-400 text-sm">{loaderConfig.message}</p>

        {/* Loading Bar */}
        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mt-6 mx-auto">
          <div className={`h-full bg-gradient-to-r ${loaderConfig.accentClass} rounded-full animate-loading`}></div>
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-loading {
          animation: loading 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
