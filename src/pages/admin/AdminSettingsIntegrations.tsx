import React, { useState, useEffect } from 'react';
import { Plug, Zap, CheckCircle, XCircle, Settings, Plus, Trash2, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  slug: string;
  provider: string;
  category: 'analytics' | 'payment' | 'social' | 'email' | 'storage' | 'other';
  api_key?: string;
  api_secret?: string;
  is_active: boolean;
  is_configured: boolean;
  last_sync_at?: string;
  description?: string;
  icon_url?: string;
  documentation_url?: string;
}

interface Webhook {
  id: string;
  integration_id: string;
  name: string;
  url: string;
  method: string;
  events: string[];
  is_active: boolean;
  success_count: number;
  failure_count: number;
  last_triggered_at?: string;
}

const AdminSettingsIntegrations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'integrations' | 'webhooks' | 'logs'>('integrations');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configForm, setConfigForm] = useState({
    api_key: '',
    api_secret: '',
    access_token: ''
  });

  const [stats, setStats] = useState({
    totalIntegrations: 0,
    activeIntegrations: 0,
    configuredIntegrations: 0,
    totalWebhooks: 0
  });

  const categories = [
    { value: 'all', label: 'Todas', color: 'gray' },
    { value: 'analytics', label: 'Analytics', color: 'blue' },
    { value: 'payment', label: 'Pagamentos', color: 'green' },
    { value: 'social', label: 'Social', color: 'purple' },
    { value: 'email', label: 'Email', color: 'yellow' },
    { value: 'storage', label: 'Armazenamento', color: 'pink' },
    { value: 'other', label: 'Outros', color: 'gray' }
  ];

  useEffect(() => {
    loadData();
  }, [activeTab, selectedCategory]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock data
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          name: 'Google Analytics',
          slug: 'google-analytics',
          provider: 'google',
          category: 'analytics',
          description: 'Monitoramento de tráfego e comportamento dos usuários',
          is_active: true,
          is_configured: true,
          api_key: 'UA-XXXXX-Y',
          last_sync_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          documentation_url: 'https://analytics.google.com'
        },
        {
          id: '2',
          name: 'Stripe',
          slug: 'stripe',
          provider: 'stripe',
          category: 'payment',
          description: 'Gateway de pagamento internacional',
          is_active: true,
          is_configured: true,
          last_sync_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Google Search Console',
          slug: 'google-search-console',
          provider: 'google',
          category: 'analytics',
          description: 'Monitoramento de desempenho nas buscas do Google',
          is_active: false,
          is_configured: false,
          documentation_url: 'https://search.google.com/search-console'
        },
        {
          id: '4',
          name: 'Facebook Pixel',
          slug: 'facebook-pixel',
          provider: 'facebook',
          category: 'analytics',
          description: 'Rastreamento de conversões do Facebook',
          is_active: false,
          is_configured: false
        },
        {
          id: '5',
          name: 'SendGrid',
          slug: 'sendgrid',
          provider: 'sendgrid',
          category: 'email',
          description: 'Serviço de envio de emails transacionais',
          is_active: true,
          is_configured: true
        },
        {
          id: '6',
          name: 'AWS S3',
          slug: 'aws-s3',
          provider: 'aws',
          category: 'storage',
          description: 'Armazenamento de arquivos na nuvem',
          is_active: false,
          is_configured: false
        },
        {
          id: '7',
          name: 'PayPal',
          slug: 'paypal',
          provider: 'paypal',
          category: 'payment',
          description: 'Processamento de pagamentos via PayPal',
          is_active: false,
          is_configured: false
        }
      ];

      const mockWebhooks: Webhook[] = [
        {
          id: '1',
          integration_id: '2',
          name: 'Stripe - Pagamento Completado',
          url: 'https://api.canticosccb.com.br/webhooks/stripe',
          method: 'POST',
          events: ['payment.succeeded', 'payment.failed'],
          is_active: true,
          success_count: 234,
          failure_count: 5,
          last_triggered_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          integration_id: '4',
          name: 'SendGrid - Email Status',
          url: 'https://api.canticosccb.com.br/webhooks/sendgrid',
          method: 'POST',
          events: ['email.delivered', 'email.bounced'],
          is_active: true,
          success_count: 1847,
          failure_count: 12
        }
      ];

      // Filtrar por categoria
      let filteredIntegrations = mockIntegrations;
      if (selectedCategory !== 'all') {
        filteredIntegrations = mockIntegrations.filter(i => i.category === selectedCategory);
      }

      setIntegrations(filteredIntegrations);
      setWebhooks(mockWebhooks);
      
      setStats({
        totalIntegrations: mockIntegrations.length,
        activeIntegrations: mockIntegrations.filter(i => i.is_active).length,
        configuredIntegrations: mockIntegrations.filter(i => i.is_configured).length,
        totalWebhooks: mockWebhooks.length
      });

    } catch (err: any) {
      console.error('Error loading integrations data:', err);
      setError(err?.message || 'Erro ao carregar integrações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleIntegration = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      loadData();
    } catch (error) {
      console.error('Error toggling integration:', error);
    }
  };

  const handleConfigureIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigForm({
      api_key: integration.api_key || '',
      api_secret: integration.api_secret || '',
      access_token: ''
    });
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    try {
      if (!selectedIntegration) return;

      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualizar integração
      const updatedIntegrations = integrations.map(int => 
        int.id === selectedIntegration.id
          ? {
              ...int,
              api_key: configForm.api_key,
              api_secret: configForm.api_secret,
              is_configured: true
            }
          : int
      );
      
      setIntegrations(updatedIntegrations);
      setShowConfigModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving integration config:', error);
    }
  };

  const handleTestIntegration = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error('Error testing integration:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.color || 'gray';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando integrações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar integrações</h2>
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
          <h1 className="text-3xl font-bold text-white mb-2">Integrações</h1>
          <p className="text-gray-400">Gerencie conexões com serviços externos</p>
        </div>
        <button
          onClick={() => loadData()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Atualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Plug className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Integrações</p>
              <p className="text-white text-2xl font-bold">{stats.totalIntegrations}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Ativas</p>
              <p className="text-white text-2xl font-bold">{stats.activeIntegrations}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Settings className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Configuradas</p>
              <p className="text-white text-2xl font-bold">{stats.configuredIntegrations}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Webhooks</p>
              <p className="text-white text-2xl font-bold">{stats.totalWebhooks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category.value
                ? `bg-${category.color}-500/20 text-${category.color}-400 border border-${category.color}-500/30`
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="flex border-b border-gray-800">
          {[
            { id: 'integrations', label: 'Integrações', icon: Plug },
            { id: 'webhooks', label: 'Webhooks', icon: Zap }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-400 border-b-2 border-primary-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {integrations.map((integration) => (
                  <div key={integration.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          <Plug className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold text-lg">{integration.name}</h4>
                          <p className="text-gray-400 text-sm">{integration.provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {integration.is_configured ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                            Configurado
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full border border-gray-500/30">
                            Não Configurado
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4">{integration.description}</p>

                    <div className="mb-4">
                      <span className={`px-2 py-1 bg-${getCategoryColor(integration.category)}-500/20 text-${getCategoryColor(integration.category)}-400 text-xs rounded-full border border-${getCategoryColor(integration.category)}-500/30`}>
                        {categories.find(c => c.value === integration.category)?.label}
                      </span>
                    </div>

                    {integration.last_sync_at && (
                      <p className="text-gray-400 text-xs mb-4">
                        Última sincronização: {formatDate(integration.last_sync_at)}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={integration.is_active}
                            onChange={() => handleToggleIntegration(integration.id)}
                            className="sr-only peer"
                            disabled={!integration.is_configured}
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
                        </label>
                        <span className="text-gray-300 text-sm">
                          {integration.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfigureIntegration(integration)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Configurar"
                        >
                          <Settings className="w-4 h-4 text-gray-400" />
                        </button>
                        {integration.is_configured && (
                          <button
                            onClick={() => handleTestIntegration(integration.id)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Testar conexão"
                          >
                            <Zap className="w-4 h-4 text-yellow-400" />
                          </button>
                        )}
                        {integration.documentation_url && (
                          <a
                            href={integration.documentation_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Documentação"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {integrations.length === 0 && (
                <div className="text-center py-12">
                  <Plug className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhuma integração encontrada</p>
                  <p className="text-gray-500 text-sm">Tente selecionar outra categoria</p>
                </div>
              )}
            </div>
          )}

          {/* Webhooks Tab */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Webhooks Configurados</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                  <Plus className="w-5 h-5" />
                  Novo Webhook
                </button>
              </div>

              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-white font-semibold">{webhook.name}</h4>
                        <code className="text-gray-400 text-sm">{webhook.url}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${
                          webhook.is_active
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}>
                          {webhook.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="text-gray-300 text-sm mb-2">Eventos:</h5>
                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map((event, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30">
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Sucessos: </span>
                          <span className="text-green-400 font-medium">{webhook.success_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Falhas: </span>
                          <span className="text-red-400 font-medium">{webhook.failure_count}</span>
                        </div>
                        {webhook.last_triggered_at && (
                          <div>
                            <span className="text-gray-400">Último disparo: </span>
                            <span className="text-gray-300">{formatDate(webhook.last_triggered_at)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                          <Settings className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {webhooks.length === 0 && (
                <div className="text-center py-12">
                  <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum webhook configurado</p>
                  <p className="text-gray-500 text-sm">Crie webhooks para receber eventos das integrações</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Configuração */}
      {showConfigModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Configurar {selectedIntegration.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{selectedIntegration.description}</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key *
                </label>
                <input
                  type="text"
                  value={configForm.api_key}
                  onChange={(e) => setConfigForm({ ...configForm, api_key: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder="Digite sua API Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Secret
                </label>
                <input
                  type="password"
                  value={configForm.api_secret}
                  onChange={(e) => setConfigForm({ ...configForm, api_secret: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder="Digite seu API Secret"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Access Token
                </label>
                <input
                  type="password"
                  value={configForm.access_token}
                  onChange={(e) => setConfigForm({ ...configForm, access_token: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  placeholder="Digite seu Access Token"
                />
              </div>

              {selectedIntegration.documentation_url && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-400 text-sm">
                    📚 Precisa de ajuda? Consulte a{' '}
                    <a
                      href={selectedIntegration.documentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-300"
                    >
                      documentação oficial
                    </a>
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={!configForm.api_key}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar Configuração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsIntegrations;
