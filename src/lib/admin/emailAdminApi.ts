// Mock implementation - Replace with real Supabase queries when backend is ready

export interface EmailSettings {
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

export interface EmailTemplate {
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

export interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending' | 'bounced';
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface EmailStats {
  totalSent: number;
  totalFailed: number;
  activeTemplates: number;
  todayCount: number;
}

// Mock database
let mockEmailSettings: EmailSettings = {
  id: '1',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_username: 'noreply@canticosccb.com.br',
  smtp_password: '********',
  smtp_encryption: 'tls',
  from_email: 'noreply@canticosccb.com.br',
  from_name: 'Cânticos CCB',
  reply_to_email: 'contato@canticosccb.com.br',
  is_active: true,
  daily_limit: 1000
};

let mockEmailTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Boas-vindas',
    slug: 'welcome',
    subject: 'Bem-vindo ao Cânticos CCB!',
    body_html: '<h1>Olá, {{name}}!</h1><p>Obrigado por se cadastrar.</p>',
    body_text: 'Olá, {{name}}! Obrigado por se cadastrar.',
    variables: ['name'],
    category: 'onboarding',
    is_active: true,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Recuperação de senha',
    slug: 'password-reset',
    subject: 'Recupere sua senha',
    body_html: '<h1>Olá!</h1><p>Clique no link para redefinir sua senha: {{reset_link}}</p>',
    body_text: 'Olá! Clique no link para redefinir sua senha: {{reset_link}}',
    variables: ['reset_link'],
    category: 'security',
    is_active: true,
    created_at: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'Confirmação de email',
    slug: 'email-confirmation',
    subject: 'Confirme seu email',
    body_html: '<h1>Olá, {{name}}!</h1><p>Confirme seu email clicando aqui: {{confirmation_link}}</p>',
    body_text: 'Olá, {{name}}! Confirme seu email clicando aqui: {{confirmation_link}}',
    variables: ['name', 'confirmation_link'],
    category: 'security',
    is_active: true,
    created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    name: 'Newsletter semanal',
    slug: 'weekly-newsletter',
    subject: 'Novidades da semana',
    body_html: '<h1>Novidades desta semana</h1><p>{{content}}</p>',
    body_text: 'Novidades desta semana: {{content}}',
    variables: ['content'],
    category: 'marketing',
    is_active: false,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  }
];

let mockEmailLogs: EmailLog[] = [
  {
    id: '1',
    recipient_email: 'joao.silva@example.com',
    recipient_name: 'João Silva',
    subject: 'Bem-vindo ao Cânticos CCB!',
    status: 'sent',
    sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    recipient_email: 'maria.santos@example.com',
    recipient_name: 'Maria Santos',
    subject: 'Confirme seu email',
    status: 'sent',
    sent_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    recipient_email: 'pedro.oliveira@example.com',
    recipient_name: 'Pedro Oliveira',
    subject: 'Recupere sua senha',
    status: 'failed',
    error_message: 'Endereço de email inválido',
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    recipient_email: 'ana.costa@example.com',
    recipient_name: 'Ana Costa',
    subject: 'Bem-vindo ao Cânticos CCB!',
    status: 'sent',
    sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    recipient_email: 'carlos.ferreira@example.com',
    recipient_name: 'Carlos Ferreira',
    subject: 'Newsletter semanal',
    status: 'bounced',
    error_message: 'Caixa de entrada cheia',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
];

export const getEmailSettings = async (): Promise<EmailSettings> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { ...mockEmailSettings };
};

export const updateEmailSettings = async (data: Partial<EmailSettings>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  mockEmailSettings = { ...mockEmailSettings, ...data };
  return { success: true };
};

export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockEmailTemplates];
};

export const getEmailLogs = async (): Promise<EmailLog[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockEmailLogs];
};

export const getEmailStats = async (): Promise<EmailStats> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const sent = mockEmailLogs.filter(log => log.status === 'sent').length;
  const failed = mockEmailLogs.filter(log => log.status === 'failed' || log.status === 'bounced').length;
  const activeTemplates = mockEmailTemplates.filter(t => t.is_active).length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = mockEmailLogs.filter(log => 
    new Date(log.created_at).getTime() >= today.getTime()
  ).length;

  return {
    totalSent: sent,
    totalFailed: failed,
    activeTemplates,
    todayCount
  };
};

export const sendTestEmail = async (recipient: string, settings: EmailSettings): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const newLog: EmailLog = {
    id: String(Date.now()),
    recipient_email: recipient,
    subject: 'Email de Teste - Cânticos CCB',
    status: 'sent',
    sent_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  mockEmailLogs.unshift(newLog);
  return { success: true };
};

export const createEmailTemplate = async (data: Partial<EmailTemplate>): Promise<{ success: boolean; template?: EmailTemplate }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newTemplate: EmailTemplate = {
    id: String(Date.now()),
    name: data.name || '',
    slug: data.slug || '',
    subject: data.subject || '',
    body_html: data.body_html || '',
    body_text: data.body_text,
    variables: data.variables || [],
    category: data.category || 'general',
    is_active: data.is_active ?? true,
    created_at: new Date().toISOString()
  };
  mockEmailTemplates.push(newTemplate);
  return { success: true, template: newTemplate };
};

export const updateEmailTemplate = async (id: string, data: Partial<EmailTemplate>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockEmailTemplates.findIndex(t => t.id === id);
  if (index !== -1) {
    mockEmailTemplates[index] = { ...mockEmailTemplates[index], ...data };
    return { success: true };
  }
  return { success: false };
};

export const deleteEmailTemplate = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockEmailTemplates.findIndex(t => t.id === id);
  if (index !== -1) {
    mockEmailTemplates.splice(index, 1);
    return { success: true };
  }
  return { success: false };
};

export const sendTemplateEmail = async (templateId: string, recipient: string, variables: Record<string, string>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const template = mockEmailTemplates.find(t => t.id === templateId);
  if (!template) return { success: false };
  
  const newLog: EmailLog = {
    id: String(Date.now()),
    recipient_email: recipient,
    subject: template.subject,
    status: 'sent',
    sent_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  mockEmailLogs.unshift(newLog);
  return { success: true };
};

export const sendBulkEmail = async (templateId: string, recipients: string[], variables: Record<string, string>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('Sending bulk email to', recipients.length, 'recipients');
  return { success: true };
};

// Legacy exports for compatibility
export const getSiteSettings = async (...args: any[]) => ({});
export const updateSiteSettings = async (...args: any[]) => ({ success: true });
export const getComments = async (...args: any[]) => [];
export const deleteComment = async (...args: any[]) => ({ success: true });
export const approveComment = async (...args: any[]) => ({ success: true });
export const getClaims = async (...args: any[]) => [];
export const getCopyrightClaims = async (...args: any[]) => [];
export const updateClaim = async (...args: any[]) => ({ success: true });
export const getRoyalties = async (...args: any[]) => [];
export const processPayment = async (...args: any[]) => ({ success: true });
export const getAllPlaylists = async (...args: any[]) => [];
export const createPlaylist = async (...args: any[]) => ({ success: true });
export const updatePlaylist = async (...args: any[]) => ({ success: true });
export const deletePlaylist = async (...args: any[]) => ({ success: true });
export type SiteSettings = any;
export type Comment = any;
export type Claim = any;
export type CopyrightClaim = any;
export type Royalty = any;
export type Playlist = any;
