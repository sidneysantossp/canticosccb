import { supabaseFetch, supabaseInsert, supabaseUpdate } from '@/lib/supabaseRest';

export interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  max_downloads: number;
  created_at: string;
}

export interface PremiumUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  plan_id: string;
  plan_name: string;
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  payment_method: string;
}

export interface PremiumSettings {
  trial_period_days: number;
  allow_plan_changes: boolean;
  prorate_charges: boolean;
  send_expiry_reminders: boolean;
  reminder_days_before: number[];
}

const PREMIUM_ENABLED_KEY = 'premium_enabled_flag_v1';
const PREMIUM_ENABLED_COOKIE = 'premium_enabled';

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

async function fetchPremiumUsersFromDB(): Promise<PremiumUser[]> {
  const rows = await supabaseFetch<any>('users', {
    select: 'id,email,name,plan,status,is_blocked,created_at,updated_at',
    plan: 'eq.premium',
    order: 'created_at.desc',
    limit: '1000',
  });

  return (rows || []).map((user: any) => ({
    id: String(user.id),
    user_id: String(user.id),
    name: user.name || user.email?.split('@')[0] || 'Usuário',
    email: user.email || '',
    plan_id: 'premium',
    plan_name: 'Premium',
    status: user.is_blocked || user.status === 'inactive' ? 'cancelled' : 'active',
    start_date: user.created_at || new Date().toISOString(),
    end_date: user.updated_at || user.created_at || new Date().toISOString(),
    auto_renew: false,
    payment_method: 'Indisponível',
  }));
}

export const getPremiumVisibility = async (): Promise<boolean> => {
  try {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(PREMIUM_ENABLED_KEY) : null;
    if (cached !== null) {
      fetchPremiumVisibilityFromDB().catch(() => {});
      return cached === '1' || cached === 'true';
    }

    return await fetchPremiumVisibilityFromDB();
  } catch {
    return false;
  }
};

async function fetchPremiumVisibilityFromDB(): Promise<boolean> {
  try {
    const rows = await supabaseFetch<any>('site_config', {
      config_key: 'eq.premium_enabled',
      select: 'config_value',
      limit: '1',
    });
    const value = rows.length > 0 ? rows[0].config_value : 'false';
    const enabled = value === 'true' || value === '1';

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PREMIUM_ENABLED_KEY, enabled ? '1' : '0');
    }

    return enabled;
  } catch {
    return false;
  }
}

export const setPremiumVisibility = async (enabled: boolean): Promise<void> => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PREMIUM_ENABLED_KEY, enabled ? '1' : '0');
    }
    setCookie(PREMIUM_ENABLED_COOKIE, enabled ? '1' : '0');

    const existing = await supabaseFetch<any>('site_config', {
      config_key: 'eq.premium_enabled',
      select: 'id',
      limit: '1',
    });

    if (existing.length > 0) {
      await supabaseUpdate('site_config', { config_key: 'eq.premium_enabled' }, { config_value: String(enabled) });
    } else {
      await supabaseInsert('site_config', { config_key: 'premium_enabled', config_value: String(enabled) });
    }
  } catch (error) {
    console.error('[setPremiumVisibility] Error:', error);
  }
};

export const getPremiumPlans = async (): Promise<PremiumPlan[]> => {
  return [];
};

export const getPremiumUsers = async (): Promise<PremiumUser[]> => {
  return fetchPremiumUsersFromDB();
};

export const getPremiumStats = async (): Promise<{ totalRevenue: number; activeSubscribers: number; totalPlans: number; conversionRate: number }> => {
  const [premiumUsers, allUsers] = await Promise.all([
    fetchPremiumUsersFromDB(),
    supabaseFetch<any>('users', {
      select: 'id',
      limit: '1000',
    }),
  ]);

  const activeSubscribers = premiumUsers.filter((user) => user.status === 'active').length;
  const totalUsers = allUsers.length;
  const conversionRate = totalUsers > 0 ? Number(((activeSubscribers / totalUsers) * 100).toFixed(1)) : 0;

  return {
    totalRevenue: 0,
    activeSubscribers,
    totalPlans: 0,
    conversionRate,
  };
};

export const getPlanById = async (_id: string): Promise<PremiumPlan | null> => {
  return null;
};

export const createPlan = async (_data: Partial<PremiumPlan>): Promise<{ success: boolean; plan?: PremiumPlan }> => {
  return { success: false };
};

export const updatePlan = async (_id: string, _data: Partial<PremiumPlan>): Promise<{ success: boolean }> => {
  return { success: false };
};

export const deletePlan = async (_id: string): Promise<{ success: boolean }> => {
  return { success: false };
};

export const deletePremiumPlan = deletePlan;

export const togglePlanStatus = async (_id: string, _forceActive?: boolean): Promise<{ success: boolean }> => {
  return { success: false };
};

export const cancelUserSubscription = async (id: string): Promise<{ success: boolean }> => {
  try {
    const result = await supabaseUpdate<any>('users', { id: `eq.${id}` }, { plan: 'free' });
    return { success: Array.isArray(result) && result.length > 0 };
  } catch (error) {
    console.error('[cancelUserSubscription] Error:', error);
    return { success: false };
  }
};

export const extendUserSubscription = async (_id: string, _days: number): Promise<{ success: boolean }> => {
  return { success: false };
};

export const processRefund = async (_id: string): Promise<{ success: boolean }> => {
  return { success: false };
};

export const getPremiumSettings = async (): Promise<PremiumSettings> => {
  return {
    trial_period_days: 0,
    allow_plan_changes: false,
    prorate_charges: false,
    send_expiry_reminders: false,
    reminder_days_before: [],
  };
};

export const updatePremiumSettings = async (_data: Partial<PremiumSettings>): Promise<{ success: boolean }> => {
  return { success: false };
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
