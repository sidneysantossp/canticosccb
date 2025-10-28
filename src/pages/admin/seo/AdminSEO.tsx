import React, { useState } from 'react';
import { Save, TrendingUp, Globe, Tag } from 'lucide-react';

const AdminSEO: React.FC = () => {
  const [activeTab, setActiveTab] = useState('global');

  const pages = [
    { id: 'home', name: 'Home', path: '/' },
    { id: 'library', name: 'Biblioteca', path: '/library' },
    { id: 'search', name: 'Busca', path: '/search' },
    { id: 'premium', name: 'Premium', path: '/premium' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações de SEO</h1>
        <p className="text-gray-400">Otimize o SEO da sua plataforma</p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'global' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            SEO Global
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'pages' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            SEO por Página
          </button>
        </div>
      </div>

      {activeTab === 'global' && (
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              SEO Global
            </h2>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Meta Título Padrão</label>
              <input
                type="text"
                defaultValue="Cânticos CCB - Plataforma de Hinos"
                maxLength={60}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
              <p className="text-gray-400 text-xs mt-1">60 caracteres recomendados</p>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Meta Descrição Padrão</label>
              <textarea
                rows={3}
                defaultValue="Ouça e compartilhe hinos da CCB. Plataforma completa com player, playlists e muito mais."
                maxLength={160}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 resize-none"
              />
              <p className="text-gray-400 text-xs mt-1">160 caracteres recomendados</p>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Keywords Globais</label>
              <input
                type="text"
                defaultValue="hinos, ccb, cânticos, congregação cristã, música gospel"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Google Analytics ID</label>
                <input
                  type="text"
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Facebook Pixel ID</label>
                <input
                  type="text"
                  placeholder="123456789"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Open Graph & Twitter Cards</h2>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Imagem Padrão (OG)</label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">1200x630px recomendado</p>
              </div>
            </div>
          </div>

          <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2">
            <Save className="w-5 h-5" />
            Salvar Configurações
          </button>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="space-y-4">
          {pages.map((page) => (
            <div key={page.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">{page.name} ({page.path})</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Meta Título</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Meta Descrição</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 resize-none"
                  />
                </div>
                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg">
                  Salvar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSEO;
