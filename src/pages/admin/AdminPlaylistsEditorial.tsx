import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music, Plus, Edit, Trash2, Play, Heart, RefreshCw, Eye, AlertTriangle } from 'lucide-react';
import { getAll as getAllPlaylists } from '@/lib/admin/playlistsAdminApi';

interface EditorialPlaylist {
  id: string;
  title: string;
  description?: string;
  category: string;
  mood?: string;
  curator_name?: string;
  cover_url?: string;
  is_featured: boolean;
  is_active: boolean;
  plays_count: number;
  likes_count: number;
  followers_count: number;
  items_count?: number;
  created_at: string;
}

const AdminPlaylistsEditorial: React.FC = () => {
  console.log('🎵 AdminPlaylistsEditorial component mounting...');
  const [playlists, setPlaylists] = useState<EditorialPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<EditorialPlaylist | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'worship',
    mood: '',
    curator_name: 'Equipe Editorial CCB',
    cover_url: '',
    is_featured: false,
    is_active: true
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    featured: 0,
    totalPlays: 0
  });

  const categories = [
    { value: 'all', label: 'Todas', color: 'gray' },
    { value: 'devotional', label: 'Devocional', color: 'blue' },
    { value: 'worship', label: 'Adoração', color: 'purple' },
    { value: 'doctrine', label: 'Doutrina', color: 'green' },
    { value: 'youth', label: 'Jovens', color: 'yellow' },
    { value: 'children', label: 'Infantil', color: 'pink' },
    { value: 'special', label: 'Especial', color: 'red' },
    { value: 'classic', label: 'Clássico', color: 'orange' }
  ];

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      console.log('🔄 loadData started');
      setIsLoading(true);
      setError(null);
      
      // Load playlists from API
      console.log('📡 Calling getAllPlaylists...');
      const data = await getAllPlaylists();
      console.log('✅ getAllPlaylists returned:', data.length, 'playlists');
      
      // Filter by category if needed
      const filteredPlaylists = selectedCategory === 'all' 
        ? data 
        : data.filter(p => p.category === selectedCategory);
      
      console.log('📊 Setting playlists:', filteredPlaylists.length);
      setPlaylists(filteredPlaylists);
      
      // Update stats
      console.log('📈 Updating stats...');
      setStats({
        total: data.length,
        active: data.filter(p => p.is_active).length,
        featured: data.filter(p => p.is_featured).length,
        totalPlays: data.reduce((sum, p) => sum + p.plays_count, 0)
      });
    } catch (error: any) {
      console.error('❌ Error loading playlists:', error);
      setError(error?.message || 'Erro ao carregar playlists');
    } finally {
      console.log('🏁 loadData finished, isLoading set to false');
      setIsLoading(false);
    }
  };

  const loadDataOLD = async () => {
    try {
      setIsLoading(true);
      
      // OLD Mock data
      const mockPlaylistsOLD: EditorialPlaylist[] = [
        {
          id: '1',
          title: 'Hinos de Adoração',
          description: 'Uma seleção especial de hinos para adoração',
          category: 'worship',
          mood: 'reflexivo',
          curator_name: 'Equipe Editorial CCB',
          cover_url: 'https://via.placeholder.com/300x300',
          is_featured: true,
          is_active: true,
          plays_count: 15420,
          likes_count: 892,
          followers_count: 1234,
          items_count: 25,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Culto de Doutrina',
          description: 'Hinos apropriados para estudos doutrinários',
          category: 'doctrine',
          mood: 'calmo',
          curator_name: 'Equipe Editorial CCB',
          cover_url: 'https://via.placeholder.com/300x300',
          is_featured: true,
          is_active: true,
          plays_count: 8750,
          likes_count: 456,
          followers_count: 789,
          items_count: 18,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Hinos para Jovens',
          description: 'Seleção de hinos que falam ao coração da juventude',
          category: 'youth',
          mood: 'energetico',
          curator_name: 'Equipe Editorial CCB',
          cover_url: 'https://via.placeholder.com/300x300',
          is_featured: false,
          is_active: true,
          plays_count: 5230,
          likes_count: 312,
          followers_count: 567,
          items_count: 20,
          created_at: new Date().toISOString()
        }
      ];

      const filtered = selectedCategory === 'all' 
        ? mockPlaylistsOLD 
        : mockPlaylistsOLD.filter(p => p.category === selectedCategory);

      setPlaylists(filtered);
      
      setStats({
        total: mockPlaylistsOLD.length,
        active: mockPlaylistsOLD.filter(p => p.is_active).length,
        featured: mockPlaylistsOLD.filter(p => p.is_featured).length,
        totalPlays: mockPlaylistsOLD.reduce((sum, p) => sum + p.plays_count, 0)
      });

    } catch (error) {
      console.error('Erro ao carregar playlists editoriais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (playlist?: EditorialPlaylist) => {
    if (playlist) {
      setEditingPlaylist(playlist);
      setFormData({
        title: playlist.title,
        description: playlist.description || '',
        category: playlist.category,
        mood: playlist.mood || '',
        curator_name: playlist.curator_name || 'Equipe Editorial CCB',
        cover_url: playlist.cover_url || '',
        is_featured: playlist.is_featured,
        is_active: playlist.is_active
      });
    } else {
      setEditingPlaylist(null);
      setFormData({
        title: '',
        description: '',
        category: 'worship',
        mood: '',
        curator_name: 'Equipe Editorial CCB',
        cover_url: '',
        is_featured: false,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.title) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar playlist editorial:', error);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      loadData();
    } catch (error) {
      console.error('Erro ao alterar status da playlist:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!confirm('Deseja realmente excluir esta playlist?')) return;
      await new Promise(resolve => setTimeout(resolve, 500));
      loadData();
    } catch (error) {
      console.error('Erro ao excluir playlist:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.color || 'gray';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  console.log('🎨 Rendering - isLoading:', isLoading, 'error:', error, 'playlists:', playlists.length);
  
  if (isLoading) {
    console.log('⏳ Showing loading state');
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando playlists...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar playlists</h2>
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
          <h1 className="text-3xl font-bold text-white mb-2">Playlists Editoriais</h1>
          <p className="text-gray-400">Gerencie as playlists curadas pela equipe</p>
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
            to="/admin/playlists/criar"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nova Playlist
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Music className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Playlists</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <Eye className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Playlists Ativas</p>
              <p className="text-white text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Music className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Em Destaque</p>
              <p className="text-white text-2xl font-bold">{stats.featured}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Play className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Plays</p>
              <p className="text-white text-2xl font-bold">{formatNumber(stats.totalPlays)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category.value
                ? `bg-${category.color}-500/20 text-${category.color}-400 border border-${category.color}-500/30`
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Playlists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            {/* Cover */}
            <div className="relative aspect-square bg-gray-800">
              <img 
                src={playlist.cover_url} 
                alt={playlist.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/300x300/1a1a1a/ffffff?text=Playlist';
                }}
              />
              <div className="absolute top-2 right-2 flex gap-2">
                {playlist.is_featured && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                    Destaque
                  </span>
                )}
                <span className={`px-2 py-1 text-xs rounded-full border ${
                  playlist.is_active
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>
                  {playlist.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className={`px-2 py-1 text-xs rounded-full border bg-${getCategoryColor(playlist.category)}-500/20 text-${getCategoryColor(playlist.category)}-400 border-${getCategoryColor(playlist.category)}-500/30`}>
                  {categories.find(c => c.value === playlist.category)?.label}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-white font-semibold text-lg mb-1">{playlist.title}</h3>
              {playlist.description && (
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{playlist.description}</p>
              )}
              {playlist.curator_name && (
                <p className="text-gray-500 text-xs mb-3">Por {playlist.curator_name}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm mb-4">
                <div className="flex items-center gap-1 text-gray-400">
                  <Music className="w-4 h-4" />
                  <span>{playlist.items_count} hinos</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Play className="w-4 h-4" />
                  <span>{formatNumber(playlist.plays_count)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Heart className="w-4 h-4" />
                  <span>{formatNumber(playlist.likes_count)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={playlist.is_active}
                    onChange={() => handleToggleStatus(playlist.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>

                <div className="flex gap-2">
                  <Link
                    to={`/admin/playlists/editar/${playlist.id}`}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4 text-blue-400" />
                  </Link>
                  <button
                    onClick={() => handleDelete(playlist.id)}
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

      {playlists.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
          <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma playlist encontrada</p>
          <p className="text-gray-500 text-sm">Crie sua primeira playlist editorial</p>
        </div>
      )}

      {/* Modal de Edição/Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">
                {editingPlaylist ? 'Editar Playlist Editorial' : 'Nova Playlist Editorial'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder="Digite o título da playlist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  rows={3}
                  placeholder="Descreva a playlist"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    {categories.filter(c => c.value !== 'all').map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Humor/Mood
                  </label>
                  <input
                    type="text"
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="ex: calmo, alegre, reflexivo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Curador
                </label>
                <input
                  type="text"
                  value={formData.curator_name}
                  onChange={(e) => setFormData({ ...formData, curator_name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder="Nome do curador"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL da Capa
                </label>
                <input
                  type="text"
                  value={formData.cover_url}
                  onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-gray-300">Destacar playlist</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-gray-300">Playlist ativa</span>
                </label>
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
                {editingPlaylist ? 'Salvar Alterações' : 'Criar Playlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlaylistsEditorial;
