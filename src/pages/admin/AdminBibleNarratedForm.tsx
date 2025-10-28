import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Youtube, Book, FileText, Loader2 } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import { extractYouTubeVideoId, fetchYouTubeVideoData } from '@/utils/youtubeApi';
import {
  fetchBibleNarratedById,
  createBibleNarrated,
  updateBibleNarrated,
  CreateBibleNarratedData
} from '@/api/bibleNarrated';

const AdminBibleNarratedForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    youtube_url: '',
    youtube_video_id: '',
    title: '',
    thumbnail_url: '',
    book_name: '',
    description: '',
    content: '',
    duration: 0,
    is_active: true,
    display_order: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingYouTube, setIsLoadingYouTube] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && id) {
      loadBibleNarrated(parseInt(id));
    }
  }, [id, isEditing]);

  const loadBibleNarrated = async (itemId: number) => {
    try {
      setIsLoading(true);
      const item = await fetchBibleNarratedById(itemId);

      if (item) {
        setFormData({
          youtube_url: item.youtube_url,
          youtube_video_id: item.youtube_video_id,
          title: item.title,
          thumbnail_url: item.thumbnail_url,
          book_name: item.book_name,
          description: item.description,
          content: item.content,
          duration: item.duration || 0,
          is_active: item.is_active,
          display_order: item.display_order
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar item:', error);
      setError(error?.message || 'Erro ao carregar item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleYouTubeUrlChange = async (url: string) => {
    setFormData(prev => ({ ...prev, youtube_url: url }));
    
    const videoId = extractYouTubeVideoId(url);
    
    if (!videoId) {
      setErrors(prev => ({ ...prev, youtube_url: 'URL do YouTube inválida' }));
      return;
    }

    setErrors(prev => ({ ...prev, youtube_url: '' }));
    setIsLoadingYouTube(true);

    try {
      const videoData = await fetchYouTubeVideoData(videoId);
      
      if (videoData) {
        setFormData(prev => ({
          ...prev,
          youtube_video_id: videoData.videoId,
          title: videoData.title,
          thumbnail_url: videoData.thumbnail,
          description: prev.description || videoData.description.substring(0, 200) + '...',
          duration: videoData.duration
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar dados do YouTube:', error);
      setErrors(prev => ({ ...prev, youtube_url: 'Erro ao buscar dados do vídeo' }));
    } finally {
      setIsLoadingYouTube(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    const newErrors: Record<string, string> = {};
    if (!formData.youtube_url) newErrors.youtube_url = 'URL do YouTube é obrigatória';
    if (!formData.title) newErrors.title = 'Título é obrigatório';
    if (!formData.book_name) newErrors.book_name = 'Nome do livro é obrigatório';
    if (!formData.content) newErrors.content = 'Conteúdo é obrigatório';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const dataToSave: CreateBibleNarratedData = {
        youtube_url: formData.youtube_url,
        youtube_video_id: formData.youtube_video_id,
        title: formData.title.trim(),
        thumbnail_url: formData.thumbnail_url,
        book_name: formData.book_name.trim(),
        description: formData.description.trim(),
        content: formData.content,
        duration: formData.duration,
        is_active: formData.is_active,
        display_order: formData.display_order
      };

      if (isEditing && id) {
        await updateBibleNarrated(parseInt(id), dataToSave);
      } else {
        await createBibleNarrated(dataToSave);
      }

      navigate('/admin/bible-narrated');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setError(error?.message || 'Erro ao salvar item');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
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
            to="/admin/bible-narrated"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? 'Editar Bíblia Narrada' : 'Nova Bíblia Narrada'}
            </h1>
            <p className="text-gray-400 mt-1">Adicione vídeos do YouTube com narração bíblica</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL do YouTube */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Youtube className="w-5 h-5" />
              Vídeo do YouTube
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  URL do YouTube *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.youtube_url}
                    onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {isLoadingYouTube && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                    </div>
                  )}
                </div>
                {errors.youtube_url && (
                  <p className="text-red-500 text-sm mt-1">{errors.youtube_url}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Cole a URL completa do vídeo do YouTube
                </p>
              </div>

              {formData.thumbnail_url && (
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Thumbnail
                  </label>
                  <img
                    src={formData.thumbnail_url}
                    alt="Thumbnail"
                    className="w-full max-w-md rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Book className="w-5 h-5" />
              Informações Básicas
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
                  placeholder="Ex: Gênesis 1 - A Criação"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Nome do Livro *
                </label>
                <input
                  type="text"
                  value={formData.book_name}
                  onChange={(e) => setFormData({ ...formData, book_name: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Ex: Gênesis"
                />
                {errors.book_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.book_name}</p>
                )}
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
                  placeholder="Breve descrição do conteúdo..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Status
                  </label>
                  <select
                    value={formData.is_active ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === '1' })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  >
                    <option value="1">Ativo</option>
                    <option value="0">Inativo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Conteúdo Bíblico
            </h2>
            
            <div>
              <label className="block text-gray-400 text-sm font-semibold mb-2">
                Texto Completo *
              </label>
              <div className="bg-white rounded-lg overflow-hidden">
                <Editor
                  apiKey="your-tinymce-api-key"
                  value={formData.content}
                  onEditorChange={(content) => setFormData({ ...formData, content })}
                  init={{
                    height: 500,
                    menubar: false,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
                      'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'table', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                  }}
                />
              </div>
              {errors.content && (
                <p className="text-red-500 text-sm mt-1">{errors.content}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Cole o texto bíblico completo ou adicione notas de estudo
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/bible-narrated"
              className="flex-1 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving || isLoadingYouTube}
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
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Item'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBibleNarratedForm;
