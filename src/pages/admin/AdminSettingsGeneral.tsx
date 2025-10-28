import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Globe, Mail, Shield, Database, Server, Download, Upload, AlertTriangle, Bell } from 'lucide-react';
import { sendTestPush, sendCampaign } from '@/lib/admin/pushSettingsApi';
import SuccessModal from '@/components/SuccessModal';
import {
  getGeneralSettings,
  updateGeneralSettings,
  resetToDefaultSettings,
  validateSettings,
  exportSettings,
  importSettings,
  GeneralSettings
} from '@/lib/admin/generalSettingsApi';

const AdminSettingsGeneral: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  // Estados da aba Push
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushUrl, setPushUrl] = useState('');
  const [pushTopic, setPushTopic] = useState('canticosccb-compositores');
  const [segNewFollowers, setSegNewFollowers] = useState(true);
  const [segMilestones, setSegMilestones] = useState(true);
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [targetType, setTargetType] = useState<'all' | 'users' | 'user' | 'composers' | 'composer'>('composers');
  const [targetId, setTargetId] = useState<string>('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    details?: string;
  }>({ title: '', message: '', type: 'success' });

  const [settings, setSettings] = useState<GeneralSettings>({
    site_name: 'Cânticos CCB',
    site_description: 'Plataforma completa de hinos e cânticos da Congregação Cristã no Brasil',
    site_url: 'https://canticosccb.com.br',
    admin_email: 'admin@canticosccb.com.br',
    support_email: 'suporte@canticosccb.com.br',
    maintenance_mode: false,
    registration_enabled: true,
    email_verification_required: true,
    max_upload_size: 10,
    session_timeout: 1440,
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    currency: 'BRL',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    items_per_page: 20,
    backup_enabled: true,
    backup_frequency: 'daily',
    analytics_enabled: true,
    google_analytics_id: '',
    facebook_pixel_id: ''
  });

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'system', label: 'Sistema', icon: Server },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'integrations', label: 'Integrações', icon: Globe },
    { id: 'push', label: 'Notificações Push', icon: Bell },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const settingsData = await getGeneralSettings();
      setSettings(settingsData);
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setError(err?.message || 'Erro ao carregar configura\u00e7\u00f5es');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validar configurações
      const errors = validateSettings(settings);
      if (errors.length > 0) {
        return;
      }

      const updatedSettings = await updateGeneralSettings(settings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Resetar todas as configurações para os valores padrão?')) {
      return;
    }

    try {
      setIsSaving(true);
      const defaultSettings = await resetToDefaultSettings();
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Error resetting settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const jsonData = await exportSettings();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `configuracoes_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting settings:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedSettings = await importSettings(text);
      setSettings(importedSettings);
    } catch (error) {
      console.error('Error importing settings:', error);
    }
    
    // Reset input
    event.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando configura\u00e7\u00f5es...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar configura\u00e7\u00f5es</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => loadSettings()}
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
          <h1 className="text-3xl font-bold text-white mb-2">Configurações Gerais</h1>
          <p className="text-gray-400">Gerencie as configurações básicas do sistema</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            Importar
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-5 h-5" />
            Resetar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Salvar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="flex border-b border-gray-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

        {/* Content */}
        <div className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg mb-4">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome do Site *
                  </label>
                  <input
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL do Site *
                  </label>
                  <input
                    type="url"
                    value={settings.site_url}
                    onChange={(e) => setSettings({ ...settings, site_url: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição do Site
                </label>
                <textarea
                  value={settings.site_description}
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600 h-24"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email do Administrador *
                  </label>
                  <input
                    type="email"
                    value={settings.admin_email}
                    onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email de Suporte
                  </label>
                  <input
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fuso Horário
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                    <option value="America/New_York">New York (GMT-5)</option>
                    <option value="Europe/London">London (GMT+0)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Idioma
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Moeda
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    <option value="BRL">Real (R$)</option>
                    <option value="USD">Dólar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Push Notifications Tab */}
          {activeTab === 'push' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg mb-4">Notificações Push</h3>

              {/* Configuração do Provedor */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
                <h4 className="text-white font-medium">Configuração do Provedor</h4>
                <p className="text-gray-400 text-sm">Defina as credenciais do serviço (ex.: Firebase Cloud Messaging, OneSignal).</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Server Key / API Key</label>
                    <input disabled placeholder="Defina via ENV (FCM_SERVER_KEY)" type="password" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600 opacity-60" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sender ID / App ID</label>
                    <input disabled placeholder="Defina via ENV (FCM_SENDER_ID)" type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600 opacity-60" />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tópico/Canal Padrão</label>
                    <input type="text" value={pushTopic} onChange={(e) => setPushTopic(e.target.value)} placeholder="canticosccb-compositores" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Ambiente</label>
                    <select disabled className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600 opacity-60">
                      <option>Produção</option>
                      <option>Sandbox</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button disabled className="px-5 py-2 bg-gray-700 text-white rounded-lg opacity-60 cursor-not-allowed">Salvar Credenciais (ENV)</button>
                  <button
                    onClick={async () => {
                      try {
                        setIsSendingPush(true);
                        await sendTestPush({ title: pushTitle || 'Teste', message: pushMessage || 'Mensagem de teste', url: pushUrl || undefined, topic: pushTopic || undefined });
                        alert('Notificação de teste enviada.');
                      } catch (e: any) {
                        alert('Falha ao enviar notificação de teste: ' + (e?.message || 'Erro'));
                      } finally {
                        setIsSendingPush(false);
                      }
                    }}
                    className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50"
                    disabled={isSendingPush}
                  >
                    {isSendingPush ? 'Enviando...' : 'Enviar Notificação de Teste'}
                  </button>
                </div>
              </div>

              {/* Segmentação e Envio */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <p className="text-sm text-blue-300">
                    Notificações enviadas via sistema in-app (mesma tabela de convites de gestor)
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Público-alvo</label>
                    <select
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value as any)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    >
                      <option value="all">Todos os membros</option>
                      <option value="users">Apenas usuários</option>
                      <option value="user">Usuário específico (ID)</option>
                      <option value="composers">Apenas compositores</option>
                      <option value="composer">Compositor específico (ID)</option>
                    </select>
                  </div>
                  {(targetType === 'user' || targetType === 'composer') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">ID do destino</label>
                      <input
                        type="number"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        placeholder={targetType === 'user' ? 'ID do usuário' : 'ID do compositor'}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                        min={1}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Título</label>
                    <input type="text" value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} placeholder="Atualização importante" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">URL (opcional)</label>
                    <input type="text" value={pushUrl} onChange={(e) => setPushUrl(e.target.value)} placeholder="https://canticosccb.com.br/..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mensagem</label>
                  <textarea rows={3} value={pushMessage} onChange={(e) => setPushMessage(e.target.value)} placeholder="Digite a mensagem da campanha" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600 resize-none" />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const audience = `${targetType}${(targetType === 'user' || targetType === 'composer') && targetId ? ` (${targetId})` : ''}`;
                      alert(`Prévia da Notificação In-App:\n\nTítulo: ${pushTitle || '(vazio)'}\nMensagem: ${pushMessage || '(vazia)'}\nLink: ${pushUrl || '(nenhum)'}\nPúblico: ${audience}\n\nSerá criada uma notificação na tabela "notificacoes" para cada usuário do público selecionado.`);
                    }}
                    className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Pré-visualizar
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        setIsSendingPush(true);
                        const result = await sendCampaign({
                          title: pushTitle,
                          message: pushMessage,
                          url: pushUrl || undefined,
                          includeNewFollowers: segNewFollowers,
                          includeMilestones: segMilestones,
                          targetType,
                          targetId: (targetType === 'user' || targetType === 'composer') ? (Number(targetId) || undefined) : undefined
                        });

                        if (result?.success) {
                          if (typeof result.sent === 'number' || typeof result.failed === 'number') {
                            const sent = Number(result.sent || 0);
                            const failed = Number(result.failed || 0);
                            if (sent > 0) {
                              setModalConfig({
                                title: 'Notificações criadas com sucesso!',
                                message: `Enviadas: ${sent}\nFalhas: ${failed}`,
                                type: 'success',
                                details: 'Os usuários verão as notificações no dashboard.'
                              });
                              setShowModal(true);
                            } else if (failed > 0) {
                              try { console.log('[Notification] Falhas:', result.errors || result); } catch {}
                              const firstError = Array.isArray(result?.errors) && result.errors.length
                                ? (typeof result.errors[0] === 'string' ? result.errors[0] : JSON.stringify(result.errors[0])).slice(0, 300)
                                : '';
                              setModalConfig({
                                title: 'Erro ao criar notificações',
                                message: `Falhas: ${failed}`,
                                type: 'error',
                                details: firstError || undefined
                              });
                              setShowModal(true);
                            } else {
                              const detail = result.detail || 'Sem usuários para o público-alvo selecionado.';
                              setModalConfig({
                                title: 'Nenhuma notificação criada',
                                message: detail,
                                type: 'info'
                              });
                              setShowModal(true);
                            }
                          } else if (result.detail) {
                            setModalConfig({
                              title: 'Informação',
                              message: result.detail,
                              type: 'info'
                            });
                            setShowModal(true);
                          } else {
                            setModalConfig({
                              title: 'Notificações criadas com sucesso!',
                              message: 'As notificações foram enviadas.',
                              type: 'success'
                            });
                            setShowModal(true);
                          }
                        } else {
                          setModalConfig({
                            title: 'Falha ao criar notificações',
                            message: result?.error || 'Erro desconhecido',
                            type: 'error'
                          });
                          setShowModal(true);
                        }
                      } catch (e: any) {
                        setModalConfig({
                          title: 'Falha ao enviar campanha',
                          message: e?.message || 'Erro',
                          type: 'error'
                        });
                        setShowModal(true);
                      } finally {
                        setIsSendingPush(false);
                      }
                    }}
                    className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
                    disabled={isSendingPush || !pushTitle || !pushMessage}
                  >
                    {isSendingPush ? 'Criando Notificações...' : 'Enviar Notificações'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg mb-4">Configurações do Sistema</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tamanho Máximo de Upload (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.max_upload_size}
                    onChange={(e) => setSettings({ ...settings, max_upload_size: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    min="1"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Timeout de Sessão (minutos)
                  </label>
                  <input
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    min="30"
                    max="10080"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Itens por Página
                  </label>
                  <select
                    value={settings.items_per_page}
                    onChange={(e) => setSettings({ ...settings, items_per_page: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Formato de Data
                  </label>
                  <select
                    value={settings.date_format}
                    onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Modo de Manutenção</h4>
                    <p className="text-gray-400 text-sm">Desabilita o acesso público ao site</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode}
                      onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Backup Automático</h4>
                    <p className="text-gray-400 text-sm">Realizar backup automático do banco de dados</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.backup_enabled}
                      onChange={(e) => setSettings({ ...settings, backup_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg mb-4">Configurações de Segurança</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Registro de Usuários</h4>
                    <p className="text-gray-400 text-sm">Permitir que novos usuários se registrem</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.registration_enabled}
                      onChange={(e) => setSettings({ ...settings, registration_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">Verificação de Email</h4>
                    <p className="text-gray-400 text-sm">Exigir verificação de email para novos usuários</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email_verification_required}
                      onChange={(e) => setSettings({ ...settings, email_verification_required: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg mb-4">Integrações e Analytics</h3>
              
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg mb-6">
                <div>
                  <h4 className="text-white font-medium">Analytics Habilitado</h4>
                  <p className="text-gray-400 text-sm">Ativar coleta de dados de analytics</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.analytics_enabled}
                    onChange={(e) => setSettings({ ...settings, analytics_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {settings.analytics_enabled && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Google Analytics ID
                    </label>
                    <input
                      type="text"
                      value={settings.google_analytics_id}
                      onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Facebook Pixel ID
                    </label>
                    <input
                      type="text"
                      value={settings.facebook_pixel_id}
                      onChange={(e) => setSettings({ ...settings, facebook_pixel_id: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                      placeholder="123456789012345"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Success/Error Modal */}
      <SuccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        details={modalConfig.details}
      />
    </div>
  );
};

export default AdminSettingsGeneral;
