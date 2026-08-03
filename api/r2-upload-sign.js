import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const MEDIA_UPLOAD_FOLDER_BY_TYPE = {
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

function cleanEnvValue(value) {
  return String(value || '')
    .replace(/\\[nrt]/g, '')
    .replace(/[\r\n\t]/g, '')
    .trim();
}

const R2_ACCOUNT_ID = cleanEnvValue(process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID || '');
const R2_ACCESS_KEY_ID = cleanEnvValue(process.env.R2_ACCESS_KEY_ID || '');
const R2_SECRET_ACCESS_KEY = cleanEnvValue(process.env.R2_SECRET_ACCESS_KEY || '');
const R2_BUCKET = cleanEnvValue(process.env.R2_BUCKET || 'canticos-media') || 'canticos-media';
const R2_PUBLIC_URL = cleanEnvValue(
  process.env.R2_PUBLIC_URL || process.env.VITE_MEDIA_PUBLIC_BASE_URL || 'https://media.canticosccb.com.br'
).replace(/\/+$/, '');

const MAX_UPLOAD_SIZE_MB = {
  avatars: 5,
  banners: 50,
  covers: 10,
  albuns: 10,
  imports: 25,
  exports: 25,
  hinos: 500,
  logos: 5,
};

function sanitizeBearerToken(value) {
  return String(value || '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/[^A-Za-z0-9._-]/g, '');
}

function isMediaUploadType(value) {
  return value in MEDIA_UPLOAD_FOLDER_BY_TYPE;
}

function resolveMediaUploadFolder(type) {
  return MEDIA_UPLOAD_FOLDER_BY_TYPE[type];
}

function clampExpiresIn(value, fallbackSeconds = 900) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallbackSeconds;
  }

  return Math.max(60, Math.min(Math.round(numericValue), 7200));
}

function createMediaUploadFileName(originalName) {
  const extensionSource = String(originalName || '').split('.').pop() || 'bin';
  const extension = extensionSource.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;
}

let r2Client;

function getR2Client() {
  if (!r2Client) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error('Configuração do R2 ausente no servidor');
    }

    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return r2Client;
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function decodeJwtPayload(accessToken) {
  const token = sanitizeBearerToken(accessToken);
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

async function validateAccessToken(accessToken) {
  if (!accessToken) return null;

  const payload = decodeJwtPayload(accessToken);
  if (!payload?.sub || typeof payload.sub !== 'string') {
    return null;
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.sub)) {
    return null;
  }

  if (payload.exp && Number(payload.exp) * 1000 <= Date.now() + 30000) {
    return null;
  }

  return {
    id: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : '',
  };
}

export async function createSignedUploadPayload({ type, fileName, contentType, size, expiresIn }) {
  if (!isMediaUploadType(type)) {
    throw new Error('Tipo de upload inválido');
  }

  const folder = resolveMediaUploadFolder(type);
  const maxSizeMb = MAX_UPLOAD_SIZE_MB[folder] || 50;
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  if (Number(size || 0) <= 0) {
    throw new Error('Tamanho de arquivo inválido');
  }

  if (Number(size) > maxSizeBytes) {
    throw new Error(`Arquivo excede o limite de ${maxSizeMb} MB para ${folder}`);
  }

  const safeName = createMediaUploadFileName(fileName);
  const key = `${folder}/${safeName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType || 'application/octet-stream',
  });

  const signedUrl = await getSignedUrl(getR2Client(), command, { expiresIn: clampExpiresIn(expiresIn, 900) });

  return {
    bucket: R2_BUCKET,
    key,
    folder,
    fileName: safeName,
    signedUrl,
    publicUrl: `${R2_PUBLIC_URL}/${key}`,
    method: 'PUT',
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.end();
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Método não permitido' });
  }

  try {
    const authHeader = String(req.headers.authorization || '');
    const accessToken = sanitizeBearerToken(authHeader);
    const user = await validateAccessToken(accessToken);

    if (!user?.id) {
      return json(res, 401, { error: 'Sessão inválida para upload' });
    }

    const body = await readJsonBody(req);
    if (Array.isArray(body.files) && body.files.length > 0) {
      const uploads = await Promise.all(
        body.files.map((file) => createSignedUploadPayload({
          type: String(file?.type || ''),
          fileName: String(file?.fileName || ''),
          contentType: String(file?.contentType || ''),
          size: Number(file?.size || 0),
          expiresIn: Number(file?.expiresIn || body.expiresIn || 0),
        }))
      );

      return json(res, 200, { uploads });
    }

    const payload = await createSignedUploadPayload({
      type: String(body.type || ''),
      fileName: String(body.fileName || ''),
      contentType: String(body.contentType || ''),
      size: Number(body.size || 0),
      expiresIn: Number(body.expiresIn || 0),
    });

    return json(res, 200, payload);
  } catch (error) {
    console.error('[r2-upload-sign] error:', error);
    return json(res, 500, {
      error: error?.message || 'Falha ao assinar o upload para o R2',
    });
  }
}
