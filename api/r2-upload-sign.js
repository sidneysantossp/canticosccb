import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const MEDIA_UPLOAD_FOLDER_BY_TYPE = { hinos: 'hinos', audio: 'hinos', albuns: 'albuns', covers: 'covers', cover: 'covers', avatars: 'avatars', banners: 'banners', imports: 'imports', exports: 'exports', logos: 'logos' };
const MAX_UPLOAD_SIZE_MB = { avatars: 5, banners: 50, covers: 10, albuns: 10, imports: 25, exports: 25, hinos: 500, logos: 5 };
const MAX_FILES_PER_REQUEST = 10;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_ALLOWED_ORIGINS = new Set(['https://www.canticosccb.com.br', 'https://canticosccb.com.br', 'http://localhost:5173', 'http://127.0.0.1:5173']);

function cleanEnvValue(value) {
  return String(value || '').replace(/\\[nrt]/g, '').replace(/[\r\n\t]/g, '').trim();
}

const R2_ACCOUNT_ID = cleanEnvValue(process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID);
const R2_ACCESS_KEY_ID = cleanEnvValue(process.env.R2_ACCESS_KEY_ID);
const R2_SECRET_ACCESS_KEY = cleanEnvValue(process.env.R2_SECRET_ACCESS_KEY);
const R2_BUCKET = cleanEnvValue(process.env.R2_BUCKET || 'canticos-media') || 'canticos-media';
const R2_PUBLIC_URL = cleanEnvValue(process.env.R2_PUBLIC_URL || process.env.VITE_MEDIA_PUBLIC_BASE_URL || 'https://media.canticosccb.com.br').replace(/\/+$/, '');
const SUPABASE_URL = cleanEnvValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
const SUPABASE_ANON_KEY = cleanEnvValue(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);
const configuredAllowedOrigins = cleanEnvValue(process.env.CORS_ALLOWED_ORIGINS);
const ALLOWED_ORIGINS = new Set((configuredAllowedOrigins || [...DEFAULT_ALLOWED_ORIGINS].join(',')).split(',').map((origin) => origin.trim()).filter(Boolean));

function sanitizeBearerToken(value) {
  return String(value || '').trim().replace(/^Bearer\s+/i, '').replace(/[^A-Za-z0-9._-]/g, '');
}
function isAllowedOrigin(origin) { return !origin || ALLOWED_ORIGINS.has(origin); }
function setCorsHeaders(res, origin) {
  if (origin && isAllowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
}
function sendJson(res, status, payload, origin) {
  res.statusCode = status;
  setCorsHeaders(res, origin);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}
function clampExpiresIn(value, fallback = 900) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.max(60, Math.min(Math.round(numeric), 7200));
}
function createMediaUploadFileName(originalName) {
  const extensionSource = String(originalName || '').split('.').pop() || 'bin';
  const extension = extensionSource.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  return `${crypto.randomUUID()}.${extension}`;
}
async function validateAccessToken(token) {
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
  if (!authResponse.ok) return null;
  const authUser = await authResponse.json();
  if (!authUser?.id || !UUID_RE.test(authUser.id)) return null;
  let profile = {};
  try {
    const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(authUser.id)}&select=is_admin,is_composer,status,is_blocked&limit=1`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
    if (profileResponse.ok) {
      const rows = await profileResponse.json();
      profile = rows[0] || {};
    }
  } catch (error) {
    console.warn('[r2-upload-sign] profile lookup failed:', error);
  }

  let approvedComposer = false;
  const composerHeaders = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` };
  try {
    const byUser = await fetch(`${SUPABASE_URL}/rest/v1/composers?user_id=eq.${encodeURIComponent(authUser.id)}&select=verified,status&limit=1`, { headers: composerHeaders });
    let composerRows = byUser.ok ? await byUser.json() : [];
    if ((!Array.isArray(composerRows) || composerRows.length === 0) && authUser.email) {
      const byEmail = await fetch(`${SUPABASE_URL}/rest/v1/composers?email=ilike.${encodeURIComponent(String(authUser.email).trim().toLowerCase())}&select=verified,status&limit=1`, { headers: composerHeaders });
      composerRows = byEmail.ok ? await byEmail.json() : [];
    }
    const composer = Array.isArray(composerRows) ? composerRows[0] : null;
    approvedComposer = (composer?.verified === true || composer?.verified === 1) && composer?.status !== 'inactive';
  } catch (error) {
    console.warn('[r2-upload-sign] composer lookup failed:', error);
  }

  const isAdmin = profile.is_admin === true;
  const isComposer = profile.is_composer === true || approvedComposer;
  const active = profile.status
    ? profile.status === 'active' && profile.is_blocked !== true
    : isComposer;
  return { id: authUser.id, isAdmin, isComposer, active };
}
function canUploadToFolder(user, folder) {
  if (!user?.active) return false;
  if (folder === 'avatars') return true;
  if (user.isAdmin) return true;
  return user.isComposer && ['hinos', 'albuns', 'covers', 'imports'].includes(folder);
}
let r2Client;
function getR2Client() {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) throw new Error('Configuração do R2 ausente no servidor');
  if (!r2Client) r2Client = new S3Client({ region: 'auto', endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY } });
  return r2Client;
}
export async function createSignedUploadPayload({ type, fileName, contentType, size, expiresIn }, user) {
  const folder = MEDIA_UPLOAD_FOLDER_BY_TYPE[type];
  if (!folder) throw new Error('Tipo de upload inválido');
  if (!canUploadToFolder(user, folder)) throw new Error('Usuário sem permissão para este tipo de upload');
  const maxSizeMb = MAX_UPLOAD_SIZE_MB[folder] || 50;
  if (!Number.isFinite(Number(size)) || Number(size) <= 0) throw new Error('Tamanho de arquivo inválido');
  if (Number(size) > maxSizeMb * 1024 * 1024) throw new Error(`Arquivo excede o limite de ${maxSizeMb} MB para ${folder}`);
  const normalizedContentType = String(contentType || 'application/octet-stream').trim();
  if (normalizedContentType.length > 128 || /[\r\n]/.test(normalizedContentType)) throw new Error('Tipo de conteúdo inválido');
  const safeName = createMediaUploadFileName(fileName);
  const key = `${folder}/${user.id}/${safeName}`;
  const command = new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: normalizedContentType });
  const signedUrl = await getSignedUrl(getR2Client(), command, { expiresIn: clampExpiresIn(expiresIn) });
  return { bucket: R2_BUCKET, key, folder, fileName: safeName, signedUrl, publicUrl: `${R2_PUBLIC_URL}/${key}`, method: 'PUT' };
}
function inputFromRecord(record, fallbackExpiresIn = 0) {
  return { type: String(record?.type || ''), fileName: String(record?.fileName || ''), contentType: String(record?.contentType || ''), size: Number(record?.size || 0), expiresIn: Number(record?.expiresIn || fallbackExpiresIn || 0) };
}
export default async function handler(req, res) {
  const origin = String(req.headers.origin || '');
  if (origin && !isAllowedOrigin(origin)) return sendJson(res, 403, { error: 'Origem não permitida' }, origin);
  if (req.method === 'OPTIONS') { res.statusCode = 204; setCorsHeaders(res, origin); return res.end(); }
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Método não permitido' }, origin);
  try {
    const user = await validateAccessToken(sanitizeBearerToken(req.headers.authorization || ''));
    if (!user) return sendJson(res, 401, { error: 'Sessão inválida para upload' }, origin);
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (Array.isArray(body.files) && body.files.length > 0) {
      if (body.files.length > MAX_FILES_PER_REQUEST) return sendJson(res, 400, { error: `Limite de ${MAX_FILES_PER_REQUEST} arquivos por requisição` }, origin);
      const uploads = await Promise.all(body.files.map((file) => createSignedUploadPayload(inputFromRecord(file, body.expiresIn), user)));
      return sendJson(res, 200, { uploads }, origin);
    }
    return sendJson(res, 200, await createSignedUploadPayload(inputFromRecord(body), user), origin);
  } catch (error) {
    console.error('[r2-upload-sign] error:', error);
    return sendJson(res, 400, { error: error instanceof Error ? error.message : 'Falha ao assinar o upload para o R2' }, origin);
  }
}
