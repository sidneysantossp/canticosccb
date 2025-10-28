import React, { useState } from 'react';
import { Star, Plus, X, Music, Album, Users } from 'lucide-react';

const AdminFeatured: React.FC = () => {
  const [activeTab, setActiveTab] = useState('songs');

  const featuredSongs = [
    { id: 1, title: 'Hino 50 - Saudosa Lembrança', composer: 'Coral CCB', order: 1 },
    { id: 2, title: 'Hino 200 - Jerusalém Celeste', composer: 'Coral CCB', order: 2 },
    { id: 3, title: 'Hino 75 - Glória ao Senhor', composer: 'Coral CCB', order: 3 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Conteúdo em Destaque</h1>
        <p className="text-gray-400">Gerencie o conteúdo destacado na home</p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('songs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === 'songs' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            Hinos
          </button>
          <button
            onClick={() => setActiveTab('albums')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === 'albums' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Album className="w-4 h-4" />
            Álbuns
          </button>
          <button
            onClick={() => setActiveTab('composers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === 'composers' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Compositores
          </button>
        </div>
      </div>

      {activeTab === 'songs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Hinos em Destaque</h2>
            <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Hino
            </button>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="space-y-3">
              {featuredSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="font-bold">{song.order}</span>
                    </div>
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-white font-medium">{song.title}</p>
                      <p className="text-gray-400 text-sm">{song.composer}</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-500 text-sm">
                💡 Arraste os itens para reordenar. Os primeiros 10 itens serão exibidos na home.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeatured;
