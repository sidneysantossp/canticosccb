import { EMERGENCY_AUDIO_INDEX } from './_emergencyAudioIndex.js';

const ALLOWED_ORIGINAL_HOSTS = new Set(['canticosccb.com.br', 'www.canticosccb.com.br']);
const MEDIA_EXTENSIONS = new Set(['mp3', 'wma', 'wav', 'ogg', 'aac', 'm4a', 'mid', 'midi', 'zip', 'mp4']);

export const config = { maxDuration: 120 };

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function resolveOriginalUrl(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) throw new Error('Informe uma URL do arquivo histórico.');
  const normalizedValue = /^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;
  const parsed = new URL(normalizedValue);
  if (parsed.hostname.toLowerCase() !== 'web.archive.org') throw new Error('Informe uma URL do arquivo histórico.');
  const snapshot = parsed.pathname.match(/^\/web\/(?:\*|\d+(?:[a-z_]+)?)\/(https?:\/\/.*)$/i);
  const original = snapshot ? decodeURIComponent(snapshot[1]) : '';
  if (!original) throw new Error('Informe uma URL de captura de um arquivo ou página original.');
  const originalUrl = new URL(original);
  if (!ALLOWED_ORIGINAL_HOSTS.has(originalUrl.hostname.toLowerCase())) throw new Error('A origem informada não pertence ao acervo autorizado.');
  return originalUrl.toString();
}

function extensionOf(url) {
  try { return new URL(url).pathname.split('.').pop().toLowerCase(); } catch { return ''; }
}

function filesFromRecoveryCatalog() {
  return Object.values(EMERGENCY_AUDIO_INDEX).flatMap((archive) => {
    const snapshotUrl = String(archive?.snapshotUrl || '').trim();
    const entries = Array.isArray(archive?.entries) ? archive.entries : [];
    if (!snapshotUrl) return [];
    return entries
      .map((entry, index) => {
        const name = String(entry?.name || '').trim();
        const extension = name.split('.').pop()?.toLowerCase() || '';
        return {
          name,
          extension,
          mimeType: extension === 'mp3' ? 'audio/mpeg' : 'application/octet-stream',
          replayUrl: snapshotUrl,
          container: String(archive?.segment?.albumTitle || 'Pacote histórico'),
          segmentId: String(archive?.segment?.id || ''),
          trackNumber: Number(archive?.segment?.start || 1) + index,
          sourceUrl: String(archive?.segment?.originalUrl || snapshotUrl),
        };
      })
      .filter((entry) => entry.name && MEDIA_EXTENSIONS.has(entry.extension));
  });
}

async function fetchArchiveRows(cdxUrl) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50_000);
    try {
      const response = await fetch(cdxUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CanticosCCB/1.0; +https://www.canticosccb.com.br)',
          Accept: 'application/json,text/plain;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'identity',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = JSON.parse(await response.text());
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1_200));
    } finally {
      clearTimeout(timeout);
    }
  }
  const detail = lastError?.name === 'AbortError' ? 'tempo esgotado' : String(lastError?.message || 'conexão interrompida');
  throw new Error(`O Wayback não concluiu a consulta (${detail}). Tente novamente em alguns instantes.`);
}

async function requireAdmin(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const anonKey = String(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!token || !supabaseUrl || !anonKey) throw new Error('Sessão administrativa necessária.');
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
  if (!userResponse.ok) throw new Error('Sessão inválida.');
  const user = await userResponse.json();
  const profileResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(user.id)}&select=is_admin,status,is_blocked&limit=1`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
  const profile = profileResponse.ok ? (await profileResponse.json())[0] : null;
  if (!profile?.is_admin || profile.status === 'inactive' || profile.is_blocked === true) throw new Error('Acesso administrativo necessário.');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  try {
    await requireAdmin(req);
    const originalUrl = resolveOriginalUrl(req.body?.sourceUrl);
    const baseUrl = originalUrl.endsWith('*') ? originalUrl : `${originalUrl}*`;
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(baseUrl)}&output=json&fl=timestamp,original,statuscode,mimetype&filter=statuscode:200&collapse=urlkey&limit=3000`;
    let rows = [];
    let externalError = '';
    try {
      rows = await fetchArchiveRows(cdxUrl);
    } catch (error) {
      externalError = String(error?.message || 'Consulta externa indisponível.');
    }
    const dataRows = Array.isArray(rows) ? rows.slice(1) : [];
    let files = dataRows
      .map(([timestamp, original, status, mimeType]) => ({ timestamp, original, status, mimeType, extension: extensionOf(original) }))
      .filter((item) => MEDIA_EXTENSIONS.has(item.extension))
      .map((item) => ({
        name: decodeURIComponent(item.original.split('/').pop() || item.original),
        extension: item.extension,
        mimeType: item.mimeType || 'desconhecido',
        replayUrl: `https://web.archive.org/web/${item.timestamp}id_/${item.original}`,
      }));
    const catalogFallback = files.length === 0 && Boolean(externalError);
    if (catalogFallback) files = filesFromRecoveryCatalog();
    return json(res, 200, {
      sourceUrl: originalUrl,
      total: files.length,
      files,
      catalogFallback,
      warning: catalogFallback
        ? `A consulta externa não respondeu. Exibindo ${files.length} arquivos do catálogo de recuperação já validado.`
        : '',
    });
  } catch (error) {
    const message = String(error.message || 'Não foi possível analisar a origem.');
    const status = /Sessão|Acesso/i.test(message) ? 403 : /Wayback|acervo/i.test(message) ? 502 : 400;
    return json(res, status, { error: message });
  }
}
