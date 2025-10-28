import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Image as ImageIcon } from 'lucide-react';
import {
  getBannerById,
  createBanner,
  updateBanner,
  uploadBannerImage,
  BannerType,
  CreateBannerData
} from '@/lib/admin/bannersAdminApi';

const BANNER_TYPES: { value: BannerType; label: string }[] = [
  { value: 'hero', label: 'Hero/Principal' },
  { value: 'promotional', label: 'Promocional' },
  { value: 'announcement', label: 'Anúncio' },
  { value: 'featured', label: 'Destaque' }
];

const GRADIENT_OPTIONS = [
  { value: 'bg-gradient-to-br from-[#3b82f6]/80 to-[#8b5cf6]/80', label: 'Azul → Roxo' },
  { value: 'bg-gradient-to-br from-[#10b981]/80 to-[#3b82f6]/80', label: 'Verde → Azul' },
  { value: 'bg-gradient-to-br from-[#f59e0b]/80 to-[#ef4444]/80', label: 'Laranja → Vermelho' },
  { value: 'bg-gradient-to-br from-[#8b5cf6]/80 to-[#ec4899]/80', label: 'Roxo → Rosa' },
  { value: 'bg-gradient-to-br from-[#06b6d4]/80 to-[#3b82f6]/80', label: 'Ciano → Azul' },
  { value: 'bg-gradient-to-br from-[#000000]/60 to-[#000000]/80', label: 'Preto' }
];

const AdminBannerForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CreateBannerData>({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    type: 'hero',
    position: 1,
    is_active: true,
    gradient_overlay: 'bg-gradient-to-br from-[#3b82f6]/80 to-[#8b5cf6]/80'
  });

  const [imagePreview, setImagePreview] = useState('');
  const [previewType, setPreviewType] = useState<'image'|'video'|'audio'>('image');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadBanner(id);
    }
  }, [id, isEditing]);

  const loadBanner = async (bannerId: string) => {
    try {
      setIsLoading(true);
      const banner = await getBannerById(bannerId);

      if (banner) {
        setFormData({
          title: banner.title,
          description: banner.description || '',
          image_url: banner.image_url,
          link_url: banner.link_url || '',
          type: banner.type,
          position: banner.position,
          is_active: banner.is_active,
          gradient_overlay: banner.gradient_overlay || 'bg-gradient-to-br from-[#3b82f6]/80 to-[#8b5cf6]/80'
        });
        // Normalizar URL antiga pública /media/banners/ -> stream seguro
        const normalizeUrl = (url: string) => {
          if (!url) return '';
          const lower = url.toLowerCase();
          const fileName = url.split('/').pop() || '';
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const isLocalhost = origin.includes('localhost');
          const base = isLocalhost ? `${window.location.protocol}//localhost/1canticosccb` : origin;
          const isOldPublic = lower.includes('/media/banners/');
          const isRelativeStream = lower.startsWith('/api/stream.php');
          if (isOldPublic && fileName) {
            return `${base}/api/stream.php?type=banners&file=${encodeURIComponent(fileName)}`;
          }
          if (isRelativeStream) {
            return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
          }
          return url;
        };
        const normalizedUrl = normalizeUrl(banner.image_url);
        setImagePreview(normalizedUrl);
        const isVideo = /\.(mp4|webm|mov)(\?|#|$)/i.test(normalizedUrl) || normalizedUrl.includes('type=banners');
        setPreviewType(isVideo ? 'video' : 'image');
      }
    } catch (error: any) {
      console.error('Erro ao carregar banner:', error);
      setError(error?.message || 'Erro ao carregar banner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Preview imediato com object URL
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);
      const isVid = file.type.startsWith('video/');
      setPreviewType(isVid ? 'video' : 'image');
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
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);
      const isVid = file.type.startsWith('video/');
      setPreviewType(isVid ? 'video' : 'image');
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const imageUrl = await uploadBannerImage(file);
      return imageUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      let imageUrl = formData.image_url;

      // Upload de imagem se houver
      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        if (uploaded) imageUrl = uploaded;
      }

      const bannerData: CreateBannerData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        image_url: imageUrl,
        link_url: formData.link_url.trim() || undefined,
        type: formData.type,
        position: formData.position,
        is_active: formData.is_active,
        gradient_overlay: formData.gradient_overlay
      };

      if (isEditing && id) {
        await updateBanner(id, bannerData);
      } else {
        await createBanner(bannerData);
      }

      navigate('/admin/banners');
    } catch (error: any) {
      console.error('Erro ao salvar banner:', error);
      setError(error?.message || 'Erro ao salvar banner');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando banner...</p>
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
            to="/admin/banners"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? 'Editar Banner' : 'Novo Banner'}
            </h1>
            <p className="text-gray-400 mt-1">Gerencie banners promocionais e destaques</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Imagem do Banner */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Imagem do Banner</h2>
            
            <div className="space-y-4">
              {imagePreview && (
                <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
                  {previewType === 'video' ? (
                    <video src={imagePreview} className="w-full h-full object-cover" controls muted />
                  ) : (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  )}
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
                  Recomendado: 1920x820px (formato 21:9)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Informações do Banner */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Informações do Banner
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
                  placeholder="Título do banner"
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
                  placeholder="Descrição ou subtítulo..."
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Link de Destino
                </label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as BannerType })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  >
                    {BANNER_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

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
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Overlay de Gradiente
                </label>
                <select
                  value={formData.gradient_overlay}
                  onChange={(e) => setFormData({ ...formData, gradient_overlay: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                >
                  {GRADIENT_OPTIONS.map(gradient => (
                    <option key={gradient.value} value={gradient.value}>{gradient.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Status</h2>
            
            <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-white font-medium">Ativo</p>
                  <p className="text-gray-400 text-sm">Banner visível para os usuários</p>
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
              to="/admin/banners"
              className="flex-1 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isSaving || isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{isUploading ? 'Enviando...' : 'Salvando...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Banner'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBannerForm;
