import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Music, Radio } from 'lucide-react';
import { AvulsosIcon, BibleIcon, HomeIcon, HymnalIcon, SearchIcon } from '@/components/icons';
import { usePlayerContext } from '@/contexts/PlayerContext';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const { closeFullScreen } = usePlayerContext();
  const navRef = useRef<HTMLDivElement | null>(null);

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
    { path: '/hinario', icon: HymnalIcon, label: 'Hinário' },
    { path: '/radio', icon: Radio, label: 'Rádio' },
  ];

  useEffect(() => {
    const activeItem = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    activeItem?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [location.pathname]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[9999] w-full overflow-hidden border-t border-gray-800 shadow-[0_-8px_24px_rgba(0,0,0,0.4)] lg:hidden"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: 'rgba(18, 18, 18, 0.58)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <div
        ref={navRef}
        className="scrollbar-hide flex h-16 snap-x snap-mandatory items-stretch gap-1 overflow-x-auto overscroll-x-contain scroll-smooth px-2 touch-pan-x"
        aria-label="Navegação principal mobile"
      >
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            onClick={handleNavClick}
            aria-current={isActive(path) ? 'page' : undefined}
            className={`flex w-[72px] shrink-0 snap-center flex-col items-center justify-center space-y-1 rounded-xl px-2 transition-colors ${
              isActive(path)
                ? 'bg-primary-500/10 text-primary-500'
                : 'text-text-muted hover:bg-white/5 hover:text-primary-500'
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
