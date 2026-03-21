import { supabase } from './supabase-auth';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const isDebugEnabled = import.meta.env.DEV;
const debugLog = (...args: unknown[]) => {
  if (isDebugEnabled) {
    console.log(...args);
  }
};

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Debug: Log configuration status on load
if (typeof window !== 'undefined') {
  debugLog('[supabaseRest] Config check:', {
    hasUrl: Boolean(SUPABASE_URL),
    hasKey: Boolean(SUPABASE_ANON_KEY),
    isConfigured: isSupabaseConfigured,
    url: SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'MISSING',
  });
}

function buildHeaders() {
  // Anon key para leituras públicas
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

function getStoredToken(): string {
  // Leitura síncrona do localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const token = parsed?.access_token || parsed?.currentSession?.access_token;
          if (token) return token;
        }
        break;
      }
    }
  } catch (e) {
    // fallback
  }
  return SUPABASE_ANON_KEY;
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    // Considerar expirado se faltam menos de 30 segundos
    return (payload.exp * 1000) < (Date.now() + 30000);
  } catch {
    return false;
  }
}

async function buildAuthHeaders() {
  let accessToken = getStoredToken();

  // Se o token está expirado, tentar refresh via Supabase client (com timeout)
  if (accessToken !== SUPABASE_ANON_KEY && isTokenExpired(accessToken)) {
    debugLog('[supabaseRest] JWT expired, attempting refresh...');
    try {
      const refreshPromise = supabase.auth.refreshSession();
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: 'Refresh timeout (5s)' } }), 5000)
      );
      const { data, error } = await Promise.race([refreshPromise, timeoutPromise]);
      if (!error && data?.session?.access_token) {
        accessToken = data.session.access_token;
        debugLog('[supabaseRest] JWT refreshed successfully');
      } else {
        console.warn('[supabaseRest] JWT refresh failed:', error?.message);
      }
    } catch (e) {
      console.warn('[supabaseRest] JWT refresh error:', e);
    }
  }

  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

function buildUrl(table: string, params: Record<string, string> = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, value);
  });
  if (!url.searchParams.has('select')) {
    url.searchParams.set('select', '*');
  }
  return url;
}

export async function supabaseFetch<T>(table: string, params: Record<string, string> = {}): Promise<T[]> {
  if (!isSupabaseConfigured) {
    console.warn(`[supabaseFetch] Supabase not configured, returning empty array for table: ${table}`);
    return [];
  }

  const url = buildUrl(table, params);
  const cacheKey = url.toString();
  const now = Date.now();
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    debugLog(`[supabaseFetch] Cache hit for ${table}, returning ${cached.data.length} cached records`);
    return cached.data;
  }

  debugLog(`[supabaseFetch] Cache miss for ${table}, fetching:`, url.toString());

  try {
    const headers = buildHeaders();
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    debugLog(`[supabaseFetch] Response received for ${table}:`, response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[supabaseFetch] Error ${response.status} for ${table}:`, text);
      throw new Error(`[supabaseRest] ${response.status} ${response.statusText} - ${text}`);
    }

    debugLog(`[supabaseFetch] Parsing JSON for ${table}...`);
    const payload = (await response.json()) as T[];
    const result = Array.isArray(payload) ? payload : [];
    debugLog(`[supabaseFetch] ${table} returned ${result.length} records`);
    
    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: now });
    
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[supabaseFetch] Exception for ${table}:`, msg);
    throw error;
  }
}

export async function supabaseAuthFetch<T>(table: string, params: Record<string, string> = {}): Promise<T[]> {
  if (!isSupabaseConfigured) {
    console.warn(`[supabaseAuthFetch] Supabase not configured, returning empty array for table: ${table}`);
    return [];
  }

  const url = buildUrl(table, params);
  debugLog(`[supabaseAuthFetch] Fetching ${table}:`, url.toString());

  try {
    const headers = await buildAuthHeaders();
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[supabaseAuthFetch] Error ${response.status} for ${table}:`, text);
      throw new Error(`[supabaseRest] ${response.status} ${response.statusText} - ${text}`);
    }

    const payload = (await response.json()) as T[];
    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[supabaseAuthFetch] Exception for ${table}:`, msg);
    throw error;
  }
}

export async function supabaseInsert<T>(table: string, data: any): Promise<T | null> {
  if (!isSupabaseConfigured) {
    console.warn(`[supabaseInsert] Supabase not configured`);
    return null;
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  debugLog(`[supabaseInsert] Inserting into ${table}:`, data);

  try {
    const authHeaders = await buildAuthHeaders();
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[supabaseInsert] Error ${response.status}:`, text);
      throw new Error(`Insert failed: ${response.status} ${text}`);
    }

    const result = await response.json();
    debugLog(`[supabaseInsert] Response for ${table}:`, result);
    // RLS pode bloquear INSERT silenciosamente retornando 201 com array vazio
    if (Array.isArray(result) && result.length === 0) {
      console.error(`[supabaseInsert] Insert into ${table} returned empty array - likely blocked by RLS policy`);
      throw new Error(`Insert into ${table} blocked - verifique as políticas RLS da tabela`);
    }
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.error(`[supabaseInsert] Exception:`, error);
    throw error;
  }
}

export async function supabaseUpdate<T>(table: string, filters: Record<string, string>, data: any): Promise<T[]> {
  if (!isSupabaseConfigured) {
    console.warn(`[supabaseUpdate] Supabase not configured`);
    return [];
  }

  const url = buildUrl(table, filters);
  debugLog(`[supabaseUpdate] Updating ${table}:`, data);

  try {
    const authHeaders = await buildAuthHeaders();
    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: { ...authHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[supabaseUpdate] Error ${response.status}:`, text);
      throw new Error(`Update failed: ${response.status} ${text}`);
    }

    const result = await response.json();
    debugLog(`[supabaseUpdate] ${table} result:`, result);
    if (Array.isArray(result) && result.length === 0) {
      console.warn(`[supabaseUpdate] Update on ${table} returned empty array - possibly blocked by RLS or no matching rows`);
    }
    return Array.isArray(result) ? result : [result];
  } catch (error) {
    console.error(`[supabaseUpdate] Exception:`, error);
    throw error;
  }
}

export async function supabaseDelete(table: string, filters: Record<string, string>): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.warn(`[supabaseDelete] Supabase not configured`);
    return false;
  }

  const url = buildUrl(table, filters);
  debugLog(`[supabaseDelete] Deleting from ${table}`);

  try {
    const authHeaders = await buildAuthHeaders();
    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: authHeaders,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[supabaseDelete] Error ${response.status}:`, text);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[supabaseDelete] Exception:`, error);
    return false;
  }
}

/**
 * Authenticated update: uses the logged-in user's JWT (not anon key).
 * Returns the updated rows. Empty array = RLS blocked the operation.
 */
export async function supabaseAuthUpdate<T>(table: string, filters: Record<string, string>, data: any): Promise<T[]> {
  if (!isSupabaseConfigured) {
    console.warn(`[supabaseAuthUpdate] Supabase not configured`);
    return [];
  }

  const authHeaders = await buildAuthHeaders();
  const url = buildUrl(table, filters);
  debugLog(`[supabaseAuthUpdate] Updating ${table} with auth token:`, data);

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: { ...authHeaders, 'Prefer': 'return=representation' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[supabaseAuthUpdate] Error ${response.status}:`, text);
    throw new Error(`Update failed: ${response.status} ${text}`);
  }

  const result = await response.json();
  debugLog(`[supabaseAuthUpdate] Result:`, result);
  return Array.isArray(result) ? result : [result];
}

/**
 * Authenticated delete: uses the logged-in user's JWT.
 * Returns the deleted rows. Empty array = RLS blocked the operation.
 */
export async function supabaseAuthDelete<T>(table: string, filters: Record<string, string>): Promise<T[]> {
  if (!isSupabaseConfigured) {
    console.warn(`[supabaseAuthDelete] Supabase not configured`);
    return [];
  }

  const authHeaders = await buildAuthHeaders();
  const url = buildUrl(table, filters);
  debugLog(`[supabaseAuthDelete] Deleting from ${table} with auth token`);

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: { ...authHeaders, 'Prefer': 'return=representation' },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[supabaseAuthDelete] Error ${response.status}:`, text);
    throw new Error(`Delete failed: ${response.status} ${text}`);
  }

  const result = await response.json();
  debugLog(`[supabaseAuthDelete] Result:`, result);
  return Array.isArray(result) ? result : [result];
}

/**
 * Authenticated insert: uses the logged-in user's JWT (not anon key).
 * Accepts a single object or an array of objects.
 */
export async function supabaseAuthInsert<T>(table: string, data: any): Promise<T[]> {
  if (!isSupabaseConfigured) {
    console.warn(`[supabaseAuthInsert] Supabase not configured`);
    return [];
  }

  const authHeaders = await buildAuthHeaders();
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  debugLog(`[supabaseAuthInsert] Inserting into ${table}:`, Array.isArray(data) ? `${data.length} rows` : '1 row');

  const response = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders, 'Prefer': 'return=representation' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[supabaseAuthInsert] Error ${response.status}:`, text);
    throw new Error(`Insert failed: ${response.status} ${text}`);
  }

  const result = await response.json();
  debugLog(`[supabaseAuthInsert] Result:`, Array.isArray(result) ? `${result.length} rows` : result);
  return Array.isArray(result) ? result : [result];
}

export async function supabaseRPC<T>(functionName: string, params: any = {}): Promise<T> {
  if (!isSupabaseConfigured) {
    console.warn(`[supabaseRPC] Supabase not configured`);
    throw new Error('Supabase not configured');
  }

  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;
  debugLog(`[supabaseRPC] Calling ${functionName}:`, params);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[supabaseRPC] Error ${response.status}:`, text);
      throw new Error(`RPC failed: ${response.status} ${text}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[supabaseRPC] Exception:`, error);
    throw error;
  }
}

export async function supabaseGetSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string | null> {
  if (!isSupabaseConfigured) {
    console.warn(`[supabaseGetSignedUrl] Supabase not configured`);
    return null;
  }

  const url = `${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${path}`;
  debugLog(`[supabaseGetSignedUrl] Getting signed URL for ${bucket}/${path}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ expiresIn }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[supabaseGetSignedUrl] Error ${response.status}:`, text);
      return null;
    }

    const result = await response.json();
    return result.signedURL || result.signedUrl || null;
  } catch (error) {
    console.error(`[supabaseGetSignedUrl] Exception:`, error);
    return null;
  }
}

export function getSupabaseStorageUrl(bucket: string, path: string): string {
  if (!isSupabaseConfigured) return '';
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
export async function supabaseUploadFile(bucket: string, path: string, file: File): Promise<string | null> {
  if (!isSupabaseConfigured) {
    console.warn(`[supabaseUploadFile] Supabase not configured`);
    return null;
  }

  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
  debugLog(`[supabaseUploadFile] Uploading to ${bucket}/${path} (size: ${file.size} bytes)`);

  try {
    const authHeaders = await buildAuthHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: authHeaders.apikey,
        Authorization: authHeaders.Authorization,
        'Content-Type': file.type,
        'x-upsert': 'true'
      },
      body: file,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[supabaseUploadFile] Error ${response.status}:`, text);
      return null;
    }

    return path;
  } catch (error) {
    console.error(`[supabaseUploadFile] Exception:`, error);
    return null;
  }
}
