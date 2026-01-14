const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Debug: Log configuration status on load
if (typeof window !== 'undefined') {
  console.log('[supabaseRest] Config check:', {
    hasUrl: Boolean(SUPABASE_URL),
    hasKey: Boolean(SUPABASE_ANON_KEY),
    isConfigured: isSupabaseConfigured,
    url: SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'MISSING',
  });
}

function buildHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
  console.log(`[supabaseFetch] Fetching ${table}:`, url.toString());
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: buildHeaders(),
    });
    
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[supabaseFetch] Error ${response.status} for ${table}:`, text);
      throw new Error(`[supabaseRest] ${response.status} ${response.statusText} - ${text}`);
    }

    const payload = (await response.json()) as T[];
    const result = Array.isArray(payload) ? payload : [];
    console.log(`[supabaseFetch] ${table} returned ${result.length} records`);
    return result;
  } catch (error) {
    console.error(`[supabaseFetch] Exception for ${table}:`, error);
    throw error;
  }
}
