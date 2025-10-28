import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Music, Tag, Save, X, Image as ImageIcon } from 'lucide-react';

interface SongFormData {
  title: string;
  composer: string;
  category: string;
  genre: string;
  number: string;
  description: string;
  tags: string[];
  thumbnail: File | null;
  audioFile: File | null;
  featured: boolean;
  allowDownload: boolean;
  status: 'draft' | 'published';
}

const AdminSongForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SongFormData>({
    title: '',
    composer: '',
    category: '',
    genre: '',
    number: '',
    description: '',
    tags: [],
    thumbnail: null,
    audioFile: null,
    featured: false,
    allowDownload: true,
    status: 'draft'
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Salvando hino:', formData);
    // Lógica de salvamento aqui
    navigate('/admin/songs');
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Adicionar Novo Hino</h1>
        <p className="text-gray-400">Preencha as informações do hino</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Título do Hino *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                required
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Número do Hino
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Compositor *
              </label>
              <select
                value={formData.composer}
                onChange={(e) => setFormData({ ...formData, composer: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                required
              >
                <option value="">Selecione...</option>
                <option value="1">Coral CCB</option>
                <option value="2">João Silva</option>
                <option value="3">Maria Santos</option>
              </select>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Categoria *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                required
              >
                <option value="">Selecione...</option>
                <option value="adoracao">Adoração</option>
                <option value="louvor">Louvor</option>
                <option value="paz">Paz</option>
              </select>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Gênero *
              </label>
              <select
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                required
              >
                <option value="">Selecione...</option>
                <option value="hino">Hino</option>
                <option value="coral">Coral</option>
                <option value="contemporaneo">Contemporâneo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Descrição / Letra
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600 resize-none"
            />
          </div>
        </div>

        {/* Media Files */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Arquivos de Mídia</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Thumbnail / Capa *
              </label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-red-600 transition-colors cursor-pointer">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm mb-2">Clique ou arraste uma imagem</p>
                <p className="text-gray-500 text-xs">PNG, JPG até 5MB</p>
                <input type="file" accept="image/*" className="hidden" />
              </div>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Arquivo de Áudio *
              </label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-red-600 transition-colors cursor-pointer">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm mb-2">Clique ou arraste um áudio</p>
                <p className="text-gray-500 text-xs">MP3, WAV, FLAC até 50MB</p>
                <input type="file" accept="audio/*" className="hidden" />
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Tags</h2>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Digite uma tag e pressione Enter"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Adicionar
            </button>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-800 text-white rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Configurações</h2>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800"
              />
              <span className="text-white">Destacar na home</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowDownload}
                onChange={(e) => setFormData({ ...formData, allowDownload: e.target.checked })}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800"
              />
              <span className="text-white">Permitir download</span>
            </label>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Status da Publicação
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/songs')}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Salvar Hino
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSongForm;
