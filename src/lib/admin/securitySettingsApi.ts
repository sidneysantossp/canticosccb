import { supabase } from '@/lib/supabase-auth';
import {
  getSiteConfigMap,
  parseBooleanConfig,
  parseNumberConfig,
  upsertSiteConfigEntries,
} from '@/lib/admin/adminTableUtils';

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

export interface BlockedIPRecord {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at?: string;
  is_permanent: boolean;
  attempts_count: number;
}

export interface SecurityLogRecord {
  id: string;
  event_type: string;
  ip_address?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export interface SecurityStats {
  totalAttempts: number;
  failedAttempts: number;
  blockedIPs: number;
  criticalAlerts: number;
}

const SECURITY_CONFIG_KEYS = {
  password_min_length: 'security_password_min_length',
  password_require_uppercase: 'security_password_require_uppercase',
  password_require_lowercase: 'security_password_require_lowercase',
  password_require_numbers: 'security_password_require_numbers',
  password_require_special: 'security_password_require_special',
  password_expiry_days: 'security_password_expiry_days',
  max_login_attempts: 'security_max_login_attempts',
  lockout_duration_minutes: 'security_lockout_duration_minutes',
  session_timeout_minutes: 'security_session_timeout_minutes',
  require_email_verification: 'security_require_email_verification',
  enable_two_factor: 'security_enable_two_factor',
  enable_ip_whitelist: 'security_enable_ip_whitelist',
  enable_rate_limiting: 'security_enable_rate_limiting',
  max_requests_per_minute: 'security_max_requests_per_minute',
  enable_ssl_only: 'security_enable_ssl_only',
  notify_new_login: 'security_notify_new_login',
  notify_password_change: 'security_notify_password_change',
  notify_suspicious_activity: 'security_notify_suspicious_activity',
} as const;

const defaultSettings: SecuritySettings = {
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
  notify_suspicious_activity: true,
};

export const getSettings = async (): Promise<SecuritySettings> => {
  const configMap = await getSiteConfigMap(Object.values(SECURITY_CONFIG_KEYS));

  return {
    password_min_length: parseNumberConfig(configMap[SECURITY_CONFIG_KEYS.password_min_length], defaultSettings.password_min_length),
    password_require_uppercase: parseBooleanConfig(configMap[SECURITY_CONFIG_KEYS.password_require_uppercase], defaultSettings.password_require_uppercase),
    password_require_lowercase: parseBooleanConfig(configMap[SECURITY_CONFIG_KEYS.password_require_lowercase], defaultSettings.password_require_lowercase),
    password_require_numbers: parseBooleanConfig(configMap[SECURITY_CONFIG_KEYS.password_require_numbers], defaultSettings.password_require_numbers),
    password_require_special: parseBooleanConfig(configMap[SECURITY_CONFIG_KEYS.password_require_special], defaultSettings.password_require_special),
    password_expiry_days: parseNumberConfig(configMap[SECURITY_CONFIG_KEYS.password_expiry_days], defaultSettings.password_expiry_days),
    max_login_attempts: parseNumberConfig(configMap[SECURITY_CONFIG_KEYS.max_login_attempts], defaultSettings.max_login_attempts),
    lockout_duration_minutes: parseNumberConfig(configMap[SECURITY_CONFIG_KEYS.lockout_duration_minutes], defaultSettings.lockout_duration_minutes),
    session_timeout_minutes: parseNumberConfig(configMap[SECURITY_CONFIG_KEYS.session_timeout_minutes], defaultSettings.session_timeout_minutes),
    require_email_verification: parseBooleanConfig(configMap[SECURITY_CONFIG_KEYS.require_email_verification], defaultSettings.require_email_verification),
    enable_two_factor: parseBooleanConfig(configMap[SECURITY_CONFIG_KEYS.enable_two_factor], defaultSettings.enable_two_factor),
    enable_ip_whitelist: parseBooleanConfig(configMap[SECURITY_CONFIG_KEYS.enable_ip_whitelist], defaultSettings.enable_ip_whitelist),
    enable_rate_limiting: parseBooleanConfig(configMap[SECURITY_CONFIG_KEYS.enable_rate_limiting], defaultSettings.enable_rate_limiting),
    max_requests_per_minute: parseNumberConfig(configMap[SECURITY_CONFIG_KEYS.max_requests_per_minute], defaultSettings.max_requests_per_minute),
    enable_ssl_only: parseBooleanConfig(configMap[SECURITY_CONFIG_KEYS.enable_ssl_only], defaultSettings.enable_ssl_only),
    notify_new_login: parseBooleanConfig(configMap[SECURITY_CONFIG_KEYS.notify_new_login], defaultSettings.notify_new_login),
    notify_password_change: parseBooleanConfig(configMap[SECURITY_CONFIG_KEYS.notify_password_change], defaultSettings.notify_password_change),
    notify_suspicious_activity: parseBooleanConfig(configMap[SECURITY_CONFIG_KEYS.notify_suspicious_activity], defaultSettings.notify_suspicious_activity),
  };
};

export const updateSettings = async (settings: SecuritySettings): Promise<{ success: boolean }> => {
  const payload = Object.entries(SECURITY_CONFIG_KEYS).reduce<Record<string, string | number | boolean>>(
    (acc, [field, configKey]) => {
      acc[configKey] = settings[field as keyof SecuritySettings] as string | number | boolean;
      return acc;
    },
    {}
  );

  await upsertSiteConfigEntries(payload);
  return { success: true };
};

export const getBlockedIps = async (): Promise<BlockedIPRecord[]> => {
  const { data, error } = await supabase
    .from('blocked_ips')
    .select('*')
    .order('blocked_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: String(row.id),
    ip_address: row.ip_address || '',
    reason: row.reason || 'Bloqueio manual',
    blocked_at: row.blocked_at || row.created_at || new Date().toISOString(),
    expires_at: row.expires_at || undefined,
    is_permanent: Boolean(row.is_permanent),
    attempts_count: Number(row.attempts_count || 0),
  }));
};

export const unblockIp = async (id: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('blocked_ips')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const getSecurityLogs = async (limit = 100): Promise<SecurityLogRecord[]> => {
  const { data, error } = await supabase
    .from('security_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: String(row.id),
    event_type: row.event_type || 'security_event',
    ip_address: row.ip_address || undefined,
    description: row.description || row.event_type || 'Evento de segurança',
    severity: row.severity || 'low',
    created_at: row.created_at || new Date().toISOString(),
  }));
};

export const getSecurityStats = async (): Promise<SecurityStats> => {
  const [logs, blockedIPs] = await Promise.all([getSecurityLogs(500), getBlockedIps()]);

  return {
    totalAttempts: logs.length,
    failedAttempts: logs.filter((log) => {
      const normalized = `${log.event_type} ${log.description}`.toLowerCase();
      return normalized.includes('fail') || normalized.includes('invalid') || normalized.includes('blocked');
    }).length,
    blockedIPs: blockedIPs.length,
    criticalAlerts: logs.filter((log) => ['critical', 'high'].includes(log.severity)).length,
  };
};

export const resetSettings = async () => updateSettings(defaultSettings);
