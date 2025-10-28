import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Plus, Edit, Trash2, TrendingUp, DollarSign, RefreshCw, Percent, AlertTriangle } from 'lucide-react';
import PromotionsStatsCards from '@/pages/admin/components/promotions/PromotionsStatsCards';
import PromotionsEditModal from '@/pages/admin/components/promotions/PromotionsEditModal';

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

const AdminPromotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    promotion_type: 'discount' as Promotion['promotion_type'],
    discount_type: 'percentage' as Promotion['discount_type'],
    discount_value: 0,
    promo_code: '',
    max_uses: 0,
    start_date: '',
    end_date: '',
    is_active: true
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0
  });

  const promotionTypes = [
    { value: 'discount', label: 'Desconto', color: 'blue' },
    { value: 'trial', label: 'Período de Teste', color: 'green' },
    { value: 'upgrade', label: 'Upgrade', color: 'purple' },
    { value: 'bundle', label: 'Pacote', color: 'yellow' },
    { value: 'referral', label: 'Indicação', color: 'pink' }
  ];

  const discountTypes = [
    { value: 'percentage', label: 'Porcentagem (%)' },
    { value: 'fixed', label: 'Valor Fixo (R$)' },
    { value: 'free', label: 'Grátis' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock data
      const mockPromotions: Promotion[] = [
        {
          id: '1',
          title: 'Black Friday 2025',
          description: 'Desconto especial de Black Friday',
          promotion_type: 'discount',
          discount_type: 'percentage',
          discount_value: 50,
          promo_code: 'BLACKFRIDAY2025',
          max_uses: 1000,
          uses_count: 432,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_active: true,
          clicks_count: 1547,
          conversions_count: 432,
          revenue_generated: 21600.00,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Primeira Assinatura',
          description: '30 dias grátis na primeira assinatura',
          promotion_type: 'trial',
          discount_type: 'free',
          discount_value: 30,
          promo_code: 'BEMVINDO30',
          uses_count: 287,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_active: true,
          clicks_count: 823,
          conversions_count: 287,
          revenue_generated: 8610.00,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Upgrade Premium',
          description: 'Desconto de R$10 no upgrade',
          promotion_type: 'upgrade',
          discount_type: 'fixed',
          discount_value: 10,
          promo_code: 'UPGRADE10',
          max_uses: 500,
          uses_count: 156,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_active: false,
          clicks_count: 456,
          conversions_count: 156,
          revenue_generated: 4680.00,
          created_at: new Date().toISOString()
        }
      ];

      setPromotions(mockPromotions);
      
      setStats({
        total: mockPromotions.length,
        active: mockPromotions.filter(p => p.is_active).length,
        totalClicks: mockPromotions.reduce((sum, p) => sum + p.clicks_count, 0),
        totalConversions: mockPromotions.reduce((sum, p) => sum + p.conversions_count, 0),
        totalRevenue: mockPromotions.reduce((sum, p) => sum + p.revenue_generated, 0)
      });

    } catch (err: any) {
      console.error('Error loading promotions:', err);
      setError(err?.message || 'Erro ao carregar promoções');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        title: promotion.title,
        description: promotion.description || '',
        promotion_type: promotion.promotion_type,
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value,
        promo_code: promotion.promo_code,
        max_uses: promotion.max_uses || 0,
        start_date: promotion.start_date,
        end_date: promotion.end_date,
        is_active: promotion.is_active
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        title: '',
        description: '',
        promotion_type: 'discount',
        discount_type: 'percentage',
        discount_value: 0,
        promo_code: '',
        max_uses: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.promo_code) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving promotion:', error);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      loadData();
    } catch (error) {
      console.error('Error toggling promotion status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!confirm('Deseja realmente excluir esta promoção?')) return;
      await new Promise(resolve => setTimeout(resolve, 500));
      loadData();
    } catch (error) {
      console.error('Error deleting promotion:', error);
    }
  };

  const getTypeColor = (type: string) => {
    const typeObj = promotionTypes.find(t => t.value === type);
    return typeObj?.color || 'gray';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando promoções...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar promoções</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Promoções</h1>
          <p className="text-gray-400">Gerencie promoções e ofertas especiais</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Atualizar
          </button>
          <Link
            to="/admin/promotions/criar"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Promoção
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <PromotionsStatsCards
        stats={stats}
        formatNumber={formatNumber}
        formatCurrency={formatCurrency}
      />

      {/* Promotions List */}
      <div className="space-y-4">
        {promotions.map((promotion) => (
          <div key={promotion.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-white font-semibold text-lg">{promotion.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full border bg-${getTypeColor(promotion.promotion_type)}-500/20 text-${getTypeColor(promotion.promotion_type)}-400 border-${getTypeColor(promotion.promotion_type)}-500/30`}>
                    {promotionTypes.find(t => t.value === promotion.promotion_type)?.label}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full border ${
                    promotion.is_active
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}>
                    {promotion.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                {promotion.description && (
                  <p className="text-gray-400 text-sm mb-3">{promotion.description}</p>
                )}
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-gray-400">Código: </span>
                    <code className="text-primary-400 bg-primary-500/10 px-2 py-1 rounded">{promotion.promo_code}</code>
                  </div>
                  <div>
                    <span className="text-gray-400">Desconto: </span>
                    <span className="text-white font-medium">
                      {promotion.discount_type === 'percentage' && `${promotion.discount_value}%`}
                      {promotion.discount_type === 'fixed' && formatCurrency(promotion.discount_value)}
                      {promotion.discount_type === 'free' && `${promotion.discount_value} dias grátis`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Período: </span>
                    <span className="text-white">{formatDate(promotion.start_date)} - {formatDate(promotion.end_date)}</span>
                  </div>
                  {promotion.max_uses && (
                    <div>
                      <span className="text-gray-400">Usos: </span>
                      <span className="text-white">{promotion.uses_count} / {promotion.max_uses}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promotion.is_active}
                    onChange={() => handleToggleStatus(promotion.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>

                <Link
                  to={`/admin/promotions/editar/${promotion.id}`}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4 text-blue-400" />
                </Link>
                <button
                  onClick={() => handleDelete(promotion.id)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-700">
              <div className="text-sm">
                <span className="text-gray-400">Cliques: </span>
                <span className="text-white font-medium">{formatNumber(promotion.clicks_count)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Conversões: </span>
                <span className="text-green-400 font-medium">{formatNumber(promotion.conversions_count)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Taxa de Conversão: </span>
                <span className="text-yellow-400 font-medium">
                  {promotion.clicks_count > 0 ? ((promotion.conversions_count / promotion.clicks_count) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Receita: </span>
                <span className="text-pink-400 font-medium">{formatCurrency(promotion.revenue_generated)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {promotions.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
          <Tag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma promoção encontrada</p>
          <p className="text-gray-500 text-sm">Crie sua primeira promoção</p>
        </div>
      )}

      {/* Modal de Edição/Criação */}
      <PromotionsEditModal
        show={showModal}
        editingPromotion={editingPromotion}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        promotionTypes={promotionTypes}
        discountTypes={discountTypes}
      />
    </div>
  );
};

export default AdminPromotions;
