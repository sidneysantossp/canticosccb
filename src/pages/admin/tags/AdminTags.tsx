import React, { useState } from 'react';
import { Plus, Edit, Trash2, Tag as TagIcon, X } from 'lucide-react';

const AdminTags: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [tagName, setTagName] = useState('');

  const tags = [
    { id: 1, name: 'adoração', count: 156, color: '#1DB954' },
    { id: 2, name: 'louvor', count: 234, color: '#FF6B6B' },
    { id: 3, name: 'hino', count: 456, color: '#4ECDC4' },
    { id: 4, name: 'coral', count: 89, color: '#FFD93D' },
    { id: 5, name: 'orquestra', count: 67, color: '#A8E6CF' },
    { id: 6, name: 'CCB', count: 789, color: '#9B59B6' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Tags</h1>
          <p className="text-gray-400">{tags.length} tags cadastradas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Tag
        </button>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group relative px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors flex items-center gap-2"
              style={{ borderLeft: `4px solid ${tag.color}` }}
            >
              <TagIcon className="w-4 h-4 text-gray-400" />
              <span className="text-white font-medium">{tag.name}</span>
              <span className="text-gray-400 text-sm">({tag.count})</span>
              
              <div className="hidden group-hover:flex items-center gap-1 ml-2">
                <button className="p-1 hover:bg-gray-600 rounded">
                  <Edit className="w-3 h-3 text-blue-400" />
                </button>
                <button className="p-1 hover:bg-gray-600 rounded">
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Tags Mais Usadas</h2>
        <div className="space-y-2">
          {tags.sort((a, b) => b.count - a.count).slice(0, 10).map((tag, index) => (
            <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 font-bold w-6">{index + 1}</span>
                <span className="text-white">{tag.name}</span>
              </div>
              <span className="text-gray-400">{tag.count} usos</span>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Nova Tag</h3>
            <form className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Nome da Tag</label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
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

export default AdminTags;
