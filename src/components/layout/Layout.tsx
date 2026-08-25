import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import UserSidebar from './UserSidebar';
import ComposerSidebar from './ComposerSidebar';
import AdminSidebar from './AdminSidebar';
import MobileNav from './MobileNav';
import Player from './Player';
import Footer from '@/components/Footer';
import PendingClaimNotification from '@/components/ui/PendingClaimNotification';
import ManagingComposerBanner from '@/components/ManagingComposerBanner';
import { usePlayerStore } from '@/stores/playerStore';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { useAuth } from '@/contexts/AuthContext';
import { ToastProvider, useToast } from '@/contexts/ToastContext';
import { PLAYER_UNAVAILABLE_EVENT } from '@/lib/playerFeedback';

interface LayoutProps {
  children?: React.ReactNode;
}

const PlayerFeedbackBridge: React.FC = () => {
  const { showToast } = useToast();

  React.useEffect(() => {
    const handlePlayerUnavailable = (event: Event) => {
      const detail = (event as CustomEvent<{ title?: string; artist?: string }>).detail || {};
      const title = detail.title || 'Este hino';
      const artist = detail.artist ? ` • ${detail.artist}` : '';

      showToast(
        'warning',
        'Áudio temporariamente indisponível',
        `${title}${artist} não possui mídia reproduzível neste momento.`
      );
    };

    window.addEventListener(PLAYER_UNAVAILABLE_EVENT, handlePlayerUnavailable);
    return () => window.removeEventListener(PLAYER_UNAVAILABLE_EVENT, handlePlayerUnavailable);
  }, [showToast]);

  return null;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentTrack } = usePlayerStore();
  const { isMenuOpen, closeMenu } = useMobileMenu();
  const location = useLocation();
  const { user } = useAuth();

  // Fechar menu mobile ao mudar de rota
  React.useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  // Detectar tipo de área
  const isAdminPanel = location.pathname.startsWith('/admin');
  const isComposerPanel = location.pathname.startsWith('/composer');
  
  // Rotas do dashboard do usuário (usam UserSidebar)
  const userDashboardBaseRoutes = [
    '/profile',
    '/edit-profile',
    '/settings',
    '/subscription',
    '/history',
    '/liked-songs',
    '/liked'
  ];
  const userDashboardRoutes = [...userDashboardBaseRoutes, '/library'];
  // Se usuário não estiver logado, '/library' deve continuar usando a Sidebar pública
  const isUserDashboard = (user ? userDashboardRoutes : userDashboardBaseRoutes)
    .some(route => location.pathname.startsWith(route));
  
  const isAuthPage = ['/login', '/register', '/onboarding', '/composer/onboarding'].includes(location.pathname);
  const isImmersiveCifraPage = location.pathname.startsWith('/cifra/') || /^\/cifras\/(violao|ukulele|teclado)\/[^/]+/.test(location.pathname);
  const isImmersiveBiblePage = location.pathname === '/biblia-ccb' || location.pathname.startsWith('/biblia-ccb/');
  const isImmersiveContentPage = isImmersiveCifraPage || isImmersiveBiblePage;
  
  // Área pública = home, search, library, etc (usa sidebar apropriada ao tipo de usuário)
  const isPublicArea = !isAdminPanel && !isComposerPanel && !isUserDashboard && !isAuthPage && !isImmersiveContentPage;

  return (
    <ToastProvider>
    <PlayerFeedbackBridge />
    <div className="min-h-screen bg-background-primary flex flex-col">
      {/* Header - Ocultar em páginas de auth */}
      {!isAuthPage && !isImmersiveContentPage && <Header />}
      
      {/* Sidebars Fixas - Desktop Only */}
      {!isAuthPage && !isImmersiveContentPage && (
        <>
          {isAdminPanel && <AdminSidebar />}
          {isComposerPanel && user && <ComposerSidebar />}
          {isUserDashboard && user && <UserSidebar />}
          {isPublicArea && (
            user
              ? <UserSidebar />
              : <Sidebar />
          )}
        </>
      )}
      
      {/* Main Content Area */}
      <div className={`flex-1 ${isAuthPage || isImmersiveContentPage ? '' : 'lg:pl-64'} ${isImmersiveContentPage ? 'pb-0 pt-0' : `pb-20 ${currentTrack ? 'pb-32' : 'lg:pb-0'} pt-5 md:pt-0`}`}>
        {/* Tarja de gerenciamento: apenas no painel do compositor */}
        {!isAuthPage && isComposerPanel && <ManagingComposerBanner />}

        <main className={isImmersiveContentPage ? 'bg-background-primary' : 'bg-background-primary px-4 sm:px-6 lg:px-8'}>
          {children || <Outlet />}
        </main>
        
        {/* Footer Global - Ocultar apenas em páginas de autenticação */}
        {!isAuthPage && <Footer />}
      </div>
      
      {/* Mobile Navigation - Mobile Only */}
      {!isImmersiveContentPage && <MobileNav />}
      
      {/* Audio Player - Always visible when track is playing */}
      {currentTrack && !isAdminPanel && !isImmersiveContentPage && <Player isHidden={isMenuOpen} />}
      
      {/* Toast Notifications removed for silent UX */}
      
      {/* Pending Copyright Claim Notification */}
      <PendingClaimNotification />
    </div>
    </ToastProvider>
  );
};

export default Layout;
