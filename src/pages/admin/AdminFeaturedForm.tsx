import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Star, Calendar } from 'lucide-react';

interface FeaturedItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  content_type: 'song' | 'album' | 'playlist' | 'composer' | 'hymn' | 'custom';
  image_url: string;
  section: 'hero' | 'spotlight' | 'trending' | 'new' | 'recommended';
  position: number;
  priority: number;
  is_active: boolean;
  cta_text: string;
  start_date?: string;
  end_date?: string;
}

const SECTIONS = [
  { value: 'hero', label: 'Hero (Principal)' },
  { value: 'spotlight', label: 'Em Destaque' },
  { value: 'trending', label: 'Tendências' },
  { value: 'new', label: 'Novidades' },
  { value: 'recommended', label: 'Recomendados' }
];

const CONTENT_TYPES = [
  { value: 'hymn', label: 'Hino' },
  { value: 'song', label: 'Música' },
  { value: 'album', label: 'Álbum' },
  { value: 'playlist', label: 'Playlist' },
  { value: 'composer', label: 'Compositor' },
  { value: 'custom', label: 'Personalizado' }
];

const AdminFeaturedForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    content_type: 'hymn' as FeaturedItem['content_type'],
    image_url: '',
    section: 'hero' as FeaturedItem['section'],
    position: 1,
    priority: 50,
    cta_text: 'Ver Mais',
    start_date: '',
    end_date: '',
    is_active: true
  });

  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadFeatured(id);
    }
  }, [id, isEditing]);

  const loadFeatured = async (featuredId: string) => {
    try {
      setIsLoading(true);
      // TODO: Implementar getFeaturedById quando backend estiver pronto
      // const item = await getFeaturedById(featuredId);
      // if (item) { setFormData(...); setImagePreview(item.image_url); }
    } catch (error: any) {
      console.error('Erro ao carregar destaque:', error);
      setError(error?.message || 'Erro ao carregar destaque');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      let imageUrl = formData.image_url;

      // TODO: Upload de imagem quando backend estiver pronto
      // if (imageFile) { imageUrl = await uploadFeaturedImage(imageFile); }

      const featuredData = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim() || undefined,
        description: formData.description.trim() || undefined,
        content_type: formData.content_type,
        image_url: imageUrl,
        section: formData.section,
        position: formData.position,
        priority: formData.priority,
        cta_text: formData.cta_text.trim(),
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        is_active: formData.is_active
      };

      if (isEditing && id) {
        // await updateFeatured(id, featuredData);
      } else {
        // await createFeatured(featuredData);
      }

      navigate('/admin/featured');
    } catch (error: any) {
      console.error('Erro ao salvar destaque:', error);
      setError(error?.message || 'Erro ao salvar destaque');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando destaque...</p>
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
            to="/admin/featured"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? 'Editar Destaque' : 'Novo Destaque'}
            </h1>
            <p className="text-gray-400 mt-1">Configure conteúdo em destaque na plataforma</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Imagem de Destaque */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Imagem de Destaque</h2>
            
            <div className="space-y-4">
              {imagePreview && (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-green-600 bg-green-500/10' : 'border-gray-700 hover:border-green-600'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">
                  {imageFile ? imageFile.name : 'Arraste uma imagem ou clique para selecionar'}
                </p>
                <p className="text-gray-500 text-sm">
                  Recomendado: 1920x1080px (formato 16:9)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Informações do Destaque */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Informações do Destaque
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
                  placeholder="Título do destaque"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Subtítulo opcional"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-green-600"
                  placeholder="Descrição do conteúdo..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Tipo de Conteúdo *
                  </label>
                  <select
                    value={formData.content_type}
                    onChange={(e) => setFormData({ ...formData, content_type: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  >
                    {CONTENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Seção *
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  >
                    {SECTIONS.map(section => (
                      <option key={section.value} value={section.value}>{section.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Posição
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Prioridade (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Texto do Botão
                  </label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                    placeholder="Ver Mais"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Agendamento */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Agendamento (Opcional)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Data de Início
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Data de Término
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Status</h2>
            
            <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-white font-medium">Ativo</p>
                  <p className="text-gray-400 text-sm">Destaque visível na plataforma</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded"
              />
            </label>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/featured"
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
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Destaque'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFeaturedForm;
