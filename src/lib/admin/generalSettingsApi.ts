// Mock API for General Settings
// Replace with real implementation when backend is ready

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

export const getGeneralSettings = async (): Promise<GeneralSettings> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return { ...defaultSettings };
};

export const updateGeneralSettings = async (settings: GeneralSettings): Promise<GeneralSettings> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Updating settings:', settings);
  return { ...settings };
};

export const resetToDefaultSettings = async (): Promise<GeneralSettings> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  return { ...defaultSettings };
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
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  const settings = await getGeneralSettings();
  return JSON.stringify(settings, null, 2);
};

export const importSettings = async (jsonData: string): Promise<GeneralSettings> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const settings = JSON.parse(jsonData);
    const errors = validateSettings(settings);
    
    if (errors.length > 0) {
      throw new Error(`Configurações inválidas: ${errors.join(', ')}`);
    }
    
    return settings;
  } catch (error) {
    throw new Error('Arquivo JSON inválido');
  }
};

// Legacy exports for compatibility
export const getSettings = async () => getGeneralSettings();
export const updateSettings = async (settings: any) => updateGeneralSettings(settings);
export const resetSettings = async () => resetToDefaultSettings();
