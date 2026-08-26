import { EMERGENCY_AUDIO_INDEX } from './_emergencyAudioIndex.js';

const MEDIA_EXTENSIONS = new Set(['mp3', 'wma', 'wav', 'ogg', 'aac', 'm4a', 'mid', 'midi', 'zip', 'mp4']);

export const config = { maxDuration: 300 };

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
  // Aceita tanto uma URL do Wayback quanto a URL original do site.
  if (parsed.hostname.toLowerCase() !== 'web.archive.org') {
    const hasWildcard = /\*+$/.test(normalizedValue);
    const directUrl = new URL(normalizedValue.replace(/\*+$/, ''));
    if (!directUrl.hostname || directUrl.username || directUrl.password) throw new Error('A origem informada é inválida.');
    return hasWildcard ? `${directUrl.toString()}*` : `${directUrl.toString()}*`;
  }
  const snapshot = parsed.pathname.match(/^\/web\/(?:\*|\d+(?:[a-z_]+)?)\/(https?:\/\/.*)$/i);
  const original = snapshot ? decodeURIComponent(snapshot[1]) : '';
  if (!original) throw new Error('Informe uma URL de captura de um arquivo ou página original.');
  // O Wayback aceita o curinga no final do host/path do prefixo. Remova-o
  // apenas durante a validação do host e preserve-o para a consulta CDX.
  const hasPrefixWildcard = /\*+$/.test(original);
  const originalUrl = new URL(original.replace(/\*+$/, ''));
  // A consulta é restrita ao painel autenticado; administradores podem
  // pesquisar qualquer domínio público arquivado no Wayback.
  if (!originalUrl.hostname || originalUrl.hostname.includes('..')) throw new Error('A origem informada é inválida.');
  const normalizedOriginal = originalUrl.toString();
  return hasPrefixWildcard ? `${normalizedOriginal}*` : normalizedOriginal;
}

function extensionOf(url) {
  try { return new URL(url).pathname.split('.').pop().toLowerCase(); } catch { return ''; }
}

function externalGrouping(original, timestamp) {
  try {
    const parsed = new URL(original);
    const parts = parsed.pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
    const fileName = parts.pop() || original;
    const parent = parts.at(-1) || parsed.hostname;
    const parentPath = `/${parts.join('/')}` || '/';
    const numberMatch = fileName.match(/(?:^|[_\-\s])0*(\d{1,4})(?:[_\-\s.]|$)/);
    return {
      segmentId: `archive:${parsed.hostname.toLowerCase()}:${parentPath.toLowerCase()}`,
      trackNumber: numberMatch ? Number(numberMatch[1]) : undefined,
      container: parent.replace(/[_]+/g, ' ').replace(/\s{2,}/g, ' ').trim() || parsed.hostname,
      sourceUrl: `https://web.archive.org/web/${timestamp}id_/${original}`,
    };
  } catch { return {}; }
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

function originVariants(originalUrl) {
  const clean = originalUrl.replace(/\*+$/, '');
  try {
    const parsed = new URL(clean);
    const variants = [originalUrl];
    const alternateHost = parsed.hostname.toLowerCase().startsWith('www.')
      ? parsed.hostname.slice(4)
      : `www.${parsed.hostname}`;
    parsed.hostname = alternateHost;
    variants.push(`${parsed.toString()}*`);
    return [...new Set(variants)];
  } catch { return [originalUrl]; }
}

async function fetchArchiveRows(cdxUrl) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
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

async function streamArchiveRows(cdxUrl, res) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  const response = await fetch(cdxUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CanticosCCB/1.0)', Accept: 'application/json,text/plain;q=0.9,*/*;q=0.8' }, redirect: 'follow', signal: controller.signal });
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const emit = (line) => {
    if (!line.trim()) return;
    const split = line.search(/\s/);
    if (split < 1) return;
    try {
      const key = line.slice(0, split);
      const meta = JSON.parse(line.slice(split + 1));
      // O CDXJ usa a chave urlkey na primeira coluna; a URL original fica
      // no campo `url` (ou `original`, dependendo da versão do Wayback).
      const original = String(meta.original || meta.url || key).trim();
      const extension = extensionOf(original);
      if (!MEDIA_EXTENSIONS.has(extension)) return;
      const item = { name: decodeURIComponent(original.split('/').pop() || original), extension, mimeType: meta.mimetype || meta.mime || 'desconhecido', replayUrl: `https://web.archive.org/web/${meta.timestamp}id_/${original}`, ...externalGrouping(original, meta.timestamp) };
      res.write(`${JSON.stringify({ type: 'file', file: item })}\n`);
    } catch { /* ignora linhas inválidas do CDXJ */ }
  };
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split('\n'); buffer = lines.pop() || '';
    lines.forEach(emit);
    if (done) break;
  }
  emit(buffer);
  clearTimeout(timeout);
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
    const cdxUrls = originVariants(originalUrl).map((variant) => {
      const baseUrl = variant.endsWith('*') ? variant : `${variant}*`;
      return `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(baseUrl)}&output=json&fl=timestamp,original,statuscode,mimetype&filter=statuscode:200&collapse=urlkey&limit=10000`;
    });
    if (req.body?.stream === true) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      try {
        for (const queryUrl of cdxUrls) {
          await streamArchiveRows(queryUrl.replace('output=json', 'output=cdxj'), res);
        }
        res.write(`${JSON.stringify({ type: 'done', sourceUrl: originalUrl })}\n`);
      } catch (error) {
        // Alguns prefixos não aceitam CDXJ; tenta novamente no JSON padrão
        // antes de recorrer ao catálogo local.
        let fallbackFiles = [];
        try {
          const rowSets = await Promise.all(cdxUrls.map((queryUrl) => fetchArchiveRows(queryUrl)));
          const rows = rowSets.flatMap((set) => set.slice(1));
          fallbackFiles = rows.map(([timestamp, original, status, mimeType]) => ({ timestamp, original, status, mimeType, extension: extensionOf(original) }))
            .filter((item) => MEDIA_EXTENSIONS.has(item.extension))
            .map((item) => ({ name: decodeURIComponent(item.original.split('/').pop() || item.original), extension: item.extension, mimeType: item.mimeType || 'desconhecido', replayUrl: `https://web.archive.org/web/${item.timestamp}id_/${item.original}`, ...externalGrouping(item.original, item.timestamp) }));
        } catch { fallbackFiles = filesFromRecoveryCatalog(); }
        fallbackFiles.forEach((file) => res.write(`${JSON.stringify({ type: 'file', file })}\n`));
        res.write(`${JSON.stringify({ type: 'warning', warning: `A consulta externa não respondeu. Exibindo ${fallbackFiles.length} arquivos do catálogo de recuperação já validado.` })}\n`);
        res.write(`${JSON.stringify({ type: 'done', sourceUrl: originalUrl })}\n`);
      }
      return res.end();
    }
    let rows = [];
    let externalError = '';
    try {
      const rowSets = await Promise.all(cdxUrls.map((queryUrl) => fetchArchiveRows(queryUrl)));
      rows = rowSets.flatMap((set) => set.slice(1));
    } catch (error) {
      externalError = String(error?.message || 'Consulta externa indisponível.');
    }
    const dataRows = Array.isArray(rows) ? rows : [];
    let files = dataRows
      .map(([timestamp, original, status, mimeType]) => ({ timestamp, original, status, mimeType, extension: extensionOf(original) }))
      .filter((item) => MEDIA_EXTENSIONS.has(item.extension))
      .map((item) => ({
        name: decodeURIComponent(item.original.split('/').pop() || item.original),
        extension: item.extension,
        mimeType: item.mimeType || 'desconhecido',
        replayUrl: `https://web.archive.org/web/${item.timestamp}id_/${item.original}`,
        ...externalGrouping(item.original, item.timestamp),
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
