import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Album, Image as ImageIcon, Plus, X } from 'lucide-react';

const AdminAlbumForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    composer: '',
    year: new Date().getFullYear().toString(),
    description: '',
    cover: null as File | null,
    songs: [] as string[],
    status: 'published'
  });

  const [songSearch, setSongSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Salvando álbum:', formData);
    navigate('/admin/albums');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Criar Novo Álbum</h1>
        <p className="text-gray-400">Preencha as informações do álbum</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Informações do Álbum</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-white text-sm font-medium mb-2 block">Título do Álbum *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                required
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Ano *</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                min="1900"
                max="2100"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">Compositor *</label>
            <select
              value={formData.composer}
              onChange={(e) => setFormData({ ...formData, composer: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              required
            >
              <option value="">Selecione um compositor</option>
              <option value="1">Coral CCB</option>
              <option value="2">João Silva</option>
              <option value="3">Maria Santos</option>
            </select>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 resize-none"
            />
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Capa do Álbum</h2>
          
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-red-600 transition-colors cursor-pointer">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-sm mb-2">Clique ou arraste uma imagem</p>
            <p className="text-gray-500 text-xs">Recomendado: 1000x1000px, PNG ou JPG</p>
            <input type="file" accept="image/*" className="hidden" />
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Faixas do Álbum</h2>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={songSearch}
              onChange={(e) => setSongSearch(e.target.value)}
              placeholder="Buscar hino para adicionar..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
            />
            <button
              type="button"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar
            </button>
          </div>

          <div className="space-y-2">
            {formData.songs.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhuma faixa adicionada ainda</p>
            ) : (
              formData.songs.map((song, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-bold">{index + 1}</span>
                    <span className="text-white">{song}</span>
                  </div>
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Status</h2>
          
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/albums')}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Salvar Álbum
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAlbumForm;
