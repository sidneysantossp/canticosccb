import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Library,
  Heart,
  ListMusic,
  MessageSquare,
  Users,
  Grid,
  Music,
  Mic,
  FileText,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { compositorGerentesApi } from '@/lib/api-client';
import { getSupportInboxStats } from '@/lib/supportChatApi';

const UserSidebar: React.FC = () => {
  const location = useLocation();
  const { user, isComposer } = useAuth();
  const [isManager, setIsManager] = useState(false);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);

  useEffect(() => {
    checkIfManager();
  }, [user]);

  useEffect(() => {
    const loadSupportCount = async () => {
      if (!user?.id) {
        setSupportUnreadCount(0);
        return;
      }

      try {
        const stats = await getSupportInboxStats({ userId: user.id, role: 'user' });
        setSupportUnreadCount(stats.unread);
      } catch {
        setSupportUnreadCount(0);
      }
    };

    void loadSupportCount();
    const interval = setInterval(loadSupportCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const checkIfManager = async () => {
    if (!user?.id) return;

    try {
      const response: any = await compositorGerentesApi.listarCompositores(user.id);
      if (response.error) {
        setIsManager(false);
        return;
      }
      const dataArray = Array.isArray(response.data) ? response.data : response.data?.compositores || [];
      const hasActiveManagements = dataArray.some((g: any) => g.status === 'ativo');
      setIsManager(!!hasActiveManagements);
    } catch {
      setIsManager(false);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    ...(isComposer ? [{
      category: 'Área do Compositor',
      items: [
        { icon: Music, label: 'Painel do Compositor', path: '/composer' }
      ]
    }] : []),
    {
      category: 'Navegar',
      items: [
        { icon: Home, label: 'Início', path: '/' },
        { icon: Search, label: 'Buscar', path: '/search' },
        { icon: Library, label: 'Biblioteca', path: '/library' },
        { icon: Grid, label: 'Categorias', path: '/categorias' },
        { icon: Music, label: 'Avulsos', path: '/hinos-avulsos-ccb' },
        { icon: Mic, label: 'Cantados', path: '/hinos-cantados-ccb' },
        { icon: Music, label: 'Instrumentais', path: '/instrumentais' },
        { icon: FileText, label: 'Cifras', path: '/cifras' },
        { icon: BookOpen, label: 'Hinário', path: '/hinario' },
        { icon: BookOpen, label: 'Bíblia Digital', path: '/biblia-ccb' }
      ]
    },
    ...(isManager ? [{
      category: 'Gerenciamento',
      items: [
        { icon: Users, label: 'Gerenciar Compositores', path: '/manage-composers' }
      ]
    }] : []),
    {
      category: 'Meus Hinos',
      items: [
        { icon: Heart, label: 'Meus Favoritos', path: '/favoritos' },
        { icon: ListMusic, label: 'Minhas Playlists', path: '/library' },
      ]
    },
    {
      category: 'Atendimento',
      items: [
        { icon: MessageSquare, label: 'Chat', path: '/chat', badge: supportUnreadCount }
      ]
    }
  ];

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 bg-black h-full fixed left-0 top-0 pt-6 pb-10 overflow-y-auto">
      {/* Logo oficial */}
      <div className="px-6 mb-8">
        <Link to="/" className="inline-flex items-center">
          <img
            src="/logo-canticos-ccb.png"
            alt="Cânticos CCB"
            className="h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </Link>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3">
        {menuItems.map((section, idx) => (
          <div key={idx} className={idx > 0 ? 'mt-3' : ''}>
            {/* Items */}
            <div className="space-y-0.5">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={itemIdx}
                    to={item.path}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${active
                        ? 'bg-background-secondary text-white'
                        : 'text-gray-400 hover:text-white hover:bg-background-secondary/50'
                      }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${active ? 'text-primary-500' : 'text-gray-400 group-hover:text-white'
                        }`}
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge ? (
                      <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 py-0.5 text-[11px] font-bold text-black">
                        {item.badge}
                      </span>
                    ) : null}
                    {/* Indicador ativo/hover (barra direita) */}
                    <span
                      className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-l ${active ? 'bg-yellow-500' : 'bg-yellow-500/0 group-hover:bg-yellow-500/60'
                        }`}
                    />
                  </Link>
                );
              })}
            </div>
            {idx === 0 && (
              <div className="my-3 border-t border-gray-800" />
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default UserSidebar;
