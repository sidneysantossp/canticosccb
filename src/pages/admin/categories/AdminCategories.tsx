import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Music,
  MoreVertical
} from 'lucide-react';

const AdminCategories: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#1DB954',
    icon: 'music'
  });

  // Mock data
  const categories = [
    {
      id: 1,
      name: 'Adoração',
      slug: 'adoracao',
      icon: '🙏',
      color: '#1DB954',
      songsCount: 234,
      status: 'active'
    },
    {
      id: 2,
      name: 'Louvor',
      slug: 'louvor',
      icon: '🎵',
      color: '#FF6B6B',
      songsCount: 189,
      status: 'active'
    },
    {
      id: 3,
      name: 'Paz',
      slug: 'paz',
      icon: '☮️',
      color: '#4ECDC4',
      songsCount: 156,
      status: 'active'
    },
    {
      id: 4,
      name: 'Glória',
      slug: 'gloria',
      icon: '✨',
      color: '#FFD93D',
      songsCount: 98,
      status: 'active'
    },
    {
      id: 5,
      name: 'Gratidão',
      slug: 'gratidao',
      icon: '🙌',
      color: '#A8E6CF',
      songsCount: 145,
      status: 'active'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Criando categoria:', formData);
    setShowCreateModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Categorias</h1>
          <p className="text-gray-400">Total de {categories.length} categorias cadastradas</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Criar Categoria
        </button>
      </div>

      {/* Search */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${category.color}20` }}
              >
                {category.icon}
              </div>
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
            <p className="text-gray-400 text-sm mb-4">/{category.slug}</p>

            <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
              <Music className="w-4 h-4" />
              <span>{category.songsCount} hinos</span>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Nova Categoria</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Adoração"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Ex: adoracao"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da categoria..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600 resize-none"
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Cor
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-12 px-2 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
