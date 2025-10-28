import React from 'react';

interface Promotion {
  id: string;
  title: string;
  description?: string;
  promotion_type: 'discount' | 'trial' | 'upgrade' | 'bundle' | 'referral';
  discount_type: 'percentage' | 'fixed' | 'free';
  discount_value: number;
  promo_code: string;
  max_uses?: number;
  uses_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  clicks_count: number;
  conversions_count: number;
  revenue_generated: number;
  created_at: string;
}

interface Option { value: string; label: string; color?: string }

interface FormDataShape {
  title: string;
  description: string;
  promotion_type: Promotion['promotion_type'];
  discount_type: Promotion['discount_type'];
  discount_value: number;
  promo_code: string;
  max_uses: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Props {
  show: boolean;
  editingPromotion: Promotion | null;
  formData: FormDataShape;
  setFormData: (d: FormDataShape) => void;
  onClose: () => void;
  onSave: () => void;
  promotionTypes: Option[];
  discountTypes: Option[];
}

const PromotionsEditModal: React.FC<Props> = ({
  show,
  editingPromotion,
  formData,
  setFormData,
  onClose,
  onSave,
  promotionTypes,
  discountTypes,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-xl font-bold text-white">
            {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              placeholder="Digite o título da promoção"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              rows={3}
              placeholder="Descreva a promoção"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Promoção *</label>
              <select
                value={formData.promotion_type}
                onChange={(e) => setFormData({ ...formData, promotion_type: e.target.value as any })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              >
                {promotionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Desconto *</label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              >
                {discountTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Valor do Desconto *</label>
              <input
                type="number"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                placeholder="0"
                min={0}
                step={0.01}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Código da Promoção *</label>
              <input
                type="text"
                value={formData.promo_code}
                onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                placeholder="EX: BLACKFRIDAY"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data de Início *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data de Término *</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Limite de Usos (0 = ilimitado)</label>
            <input
              type="number"
              value={formData.max_uses}
              onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              placeholder="0"
              min={0}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <span className="text-gray-300">Promoção ativa</span>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            {editingPromotion ? 'Salvar Alterações' : 'Criar Promoção'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionsEditModal;
