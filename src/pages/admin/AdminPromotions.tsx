import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Gift, Plus, RefreshCw, Tag, Trash2, AlertTriangle } from 'lucide-react';
import PromotionsStatsCards from '@/pages/admin/components/promotions/PromotionsStatsCards';
import {
  deletePromotion,
  getAllPromotions,
  togglePromotionStatus,
  type PromotionRecord,
} from '@/lib/admin/promotionsAdminApi';

const PROMOTION_TYPES = [
  { value: 'discount', label: 'Desconto' },
  { value: 'trial', label: 'Período de Teste' },
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'bundle', label: 'Pacote' },
  { value: 'referral', label: 'Indicação' },
] as const;

const getTypeBadgeClass = (type: string) => {
  switch (type) {
    case 'discount':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'trial':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'upgrade':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'bundle':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'referral':
      return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const AdminPromotions: React.FC = () => {
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setPromotions(await getAllPromotions());
    } catch (err: any) {
      console.error('Erro ao carregar promoções:', err);
      setError(err?.message || 'Erro ao carregar promoções');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(
    () => ({
      total: promotions.length,
      active: promotions.filter((promotion) => promotion.is_active).length,
      totalClicks: promotions.reduce((sum, promotion) => sum + promotion.clicks_count, 0),
      totalConversions: promotions.reduce((sum, promotion) => sum + promotion.conversions_count, 0),
      totalRevenue: promotions.reduce((sum, promotion) => sum + promotion.revenue_generated, 0),
    }),
    [promotions]
  );

  const handleToggleStatus = async (id: string) => {
    try {
      await togglePromotionStatus(id);
      setPromotions((current) =>
        current.map((promotion) =>
          promotion.id === id
            ? { ...promotion, is_active: !promotion.is_active }
            : promotion
        )
      );
    } catch (err) {
      console.error('Erro ao alterar status da promoção:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!window.confirm('Deseja realmente excluir esta promoção?')) return;
      await deletePromotion(id);
      setPromotions((current) => current.filter((promotion) => promotion.id !== id));
    } catch (err) {
      console.error('Erro ao excluir promoção:', err);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

  const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR');

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Promoções</h1>
          <p className="text-gray-400">Gerencie promoções e ofertas especiais do admin</p>
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

      <PromotionsStatsCards
        stats={stats}
        formatNumber={formatNumber}
        formatCurrency={formatCurrency}
      />

      <div className="space-y-4">
        {promotions.map((promotion) => (
          <div key={promotion.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-white font-semibold text-lg">{promotion.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getTypeBadgeClass(promotion.promotion_type)}`}>
                    {PROMOTION_TYPES.find((item) => item.value === promotion.promotion_type)?.label || promotion.promotion_type}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full border ${
                      promotion.is_active
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}
                  >
                    {promotion.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                {promotion.description ? (
                  <p className="text-gray-400 text-sm mb-3">{promotion.description}</p>
                ) : null}

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div>
                    <span className="text-gray-400">Código: </span>
                    <code className="text-primary-400 bg-primary-500/10 px-2 py-1 rounded">
                      {promotion.promo_code}
                    </code>
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
                    <span className="text-white">
                      {formatDate(promotion.start_date)} - {formatDate(promotion.end_date)}
                    </span>
                  </div>
                  {promotion.max_uses ? (
                    <div>
                      <span className="text-gray-400">Usos: </span>
                      <span className="text-white">
                        {promotion.uses_count} / {promotion.max_uses}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
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

            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-700 mt-4">
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
                  {promotion.clicks_count > 0
                    ? ((promotion.conversions_count / promotion.clicks_count) * 100).toFixed(1)
                    : 0}
                  %
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
    </div>
  );
};

export default AdminPromotions;
