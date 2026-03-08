import { supabase } from '@/lib/supabase-auth';
import { slugifyAdminText } from '@/lib/admin/adminTableUtils';
import { uploadFile } from '@/lib/supabase-upload';

export interface ExportRecord {
  id: string;
  name: string;
  description?: string;
  export_type: string;
  format: string;
  file_name?: string;
  file_size?: number;
  file_url?: string;
  download_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  total_records: number;
  processed_records: number;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface CreateExportInput {
  name: string;
  description?: string;
  export_type: string;
  format: string;
  include_headers?: boolean;
  include_relations?: boolean;
  include_media_links?: boolean;
  compress?: boolean;
}

const SUPPORTED_FORMATS = new Set(['csv', 'json', 'xml', 'sql']);

const mapExport = (row: any): ExportRecord => ({
  id: String(row.id),
  name: row.name || '',
  description: row.description || undefined,
  export_type: row.export_type || 'hymns',
  format: row.format || 'csv',
  file_name: row.file_name || undefined,
  file_size: row.file_size != null ? Number(row.file_size) : undefined,
  file_url: row.file_url || undefined,
  download_count: Number(row.download_count || 0),
  status: row.status || 'pending',
  total_records: Number(row.total_records || 0),
  processed_records: Number(row.processed_records || 0),
  started_at: row.started_at || undefined,
  completed_at: row.completed_at || undefined,
  expires_at: row.expires_at || undefined,
  created_at: row.created_at || new Date().toISOString(),
});

const fetchTableRows = async (table: string) => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const buildAnalyticsSnapshot = async () => {
  const [users, hinos, albums, reports] = await Promise.all([
    fetchTableRows('users'),
    fetchTableRows('hinos'),
    fetchTableRows('albums'),
    fetchTableRows('reports'),
  ]);

  return [
    {
      total_users: users.length,
      total_hymns: hinos.length,
      total_albums: albums.length,
      total_reports: reports.length,
      total_plays: hinos.reduce((sum, row: any) => sum + Number(row.plays_count || row.plays || row.views_count || 0), 0),
      total_likes: hinos.reduce((sum, row: any) => sum + Number(row.likes_count || row.likes || 0), 0),
      generated_at: new Date().toISOString(),
    },
  ];
};

const fetchExportDataset = async (exportType: string) => {
  switch (exportType) {
    case 'hymns':
    case 'lyrics':
      return fetchTableRows('hinos');
    case 'albums':
      return fetchTableRows('albums');
    case 'playlists':
      return fetchTableRows('playlists');
    case 'composers':
      return fetchTableRows('composers');
    case 'users':
      return fetchTableRows('users');
    case 'reports':
      return fetchTableRows('reports');
    case 'analytics':
      return buildAnalyticsSnapshot();
    case 'media': {
      const [hymns, albums] = await Promise.all([fetchTableRows('hinos'), fetchTableRows('albums')]);
      return [
        ...hymns.map((row: any) => ({
          type: 'hymn',
          id: row.id,
          title: row.titulo || row.title,
          audio_url: row.audio_url,
          cover_url: row.cover_url || row.capa_url,
        })),
        ...albums.map((row: any) => ({
          type: 'album',
          id: row.id,
          title: row.title,
          cover_url: row.cover_url,
        })),
      ];
    }
    case 'complete': {
      const [users, hinos, albums, playlists, composers] = await Promise.all([
        fetchTableRows('users'),
        fetchTableRows('hinos'),
        fetchTableRows('albums'),
        fetchTableRows('playlists'),
        fetchTableRows('composers'),
      ]);

      return [
        {
          generated_at: new Date().toISOString(),
          users,
          hinos,
          albums,
          playlists,
          composers,
        },
      ];
    }
    default:
      return [];
  }
};

const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const toCsv = (rows: any[], includeHeaders = true) => {
  if (rows.length === 0) return includeHeaders ? '' : '';
  const headers = Array.from(
    rows.reduce<Set<string>>((acc, row) => {
      Object.keys(row || {}).forEach((key) => acc.add(key));
      return acc;
    }, new Set<string>())
  );

  const lines = rows.map((row) => headers.map((header) => csvEscape(row?.[header])).join(','));
  return includeHeaders ? [headers.join(','), ...lines].join('\n') : lines.join('\n');
};

const toXml = (rows: any[]) => {
  const items = rows
    .map((row) => {
      const fields = Object.entries(row || {})
        .map(([key, value]) => `    <${key}>${String(value ?? '').replace(/[<>&]/g, '')}</${key}>`)
        .join('\n');
      return `  <item>\n${fields}\n  </item>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<export>\n${items}\n</export>`;
};

const sqlEscape = (value: unknown) => String(value ?? '').replace(/'/g, "''");

const toSql = (rows: any[], tableName: string) => {
  return rows
    .map((row) => {
      const entries = Object.entries(row || {});
      const columns = entries.map(([key]) => key).join(', ');
      const values = entries
        .map(([, value]) => {
          if (value == null) return 'NULL';
          if (typeof value === 'number' || typeof value === 'boolean') return `'${value}'`;
          return `'${sqlEscape(value)}'`;
        })
        .join(', ');
      return `INSERT INTO ${tableName} (${columns}) VALUES (${values});`;
    })
    .join('\n');
};

const toContent = (rows: any[], exportType: string, format: string, includeHeaders = true) => {
  switch (format) {
    case 'json':
      return JSON.stringify(rows, null, 2);
    case 'xml':
      return toXml(rows);
    case 'sql':
      return toSql(rows, exportType === 'complete' ? 'export_snapshot' : exportType);
    case 'csv':
    default:
      return toCsv(rows, includeHeaders);
  }
};

const toMimeType = (format: string) => {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'xml':
      return 'application/xml';
    case 'sql':
      return 'application/sql';
    default:
      return 'text/csv';
  }
};

export const getExports = async (): Promise<ExportRecord[]> => {
  const { data, error } = await supabase
    .from('exports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapExport);
};

export const createExport = async (input: CreateExportInput): Promise<ExportRecord> => {
  const resolvedFormat = SUPPORTED_FORMATS.has(input.format) ? input.format : 'csv';
  const startedAt = new Date().toISOString();
  const dataset = await fetchExportDataset(input.export_type);
  const content = toContent(dataset, input.export_type, resolvedFormat, input.include_headers !== false);
  const extension = resolvedFormat;
  const baseName = slugifyAdminText(input.name) || `export-${Date.now()}`;
  const fileName = `${baseName}.${extension}`;
  const file = new File([content], fileName, { type: toMimeType(resolvedFormat) });
  const fileUrl = await uploadFile(file, 'exports');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('exports')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      export_type: input.export_type,
      format: resolvedFormat,
      filters: {
        include_headers: input.include_headers !== false,
        include_relations: input.include_relations ?? true,
        include_media_links: input.include_media_links ?? true,
        requested_format: input.format,
      },
      file_name: fileName,
      file_size: file.size,
      file_url: fileUrl,
      download_count: 0,
      status: 'completed',
      total_records: dataset.length,
      processed_records: dataset.length,
      include_headers: input.include_headers !== false,
      compress: input.compress ?? false,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      expires_at: expiresAt,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapExport(data);
};

export const deleteExport = async (id: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('exports')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const incrementExportDownload = async (id: string, currentCount: number): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('exports')
    .update({ download_count: currentCount + 1 })
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const getExportStats = async () => {
  const exportsList = await getExports();
  return {
    total: exportsList.length,
    completed: exportsList.filter((item) => item.status === 'completed').length,
    processing: exportsList.filter((item) => ['processing', 'pending'].includes(item.status)).length,
    totalDownloads: exportsList.reduce((sum, item) => sum + item.download_count, 0),
  };
};
