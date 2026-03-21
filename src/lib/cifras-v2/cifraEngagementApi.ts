import { supabase } from '@/lib/supabase-auth';
import type { CifraReport, CifraReportStatus, CifraReportType } from '@/types/cifras-v2';

import { mapCifraReportRow } from './mappers';

const SESSION_STORAGE_KEY = 'cifra-v2-session-key';
const VIEW_DEDUP_PREFIX = 'cifra-v2-view:';
const pendingViewEvents = new Set<string>();

export interface CifraEngagementSnapshot {
  versionId: string;
  viewsCount: number;
  sharesCount: number;
  printsCount: number;
  favoritesCount: number;
  reportsCount: number;
  openReportsCount: number;
  lastInteractionAt?: string | null;
  isFavorited: boolean;
}

export interface SubmitCifraReportInput {
  versionId: string;
  reportType: CifraReportType;
  message: string;
  reporterEmail?: string | null;
  reporterUserId?: string | null;
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

function getSessionKey() {
  if (!canUseStorage()) {
    return `server-${Date.now()}`;
  }

  let sessionKey = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionKey) {
    sessionKey = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionKey);
  }
  return sessionKey;
}

function getViewDedupKey(versionId: string) {
  return `${VIEW_DEDUP_PREFIX}${versionId}`;
}

function readMetricsRow(row: any) {
  return {
    versionId: String(row?.id || ''),
    viewsCount: Number(row?.views_count || 0),
    sharesCount: Number(row?.shares_count || 0),
    printsCount: Number(row?.prints_count || 0),
    favoritesCount: Number(row?.favorites_count || 0),
    reportsCount: Number(row?.reports_count || 0),
    openReportsCount: Number(row?.open_reports_count || 0),
    lastInteractionAt: row?.last_interaction_at || null,
  };
}

export async function fetchCifraEngagementSnapshot(versionId: string, userId?: string | null): Promise<CifraEngagementSnapshot> {
  const [metricsResult, favoriteResult] = await Promise.all([
    supabase
      .from('cifra_versions')
      .select('*')
      .eq('id', versionId)
      .limit(1)
      .maybeSingle(),
    userId
      ? supabase
          .from('cifra_favorites')
          .select('id')
          .eq('version_id', versionId)
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (metricsResult.error && metricsResult.error.code !== 'PGRST116') {
    throw metricsResult.error;
  }

  if (favoriteResult.error && favoriteResult.error.code !== 'PGRST116') {
    throw favoriteResult.error;
  }

  const metrics = readMetricsRow(metricsResult.data);

  return {
    ...metrics,
    versionId,
    isFavorited: Boolean(favoriteResult.data?.id),
  };
}

export async function fetchCifraEngagementSnapshots(versionIds: string[]): Promise<Record<string, CifraEngagementSnapshot>> {
  const uniqueIds = Array.from(new Set(versionIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('cifra_versions')
    .select('*')
    .in('id', uniqueIds);

  if (error) {
    throw error;
  }

  return (data || []).reduce<Record<string, CifraEngagementSnapshot>>((accumulator, row: any) => {
    const metrics = readMetricsRow(row);
    accumulator[metrics.versionId] = {
      ...metrics,
      isFavorited: false,
    };
    return accumulator;
  }, {});
}

export async function trackCifraUsageEvent(
  versionId: string,
  eventType: 'view' | 'share' | 'print',
  options: {
    userId?: string | null;
    metadata?: Record<string, unknown>;
    dedupeInSession?: boolean;
  } = {},
): Promise<boolean> {
  const dedupeKey = eventType === 'view' ? getViewDedupKey(versionId) : null;

  if (eventType === 'view' && options.dedupeInSession !== false && canUseStorage()) {
    if (dedupeKey && (pendingViewEvents.has(dedupeKey) || sessionStorage.getItem(dedupeKey) === '1')) {
      return false;
    }
  }

  if (dedupeKey) {
    pendingViewEvents.add(dedupeKey);
  }

  const payload = {
    version_id: versionId,
    event_type: eventType,
    session_key: getSessionKey(),
    user_id: options.userId || null,
    metadata: options.metadata || {},
  };

  const { error } = await supabase.from('cifra_usage_events').insert(payload);
  try {
    if (error) {
      throw error;
    }

    if (eventType === 'view' && options.dedupeInSession !== false && canUseStorage() && dedupeKey) {
      sessionStorage.setItem(dedupeKey, '1');
    }
  } finally {
    if (dedupeKey) {
      pendingViewEvents.delete(dedupeKey);
    }
  }

  return true;
}

export async function addCifraFavorite(versionId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('cifra_favorites')
    .insert({
      version_id: versionId,
      user_id: userId,
    });

  if (error && error.code !== '23505') {
    throw error;
  }

  return true;
}

export async function removeCifraFavorite(versionId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('cifra_favorites')
    .delete()
    .eq('version_id', versionId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return true;
}

export async function submitCifraReport(input: SubmitCifraReportInput): Promise<CifraReport | null> {
  const { data, error } = await supabase
    .from('cifra_reports')
    .insert({
      version_id: input.versionId,
      report_type: input.reportType,
      message: input.message,
      reporter_email: input.reporterEmail || null,
      reporter_user_id: input.reporterUserId || null,
    })
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapCifraReportRow(data) : null;
}

export async function fetchCifraReportsByVersion(versionId: string): Promise<CifraReport[]> {
  const { data, error } = await supabase
    .from('cifra_reports')
    .select('*')
    .eq('version_id', versionId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(mapCifraReportRow);
}

export async function updateCifraReportStatus(reportId: string, status: CifraReportStatus): Promise<void> {
  const { error } = await supabase
    .from('cifra_reports')
    .update({ status })
    .eq('id', reportId);

  if (error) {
    throw error;
  }
}
