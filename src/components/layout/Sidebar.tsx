import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Library, Plus, Heart, Download } from 'lucide-react';
import { mockPlaylists } from '@/data/mockData';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/search', icon: Search, label: 'Buscar' },
    { path: '/library', icon: Library, label: 'Sua Biblioteca' }
  ];

  const libraryItems = [
    { path: '/playlist/create', icon: Plus, label: 'Criar Playlist' },
    { path: '/liked', icon: Heart, label: 'Curtidas' },
    { path: '/downloads', icon: Download, label: 'Baixados' }
  ];

  return (
    <div className="bg-background-secondary rounded-lg h-full flex flex-col">
      {/* Main Navigation */}
      <div className="p-6">
        <nav className="space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-hover transition-colors ${
                isActive(path) ? 'text-text-primary bg-background-hover' : ''
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-medium leading-none">{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Playlists */}
      <div className="flex-1 px-6 pb-6">
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-text-muted text-sm font-semibold mb-3 uppercase tracking-wider">
            Minhas Playlists
          </h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {mockPlaylists.map((playlist) => (
              <Link
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                className={`block px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors ${
                  isActive(`/playlist/${playlist.id}`) ? 'text-text-primary bg-background-hover' : ''
                }`}
              >
                <span className="text-sm truncate">{playlist.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
