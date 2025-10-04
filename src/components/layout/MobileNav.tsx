import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Library, User } from 'lucide-react';

const MobileNav: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/library', icon: Library, label: 'Library' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background-primary border-t border-gray-800 z-40">
      <div className="grid grid-cols-4 h-16">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              isActive(path)
                ? 'text-primary-500'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
