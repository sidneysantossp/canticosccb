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

function isAllowedOrigin(req) {
  const origin = String(req.headers.origin || '').trim();
  const referer = String(req.headers.referer || '').trim();
  const source = origin || referer;

  if (!source) return false;

  return [
    'https://www.canticosccb.com.br',
    'https://canticosccb.com.br',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].some((allowed) => source.startsWith(allowed));
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

function assertArchiveUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('web.archive.org')) {
    throw new Error('Referência protegida inválida');
  }
}

function normalizeArchiveBinaryUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return raw;

  try {
    const parsed = new URL(raw);
    if (!parsed.hostname.includes('web.archive.org')) {
      return raw;
    }

    parsed.pathname = parsed.pathname.replace(
      /\/web\/(\d+)(?!if_)\//,
      (_match, timestamp) => `/web/${timestamp}if_/`
    );

    return parsed.toString();
  } catch {
    return raw.replace(/\/web\/(\d+)(?!if_)\//, '/web/$1if_/');
  }
}

function isHtmlPayload(buffer, contentType) {
  const type = String(contentType || '').toLowerCase();
  if (type.includes('text/html') || type.includes('application/xhtml')) {
    return true;
  }

  const snippet = Buffer.from(buffer)
    .subarray(0, 256)
    .toString('utf8')
    .trim()
    .toLowerCase();

  return snippet.startsWith('<!doctype html') || snippet.startsWith('<html');
}

async function fetchArchiveBinary(archiveUrl) {
  const targetUrl = normalizeArchiveBinaryUrl(archiveUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    return await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'CanticosCCB/1.0 (archive-r2-upload)',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Timeout ao baixar a mídia do acervo para o R2');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');
    return res.end();
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Método não permitido' });
  }

  try {
    if (!isAllowedOrigin(req)) {
      return json(res, 403, { error: 'Origem não autorizada para importar mídia do acervo' });
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

    const upstreamResponse = await fetchArchiveBinary(archiveUrl);

    if (!upstreamResponse.ok) {
      throw new Error(`Não foi possível baixar a mídia do acervo (${upstreamResponse.status})`);
    }

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength <= 0) {
      throw new Error('A mídia retornada pelo acervo está vazia');
    }

    if (isHtmlPayload(arrayBuffer, upstreamResponse.headers.get('content-type'))) {
      throw new Error('O acervo retornou uma página HTML em vez do arquivo de mídia.');
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
