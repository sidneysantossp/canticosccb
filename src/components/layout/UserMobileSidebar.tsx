import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Library,
  Heart,
  ListMusic,
  Clock,
  User,
  Settings,
  Crown,
  TrendingUp,
  X,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextMock';
import { compositorGerentesApi } from '@/lib/api-client';
import { getPremiumVisibility } from '@/lib/admin/premiumAdminApi';

interface UserMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserMobileSidebar: React.FC<UserMobileSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [isManager, setIsManager] = useState(false);
  const [premiumEnabled, setPremiumEnabled] = useState<boolean>(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  useEffect(() => {
    (async () => {
      try {
        const enabled = await getPremiumVisibility();
        setPremiumEnabled(enabled);
      } catch {}
    })();
  }, []);

  // Sem carregamento dinâmico de logo no mobile: usa URL fixa informada

  useEffect(() => {
    const checkIfManager = async () => {
      if (!user?.id) return;
      try {
        const response: any = await compositorGerentesApi.listarCompositores(user.id);
        const dataArray = Array.isArray(response.data) ? response.data : response.data?.compositores || [];
        const hasActiveManagements = dataArray.some((g: any) => g.status === 'ativo');
        setIsManager(!!hasActiveManagements);
      } catch {}
    };
    checkIfManager();
  }, [user?.id]);

  const menuItems = [
    {
      category: 'Navegar',
      items: [
        { icon: Home, label: 'Início', path: '/' },
        { icon: Search, label: 'Buscar', path: '/search' },
        { icon: Library, label: 'Biblioteca', path: '/library' }
      ]
    },
    {
      category: 'Dashboard',
      items: [
        { icon: User, label: 'Meu Perfil', path: '/profile' },
        { icon: Settings, label: 'Configurações', path: '/settings' },
        ...(premiumEnabled ? [{ icon: Crown, label: 'Assinatura', path: '/subscription' }] : [])
      ]
    },
    ...(isManager ? [{
      category: 'Gerenciamento',
      items: [
        { icon: Users, label: 'Gerenciar Compositores', path: '/manage-composers' }
      ]
    }] : []),
    {
      category: 'Minha Música',
      items: [
        { icon: Heart, label: 'Meus Favoritos', path: '/favoritos' },
        { icon: ListMusic, label: 'Minhas Playlists', path: '/library' }
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop com gradiente e blur, clicável para fechar */}
      <div
        className="fixed inset-0 bg-gradient-to-b from-green-900/80 via-green-800/60 to-green-900/80 backdrop-blur-md z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet com degradê, abre de baixo para cima */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-gradient-to-b from-green-700 via-green-800 to-gray-950 rounded-t-3xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden h-[60vh] overflow-hidden ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Barra de arraste */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-white/30 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pl-4 pr-6 pb-4">
          <Link to="/" className="flex items-center gap-3" onClick={onClose}>
            <img
              src="https://canticosccb.com.br/logo-canticos-ccb.png"
              alt="Cânticos CCB"
              className="h-8 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto pb-4">
          {/* Seções de menu */}
          <nav className="p-4">
            {menuItems.map((section, idx) => (
              <div key={idx} className={idx > 0 ? 'mt-4 pt-4 border-t border-white/15' : ''}>
                {/* Items */}
                <div className="space-y-1">
                  {section.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <Link
                        key={itemIdx}
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'text-green-100 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            active ? 'text-primary-300' : 'text-green-100'
                          }`}
                        />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default UserMobileSidebar;
