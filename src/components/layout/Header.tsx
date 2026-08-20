import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, User, Heart, LogOut, ChevronDown, Mic, Shield, Music, Bell, Megaphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import UserMobileSidebar from './UserMobileSidebar';
import { buildAvatarUrl } from '@/lib/media-helper';
import ComposerMobileSidebar from './ComposerMobileSidebar';
import AdminMobileSidebar from './AdminMobileSidebar';
import PublicMobileSidebar from './PublicMobileSidebar';
import { quickSearch } from '@/lib/searchApi';
import { buildAlbumUrl, buildCompositorUrl, buildHinoUrl } from '@/utils/slugUrl';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { clearAuthStorage } from '@/lib/supabase-auth';
import { resolveActiveComposer } from '@/lib/activeComposer';

type HeaderSearchItem = {
  id: string;
  type: 'hymn' | 'composer' | 'album' | 'playlist';
  title: string;
  subtitle: string;
  imageUrl?: string;
  url: string;
  matchScore: number;
};

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HeaderSearchItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchRequestId = useRef(0);
  const headerRef = useRef<HTMLElement | null>(null);

  const { user, profile, signOut, isAdmin, isComposer, managingComposerId } = useAuth();
  const [activeComposerName, setActiveComposerName] = useState('');
  const { isMenuOpen, openMenu, closeMenu } = useMobileMenu();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const profileName = (profile as any)?.name || (profile as any)?.nome || user?.email?.split('@')[0] || 'Usuário';
  const isComposerArea = location.pathname.startsWith('/composer') || location.pathname.startsWith('/compositor');
  const displayName = activeComposerName || profileName;
  const {
    supported: voiceSupported,
    isListening: isVoiceListening,
    error: voiceError,
    clearError: clearVoiceError,
    toggleListening,
  } = useVoiceSearch({
    onInterimResult: (text) => setSearchQuery(text),
    onFinalResult: (text) => {
      setSearchQuery(text);
      handleSearch(text);
      navigate(`/search?q=${encodeURIComponent(text)}`);
      setShowResults(false);
    },
  });

  useEffect(() => {
    let cancelled = false;

    const loadComposerName = async () => {
      if (!user || (!isComposer && !isComposerArea)) {
        setActiveComposerName('');
        return;
      }

      try {
        const activeComposer = await resolveActiveComposer({
          userId: user.id,
          userEmail: user.email,
          managingComposerId,
        });
        if (!cancelled) {
          setActiveComposerName(activeComposer?.nome_artistico || activeComposer?.nome || '');
        }
      } catch (error) {
        console.warn('Não foi possível resolver o nome do compositor no Header:', error);
        if (!cancelled) setActiveComposerName('');
      }
    };

    void loadComposerName();
    return () => {
      cancelled = true;
    };
  }, [isComposer, isComposerArea, managingComposerId, user?.email, user?.id]);

  // Fechar dropdowns ao clicar fora do header (sem overlay bloqueante)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setShowResults(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fechar dropdowns ao mudar de rota
  useEffect(() => {
    setShowResults(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== '/search' && location.pathname !== '/buscar') {
      return;
    }

    const currentQuery = new URLSearchParams(location.search).get('q') || '';
    setSearchQuery((prev) => (prev === currentQuery ? prev : currentQuery));
  }, [location.pathname, location.search]);

  React.useEffect(() => {
    if (user && profile) {
      if (profile.is_composer && profile.is_admin) {
        console.error('🚨 ERRO DE SEGURANÇA: Usuário tem is_admin E is_composer = true!');
        console.error('Isso pode ser um erro de dados no banco. Verifique a tabela users.');
      }
    }
  }, [user, profile, isAdmin, isComposer]);
  
  // Detectar tipo de área
  const isAdminPanel = location.pathname.startsWith('/admin/');
  const isComposerPanel = location.pathname.startsWith('/composer/');
  
  // Rotas do dashboard do usuário
  const userDashboardRoutes = ['/profile', '/edit-profile', '/settings'];
  const isUserDashboard = userDashboardRoutes.some(route => location.pathname.startsWith(route));
  
  const isPublicArea = !isAdminPanel && !isComposerPanel && !isUserDashboard;
  const typePriority: Record<HeaderSearchItem['type'], number> = {
    composer: 4,
    album: 3,
    hymn: 2,
    playlist: 1,
  };

  // Função de busca com debounce manual
  const handleSearch = (query: string) => {
    if (voiceError) {
      clearVoiceError();
    }
    setSearchQuery(query);
    
    // Limpar timeout anterior
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.trim()) {
      setIsSearching(true);
      const requestId = ++searchRequestId.current;
      
      // Criar novo timeout
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await quickSearch(query);
          const flattenedResults: HeaderSearchItem[] = [
            ...results.hymns.map((hymn) => ({
              id: hymn.id,
              type: 'hymn' as const,
              title: hymn.number ? `${hymn.number} - ${hymn.title}` : hymn.title,
              subtitle: hymn.composer_name || hymn.category_name || 'Hino',
              imageUrl: hymn.cover_url,
              url: buildHinoUrl(hymn.id, hymn.title, hymn.number),
              matchScore: hymn.matchScore || 0,
            })),
            ...results.composers.map((composer) => ({
              id: composer.id,
              type: 'composer' as const,
              title: composer.name,
              subtitle: composer.bio || 'Compositor',
              imageUrl: composer.photo_url,
              url: buildCompositorUrl(composer.id, composer.name),
              matchScore: composer.matchScore || 0,
            })),
            ...results.albums.map((album) => ({
              id: album.id,
              type: 'album' as const,
              title: album.title,
              subtitle: album.artist || 'Álbum',
              imageUrl: album.cover_url,
              url: buildAlbumUrl(album.id, album.title, album.artist),
              matchScore: album.matchScore || 0,
            })),
            ...results.playlists.map((playlist) => ({
              id: playlist.id,
              type: 'playlist' as const,
              title: playlist.name,
              subtitle: playlist.description || 'Playlist',
              imageUrl: playlist.cover_url,
              url: `/playlist/${playlist.id}`,
              matchScore: playlist.matchScore || 0,
            })),
          ];

          const rankedResults = flattenedResults.sort((a, b) =>
            (b.matchScore - a.matchScore) ||
            (typePriority[b.type] - typePriority[a.type]) ||
            a.title.localeCompare(b.title, 'pt-BR')
          );

          if (requestId !== searchRequestId.current) {
            return;
          }

          setSearchResults(rankedResults);
          setShowResults(rankedResults.length > 0);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
          setShowResults(false);
        } finally {
          if (requestId === searchRequestId.current) {
            setIsSearching(false);
          }
        }
      }, 300);
    } else {
      searchRequestId.current += 1;
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  const handleLogout = async () => {
    try {
      setShowUserMenu(false);

      // Timeout reduzido para 1 segundo
      const logoutPromise = signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 1000)
      );
      
      await Promise.race([logoutPromise, timeoutPromise]);

      clearAuthStorage();
      sessionStorage.clear();
      
      // Redirecionar e forçar reload
      window.location.href = '/login';
    } catch (error) {
      console.error('❌ Logout - Error:', error);
      
      // Mesmo com erro, forçar logout local
      clearAuthStorage();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-background-primary shadow-lg" style={{ boxShadow: '0 6px 25px -2px rgba(0, 0, 0, 0.6)' }}>
      <div className="flex items-center justify-between lg:justify-start pl-3 pr-6 lg:pl-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center lg:w-[240px] lg:shrink-0">
          <img
            src="/logo-canticos-ccb.png"
            alt="Cânticos CCB"
            className="h-10 md:h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden md:block flex-1 max-w-xl ml-0 lg:ml-4 relative">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Busque por hino, numero, compositor, album, instrumento ou playlist"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
                className="w-full pl-10 pr-12 py-2 bg-background-tertiary border border-gray-700 rounded-full text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                    isVoiceListening ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-background-hover text-text-muted hover:text-white'
                  }`}
                  aria-label={isVoiceListening ? 'Parar busca por voz' : 'Iniciar busca por voz'}
                  title={isVoiceListening ? 'Ouvindo...' : 'Buscar por voz'}
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background-secondary border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
              {searchResults.slice(0, 6).map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  to={result.url}
                  className="flex items-center gap-3 p-3 hover:bg-background-hover transition-colors"
                  onClick={() => setShowResults(false)}
                >
                  <img 
                    src={result.imageUrl || 'https://via.placeholder.com/40'} 
                    alt={result.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-medium truncate">
                      {result.title}
                    </p>
                    <p className="text-text-muted text-sm flex items-center gap-1">
                      {result.type === 'hymn' && '🎵'}
                      {result.type === 'composer' && '👤'}
                      {result.type === 'album' && '💿'}
                      {result.type === 'playlist' && '📋'}
                      <span>{result.subtitle}</span>
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
                  Ver todos os resultados
                </Link>
              )}
            </div>
          )}
          {isSearching && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background-secondary border border-gray-700 rounded-lg shadow-xl z-50 p-4 text-center">
              <p className="text-text-muted text-sm">Buscando...</p>
            </div>
          )}
          {voiceError && !isSearching && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background-secondary border border-red-500/30 rounded-lg shadow-xl z-50 p-3 text-center">
              <p className="text-red-300 text-sm">{voiceError}</p>
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-1 md:space-x-4 lg:ml-auto">
          {/* Avisos Button - Desktop */}
          <Link
            to="/avisos"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-green-500/10 transition-colors group"
            title="Avisos"
          >
            <Megaphone className="w-4.5 h-4.5 text-green-500 group-hover:text-green-400 transition-colors stroke-[2]" />
            <span className="text-sm font-medium text-green-500 group-hover:text-green-400 transition-colors">Avisos</span>
          </Link>

          {/* Notification Bell - Desktop */}
          {user && (
            <Link
              to={isComposerPanel ? "/composer/notifications" : "/notifications"}
              className="hidden md:inline-flex items-center justify-center relative p-2.5 rounded-full hover:bg-green-500/10 transition-colors group"
              title="Notificações"
            >
              <Bell className="w-5 h-5 text-green-500 group-hover:text-green-400 transition-colors stroke-[2]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-green-500 text-black text-[11px] rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Register Button */}
          {!user && (
            <Link
              to="/register"
              className="hidden lg:inline-flex items-center rounded-full border-2 border-green-500 text-green-500 px-6 py-2 font-semibold hover:bg-green-500/10 transition-colors"
            >
              Registrar
            </Link>
          )}

          {/* User Menu - Desktop Only */}
          {user ? (
            <div
              className="relative hidden md:flex items-center gap-3"
            >
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-background-hover transition-colors bg-background-secondary/50 backdrop-blur-sm border border-gray-700/50"
              >
                <img
                  key={(profile as any)?.avatar_url || (user as any)?.id}
                  src={buildAvatarUrl({
                    id: String((user as any)?.id || ''),
                    avatar_url: (profile as any)?.avatar_url || '',
                    name: displayName
                  })}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const name = displayName;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff&size=200`;
                  }}
                />
                <span className="text-sm font-medium text-text-primary">
                  {displayName}
                </span>
                <ChevronDown className="hidden sm:block w-4 h-4 text-text-muted" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 bg-background-secondary border border-gray-700 rounded-lg shadow-xl z-50 py-2"
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-semibold text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {profile?.email || user?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-hover transition-colors text-text-primary"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </Link>
                    <Link
                      to="/favoritos"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-hover transition-colors text-text-primary"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Heart className="w-4 h-4" />
                      Meus Favoritos
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-hover transition-colors text-text-primary"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Configurações
                    </Link>
                    
                  </div>
                  
                  {/* Panel Links */}
                  {(isAdmin || isComposer) && (
                    <div className="border-t border-gray-700 my-1"></div>
                  )}
                  
                  {/* Admin Panel Link */}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-hover transition-colors text-red-400"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Shield className="w-4 h-4" />
                      Painel Admin
                    </Link>
                  )}
                  
                  {/* Composer Panel Link - Mostra mesmo se for Admin */}
                  {isComposer && (
                    <Link
                      to="/composer"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-hover transition-colors text-purple-400"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/composer');
                        setShowUserMenu(false);
                      }}
                    >
                      <Music className="w-4 h-4" />
                      Painel Compositor
                    </Link>
                  )}
                  
                  {/* Logout */}
                  <div className="border-t border-gray-700 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-left hover:bg-background-hover transition-colors text-red-400"
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
              className="hidden md:inline-flex items-center rounded-full bg-white border-2 border-white text-black px-6 py-2 font-semibold hover:bg-gray-100 transition-colors"
            >
              Entrar
            </Link>
          )}

          {/* Avisos - Mobile */}
          <Link
            to="/avisos"
            className="lg:hidden relative p-2 rounded-full hover:bg-green-500/10 transition-colors group"
            title="Avisos"
          >
            <Megaphone className="w-5 h-5 text-green-500 group-hover:text-green-400 transition-colors" />
          </Link>

          {/* Notification Bell - Mobile */}
          {user && (
            <Link
              to={isComposerPanel ? "/composer/notifications" : "/notifications"}
              className="lg:hidden relative p-2 rounded-full hover:bg-green-500/10 transition-colors group"
              title="Notificações"
            >
              <Bell className="w-5 h-5 text-green-500 group-hover:text-green-400 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Registrar - Mobile (ao lado do menu) */}
          {!user && (
            <Link
              to="/register"
              className="lg:hidden inline-flex items-center px-4 py-2 rounded-full bg-green-500 text-black text-sm font-semibold hover:bg-green-400 transition-colors"
              aria-label="Registrar"
            >
              Registrar
            </Link>
          )}

          {/* Mobile Menu Button - Abre Sidebar */}
          <button
            onClick={openMenu}
            className="lg:hidden p-3 rounded-full hover:bg-background-hover transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-7 h-7 text-text-primary" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isPublicArea ? (
        <PublicMobileSidebar isOpen={isMenuOpen} onClose={closeMenu} />
      ) : (
        <>
          {isAdminPanel && (
            <AdminMobileSidebar isOpen={isMenuOpen} onClose={closeMenu} />
          )}
          {isComposerPanel && (
            <ComposerMobileSidebar isOpen={isMenuOpen} onClose={closeMenu} />
          )}
          {isUserDashboard && (
            <UserMobileSidebar isOpen={isMenuOpen} onClose={closeMenu} />
          )}
        </>
      )}


    </header>
  );
};

export default Header;
