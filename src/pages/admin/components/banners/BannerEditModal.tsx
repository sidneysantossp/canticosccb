import React from 'react';
import { X, Save } from 'lucide-react';
import MediaDropzone from '@/components/ui/MediaDropzone';
import GradientColorPicker from '@/components/ui/GradientColorPicker';
import { BannerType, Banner } from '@/lib/admin/bannersAdminApi';

interface CreateBannerData {
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  type: BannerType;
  position: number;
  is_active: boolean;
  gradient_overlay?: string;
}

interface Props {
  show: boolean;
  editingBanner: Banner | null;
  formData: CreateBannerData;
  setFormData: (d: CreateBannerData) => void;
  isSaving: boolean;
  isUploading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onMediaUpload: (file: File) => void;
  previewUrl?: string;
  previewType?: 'image' | 'video' | 'audio';
  onRemoveMedia?: () => void;
}

const BannerEditModal: React.FC<Props> = ({
  show,
  editingBanner,
  formData,
  setFormData,
  isSaving,
  isUploading,
  onClose,
  onSubmit,
  onMediaUpload,
  previewUrl,
  previewType,
  onRemoveMedia,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{editingBanner ? 'Editar Banner' : 'Novo Banner'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              placeholder="Ex: Bem-vindo ao Cânticos CCB"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none focus:outline-none focus:border-primary-600"
              rows={2}
              placeholder="Descrição do banner..."
            />
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Mídia do Banner *</label>
            <MediaDropzone
              onFileSelect={onMediaUpload}
              onRemove={onRemoveMedia || (() => setFormData({ ...formData, image_url: '' }))}
              currentUrl={formData.image_url}
              previewUrl={previewUrl}
              currentType={previewType}
              accept="image/*,video/*"
              maxSize={50}
              isUploading={isUploading}
              allowVideo={true}
            />
            <p className="text-xs text-gray-500 mt-2">
              Imagens: JPG, PNG, WebP até 10MB | Vídeos: MP4, WebM até 50MB
              <br />
              Recomendado: Hero (1200x400px), Promo/Context (1200x300px)
            </p>
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Link (URL)</label>
            <input
              type="text"
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              placeholder="/songs"
            />
          </div>

          {/* Gradiente de Overlay */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Gradiente de Overlay</label>
            <GradientColorPicker
              value={formData.gradient_overlay || ''}
              onChange={(gradient) => setFormData({ ...formData, gradient_overlay: gradient })}
            />
          </div>

          {/* Type & Position & Active */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as BannerType })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              >
                <option value="hero">Hero/Carousel</option>
                <option value="promotional">Promocional</option>
                <option value="contextual">Contextual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Posição</label>
              <input
                type="number"
                min={1}
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded bg-gray-700 border-gray-600"
                />
                <span className="text-gray-300 font-medium">Ativo</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Salvar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerEditModal;
