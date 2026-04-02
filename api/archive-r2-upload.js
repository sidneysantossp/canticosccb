import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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
};

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET = process.env.R2_BUCKET || 'canticos-media';
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || process.env.VITE_MEDIA_PUBLIC_BASE_URL || 'https://media.canticosccb.com.br').replace(/\/+$/, '');
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let r2Client;

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

function createMediaUploadFileName(originalName) {
  const extensionSource = String(originalName || '').split('.').pop() || 'bin';
  const extension = extensionSource.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;
}

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

async function validateAccessToken(accessToken) {
  if (!accessToken) return null;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Configuração de autenticação ausente no servidor');
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function assertArchiveUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('web.archive.org')) {
    throw new Error('Referência protegida inválida');
  }
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
    const archiveUrl = String(body.archiveUrl || '');
    const fileName = String(body.fileName || '');
    const contentType = String(body.contentType || 'application/octet-stream');
    const type = String(body.type || '');

    assertArchiveUrl(archiveUrl);

    if (!isMediaUploadType(type)) {
      throw new Error('Tipo de upload inválido');
    }

    const folder = resolveMediaUploadFolder(type);
    const safeName = createMediaUploadFileName(fileName);
    const key = `${folder}/${safeName}`;

    const upstreamResponse = await fetch(archiveUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'CanticosCCB/1.0 (archive-r2-upload)',
      },
      redirect: 'follow',
    });

    if (!upstreamResponse.ok) {
      throw new Error(`Não foi possível baixar a mídia do acervo (${upstreamResponse.status})`);
    }

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength <= 0) {
      throw new Error('A mídia retornada pelo acervo está vazia');
    }

    await getR2Client().send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: contentType,
    }));

    return json(res, 200, {
      key,
      publicUrl: `${R2_PUBLIC_URL}/${key}`,
    });
  } catch (error) {
    console.error('[archive-r2-upload] error:', error);
    return json(res, 500, {
      error: error?.message || 'Falha ao enviar a mídia do acervo para o R2',
    });
  }
}
