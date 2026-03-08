import { supabase } from '@/lib/supabase-auth';
import { uploadFile } from '@/lib/supabase-upload';

export interface ImportRecord {
  id: string;
  name: string;
  description?: string;
  import_type: string;
  file_name: string;
  file_size?: number;
  file_url?: string;
  file_type?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  created_at: string;
}

export interface CreateImportInput {
  file: File;
  name: string;
  description?: string;
  import_type: string;
  has_header: boolean;
  skip_duplicates: boolean;
  update_existing: boolean;
  validate_only: boolean;
}

const mapImport = (row: any): ImportRecord => ({
  id: String(row.id),
  name: row.name || '',
  description: row.description || undefined,
  import_type: row.import_type || 'hymns',
  file_name: row.file_name || '',
  file_size: row.file_size != null ? Number(row.file_size) : undefined,
  file_url: row.file_url || undefined,
  file_type: row.file_type || undefined,
  status: row.status || 'pending',
  total_rows: Number(row.total_rows || 0),
  processed_rows: Number(row.processed_rows || 0),
  successful_rows: Number(row.successful_rows || 0),
  failed_rows: Number(row.failed_rows || 0),
  started_at: row.started_at || undefined,
  completed_at: row.completed_at || undefined,
  duration_seconds: row.duration_seconds != null ? Number(row.duration_seconds) : undefined,
  created_at: row.created_at || new Date().toISOString(),
});

const estimateTotalRows = async (file: File): Promise<number> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') {
    const text = await file.text();
    return Math.max(text.split(/\r?\n/).filter(Boolean).length - 1, 0);
  }

  if (extension === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.length : 1;
  }

  return 0;
};

export const getImports = async (): Promise<ImportRecord[]> => {
  const { data, error } = await supabase
    .from('imports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapImport);
};

export const createImport = async (input: CreateImportInput): Promise<ImportRecord> => {
  const [fileUrl, totalRows] = await Promise.all([
    uploadFile(input.file, 'imports'),
    estimateTotalRows(input.file),
  ]);

  const { data, error } = await supabase
    .from('imports')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      import_type: input.import_type,
      file_name: input.file.name,
      file_size: input.file.size,
      file_url: fileUrl,
      file_type: input.file.type || input.file.name.split('.').pop() || null,
      status: 'pending',
      total_rows: totalRows,
      processed_rows: 0,
      successful_rows: 0,
      failed_rows: 0,
      has_header: input.has_header,
      skip_duplicates: input.skip_duplicates,
      update_existing: input.update_existing,
      validate_only: input.validate_only,
      started_at: null,
      completed_at: null,
      summary: {
        created_via_admin: true,
      },
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapImport(data);
};

export const updateImportStatus = async (
  id: string,
  status: ImportRecord['status']
): Promise<{ success: boolean }> => {
  const payload: Record<string, unknown> = { status };

  if (status === 'processing') {
    payload.started_at = new Date().toISOString();
  }

  if (['completed', 'cancelled', 'failed'].includes(status)) {
    payload.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('imports')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const deleteImport = async (id: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('imports')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const getImportStats = async () => {
  const imports = await getImports();
  const successful = imports.reduce((sum, item) => sum + item.successful_rows, 0);
  const totalRows = imports.reduce((sum, item) => sum + item.total_rows, 0);

  return {
    total: imports.length,
    completed: imports.filter((item) => item.status === 'completed').length,
    processing: imports.filter((item) => ['processing', 'pending'].includes(item.status)).length,
    totalRows,
    successRate: totalRows > 0 ? (successful / totalRows) * 100 : 0,
  };
};
