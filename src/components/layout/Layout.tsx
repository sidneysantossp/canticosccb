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
import { ToastProvider } from '@/contexts/ToastContext';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentTrack } = usePlayerStore();
  const { isMenuOpen } = useMobileMenu();
  const location = useLocation();
  const { user, isAdmin, isComposer } = useAuth();

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
  
  // Área pública = home, search, library, etc (usa sidebar apropriada ao tipo de usuário)
  const isPublicArea = !isAdminPanel && !isComposerPanel && !isUserDashboard && !isAuthPage;

  return (
    <ToastProvider>
    <div className="min-h-screen bg-background-primary flex flex-col">
      {/* Header - Ocultar em páginas de auth */}
      {!isAuthPage && <Header />}
      
      {/* Sidebars Fixas - Desktop Only */}
      {!isAuthPage && (
        <>
          {isAdminPanel && <AdminSidebar />}
          {isComposerPanel && user && <ComposerSidebar />}
          {isUserDashboard && user && <UserSidebar />}
          {isPublicArea && (
            user
              ? (isComposer ? <ComposerSidebar /> : <UserSidebar />)
              : <Sidebar />
          )}
        </>
      )}
      
      {/* Main Content Area */}
      <div className={`flex-1 ${isAuthPage ? '' : 'lg:pl-64'} pb-20 ${currentTrack ? 'pb-32' : 'lg:pb-0'} pt-5 md:pt-0`}>
        {/* Tarja de gerenciamento: apenas no painel do compositor */}
        {!isAuthPage && isComposerPanel && <ManagingComposerBanner />}

        <main className="bg-background-primary px-4 sm:px-6 lg:px-8">
          {children || <Outlet />}
        </main>
        
        {/* Footer Global - Ocultar em páginas de auth */}
        {!isAuthPage && <Footer />}
      </div>
      
      {/* Mobile Navigation - Mobile Only */}
      <MobileNav />
      
      {/* Audio Player - Always visible when track is playing */}
      {currentTrack && <Player isHidden={isMenuOpen} />}
      
      {/* Toast Notifications removed for silent UX */}
      
      {/* Pending Copyright Claim Notification */}
      <PendingClaimNotification />
    </div>
    </ToastProvider>
  );
};

export default Layout;
