import fs from 'node:fs';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx), line.slice(idx + 1)];
    })
);

const SUPABASE_URL = String(env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = String(env.VITE_SUPABASE_ANON_KEY || '');

const PUBLIC_SITE = 'canticosccb.com.br';
const PUBLIC_URL = 'https://www.canticosccb.com.br';
const SOURCE_LABEL = 'Acervo Cânticos CCB';
const MEDIA_EXTENSION_REGEX = /\.(mp3|wma|mid|midi|wav|ogg|aac|m4a|zip)$/i;
const EXTERNAL_SOURCE_REGEX = /(?:archive\.org|ccbhinos(?:\.kit\.net)?)/i;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios em .env.local');
}

function stripExternalSourceMarkers(value = '') {
  return String(value || '')
    .replace(/\bhttps?:\/\/\S+/gi, ' ')
    .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\.[a-z]{2})?\b/gi, ' ')
    .replace(/\bccbhinos\b/gi, ' ')
    .replace(/\bkit[-._\s]*net\b/gi, ' ')
    .replace(/\bwww\b/gi, ' ')
    .replace(MEDIA_EXTENSION_REGEX, ' ')
    .replace(/[_+]+/g, ' ')
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsExternalSource(value) {
  return EXTERNAL_SOURCE_REGEX.test(
    typeof value === 'string' ? value : JSON.stringify(value || '')
  );
}

function slugify(text = '') {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function titleCase(value = '') {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (/^\d+$/.test(word)) return word;
      if (word.length <= 2) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\bCcb\b/g, 'CCB');
}

function sanitizeAlbumTitle(title = '') {
  const cleaned = stripExternalSourceMarkers(title);
  return cleaned ? titleCase(cleaned) : 'Álbum do Acervo';
}

function sanitizeTrackTitle(title = '', number) {
  const leadingNumberMatch = String(title || '').match(/^(\d{1,3})(?=[\s._-]|[A-Za-zÀ-ÿ]|$)/);
  const inferredNumber = leadingNumberMatch ? Number(leadingNumberMatch[1]) : undefined;
  const cleaned = stripExternalSourceMarkers(title)
    .replace(/^\d+[\s._-]*/, '')
    .replace(/([0-9])([A-Za-zÀ-ÿ])/g, '$1 $2')
    .replace(/([a-zà-ÿ])([A-ZÀ-Ý])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned) return titleCase(cleaned);
  return titleCase(number || inferredNumber ? `Faixa ${number || inferredNumber}` : 'Faixa do Acervo');
}

function sanitizeAlbumSlug(row) {
  const sourcePath = row?.metadata?.source_path || row.slug || row.title || 'album-acervo';
  return `acervo-${slugify(stripExternalSourceMarkers(sourcePath)) || 'album-acervo'}`;
}

function sanitizeTrackSlug(row, sanitizedTitle) {
  const base = slugify(stripExternalSourceMarkers(sanitizedTitle)) || `faixa-${row.numero || 'acervo'}`;
  return `acervo-${base}-${String(row.id || '').slice(0, 8)}`;
}

async function fetchAll(pathBuilder, pageSize = 1000) {
  const rows = [];

  for (let offset = 0; ; offset += pageSize) {
    const path = pathBuilder(offset, pageSize);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`GET ${path} => ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }

  return rows;
}

async function patchRow(table, id, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`PATCH ${table}/${id} => ${response.status} ${await response.text()}`);
  }
}

async function patchRows(table, rows, mapper, concurrency = 20) {
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (cursor < rows.length) {
      const index = cursor;
      cursor += 1;
      const row = rows[index];
      const payload = mapper(row);
      await patchRow(table, row.id, payload);
      completed += 1;

      if (completed % 100 === 0 || completed === rows.length) {
        console.log(`${table}: ${completed}/${rows.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length || 1) }, () => worker()));
}

async function fetchAlbumTitlesByHinoIds(hinoIds) {
  const map = new Map();

  for (let index = 0; index < hinoIds.length; index += 100) {
    const batch = hinoIds.slice(index, index + 100).map((id) => `"${id}"`).join(',');
    const path = `album_hinos?select=hino_id,position,album_id,albums(title)&hino_id=in.(${encodeURIComponent(batch)})`;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`GET ${path} => ${response.status} ${await response.text()}`);
    }

    const rows = await response.json();
    for (const row of rows) {
      if (!map.has(row.hino_id)) {
        map.set(row.hino_id, String(row?.albums?.title || '').trim());
      }
    }
  }

  return map;
}

async function patchHinosWithCollisionFallback(rows, albumTitleByHinoId, concurrency = 20) {
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (cursor < rows.length) {
      const index = cursor;
      cursor += 1;
      const row = rows[index];
      const baseTitle = sanitizeTrackTitle(row.titulo, row.numero);
      const albumTitle = sanitizeAlbumTitle(albumTitleByHinoId.get(row.id) || '');
      const candidates = Array.from(new Set([
        baseTitle,
        albumTitle ? `${baseTitle} - ${albumTitle}` : '',
        albumTitle ? `${baseTitle} - ${albumTitle} ${String(row.id).slice(0, 8)}` : `${baseTitle} ${String(row.id).slice(0, 8)}`,
      ].filter(Boolean)));

      let lastError;

      for (const candidate of candidates) {
        try {
          await patchRow('hinos', row.id, {
            titulo: candidate,
            ...(containsExternalSource(row.audio_url) ? { audio_url: null } : {}),
          });
          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
          if (!String(error?.message || '').includes('23505')) {
            throw error;
          }
        }
      }

      if (lastError) {
        throw lastError;
      }

      completed += 1;
      if (completed % 100 === 0 || completed === rows.length) {
        console.log(`hinos: ${completed}/${rows.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length || 1) }, () => worker()));
}

const allAlbums = await fetchAll((offset, limit) => (
  `albums?select=id,title,slug,description,metadata&order=id.asc&limit=${limit}&offset=${offset}`
));
const albums = allAlbums.filter((row) => containsExternalSource(row));

await patchRows('albums', albums, (row) => ({
  title: sanitizeAlbumTitle(row.title),
  slug: sanitizeAlbumSlug(row),
  description: 'Álbum do Acervo canticosccb.com.br.',
  metadata: {
    source: 'acervo',
    import_origin: 'acervo',
    source_format: row?.metadata?.source_format || 'media',
    source_label: SOURCE_LABEL,
    source_site: PUBLIC_SITE,
    public_url: PUBLIC_URL,
    source_path: '',
    category_names: Array.isArray(row?.metadata?.category_names) ? row.metadata.category_names : [],
  },
}));

const allHinos = await fetchAll((offset, limit) => (
  `hinos?select=id,titulo,numero,slug,audio_url&order=id.asc&limit=${limit}&offset=${offset}`
));
const hinos = allHinos.filter((row) => containsExternalSource(row));
const albumTitleByHinoId = await fetchAlbumTitlesByHinoIds(hinos.map((row) => row.id));
await patchHinosWithCollisionFallback(hinos, albumTitleByHinoId, 30);

const remainingHinosWithDirtySlug = await fetchAll((offset, limit) => (
  `hinos?select=id,titulo,numero,slug&slug=ilike.*ccbhinos*&order=id.asc&limit=${limit}&offset=${offset}`
));
await patchRows('hinos', remainingHinosWithDirtySlug, (row) => {
  const titulo = sanitizeTrackTitle(row.titulo, row.numero);
  return {
    slug: sanitizeTrackSlug(row, titulo),
  };
}, 30);

const remainingAlbums = await fetchAll((offset, limit) => (
  `albums?select=id,title,slug,description,metadata&order=id.asc&limit=${limit}&offset=${offset}`
));
const remainingHinos = await fetchAll((offset, limit) => (
  `hinos?select=id,titulo,slug,audio_url&order=id.asc&limit=${limit}&offset=${offset}`
));
const remainingAlbumTextLeaks = remainingAlbums.filter((row) =>
  containsExternalSource([row.title, row.slug, row.description])
);
const remainingAlbumMetadataLeaks = remainingAlbums.filter((row) => containsExternalSource(row.metadata));
const remainingHinoLeaks = remainingHinos.filter((row) => containsExternalSource(row));

console.log(JSON.stringify({
  updated_albums: albums.length,
  updated_hinos: hinos.length,
  remaining_album_text_leaks: remainingAlbumTextLeaks.length,
  remaining_album_metadata_leaks: remainingAlbumMetadataLeaks.length,
  remaining_hino_leaks: remainingHinoLeaks.length,
}, null, 2));
