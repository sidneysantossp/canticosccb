import React, { useState, useEffect } from 'react';
import { Menu, Plus, Edit, Trash2, GripVertical, Eye, EyeOff, X, Save, AlertTriangle } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  position: number;
  isActive: boolean;
  children?: MenuItem[];
}

const AdminMenus: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    label: '',
    url: '',
    icon: '',
    isActive: true
  });

  const mockMenuItems: MenuItem[] = [
    {
      id: '1',
      label: 'Início',
      url: '/',
      icon: 'Home',
      position: 1,
      isActive: true
    },
    {
      id: '2',
      label: 'Hinos',
      url: '/songs',
      icon: 'Music',
      position: 2,
      isActive: true,
      children: [
        { id: '2-1', label: 'Todos os Hinos', url: '/songs', position: 1, isActive: true },
        { id: '2-2', label: 'Por Categoria', url: '/songs/categories', position: 2, isActive: true },
        { id: '2-3', label: 'Favoritos', url: '/songs/favorites', position: 3, isActive: true }
      ]
    },
    {
      id: '3',
      label: 'Compositores',
      url: '/composers',
      icon: 'Users',
      position: 3,
      isActive: true
    },
    {
      id: '4',
      label: 'Playlists',
      url: '/playlists',
      icon: 'List',
      position: 4,
      isActive: true
    },
    {
      id: '5',
      label: 'Biblioteca',
      url: '/library',
      icon: 'Library',
      position: 5,
      isActive: false
    }
  ];

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    // Simulate loading menu items from API
    const timer = setTimeout(() => {
      try {
        // In production, load from API: const menus = await getMenuItems();
        setMenuItems(mockMenuItems);
        setIsLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar menus');
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        label: item.label,
        url: item.url,
        icon: item.icon || '',
        isActive: item.isActive
      });
    } else {
      setEditingItem(null);
      setFormData({
        label: '',
        url: '',
        icon: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ label: '', url: '', icon: '', isActive: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim() || !formData.url.trim()) return;

    const itemData: MenuItem = {
      id: editingItem?.id || Date.now().toString(),
      label: formData.label,
      url: formData.url,
      icon: formData.icon,
      position: editingItem?.position || menuItems.length + 1,
      isActive: formData.isActive
    };

    if (editingItem) {
      setMenuItems(menuItems.map(item => item.id === editingItem.id ? itemData : item));
    } else {
      setMenuItems([...menuItems, itemData]);
    }

    handleCloseModal();
  };

  const handleToggleActive = (id: string) => {
    setMenuItems(menuItems.map(item =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    ));
    const item = menuItems.find(i => i.id === id);
  };

  const handleDelete = (id: string, label: string) => {
    if (!window.confirm(`Deletar "${label}"?`)) return;
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  const handleSaveOrder = async () => {
    try {
      setIsSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando menus...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar menus</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
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
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Menus</h1>
          <p className="text-gray-400">Configure a navegação do site</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveOrder}
            disabled={isSaving}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Salvar Ordem
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Menu className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">Total de Itens</p>
              <p className="text-2xl font-bold text-white">{menuItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-gray-400 text-sm">Ativos</p>
              <p className="text-2xl font-bold text-white">
                {menuItems.filter(i => i.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <EyeOff className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-gray-400 text-sm">Inativos</p>
              <p className="text-2xl font-bold text-white">
                {menuItems.filter(i => !i.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-blue-400 text-sm">
          <strong>Dica:</strong> Arraste os itens para reordenar o menu. Itens inativos não aparecem no site.
        </p>
      </div>

      {/* Menu Items List */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-white font-semibold">Itens do Menu Principal</h3>
        </div>

        <div className="divide-y divide-gray-800">
          {menuItems
            .sort((a, b) => a.position - b.position)
            .map((item) => (
              <div key={item.id}>
                {/* Main Item */}
                <div className="p-4 hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <button className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-400">
                      <GripVertical className="w-5 h-5" />
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-white font-medium">{item.label}</h4>
                        {item.icon && (
                          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                            {item.icon}
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.isActive
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-gray-700 text-gray-400 border border-gray-600'
                          }`}
                        >
                          {item.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{item.url}</p>
                      {item.children && (
                        <p className="text-gray-500 text-xs mt-1">
                          {item.children.length} sub-itens
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(item.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title={item.isActive ? 'Desativar' : 'Ativar'}
                      >
                        {item.isActive ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-green-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.label)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Children Items */}
                {item.children && item.children.length > 0 && (
                  <div className="bg-gray-800/20 border-l-2 border-gray-700 ml-12">
                    {item.children.map((child) => (
                      <div
                        key={child.id}
                        className="p-3 pl-6 hover:bg-gray-800/30 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="text-gray-300 text-sm">{child.label}</p>
                          <p className="text-gray-500 text-xs">{child.url}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            child.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {child.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingItem ? 'Editar Item' : 'Novo Item'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder="Ex: Hinos"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL *
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder="/songs"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ícone (opcional)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder="Music"
                />
                <p className="text-gray-500 text-xs mt-1">Nome do ícone Lucide React</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded bg-gray-700 border-gray-600"
                />
                <label htmlFor="isActive" className="text-gray-300 cursor-pointer">
                  Item ativo (visível no menu)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenus;
