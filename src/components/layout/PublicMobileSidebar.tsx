import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Home, Search, Library, Music, User, Heart, LogOut, Shield, Star, Grid, List } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PublicMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const PublicMobileSidebar: React.FC<PublicMobileSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, profile, signOut, isAdmin, isComposer } = useAuth();
  const [avatarError, setAvatarError] = React.useState(false);

  // Reset avatar error when sidebar opens
  React.useEffect(() => {
    if (isOpen) {
      setAvatarError(false);
    }
  }, [isOpen]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      onClose();
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro no logout:', error);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  // Menu items baseado no tipo de usuário
  const getNavigationItems = () => {
    const baseItems = [
      { path: '/', icon: Home, label: 'Início' },
      { path: '/search', icon: Search, label: 'Pesquisar' },
      { path: '/library', icon: Library, label: 'Biblioteca' },
      { path: '/categories', icon: Grid, label: 'Categorias' },
      { path: '/categoria/cantados', icon: Music, label: 'Hinos Cantados' },
      { path: '/categoria/tocados', icon: Music, label: 'Hinos Tocados' },
    ];

    // Adicionar painel específico do usuário
    if (user) {
      if (isAdmin) {
        baseItems.push({ path: '/admin', icon: Shield, label: 'Painel Admin' });
      } else if (isComposer) {
        baseItems.push({ path: '/composer', icon: Music, label: 'Painel Compositor' });
      } else {
        baseItems.push({ path: '/profile', icon: User, label: 'Meu Painel' });
      }
    }

    return baseItems;
  };

  const publicMenuItems = getNavigationItems();

  // Menu items da seção "Minha Conta" (sem duplicar painel principal)
  const getUserMenuItems = () => {
    const items = [
      { path: '/liked', icon: Heart, label: 'Meus Favoritos' },
      { path: '/library', icon: List, label: 'Minhas Playlists' },
    ];

    // Adicionar "Meu Perfil" apenas se não for admin/compositor (que já têm painel próprio)
    if (user && !isAdmin && !isComposer) {
      items.unshift({ path: '/profile', icon: User, label: 'Meu Perfil' });
    }

    return items;
  };

  const userMenuItems = getUserMenuItems();

  return (
    <>
      {/* Backdrop com efeito verde desfocado */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gradient-to-b from-green-900/80 via-green-800/60 to-green-900/80 backdrop-blur-md z-[60] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Menu deslizante de baixo para cima */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-gradient-to-b from-green-700 via-green-800 to-gray-950 rounded-t-3xl z-[60] transform transition-transform duration-300 ease-in-out lg:hidden h-[60vh] overflow-hidden ${
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

        {/* User Info */}
        {user && profile && (
          <div className="px-6 pb-4 border-b border-white/20">
            <div className="flex items-center gap-3">
              {profile.avatar_url && !avatarError ? (
                <img
                  src={profile.avatar_url}
                  alt={(profile as any).nome || 'User'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-background-tertiary border-2 border-white/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-text-muted" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-white font-semibold truncate">
                  {(profile as any).nome || 'Usuário'}
                </p>
                <p className="text-green-100 text-sm truncate">
                  {profile.email || user.email}
                </p>
                {profile.plan === 'premium' && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-full">
                    ⭐ Premium
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto pb-4">
          {/* Public Menu Items */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-green-200 uppercase tracking-wider mb-3">
              Navegação
            </h3>
            <nav className="space-y-1">
              {publicMenuItems.map(({ path, icon: Icon, label }) => {
                // Cores especiais para painéis
                let itemClasses = '';
                if (path === '/admin') {
                  itemClasses = isActive(path) 
                    ? 'bg-red-500/20 text-red-200' 
                    : 'text-red-300 hover:text-red-200 hover:bg-red-500/10';
                } else if (path === '/composer') {
                  itemClasses = isActive(path) 
                    ? 'bg-purple-500/20 text-purple-200' 
                    : 'text-purple-300 hover:text-purple-200 hover:bg-purple-500/10';
                } else {
                  itemClasses = isActive(path)
                    ? 'bg-white/20 text-white'
                    : 'text-green-100 hover:text-white hover:bg-white/10';
                }

                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${itemClasses}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Menu Items */}
          {user && (
            <div className="p-4 pb-6 border-t border-white/20">
              <h3 className="text-xs font-semibold text-green-200 uppercase tracking-wider mb-3">
                Minha Conta
              </h3>
              <nav className="space-y-1">
                {userMenuItems.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive(path)
                        ? 'bg-white/20 text-white'
                        : 'text-green-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                  </Link>
                ))}

                {/* Premium Link */}
                {profile?.plan !== 'premium' && (
                  <Link
                    to="/premium"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-yellow-300 hover:bg-yellow-500/20 hover:text-yellow-200"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-medium">Assinar Premium</span>
                  </Link>
                )}
              </nav>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 pb-8 border-t border-white/20">
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-red-300 hover:bg-red-500/20 hover:text-red-200 w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={onClose}
                className="flex items-center justify-center w-full rounded-lg bg-white text-green-800 px-4 py-2.5 font-semibold hover:bg-green-50 transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="flex items-center justify-center w-full rounded-lg border-2 border-white text-white px-4 py-2.5 font-semibold hover:bg-white/10 transition-colors"
              >
                Registrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PublicMobileSidebar;
