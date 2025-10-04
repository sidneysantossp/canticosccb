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
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/library', icon: Library, label: 'Your Library' }
  ];

  const libraryItems = [
    { path: '/playlist/create', icon: Plus, label: 'Create Playlist' },
    { path: '/liked', icon: Heart, label: 'Liked Songs' },
    { path: '/downloads', icon: Download, label: 'Downloaded' }
  ];

  return (
    <div className="bg-background-secondary rounded-lg h-full flex flex-col">
      {/* Main Navigation */}
      <div className="p-6">
        <nav className="space-y-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link ${isActive(path) ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Library Section */}
      <div className="px-6 pb-4">
        <nav className="space-y-2">
          {libraryItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link ${isActive(path) ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Playlists */}
      <div className="flex-1 px-6 pb-6">
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-text-muted text-sm font-semibold mb-3 uppercase tracking-wider">
            Playlists
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
