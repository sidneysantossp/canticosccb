import { supabase } from '@/lib/supabase-auth';

export interface BackupRecord {
  id: string;
  name: string;
  description?: string;
  backup_type: string;
  scope: string;
  file_name?: string;
  file_size?: number;
  file_url?: string;
  storage_location?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'restoring';
  total_items: number;
  processed_items: number;
  compress: boolean;
  encrypt: boolean;
  is_scheduled: boolean;
  retention_days: number;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  created_at: string;
}

export interface CreateBackupInput {
  name: string;
  description?: string;
  backup_type: string;
  scope?: string;
  storage_location?: string;
  compress: boolean;
  encrypt: boolean;
  retention_days?: number;
}

const mapBackup = (row: any): BackupRecord => ({
  id: String(row.id),
  name: row.name || '',
  description: row.description || undefined,
  backup_type: row.backup_type || 'full',
  scope: row.scope || 'all',
  file_name: row.file_name || undefined,
  file_size: row.file_size != null ? Number(row.file_size) : undefined,
  file_url: row.file_url || undefined,
  storage_location: row.storage_location || undefined,
  status: row.status || 'pending',
  total_items: Number(row.total_items || 0),
  processed_items: Number(row.processed_items || 0),
  compress: Boolean(row.compress),
  encrypt: Boolean(row.encrypt),
  is_scheduled: Boolean(row.is_scheduled),
  retention_days: Number(row.retention_days || 30),
  started_at: row.started_at || undefined,
  completed_at: row.completed_at || undefined,
  duration_seconds: row.duration_seconds != null ? Number(row.duration_seconds) : undefined,
  created_at: row.created_at || new Date().toISOString(),
});

export const getBackups = async (): Promise<BackupRecord[]> => {
  const { data, error } = await supabase
    .from('backups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapBackup);
};

export const createBackup = async (input: CreateBackupInput): Promise<BackupRecord> => {
  const { data, error } = await supabase
    .from('backups')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      backup_type: input.backup_type,
      scope: input.scope || 'all',
      storage_location: input.storage_location || 'local',
      status: 'pending',
      total_items: 0,
      processed_items: 0,
      compress: input.compress,
      encrypt: input.encrypt,
      is_scheduled: false,
      retention_days: input.retention_days || 30,
      started_at: null,
      completed_at: null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapBackup(data);
};

export const updateBackupStatus = async (
  id: string,
  status: BackupRecord['status']
): Promise<{ success: boolean }> => {
  const payload: Record<string, unknown> = { status };

  if (status === 'restoring' || status === 'running') {
    payload.started_at = new Date().toISOString();
  }

  if (['completed', 'cancelled', 'failed'].includes(status)) {
    payload.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('backups')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const deleteBackup = async (id: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('backups')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const getBackupStats = async () => {
  const backups = await getBackups();
  return {
    total: backups.length,
    completed: backups.filter((backup) => backup.status === 'completed').length,
    running: backups.filter((backup) => ['running', 'restoring', 'pending'].includes(backup.status)).length,
    totalSize: backups.reduce((sum, backup) => sum + (backup.file_size || 0), 0),
  };
};
