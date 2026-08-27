import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Music } from 'lucide-react';
import { AvulsosIcon, BibleIcon, HomeIcon, HymnalIcon, SearchIcon } from '@/components/icons';
import { usePlayerContext } from '@/contexts/PlayerContext';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const { closeFullScreen } = usePlayerContext();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavClick = () => {
    // Fechar o player fullscreen ao navegar no mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      closeFullScreen();
    }
  };

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/recem-chegados', icon: Music, label: 'Hinos' },
    { path: '/cifras', icon: AvulsosIcon, label: 'Cifras' },
    { path: '/search', icon: SearchIcon, label: 'Pesquisar' },
    { path: '/biblia-ccb', icon: BibleIcon, label: 'Bíblia' },
    { path: '/hinario', icon: HymnalIcon, label: 'Hinário' }
  ];

  return (
    <nav
      className="fixed bottom-2 left-2 right-2 z-[9999] overflow-hidden rounded-xl border border-gray-800 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] lg:hidden"
      style={{ 
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)',
        backgroundColor: 'rgba(18, 18, 18, 0.58)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <div className="flex h-16 items-stretch justify-around px-1">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            onClick={handleNavClick}
            className={`flex flex-col items-center justify-center space-y-1 px-2 transition-colors ${
              isActive(path)
                ? 'text-primary-500'
                : 'text-text-muted hover:text-primary-500'
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
