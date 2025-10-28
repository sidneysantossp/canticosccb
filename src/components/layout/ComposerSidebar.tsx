import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Music,
  Disc,
  Upload,
  BarChart3,
  Users,
  User,
  Settings,
  LogOut,
  Plus,
  TrendingUp,
  Heart,
  Clock,
  Copyright,
  Bell
} from 'lucide-react';
import { getLogoByType } from '@/lib/mockApis';
import useNotificationsStore from '@/stores/notificationsStore';
import useCopyrightClaimsStore from '@/stores/copyrightClaimsStore';

const ComposerSidebar: React.FC = () => {
  const location = useLocation();
  const { unreadCount } = useNotificationsStore();
  const { claims } = useCopyrightClaimsStore();
  const unreadClaimsForComposer = claims.filter(c => c.hasUnreadForComposer).length;

  // Carregar logo oficial configurada no painel (cache em sessionStorage)
  const [logoSrc, setLogoSrc] = useState<string>('/logo-canticos-ccb.png');
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const cachedSession = sessionStorage.getItem('primaryLogoUrl');
        const cachedLocal = localStorage.getItem('primaryLogoUrl');
        const cached = cachedSession || cachedLocal;
        if (cached && isMounted) { setLogoSrc(cached); return; }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        try {
          const logo = await getLogoByType('primary');
          if (isMounted && logo?.url) {
            setLogoSrc(logo.url);
            sessionStorage.setItem('primaryLogoUrl', logo.url);
            localStorage.setItem('primaryLogoUrl', logo.url);
          }
        } finally {
          clearTimeout(timeout);
        }
      } catch {}
    })();
    // Ouvir atualizações vindas de outras abas (localStorage event)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'primaryLogoUrl' && typeof e.newValue === 'string') {
        setLogoSrc(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { isMounted = false; window.removeEventListener('storage', onStorage); };
  }, []);

  const isActive = (path: string) => {
    const p = location.pathname;
    if (path === '/composer') {
      return p === '/composer' || p.startsWith('/composer/dashboard');
    }
    return p === path || p.startsWith(path + '/');
  };

  const menuItems = [
    {
      category: 'Painel',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/composer' },
        { icon: BarChart3, label: 'Analytics', path: '/composer/analytics' },
        { icon: Users, label: 'Seguidores', path: '/composer/followers' }
      ]
    },
    {
      category: 'Conteúdo',
      items: [
        { icon: Music, label: 'Meus Hinos', path: '/composer/songs' },
        { icon: Disc, label: 'Meus Álbuns', path: '/composer/albums' },
        { icon: Upload, label: 'Upload de Hino', path: '/composer/songs/upload' },
        { icon: Plus, label: 'Criar Álbum', path: '/composer/albums/create' }
      ]
    },
    {
      category: 'Performance',
      items: [
        { icon: TrendingUp, label: 'Hinos em Alta', path: '/composer/trending' },
        { icon: Heart, label: 'Mais Curtidas', path: '/composer/liked' },
        
      ]
    },
    {
      category: 'Direitos Autorais',
      items: [
        { icon: Copyright, label: 'Direitos Autorais', path: '/composer/copyright-claims' }
      ]
    },
    {
      category: 'Configurações',
      items: [
        { icon: Bell, label: 'Notificações', path: '/composer/notifications' }
      ]
    },
    {
      category: 'Conta',
      items: [
        { icon: User, label: 'Perfil Público', path: '/composer/profile' },
        { icon: Users, label: 'Gerente de Contas', path: '/composer/managers' }
      ]
    }
  ];

  // Controla quais seções estão expandidas
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Determina qual seção contém a rota ativa e mantém expandida
  const activeSectionKey = useMemo(() => {
    for (const section of menuItems) {
      if (section.items.some((it: any) => isActive(it.path))) return section.category;
    }
    return null;
  }, [location.pathname]);

  useEffect(() => {
    if (activeSectionKey) {
      // Mantém apenas a seção ativa aberta
      setExpandedSections([activeSectionKey]);
    } else {
      setExpandedSections([]);
    }
  }, [activeSectionKey]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => (prev.includes(key) ? [] : [key]));
  };

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 bg-black h-full fixed left-0 top-0 pt-6 pb-10 overflow-y-auto">
      {/* Logo oficial */}
      <div className="px-6 mb-6">
        <Link to="/composer/dashboard" className="inline-flex items-center">
          <img
            src={logoSrc}
            alt="Cânticos CCB"
            className="h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Alterna entre PNG e SVG para evitar loop se um deles não existir
              setLogoSrc(prev => prev.endsWith('.png') ? '/logo-canticos-ccb.svg' : '/logo-canticos-ccb.png');
            }}
          />
        </Link>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3">
        {menuItems.map((section, idx) => {
          const isOpen = expandedSections.includes(section.category);
          return (
            <div key={idx} className={idx > 0 ? 'mt-2' : ''}>
              {/* Cabeçalho da seção */}
              <button
                onClick={() => toggleSection(section.category)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-background-secondary/40 rounded-lg"
              >
                <span className="tracking-wide">{section.category}</span>
                <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>
                  ▸
                </span>
              </button>

              {/* Itens da seção */}
              {isOpen && (
                <div className="mt-1 space-y-0.5">
                  {section.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    const showBadge =
                      (item.label === 'Seguidores' && unreadCount > 0) ||
                      (item.label === 'Direitos Autorais' && unreadClaimsForComposer > 0) ||
                      (item.label === 'Notificações' && unreadCount > 0);
                    return (
                      <Link
                        key={itemIdx}
                        to={item.path}
                        className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group ${
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
                        <span className="font-medium leading-none">{item.label}</span>
                        {showBadge && (
                          <span className="ml-auto inline-flex items-center justify-center text-[11px] font-semibold text-white bg-red-500 rounded-full min-w-[20px] h-5 px-1">
                            {item.label === 'Seguidores'
                              ? unreadCount > 99 ? '99+' : unreadCount
                              : unreadClaimsForComposer > 99 ? '99+' : unreadClaimsForComposer}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-6 mt-auto">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Voltar ao Player</span>
        </Link>
      </div>
    </div>
  );
};

export default ComposerSidebar;
