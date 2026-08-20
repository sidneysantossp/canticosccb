const SUPABASE_URL = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = String(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').replace(/^Bearer\s+/i, '').trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/^Bearer\s+/i, '').trim();
const ALLOWED_ORIGINS = new Set([
  'https://www.canticosccb.com.br',
  'https://canticosccb.com.br',
]);

function sendJson(res, status, payload, origin = '') {
  if (origin && ALLOWED_ORIGINS.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

function bearer(value) {
  return String(value || '').replace(/^Bearer\s+/i, '').trim();
}

async function readAuthUser(token) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !token) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return response.json();
}

async function readAdminProfile(userId, email, token) {
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY || token}`,
  };
  const byId = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=is_admin,status,is_blocked&limit=1`, { headers });
  const rows = byId.ok ? await byId.json() : [];
  if (rows[0]) return rows[0];
  if (!email) return null;
  const byEmail = await fetch(`${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(email.trim().toLowerCase())}&select=is_admin,status,is_blocked&limit=1`, { headers });
  const emailRows = byEmail.ok ? await byEmail.json() : [];
  return emailRows[0] || null;
}

export default async function handler(req, res) {
  const origin = String(req.headers.origin || '');
  if (req.method === 'OPTIONS') return sendJson(res, 204, {}, origin);
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Método não permitido' }, origin);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return sendJson(res, 503, { error: 'Assinatura segura não configurada no servidor' }, origin);
  }

  try {
    const token = bearer(req.headers.authorization);
    const authUser = await readAuthUser(token);
    if (!authUser?.id) return sendJson(res, 401, { error: 'Sessão inválida' }, origin);
    const profile = await readAdminProfile(authUser.id, authUser.email, token);
    if (profile?.is_admin !== true || profile?.is_blocked === true || (profile.status && profile.status !== 'active')) {
      return sendJson(res, 403, { error: 'Apenas administradores ativos podem visualizar documentos' }, origin);
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const path = String(body.path || '').replace(/^\/+/, '').replace(/\\/g, '/');
    if (!path.startsWith('composer/') || path.split('/').length < 3 || path.includes('..')) {
      return sendJson(res, 400, { error: 'Caminho de documento inválido' }, origin);
    }

    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/documents/${path}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: Math.min(Math.max(Number(body.expiresIn) || 300, 60), 1800) }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return sendJson(res, response.status, { error: payload?.message || 'Não foi possível assinar o documento' }, origin);
    const signed = payload.signedURL || payload.signedUrl || '';
    if (!signed) return sendJson(res, 502, { error: 'Storage não devolveu uma URL assinada' }, origin);
    return sendJson(res, 200, { signedUrl: /^https?:\/\//i.test(signed) ? signed : `${SUPABASE_URL}${signed.startsWith('/') ? '' : '/'}${signed}` }, origin);
  } catch (error) {
    console.error('[document-signed-url] error:', error);
    return sendJson(res, 500, { error: 'Falha ao gerar URL segura do documento' }, origin);
  }
}
