import React from 'react';
import { Layers, Plus, Edit, Trash2, Music } from 'lucide-react';

const AdminCollections: React.FC = () => {
  const collections = [
    { id: 1, title: 'Hinos Clássicos da CCB', cover: 'https://picsum.photos/seed/col1/300', songsCount: 50, curators: 3, plays: 45600 },
    { id: 2, title: 'Louvores de Adoração', cover: 'https://picsum.photos/seed/col2/300', songsCount: 35, curators: 2, plays: 28900 },
    { id: 3, title: 'Hinos Para Meditação', cover: 'https://picsum.photos/seed/col3/300', songsCount: 42, curators: 4, plays: 38200 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Coletâneas</h1>
          <p className="text-gray-400">{collections.length} coletâneas cadastradas</p>
        </div>
        <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nova Coletânea
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <div key={collection.id} className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group">
            <div className="relative aspect-square">
              <img
                src={collection.cover}
                alt={collection.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button className="p-3 bg-white/20 hover:bg-white/30 rounded-full">
                  <Edit className="w-5 h-5 text-white" />
                </button>
                <button className="p-3 bg-white/20 hover:bg-white/30 rounded-full">
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-white font-bold text-lg mb-2 truncate">{collection.title}</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <span>{collection.songsCount} hinos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>{collection.curators} curadores</span>
                </div>
                <div>
                  <span>{collection.plays.toLocaleString()} plays</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCollections;
