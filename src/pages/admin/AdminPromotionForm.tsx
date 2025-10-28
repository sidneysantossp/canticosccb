import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Tag, Calendar, Percent } from 'lucide-react';

interface Promotion {
  id: string;
  title: string;
  description?: string;
  promotion_type: 'discount' | 'trial' | 'upgrade' | 'bundle' | 'referral';
  discount_type: 'percentage' | 'fixed' | 'free';
  discount_value: number;
  promo_code: string;
  max_uses?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const PROMOTION_TYPES = [
  { value: 'discount', label: 'Desconto' },
  { value: 'trial', label: 'Período de Teste' },
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'bundle', label: 'Pacote' },
  { value: 'referral', label: 'Indicação' }
];

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Porcentagem (%)' },
  { value: 'fixed', label: 'Valor Fixo (R$)' },
  { value: 'free', label: 'Grátis' }
];

const AdminPromotionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    promotion_type: 'discount' as Promotion['promotion_type'],
    discount_type: 'percentage' as Promotion['discount_type'],
    discount_value: 0,
    promo_code: '',
    max_uses: 100,
    start_date: '',
    end_date: '',
    is_active: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadPromotion(id);
    }
  }, [id, isEditing]);

  const loadPromotion = async (promotionId: string) => {
    try {
      setIsLoading(true);
      // TODO: Implementar getPromotionById quando backend estiver pronto
      // const promotion = await getPromotionById(promotionId);
      // if (promotion) { setFormData(...); }
    } catch (error: any) {
      console.error('Erro ao carregar promoção:', error);
      setError(error?.message || 'Erro ao carregar promoção');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePromoCode = () => {
    const code = formData.title.toUpperCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
    setFormData({ ...formData, promo_code: code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const promotionData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        promotion_type: formData.promotion_type,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        promo_code: formData.promo_code.trim().toUpperCase(),
        max_uses: formData.max_uses || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active
      };

      if (isEditing && id) {
        // await updatePromotion(id, promotionData);
      } else {
        // await createPromotion(promotionData);
      }

      navigate('/admin/promotions');
    } catch (error: any) {
      console.error('Erro ao salvar promoção:', error);
      setError(error?.message || 'Erro ao salvar promoção');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando promoção...</p>
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
            to="/admin/promotions"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? 'Editar Promoção' : 'Nova Promoção'}
            </h1>
            <p className="text-gray-400 mt-1">Configure promoções, descontos e cupons</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Informações da Promoção
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
                  placeholder="Ex: Black Friday 2025"
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
                  placeholder="Descrição da promoção..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">
                    Tipo de Promoção *
                  </label>
                  <select
                    value={formData.promotion_type}
                    onChange={(e) => setFormData({ ...formData, promotion_type: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  >
                    {PROMOTION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

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
              </div>

              {formData.discount_type !== 'free' && (
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
                      {formData.discount_type === 'percentage' ? '%' : 'R$'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Código Promocional */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Código Promocional
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Código *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.promo_code}
                    onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
                    required
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600 uppercase"
                    placeholder="CUPOM2025"
                  />
                  <button
                    type="button"
                    onClick={generatePromoCode}
                    className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                  >
                    Gerar
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Código que os usuários usarão para aplicar a promoção
                </p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Limite de Usos
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="0 = ilimitado"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Deixe 0 para usos ilimitados
                </p>
              </div>
            </div>
          </div>

          {/* Período de Validade */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Período de Validade
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Data de Início *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Data de Término *
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
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
                <Tag className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-white font-medium">Ativo</p>
                  <p className="text-gray-400 text-sm">Promoção disponível para uso</p>
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
              to="/admin/promotions"
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
                  <span>{isEditing ? 'Salvar Alterações' : 'Criar Promoção'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPromotionForm;
