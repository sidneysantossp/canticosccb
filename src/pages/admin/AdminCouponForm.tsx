import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Ticket, Percent, Tag as TagIcon } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed' | 'free_months';
  discount_value: number;
  applies_to: 'all' | 'premium' | 'specific_plan';
  minimum_purchase?: number;
  max_uses?: number;
  max_uses_per_user: number;
  is_single_use: boolean;
  is_active: boolean;
  is_public: boolean;
  first_purchase_only: boolean;
  tags: string[];
}

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Porcentagem (%)' },
  { value: 'fixed', label: 'Valor Fixo (R$)' },
  { value: 'free_months', label: 'Meses Grátis' }
];

const APPLIES_TO = [
  { value: 'all', label: 'Todos os Planos' },
  { value: 'premium', label: 'Apenas Premium' },
  { value: 'specific_plan', label: 'Plano Específico' }
];

const AdminCouponForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as Coupon['discount_type'],
    discount_value: 0,
    applies_to: 'premium' as Coupon['applies_to'],
    minimum_purchase: 0,
    max_uses: 0,
    max_uses_per_user: 1,
    is_single_use: false,
    is_active: true,
    is_public: true,
    first_purchase_only: false,
    tags: [] as string[]
  });

  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadCoupon(id);
    }
  }, [id, isEditing]);

  const loadCoupon = async (couponId: string) => {
    try {
      setIsLoading(true);
      // TODO: Implementar getCouponById quando backend estiver pronto
      // const coupon = await getCouponById(couponId);
      // if (coupon) { setFormData(...); }
    } catch (error: any) {
      console.error('Erro ao carregar cupom:', error);
      setError(error?.message || 'Erro ao carregar cupom');
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setFormData({ ...formData, code });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const couponData = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        applies_to: formData.applies_to,
        minimum_purchase: formData.minimum_purchase || undefined,
        max_uses: formData.max_uses || undefined,
        max_uses_per_user: formData.max_uses_per_user,
        is_single_use: formData.is_single_use,
        is_active: formData.is_active,
        is_public: formData.is_public,
        first_purchase_only: formData.first_purchase_only,
        tags: formData.tags
      };

      if (isEditing && id) {
        // await updateCoupon(id, couponData);
      } else {
        // await createCoupon(couponData);
      }

      navigate('/admin/coupons');
    } catch (error: any) {
      console.error('Erro ao salvar cupom:', error);
      setError(error?.message || 'Erro ao salvar cupom');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando cupom...</p>
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
            to="/admin/coupons"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? 'Editar Cupom' : 'Novo Cupom'}
            </h1>
            <p className="text-gray-400 mt-1">Configure cupons de desconto para assinaturas</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Código do Cupom */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Código do Cupom
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Código *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600 uppercase"
                    placeholder="CUPOM2025"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                  >
                    Gerar
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Código que os usuários usarão para aplicar o desconto
                </p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-green-600"
                  placeholder="Descrição interna do cupom..."
                />
              </div>
            </div>
          </div>

          {/* Desconto */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Configuração de Desconto
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Tipo de Desconto *
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  >
                    {DISCOUNT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Valor do Desconto *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                      placeholder={formData.discount_type === 'percentage' ? '10' : '50.00'}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {formData.discount_type === 'percentage' ? '%' : formData.discount_type === 'fixed' ? 'R$' : 'meses'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Aplica-se a *
                </label>
                <select
                  value={formData.applies_to}
                  onChange={(e) => setFormData({ ...formData, applies_to: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                >
                  {APPLIES_TO.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Compra Mínima (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimum_purchase}
                  onChange={(e) => setFormData({ ...formData, minimum_purchase: parseFloat(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="0.00"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Valor mínimo de compra para usar o cupom (0 = sem mínimo)
                </p>
              </div>
            </div>
          </div>

          {/* Limites de Uso */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Limites de Uso</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Máximo de Usos
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                    placeholder="0 = ilimitado"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Usos por Usuário
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_uses_per_user}
                    onChange={(e) => setFormData({ ...formData, max_uses_per_user: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TagIcon className="w-5 h-5" />
              Tags
            </h2>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Digite uma tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                >
                  Adicionar
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Configurações Adicionais */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Configurações</h2>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-white font-medium">Ativo</p>
                    <p className="text-gray-400 text-sm">Cupom disponível para uso</p>
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
                <div>
                  <p className="text-white font-medium">Público</p>
                  <p className="text-gray-400 text-sm">Visível para todos os usuários</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-white font-medium">Uso Único</p>
                  <p className="text-gray-400 text-sm">Pode ser usado apenas uma vez</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_single_use}
                  onChange={(e) => setFormData({ ...formData, is_single_use: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-white font-medium">Primeira Compra Apenas</p>
                  <p className="text-gray-400 text-sm">Válido apenas para novos clientes</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.first_purchase_only}
                  onChange={(e) => setFormData({ ...formData, first_purchase_only: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/coupons"
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
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Cupom'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCouponForm;
