export const config = { maxDuration: 30 };

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function env(name) {
  return String(process.env[name] || '').trim().replace(/^['"]|['"]$/g, '');
}

function restUrl(supabaseUrl, table, params) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function requireAdmin(req, supabaseUrl, anonKey) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) throw Object.assign(new Error('Sessão administrativa necessária.'), { statusCode: 401 });

  const headers = { apikey: anonKey, Authorization: `Bearer ${token}` };
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers });
  if (!userResponse.ok) throw Object.assign(new Error('Sessão inválida.'), { statusCode: 401 });
  const user = await userResponse.json();

  const profileResponse = await fetch(restUrl(supabaseUrl, 'users', {
    id: `eq.${user.id}`,
    select: 'is_admin,status,is_blocked',
    limit: '1',
  }), { headers });
  const profiles = profileResponse.ok ? await profileResponse.json() : [];
  const profile = profiles?.[0];
  if (!profile?.is_admin || profile.status === 'inactive' || profile.is_blocked === true) {
    throw Object.assign(new Error('Acesso administrativo necessário.'), { statusCode: 403 });
  }
}

async function deleteRows(supabaseUrl, serviceKey, table, filters, optional = false) {
  const response = await fetch(restUrl(supabaseUrl, table, filters), {
    method: 'DELETE',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'return=representation',
    },
  });
  const payload = await readJson(response);
  if (!response.ok) {
    const missingOptionalTable = optional && (response.status === 404 || /schema cache|does not exist/i.test(JSON.stringify(payload)));
    if (missingOptionalTable) return [];
    const message = payload?.message || payload?.error || `Falha ao excluir dados de ${table}.`;
    throw Object.assign(new Error(message), { statusCode: response.status });
  }
  return Array.isArray(payload) ? payload : [];
}

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return json(res, 405, { error: 'Método não permitido.' });

  try {
    const supabaseUrl = (env('SUPABASE_URL') || env('VITE_SUPABASE_URL')).replace(/\/+$/, '');
    const anonKey = env('SUPABASE_ANON_KEY') || env('VITE_SUPABASE_ANON_KEY');
    const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) {
      throw Object.assign(new Error('Serviço de exclusão não configurado.'), { statusCode: 503 });
    }

    const albumId = String(req.query?.id || '').trim();
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(albumId)) {
      throw Object.assign(new Error('Identificador de álbum inválido.'), { statusCode: 400 });
    }

    await requireAdmin(req, supabaseUrl, anonKey);

    // Remova primeiro apenas as relações que pertencem ao álbum solicitado.
    await deleteRows(supabaseUrl, serviceKey, 'album_hinos', { album_id: `eq.${albumId}` });
    await deleteRows(supabaseUrl, serviceKey, 'archive_recovery_imports', { album_id: `eq.${albumId}` }, true);
    const deletedAlbums = await deleteRows(supabaseUrl, serviceKey, 'albums', { id: `eq.${albumId}` });

    if (deletedAlbums.length !== 1) {
      throw Object.assign(new Error('O álbum não foi localizado ou já havia sido excluído.'), { statusCode: 404 });
    }

    return json(res, 200, { success: true, albumId });
  } catch (error) {
    console.error('[admin-album-delete]', error);
    return json(res, Number(error?.statusCode || 500), {
      error: error?.message || 'Não foi possível excluir o álbum.',
    });
  }
}
