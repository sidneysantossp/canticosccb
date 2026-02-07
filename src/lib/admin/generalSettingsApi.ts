import { supabaseFetch, supabaseUpdate, supabaseInsert } from '@/lib/supabaseRest';

export interface GeneralSettings {
  site_name: string;
  site_description: string;
  site_url: string;
  admin_email: string;
  support_email: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  email_verification_required: boolean;
  max_upload_size: number;
  session_timeout: number;
  timezone: string;
  language: string;
  currency: string;
  date_format: string;
  time_format: string;
  items_per_page: number;
  backup_enabled: boolean;
  backup_frequency: string;
  analytics_enabled: boolean;
  google_analytics_id: string;
  facebook_pixel_id: string;
}

const defaultSettings: GeneralSettings = {
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
};

// Chaves que são booleanas ou numéricas (para conversão correta)
const booleanKeys: (keyof GeneralSettings)[] = [
  'maintenance_mode', 'registration_enabled', 'email_verification_required',
  'backup_enabled', 'analytics_enabled'
];
const numberKeys: (keyof GeneralSettings)[] = [
  'max_upload_size', 'session_timeout', 'items_per_page'
];

/**
 * Salva ou atualiza uma chave no site_config
 */
async function upsertConfigKey(key: string, value: string): Promise<void> {
  const existing = await supabaseFetch<any>('site_config', {
    config_key: `eq.${key}`,
    select: 'id',
    limit: '1',
  });

  if (existing.length > 0) {
    await supabaseUpdate('site_config', { config_key: `eq.${key}` }, { config_value: value });
  } else {
    await supabaseInsert('site_config', { config_key: key, config_value: value });
  }
}

export const getGeneralSettings = async (): Promise<GeneralSettings> => {
  try {
    const allKeys = Object.keys(defaultSettings);
    const keysList = allKeys.join(',');

    const rows = await supabaseFetch<any>('site_config', {
      config_key: `in.(${keysList})`,
      select: 'config_key,config_value',
    });

    const configMap: Record<string, string> = {};
    for (const row of rows) {
      configMap[row.config_key] = row.config_value;
    }

    // Montar objeto com valores do DB, fallback para default
    const result: any = { ...defaultSettings };
    for (const key of allKeys) {
      if (configMap[key] !== undefined && configMap[key] !== null) {
        if (booleanKeys.includes(key as keyof GeneralSettings)) {
          result[key] = configMap[key] === 'true';
        } else if (numberKeys.includes(key as keyof GeneralSettings)) {
          result[key] = parseInt(configMap[key]) || (defaultSettings as any)[key];
        } else {
          result[key] = configMap[key];
        }
      }
    }

    return result as GeneralSettings;
  } catch (err) {
    console.error('Erro ao carregar configurações gerais:', err);
    return { ...defaultSettings };
  }
};

export const updateGeneralSettings = async (settings: GeneralSettings): Promise<GeneralSettings> => {
  const entries = Object.entries(settings);

  for (const [key, value] of entries) {
    await upsertConfigKey(key, String(value));
  }

  return { ...settings };
};

export const resetToDefaultSettings = async (): Promise<GeneralSettings> => {
  return await updateGeneralSettings({ ...defaultSettings });
};

export const validateSettings = (settings: GeneralSettings): string[] => {
  const errors: string[] = [];
  
  if (!settings.site_name || settings.site_name.trim() === '') {
    errors.push('Nome do site é obrigatório');
  }
  
  if (!settings.admin_email || !settings.admin_email.includes('@')) {
    errors.push('Email do admin inválido');
  }
  
  if (settings.max_upload_size < 1 || settings.max_upload_size > 100) {
    errors.push('Tamanho máximo de upload deve estar entre 1 e 100 MB');
  }
  
  return errors;
};

export const exportSettings = async (): Promise<string> => {
  const settings = await getGeneralSettings();
  return JSON.stringify(settings, null, 2);
};

export const importSettings = async (jsonData: string): Promise<GeneralSettings> => {
  try {
    const settings = JSON.parse(jsonData);
    const errors = validateSettings(settings);
    
    if (errors.length > 0) {
      throw new Error(`Configurações inválidas: ${errors.join(', ')}`);
    }
    
    // Salvar no Supabase
    await updateGeneralSettings(settings);
    return settings;
  } catch (error: any) {
    if (error.message?.includes('Configurações inválidas')) throw error;
    throw new Error('Arquivo JSON inválido');
  }
};

// Legacy exports for compatibility
export const getSettings = async () => getGeneralSettings();
export const updateSettings = async (settings: any) => updateGeneralSettings(settings);
export const resetSettings = async () => resetToDefaultSettings();
