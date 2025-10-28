import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, BookOpen, User, Music } from 'lucide-react';

const MobileNav: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/recem-chegados', icon: Music, label: 'Hinos' },
    { path: '/search', icon: Search, label: 'Pesquisar' },
    { path: '/library', icon: BookOpen, label: 'Biblioteca' },
    { path: '/profile', icon: User, label: 'Perfil' }
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-background-primary/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-t border-gray-800 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] z-[9999]"
      style={{ 
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)'
      }}
    >
      <div className="grid grid-cols-5 h-16">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              isActive(path)
                ? 'text-primary-500'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
