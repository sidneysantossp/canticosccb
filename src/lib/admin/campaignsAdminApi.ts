import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete } from '@/lib/supabaseRest';

const CAMPAIGNS_TABLE = (import.meta.env.VITE_CAMPAIGNS_TABLE ?? 'campaigns').trim();

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled' | 'completed';
export type CampaignAudience = 'all' | 'premium' | 'free' | 'inactive' | 'new' | 'custom';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  campaign_type: 'email' | 'sms' | 'push' | 'banner' | 'social' | 'multi-channel';
  target_audience: CampaignAudience;
  subject?: string;
  scheduled_at?: string;
  sent_at?: string;
  status: CampaignStatus;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  converted_count: number;
  budget?: number;
  spent: number;
  revenue_generated: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CampaignFilters {
  status?: CampaignStatus;
  targetAudience?: CampaignAudience;
  search?: string;
  limit?: number;
  offset?: number;
  order?: string;
}

export interface CampaignInput {
  name: string;
  description?: string;
  campaign_type: Campaign['campaign_type'];
  target_audience: CampaignAudience;
  subject?: string;
  scheduled_at?: string;
  status?: CampaignStatus;
  budget?: number;
  tags?: string[];
  sent_count?: number;
  delivered_count?: number;
  opened_count?: number;
  clicked_count?: number;
  converted_count?: number;
  spent?: number;
  revenue_generated?: number;
}

const toCampaign = (row: any): Campaign => ({
  id: row?.id ? String(row.id) : '',
  name: row?.name || '',
  description: row?.description || row?.descricao || undefined,
  campaign_type: row?.campaign_type || row?.tipo || 'email',
  target_audience: row?.target_audience || row?.publico || 'all',
  subject: row?.subject || row?.assunto || undefined,
  scheduled_at: row?.scheduled_at || row?.scheduled_for || undefined,
  sent_at: row?.sent_at || undefined,
  status: row?.status || 'draft',
  sent_count: Number(row?.sent_count ?? row?.enviados ?? 0),
  delivered_count: Number(row?.delivered_count ?? row?.entregues ?? 0),
  opened_count: Number(row?.opened_count ?? row?.abertos ?? 0),
  clicked_count: Number(row?.clicked_count ?? row?.cliques ?? 0),
  converted_count: Number(row?.converted_count ?? row?.conversoes ?? 0),
  budget: row?.budget ?? row?.orcamento ?? undefined,
  spent: Number(row?.spent ?? row?.gasto ?? 0),
  revenue_generated: Number(row?.revenue_generated ?? row?.receita ?? 0),
  tags: Array.isArray(row?.tags) ? row.tags : [],
  created_at: row?.created_at || row?.created_at || new Date().toISOString(),
  updated_at: row?.updated_at || row?.updated_at || new Date().toISOString(),
});

const buildFilters = (params?: CampaignFilters): Record<string, string> => {
  const filters: Record<string, string> = {
    select: '*',
    order: params?.order || 'created_at.desc'
  };

  if (params?.status) filters.status = `eq.${params.status}`;
  if (params?.targetAudience) filters.target_audience = `eq.${params.targetAudience}`;
  if (params?.limit) filters.limit = String(params.limit);
  if (params?.offset) filters.offset = String(params.offset);
  if (params?.search) {
    filters.or = `(name.ilike.%${params.search}%,description.ilike.%${params.search}%)`;
  }

  return filters;
};

const prepareInsertPayload = (data: CampaignInput) => ({
  name: data.name,
  description: data.description ?? null,
  campaign_type: data.campaign_type,
  target_audience: data.target_audience,
  subject: data.subject ?? null,
  scheduled_at: data.scheduled_at ?? null,
  status: data.status ?? 'draft',
  budget: data.budget ?? 0,
  tags: data.tags ?? [],
  sent_count: data.sent_count ?? 0,
  delivered_count: data.delivered_count ?? 0,
  opened_count: data.opened_count ?? 0,
  clicked_count: data.clicked_count ?? 0,
  converted_count: data.converted_count ?? 0,
  spent: data.spent ?? 0,
  revenue_generated: data.revenue_generated ?? 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

const prepareUpdatePayload = (data: Partial<CampaignInput>) => {
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.campaign_type !== undefined) payload.campaign_type = data.campaign_type;
  if (data.target_audience !== undefined) payload.target_audience = data.target_audience;
  if (data.subject !== undefined) payload.subject = data.subject;
  if (data.scheduled_at !== undefined) payload.scheduled_at = data.scheduled_at;
  if (data.status !== undefined) payload.status = data.status;
  if (data.budget !== undefined) payload.budget = data.budget;
  if (data.tags !== undefined) payload.tags = data.tags;
  if (data.sent_count !== undefined) payload.sent_count = data.sent_count;
  if (data.delivered_count !== undefined) payload.delivered_count = data.delivered_count;
  if (data.opened_count !== undefined) payload.opened_count = data.opened_count;
  if (data.clicked_count !== undefined) payload.clicked_count = data.clicked_count;
  if (data.converted_count !== undefined) payload.converted_count = data.converted_count;
  if (data.spent !== undefined) payload.spent = data.spent;
  if (data.revenue_generated !== undefined) payload.revenue_generated = data.revenue_generated;

  return payload;
};

const tableName = CAMPAIGNS_TABLE || 'campaigns';

export const getAllCampaigns = async (params?: CampaignFilters): Promise<Campaign[]> => {
  try {
    const filters = buildFilters(params);
    const rows = await supabaseFetch<any>(tableName, filters);
    return rows.map(toCampaign);
  } catch (error) {
    console.error('[campaignsAdminApi] getAllCampaigns failed:', error);
    return [];
  }
};

export const getCampaignById = async (id: string): Promise<Campaign | null> => {
  try {
    const rows = await supabaseFetch<any>(tableName, {
      id: `eq.${id}`,
      select: '*',
      limit: '1'
    });
    if (rows.length === 0) return null;
    return toCampaign(rows[0]);
  } catch (error) {
    console.error('[campaignsAdminApi] getCampaignById failed:', error);
    return null;
  }
};

export const createCampaign = async (data: CampaignInput): Promise<Campaign | null> => {
  try {
    const payload = prepareInsertPayload(data);
    const created = await supabaseInsert<any>(tableName, payload);
    return created ? toCampaign(created) : null;
  } catch (error) {
    console.error('[campaignsAdminApi] createCampaign failed:', error);
    return null;
  }
};

export const updateCampaign = async (id: string, data: Partial<CampaignInput>): Promise<Campaign | null> => {
  try {
    const payload = prepareUpdatePayload(data);
    const updated = await supabaseUpdate<any>(tableName, { id: `eq.${id}` }, payload);
    if (updated.length === 0) return null;
    return toCampaign(updated[0]);
  } catch (error) {
    console.error('[campaignsAdminApi] updateCampaign failed:', error);
    return null;
  }
};

export const deleteCampaign = async (id: string): Promise<boolean> => {
  try {
    return await supabaseDelete(tableName, { id: `eq.${id}` });
  } catch (error) {
    console.error('[campaignsAdminApi] deleteCampaign failed:', error);
    return false;
  }
};

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
