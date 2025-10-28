import React, { useState, useEffect } from 'react';
import { Mail, Send, Settings, FileText, Clock, CheckCircle, XCircle, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { getEmailSettings, updateEmailSettings, getEmailTemplates, getEmailLogs, getEmailStats, sendTestEmail, type EmailSettings as EmailSettingsDB, type EmailTemplate as EmailTemplateDB, type EmailLog as EmailLogDB } from '@/lib/admin/emailAdminApi';

interface EmailSettings {
  id?: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: 'tls' | 'ssl' | 'none';
  from_email: string;
  from_name: string;
  reply_to_email?: string;
  is_active: boolean;
  daily_limit: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  body_html: string;
  body_text?: string;
  variables: string[];
  category: string;
  is_active: boolean;
  created_at: string;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending' | 'bounced';
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

const AdminSettingsEmail: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'templates' | 'logs'>('settings');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    from_email: '',
    from_name: 'Cânticos CCB',
    reply_to_email: '',
    is_active: false,
    daily_limit: 1000
  });

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);

  const [stats, setStats] = useState({
    totalSent: 0,
    totalFailed: 0,
    totalPending: 0,
    activeTemplates: 0
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Buscar settings reais
      const settings = await getEmailSettings();
      if (settings) {
        setEmailSettings({
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_username: settings.smtp_username,
          smtp_password: settings.smtp_password || '',
          smtp_encryption: settings.smtp_encryption,
          from_email: settings.from_email,
          from_name: settings.from_name,
          reply_to_email: settings.reply_to_email || '',
          is_active: settings.is_active,
          daily_limit: settings.daily_limit
        });
      }

      // Templates e logs reais
      const [tpls, logsList, statsDb] = await Promise.all([
        getEmailTemplates(),
        getEmailLogs(100),
        getEmailStats()
      ]);
      setTemplates(tpls as EmailTemplate[]);
      setLogs(logsList as EmailLog[]);
      setStats({
        totalSent: statsDb.totalSent,
        totalFailed: statsDb.totalFailed,
        totalPending: statsDb.totalPending,
        activeTemplates: statsDb.activeTemplates
      });

    } catch (err: any) {
      console.error('Error loading email settings:', err);
      setError(err?.message || 'Erro ao carregar configurações de email');
      setErrorMessage('Falha ao carregar dados de email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);
      
      if (!emailSettings.smtp_host || !emailSettings.smtp_port) {
        setErrorMessage('Preencha host e porta SMTP.');
        return;
      }
      if (!emailSettings.smtp_username || !emailSettings.smtp_password) {
        setErrorMessage('Usuário e senha SMTP são obrigatórios.');
        return;
      }
      if (!emailSettings.from_email || !emailSettings.from_name) {
        setErrorMessage('Remetente (email e nome) são obrigatórios.');
        return;
      }

      await updateEmailSettings({
        smtp_host: emailSettings.smtp_host,
        smtp_port: Number(emailSettings.smtp_port) || 0,
        smtp_username: emailSettings.smtp_username,
        smtp_password: emailSettings.smtp_password,
        smtp_encryption: emailSettings.smtp_encryption,
        from_email: emailSettings.from_email.trim(),
        from_name: emailSettings.from_name.trim(),
        reply_to_email: emailSettings.reply_to_email,
        is_active: emailSettings.is_active,
        daily_limit: Number(emailSettings.daily_limit) || 0
      });
      setSuccessMessage('Configurações SMTP salvas com sucesso.');
      // Recarregar para refletir dados persistidos
      await loadData();
    } catch (error) {
      console.error('Error saving email settings:', error);
      const msg = (error as any)?.message || (error as any)?.error?.message || 'Não foi possível salvar as configurações agora.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setSuccessMessage(null);
      setErrorMessage(null);
      const recipient = emailSettings.from_email || 'contato@canticosccb.com.br';
      await sendTestEmail(recipient, {
        smtp_host: emailSettings.smtp_host,
        smtp_port: emailSettings.smtp_port,
        smtp_username: emailSettings.smtp_username,
        smtp_password: emailSettings.smtp_password,
        smtp_encryption: emailSettings.smtp_encryption,
        from_email: emailSettings.from_email,
        from_name: emailSettings.from_name,
        reply_to_email: emailSettings.reply_to_email,
        is_active: emailSettings.is_active,
        daily_limit: emailSettings.daily_limit
      } as EmailSettingsDB);
      setSuccessMessage('Email de teste solicitado. Verifique os logs.');
      await loadData();
    } catch (error) {
      console.error('Error sending test email:', error);
      setErrorMessage('Falha ao enviar email de teste.');
    }
  };

  const handleTemplateAction = async (templateId: string, action: 'edit' | 'delete' | 'toggle') => {
    try {
      switch (action) {
        case 'edit':
          break;
        case 'delete':
          if (confirm('Deletar este template?')) {
            loadData();
          }
          break;
        case 'toggle':
          loadData();
          break;
      }
    } catch (error) {
      console.error('Error in template action:', error);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'bounced': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <Mail className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando configurações de email...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar configurações de email</h2>
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
          <h1 className="text-3xl font-bold text-white mb-2">Configurações de Email</h1>
          <p className="text-gray-400">Gerencie SMTP, templates e logs de envio</p>
        </div>
        {activeTab === 'templates' && (
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
            Novo Template
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-green-900/20 border border-green-900/30 text-green-300 rounded-lg p-3">{successMessage}</div>
      )}
      {errorMessage && (
        <div className="bg-red-900/20 border border-red-900/30 text-red-300 rounded-lg p-3">{errorMessage}</div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Emails Enviados</p>
              <p className="text-white text-2xl font-bold">{stats.totalSent}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/20 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Falhas</p>
              <p className="text-white text-2xl font-bold">{stats.totalFailed}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pendentes</p>
              <p className="text-white text-2xl font-bold">{stats.totalPending}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Templates Ativos</p>
              <p className="text-white text-2xl font-bold">{stats.activeTemplates}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="flex border-b border-gray-800">
          {[
            { id: 'settings', label: 'Configurações SMTP', icon: Settings },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'logs', label: 'Logs de Envio', icon: Mail }
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
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold text-lg">Configurações SMTP</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleTestEmail}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Testar Email
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Host SMTP *
                  </label>
                  <input
                    type="text"
                    value={emailSettings.smtp_host}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Porta SMTP *
                  </label>
                  <input
                    type="number"
                    value={emailSettings.smtp_port}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_port: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Usuário SMTP *
                  </label>
                  <input
                    type="text"
                    value={emailSettings.smtp_username}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_username: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="usuario@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Senha SMTP *
                  </label>
                  <input
                    type="password"
                    value={emailSettings.smtp_password}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_password: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Criptografia
                  </label>
                  <select
                    value={emailSettings.smtp_encryption}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_encryption: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">Nenhuma</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Limite Diário
                  </label>
                  <input
                    type="number"
                    value={emailSettings.daily_limit}
                    onChange={(e) => setEmailSettings({ ...emailSettings, daily_limit: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Remetente *
                  </label>
                  <input
                    type="email"
                    value={emailSettings.from_email}
                    onChange={(e) => setEmailSettings({ ...emailSettings, from_email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="noreply@canticosccb.com.br"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome Remetente *
                  </label>
                  <input
                    type="text"
                    value={emailSettings.from_name}
                    onChange={(e) => setEmailSettings({ ...emailSettings, from_name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="Cânticos CCB"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email para Resposta
                  </label>
                  <input
                    type="email"
                    value={emailSettings.reply_to_email}
                    onChange={(e) => setEmailSettings({ ...emailSettings, reply_to_email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="contato@canticosccb.com.br"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Servidor SMTP Ativo</h4>
                  <p className="text-gray-400 text-sm">Habilitar envio de emails pelo sistema</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailSettings.is_active}
                    onChange={async (e) => {
                      const next = e.target.checked;
                      // Otimista
                      setEmailSettings((prev) => ({ ...prev, is_active: next }));
                      setSuccessMessage(null);
                      setErrorMessage(null);
                      try {
                        await updateEmailSettings({ is_active: next });
                        setSuccessMessage(next ? 'Servidor SMTP ativado.' : 'Servidor SMTP desativado.');
                      } catch (err) {
                        // Reverter
                        setEmailSettings((prev) => ({ ...prev, is_active: !next }));
                        const msg = (err as any)?.message || (err as any)?.error?.message || 'Falha ao alterar status do servidor SMTP.';
                        setErrorMessage(msg);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg">Templates de Email</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-white font-semibold text-lg">{template.name}</h4>
                        <p className="text-gray-400 text-sm">Slug: {template.slug}</p>
                        <p className="text-gray-300 mt-2">Assunto: {template.subject}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTemplateAction(template.id, 'edit')}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleTemplateAction(template.id, 'delete')}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="text-white font-medium text-sm mb-2">Variáveis Disponíveis:</h5>
                      <div className="flex flex-wrap gap-2">
                        {template.variables.map((variable, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs font-mono">
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <span className="text-gray-400 text-sm">Categoria: {template.category}</span>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        template.is_active 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {template.is_active ? 'Ativo' : 'Inativo'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg">Logs de Envio</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Destinatário</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Assunto</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Data/Hora</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(log.status)}`}>
                              {log.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            {log.recipient_name && (
                              <p className="text-white font-medium">{log.recipient_name}</p>
                            )}
                            <p className="text-gray-400 text-sm">{log.recipient_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white">{log.subject}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-300 text-sm">{formatDate(log.sent_at || log.created_at)}</span>
                        </td>
                        <td className="py-3 px-4">
                          {log.error_message ? (
                            <p className="text-red-400 text-sm">{log.error_message}</p>
                          ) : (
                            <p className="text-gray-400 text-sm">-</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsEmail;
