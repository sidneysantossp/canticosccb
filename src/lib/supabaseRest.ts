console.log('🔧 [supabaseRest] Module loading...');

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

console.log('🔧 [supabaseRest] Module loaded successfully');

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
  // Usar anon key diretamente para evitar travamentos com getSession()
  // Para tabelas públicas (RLS configurado), anon key é suficiente
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
    const headers = buildHeaders();
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    console.log(`[supabaseFetch] Response received for ${table}:`, response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[supabaseFetch] Error ${response.status} for ${table}:`, text);
      throw new Error(`[supabaseRest] ${response.status} ${response.statusText} - ${text}`);
    }

    console.log(`[supabaseFetch] Parsing JSON for ${table}...`);
    const payload = (await response.json()) as T[];
    const result = Array.isArray(payload) ? payload : [];
    console.log(`[supabaseFetch] ${table} returned ${result.length} records`);
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[supabaseFetch] Exception for ${table}:`, msg);
    throw error;
  }
}

export async function supabaseInsert<T>(table: string, data: any): Promise<T | null> {
  if (!isSupabaseConfigured) {
    console.warn(`[supabaseInsert] Supabase not configured`);
    return null;
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  console.log(`[supabaseInsert] Inserting into ${table}:`, data);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...buildHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[supabaseInsert] Error ${response.status}:`, text);
      throw new Error(`Insert failed: ${response.status} ${text}`);
    }

    const result = await response.json();
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
  console.log(`[supabaseUpdate] Updating ${table}:`, data);

  try {
    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: { ...buildHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[supabaseUpdate] Error ${response.status}:`, text);
      throw new Error(`Update failed: ${response.status} ${text}`);
    }

    const result = await response.json();
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
  console.log(`[supabaseDelete] Deleting from ${table}`);

  try {
    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: buildHeaders(),
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

export async function supabaseRPC<T>(functionName: string, params: any = {}): Promise<T> {
  if (!isSupabaseConfigured) {
    console.warn(`[supabaseRPC] Supabase not configured`);
    throw new Error('Supabase not configured');
  }

  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;
  console.log(`[supabaseRPC] Calling ${functionName}:`, params);

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
  console.log(`[supabaseGetSignedUrl] Getting signed URL for ${bucket}/${path}`);

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
  console.log(`[supabaseUploadFile] Uploading to ${bucket}/${path}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...buildHeaders(),
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
