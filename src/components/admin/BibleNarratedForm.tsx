import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { extractYouTubeVideoId, fetchYouTubeVideoData, getYouTubeThumbnail } from '@/utils/youtubeApi';
import { Save, Loader2, Youtube, Image, Book, FileText } from 'lucide-react';

interface BibleNarratedData {
  id?: number;
  youtube_url: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string;
  book_name: string;
  description: string;
  content: string;
  duration?: number;
  is_active: boolean;
  display_order: number;
}

interface BibleNarratedFormProps {
  initialData?: BibleNarratedData;
  onSave: (data: BibleNarratedData) => Promise<void>;
  onCancel: () => void;
}

const BibleNarratedForm: React.FC<BibleNarratedFormProps> = ({
  initialData,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<BibleNarratedData>({
    youtube_url: '',
    youtube_video_id: '',
    title: '',
    thumbnail_url: '',
    book_name: '',
    description: '',
    content: '',
    is_active: true,
    display_order: 0,
    ...initialData
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingYouTube, setIsLoadingYouTube] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [durationInput, setDurationInput] = useState(() => {
    if (initialData?.duration) {
      const hours = Math.floor(initialData.duration / 3600);
      const minutes = Math.floor((initialData.duration % 3600) / 60);
      const seconds = initialData.duration % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return '';
  });

  // Buscar dados do YouTube quando URL mudar
  const handleYouTubeUrlChange = async (url: string) => {
    console.log('🎬 URL do YouTube alterada:', url);
    setFormData(prev => ({ ...prev, youtube_url: url }));
    
    const videoId = extractYouTubeVideoId(url);
    console.log('🎬 Video ID extraído:', videoId);
    
    if (!videoId) {
      setErrors(prev => ({ ...prev, youtube_url: 'URL do YouTube inválida' }));
      return;
    }

    setErrors(prev => ({ ...prev, youtube_url: '' }));
    setIsLoadingYouTube(true);

    try {
      const videoData = await fetchYouTubeVideoData(videoId);
      
      if (videoData) {
        console.log('📺 Dados recebidos do YouTube:', videoData);
        setFormData(prev => ({
          ...prev,
          youtube_video_id: videoData.videoId,
          title: videoData.title,
          thumbnail_url: videoData.thumbnail,
          description: prev.description || videoData.description.substring(0, 200) + '...',
          duration: videoData.duration // ✅ Incluir duração!
        }));
        console.log('✅ Formulário atualizado com duração:', videoData.duration);
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

    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background-secondary rounded-lg border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <Book className="w-6 h-6 text-primary-400" />
        <h2 className="text-2xl font-bold text-white">
          {initialData ? 'Editar' : 'Adicionar'} Bíblia Narrada
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL do YouTube */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <Youtube className="w-4 h-4" />
            URL do YouTube *
          </label>
          <div className="relative">
            <input
              type="url"
              value={formData.youtube_url}
              onChange={(e) => handleYouTubeUrlChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`w-full px-3 py-2 bg-background-tertiary border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400 ${
                errors.youtube_url ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {isLoadingYouTube && (
              <Loader2 className="absolute right-3 top-2.5 w-5 h-5 animate-spin text-primary-500" />
            )}
          </div>
          {errors.youtube_url && (
            <p className="text-red-500 text-sm mt-1">{errors.youtube_url}</p>
          )}
        </div>

        {/* Preview do Vídeo */}
        {formData.thumbnail_url && (
          <div className="bg-background-tertiary p-4 rounded-md border border-gray-600">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Preview do Vídeo</h3>
            <div className="flex gap-4">
              <img
                src={formData.thumbnail_url}
                alt="Thumbnail"
                className="w-32 h-24 object-cover rounded"
              />
              <div>
                <p className="font-medium text-white">{formData.title}</p>
                <p className="text-sm text-gray-400">ID: {formData.youtube_video_id}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 bg-background-tertiary border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400 ${
                errors.title ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Nome do Livro */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Livro *
            </label>
            <input
              type="text"
              value={formData.book_name}
              onChange={(e) => setFormData(prev => ({ ...prev, book_name: e.target.value }))}
              placeholder="Ex: Gênesis 1, Salmos 23"
              className={`w-full px-3 py-2 bg-background-tertiary border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400 ${
                errors.book_name ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.book_name && (
              <p className="text-red-500 text-sm mt-1">{errors.book_name}</p>
            )}
          </div>
        </div>

        {/* URL da Thumbnail */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <Image className="w-4 h-4" />
            URL da Thumbnail
          </label>
          <input
            type="url"
            value={formData.thumbnail_url}
            onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
            placeholder="Preenchido automaticamente, mas pode ser editado"
            className="w-full px-3 py-2 bg-background-tertiary border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
          />
        </div>

        {/* Descrição Breve */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Descrição Breve
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="Uma breve descrição do conteúdo..."
            className="w-full px-3 py-2 bg-background-tertiary border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
          />
        </div>

        {/* Conteúdo Completo - TinyMCE */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <FileText className="w-4 h-4" />
            Conteúdo Completo *
          </label>
          <div className="border border-gray-600 rounded-md bg-background-tertiary">
            <Editor
              apiKey="no-api-key" // Para desenvolvimento
              value={formData.content}
              onEditorChange={(content) => setFormData(prev => ({ ...prev, content }))}
              init={{
                height: 400,
                menubar: false,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Duração */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duração (HH:MM:SS)
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={durationInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setDurationInput(value);
                  
                  // Permitir apenas números e :
                  const cleaned = value.replace(/[^0-9:]/g, '');
                  
                  // Formato HH:MM:SS (horas:minutos:segundos)
                  if (cleaned.includes(':')) {
                    const parts = cleaned.split(':');
                    const hours = parseInt(parts[0]) || 0;
                    const minutes = parseInt(parts[1]) || 0;
                    const seconds = parseInt(parts[2]) || 0;
                    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                    setFormData(prev => ({ ...prev, duration: totalSeconds }));
                  } else if (cleaned.length > 0) {
                    // Se só digitou números, assumir que são segundos
                    const totalSeconds = parseInt(cleaned) || 0;
                    setFormData(prev => ({ ...prev, duration: totalSeconds }));
                  } else {
                    setFormData(prev => ({ ...prev, duration: 0 }));
                  }
                }}
                placeholder="2:45:30 ou 1:30:00 ou 0:05:15"
                className="w-full px-3 py-2 bg-background-tertiary border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
              />
              <div className="text-xs text-gray-400">
                {formData.duration ? 
                  `${Math.floor(formData.duration / 3600)}h ${Math.floor((formData.duration % 3600) / 60)}min ${formData.duration % 60}s (${formData.duration} segundos)` : 
                  'Digite no formato HH:MM:SS (ex: 2:45:30 = 2h45min30s)'
                }
              </div>
            </div>
          </div>

          {/* Ordem de Exibição */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ordem de Exibição
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-background-tertiary border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
            />
          </div>

          {/* Ativo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-300">
              Ativo
            </label>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-4 pt-6 border-t border-gray-600">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-background-tertiary focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default BibleNarratedForm;
