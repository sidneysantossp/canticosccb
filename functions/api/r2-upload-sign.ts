// Cloudflare Pages Function — emite URLs assinadas para upload direto no R2.
// A identidade é validada pelo Supabase Auth; nunca confiar apenas no payload do JWT.
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type Env = {
  R2_ACCOUNT_ID?: string;
  CLOUDFLARE_R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
  R2_PUBLIC_URL?: string;
  VITE_MEDIA_PUBLIC_BASE_URL?: string;
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  CORS_ALLOWED_ORIGINS?: string;
};

type MediaUploadFolder = 'hinos' | 'albuns' | 'covers' | 'avatars' | 'banners' | 'imports' | 'exports' | 'logos';
type AuthenticatedUser = { id: string; email: string; isAdmin: boolean; isComposer: boolean; active: boolean };
type UploadInput = { type: string; fileName: string; contentType?: string; size: number; expiresIn?: number };

const MEDIA_UPLOAD_FOLDER_BY_TYPE: Record<string, MediaUploadFolder> = {
  hinos: 'hinos', audio: 'hinos', albuns: 'albuns', covers: 'covers', cover: 'covers',
  avatars: 'avatars', banners: 'banners', imports: 'imports', exports: 'exports', logos: 'logos',
};
const MAX_UPLOAD_SIZE_MB: Record<MediaUploadFolder, number> = {
  hinos: 500, albuns: 10, covers: 10, avatars: 5, banners: 50, imports: 25, exports: 25, logos: 5,
};
const MAX_FILES_PER_REQUEST = 10;
const DEFAULT_ALLOWED_ORIGINS = [
  'https://www.canticosccb.com.br',
  'https://canticosccb.com.br',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanEnvValue(value: string | undefined): string {
  return String(value || '').replace(/\\[nrt]/g, '').replace(/[\r\n\t]/g, '').trim();
}
function sanitizeBearerToken(value: string): string {
  return String(value || '').trim().replace(/^Bearer\s+/i, '').replace(/[^A-Za-z0-9._-]/g, '');
}
function allowedOrigins(env: Env): string[] {
  const configured = cleanEnvValue(env.CORS_ALLOWED_ORIGINS);
  return (configured ? configured.split(',') : DEFAULT_ALLOWED_ORIGINS).map((origin) => origin.trim()).filter(Boolean);
}
function isAllowedOrigin(origin: string, env: Env): boolean {
  return !origin || allowedOrigins(env).includes(origin);
}
function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && isAllowedOrigin(origin, env)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}
function createMediaUploadFileName(originalName: string): string {
  const extensionSource = String(originalName || '').split('.').pop() || 'bin';
  const extension = extensionSource.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  return `${crypto.randomUUID()}.${extension}`;
}
function clampExpiresIn(value: number, fallback = 900): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(60, Math.min(Math.round(value), 7200));
}
function supabaseConfig(env: Env): { url: string; anonKey: string } {
  const url = cleanEnvValue(env.SUPABASE_URL || env.VITE_SUPABASE_URL).replace(/\/+$/, '');
  const anonKey = cleanEnvValue(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY);
  if (!url || !anonKey) throw new Error('Configuração do Supabase ausente no servidor');
  return { url, anonKey };
}
async function validateAccessToken(env: Env, token: string): Promise<AuthenticatedUser | null> {
  if (!token) return null;
  const { url, anonKey } = supabaseConfig(env);
  const authResponse = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!authResponse.ok) return null;
  const authUser = await authResponse.json() as { id?: string; email?: string };
  if (!authUser.id || !UUID_RE.test(authUser.id)) return null;

  const profileResponse = await fetch(
    `${url}/rest/v1/users?id=eq.${encodeURIComponent(authUser.id)}&select=is_admin,is_composer,status,is_blocked&limit=1`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } },
  );
  const profiles = profileResponse.ok ? await profileResponse.json() as Array<Record<string, unknown>> : [];
  const profile = profiles[0] || {};
  const active = profile.status === undefined || (profile.status === 'active' && profile.is_blocked !== true);
  return {
    id: authUser.id,
    email: typeof authUser.email === 'string' ? authUser.email : '',
    isAdmin: profile.is_admin === true,
    isComposer: profile.is_composer === true,
    active,
  };
}
function canUploadToFolder(user: AuthenticatedUser, folder: MediaUploadFolder): boolean {
  if (!user.active) return false;
  if (folder === 'avatars') return true;
  if (user.isAdmin) return true;
  return user.isComposer && ['hinos', 'albuns', 'covers', 'imports'].includes(folder);
}
function buildR2Client(env: Env): { client: S3Client; bucket: string; publicUrl: string } {
  const accountId = cleanEnvValue(env.R2_ACCOUNT_ID || env.CLOUDFLARE_R2_ACCOUNT_ID);
  const accessKeyId = cleanEnvValue(env.R2_ACCESS_KEY_ID);
  const secretAccessKey = cleanEnvValue(env.R2_SECRET_ACCESS_KEY);
  const bucket = cleanEnvValue(env.R2_BUCKET) || 'canticos-media';
  const publicUrl = cleanEnvValue(env.R2_PUBLIC_URL || env.VITE_MEDIA_PUBLIC_BASE_URL || 'https://media.canticosccb.com.br').replace(/\/+$/, '');
  if (!accountId || !accessKeyId || !secretAccessKey) throw new Error('Configuração do R2 ausente no servidor');
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket, publicUrl };
}
async function createSignedUpload(env: Env, user: AuthenticatedUser, input: UploadInput) {
  const folder = MEDIA_UPLOAD_FOLDER_BY_TYPE[input.type];
  if (!folder) throw new Error('Tipo de upload inválido');
  if (!canUploadToFolder(user, folder)) throw new Error('Usuário sem permissão para este tipo de upload');
  const maxSizeMb = MAX_UPLOAD_SIZE_MB[folder] || 50;
  if (!Number.isFinite(input.size) || input.size <= 0) throw new Error('Tamanho de arquivo inválido');
  if (input.size > maxSizeMb * 1024 * 1024) throw new Error(`Arquivo excede o limite de ${maxSizeMb} MB para ${folder}`);
  const contentType = String(input.contentType || 'application/octet-stream').trim();
  if (contentType.length > 128 || /[\r\n]/.test(contentType)) throw new Error('Tipo de conteúdo inválido');
  const { client, bucket, publicUrl } = buildR2Client(env);
  const safeName = createMediaUploadFileName(input.fileName);
  const key = `${folder}/${user.id}/${safeName}`;
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  const signedUrl = await getSignedUrl(client, command, { expiresIn: clampExpiresIn(input.expiresIn || 900) });
  return { bucket, key, folder, fileName: safeName, signedUrl, publicUrl: `${publicUrl}/${key}`, method: 'PUT' as const };
}
function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}
function inputFromRecord(record: Record<string, unknown>, fallbackExpiresIn = 0): UploadInput {
  return {
    type: String(record.type || ''),
    fileName: String(record.fileName || ''),
    contentType: String(record.contentType || ''),
    size: Number(record.size || 0),
    expiresIn: Number(record.expiresIn || fallbackExpiresIn || 0),
  };
}
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const headers = corsHeaders(request, env);
  const origin = request.headers.get('Origin') || '';
  if (origin && !isAllowedOrigin(origin, env)) return json({ error: 'Origem não permitida' }, 403, headers);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json({ error: 'Método não permitido' }, 405, headers);

  try {
    const accessToken = sanitizeBearerToken(request.headers.get('authorization') || '');
    const user = await validateAccessToken(env, accessToken);
    if (!user) return json({ error: 'Sessão inválida para upload' }, 401, headers);
    const body = await request.json().catch(() => ({}));
    if (!body || typeof body !== 'object') return json({ error: 'Corpo da requisição inválido' }, 400, headers);
    const payload = body as Record<string, unknown>;
    const rawFiles = payload.files;
    if (Array.isArray(rawFiles) && rawFiles.length > 0) {
      if (rawFiles.length > MAX_FILES_PER_REQUEST) return json({ error: `Limite de ${MAX_FILES_PER_REQUEST} arquivos por requisição` }, 400, headers);
      const uploads = await Promise.all(rawFiles.map((rawFile) => {
        const file = rawFile && typeof rawFile === 'object' ? rawFile as Record<string, unknown> : {};
        return createSignedUpload(env, user, inputFromRecord(file, Number(payload.expiresIn || 0)));
      }));
      return json({ uploads }, 200, headers);
    }
    return json(await createSignedUpload(env, user, inputFromRecord(payload)), 200, headers);
  } catch (error) {
    console.error('[r2-upload-sign] error:', error);
    const message = error instanceof Error ? error.message : 'Falha ao assinar o upload para o R2';
    const clientError = /inválido|excede|permissão|Sessão|Limite|Origem|conteúdo/i.test(message) ? message : 'Falha ao assinar o upload para o R2';
    return json({ error: clientError }, 400, headers);
  }
};
