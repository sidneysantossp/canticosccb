import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload, Lock, Globe, Users, Image as ImageIcon } from 'lucide-react';

const CreatePlaylistPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public' as 'public' | 'private' | 'collaborative',
    coverImage: null as File | null
  });
  
  const [previewImage, setPreviewImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, coverImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implementar criação real da playlist
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock playlist ID
      const newPlaylistId = Math.floor(Math.random() * 1000);
      navigate(`/playlist/${newPlaylistId}`);
    } catch (error) {
      console.error('Error creating playlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const privacyOptions = [
    {
      id: 'public',
      icon: Globe,
      title: 'Pública',
      description: 'Todos podem ver e ouvir'
    },
    {
      id: 'private',
      icon: Lock,
      title: 'Privada',
      description: 'Apenas você pode ver'
    },
    {
      id: 'collaborative',
      icon: Users,
      title: 'Colaborativa',
      description: 'Você e seus amigos podem editar'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-primary to-background-tertiary p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Criar Playlist</h1>
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-background-hover transition-colors"
          >
            <X className="w-6 h-6 text-text-muted hover:text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cover Image Upload */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              <div className="relative group">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Playlist cover"
                    className="w-48 h-48 rounded-lg object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-48 h-48 bg-background-secondary rounded-lg flex flex-col items-center justify-center shadow-xl">
                    <ImageIcon className="w-12 h-12 text-text-muted mb-2" />
                    <p className="text-text-muted text-sm">Adicionar imagem</p>
                  </div>
                )}
                
                <label
                  htmlFor="cover-upload"
                  className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-white mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">
                      {previewImage ? 'Alterar' : 'Escolher'} imagem
                    </p>
                  </div>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-text-muted text-xs mt-2 text-center">
                Mínimo 300x300px
              </p>
            </div>

            {/* Basic Info */}
            <div className="flex-1 w-full space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Nome da playlist <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Meus Hinos Favoritos"
                  className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  maxLength={100}
                />
                <p className="text-text-muted text-xs mt-1">
                  {formData.name.length}/100 caracteres
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Adicione uma descrição opcional"
                  rows={4}
                  className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  maxLength={300}
                />
                <p className="text-text-muted text-xs mt-1">
                  {formData.description.length}/300 caracteres
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Privacidade</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {privacyOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.privacy === option.id;
                
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, privacy: option.id as any })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'bg-primary-500/20 border-primary-500'
                        : 'bg-background-secondary border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-3 ${isSelected ? 'text-primary-500' : 'text-text-muted'}`} />
                    <h4 className="text-white font-semibold mb-1">{option.title}</h4>
                    <p className="text-text-muted text-sm">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Options */}
          <div className="bg-background-secondary rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Opções adicionais</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-white font-medium group-hover:text-primary-500 transition-colors">
                    Adicionar à biblioteca
                  </p>
                  <p className="text-text-muted text-sm">
                    Esta playlist aparecerá na sua biblioteca
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-gray-700 bg-background-tertiary text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-white font-medium group-hover:text-primary-500 transition-colors">
                    Permitir downloads
                  </p>
                  <p className="text-text-muted text-sm">
                    Usuários podem baixar esta playlist offline
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded border-gray-700 bg-background-tertiary text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-full text-white hover:bg-background-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formData.name || isLoading}
              className="px-8 py-3 bg-primary-500 text-black font-semibold rounded-full hover:bg-primary-400 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Criando...' : 'Criar Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlaylistPage;
