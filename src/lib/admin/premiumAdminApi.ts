// Mock implementation - Replace with real Supabase queries when backend is ready

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

// Mock database
const STORAGE_KEY = 'premium_plans_storage_v1';
const PREMIUM_ENABLED_KEY = 'premium_enabled_flag_v1';
const PREMIUM_ENABLED_COOKIE = 'premium_enabled';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export const getPremiumVisibility = async (): Promise<boolean> => {
  try {
    // Try localStorage cache first for fast reads
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(PREMIUM_ENABLED_KEY) : null;
    if (cached !== null) {
      // Also fetch from DB in background to keep cache fresh
      fetchPremiumVisibilityFromDB().catch(() => {});
      return cached === '1' || cached === 'true';
    }
    // Fallback: fetch from site_config
    return await fetchPremiumVisibilityFromDB();
  } catch {
    return false;
  }
};

async function fetchPremiumVisibilityFromDB(): Promise<boolean> {
  try {
    const { supabaseFetch } = await import('@/lib/supabaseRest');
    const rows = await supabaseFetch<any>('site_config', {
      config_key: 'eq.premium_enabled',
      select: 'config_value',
      limit: '1',
    });
    const val = rows.length > 0 ? rows[0].config_value : 'false';
    const enabled = val === 'true' || val === '1';
    // Update local cache
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
    // Update localStorage cache
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PREMIUM_ENABLED_KEY, enabled ? '1' : '0');
    }
    setCookie(PREMIUM_ENABLED_COOKIE, enabled ? '1' : '0');

    // Persist to site_config in Supabase
    const { supabaseFetch, supabaseUpdate, supabaseInsert } = await import('@/lib/supabaseRest');
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
  } catch (err) {
    console.error('[setPremiumVisibility] Error persisting to site_config:', err);
  }
};

function loadPlansFromStorage(): PremiumPlan[] | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PremiumPlan[];
    return null;
  } catch {
    return null;
  }
}

function savePlansToStorage(plans: PremiumPlan[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    }
  } catch {}
}

let mockPlans: PremiumPlan[] = [
  {
    id: '1',
    name: 'Premium Mensal',
    description: 'Acesso premium com renovação mensal',
    price: 19.90,
    interval: 'monthly',
    features: ['Downloads ilimitados', 'Sem anúncios', 'Qualidade HD', 'Acesso offline'],
    is_active: true,
    is_popular: false,
    max_downloads: -1,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Premium Anual',
    description: 'Acesso premium anual com desconto',
    price: 199.90,
    interval: 'yearly',
    features: ['Downloads ilimitados', 'Sem anúncios', 'Qualidade HD', 'Acesso offline', '2 meses grátis'],
    is_active: true,
    is_popular: true,
    max_downloads: -1,
    created_at: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'Premium Plus',
    description: 'Plano premium com recursos extras',
    price: 29.90,
    interval: 'monthly',
    features: ['Tudo do Premium', 'Atendimento prioritário', 'Novidades antecipadas', 'Espaço de armazenamento extra'],
    is_active: true,
    is_popular: false,
    max_downloads: -1,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const persistedPlansInit = loadPlansFromStorage();
if (persistedPlansInit) {
  mockPlans = persistedPlansInit;
}

let mockPremiumUsers: PremiumUser[] = [
  {
    id: '1',
    user_id: 'u1',
    name: 'João Silva',
    email: 'joao.silva@example.com',
    plan_id: '2',
    plan_name: 'Premium Anual',
    status: 'active',
    start_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
    auto_renew: true,
    payment_method: 'Cartão de Crédito'
  },
  {
    id: '2',
    user_id: 'u2',
    name: 'Maria Santos',
    email: 'maria.santos@example.com',
    plan_id: '1',
    plan_name: 'Premium Mensal',
    status: 'active',
    start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    auto_renew: true,
    payment_method: 'PIX'
  },
  {
    id: '3',
    user_id: 'u3',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@example.com',
    plan_id: '3',
    plan_name: 'Premium Plus',
    status: 'active',
    start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    auto_renew: false,
    payment_method: 'Cartão de Crédito'
  },
  {
    id: '4',
    user_id: 'u4',
    name: 'Ana Costa',
    email: 'ana.costa@example.com',
    plan_id: '1',
    plan_name: 'Premium Mensal',
    status: 'cancelled',
    start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    auto_renew: false,
    payment_method: 'Boleto'
  }
];

export const getPremiumPlans = async (): Promise<PremiumPlan[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  // sync with storage if it changed externally
  const persisted = loadPlansFromStorage();
  if (persisted) mockPlans = persisted;
  return [...mockPlans];
};

export const getPremiumUsers = async (): Promise<PremiumUser[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockPremiumUsers];
};

export const getPremiumStats = async (): Promise<{ totalRevenue: number; activeSubscribers: number; totalPlans: number; conversionRate: number }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const activeUsers = mockPremiumUsers.filter(u => u.status === 'active');
  const totalRevenue = activeUsers.reduce((sum, u) => {
    const plan = mockPlans.find(p => p.id === u.plan_id);
    return sum + (plan?.price || 0);
  }, 0);
  
  return {
    totalRevenue,
    activeSubscribers: activeUsers.length,
    totalPlans: mockPlans.length,
    conversionRate: 12.5
  };
};

export const getPlanById = async (id: string): Promise<PremiumPlan | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockPlans.find(p => p.id === id) || null;
};

export const createPlan = async (data: Partial<PremiumPlan>): Promise<{ success: boolean; plan?: PremiumPlan }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newPlan: PremiumPlan = {
    id: String(Date.now()),
    name: data.name || '',
    description: data.description || '',
    price: data.price || 0,
    interval: data.interval || 'monthly',
    features: data.features || [],
    is_active: data.is_active ?? true,
    is_popular: data.is_popular ?? false,
    max_downloads: data.max_downloads ?? -1,
    created_at: new Date().toISOString()
  };
  mockPlans.push(newPlan);
  savePlansToStorage(mockPlans);
  return { success: true, plan: newPlan };
};

export const updatePlan = async (id: string, data: Partial<PremiumPlan>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockPlans.findIndex(p => p.id === id);
  if (index !== -1) {
    mockPlans[index] = { ...mockPlans[index], ...data };
    savePlansToStorage(mockPlans);
    return { success: true };
  }
  return { success: false };
};

export const deletePlan = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockPlans.findIndex(p => p.id === id);
  if (index !== -1) {
    mockPlans.splice(index, 1);
    savePlansToStorage(mockPlans);
    return { success: true };
  }
  return { success: false };
};

export const deletePremiumPlan = async (id: string): Promise<{ success: boolean }> => {
  return deletePlan(id);
};

export const togglePlanStatus = async (id: string, forceActive?: boolean): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockPlans.findIndex(p => p.id === id);
  if (index !== -1) {
    if (typeof forceActive === 'boolean') mockPlans[index].is_active = !!forceActive; else mockPlans[index].is_active = !mockPlans[index].is_active;
    savePlansToStorage(mockPlans);
    return { success: true };
  }
  return { success: false };
};

export const cancelUserSubscription = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockPremiumUsers.findIndex(u => u.id === id);
  if (index !== -1) {
    mockPremiumUsers[index].status = 'cancelled';
    mockPremiumUsers[index].auto_renew = false;
    return { success: true };
  }
  return { success: false };
};

export const extendUserSubscription = async (id: string, days: number): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockPremiumUsers.findIndex(u => u.id === id);
  if (index !== -1) {
    const currentEnd = new Date(mockPremiumUsers[index].end_date);
    currentEnd.setDate(currentEnd.getDate() + days);
    mockPremiumUsers[index].end_date = currentEnd.toISOString();
    return { success: true };
  }
  return { success: false };
};

export const processRefund = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Processing refund for subscription:', id);
  return { success: true };
};

export const getPremiumSettings = async (): Promise<PremiumSettings> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    trial_period_days: 7,
    allow_plan_changes: true,
    prorate_charges: true,
    send_expiry_reminders: true,
    reminder_days_before: [7, 3, 1]
  };
};

export const updatePremiumSettings = async (data: Partial<PremiumSettings>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Updating premium settings:', data);
  return { success: true };
};

// Legacy exports for compatibility
export const getSiteSettings = async (...args: any[]) => ({});
export const updateSiteSettings = async (...args: any[]) => ({ success: true });
export const getComments = async (...args: any[]) => [];
export const deleteComment = async (...args: any[]) => ({ success: true });
export const approveComment = async (...args: any[]) => ({ success: true });
export const getClaims = async (...args: any[]) => [];
export const getCopyrightClaims = async (...args: any[]) => [];
export const updateClaim = async (...args: any[]) => ({ success: true });
export const getRoyalties = async (...args: any[]) => [];
export const processPayment = async (...args: any[]) => ({ success: true });
export const getAllPlaylists = async (...args: any[]) => [];
export const createPlaylist = async (...args: any[]) => ({ success: true });
export const updatePlaylist = async (...args: any[]) => ({ success: true });
export const deletePlaylist = async (...args: any[]) => ({ success: true });
export type SiteSettings = any;
export type Comment = any;
export type Claim = any;
export type CopyrightClaim = any;
export type Royalty = any;
export type Playlist = any;
