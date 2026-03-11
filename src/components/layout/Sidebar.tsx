import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Library, User, Music, Mic, Grid, FileText, BookOpen } from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/search', icon: Search, label: 'Buscar' },
    { path: '/library', icon: Library, label: 'Biblioteca' },
    { path: '/categories', icon: Grid, label: 'Categorias' },
    { path: '/hinos-avulsos-ccb', icon: Music, label: 'Avulsos' },
    { path: '/hinos-cantados-ccb', icon: Mic, label: 'Cantados' },
    { path: '/categoria/instrumentais', icon: Music, label: 'Instrumentais' },
    { path: '/cifras', icon: FileText, label: 'Cifras' },
    { path: '/hinario', icon: BookOpen, label: 'Hinário' },
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                  active
                    ? 'bg-background-secondary text-white'
                    : 'text-gray-400 hover:text-white hover:bg-background-secondary/50'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    active ? 'text-primary-500' : 'text-gray-400 group-hover:text-white'
                  }`}
                />
                <span className="text-sm font-medium">{label}</span>
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
