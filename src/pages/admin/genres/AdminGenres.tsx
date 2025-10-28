import React, { useState } from 'react';
import { Plus, Edit, Trash2, Music } from 'lucide-react';

const AdminGenres: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const genres = [
    { id: 1, name: 'Hino', slug: 'hino', songsCount: 456, color: '#1DB954' },
    { id: 2, name: 'Coral', slug: 'coral', songsCount: 234, color: '#FF6B6B' },
    { id: 3, name: 'Contemporâneo', slug: 'contemporaneo', songsCount: 89, color: '#4ECDC4' },
    { id: 4, name: 'Orquestrado', slug: 'orquestrado', songsCount: 145, color: '#FFD93D' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Gêneros</h1>
          <p className="text-gray-400">{genres.length} gêneros cadastrados</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Gênero
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {genres.map((genre) => (
          <div key={genre.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${genre.color}20` }}
              >
                <Music className="w-6 h-6" style={{ color: genre.color }} />
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-800 rounded-lg">
                  <Edit className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-800 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{genre.name}</h3>
            <p className="text-gray-400 text-sm mb-3">/{genre.slug}</p>
            <p className="text-gray-400 text-sm">{genre.songsCount} hinos</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Novo Gênero</h3>
            <form className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Nome</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Slug</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Cor</label>
                <input
                  type="color"
                  className="w-full h-12 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg"
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

export default AdminGenres;
