// Cloudflare Pages Function — Gera signed URL pra upload direto no R2
// Cliente bate no /api/r2-upload-sign, recebe signedUrl, e faz PUT direto
// pro endpoint S3-compatible do R2.

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
};

type MediaUploadFolder = 'hinos' | 'albuns' | 'covers' | 'avatars' | 'banners' | 'imports' | 'exports' | 'logos';

const MEDIA_UPLOAD_FOLDER_BY_TYPE: Record<string, MediaUploadFolder> = {
  hinos: 'hinos',
  audio: 'hinos',
  albuns: 'albuns',
  covers: 'covers',
  cover: 'covers',
  avatars: 'avatars',
  banners: 'banners',
  imports: 'imports',
  exports: 'exports',
  logos: 'logos',
};

const MAX_UPLOAD_SIZE_MB: Record<MediaUploadFolder, number> = {
  hinos: 500,
  albuns: 10,
  covers: 10,
  avatars: 5,
  banners: 50,
  imports: 25,
  exports: 25,
  logos: 5,
};

function cleanEnvValue(value: string | undefined): string {
  return String(value || '').replace(/\\[nrt]/g, '').replace(/[\r\n\t]/g, '').trim();
}

function sanitizeBearerToken(value: string): string {
  return String(value || '').trim().replace(/^Bearer\s+/i, '').replace(/[^A-Za-z0-9._-]/g, '');
}

function createMediaUploadFileName(originalName: string): string {
  const extensionSource = String(originalName || '').split('.').pop() || 'bin';
  const extension = extensionSource.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;
}

function clampExpiresIn(value: number, fallback = 900): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(60, Math.min(Math.round(value), 7200));
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function validateAccessToken(token: string): { id: string; email: string } | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.sub !== 'string') return null;
  const sub = payload.sub;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sub)) return null;
  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now() + 30000) return null;
  return { id: sub, email: typeof payload.email === 'string' ? payload.email : '' };
}

function buildR2Client(env: Env): { client: S3Client; bucket: string; publicUrl: string } {
  const accountId = cleanEnvValue(env.R2_ACCOUNT_ID || env.CLOUDFLARE_R2_ACCOUNT_ID);
  const accessKeyId = cleanEnvValue(env.R2_ACCESS_KEY_ID);
  const secretAccessKey = cleanEnvValue(env.R2_SECRET_ACCESS_KEY);
  const bucket = cleanEnvValue(env.R2_BUCKET) || 'canticos-media';
  const publicUrl = cleanEnvValue(env.R2_PUBLIC_URL || env.VITE_MEDIA_PUBLIC_BASE_URL || 'https://media.canticosccb.com.br').replace(/\/+$/, '');

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Configuração do R2 ausente no servidor');
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return { client, bucket, publicUrl };
}

async function createSignedUpload(
  env: Env,
  input: { type: string; fileName: string; contentType?: string; size: number; expiresIn?: number },
) {
  const folder = MEDIA_UPLOAD_FOLDER_BY_TYPE[input.type];
  if (!folder) throw new Error('Tipo de upload inválido');

  const maxSizeMb = MAX_UPLOAD_SIZE_MB[folder] || 50;
  if (!Number.isFinite(input.size) || input.size <= 0) throw new Error('Tamanho de arquivo inválido');
  if (input.size > maxSizeMb * 1024 * 1024) throw new Error(`Arquivo excede o limite de ${maxSizeMb} MB para ${folder}`);

  const { client, bucket, publicUrl } = buildR2Client(env);
  const safeName = createMediaUploadFileName(input.fileName);
  const key = `${folder}/${safeName}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: input.contentType || 'application/octet-stream',
  });

  const signedUrl = await getSignedUrl(client, command, { expiresIn: clampExpiresIn(input.expiresIn || 900) });

  return {
    bucket,
    key,
    folder,
    fileName: safeName,
    signedUrl,
    publicUrl: `${publicUrl}/${key}`,
    method: 'PUT' as const,
  };
}

function json(body: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405);
  }

  try {
    const accessToken = sanitizeBearerToken(request.headers.get('authorization') || '');
    const user = validateAccessToken(accessToken);
    if (!user?.id) return json({ error: 'Sessão inválida para upload' }, 401);

    const body = await request.json().catch(() => ({} as Record<string, unknown>));

    if (Array.isArray((body as any).files) && (body as any).files.length > 0) {
      const files = (body as any).files as any[];
      const uploads = await Promise.all(
        files.map((file) =>
          createSignedUpload(env, {
            type: String(file?.type || ''),
            fileName: String(file?.fileName || ''),
            contentType: String(file?.contentType || ''),
            size: Number(file?.size || 0),
            expiresIn: Number(file?.expiresIn || (body as any).expiresIn || 0),
          }),
        ),
      );
      return json({ uploads }, 200);
    }

    const payload = await createSignedUpload(env, {
      type: String((body as any).type || ''),
      fileName: String((body as any).fileName || ''),
      contentType: String((body as any).contentType || ''),
      size: Number((body as any).size || 0),
      expiresIn: Number((body as any).expiresIn || 0),
    });
    return json(payload, 200);
  } catch (error: any) {
    console.error('[r2-upload-sign] error:', error);
    return json({ error: error?.message || 'Falha ao assinar o upload para o R2' }, 500);
  }
};
