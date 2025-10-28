import React, { useState, useEffect } from 'react';
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
  Music,
  Users,
  Grid
} from 'lucide-react';
import { getLogoByType } from '@/lib/mockApis';
import { useAuth } from '@/contexts/AuthContextMock';
import { compositorGerentesApi } from '@/lib/api-client';
import { getPremiumVisibility } from '@/lib/admin/premiumAdminApi';

const UserSidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isManager, setIsManager] = useState(false);
  const [premiumEnabled, setPremiumEnabled] = useState<boolean>(false);

  useEffect(() => {
    checkIfManager();
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const enabled = await getPremiumVisibility();
        setPremiumEnabled(enabled);
      } catch {}
    })();
  }, []);

  const checkIfManager = async () => {
    if (!user?.id) return;
    
    try {
      const response: any = await compositorGerentesApi.listarCompositores(user.id);
      const dataArray = Array.isArray(response.data) ? response.data : response.data?.compositores || [];
      const hasActiveManagements = dataArray.some((g: any) => g.status === 'ativo');
      setIsManager(!!hasActiveManagements);
    } catch (error) {
      console.error('Erro ao verificar gerente:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      category: 'Navegar',
      items: [
        { icon: Home, label: 'Início', path: '/' },
        { icon: Search, label: 'Buscar', path: '/search' },
        { icon: Library, label: 'Biblioteca', path: '/library' },
        { icon: Grid, label: 'Categorias', path: '/categories' }
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
        { icon: ListMusic, label: 'Minhas Playlists', path: '/library' },
        
      ]
    }
  ];

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 bg-black h-full fixed left-0 top-0 pt-6 pb-10 overflow-y-auto">
      {/* Logo oficial */}
      <div className="px-6 mb-8">
        <Link to="/" className="inline-flex items-center">
          <img
            src="https://canticosccb.com.br/logo-canticos-ccb.png"
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
                    className={`relative flex items-center gap-4 px-3 py-3 rounded-lg transition-all group ${
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
                    <span className="font-medium">{item.label}</span>
                    {/* Indicador ativo/hover (barra direita) */}
                    <span
                      className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-l ${
                        active ? 'bg-yellow-500' : 'bg-yellow-500/0 group-hover:bg-yellow-500/60'
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
