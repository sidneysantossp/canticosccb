import { supabase } from '@/lib/supabase-auth';
import { downloadTextFile } from '@/lib/admin/adminTableUtils';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';
export type LogCategory = 'auth' | 'api' | 'database' | 'upload' | 'admin' | 'user' | 'system';

export interface LogEntry {
  id: string;
  source: string;
  sourceId: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  user_name?: string;
  user_email?: string;
  ip_address?: string;
  metadata?: Record<string, unknown>;
}

export interface LogFilters {
  level?: LogLevel;
  category?: LogCategory;
  search?: string;
  limit?: number;
}

const LOG_SOURCE_TABLES: Record<string, string> = {
  security: 'security_logs',
  security_logs: 'security_logs',
  email: 'email_logs',
  email_logs: 'email_logs',
  backup: 'backups',
  backups: 'backups',
  import: 'imports',
  imports: 'imports',
  export: 'exports',
  exports: 'exports',
  report: 'reports',
  reports: 'reports',
};

const toLogLevelFromSeverity = (severity?: string | null): LogLevel => {
  switch ((severity || '').toLowerCase()) {
    case 'critical':
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'success':
      return 'success';
    default:
      return 'info';
  }
};

const toLogLevelFromStatus = (status?: string | null): LogLevel => {
  switch ((status || '').toLowerCase()) {
    case 'sent':
    case 'completed':
    case 'resolved':
      return 'success';
    case 'failed':
    case 'bounced':
    case 'cancelled':
      return 'error';
    case 'running':
    case 'processing':
    case 'pending':
    case 'open':
    case 'in_review':
      return 'warning';
    default:
      return 'info';
  }
};

const inferSecurityCategory = (eventType?: string | null, description?: string | null): LogCategory => {
  const combined = `${eventType || ''} ${description || ''}`.toLowerCase();
  if (combined.includes('login') || combined.includes('auth') || combined.includes('senha')) {
    return 'auth';
  }
  if (combined.includes('ip') || combined.includes('blocked')) {
    return 'admin';
  }
  return 'system';
};


const matchesFilters = (log: LogEntry, filters: LogFilters) => {
  if (filters.level && log.level !== filters.level) return false;
  if (filters.category && log.category !== filters.category) return false;

  if (filters.search) {
    const term = filters.search.trim().toLowerCase();
    if (term) {
      const haystack = [
        log.message,
        log.category,
        log.level,
        log.user_name,
        log.user_email,
        log.ip_address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(term)) return false;
    }
  }

  return true;
};

const sortLogsDesc = (a: LogEntry, b: LogEntry) =>
  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

const mapSecurityLog = (row: any): LogEntry => ({
  id: `security:${row.id}`,
  source: 'security_logs',
  sourceId: String(row.id),
  timestamp: row.created_at || new Date().toISOString(),
  level: toLogLevelFromSeverity(row.severity),
  category: inferSecurityCategory(row.event_type, row.description),
  message: row.description || row.event_type || 'Evento de segurança',
  user_name: row.user_name || row.metadata?.user_name,
  user_email: row.user_email || row.metadata?.user_email,
  ip_address: row.ip_address || undefined,
  metadata: row.metadata || undefined,
});

const mapEmailLog = (row: any): LogEntry => ({
  id: `email:${row.id}`,
  source: 'email_logs',
  sourceId: String(row.id),
  timestamp: row.sent_at || row.created_at || new Date().toISOString(),
  level: toLogLevelFromStatus(row.status),
  category: 'system',
  message: row.subject
    ? `Email "${row.subject}" para ${row.recipient_email || 'destinatário'}`
    : `Email para ${row.recipient_email || 'destinatário'}`,
  user_name: row.recipient_name || undefined,
  user_email: row.recipient_email || undefined,
  metadata: row.metadata || undefined,
});

const mapBackupLog = (row: any): LogEntry => ({
  id: `backup:${row.id}`,
  source: 'backups',
  sourceId: String(row.id),
  timestamp: row.updated_at || row.completed_at || row.started_at || row.created_at || new Date().toISOString(),
  level: toLogLevelFromStatus(row.status),
  category: 'database',
  message: `Backup ${row.name || row.file_name || row.id}: ${row.status || 'pending'}`,
  metadata: row.metadata || undefined,
});

const mapImportLog = (row: any): LogEntry => ({
  id: `import:${row.id}`,
  source: 'imports',
  sourceId: String(row.id),
  timestamp: row.updated_at || row.completed_at || row.started_at || row.created_at || new Date().toISOString(),
  level: toLogLevelFromStatus(row.status),
  category: 'upload',
  message: `Importação ${row.name || row.file_name || row.id}: ${row.status || 'pending'}`,
  metadata: row.summary || row.column_mapping || undefined,
});

const mapExportLog = (row: any): LogEntry => ({
  id: `export:${row.id}`,
  source: 'exports',
  sourceId: String(row.id),
  timestamp: row.updated_at || row.completed_at || row.started_at || row.created_at || new Date().toISOString(),
  level: toLogLevelFromStatus(row.status),
  category: 'database',
  message: `Exportação ${row.name || row.file_name || row.id}: ${row.status || 'pending'}`,
  metadata: row.filters || undefined,
});

const mapReportLog = (row: any): LogEntry => ({
  id: `report:${row.id}`,
  source: 'reports',
  sourceId: String(row.id),
  timestamp: row.updated_at || row.created_at || new Date().toISOString(),
  level: toLogLevelFromStatus(row.status),
  category: 'admin',
  message: `Denúncia ${row.title || row.titulo || row.id}: ${row.status || 'open'}`,
  user_name: row.reporter_name || row.reporter || row.denunciante || undefined,
  metadata: {
    reason: row.reason || row.motivo,
    priority: row.priority || row.prioridade,
  },
});

export async function getLogs(filters: LogFilters = {}): Promise<{ logs: LogEntry[]; total: number }> {
  const limit = Math.max(1, Math.min(filters.limit || 100, 500));

  const [securityRes, emailRes, backupsRes, importsRes, exportsRes, reportsRes] = await Promise.all([
    supabase.from('security_logs').select('*').order('created_at', { ascending: false }).limit(limit),
    supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(limit),
    supabase.from('backups').select('*').order('created_at', { ascending: false }).limit(limit),
    supabase.from('imports').select('*').order('created_at', { ascending: false }).limit(limit),
    supabase.from('exports').select('*').order('created_at', { ascending: false }).limit(limit),
    supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(limit),
  ]);

  const errors = [
    securityRes.error,
    emailRes.error,
    backupsRes.error,
    importsRes.error,
    exportsRes.error,
    reportsRes.error,
  ].filter(Boolean);

  if (errors.length === 6) {
    throw errors[0];
  }

  const logs = [
    ...(securityRes.data || []).map(mapSecurityLog),
    ...(emailRes.data || []).map(mapEmailLog),
    ...(backupsRes.data || []).map(mapBackupLog),
    ...(importsRes.data || []).map(mapImportLog),
    ...(exportsRes.data || []).map(mapExportLog),
    ...(reportsRes.data || []).map(mapReportLog),
  ]
    .filter((log) => matchesFilters(log, filters))
    .sort(sortLogsDesc);

  return {
    logs: logs.slice(0, limit),
    total: logs.length,
  };
}

export async function getLogStats(): Promise<{ total: number; byLevel: Record<LogLevel, number> }> {
  const { logs, total } = await getLogs({ limit: 300 });

  const byLevel = logs.reduce<Record<LogLevel, number>>(
    (acc, log) => {
      acc[log.level] += 1;
      return acc;
    },
    { info: 0, success: 0, warning: 0, error: 0 }
  );

  return { total, byLevel };
}

const deleteBySource = async (source: string, sourceIds: string[]) => {
  if (sourceIds.length === 0) return;

  const table = LOG_SOURCE_TABLES[source];
  if (!table) return;

  const numericIds = sourceIds.map((value) => (/^\d+$/.test(value) ? Number(value) : value));
  const { error } = await supabase.from(table).delete().in('id', numericIds as any[]);
  if (error) {
    throw error;
  }
};

export async function deleteLogs(ids: string[]): Promise<{ success: boolean }> {
  const grouped = ids.reduce<Record<string, string[]>>((acc, id) => {
    const [source, sourceId] = id.split(':');
    if (!source || !sourceId) return acc;
    acc[source] = acc[source] || [];
    acc[source].push(sourceId);
    return acc;
  }, {});

  await Promise.all(Object.entries(grouped).map(([source, sourceIds]) => deleteBySource(source, sourceIds)));
  return { success: true };
}

export async function deleteOldLogs(days = 90): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [securityRes, emailRes] = await Promise.all([
    supabase.from('security_logs').delete().lt('created_at', cutoff).select('id'),
    supabase.from('email_logs').delete().lt('created_at', cutoff).select('id'),
  ]);

  if (securityRes.error) throw securityRes.error;
  if (emailRes.error) throw emailRes.error;

  return (securityRes.data?.length || 0) + (emailRes.data?.length || 0);
}

export async function exportLogsAsCSV(filters: LogFilters = {}): Promise<string> {
  const { logs } = await getLogs({ ...filters, limit: filters.limit || 500 });
  const headers = ['timestamp', 'level', 'category', 'message', 'user_name', 'user_email', 'ip_address', 'source'];
  const lines = [
    headers.join(','),
    ...logs.map((log) =>
      [
        log.timestamp,
        log.level,
        log.category,
        log.message,
        log.user_name || '',
        log.user_email || '',
        log.ip_address || '',
        log.source,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];

  return lines.join('\n');
}

export async function exportLogs(filters: LogFilters = {}): Promise<{ success: boolean }> {
  const csvContent = await exportLogsAsCSV(filters);
  downloadTextFile(csvContent, `logs_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
  return { success: true };
}

export const getAll = async () => {
  const { logs } = await getLogs();
  return logs;
};

export const getById = async (id: string) => {
  const { logs } = await getLogs({ limit: 500 });
  return logs.find((log) => log.id === id) || null;
};

export const create = async () => ({ success: false });
export const update = async () => ({ success: false });
export const deleteItem = async (id: string) => deleteLogs([id]);

export type Log = LogEntry;
