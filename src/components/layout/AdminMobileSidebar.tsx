import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useCopyrightClaimsStore from '@/stores/copyrightClaimsStore';
import { getOpenReportsCount } from '@/lib/admin/reportsApi';
import { getAdminStats } from '@/lib/admin/adminStatsApi';
import {
  X,
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
  Copyright
} from 'lucide-react';

interface AdminMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminMobileSidebar: React.FC<AdminMobileSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { getPendingClaimsCount, loadClaims } = useCopyrightClaimsStore();
  const [pendingComposersCount, setPendingComposersCount] = useState(0);
  const [pendingSongsCount, setPendingSongsCount] = useState(0);
  const [approvalsCount, setApprovalsCount] = useState(0);
  const [openReportsCount, setOpenReportsCount] = useState(0);

  useEffect(() => {
    void loadClaims();
  }, [loadClaims]);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const stats = await getAdminStats();
        setPendingComposersCount(stats.pendingComposers);
        setPendingSongsCount(stats.pendingSongs);
        setApprovalsCount(stats.pendingSongs + stats.pendingComposers);
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
        { path: '/admin/songs/pending', label: 'Aprovação Pendente', icon: CheckCircle, badge: pendingSongsCount },
        { path: '/admin/albums', label: 'Álbuns', icon: Album },
        { path: '/admin/collections', label: 'Coletâneas', icon: Layers },
        { path: '/admin/cifras', label: 'Cifras', icon: FileText },
        { path: '/admin/bible-narrated', label: 'Bíblia Narrada', icon: Book },
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

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-black z-50 lg:hidden overflow-y-auto border-r border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <Link to="/admin" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl block">Admin</span>
              <span className="text-red-400 text-xs font-medium">Painel de Controle</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-1">
          {menuSections.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections.includes(section.id);

            return (
              <div key={section.id} className="mb-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <SectionIcon className="w-5 h-5" />
                    <span className="font-medium text-sm">{section.title}</span>
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
                          onClick={onClose}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm ${
                            active
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <ItemIcon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
          >
            <Music className="w-5 h-5" />
            <span className="text-sm">Voltar ao Site</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdminMobileSidebar;
