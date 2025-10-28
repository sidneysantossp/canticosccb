import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';

const AdminBanners: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const banners = [
    {
      id: 1,
      title: 'Banner Principal - Novos Hinos',
      image: 'https://picsum.photos/seed/banner1/1200/400',
      link: '/new-releases',
      position: 'home-hero',
      active: true,
      clicks: 1234,
      impressions: 45678
    },
    {
      id: 2,
      title: 'Promoção Premium',
      image: 'https://picsum.photos/seed/banner2/1200/400',
      link: '/premium',
      position: 'home-hero',
      active: true,
      clicks: 567,
      impressions: 23456
    },
    {
      id: 3,
      title: 'Banner Lateral - Compositores',
      image: 'https://picsum.photos/seed/banner3/400/600',
      link: '/composers',
      position: 'sidebar',
      active: false,
      clicks: 89,
      impressions: 5432
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Banners</h1>
          <p className="text-gray-400">Total de {banners.length} banners cadastrados</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Banner
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              <div className="lg:col-span-1">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{banner.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Posição: {banner.position}</span>
                      <span>Link: {banner.link}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    banner.active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {banner.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Cliques</p>
                    <p className="text-white text-xl font-bold">{banner.clicks.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Impressões</p>
                    <p className="text-white text-xl font-bold">{banner.impressions.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2">
                    {banner.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {banner.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Novo Banner</h3>
            <form className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Título</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Link de Destino</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Posição</label>
                <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600">
                  <option>Home - Hero</option>
                  <option>Sidebar</option>
                  <option>Footer</option>
                </select>
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Imagem</label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Clique ou arraste uma imagem</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
                >
                  Criar Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
