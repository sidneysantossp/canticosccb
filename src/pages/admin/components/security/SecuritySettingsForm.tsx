import React from 'react';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

export interface SecuritySettings {
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

interface Props {
  settings: SecuritySettings;
  setSettings: (s: SecuritySettings) => void;
  isSaving: boolean;
  onSave: () => void;
}

const SecuritySettingsForm: React.FC<Props> = ({ settings, setSettings, isSaving, onSave }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg">Configurações de Segurança</h3>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          Salvar Configurações
        </button>
      </div>

      {/* Password Policy */}
      <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
        <h4 className="text-white font-medium flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Política de Senhas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Comprimento Mínimo</label>
            <input
              type="number"
              value={settings.password_min_length}
              onChange={(e) => setSettings({ ...settings, password_min_length: parseInt(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              min={6}
              max={32}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Expiração da Senha (dias)</label>
            <input
              type="number"
              value={settings.password_expiry_days}
              onChange={(e) => setSettings({ ...settings, password_expiry_days: parseInt(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              min={0}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            { key: 'password_require_uppercase', label: 'Exigir Maiúsculas' },
            { key: 'password_require_lowercase', label: 'Exigir Minúsculas' },
            { key: 'password_require_numbers', label: 'Exigir Números' },
            { key: 'password_require_special', label: 'Exigir Caracteres Especiais' }
          ] as const).map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer">
              <span className="text-gray-300">{label}</span>
              <input
                type="checkbox"
                checked={settings[key] as unknown as boolean}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.checked } as SecuritySettings)}
                className="w-5 h-5 rounded"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Login Security */}
      <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
        <h4 className="text-white font-medium flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Segurança de Login
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Máx. Tentativas de Login</label>
            <input
              type="number"
              value={settings.max_login_attempts}
              onChange={(e) => setSettings({ ...settings, max_login_attempts: parseInt(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Duração do Bloqueio (min)</label>
            <input
              type="number"
              value={settings.lockout_duration_minutes}
              onChange={(e) => setSettings({ ...settings, lockout_duration_minutes: parseInt(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Timeout da Sessão (min)</label>
            <input
              type="number"
              value={settings.session_timeout_minutes}
              onChange={(e) => setSettings({ ...settings, session_timeout_minutes: parseInt(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            { key: 'require_email_verification', label: 'Exigir Verificação de Email' },
            { key: 'enable_two_factor', label: 'Habilitar Autenticação de 2 Fatores' }
          ] as const).map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer">
              <span className="text-gray-300">{label}</span>
              <input
                type="checkbox"
                checked={settings[key] as unknown as boolean}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.checked } as SecuritySettings)}
                className="w-5 h-5 rounded"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
        <h4 className="text-white font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Controle de Taxa e Acesso
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Máx. Requisições por Minuto</label>
            <input
              type="number"
              value={settings.max_requests_per_minute}
              onChange={(e) => setSettings({ ...settings, max_requests_per_minute: parseInt(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              disabled={!settings.enable_rate_limiting}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            { key: 'enable_rate_limiting', label: 'Habilitar Limitação de Taxa' },
            { key: 'enable_ip_whitelist', label: 'Habilitar Lista Branca de IPs' },
            { key: 'enable_ssl_only', label: 'Permitir Apenas Conexões SSL/HTTPS' }
          ] as const).map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer">
              <span className="text-gray-300">{label}</span>
              <input
                type="checkbox"
                checked={settings[key] as unknown as boolean}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.checked } as SecuritySettings)}
                className="w-5 h-5 rounded"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
        <h4 className="text-white font-medium">Notificações de Segurança</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            { key: 'notify_new_login', label: 'Notificar em Novo Login' },
            { key: 'notify_password_change', label: 'Notificar em Mudança de Senha' },
            { key: 'notify_suspicious_activity', label: 'Notificar em Atividade Suspeita' }
          ] as const).map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer">
              <span className="text-gray-300">{label}</span>
              <input
                type="checkbox"
                checked={settings[key] as unknown as boolean}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.checked } as SecuritySettings)}
                className="w-5 h-5 rounded"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettingsForm;
