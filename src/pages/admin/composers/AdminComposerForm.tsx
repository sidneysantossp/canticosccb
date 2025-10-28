import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '@/styles/quill-custom.css';
import { Save, Mic2, Upload, Instagram, Facebook, Youtube, Globe } from 'lucide-react';

const AdminComposerForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    artisticName: '',
    email: '',
    phone: '',
    type: 'solo',
    biography: '',
    location: '',
    website: '',
    instagram: '',
    facebook: '',
    youtube: '',
    verified: false,
    status: 'active'
  });

  // Configuração do editor React-Quill
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  }), []);

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Salvando compositor:', formData);
    navigate('/admin/composers');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Adicionar Novo Compositor</h1>
        <p className="text-gray-400">Preencha as informações do compositor</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Mic2 className="w-5 h-5" />
            Informações Básicas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Nome Real *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                required
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Nome Artístico *</label>
              <input
                type="text"
                value={formData.artisticName}
                onChange={(e) => setFormData({ ...formData, artisticName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                required
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Tipo *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                required
              >
                <option value="solo">Solo</option>
                <option value="grupo">Grupo</option>
                <option value="orquestra">Orquestra</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">Biografia</label>
            <div className="bg-white rounded-lg overflow-hidden" style={{ minHeight: '250px' }}>
              <ReactQuill
                theme="snow"
                value={formData.biography}
                onChange={(content) => setFormData({ ...formData, biography: content })}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Escreva a biografia do compositor..."
                style={{ height: '200px' }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Use o editor para formatar a biografia com parágrafos, negrito, etc.
            </p>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">Localização</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Cidade, Estado"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
            />
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Redes Sociais</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                Instagram
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@username"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
                <Facebook className="w-4 h-4" />
                Facebook
              </label>
              <input
                type="text"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                placeholder="username"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block flex items-center gap-2">
                <Youtube className="w-4 h-4" />
                YouTube
              </label>
              <input
                type="text"
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                placeholder="@channel"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Configurações</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              >
                <option value="active">Ativo</option>
                <option value="pending">Pendente</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.verified}
                  onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-white">Compositor verificado</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/composers')}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Salvar Compositor
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminComposerForm;
