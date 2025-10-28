import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Plus, Edit, Trash2, Users, TrendingUp, RefreshCw, Copy, AlertTriangle } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed' | 'free_months';
  discount_value: number;
  applies_to: 'all' | 'premium' | 'specific_plan';
  minimum_purchase?: number;
  max_uses?: number;
  uses_count: number;
  max_uses_per_user: number;
  is_single_use: boolean;
  is_active: boolean;
  is_public: boolean;
  first_purchase_only: boolean;
  tags: string[];
  created_at: string;
}

const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
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

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    public: 0,
    totalUses: 0
  });

  const discountTypes = [
    { value: 'percentage', label: 'Porcentagem (%)' },
    { value: 'fixed', label: 'Valor Fixo (R$)' },
    { value: 'free_months', label: 'Meses Grátis' }
  ];

  const appliesTo = [
    { value: 'all', label: 'Todos os Planos' },
    { value: 'premium', label: 'Apenas Premium' },
    { value: 'specific_plan', label: 'Plano Específico' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock data
      const mockCoupons: Coupon[] = [
        {
          id: '1',
          code: 'PRIMEIRACOMPRA',
          description: '20% off na primeira assinatura',
          discount_type: 'percentage',
          discount_value: 20,
          applies_to: 'premium',
          max_uses_per_user: 1,
          uses_count: 487,
          is_single_use: false,
          is_active: true,
          is_public: true,
          first_purchase_only: true,
          tags: ['primeira-compra', 'popular'],
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          code: 'VIP50',
          description: 'R$50 de desconto para assinantes VIP',
          discount_type: 'fixed',
          discount_value: 50,
          applies_to: 'premium',
          max_uses: 100,
          uses_count: 67,
          max_uses_per_user: 1,
          is_single_use: false,
          is_active: true,
          is_public: false,
          first_purchase_only: false,
          tags: ['vip', 'exclusivo'],
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          code: '3MESESGRATIS',
          description: '3 meses grátis de Premium',
          discount_type: 'free_months',
          discount_value: 3,
          applies_to: 'premium',
          max_uses: 50,
          uses_count: 34,
          max_uses_per_user: 1,
          is_single_use: false,
          is_active: true,
          is_public: true,
          first_purchase_only: false,
          tags: ['trial', 'promocional'],
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          code: 'AMIGO15',
          description: '15% off para indicação de amigos',
          discount_type: 'percentage',
          discount_value: 15,
          applies_to: 'all',
          uses_count: 123,
          max_uses_per_user: 1,
          is_single_use: false,
          is_active: true,
          is_public: true,
          first_purchase_only: false,
          tags: ['referral', 'amigos'],
          created_at: new Date().toISOString()
        }
      ];

      setCoupons(mockCoupons);
      
      setStats({
        total: mockCoupons.length,
        active: mockCoupons.filter(c => c.is_active).length,
        public: mockCoupons.filter(c => c.is_public).length,
        totalUses: mockCoupons.reduce((sum, c) => sum + c.uses_count, 0)
      });

    } catch (err: any) {
      console.error('Erro ao carregar cupons:', err);
      setError(err?.message || 'Erro ao carregar cupons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        applies_to: coupon.applies_to,
        minimum_purchase: coupon.minimum_purchase || 0,
        max_uses: coupon.max_uses || 0,
        max_uses_per_user: coupon.max_uses_per_user,
        is_single_use: coupon.is_single_use,
        is_active: coupon.is_active,
        is_public: coupon.is_public,
        first_purchase_only: coupon.first_purchase_only,
        tags: coupon.tags
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        applies_to: 'premium',
        minimum_purchase: 0,
        max_uses: 0,
        max_uses_per_user: 1,
        is_single_use: false,
        is_active: true,
        is_public: true,
        first_purchase_only: false,
        tags: []
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.code) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      loadData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!confirm('Deseja realmente excluir este cupom?')) return;
      await new Promise(resolve => setTimeout(resolve, 500));
      loadData();
    } catch (error) {
      console.error('Erro ao excluir cupom:', error);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
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

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando cupons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar cupons</h2>
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
          <h1 className="text-3xl font-bold text-white mb-2">Cupons de Desconto</h1>
          <p className="text-gray-400">Gerencie cupons e códigos promocionais</p>
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
            to="/admin/coupons/criar"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Cupom
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Ticket className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Cupons</p>
              <p className="text-white text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <Ticket className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Cupons Ativos</p>
              <p className="text-white text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Cupons Públicos</p>
              <p className="text-white text-2xl font-bold">{stats.public}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Usos</p>
              <p className="text-white text-2xl font-bold">{formatNumber(stats.totalUses)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-primary-400 bg-primary-500/10 px-3 py-1 rounded-lg font-mono text-sm font-bold">
                    {coupon.code}
                  </code>
                  <button
                    onClick={() => handleCopyCode(coupon.code)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="Copiar código"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                {coupon.description && (
                  <p className="text-gray-400 text-sm mb-2">{coupon.description}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Desconto:</span>
                <span className="text-white font-medium">
                  {coupon.discount_type === 'percentage' && `${coupon.discount_value}%`}
                  {coupon.discount_type === 'fixed' && formatCurrency(coupon.discount_value)}
                  {coupon.discount_type === 'free_months' && `${coupon.discount_value} meses grátis`}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Aplicável:</span>
                <span className="text-white">{appliesTo.find(a => a.value === coupon.applies_to)?.label}</span>
              </div>

              {coupon.max_uses && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Usos:</span>
                  <span className="text-white">{coupon.uses_count} / {coupon.max_uses}</span>
                </div>
              )}

              {!coupon.max_uses && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Usos:</span>
                  <span className="text-white">{coupon.uses_count}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {coupon.is_active && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                  Ativo
                </span>
              )}
              {!coupon.is_active && (
                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full border border-gray-500/30">
                  Inativo
                </span>
              )}
              {coupon.is_public && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                  Público
                </span>
              )}
              {coupon.first_purchase_only && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                  1ª Compra
                </span>
              )}
              {coupon.is_single_use && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                  Uso Único
                </span>
              )}
            </div>

            {coupon.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {coupon.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={coupon.is_active}
                  onChange={() => handleToggleStatus(coupon.id)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>

              <div className="flex gap-2">
                <Link
                  to={`/admin/coupons/editar/${coupon.id}`}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4 text-blue-400" />
                </Link>
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {coupons.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
          <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum cupom encontrado</p>
          <p className="text-gray-500 text-sm">Crie seu primeiro cupom de desconto</p>
        </div>
      )}

      {/* Modal de Edição/Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">
                {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600 font-mono"
                  placeholder="EX: PRIMEIRACOMPRA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  rows={2}
                  placeholder="Descreva o cupom"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Desconto *
                  </label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Valor do Desconto *
                  </label>
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Aplicável a *
                  </label>
                  <select
                    value={formData.applies_to}
                    onChange={(e) => setFormData({ ...formData, applies_to: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    {appliesTo.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Valor Mínimo de Compra (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.minimum_purchase}
                    onChange={(e) => setFormData({ ...formData, minimum_purchase: parseFloat(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Limite Total de Usos (0 = ilimitado)
                  </label>
                  <input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Usos por Usuário
                  </label>
                  <input
                    type="number"
                    value={formData.max_uses_per_user}
                    onChange={(e) => setFormData({ ...formData, max_uses_per_user: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-gray-300">Cupom ativo</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-gray-300">Cupom público (visível para todos)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.first_purchase_only}
                    onChange={(e) => setFormData({ ...formData, first_purchase_only: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-gray-300">Apenas primeira compra</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_single_use}
                    onChange={(e) => setFormData({ ...formData, is_single_use: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-gray-300">Uso único (descartável após o uso)</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                {editingCoupon ? 'Salvar Alterações' : 'Criar Cupom'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
