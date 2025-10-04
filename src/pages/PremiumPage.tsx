import React, { useState } from 'react';
import { Check, X, Crown, Zap, Music, Download, Users, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PremiumPage: React.FC = () => {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: { monthly: 0, yearly: 0 },
      icon: Music,
      color: 'gray',
      features: [
        { text: 'Anúncios entre músicas', included: true },
        { text: 'Qualidade padrão (160kbps)', included: true },
        { text: 'Pular até 6 músicas por hora', included: true },
        { text: 'Download offline', included: false },
        { text: 'Sem anúncios', included: false },
        { text: 'Qualidade premium', included: false }
      ],
      cta: 'Plano Atual',
      current: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: { monthly: 19.90, yearly: 199.00 },
      icon: Crown,
      color: 'primary',
      popular: true,
      features: [
        { text: 'Sem anúncios', included: true },
        { text: 'Qualidade alta (320kbps)', included: true },
        { text: 'Pular músicas ilimitado', included: true },
        { text: 'Download offline', included: true },
        { text: 'Letra sincronizada', included: true },
        { text: 'Modo offline completo', included: true }
      ],
      cta: 'Assinar Premium',
      savings: 'Economize 17%'
    },
    {
      id: 'family',
      name: 'Família',
      price: { monthly: 29.90, yearly: 299.00 },
      icon: Users,
      color: 'purple',
      features: [
        { text: 'Todos os benefícios Premium', included: true },
        { text: 'Até 6 contas', included: true },
        { text: 'Mix familiar', included: true },
        { text: 'Controle parental', included: true },
        { text: 'Endereço residencial único', included: true },
        { text: 'Gerenciamento de membros', included: true }
      ],
      cta: 'Assinar Família',
      savings: 'Economize 17%'
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Sem interrupções',
      description: 'Ouça suas músicas favoritas sem anúncios'
    },
    {
      icon: Download,
      title: 'Modo offline',
      description: 'Baixe e ouça onde estiver, sem internet'
    },
    {
      icon: Headphones,
      title: 'Qualidade premium',
      description: 'Áudio de alta qualidade até 320kbps'
    },
    {
      icon: Music,
      title: 'Pular ilimitado',
      description: 'Pule quantas músicas quiser'
    }
  ];

  const handleSubscribe = (planId: string) => {
    if (planId === 'free') return;
    // TODO: Implement subscription flow
    navigate('/checkout', { state: { planId, billingPeriod } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-primary via-primary-900/10 to-background-primary pb-32">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-purple-600/20" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mb-6">
            <Crown className="w-10 h-10 text-black" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6">
            Liberte sua música
          </h1>
          <p className="text-xl md:text-2xl text-text-muted max-w-3xl mx-auto mb-8">
            Desfrute de áudio de alta qualidade, downloads ilimitados e muito mais com o Premium
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-background-secondary rounded-full p-1.5 border border-gray-700">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2.5 rounded-full font-semibold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-primary-500 text-black'
                  : 'text-white hover:text-primary-500'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2.5 rounded-full font-semibold transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-primary-500 text-black'
                  : 'text-white hover:text-primary-500'
              }`}
            >
              Anual
              <span className="absolute -top-2 -right-2 bg-green-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                -17%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingPeriod === 'monthly' ? plan.price.monthly : plan.price.yearly;
            const period = billingPeriod === 'monthly' ? '/mês' : '/ano';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 border-2 transition-all hover:scale-105 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-primary-900/30 to-background-secondary border-primary-500 shadow-xl shadow-primary-500/20'
                    : 'bg-background-secondary border-gray-700 hover:border-gray-600'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                      Mais Popular
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    plan.color === 'primary' ? 'bg-primary-500' :
                    plan.color === 'purple' ? 'bg-purple-500' :
                    'bg-gray-600'
                  }`}>
                    <Icon className="w-8 h-8 text-black" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  
                  <div className="mb-2">
                    <span className="text-4xl font-black text-white">
                      R$ {price.toFixed(2)}
                    </span>
                    {price > 0 && (
                      <span className="text-text-muted text-lg">{period}</span>
                    )}
                  </div>
                  
                  {billingPeriod === 'yearly' && plan.savings && (
                    <p className="text-green-500 text-sm font-semibold">{plan.savings}</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-white' : 'text-text-muted line-through'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={plan.current}
                  className={`w-full py-3.5 rounded-full font-bold transition-all ${
                    plan.current
                      ? 'bg-gray-700 text-text-muted cursor-not-allowed'
                      : plan.popular
                      ? 'bg-primary-500 text-black hover:bg-primary-400 transform hover:scale-105'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-6 mt-24">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Por que escolher Premium?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mb-4">
                  <Icon className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-text-muted text-sm">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-6 mt-24">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Perguntas Frequentes
        </h2>
        
        <div className="space-y-4">
          {[
            {
              q: 'Posso cancelar a qualquer momento?',
              a: 'Sim! Você pode cancelar sua assinatura a qualquer momento sem taxas de cancelamento.'
            },
            {
              q: 'Qual a diferença entre os planos?',
              a: 'O plano Premium é individual, enquanto o Família permite até 6 contas com recursos adicionais.'
            },
            {
              q: 'Posso experimentar antes de assinar?',
              a: 'Sim! Oferecemos 7 dias de teste grátis para novos usuários Premium.'
            },
            {
              q: 'Como funciona o pagamento anual?',
              a: 'Você paga o valor total do ano de uma vez e economiza 17% comparado ao plano mensal.'
            }
          ].map((faq, index) => (
            <details key={index} className="bg-background-secondary rounded-xl border border-gray-700 overflow-hidden group">
              <summary className="p-6 cursor-pointer hover:bg-background-hover transition-colors">
                <span className="font-semibold text-white">{faq.q}</span>
              </summary>
              <div className="px-6 pb-6 text-text-muted">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-6 mt-24 text-center">
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-12">
          <h2 className="text-4xl font-black text-white mb-4">
            Pronto para melhorar sua experiência?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Junte-se a milhões de usuários que já ouvem sem limites
          </p>
          <button
            onClick={() => handleSubscribe('premium')}
            className="px-8 py-4 bg-black text-white font-bold rounded-full hover:bg-gray-900 transition-all transform hover:scale-105"
          >
            Começar Teste Grátis
          </button>
          <p className="text-white/70 text-sm mt-4">
            7 dias grátis • Cancele quando quiser
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
