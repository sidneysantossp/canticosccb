import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Music,
  Disc,
  Upload,
  BarChart3,
  Users,
  User,
  LogOut,
  Plus,
  TrendingUp,
  Heart,
  Clock,
  X
} from 'lucide-react';

interface ComposerMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ComposerMobileSidebar: React.FC<ComposerMobileSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
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
        { icon: Music, label: 'Minhas Músicas', path: '/composer/songs' },
        { icon: Disc, label: 'Meus Álbuns', path: '/composer/albums' },
        { icon: Upload, label: 'Upload de Música', path: '/composer/songs/upload' },
        { icon: Plus, label: 'Criar Álbum', path: '/composer/albums/create' }
      ]
    },
    {
      category: 'Performance',
      items: [
        { icon: TrendingUp, label: 'Músicas em Alta', path: '/composer/trending' },
        { icon: Heart, label: 'Mais Curtidas', path: '/composer/liked' },
        
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

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/80 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 bottom-0 w-80 bg-black z-50 lg:hidden overflow-y-auto transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <Link to="/composer/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-black" />
            </div>
            <div>
              <span className="text-white font-bold text-lg block">Cânticos CCB</span>
              <span className="text-primary-400 text-xs font-medium">Painel do Compositor</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4">
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
                      onClick={onClose}
                      className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all ${
                        active
                          ? 'bg-background-secondary text-white'
                          : 'text-gray-400 hover:text-white hover:bg-background-secondary/50'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          active ? 'text-primary-500' : 'text-gray-400'
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

        {/* Logout */}
        <div className="p-6 border-t border-gray-800">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Voltar ao Player</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default ComposerMobileSidebar;
