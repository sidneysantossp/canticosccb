import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, User, Heart, LogOut, ChevronDown, Mic } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { searchHinos } from '@/data/mockData';

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchHinos(query);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-background-primary shadow-lg" style={{ boxShadow: '0 6px 25px -2px rgba(0, 0, 0, 0.6)' }}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="https://canticosccb.com.br/logo-canticos-ccb.png" 
            alt="Cânticos CCB" 
            className="h-8 w-auto"
          />
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden md:block flex-1 max-w-md mx-8 relative">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Busque por hinos ou compositores"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
                className="w-full pl-10 pr-12 py-2 bg-background-tertiary border border-gray-700 rounded-full text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-background-hover transition-colors">
                <Mic className="w-4 h-4 text-text-muted hover:text-white" />
              </button>
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background-secondary border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
              {searchResults.slice(0, 6).map((hino) => (
                <Link
                  key={hino.id}
                  to={`/hino/${hino.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-background-hover transition-colors"
                  onClick={() => setShowResults(false)}
                >
                  <img 
                    src={hino.coverUrl} 
                    alt={hino.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-medium truncate">
                      {hino.title}
                    </p>
                    <p className="text-text-muted text-sm">
                      {hino.category} • {hino.artist}
                    </p>
                  </div>
                </Link>
              ))}
              {searchResults.length > 6 && (
                <Link
                  to={`/search?q=${encodeURIComponent(searchQuery)}`}
                  className="block p-3 text-center text-primary-500 hover:bg-background-hover transition-colors border-t border-gray-700"
                  onClick={() => setShowResults(false)}
                >
                  Ver todos os {searchResults.length} resultados
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Register Button */}
          {!user && (
            <Link
              to="/register"
              className="hidden sm:block btn btn-primary btn-sm"
            >
              Registrar
            </Link>
          )}

          {/* User Menu */}
          {user ? (
            <div
              className="relative flex items-center gap-3"
            >
              {/* Registrar button (outlined green) - left side */}
              <Link
                to="/register"
                className="hidden sm:inline-flex items-center rounded-full border border-primary-500 text-primary-500 px-4 py-1.5 font-semibold hover:bg-primary-500/10 transition-colors"
              >
                Registrar
              </Link>

              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-background-hover transition-colors bg-background-secondary/50 backdrop-blur-sm border border-gray-700/50"
              >
                <img
                  src={user.avatar || 'https://i.pravatar.cc/40'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-text-primary">
                  {user.name}
                </span>
                <ChevronDown className="hidden sm:block w-4 h-4 text-text-muted" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 bg-background-secondary border border-gray-700 rounded-lg shadow-xl z-50"
                >
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-background-hover transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Meu Perfil
                  </Link>
                  <Link
                    to="/liked"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-background-hover transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Heart className="w-4 h-4" />
                    Meus Favoritos
                  </Link>
                  <hr className="border-gray-700" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-background-hover transition-colors text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-ghost btn-sm"
            >
              Entrar
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-full hover:bg-background-hover transition-colors"
          >
            <Menu className="w-5 h-5 text-text-primary" />
          </button>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showResults || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowResults(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;
