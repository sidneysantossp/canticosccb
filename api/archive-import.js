import { EMERGENCY_AUDIO_INDEX } from './_emergencyAudioIndex.js';

export const config = { maxDuration: 120 };

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function env(name) {
  return String(process.env[name] || '').trim().replace(/^['"]|['"]$/g, '');
}

async function requireAdmin(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const supabaseUrl = env('SUPABASE_URL') || env('VITE_SUPABASE_URL');
  const anonKey = env('SUPABASE_ANON_KEY') || env('VITE_SUPABASE_ANON_KEY');
  if (!token || !supabaseUrl || !anonKey) throw new Error('Sessão administrativa necessária.');

  const headers = { apikey: anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const userResponse = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/user`, { headers });
  if (!userResponse.ok) throw new Error('Sessão inválida.');
  const user = await userResponse.json();
  const profileResponse = await fetch(
    `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/users?id=eq.${encodeURIComponent(user.id)}&select=is_admin,status,is_blocked&limit=1`,
    { headers },
  );
  const profile = profileResponse.ok ? (await profileResponse.json())[0] : null;
  if (!profile?.is_admin || profile.status === 'inactive' || profile.is_blocked === true) {
    throw new Error('Acesso administrativo necessário.');
  }
  return { supabaseUrl: supabaseUrl.replace(/\/+$/, ''), headers };
}

function cleanTrackTitle(rawName, segment) {
  let value = String(rawName || '').replace(/\.[^.]+$/, '');
  const prefixes = [segment?.albumSlug, segment?.albumTitle]
    .map((item) => String(item || '').replace(/[-_]+/g, ' ').trim())
    .filter(Boolean);
  value = value.replace(/www\.canticosccb\.com\.br/gi, '');
  value = value.replace(/canticosccb\.com\.br/gi, '');
  value = value.replace(/Hinos de Louvores e Suplicas a Deus/gi, '');
  value = value.replace(/Arranjos Orquestrados/gi, '');
  for (const prefix of prefixes) {
    const compactPrefix = prefix.replace(/\s+/g, '');
    if (value.toLowerCase().startsWith(compactPrefix.toLowerCase())) value = value.slice(compactPrefix.length);
    if (value.toLowerCase().startsWith(prefix.toLowerCase())) value = value.slice(prefix.length);
  }
  value = value
    .replace(/([a-zá-ú])([A-ZÁ-Ú])/g, '$1 $2')
    .replace(/[_]+/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/^(?:\s*-\s*)+|(?:\s*-\s*)+$/g, '')
    .replace(/^[\s-]+|[\s-]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const pieces = value.split(' - ').map((piece) => piece.trim()).filter(Boolean);
  const title = pieces.at(-1) || value || 'Faixa sem título';
  return title.replace(/^[\s-]+|[\s-]+$/g, '') || 'Faixa sem título';
}

function siteBase(req) {
  const configured = env('SITE_URL') || env('VITE_SITE_URL');
  if (configured) return configured.replace(/\/+$/, '');
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'www.canticosccb.com.br');
  const protocol = String(req.headers['x-forwarded-proto'] || '').split(',')[0] || (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

function tracksForSegment(req, archive) {
  const segment = archive.segment || {};
  return (Array.isArray(archive.entries) ? archive.entries : []).map((entry, index) => {
    const number = Number(segment.start || 1) + index;
    const title = cleanTrackTitle(entry?.name, segment);
    const params = new URLSearchParams({ segment: String(segment.id), number: String(number), title });
    return { title, number, audio_url: `${siteBase(req)}/api/emergency-audio-track?${params.toString()}` };
  });
}

async function supabaseJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const missingMigration = response.status === 404 || /archive_recovery_imports|admin_stage_archive_album|schema cache/i.test(text);
    const error = new Error(missingMigration
      ? 'A estrutura de recuperação ainda não foi criada no banco. Execute CREATE_ARCHIVE_RECOVERY_IMPORTS.sql.'
      : (payload?.message || payload?.error || `Falha no banco (${response.status}).`));
    error.statusCode = missingMigration ? 503 : response.status;
    throw error;
  }
  return payload;
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return json(res, 405, { error: 'Método não permitido.' });
  try {
    const { supabaseUrl, headers } = await requireAdmin(req);
    if (req.method === 'GET') {
      const url = `${supabaseUrl}/rest/v1/archive_recovery_imports?select=source_key,album_id,status,media_status,files_count,imported_files_count,created_at,updated_at&order=created_at.desc`;
      const rows = await supabaseJson(url, { headers });
      return json(res, 200, { imports: Array.isArray(rows) ? rows : [] });
    }

    const segmentIds = [...new Set((Array.isArray(req.body?.segmentIds) ? req.body.segmentIds : []).map(String))];
    const requestedAlbums = Array.isArray(req.body?.albums) ? req.body.albums : [];
    if (segmentIds.length + requestedAlbums.length === 0 || segmentIds.length + requestedAlbums.length > 20) {
      return json(res, 400, { error: 'Selecione entre 1 e 20 álbuns por operação.' });
    }

    const results = [];
    for (const segmentId of segmentIds) {
      const archive = EMERGENCY_AUDIO_INDEX[segmentId];
      if (!archive?.segment) {
        results.push({ source_key: segmentId, success: false, error: 'Álbum não localizado no catálogo validado.' });
        continue;
      }
      const payload = await supabaseJson(`${supabaseUrl}/rest/v1/rpc/admin_stage_archive_album`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          p_source_key: `archive-catalog:${archive.segment.id}`,
          p_source_url: String(archive.segment.originalUrl || archive.snapshotUrl || ''),
          p_album_title: String(archive.segment.albumTitle || archive.segment.id),
          p_tracks: tracksForSegment(req, archive),
        }),
      });
      results.push({ source_key: segmentId, success: true, ...payload });
    }

    for (const album of requestedAlbums) {
      const sourceKey = String(album?.sourceKey || '').trim();
      const title = String(album?.title || '').trim();
      const sourceUrl = String(album?.sourceUrl || '').trim();
      const tracks = Array.isArray(album?.tracks) ? album.tracks : [];
      if (!sourceKey || !title || !sourceUrl || tracks.length === 0 || tracks.length > 500) {
        results.push({ source_key: sourceKey, success: false, error: 'Álbum externo inválido.' });
        continue;
      }
      const payload = await supabaseJson(`${supabaseUrl}/rest/v1/rpc/admin_stage_archive_album`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          p_source_key: `archive-catalog:${sourceKey}`,
          p_source_url: sourceUrl,
          p_album_title: title,
          // Endereços externos não são publicados: a mídia fica pendente de
          // transferência para o armazenamento atual.
          p_tracks: tracks.map((track, index) => ({
            title: String(track?.title || track?.name || '').trim(),
            number: Number(track?.number) || index + 1,
            audio_url: '',
          })),
        }),
      });
      results.push({ source_key: sourceKey, success: true, ...payload });
    }
    return json(res, 200, { results });
  } catch (error) {
    const message = String(error?.message || 'Não foi possível cadastrar os álbuns.');
    const status = Number(error?.statusCode) || (/Sessão|Acesso/i.test(message) ? 403 : 500);
    return json(res, status, { error: message });
  }
}
