import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete } from '@/lib/supabaseRest';

export interface Report {
  id: string;
  type: 'song' | 'user' | 'comment' | 'playlist';
  title: string;
  reporter: string;
  reporter_id?: string;
  reason: string;
  status: 'open' | 'in_review' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high';
  date: string;
  description?: string;
  target_id?: string;
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// Mapeamento de campos Supabase para interface Report
const mapReportData = (data: any): Report => ({
  id: String(data.id),
  type: data.tipo || data.type || 'song',
  title: data.titulo || data.title || '',
  reporter: data.denunciante || data.reporter || 'Anônimo',
  reporter_id: data.denunciante_id || data.reporter_id,
  reason: data.motivo || data.reason || '',
  status: data.status || 'open',
  priority: data.prioridade || data.priority || 'medium',
  date: data.data || data.date || data.created_at,
  description: data.descricao || data.description,
  target_id: data.alvo_id || data.target_id,
  resolution: data.resolucao || data.resolution,
  resolved_by: data.resolvido_por || data.resolved_by,
  resolved_at: data.resolvido_em || data.resolved_at,
  created_at: data.created_at || new Date().toISOString(),
  updated_at: data.updated_at || new Date().toISOString()
});

export const getAll = async (filters?: { status?: string; type?: string; priority?: string }) => {
  try {
    const queryFilters: Record<string, string> = {
      select: '*',
      order: 'created_at.desc'
    };

    if (filters?.status && filters.status !== 'all') {
      queryFilters.status = `eq.${filters.status}`;
    }
    if (filters?.type && filters.type !== 'all') {
      queryFilters.tipo = `eq.${filters.type}`;
    }
    if (filters?.priority && filters.priority !== 'all') {
      queryFilters.prioridade = `eq.${filters.priority}`;
    }

    const rows = await supabaseFetch<any>('reports', queryFilters);
    return rows.map(mapReportData);
  } catch (error) {
    console.error('❌ [reportsAdminApi.getAll] Error:', error);
    return [];
  }
};

export const getById = async (id: string) => {
  try {
    const rows = await supabaseFetch<any>('reports', {
      id: `eq.${id}`,
      select: '*',
      limit: '1'
    });
    return rows.length > 0 ? mapReportData(rows[0]) : null;
  } catch (error) {
    console.error('❌ [reportsAdminApi.getById] Error:', error);
    return null;
  }
};

export const create = async (data: Partial<Report>) => {
  try {
    const insertData = {
      tipo: data.type || 'song',
      titulo: data.title || '',
      denunciante: data.reporter || 'Anônimo',
      denunciante_id: data.reporter_id,
      motivo: data.reason || '',
      status: data.status || 'open',
      prioridade: data.priority || 'medium',
      descricao: data.description,
      alvo_id: data.target_id
    };

    await supabaseInsert('reports', insertData);
    return { success: true };
  } catch (error) {
    console.error('❌ [reportsAdminApi.create] Error:', error);
    return { success: false };
  }
};

export const update = async (id: string, data: Partial<Report>) => {
  try {
    const updateData: any = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.prioridade = data.priority;
    if (data.resolution !== undefined) updateData.resolucao = data.resolution;
    if (data.resolved_by !== undefined) updateData.resolvido_por = data.resolved_by;
    if (data.resolved_at !== undefined) updateData.resolvido_em = data.resolved_at;

    updateData.updated_at = new Date().toISOString();

    await supabaseUpdate('reports', { id: `eq.${id}` }, updateData);
    return { success: true };
  } catch (error) {
    console.error('❌ [reportsAdminApi.update] Error:', error);
    return { success: false };
  }
};

export const deleteItem = async (id: string) => {
  try {
    await supabaseDelete('reports', { id: `eq.${id}` });
    return { success: true };
  } catch (error) {
    console.error('❌ [reportsAdminApi.deleteItem] Error:', error);
    return { success: false };
  }
};

export const getOpenReports = async () => {
  return getAll({ status: 'open' });
};

export const resolveReport = async (id: string, resolution: string, resolvedBy: string) => {
  return update(id, {
    status: 'resolved',
    resolution,
    resolved_by: resolvedBy,
    resolved_at: new Date().toISOString()
  });
};

export const dismissReport = async (id: string, reason: string) => {
  return update(id, {
    status: 'dismissed',
    resolution: reason
  });
};

// Stubs para funcionalidades futuras
export const getSiteSettings = async (..._args: any[]) => ({});
export const updateSiteSettings = async (..._args: any[]) => ({ success: true });
export const getComments = async (..._args: any[]) => [];
export const deleteComment = async (..._args: any[]) => ({ success: true });
export const approveComment = async (..._args: any[]) => ({ success: true });
export const getClaims = async (..._args: any[]) => [];
export const getCopyrightClaims = async (..._args: any[]) => [];
export const updateClaim = async (..._args: any[]) => ({ success: true });
export const getRoyalties = async (..._args: any[]) => [];
export const processPayment = async (..._args: any[]) => ({ success: true });
export const getAllPlaylists = async (..._args: any[]) => [];
export const createPlaylist = async (..._args: any[]) => ({ success: true });
export const updatePlaylist = async (..._args: any[]) => ({ success: true });
export const deletePlaylist = async (..._args: any[]) => ({ success: true });

export type SiteSettings = any;
export type Comment = any;
export type Claim = any;
export type CopyrightClaim = any;
export type Royalty = any;
export type Playlist = any;
