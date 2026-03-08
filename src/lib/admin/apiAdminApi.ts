import { supabase } from '@/lib/supabase-auth';

export interface ApiKeyRecord {
  id: string;
  name: string;
  description?: string;
  key: string;
  key_prefix: string;
  key_type: 'secret' | 'public';
  permissions: string[];
  allowed_endpoints: string[];
  allowed_methods: string[];
  rate_limit_per_minute?: number | null;
  rate_limit_per_hour?: number | null;
  rate_limit_per_day?: number | null;
  allowed_ips: string[];
  is_active: boolean;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  last_used_at?: string;
  last_ip?: string;
  expires_at?: string;
  environment: 'production' | 'testing';
  created_at: string;
}

export interface CreateApiKeyInput {
  name: string;
  description?: string;
  scopes: string[];
  rate_limit?: number | null;
  ip_whitelist?: string;
  expires_at?: string;
  is_active: boolean;
  environment?: 'production' | 'testing';
}

const mapApiKey = (row: any): ApiKeyRecord => ({
  id: String(row.id),
  name: row.name || '',
  description: row.description || undefined,
  key: row.key || '',
  key_prefix: row.key_prefix || '',
  key_type: row.key_type || 'secret',
  permissions: Array.isArray(row.permissions) ? row.permissions : [],
  allowed_endpoints: Array.isArray(row.allowed_endpoints) ? row.allowed_endpoints : [],
  allowed_methods: Array.isArray(row.allowed_methods) ? row.allowed_methods : [],
  rate_limit_per_minute: row.rate_limit_per_minute ?? null,
  rate_limit_per_hour: row.rate_limit_per_hour ?? null,
  rate_limit_per_day: row.rate_limit_per_day ?? null,
  allowed_ips: Array.isArray(row.allowed_ips) ? row.allowed_ips : [],
  is_active: row.is_active !== false,
  total_requests: Number(row.total_requests || 0),
  successful_requests: Number(row.successful_requests || 0),
  failed_requests: Number(row.failed_requests || 0),
  last_used_at: row.last_used_at || undefined,
  last_ip: row.last_ip || undefined,
  expires_at: row.expires_at || undefined,
  environment: row.environment || 'production',
  created_at: row.created_at || new Date().toISOString(),
});

const generateSecretKey = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const token = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  return `ck_live_${token}`;
};

export const maskApiKey = (key: string) => {
  if (!key) return '';
  if (key.length <= 10) return key;
  return `${key.slice(0, 10)}...${key.slice(-4)}`;
};

export const getApiKeys = async (): Promise<ApiKeyRecord[]> => {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapApiKey);
};

export const createApiKey = async (
  input: CreateApiKeyInput
): Promise<{ success: boolean; apiKey?: ApiKeyRecord }> => {
  const rawKey = generateSecretKey();
  const allowedIps = input.ip_whitelist
    ? input.ip_whitelist
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const rateLimit = input.rate_limit ?? null;
  const payload = {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    key: rawKey,
    key_prefix: rawKey.slice(0, 10),
    key_type: 'secret',
    permissions: input.scopes,
    allowed_endpoints: [],
    allowed_methods: input.scopes.includes('write') || input.scopes.includes('delete')
      ? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
      : ['GET'],
    rate_limit_per_minute: rateLimit,
    rate_limit_per_hour: rateLimit ? rateLimit * 60 : null,
    rate_limit_per_day: rateLimit ? rateLimit * 60 * 24 : null,
    allowed_ips: allowedIps,
    is_active: input.is_active,
    total_requests: 0,
    successful_requests: 0,
    failed_requests: 0,
    expires_at: input.expires_at || null,
    environment: input.environment || 'production',
    metadata: {
      created_via_admin: true,
    },
  };

  const { data, error } = await supabase
    .from('api_keys')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return { success: true, apiKey: mapApiKey(data) };
};

export const updateApiKey = async (
  id: string,
  data: Partial<CreateApiKeyInput>
): Promise<{ success: boolean }> => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.description !== undefined) payload.description = data.description?.trim() || null;
  if (data.scopes !== undefined) payload.permissions = data.scopes;
  if (data.rate_limit !== undefined) {
    payload.rate_limit_per_minute = data.rate_limit;
    payload.rate_limit_per_hour = data.rate_limit ? data.rate_limit * 60 : null;
    payload.rate_limit_per_day = data.rate_limit ? data.rate_limit * 60 * 24 : null;
  }
  if (data.ip_whitelist !== undefined) {
    payload.allowed_ips = data.ip_whitelist
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (data.expires_at !== undefined) payload.expires_at = data.expires_at || null;
  if (data.is_active !== undefined) payload.is_active = data.is_active;
  if (data.environment !== undefined) payload.environment = data.environment;

  const { error } = await supabase
    .from('api_keys')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const toggleApiKeyStatus = async (id: string, is_active: boolean): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active })
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const deleteApiKey = async (id: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};
