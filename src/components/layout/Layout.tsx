import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Player from './Player';
import { usePlayerStore } from '@/stores/playerStore';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentTrack } = usePlayerStore();

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      {/* Header */}
      <Header />
      
      
      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-4 p-6">
        {/* Sidebar - Desktop Only */}
        <aside className="hidden lg:block">
          <Sidebar />
        </aside>
        
        {/* Main Content */}
        <main className="min-h-0 bg-background-primary rounded-lg overflow-hidden px-0">
          {children || <Outlet />}
        </main>
        
        {/* Right Sidebar - Desktop Only */}
        <aside className="hidden lg:block">
          <div className="bg-background-secondary rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Atividade dos Amigos</h3>
            <p className="text-text-muted text-sm">
              Conecte-se com amigos para ver o que eles estão ouvindo.
            </p>
          </div>
        </aside>
      </div>
      
      {/* Mobile Navigation - Mobile Only */}
      <MobileNav />
      
      {/* Audio Player - Always visible when track is playing */}
      {currentTrack && <Player />}
    </div>
  );
};

export default Layout;
