import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Plus, Edit, Trash2, Eye, MousePointer, RefreshCw, Image, Calendar, AlertTriangle } from 'lucide-react';
import { getFeaturedItems, getFeaturedStats, toggleFeaturedStatus, deleteFeaturedItem } from '@/lib/admin/featuredAdminApi';

interface FeaturedItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  content_type: 'song' | 'album' | 'playlist' | 'composer' | 'hymn' | 'custom';
  image_url: string;
  section: 'hero' | 'spotlight' | 'trending' | 'new' | 'recommended';
  position: number;
  priority: number;
  is_active: boolean;
  views_count: number;
  clicks_count: number;
  start_date?: string;
  end_date?: string;
  cta_text: string;
  created_at: string;
}

const AdminFeatured: React.FC = () => {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeaturedItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    content_type: 'hymn' as FeaturedItem['content_type'],
    image_url: '',
    section: 'hero' as FeaturedItem['section'],
    position: 0,
    priority: 50,
    cta_text: 'Ver Mais',
    start_date: '',
    end_date: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalViews: 0,
    totalClicks: 0
  });

  const sections = [
    { value: 'all', label: 'Todas as Seções', color: 'gray' },
    { value: 'hero', label: 'Hero (Principal)', color: 'red' },
    { value: 'spotlight', label: 'Em Destaque', color: 'yellow' },
    { value: 'trending', label: 'Tendências', color: 'orange' },
    { value: 'new', label: 'Novidades', color: 'green' },
    { value: 'recommended', label: 'Recomendados', color: 'blue' }
  ];

  const contentTypes = [
    { value: 'hymn', label: 'Hino' },
    { value: 'song', label: 'Música' },
    { value: 'album', label: 'Álbum' },
    { value: 'playlist', label: 'Playlist' },
    { value: 'composer', label: 'Compositor' },
    { value: 'custom', label: 'Personalizado' }
  ];

  useEffect(() => {
    loadData();
  }, [selectedSection]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Loading featured items...');
      const fetchedItems = await getFeaturedItems({ content_type: 'hymn' });
      console.log('✅ Items loaded:', fetchedItems);
      setItems(fetchedItems);
      const fetchedStats = await getFeaturedStats();
      console.log('📊 Stats loaded:', fetchedStats);
      setStats(fetchedStats);
    } catch (err: any) {
      console.error('❌ Error loading featured items:', err);
      setError(err?.message || 'Erro ao carregar itens em destaque');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const item = items.find(i => i.id === id);
      if (!item) return;
      await toggleFeaturedStatus(id, !item.is_active);
      loadData();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Tem certeza que deseja excluir o item "${items.find(i => i.id === id)?.title}" dos destaques?`)) return;
    
    try {
      await deleteFeaturedItem(id);
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleOpenModal = (item?: FeaturedItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        subtitle: item.subtitle || '',
        description: item.description || '',
        content_type: item.content_type,
        image_url: item.image_url,
        section: item.section,
        position: item.position,
        priority: item.priority,
        cta_text: item.cta_text,
        start_date: item.start_date || '',
        end_date: item.end_date || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        content_type: 'hymn',
        image_url: '',
        section: 'hero',
        position: 0,
        priority: 50,
        cta_text: 'Ver Mais',
        start_date: '',
        end_date: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.image_url) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error on save featured item:', error);
    }
  };

  const getSectionColor = (section: string) => {
    const sec = sections.find(s => s.value === section);
    return sec?.color || 'gray';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando itens em destaque...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar itens em destaque</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Conteúdo em Destaque</h1>
          <p className="text-gray-400">Gerencie o conteúdo exibido na página inicial</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Atualizar
          </button>
          <Link
            to="/admin/featured/criar"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Item
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Star className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Itens</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <Star className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Itens Ativos</p>
              <p className="text-white text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Eye className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Visualizações</p>
              <p className="text-white text-2xl font-bold">{formatNumber(stats.totalViews)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <MousePointer className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Cliques</p>
              <p className="text-white text-2xl font-bold">{formatNumber(stats.totalClicks)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Filters */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.value}
            onClick={() => setSelectedSection(section.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedSection === section.value
                ? `bg-${section.color}-500/20 text-${section.color}-400 border border-${section.color}-500/30`
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            {/* Image */}
            <div className="relative aspect-video bg-gray-800">
              <img 
                src={item.image_url} 
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x200/1a1a1a/ffffff?text=Sem+Imagem';
                }}
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <span className={`px-2 py-1 text-xs rounded-full border ${
                  item.is_active
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>
                  {item.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className={`px-2 py-1 text-xs rounded-full border bg-${getSectionColor(item.section)}-500/20 text-${getSectionColor(item.section)}-400 border-${getSectionColor(item.section)}-500/30`}>
                  {sections.find(s => s.value === item.section)?.label}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-white font-semibold text-lg mb-1">{item.title}</h3>
              {item.subtitle && (
                <p className="text-gray-400 text-sm mb-2">{item.subtitle}</p>
              )}
              {item.description && (
                <p className="text-gray-500 text-xs mb-3 line-clamp-2">{item.description}</p>
              )}

              {/* Metrics */}
              <div className="flex items-center gap-4 text-sm mb-4">
                <div className="flex items-center gap-1 text-gray-400">
                  <Eye className="w-4 h-4" />
                  <span>{formatNumber(item.views_count)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <MousePointer className="w-4 h-4" />
                  <span>{formatNumber(item.clicks_count)}</span>
                </div>
                <div className="text-gray-500 text-xs">
                  CTR: {item.views_count > 0 ? ((item.clicks_count / item.views_count) * 100).toFixed(1) : 0}%
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.is_active}
                    onChange={() => handleToggleStatus(item.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>

                <div className="flex gap-2">
                  <Link
                    to={`/admin/featured/editar/${item.id}`}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4 text-blue-400" />
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
          <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum item encontrado</p>
          <p className="text-gray-500 text-sm">Crie seu primeiro item em destaque</p>
        </div>
      )}

      {/* Modal de Edição/Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">
                {editingItem ? 'Editar Item em Destaque' : 'Novo Item em Destaque'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="Digite o título"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="Digite o subtítulo"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    rows={3}
                    placeholder="Digite a descrição"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Conteúdo *
                  </label>
                  <select
                    value={formData.content_type}
                    onChange={(e) => setFormData({ ...formData, content_type: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    {contentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Seção *
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    {sections.filter(s => s.value !== 'all').map(section => (
                      <option key={section.value} value={section.value}>{section.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL da Imagem *
                  </label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Posição
                  </label>
                  <input
                    type="number"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prioridade
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Texto do Botão
                  </label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="Ver Mais"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                {editingItem ? 'Salvar Alterações' : 'Criar Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeatured;
