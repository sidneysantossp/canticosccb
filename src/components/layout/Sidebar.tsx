import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Library, User, Music, Mic } from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/search', icon: Search, label: 'Buscar' },
    { path: '/categoria/hinos-cantados', icon: Mic, label: 'Hinos Cantados' },
    { path: '/categoria/hinos-tocados', icon: Music, label: 'Hinos Tocados' },
    { path: '/library', icon: Library, label: 'Sua Biblioteca' }
  ];

  // Sidebar pública (guest): sem itens pessoais

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 bg-black h-full fixed left-0 top-0 pt-6 pb-10 overflow-y-auto z-50">
      {/* Logo */}
      <div className="px-6 mb-8">
        <Link to="/" className="inline-block">
          <img 
            src="https://canticosccb.com.br/logo-canticos-ccb.png" 
            alt="Cânticos CCB - Congregação Cristã no Brasil" 
            className="h-10 w-auto object-contain"
            onError={(e) => {
              // Fallback para logo local se o link externo falhar
              const target = e.currentTarget as HTMLImageElement;
              target.src = '/logo-canticos-ccb.png';
            }}
          />
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="px-3">
        <nav className="space-y-0.5">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all group ${
                  active
                    ? 'bg-background-secondary text-white'
                    : 'text-gray-400 hover:text-white hover:bg-background-secondary/50'
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    active ? 'text-primary-500' : 'text-gray-400 group-hover:text-white'
                  }`}
                />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* CTA para registro (guest) fixo no rodapé */}
      <div className="mt-auto px-3">
        <div className="pt-4 pb-4">
          <div className="bg-gradient-to-br from-green-600/20 to-green-400/10 border border-green-500/30 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-1">Crie sua conta grátis</h3>
            <p className="text-text-muted text-sm mb-3">Salve hinos, crie playlists e acompanhe seu histórico.</p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-400 transition-colors"
            >
              <User className="w-4 h-4" />
              Registrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
