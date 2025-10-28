import React from 'react';

const PageLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center animate-pulse mx-auto">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="absolute inset-0 w-20 h-20 bg-red-600 rounded-2xl blur-xl opacity-50 animate-pulse mx-auto"></div>
        </div>

        {/* Loading Text */}
        <h3 className="text-white text-xl font-semibold mb-2">Carregando...</h3>
        <p className="text-gray-400 text-sm">Preparando painel administrativo</p>

        {/* Loading Bar */}
        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mt-6 mx-auto">
          <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full animate-loading"></div>
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
