import { getEmergencyArchiveZipSegmentById } from './_emergencyAudioArchives.js';

interface EmergencyArchiveZipSegment {
  id: string;
  start: number;
  end: number;
  originalUrl: string;
  albumSlug: string;
  albumTitle: string;
}

const snapshotCache = new Map<string, string>();

async function resolveSnapshotUrl(segment: EmergencyArchiveZipSegment): Promise<string> {
  const cached = snapshotCache.get(segment.id);
  if (cached) {
    return cached;
  }

  const timegateUrl = `https://web.archive.org/web/${encodeURIComponent(segment.originalUrl)}`;
  const timegateResponse = await fetch(timegateUrl, {
    method: 'HEAD',
    headers: { 'User-Agent': 'CanticosCCB/1.0 (emergency-audio)' },
    redirect: 'manual',
  });

  const redirectedLocation = timegateResponse.headers.get('location');
  if (redirectedLocation) {
    const resolved = redirectedLocation.replace(/\/web\/(\d+)\//, '/web/$1if_/');
    snapshotCache.set(segment.id, resolved);
    return resolved;
  }

  const cdxUrl =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(segment.originalUrl)}` +
    '&output=json&limit=-1&fl=timestamp,original,statuscode,mimetype';

  const cdxResponse = await fetch(cdxUrl, {
    headers: { 'User-Agent': 'CanticosCCB/1.0 (emergency-audio)' },
    redirect: 'follow',
  });

  if (!cdxResponse.ok) {
    throw new Error(`Wayback retornou ${timegateResponse.status}/${cdxResponse.status} para ${segment.id}.`);
  }

  const payload = await cdxResponse.json();
  const rows = Array.isArray(payload) ? payload.slice(1).filter(Array.isArray) : [];
  const goodRows = rows.filter((row: any[]) => String(row?.[2]) === '200');
  const bestRow = goodRows.length > 0 ? goodRows[goodRows.length - 1] : rows[rows.length - 1];

  if (!bestRow?.[0] || !bestRow?.[1]) {
    throw new Error(`Nenhuma captura válida encontrada para ${segment.id}.`);
  }

  const resolved = `https://web.archive.org/web/${bestRow[0]}if_/${bestRow[1]}`;
  snapshotCache.set(segment.id, resolved);
  return resolved;
}

export default async function handler(req: Request) {
  const requestUrl = new URL(req.url, 'http://127.0.0.1');
  const { searchParams } = requestUrl;
  const segmentId = String(searchParams.get('segment') || '').trim();

  if (!segmentId) {
    return new Response(JSON.stringify({ error: 'Segmento do acervo ausente.' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const segment = getEmergencyArchiveZipSegmentById(segmentId);
  if (!segment) {
    return new Response(JSON.stringify({ error: 'Segmento do acervo inválido.' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const snapshotUrl = await resolveSnapshotUrl(segment);
    const archiveResponse = await fetch(snapshotUrl, {
      headers: { 'User-Agent': 'CanticosCCB/1.0 (emergency-audio)' },
      redirect: 'follow',
    });

    if (!archiveResponse.ok) {
      return new Response(
        JSON.stringify({ error: `O acervo respondeu ${archiveResponse.status} para ${segmentId}.` }),
        {
          status: archiveResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const headers = new Headers({
      'Content-Type': archiveResponse.headers.get('Content-Type') || 'application/zip',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
    });

    const contentLength = archiveResponse.headers.get('Content-Length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new Response(archiveResponse.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || 'Falha ao carregar o ZIP do acervo.' }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
