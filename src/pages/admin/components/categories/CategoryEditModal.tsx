import React from 'react';
import { X, Save, Upload, Image as ImageIcon } from 'lucide-react';

interface ColorOption { value: string; label: string }

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  background_color: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
}

export interface EditingCategoryMinimal { id: string; name: string }

interface Props {
  show: boolean;
  editingCategory: EditingCategoryMinimal | null;
  formData: CategoryFormData;
  setFormData: (d: CategoryFormData) => void;
  isSaving: boolean;
  isUploading: boolean;
  dragActive: boolean;
  colors: ColorOption[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const CategoryEditModal: React.FC<Props> = ({
  show,
  editingCategory,
  formData,
  setFormData,
  isSaving,
  isUploading,
  dragActive,
  colors,
  onClose,
  onSubmit,
  onFileInput,
  onDrag,
  onDrop,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">
            {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                placeholder="Ex: Hinos de Natal"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
                rows={3}
                placeholder="Descrição da categoria..."
              />
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ícone (Emoji)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-2xl text-center"
                placeholder="📁"
                maxLength={2}
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cor do Ícone</label>
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`h-12 rounded-lg transition-all ${
                      formData.color === color.value ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cor de Fundo (Card)</label>
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, background_color: color.value })}
                    className={`h-12 rounded-lg transition-all ${
                      formData.background_color === color.value ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
              <input
                type="text"
                value={formData.background_color}
                onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm mt-2"
                placeholder="#3b82f6"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Imagem do Canto (Drag & Drop)</label>
              <div
                onDragEnter={onDrag}
                onDragLeave={onDrag}
                onDragOver={onDrag}
                onDrop={onDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragActive ? 'border-primary-500 bg-primary-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <input type="file" id="file-upload" accept="image/*" onChange={onFileInput} className="hidden" />

                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-400">Enviando imagem...</p>
                  </div>
                ) : formData.image_url ? (
                  <div className="space-y-3">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Erro';
                      }}
                    />
                    <div className="flex gap-2">
                      <label htmlFor="file-upload" className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg cursor-pointer transition-colors">
                        Trocar Imagem
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <ImageIcon className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="text-gray-400 mb-2">Arraste uma imagem aqui</p>
                    <p className="text-gray-500 text-sm mb-3">ou</p>
                    <label htmlFor="file-upload" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer transition-colors inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Escolher Arquivo
                    </label>
                    <p className="text-gray-500 text-xs mt-3">PNG, JPG, GIF até 5MB</p>
                  </div>
                )}
              </div>

              <details className="mt-3">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">Ou inserir URL manualmente</summary>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm mt-2"
                  placeholder="https://example.com/imagem.jpg"
                />
              </details>
            </div>

            {/* Display Order & Active */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ordem</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <label className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-white">Ativo</span>
                </label>
              </div>
            </div>

            {/* Preview Card */}
            <div className="border-t border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Preview</label>
              <div className="relative rounded-xl p-6 overflow-hidden h-32" style={{ backgroundColor: formData.background_color }}>
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-lg mb-1">{formData.name || 'Nome da Categoria'}</h3>
                  <p className="text-white/80 text-sm">{formData.description || 'Descrição'}</p>
                </div>
                {formData.image_url && (
                  <div className="absolute bottom-0 right-0 w-28 h-28 opacity-50 overflow-hidden rounded-lg">
                    <img
                      src={formData.image_url}
                      alt="Background"
                      className="w-full h-full object-cover rounded-lg"
                      style={{ transform: 'rotate(15deg)', transformOrigin: 'bottom right' }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Buttons - Fixed Footer */}
          <div className="border-t border-gray-800 p-6 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50">
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryEditModal;
