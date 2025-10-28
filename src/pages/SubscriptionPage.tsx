import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  X,
  CreditCard,
  Shield,
  Music,
  Download,
  Volume2,
  Zap,
  Star
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getPremiumPlans, PremiumPlan, getPremiumVisibility } from '@/lib/admin/premiumAdminApi';

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [premiumEnabled, setPremiumEnabled] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [enabled, data] = await Promise.all([
          getPremiumVisibility(),
          getPremiumPlans(),
        ]);
        setPremiumEnabled(enabled);
        setPlans(data);
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar planos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentPlan = user?.isPremium ? 'premium' : 'free';

  const handleSubscribe = (planType: string) => {
    // Simular processo de assinatura
    console.log(`Subscribing to ${planType} plan`);
    // Aqui seria integrado com o sistema de pagamento
  };

  const handleCancelSubscription = () => {
    // Simular cancelamento
    console.log('Canceling subscription');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const freePlan = {
    name: 'Gratuito',
    features: [
      'Acesso limitado aos hinos',
      'Anúncios entre as hinos',
      'Qualidade padrão (128 kbps)',
      'Sem downloads offline',
      'Pular limitado'
    ],
    limitations: [
      'Máximo 6 pulos por hora',
      'Não pode escolher hinos específicas',
      'Qualidade de áudio limitada'
    ]
  };

  const visiblePlans = plans.filter(p => p.is_active && p.interval === billingCycle);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-background-secondary rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Plano e Assinatura</h1>
          <p className="text-text-muted">Gerencie sua assinatura e escolha o melhor plano</p>
        </div>
      </div>

      {/* Current Plan Status */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              {currentPlan === 'premium' ? (
                <Crown className="w-6 h-6" />
              ) : (
                <Music className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                Plano {currentPlan === 'premium' ? 'Premium' : 'Gratuito'}
              </h2>
              <p className="text-white/80">
                {currentPlan === 'premium' 
                  ? 'Próxima cobrança em 15 de Nov, 2024'
                  : 'Faça upgrade para ter acesso completo'
                }
              </p>
            </div>
          </div>
          {currentPlan === 'premium' && (
            <button
              onClick={handleCancelSubscription}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Cancelar Assinatura
            </button>
          )}
        </div>
      </div>

      {/* Billing Cycle Toggle (somente quando premium estiver habilitado) */}
      {premiumEnabled && (
        <div className="flex justify-center mb-8">
          <div className="bg-background-secondary rounded-lg p-1 flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-primary-500 text-black font-semibold'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md transition-colors relative ${
                billingCycle === 'yearly'
                  ? 'bg-primary-500 text-black font-semibold'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              Anual
              <span className="absolute -top-2 -right-2 bg-green-500 text-xs px-2 py-1 rounded-full text-white">
                -17%
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className={`grid grid-cols-1 ${premiumEnabled ? 'md:grid-cols-3' : ''} gap-6 mb-8`}>
        {/* Free plan - always visible */}
        <div className={`relative bg-background-secondary rounded-xl p-6 border-2 transition-all ${
            selectedPlan === 'free' ? 'border-primary-500 scale-105' : 'border-transparent hover:border-gray-700'
          }`}>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">{freePlan.name}</h3>
            <div className="text-3xl font-bold text-white">Grátis</div>
          </div>
          <ul className="space-y-3 mb-6">
            {freePlan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-white">{feature}</span>
              </li>
            ))}
            {freePlan.limitations.map((limitation, index) => (
              <li key={index} className="flex items-center gap-3">
                <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-text-muted">{limitation}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setSelectedPlan('free')}
            disabled={currentPlan === 'free'}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              currentPlan === 'free'
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-background-tertiary text-white hover:bg-gray-600'
            }`}
          >
            {currentPlan === 'free' ? 'Plano Atual' : 'Downgrade'}
          </button>
        </div>

        {/* Active premium plans from admin (somente quando premium estiver habilitado) */}
        {premiumEnabled && visiblePlans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-background-secondary rounded-xl p-6 border-2 transition-all ${
              selectedPlan === plan.id ? 'border-primary-500 scale-105' : 'border-transparent hover:border-gray-700'
            } ${plan.is_popular ? 'ring-2 ring-primary-500' : ''}`}
          >
            {plan.is_popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-black px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Mais Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-white">
                {formatPrice(plan.price)}
                <span className="text-sm text-text-muted font-normal">/{plan.interval === 'monthly' ? 'mês' : 'ano'}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-white">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                setSelectedPlan(plan.id);
                handleSubscribe(plan.id);
              }}
              disabled={currentPlan !== 'free'}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                currentPlan !== 'free'
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-500 text-black hover:bg-primary-400'
              }`}
            >
              {currentPlan !== 'free' ? 'Plano Atual' : 'Escolher Plano'}
            </button>
          </div>
        ))}
      </div>

      {/* Payment History */}
      {currentPlan === 'premium' && (
        <div className="bg-background-secondary rounded-xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Histórico de Pagamentos</h3>
          <div className="space-y-3">
            {[
              { date: '15 Out 2024', amount: 16.90, status: 'Pago', method: 'Cartão ****1234' },
              { date: '15 Set 2024', amount: 16.90, status: 'Pago', method: 'Cartão ****1234' },
              { date: '15 Ago 2024', amount: 16.90, status: 'Pago', method: 'Cartão ****1234' }
            ].map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg">
                <div className="flex items-center gap-4">
                  <CreditCard className="w-5 h-5 text-text-muted" />
                  <div>
                    <p className="text-white font-medium">{formatPrice(payment.amount)}</p>
                    <p className="text-sm text-text-muted">{payment.date} • {payment.method}</p>
                  </div>
                </div>
                <span className="text-green-500 text-sm font-medium">{payment.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benefits Comparison (somente quando premium estiver habilitado) */}
      {premiumEnabled && (
        <div className="bg-background-secondary rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Compare os Benefícios</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 text-white">Recursos</th>
                  <th className="text-center py-3 text-white">Gratuito</th>
                  <th className="text-center py-3 text-white">Premium</th>
                  <th className="text-center py-3 text-white">Família</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {[
                  { feature: 'Acesso aos hinos', free: 'Limitado', premium: 'Ilimitado', family: 'Ilimitado' },
                  { feature: 'Qualidade de áudio', free: '128 kbps', premium: '320 kbps', family: '320 kbps' },
                  { feature: 'Downloads offline', free: '✗', premium: '✓', family: '✓' },
                  { feature: 'Sem anúncios', free: '✗', premium: '✓', family: '✓' },
                  { feature: 'Pulos ilimitados', free: '✗', premium: '✓', family: '✓' },
                  { feature: 'Contas familiares', free: '✗', premium: '✗', family: '6 contas' }
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-3 text-white">{row.feature}</td>
                    <td className="py-3 text-center text-text-muted">{row.free}</td>
                    <td className="py-3 text-center text-primary-400">{row.premium}</td>
                    <td className="py-3 text-center text-primary-400">{row.family}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
