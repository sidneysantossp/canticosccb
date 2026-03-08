import { supabase } from '@/lib/supabase-auth';
import { slugifyAdminText } from '@/lib/admin/adminTableUtils';

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
  updated_at?: string;
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
  metadata?: Record<string, unknown>;
}

export interface EmailStats {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  activeTemplates: number;
  todayCount: number;
}

const defaultEmailSettings: EmailSettings = {
  smtp_host: '',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  smtp_encryption: 'tls',
  from_email: '',
  from_name: 'Cânticos CCB',
  reply_to_email: '',
  is_active: false,
  daily_limit: 1000,
};

const mapEmailSettings = (row: any): EmailSettings => ({
  id: row?.id ? String(row.id) : undefined,
  smtp_host: row?.smtp_host || '',
  smtp_port: Number(row?.smtp_port || 587),
  smtp_username: row?.smtp_username || '',
  smtp_password: row?.smtp_password || '',
  smtp_encryption: row?.smtp_encryption || 'tls',
  from_email: row?.from_email || '',
  from_name: row?.from_name || 'Cânticos CCB',
  reply_to_email: row?.reply_to_email || '',
  is_active: Boolean(row?.is_active),
  daily_limit: Number(row?.daily_limit || 1000),
});

const mapTemplate = (row: any): EmailTemplate => ({
  id: String(row.id),
  name: row.name || '',
  slug: row.slug || slugifyAdminText(row.name || `template-${row.id}`),
  subject: row.subject || '',
  body_html: row.body_html || '',
  body_text: row.body_text || undefined,
  variables: Array.isArray(row.variables) ? row.variables : [],
  category: row.category || 'general',
  is_active: row.is_active !== false,
  created_at: row.created_at || new Date().toISOString(),
  updated_at: row.updated_at || undefined,
});

const mapLog = (row: any): EmailLog => ({
  id: String(row.id),
  recipient_email: row.recipient_email || '',
  recipient_name: row.recipient_name || undefined,
  subject: row.subject || '',
  status: row.status || 'pending',
  error_message: row.error_message || undefined,
  sent_at: row.sent_at || undefined,
  created_at: row.created_at || new Date().toISOString(),
  metadata: row.metadata || undefined,
});

export const getEmailSettings = async (): Promise<EmailSettings> => {
  const { data, error } = await supabase
    .from('email_settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data ? mapEmailSettings(data) : { ...defaultEmailSettings };
};

export const updateEmailSettings = async (data: Partial<EmailSettings>): Promise<{ success: boolean }> => {
  const current = await getEmailSettings();
  const payload = {
    ...current,
    ...data,
    smtp_port: Number(data.smtp_port ?? current.smtp_port),
    daily_limit: Number(data.daily_limit ?? current.daily_limit),
    reply_to_email: data.reply_to_email ?? current.reply_to_email ?? null,
  };

  if (current.id) {
    const { error } = await supabase
      .from('email_settings')
      .update(payload)
      .eq('id', current.id);

    if (error) throw error;
    return { success: true };
  }

  const { error } = await supabase
    .from('email_settings')
    .insert(payload);

  if (error) throw error;
  return { success: true };
};

export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapTemplate);
};

export const getEmailLogs = async (limit = 100): Promise<EmailLog[]> => {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(mapLog);
};

export const getEmailStats = async (): Promise<EmailStats> => {
  const [logs, templates] = await Promise.all([getEmailLogs(500), getEmailTemplates()]);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return {
    totalSent: logs.filter((log) => log.status === 'sent').length,
    totalFailed: logs.filter((log) => ['failed', 'bounced'].includes(log.status)).length,
    totalPending: logs.filter((log) => log.status === 'pending').length,
    activeTemplates: templates.filter((template) => template.is_active).length,
    todayCount: logs.filter((log) => new Date(log.created_at).getTime() >= todayStart.getTime()).length,
  };
};

export const sendTestEmail = async (
  recipient: string,
  settings: EmailSettings
): Promise<{ success: boolean }> => {
  await updateEmailSettings(settings);

  const { error } = await supabase
    .from('email_logs')
    .insert({
      recipient_email: recipient,
      recipient_name: 'Teste Admin',
      subject: 'Email de teste - Cânticos CCB',
      status: 'pending',
      metadata: {
        requested_via_admin: true,
        smtp_host: settings.smtp_host,
      },
      created_at: new Date().toISOString(),
    });

  if (error) throw error;
  return { success: true };
};

export const createEmailTemplate = async (
  data: Partial<EmailTemplate>
): Promise<{ success: boolean; template?: EmailTemplate }> => {
  const payload = {
    name: data.name?.trim() || 'Novo template',
    slug: data.slug?.trim() || slugifyAdminText(data.name || 'novo-template'),
    subject: data.subject?.trim() || '',
    body_html: data.body_html || '',
    body_text: data.body_text || null,
    variables: data.variables || [],
    category: data.category || 'general',
    is_active: data.is_active ?? true,
  };

  const { data: created, error } = await supabase
    .from('email_templates')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return { success: true, template: mapTemplate(created) };
};

export const updateEmailTemplate = async (
  id: string,
  data: Partial<EmailTemplate>
): Promise<{ success: boolean }> => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.slug !== undefined) payload.slug = data.slug.trim();
  if (data.subject !== undefined) payload.subject = data.subject;
  if (data.body_html !== undefined) payload.body_html = data.body_html;
  if (data.body_text !== undefined) payload.body_text = data.body_text;
  if (data.variables !== undefined) payload.variables = data.variables;
  if (data.category !== undefined) payload.category = data.category;
  if (data.is_active !== undefined) payload.is_active = data.is_active;
  payload.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('email_templates')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const deleteEmailTemplate = async (id: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const sendTemplateEmail = async (
  templateId: string,
  recipient: string,
  variables: Record<string, string>
): Promise<{ success: boolean }> => {
  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError) throw templateError;

  const { error } = await supabase
    .from('email_logs')
    .insert({
      template_id: templateId,
      recipient_email: recipient,
      subject: template.subject || 'Template de email',
      status: 'pending',
      metadata: {
        variables,
        requested_via_admin: true,
      },
      created_at: new Date().toISOString(),
    });

  if (error) throw error;
  return { success: true };
};
