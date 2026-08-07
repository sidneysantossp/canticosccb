import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useCopyrightClaimsStore from '@/stores/copyrightClaimsStore';
import { getLogoByType } from '@/lib/mockApis';
import { getOpenReportsCount } from '@/lib/admin/reportsApi';
import { getAdminStats } from '@/lib/admin/adminStatsApi';
import { getSupportInboxStats } from '@/lib/supportChatApi';
import {
  LayoutDashboard,
  Music,
  Users,
  Mic2,
  CheckCircle,
  Palette,
  BarChart3,
  Settings,
  Target,
  Wrench,
  Album,
  Grid,
  Tag,
  CreditCard,
  List,
  Flag,
  MessageSquare,
  Image,
  Mail,
  TrendingUp,
  Gift,
  Megaphone,
  Database,
  Shield,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers,
  Book,
  BookOpen,
  Copyright,
  Bell,
  Clock
} from 'lucide-react';

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { getPendingClaimsCount, loadClaims } = useCopyrightClaimsStore();
  const [pendingComposersCount, setPendingComposersCount] = useState(0);
  const [pendingSongsCount, setPendingSongsCount] = useState(0);
  const [pendingAlbumsCount, setPendingAlbumsCount] = useState(0);
  const [approvalsCount, setApprovalsCount] = useState(0);
  const [openReportsCount, setOpenReportsCount] = useState(0);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [logoSrc, setLogoSrc] = useState<string>('/logo-canticos-ccb.png');

  useEffect(() => {
    void loadClaims();
  }, [loadClaims]);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const stats = await getAdminStats();
        setPendingComposersCount(stats.pendingComposers);
        setPendingSongsCount(stats.pendingSongs);
        setPendingAlbumsCount(stats.pendingAlbums);
        setApprovalsCount(stats.pendingSongs + stats.pendingAlbums + stats.pendingComposers);
      } catch (error) {
        console.error('Erro ao carregar contagens do admin:', error);
      }
    };

    void loadCounts();
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadOpenCount = async () => {
      try {
        const count = await getOpenReportsCount();
        setOpenReportsCount(count);
      } catch (error) {
        console.error('Erro ao carregar contagem de denúncias abertas:', error);
      }
    };

    void loadOpenCount();
    const interval = setInterval(loadOpenCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadSupportCount = async () => {
      try {
        const stats = await getSupportInboxStats({ role: 'admin' });
        setSupportUnreadCount(stats.unread);
      } catch (error) {
        console.error('Erro ao carregar contagem do chat:', error);
      }
    };

    void loadSupportCount();
    const interval = setInterval(loadSupportCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Carregar logo oficial (cache em sessionStorage)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cached = sessionStorage.getItem('primaryLogoUrl');
        if (cached && mounted) {
          setLogoSrc(cached);
          return;
        }
        const logo = await getLogoByType('primary');
        if (mounted && logo?.url) {
          setLogoSrc(logo.url);
          sessionStorage.setItem('primaryLogoUrl', logo.url);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSection = (section: string) => {
    if (expandedSections.includes(section)) {
      // Se já está aberta, fecha
      setExpandedSections([]);
    } else {
      // Se está fechada, abre apenas ela (fecha todas as outras)
      setExpandedSections([section]);
    }
  };

  const menuSections = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      items: [
        { path: '/admin', label: 'Visão Geral', icon: LayoutDashboard },
        { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 }
      ]
    },
    {
      id: 'content',
      title: 'Conteúdo',
      icon: Music,
      items: [
        { path: '/admin/hymns', label: 'Hinos', icon: Music },
        { path: '/admin/songs/pending', label: 'Hinos Pendentes', icon: CheckCircle, badge: pendingSongsCount },
        { path: '/admin/albums/pending', label: 'Álbuns Pendentes', icon: Clock, badge: pendingAlbumsCount },
        { path: '/admin/albums', label: 'Álbuns', icon: Album },
        { path: '/admin/collections', label: 'Coletâneas', icon: Layers },
        { path: '/admin/bible-narrated', label: 'Bíblia Narrada', icon: Book },
        { path: '/admin/cifras', label: 'Cifras', icon: FileText },
        { path: '/admin/hinario', label: 'Hinário', icon: BookOpen },
        { path: '/admin/categories', label: 'Categorias', icon: Grid },
        { path: '/admin/genres', label: 'Gêneros', icon: List },
        { path: '/admin/tags', label: 'Tags', icon: Tag }
      ]
    },
    {
      id: 'users',
      title: 'Usuários',
      icon: Users,
      items: [
        { path: '/admin/users', label: 'Todos os Usuários', icon: Users },
        { path: '/admin/users/playlists', label: 'Playlists dos Usuários', icon: List }
      ]
    },
    {
      id: 'composers',
      title: 'Compositores',
      icon: Mic2,
      items: [
        { path: '/admin/composers', label: 'Todos os Compositores', icon: Mic2 },
        { path: '/admin/composers/pending', label: 'Aprovação Pendente', icon: CheckCircle, badge: pendingComposersCount },
        { path: '/admin/composers/verified', label: 'Verificados', icon: Shield },
        { path: '/admin/composers/royalties', label: 'Royalties', icon: CreditCard }
      ]
    },
    {
      id: 'moderation',
      title: 'Moderação',
      icon: Flag,
      items: [
        { path: '/admin/approvals', label: 'Aprovações', icon: CheckCircle, badge: approvalsCount },
        { path: '/admin/reports', label: 'Denúncias', icon: Flag, badge: openReportsCount },
        { path: '/admin/copyright-claims', label: 'Direitos Autorais', icon: Copyright, badge: getPendingClaimsCount() },
        { path: '/admin/comments', label: 'Comentários', icon: MessageSquare }
      ]
    },
    {
      id: 'notifications',
      title: 'Notificações',
      icon: Bell,
      items: [
        { path: '/admin/chat', label: 'Chat', icon: MessageSquare, badge: supportUnreadCount },
        { path: '/admin/notices', label: 'Avisos', icon: Megaphone }
      ]
    },
    {
      id: 'appearance',
      title: 'Aparência',
      icon: Palette,
      items: [
        { path: '/admin/banners', label: 'Banners', icon: Image },
        { path: '/admin/logos', label: 'Logos', icon: Palette },
        { path: '/admin/theme', label: 'Cores e Tema', icon: Palette },
        { path: '/admin/menus', label: 'Menus', icon: List },
        { path: '/admin/seo', label: 'SEO', icon: TrendingUp }
      ]
    },
    {
      id: 'reports',
      title: 'Relatórios',
      icon: FileText,
      items: [
        { path: '/admin/reports/analytics', label: 'Analytics Global', icon: BarChart3 },
        { path: '/admin/reports/custom', label: 'Relatórios Personalizados', icon: FileText },
        { path: '/admin/reports/logs', label: 'Logs do Sistema', icon: Database }
      ]
    },
    {
      id: 'settings',
      title: 'Configurações',
      icon: Settings,
      items: [
        { path: '/admin/settings/general', label: 'Gerais', icon: Settings },
        { path: '/admin/settings/users', label: 'Usuários', icon: Users },
        { path: '/admin/settings/composers', label: 'Compositores', icon: Mic2 },
        { path: '/admin/settings/email', label: 'Emails', icon: Mail },
        { path: '/admin/settings/security', label: 'Segurança', icon: Shield },
        { path: '/admin/settings/integrations', label: 'Integrações', icon: Database }
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing',
      icon: Megaphone,
      items: [
        { path: '/admin/featured', label: 'Destaque', icon: Target },
        { path: '/admin/playlists-editorial', label: 'Playlists Editoriais', icon: List },
        { path: '/admin/promotions', label: 'Promoções', icon: Gift },
        { path: '/admin/campaigns', label: 'Campanhas', icon: Megaphone }
      ]
    },
    {
      id: 'tools',
      title: 'Ferramentas',
      icon: Wrench,
      items: [
        { path: '/admin/import', label: 'Importação', icon: Database },
        { path: '/admin/export', label: 'Exportação', icon: Database },
        { path: '/admin/backup', label: 'Backup', icon: Shield },
        { path: '/admin/api', label: 'API', icon: Wrench }
      ]
    }
  ];

  // Expandir automaticamente a seção que contém a rota ativa
  useEffect(() => {
    const currentSection = menuSections.find(section =>
      section.items.some(item => item.path === location.pathname)
    );
    
    if (currentSection && !expandedSections.includes(currentSection.id)) {
      setExpandedSections([currentSection.id]);
    }
  }, [location.pathname]);

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 bg-black h-full fixed left-0 top-0 z-30 pt-6 pb-10 overflow-y-auto border-r border-gray-800">
      {/* Logo oficial */}
      <div className="px-6 mb-8">
        <Link to="/admin" className="inline-flex items-center">
          <img
            src={logoSrc}
            alt="Cânticos CCB"
            className="h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
            onError={() => {
              if (logoSrc !== '/logo-canticos-ccb.png') setLogoSrc('/logo-canticos-ccb.png');
            }}
          />
        </Link>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 space-y-1">
        {menuSections.map((section) => {
          const SectionIcon = section.icon;
          const isExpanded = expandedSections.includes(section.id);

          return (
            <div key={section.id} className="mb-1">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-2.5">
                  <SectionIcon className="w-[18px] h-[18px]" />
                  <span className="font-medium text-[13px]">{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Section Items */}
              {isExpanded && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg transition-all text-[13px] ${
                          active
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <ItemIcon className="w-[15px] h-[15px]" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {/* Indicador ativo/hover (barra direita) */}
                        <span
                          className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-l ${
                            active ? 'bg-yellow-500' : 'bg-yellow-500/0 group-hover:bg-yellow-500/60'
                          }`}
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer - Voltar ao Site */}
      <div className="px-6 mt-4 pt-4 border-t border-gray-800">
        <Link
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
        >
          <Music className="w-[18px] h-[18px]" />
          <span className="text-[13px]">Voltar ao Site</span>
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;
