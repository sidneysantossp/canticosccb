import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertTriangle, Eye, Ban, RefreshCw, CheckCircle, XCircle, Save } from 'lucide-react';

interface SecuritySettings {
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_special: boolean;
  password_expiry_days: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_minutes: number;
  require_email_verification: boolean;
  enable_two_factor: boolean;
  enable_ip_whitelist: boolean;
  enable_rate_limiting: boolean;
  max_requests_per_minute: number;
  enable_ssl_only: boolean;
  notify_new_login: boolean;
  notify_password_change: boolean;
  notify_suspicious_activity: boolean;
}

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at?: string;
  is_permanent: boolean;
  attempts_count: number;
}

interface SecurityLog {
  id: string;
  event_type: string;
  ip_address?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

const AdminSettingsSecurity: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'blocked' | 'logs'>('settings');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<SecuritySettings>({
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_special: true,
    password_expiry_days: 90,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    session_timeout_minutes: 60,
    require_email_verification: true,
    enable_two_factor: false,
    enable_ip_whitelist: false,
    enable_rate_limiting: true,
    max_requests_per_minute: 60,
    enable_ssl_only: true,
    notify_new_login: true,
    notify_password_change: true,
    notify_suspicious_activity: true
  });

  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

  const [stats, setStats] = useState({
    totalAttempts: 0,
    failedAttempts: 0,
    blockedIPs: 0,
    criticalAlerts: 0
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock data
      const mockBlockedIPs: BlockedIP[] = [
        {
          id: '1',
          ip_address: '10.0.0.50',
          reason: 'Múltiplas tentativas de login falhadas',
          blocked_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          is_permanent: false,
          attempts_count: 5
        },
        {
          id: '2',
          ip_address: '192.168.100.200',
          reason: 'Atividade suspeita detectada',
          blocked_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          is_permanent: true,
          attempts_count: 10
        }
      ];

      const mockLogs: SecurityLog[] = [
        {
          id: '1',
          event_type: 'brute_force_attempt',
          ip_address: '10.0.0.50',
          description: 'Múltiplas tentativas de login detectadas',
          severity: 'high',
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          event_type: 'ip_blocked',
          ip_address: '10.0.0.50',
          description: 'IP bloqueado por atividade suspeita',
          severity: 'critical',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          event_type: 'login_failed',
          ip_address: '192.168.1.100',
          description: 'Tentativa de login com senha incorreta',
          severity: 'medium',
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        }
      ];

      setBlockedIPs(mockBlockedIPs);
      setSecurityLogs(mockLogs);
      
      setStats({
        totalAttempts: 1247,
        failedAttempts: 83,
        blockedIPs: 2,
        criticalAlerts: 3
      });

    } catch (err: any) {
      console.error('Error loading security data:', err);
      setError(err?.message || 'Erro ao carregar dados de segurança');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving security settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnblockIP = async (ipId: string) => {
    try {
      if (!confirm('Desbloquear este IP?')) return;
      await new Promise(resolve => setTimeout(resolve, 500));
      loadData();
    } catch (error) {
      console.error('Error unblocking IP:', error);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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
          <p className="text-gray-400">Carregando configurações de segurança...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar configurações de segurança</h2>
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
          <h1 className="text-3xl font-bold text-white mb-2">Segurança do Sistema</h1>
          <p className="text-gray-400">Gerencie autenticação, bloqueios e logs</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Total de Tentativas</h3>
            <Eye className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalAttempts}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Tentativas Falhas</h3>
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.failedAttempts}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">IPs Bloqueados</h3>
            <Ban className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.blockedIPs}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm font-medium">Alertas Críticos</h3>
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.criticalAlerts}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="flex border-b border-gray-800">
          {[
            { id: 'settings', label: 'Configurações', icon: Shield },
            { id: 'blocked', label: 'IPs Bloqueados', icon: Ban },
            { id: 'logs', label: 'Logs de Segurança', icon: AlertTriangle }
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
              <h3 className="text-white font-semibold text-lg">Configurações de Segurança</h3>
              
              {/* Password Policy */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Política de Senhas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Comprimento Mínimo</label>
                    <input
                      type="number"
                      value={settings.password_min_length}
                      onChange={(e) => setSettings({...settings, password_min_length: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Expiração (dias)</label>
                    <input
                      type="number"
                      value={settings.password_expiry_days}
                      onChange={(e) => setSettings({...settings, password_expiry_days: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { key: 'password_require_uppercase', label: 'Exigir letras maiúsculas' },
                    { key: 'password_require_lowercase', label: 'Exigir letras minúsculas' },
                    { key: 'password_require_numbers', label: 'Exigir números' },
                    { key: 'password_require_special', label: 'Exigir caracteres especiais' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={settings[item.key as keyof SecuritySettings] as boolean}
                        onChange={(e) => setSettings({...settings, [item.key]: e.target.checked})}
                        className="w-4 h-4"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Login Security */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Segurança de Login</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Tentativas Máximas</label>
                    <input
                      type="number"
                      value={settings.max_login_attempts}
                      onChange={(e) => setSettings({...settings, max_login_attempts: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Duração Bloqueio (min)</label>
                    <input
                      type="number"
                      value={settings.lockout_duration_minutes}
                      onChange={(e) => setSettings({...settings, lockout_duration_minutes: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Timeout Sessão (min)</label>
                    <input
                      type="number"
                      value={settings.session_timeout_minutes}
                      onChange={(e) => setSettings({...settings, session_timeout_minutes: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Requisições/Minuto</label>
                    <input
                      type="number"
                      value={settings.max_requests_per_minute}
                      onChange={(e) => setSettings({...settings, max_requests_per_minute: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Opções Adicionais</h4>
                <div className="space-y-2">
                  {[
                    { key: 'require_email_verification', label: 'Exigir verificação de email' },
                    { key: 'enable_two_factor', label: 'Habilitar autenticação 2FA' },
                    { key: 'enable_ip_whitelist', label: 'Habilitar whitelist de IPs' },
                    { key: 'enable_rate_limiting', label: 'Habilitar limite de taxa' },
                    { key: 'enable_ssl_only', label: 'Forçar SSL apenas' },
                    { key: 'notify_new_login', label: 'Notificar novo login' },
                    { key: 'notify_password_change', label: 'Notificar mudança de senha' },
                    { key: 'notify_suspicious_activity', label: 'Notificar atividade suspeita' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={settings[item.key as keyof SecuritySettings] as boolean}
                        onChange={(e) => setSettings({...settings, [item.key]: e.target.checked})}
                        className="w-4 h-4"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          )}

          {/* Blocked IPs Tab */}
          {activeTab === 'blocked' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg">IPs Bloqueados</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">IP</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Motivo</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Tentativas</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Bloqueado em</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Tipo</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {blockedIPs.map((ip) => (
                      <tr key={ip.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <code className="text-red-400 bg-red-500/10 px-2 py-1 rounded">{ip.ip_address}</code>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-300">{ip.reason}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white font-medium">{ip.attempts_count}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-300 text-sm">{formatDate(ip.blocked_at)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                            ip.is_permanent 
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          }`}>
                            {ip.is_permanent ? 'Permanente' : 'Temporário'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleUnblockIP(ip.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Desbloquear
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg">Logs de Segurança</h3>
              
              <div className="space-y-3">
                {securityLogs.map((log) => (
                  <div key={log.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityStyle(log.severity)}`}>
                            {log.severity.toUpperCase()}
                          </span>
                          <span className="text-gray-400 text-sm">{log.event_type.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-white mb-2">{log.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          {log.ip_address && (
                            <span>IP: <code className="text-gray-300">{log.ip_address}</code></span>
                          )}
                          <span>{formatDate(log.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsSecurity;
