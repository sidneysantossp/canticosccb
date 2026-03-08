import { supabase } from '@/lib/supabase-auth';
import { downloadTextFile } from '@/lib/admin/adminTableUtils';
import { getAnalyticsSummary, getTopSongs } from '@/lib/admin/analyticsAdminApi';

export interface ReportData {
  title: string;
  type: 'table' | 'chart' | 'summary';
  dateRange: {
    start: string;
    end: string;
  };
  data: any[];
  summary?: {
    total: number;
    average: number;
    growth: number;
  };
}

const toCsv = (rows: any[]) => {
  if (rows.length === 0) return '';
  const headers = Array.from(
    rows.reduce<Set<string>>((acc, row) => {
      Object.keys(row || {}).forEach((key) => acc.add(key));
      return acc;
    }, new Set<string>())
  );

  return [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((header) => `"${String(row?.[header] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
};

const getRange = (config: any) => ({
  start: config?.dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  end: config?.dateRange?.end || new Date().toISOString().split('T')[0],
});

const summaryFromRows = (
  rows: any[],
  metric: string | ((row: any) => number)
): ReportData['summary'] => {
  const values = rows.map((row) => {
    if (typeof metric === 'function') {
      return Number(metric(row) || 0);
    }

    return Number(row?.[metric] || 0);
  });
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    total,
    average: rows.length > 0 ? total / rows.length : 0,
    growth: 0,
  };
};

export const generateReportData = async (config: any): Promise<ReportData> => {
  const dateRange = getRange(config);
  const startIso = new Date(`${dateRange.start}T00:00:00`).toISOString();
  const endIso = new Date(`${dateRange.end}T23:59:59`).toISOString();

  switch (config.template) {
    case 'songs-performance': {
      const topSongs = await getTopSongs(50);
      return {
        title: config.name || 'Performance de Hinos',
        type: config.type || 'table',
        dateRange,
        data: topSongs.map((song, index) => ({
          posicao: index + 1,
          titulo: song.title,
          compositor: song.composer_name,
          plays: song.plays_count,
          likes: song.likes_count,
        })),
        summary: summaryFromRows(topSongs, 'plays_count'),
      };
    }
    case 'user-engagement': {
      const { data, error } = await supabase
        .from('users')
        .select('id,name,email,plan,status,created_at,last_seen_at')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = data || [];
      return {
        title: config.name || 'Engajamento de Usuários',
        type: config.type || 'table',
        dateRange,
        data: rows.map((row: any) => ({
          nome: row.name || 'Usuário',
          email: row.email || '',
          plano: row.plan || 'free',
          status: row.status || 'active',
          criado_em: row.created_at,
          ultimo_acesso: row.last_seen_at || '',
        })),
        summary: summaryFromRows(rows, () => 1),
      };
    }
    case 'content-analytics': {
      const [hinosRes, albumsRes, playlistsRes] = await Promise.all([
        supabase.from('hinos').select('id,categoria,plays_count,plays,likes_count,likes'),
        supabase.from('albums').select('id,genre,featured,featured_order'),
        supabase.from('playlists').select('id,is_public,created_at'),
      ]);

      if (hinosRes.error) throw hinosRes.error;
      if (albumsRes.error) throw albumsRes.error;
      if (playlistsRes.error) throw playlistsRes.error;

      const songsByCategory = (hinosRes.data || []).reduce<Record<string, { hinos: number; plays: number; likes: number }>>(
        (acc, row: any) => {
          const key = row.categoria || 'Sem categoria';
          acc[key] = acc[key] || { hinos: 0, plays: 0, likes: 0 };
          acc[key].hinos += 1;
          acc[key].plays += Number(row.plays_count || row.plays || 0);
          acc[key].likes += Number(row.likes_count || row.likes || 0);
          return acc;
        },
        {}
      );

      const rows = Object.entries(songsByCategory).map(([categoria, values]) => ({
        categoria,
        hinos: values.hinos,
        plays: values.plays,
        likes: values.likes,
        albuns: (albumsRes.data || []).filter((album: any) => album.genre === categoria).length,
        playlists_publicas: (playlistsRes.data || []).filter((playlist: any) => playlist.is_public).length,
      }));

      return {
        title: config.name || 'Analytics de Conteúdo',
        type: config.type || 'table',
        dateRange,
        data: rows,
        summary: summaryFromRows(rows, 'plays'),
      };
    }
    case 'growth-metrics': {
      const [usersRes, composersRes, hymnsRes] = await Promise.all([
        supabase.from('users').select('id,created_at').gte('created_at', startIso).lte('created_at', endIso),
        supabase.from('composers').select('id,created_at').gte('created_at', startIso).lte('created_at', endIso),
        supabase.from('hinos').select('id,created_at').gte('created_at', startIso).lte('created_at', endIso),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (composersRes.error) throw composersRes.error;
      if (hymnsRes.error) throw hymnsRes.error;

      const rows = [
        { indicador: 'Novos usuários', total: (usersRes.data || []).length },
        { indicador: 'Novos compositores', total: (composersRes.data || []).length },
        { indicador: 'Novos hinos', total: (hymnsRes.data || []).length },
      ];

      return {
        title: config.name || 'Métricas de Crescimento',
        type: config.type || 'summary',
        dateRange,
        data: rows,
        summary: summaryFromRows(rows, 'total'),
      };
    }
    case 'playlist-stats': {
      const { data, error } = await supabase
        .from('playlists')
        .select('id,name,user_id,is_public,created_at')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = (data || []).map((row: any) => ({
        nome: row.name || 'Playlist',
        proprietario: row.user_id || '',
        publica: row.is_public ? 'Sim' : 'Nao',
        criada_em: row.created_at,
      }));

      return {
        title: config.name || 'Estatísticas de Playlists',
        type: config.type || 'table',
        dateRange,
        data: rows,
        summary: summaryFromRows(rows, () => 1),
      };
    }
    case 'favorites-analysis':
    default: {
      const summary = await getAnalyticsSummary();
      const rows = [
        { indicador: 'Total de curtidas', total: summary.totalLikes },
        { indicador: 'Total de plays', total: summary.totalPlays },
        { indicador: 'Total de usuários', total: summary.totalUsers },
        { indicador: 'Total de hinos', total: summary.totalSongs },
      ];

      return {
        title: config.name || 'Análise de Favoritos',
        type: config.type || 'summary',
        dateRange,
        data: rows,
        summary: summaryFromRows(rows, 'total'),
      };
    }
  }
};

export const exportToCSV = (data: ReportData, filename = 'report.csv'): void => {
  downloadTextFile(toCsv(data.data), filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv;charset=utf-8;');
};

export const exportToExcel = (data: ReportData, filename = 'report.xlsx'): void => {
  // Excel abre CSV corretamente em grande parte dos fluxos internos do admin.
  exportToCSV(data, filename.replace(/\.xlsx?$/i, '') + '.csv');
};

export const exportToPDF = (data: ReportData, filename = 'report.pdf'): void => {
  const content = [data.title, '', ...data.data.map((row) => JSON.stringify(row))].join('\n');
  downloadTextFile(content, filename.replace(/\.pdf$/i, '') + '.txt');
};

export const getAllReports = async () => [];
export const getReportById = async () => null;
export const createReport = async () => ({ success: false });
export const updateReport = async () => ({ success: false });
export const deleteReport = async () => ({ success: false });
export const runReport = async () => ({ data: [] });
export type CustomReport = any;
