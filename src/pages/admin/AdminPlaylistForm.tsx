import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Music, ListMusic } from 'lucide-react';
import { getById, create, update } from '@/lib/admin/playlistsAdminApi';

const CATEGORIES = [
  { value: 'devotional', label: 'Devocional' },
  { value: 'worship', label: 'Adoração' },
  { value: 'doctrine', label: 'Doutrina' },
  { value: 'youth', label: 'Jovens' },
  { value: 'children', label: 'Infantil' },
  { value: 'special', label: 'Especial' },
  { value: 'classic', label: 'Clássico' }
];

const AdminPlaylistForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'worship',
    mood: '',
    curator_name: 'Equipe Editorial CCB',
    cover_url: '',
    is_featured: false,
    is_active: true
  });

  const [coverPreview, setCoverPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadPlaylist(id);
    }
  }, [id, isEditing]);

  const loadPlaylist = async (playlistId: string) => {
    try {
      setIsLoading(true);
      const playlist = await getById(playlistId);

      if (playlist) {
        setFormData({
          title: playlist.title,
          description: playlist.description || '',
          category: playlist.category,
          mood: playlist.mood || '',
          curator_name: playlist.curator_name || 'Equipe Editorial CCB',
          cover_url: playlist.cover_url || '',
          is_featured: playlist.is_featured,
          is_active: playlist.is_active
        });
        setCoverPreview(playlist.cover_url || '');
      }
    } catch (error: any) {
      console.error('Erro ao carregar playlist:', error);
      setError(error?.message || 'Erro ao carregar playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const playlistData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        mood: formData.mood.trim() || undefined,
        curator_name: formData.curator_name.trim(),
        cover_url: formData.cover_url.trim() || undefined,
        is_featured: formData.is_featured,
        is_active: formData.is_active
      };

      if (isEditing && id) {
        await update(id, playlistData);
      } else {
        await create(playlistData);
      }

      navigate('/admin/playlists');
    } catch (error: any) {
      console.error('Erro ao salvar playlist:', error);
      setError(error?.message || 'Erro ao salvar playlist');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando playlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin/playlists"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? 'Editar Playlist' : 'Nova Playlist'}
            </h1>
            <p className="text-gray-400 mt-1">Crie playlists editoriais curadas para os usuários</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Capa da Playlist */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Capa da Playlist</h2>
            
            <div className="space-y-4">
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="Preview"
                  className="w-48 h-48 rounded-lg object-cover"
                />
              )}

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  URL da Capa
                </label>
                <input
                  type="url"
                  value={formData.cover_url}
                  onChange={(e) => {
                    setFormData({ ...formData, cover_url: e.target.value });
                    setCoverPreview(e.target.value);
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="https://exemplo.com/capa.jpg"
                />
              </div>
            </div>
          </div>

          {/* Informações da Playlist */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ListMusic className="w-5 h-5" />
              Informações da Playlist
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Hinos de Adoração"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-green-600"
                  placeholder="Descrição da playlist..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Mood/Clima
                  </label>
                  <input
                    type="text"
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                    placeholder="Reflexivo, Alegre, Solene..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Curador
                </label>
                <input
                  type="text"
                  value={formData.curator_name}
                  onChange={(e) => setFormData({ ...formData, curator_name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Equipe Editorial CCB"
                />
              </div>
            </div>
          </div>

          {/* Status e Destaque */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Status e Destaque</h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-white font-medium">Ativo</p>
                    <p className="text-gray-400 text-sm">Playlist visível para os usuários</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-white font-medium">Destaque</p>
                    <p className="text-gray-400 text-sm">Aparecer na seção de destaques</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/playlists"
              className="flex-1 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Playlist'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPlaylistForm;
