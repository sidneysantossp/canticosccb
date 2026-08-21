// Vercel Edge Function — serves pre-rendered HTML to bots/crawlers
// For a Vite SPA, this is the correct way to do SSR on Vercel
// Deployed at /api/ssr and called via vercel.json rewrites for bot user-agents

export const config = { runtime: 'edge' };

// ─── Bot Detection ───────────────────────────────────────────────────────────
const BOT_UA_PATTERNS = [
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp', 'baiduspider',
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot',
  'discordbot', 'applebot', 'pinterest', 'redditbot',
  'gptbot', 'oai-searchbot', 'chatgpt-user', 'claudebot', 'google-extended', 'applebot-extended',
  'perplexitybot', 'perplexity-user', 'bytespider', 'ccbot', 'amazonbot', 'meta-externalagent',
  'petalbot', 'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot',
  'embedly', 'quora link preview', 'showyoubot', 'outbrain', 'rogerbot',
  'screaming frog',
];

function isBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BOT_UA_PATTERNS.some(p => lower.includes(p));
}

// ─── Supabase Config ─────────────────────────────────────────────────────────
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SITE_URL = 'https://www.canticosccb.com.br';
const SSR_FIXTURE_MODE = process.env.NODE_ENV !== "production" && process.env.SSR_FIXTURE_MODE === "1";
const FIXTURE_HYMN_ID = "d0c5dff2-679d-4288-b5be-6c9e98c3e2e5";
function fixtureRows(table: string, params: Record<string, string>): any[] {
  const isMissing = Object.values(params).some((v) => /999999|inexistente|browser/.test(String(v)));
  if (isMissing) return [];
  const hymn = { id: FIXTURE_HYMN_ID, numero: 1, titulo: "Cristo Meu Mestre", compositor_nome: "Elias Brandão", categoria: "Hinos CCB", letra: "Cristo meu Mestre, meu Salvador", duracao: "PT3M", cover_url: null };
  if (table === "hinos") return [hymn];
  if (table === "hinario") return [{ numero: 1, titulo: "Cristo Meu Mestre", is_active: true }];
  if (table === "cifra_public_catalog") return [{ version_id: "fixture-version-1", public_slug: "hino-avulso-cana-trilhada", version_title: "Cana Trilhada", instrument: "violao", arrangement_type: "principal", difficulty_level: "intermediario", original_key: "C", preferred_key: "C", capo: 0, tempo_bpm: 90, time_signature: "4/4", publication_label: "Cifra CCB", is_primary: true, published_at: "2026-01-01", song_id: "fixture-song-1", song_slug: "cana-trilhada", song_title: "Cana Trilhada", song_subtitle: null, composer_name: "Elias Brandão", hino_id: FIXTURE_HYMN_ID, hinario_numero: 1, source_type: "fixture", cover_url: null, seo_title: "Cana Trilhada — Cifra CCB", seo_description: "Cifra de Cana Trilhada", seo_keywords: "cifra, CCB", sections_count: 1, lines_count: 2, chords_index: "C,G,Am" }];
  if (table === "cifra_version_sections") return [{ section_order: 1, section_label: "Principal", plain_text: "Cana trilhada\nC G Am" }];
  if (table === "categorias") return [{ id: "fixture-category-1", slug: "hinos-ccb", nome: "Hinos CCB", titulo: "Hinos CCB", descricao: "Hinos da Congregação Cristã no Brasil" }];
  if (table === "hino_categorias") return [{ hino_id: FIXTURE_HYMN_ID, categoria_id: "fixture-category-1" }];
  if (table === "cifras") return [{ id: "fixture-chord-1", hino_id: FIXTURE_HYMN_ID, slug: "hino-avulso-cana-trilhada", titulo: "Cana Trilhada", tom: "C", instrumento: "violao", cifra: "C G Am" }];
  return [];
}

class SupabaseUnavailableError extends Error {
  constructor(message: string) { super(message); this.name = "SupabaseUnavailableError"; }
}

async function serveSpaIndex(): Promise<Response> {
  try {
    const indexResponse = await fetch(`${SITE_URL}/index.html`, { signal: AbortSignal.timeout(8000) });
    if (!indexResponse.ok) throw new Error(`index.html returned HTTP ${indexResponse.status}`);
    return new Response(await indexResponse.text(), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, follow',
      },
    });
  } catch (error) {
    console.error('[SSR] SPA index unavailable:', error);
    return new Response('<html><head><title>Serviço temporariamente indisponível | Cânticos CCB</title></head><body><h1>Serviço temporariamente indisponível</h1><p>Tente novamente mais tarde.</p></body></html>', {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '60',
      },
    });
  }
}

async function supaFetch(table: string, params: Record<string, string>): Promise<any[]> {
  if (SSR_FIXTURE_MODE) return fixtureRows(table, params);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new SupabaseUnavailableError("Supabase configuration is unavailable");
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString(), { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new SupabaseUnavailableError(`Supabase ${table} returned HTTP ${res.status}`);
    return res.json();
  } catch (error) {
    if (error instanceof SupabaseUnavailableError) throw error;
    throw new SupabaseUnavailableError(`Supabase ${table} request failed`);
  }
}
// ─── UUID Extraction ─────────────────────────────────────────────────────────
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function extractUUID(param: string): string {
  const m = param.match(UUID_RE);
  return m ? m[0] : param;
}

function slugifyText(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function normalizeHymnTitle(title: string, numero?: number | string): string {
  let normalized = String(title || '').trim();
  if (numero != null && numero !== '') {
    const escapedNumber = String(numero).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const leadingPattern = new RegExp(`^hino\\s*${escapedNumber}(?:\\s*ccb)?\\s*[-:–]?\\s*`, 'i');
    normalized = normalized.replace(leadingPattern, '').trim();
  }
  return normalized || String(title || '').trim();
}

function stripHtml(value: string): string {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactWhitespace(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function truncate(value: string, maxLength: number): string {
  const normalized = compactWhitespace(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function buildHinoUrl(id: string, titulo?: string, numero?: number | string): string {
  if (!titulo) return `/hino/${id}`;
  const parts = ['hino'];
  if (numero != null && numero !== '') parts.push(String(numero));
  parts.push('ccb');
  const normalizedTitle = normalizeHymnTitle(titulo, numero);
  if (normalizedTitle) parts.push(slugifyText(normalizedTitle));
  return `/hino/${parts.join('-')}-${id}`;
}

function buildAlbumUrl(id: string, titulo?: string, artista?: string): string {
  if (!titulo) return `/album/${id}`;
  const parts = [slugifyText(titulo)];
  if (artista) parts.push(slugifyText(artista));
  return `/album/${parts.join('-')}-${id}`;
}

function buildCompositorUrl(id: string, nome?: string): string {
  if (!nome) return `/compositor/${id}`;
  return `/compositor/${slugifyText(nome)}-${id}`;
}

function normalizeConnectionText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isTraditionalHinarioSong(song: { numero?: number | null; categoria?: string }): boolean {
  const numero = Number(song.numero || 0);
  if (numero >= 1 && numero <= 480) return true;

  const normalizedCategory = normalizeConnectionText(String(song.categoria || ''));
  return normalizedCategory === 'hinario5' || normalizedCategory === 'hinario 5' || normalizedCategory.includes('hinario');
}

function extractHymnNumberFromText(value: string): number | null {
  const normalized = String(value || '').trim();
  const match = normalized.match(/(?:^|\b)hino\s*(\d{1,3})\b|^(\d{1,3})\s*(?:-|:|\u2013|\))/i);
  const number = Number(match?.[1] || match?.[2] || 0);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function tokenizeConnectionText(value: string): string[] {
  return normalizeConnectionText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && token !== 'ccb' && token !== 'hino');
}

function scoreConnectionCandidate(candidateTitle: string, targetTitle: string, candidateNumber?: number | null, targetNumber?: number | null): number {
  const normalizedCandidate = normalizeConnectionText(normalizeHymnTitle(candidateTitle, candidateNumber ?? undefined));
  const normalizedTarget = normalizeConnectionText(normalizeHymnTitle(targetTitle, targetNumber ?? undefined));
  if (!normalizedCandidate || !normalizedTarget) return 0;

  let score = 0;
  if (normalizedCandidate === normalizedTarget) score += 10;
  if (normalizedCandidate.includes(normalizedTarget) || normalizedTarget.includes(normalizedCandidate)) score += 6;
  for (const token of tokenizeConnectionText(normalizedTarget)) {
    if (normalizedCandidate.includes(token)) score += 2;
  }
  return score;
}

async function findRelatedHymnForSsr(params: { hymnId?: string; numero?: number | null; title?: string }): Promise<any | null> {
  if (params.hymnId) {
    const exactRows = await supaFetch('hinos', {
      id: `eq.${params.hymnId}`,
      'or': '(ativo.eq.true,ativo.eq.1)',
      select: 'id,numero,titulo,compositor_nome,categoria',
      limit: '1',
    });
    if (exactRows[0]) return exactRows[0];
  }

  const numero = Number(params.numero || 0);
  const candidates: any[] = [];
  const seen = new Set<string>();

  if (numero > 0) {
    const numberRows = await supaFetch('hinos', {
      numero: `eq.${numero}`,
      'or': '(ativo.eq.true,ativo.eq.1)',
      select: 'id,numero,titulo,compositor_nome,categoria',
      limit: '20',
    });
    for (const row of numberRows) {
      const key = String(row.id);
      if (!seen.has(key)) {
        candidates.push(row);
        seen.add(key);
      }
    }
  }

  const title = normalizeHymnTitle(String(params.title || ''), numero || undefined);
  const searchToken = tokenizeConnectionText(title).slice(0, 4).join(' ');
  if (searchToken.length >= 3) {
    const titleRows = await supaFetch('hinos', {
      titulo: `ilike.%${searchToken}%`,
      'or': '(ativo.eq.true,ativo.eq.1)',
      select: 'id,numero,titulo,compositor_nome,categoria',
      limit: '50',
    });
    for (const row of titleRows) {
      const key = String(row.id);
      if (!seen.has(key)) {
        candidates.push(row);
        seen.add(key);
      }
    }
  }

  const best = candidates
    .map((row: any) => {
      const candidateNumber = Number(row.numero || 0);
      let score = 0;
      if (numero > 0 && candidateNumber === numero) score += 14;
      score += scoreConnectionCandidate(String(row.titulo || ''), title, candidateNumber, numero);
      return { row, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  return best && best.score > 0 ? best.row : null;
}

async function findRelatedCifraForSsr(params: { hymnId?: string; numero?: number | null; title?: string }): Promise<any | null> {
  const mapPublicRow = (row: any) => ({
    slug: String(row.public_slug || ''),
    title: String(row.song_title || row.version_title || ''),
    original_key: String(row.original_key || ''),
    instrument: String(row.instrument || ''),
    hino_id: row.hino_id ? String(row.hino_id) : null,
  });

  if (params.hymnId) {
    const exactPublicRows = await supaFetch('cifra_public_catalog', {
      hino_id: `eq.${params.hymnId}`,
      select: 'public_slug,song_title,version_title,original_key,instrument,hino_id,hinario_numero,is_primary,published_at',
      order: 'is_primary.desc,published_at.desc.nullslast',
      limit: '1',
    });
    if (exactPublicRows[0]) return mapPublicRow(exactPublicRows[0]);
  }

  if (params.numero) {
    const byNumeroRows = await supaFetch('cifra_public_catalog', {
      hinario_numero: `eq.${params.numero}`,
      select: 'public_slug,song_title,version_title,original_key,instrument,hino_id,hinario_numero,is_primary,published_at',
      order: 'is_primary.desc,published_at.desc.nullslast',
      limit: '3',
    });
    if (byNumeroRows[0]) return mapPublicRow(byNumeroRows[0]);
  }

  const publicRows = await supaFetch('cifra_public_catalog', {
    select: 'public_slug,song_title,version_title,original_key,instrument,hino_id,hinario_numero,is_primary,published_at',
    order: 'is_primary.desc,published_at.desc.nullslast',
    limit: '500',
  });

  const numero = Number(params.numero || 0);
  const title = normalizeHymnTitle(String(params.title || ''), numero || undefined);
  const bestPublic = publicRows
    .map((row: any) => {
      const baseTitle = String(row.song_title || row.version_title || '');
      const candidateNumber = Number(row.hinario_numero || extractHymnNumberFromText(baseTitle) || 0);
      let score = 0;
      if (params.hymnId && row.hino_id === params.hymnId) score += 20;
      if (numero > 0 && candidateNumber === numero) score += 12;
      score += scoreConnectionCandidate(baseTitle, title, candidateNumber, numero);
      return { row, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  if (bestPublic && bestPublic.score > 0) {
    return mapPublicRow(bestPublic.row);
  }

  if (params.hymnId) {
    const exactRows = await supaFetch('cifras', {
      hino_id: `eq.${params.hymnId}`,
      is_active: 'eq.true',
      select: 'slug,title,original_key,instrument,hino_id',
      limit: '1',
    });
    if (exactRows[0]) return exactRows[0];
  }

  const rows = await supaFetch('cifras', {
    is_active: 'eq.true',
    select: 'slug,title,original_key,instrument,hino_id',
    limit: '500',
  });

  const best = rows
    .map((row: any) => {
      const candidateNumber = extractHymnNumberFromText(row.title || '');
      let score = 0;
      if (params.hymnId && row.hino_id === params.hymnId) score += 20;
      if (numero > 0 && candidateNumber === numero) score += 12;
      score += scoreConnectionCandidate(String(row.title || ''), title, candidateNumber, numero);
      return { row, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  return best && best.score > 0 ? best.row : null;
}

// ─── HTML Builder ────────────────────────────────────────────────────────────
function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildV2CifraContentHtml(sections: any[]): string {
  if (!sections.length) {
    return '';
  }

  const content = sections
    .map((section: any) => {
      const label = String(section.section_label || '').trim();
      const plainText = String(section.plain_text || '').trimEnd();
      return `${label ? `[${label}]` : ''}${label && plainText ? '\n' : ''}${plainText}`;
    })
    .join('\n\n')
    .trim();

  if (!content) {
    return '';
  }

  return `<section><h2>Cifra</h2><pre style="white-space:pre-wrap;">${esc(content)}</pre></section>`;
}

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogType?: string;
  ogImage?: string;
  schemas?: object[];
  bodyHtml: string;
  noindex?: boolean;
  status?: number;
}

function buildFullHtml(meta: PageMeta): string {
  const ogType = meta.ogType || 'website';
  const ogImage = meta.ogImage || `${SITE_URL}/logo-canticos-ccb.png`;
  const robotsContent = meta.noindex ? 'noindex, follow' : 'index, follow';
  const schemasHtml = (meta.schemas || [])
    .map(s => '<script type="application/ld+json">' + JSON.stringify(s) + '</script>')
    .join('\n    ');
  const canonicalHtml = meta.noindex ? '' : '<link rel="canonical" href="' + esc(meta.canonical) + '">';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(meta.title)}</title>
    <meta name="description" content="${esc(meta.description)}">
    <meta name="robots" content="${robotsContent}">
    <meta name="googlebot" content="${robotsContent}">
    <meta name="google-adsense-account" content="ca-pub-3459130972339055">
    ${canonicalHtml}
    <meta name="author" content="Cânticos CCB">
    <meta name="keywords" content="hinos CCB, hinário 5, congregação cristã no brasil, cifras CCB, hinos cantados, hinos tocados, compositores CCB">

    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="Cânticos CCB">
    <meta property="og:title" content="${esc(meta.title)}">
    <meta property="og:description" content="${esc(meta.description)}">
    <meta property="og:image" content="${esc(ogImage)}">
    <meta property="og:url" content="${esc(meta.canonical)}">
    <meta property="og:locale" content="pt_BR">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(meta.title)}">
    <meta name="twitter:description" content="${esc(meta.description)}">
    <meta name="twitter:image" content="${esc(ogImage)}">

    ${schemasHtml}
</head>
<body style="max-width:900px;margin:0 auto;padding:40px 20px;font-family:system-ui,sans-serif;color:#e5e7eb;background:#121212;">
    ${meta.bodyHtml}
</body>
</html>`;
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

async function handleHino(idParam: string): Promise<PageMeta | null> {
  const uuid = extractUUID(idParam);
  const rows = await supaFetch('hinos', {
    id: `eq.${uuid}`,
    select: 'id,numero,titulo,compositor_nome,categoria,letra,duracao,cover_url',
    limit: '1',
  });
  if (!rows.length) return null;
  const h = rows[0];
  const num = h.numero || '';
  const titulo = normalizeHymnTitle(h.titulo || 'Hino CCB', h.numero);
  const [relatedLyricRows, relatedCifra] = await Promise.all([
    num
      ? supaFetch('hinario', {
          numero: `eq.${num}`,
          is_active: 'eq.true',
          select: 'numero,titulo',
          limit: '1',
        })
      : Promise.resolve([] as any[]),
    findRelatedCifraForSsr({ hymnId: String(h.id), numero: Number(h.numero || 0), title: titulo }),
  ]);
  const relatedLyric = relatedLyricRows[0];
  const canonicalPath = buildHinoUrl(String(h.id), titulo, h.numero);
  const canonical = `${SITE_URL}${canonicalPath}`;
  const title = num
    ? `Hino ${num} CCB - ${titulo} | Ouça, Letra e Cifra | Cânticos CCB`
    : `${titulo} | Ouça, Letra e Cifra | Cânticos CCB`;
  const desc = truncate(
    `Ouça o Hino ${num} CCB ${titulo}${h.compositor_nome ? `, composto por ${h.compositor_nome}` : ''}.${relatedLyric ? ` Leia a letra no Hinário ${num}.` : ''}${relatedCifra ? ` Veja também a cifra${relatedCifra.original_key ? ` em ${relatedCifra.original_key}` : ''}.` : ''} Navegue pelo repertório da Congregação Cristã no Brasil.`,
    158
  );

  const schema: any = {
    '@context': 'https://schema.org', '@type': 'MusicRecording',
    name: titulo, url: canonical, genre: 'Hino Religioso', inLanguage: 'pt-BR',
  };
  if (h.numero) schema.position = h.numero;
  if (h.compositor_nome) schema.byArtist = { '@type': 'Person', name: h.compositor_nome };
  if (h.duracao) schema.duration = h.duracao;
  if (h.cover_url) schema.image = h.cover_url;

  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: `Hino ${num}`, item: canonical },
    ],
  };

  const letraHtml = h.letra
    ? `<section><h2>Letra do Hino ${num}</h2><div style="white-space:pre-line;">${esc(h.letra)}</div></section>`
    : '';
  const relatedLinks = [
    relatedLyric ? `<a href="${SITE_URL}/hinario/${num}">Ler a letra no Hinário</a>` : '',
    relatedCifra ? `<a href="${SITE_URL}/cifra/${relatedCifra.slug}">Ver cifra${relatedCifra.original_key ? ` (${esc(relatedCifra.original_key)})` : ''}</a>` : '',
    `<a href="${SITE_URL}/hinos-ccb">Hinos CCB</a>`,
    `<a href="${SITE_URL}/cifras-hinos-ccb">Cifras de Hinos CCB</a>`,
  ].filter(Boolean).join(' · ');

  return {
    title, description: desc, canonical, ogType: 'music.song', ogImage: h.cover_url || undefined,
    schemas: [schema, breadcrumb],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/hinario">Hinário</a> &rsaquo; Hino ${num}</nav>
      <h1>Hino ${num} CCB - ${esc(titulo)}</h1>
      ${h.compositor_nome ? `<p><strong>Compositor:</strong> ${esc(h.compositor_nome)}</p>` : ''}
      ${h.categoria ? `<p><strong>Categoria:</strong> ${esc(h.categoria)}</p>` : ''}
      ${h.duracao ? `<p><strong>Duração:</strong> ${esc(h.duracao)}</p>` : ''}
      <p>${relatedLinks}</p>
      ${letraHtml}
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handleCompositor(idParam: string): Promise<PageMeta | null> {
  const uuid = extractUUID(idParam);
  const rows = await supaFetch('composer_public_profiles', {
    id: `eq.${uuid}`,
    select: 'id,name,artistic_name,bio,avatar_url,is_trending,followers_count',
    limit: '1',
  });
  if (!rows.length) return null;
  const c = rows[0];
  const nome = c.artistic_name || c.name || 'Compositor CCB';
  const bio = compactWhitespace(stripHtml(c.biography || c.bio || ''));
  const canonicalPath = buildCompositorUrl(String(c.id), nome);
  const canonical = `${SITE_URL}${canonicalPath}`;
  const title = `${nome} | Hinos, Biografia e Repertório CCB | Cânticos CCB`;
  const desc = bio
    ? truncate(bio, 158)
    : truncate(`Conheça ${nome}, compositor de hinos da Congregação Cristã no Brasil. Veja biografia, repertório, letras e hinos associados.`, 158);
  const image = c.photo_url || c.avatar_url || undefined;

  const hinos = await supaFetch('hinos', {
    and: `(or(compositor_nome.ilike.%${nome}%,compositor_nome.ilike.%${c.name || nome}%),or(ativo.eq.true,ativo.eq.1))`,
    select: 'id,numero,titulo',
    order: 'numero.asc',
    limit: '100',
  });

  const schema = {
    '@context': 'https://schema.org', '@type': 'ProfilePage',
    name: nome, url: canonical, description: desc.substring(0, 200),
    mainEntity: {
      '@type': 'Person',
      name: nome,
      ...(image ? { image } : {}),
      ...(bio ? { description: bio } : {}),
    },
    ...(image ? { image } : {}),
  };
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Compositores', item: `${SITE_URL}/compositores` },
      { '@type': 'ListItem', position: 3, name: nome, item: canonical },
    ],
  };

  const hinosHtml = hinos.length > 0
    ? `<section><h2>Hinos de ${esc(nome)}</h2><ul>${hinos
      .filter((h: any) => h.numero != null || h.titulo)
      .map((h: any) => {
        const numeroLabel = h.numero != null ? `Hino ${h.numero}` : 'Hino';
        const cleanTitle = normalizeHymnTitle(h.titulo || '', h.numero);
        const href = `${SITE_URL}${buildHinoUrl(String(h.id), cleanTitle, h.numero)}`;
        return `<li><a href="${href}">${esc(numeroLabel)}${cleanTitle ? ` - ${esc(cleanTitle)}` : ''}</a></li>`;
      }).join('')}</ul></section>`
    : '';

  return {
    title, description: desc, canonical, ogType: 'profile', ogImage: image,
    schemas: [schema, breadcrumb],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/compositores">Compositores</a> &rsaquo; ${esc(nome)}</nav>
      <h1>${esc(nome)}</h1>
      ${c.category ? `<p><strong>Categoria:</strong> ${esc(c.category)}</p>` : ''}
      ${bio ? `<section><h2>Biografia</h2><p>${esc(bio)}</p></section>` : ''}
      ${hinosHtml}
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handleAlbum(idParam: string): Promise<PageMeta | null> {
  const uuid = extractUUID(idParam);
  const rows = await supaFetch('albums', {
    id: `eq.${uuid}`,
    select: 'id,title,description,artist,cover_url',
    limit: '1',
  });
  if (!rows.length) return null;
  const a = rows[0];
  const albumTitle = compactWhitespace(a.title || 'Álbum CCB');
  const albumArtist = compactWhitespace(a.artist || 'CCB');
  const canonicalPath = buildAlbumUrl(String(a.id), albumTitle, albumArtist);
  const canonical = `${SITE_URL}${canonicalPath}`;
  const title = `${albumTitle}${albumArtist ? ` - ${albumArtist}` : ''} | Álbum de Hinos CCB | Cânticos CCB`;
  const desc = truncate(
    stripHtml(a.description || '') || `Ouça o álbum ${albumTitle}${albumArtist ? ` de ${albumArtist}` : ''}. Repertório de hinos da Congregação Cristã no Brasil.`,
    158
  );

  const schema = {
    '@context': 'https://schema.org', '@type': 'MusicAlbum',
    name: albumTitle, url: canonical,
    ...(albumArtist ? { byArtist: { '@type': 'Person', name: albumArtist } } : {}),
    ...(a.cover_url ? { image: a.cover_url } : {}),
  };
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Álbuns', item: `${SITE_URL}/albuns` },
      { '@type': 'ListItem', position: 3, name: albumTitle, item: canonical },
    ],
  };

  return {
    title, description: desc, canonical, ogType: 'music.album', ogImage: a.cover_url || undefined,
    schemas: [schema, breadcrumb],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/albuns">Álbuns</a> &rsaquo; ${esc(albumTitle)}</nav>
      <h1>${esc(albumTitle)}</h1>
      ${albumArtist ? `<p><strong>Artista:</strong> ${esc(albumArtist)}</p>` : ''}
      ${a.description ? `<p>${esc(stripHtml(a.description))}</p>` : ''}
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handleHinarioView(numero: string): Promise<PageMeta | null> {
  const num = parseInt(numero, 10);
  if (isNaN(num)) return null;
  const rows = await supaFetch('hinario', {
    numero: `eq.${num}`,
    is_active: 'eq.true',
    select: 'id,numero,titulo,subtitulo,conteudo,categoria',
    limit: '1',
  });
  if (!rows.length) return null;
  const h = rows[0];
  const titulo = h.titulo || '';
  const [relatedHymn, relatedCifra] = await Promise.all([
    findRelatedHymnForSsr({ numero: num, title: titulo }),
    findRelatedCifraForSsr({ numero: num, title: titulo }),
  ]);
  const title = `Hino ${h.numero} — ${titulo} | Letra Completa do Hinário 5 | Cânticos CCB`;
  const desc = `Leia a letra completa do Hino ${h.numero} "${titulo}" do Hinário 5 da Congregação Cristã no Brasil.${relatedHymn ? ' Página de áudio relacionada disponível.' : ''}${relatedCifra ? ` Cifra relacionada${relatedCifra.original_key ? ` em ${relatedCifra.original_key}` : ''} disponível.` : ''}${h.subtitulo ? ` ${h.subtitulo}.` : ''}`;
  const canonical = `${SITE_URL}/hinario/${h.numero}`;

  const schema = {
    '@context': 'https://schema.org', '@type': 'CreativeWork',
    name: `Hino ${h.numero} — ${titulo}`, url: canonical,
    inLanguage: 'pt-BR', genre: 'Hino Religioso',
    isPartOf: { '@type': 'Book', name: 'Hinário 5 — Hinos de Louvores e Súplicas a Deus' },
  };
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Hinário', item: `${SITE_URL}/hinario` },
      { '@type': 'ListItem', position: 3, name: `Hino ${h.numero}`, item: canonical },
    ],
  };

  const conteudoHtml = h.conteudo
    ? `<section><h2>Letra do Hino ${h.numero}</h2><div style="white-space:pre-line;">${esc(h.conteudo)}</div></section>`
    : '';
  const relatedLinks = [
    relatedHymn ? `<a href="${SITE_URL}${buildHinoUrl(String(relatedHymn.id), relatedHymn.titulo, relatedHymn.numero)}">Ouvir este hino</a>` : '',
    relatedCifra ? `<a href="${SITE_URL}/cifra/${relatedCifra.slug}">Ver cifra${relatedCifra.original_key ? ` (${esc(relatedCifra.original_key)})` : ''}</a>` : '',
    `<a href="${SITE_URL}/hinos-ccb">Hinos CCB</a>`,
    `<a href="${SITE_URL}/cifras-hinos-ccb">Cifras de Hinos CCB</a>`,
  ].filter(Boolean).join(' · ');

  return {
    title, description: desc, canonical,
    schemas: [schema, breadcrumb],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/hinario">Hinário</a> &rsaquo; Hino ${h.numero}</nav>
      <h1>Hino ${h.numero} — ${esc(titulo)}</h1>
      ${h.subtitulo ? `<p>${esc(h.subtitulo)}</p>` : ''}
      <p>${relatedLinks}</p>
      ${conteudoHtml}
      <nav style="margin-top:20px;">
        ${num > 1 ? `<a href="${SITE_URL}/hinario/${num - 1}">&larr; Hino ${num - 1}</a> ` : ''}
        ${num < 480 ? `<a href="${SITE_URL}/hinario/${num + 1}">Hino ${num + 1} &rarr;</a>` : ''}
      </nav>
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handleCifra(slug: string): Promise<PageMeta | null> {
  const publicRows = await supaFetch('cifra_public_catalog', {
    public_slug: `eq.${slug}`,
    select: 'version_id,public_slug,version_title,instrument,arrangement_type,difficulty_level,original_key,preferred_key,capo,tempo_bpm,time_signature,publication_label,is_primary,published_at,song_id,song_slug,song_title,song_subtitle,composer_name,hino_id,hinario_numero,source_type,cover_url,seo_title,seo_description,seo_keywords,sections_count,lines_count,chords_index',
    limit: '1',
  });

  if (publicRows.length) {
    const c = publicRows[0];
    const sectionRows = await supaFetch('cifra_version_sections', {
      version_id: `eq.${c.version_id}`,
      select: 'section_order,section_label,plain_text',
      order: 'section_order.asc',
      limit: '100',
    });
    const relatedNumber = Number(c.hinario_numero || extractHymnNumberFromText(c.song_title || c.version_title || '') || 0);
    const [relatedHymn, relatedLyricRows] = await Promise.all([
      findRelatedHymnForSsr({ hymnId: c.hino_id || undefined, numero: relatedNumber || undefined, title: c.song_title || c.version_title || '' }),
      relatedNumber
        ? supaFetch('hinario', {
            numero: `eq.${relatedNumber}`,
            is_active: 'eq.true',
            select: 'numero,titulo',
            limit: '1',
          })
        : Promise.resolve([] as any[]),
    ]);
    const relatedLyric = relatedLyricRows[0];
    const displayTitle = String(c.song_title || c.version_title || 'Cifra CCB')
      .replace(/^\s*(?:hino\s*)?\d+\s*(?:ccb)?\s*[-–—:.]\s*/i, '')
      .trim();
    const title = relatedNumber
      ? `CIFRA Hino ${relatedNumber} - ${displayTitle} - Cânticos CCB`
      : `CIFRA ${displayTitle} - Cânticos CCB`;
    const desc = [
      relatedNumber ? `Cifra Hino ${relatedNumber} - ${displayTitle} - Cânticos CCB.` : `Cifra CCB de ${displayTitle}.`,
      c.composer_name ? `Artista: ${c.composer_name}.` : '',
      `Tom: ${c.original_key || 'original'}. Instrumento disponível: ${c.instrument || 'instrumento musical'}.`,
      'Termos relacionados: cifras para Violão, Ukulele e Teclado, com acordes e transposição de tom quando publicados.',
      relatedHymn ? `Página do hino ${relatedHymn.numero || ''} disponível.` : '',
      relatedLyric ? `Letra disponível no Hinário ${relatedLyric.numero}.` : '',
    ].filter(Boolean).join(' ');
    const canonical = `${SITE_URL}/cifra/${slug}`;

    const schema = {
      '@context': 'https://schema.org', '@type': 'CreativeWork',
      name: displayTitle, url: canonical,
      ...(c.composer_name ? { author: { '@type': 'Person', name: c.composer_name } } : {}),
      genre: 'Cifra Musical', inLanguage: 'pt-BR',
    };
    const breadcrumb = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Cifras', item: `${SITE_URL}/cifras` },
        { '@type': 'ListItem', position: 3, name: displayTitle, item: canonical },
      ],
    };

    const relatedLinks = [
      relatedHymn ? `<a href="${SITE_URL}${buildHinoUrl(String(relatedHymn.id), relatedHymn.titulo, relatedHymn.numero)}">Página do hino</a>` : '',
      relatedLyric ? `<a href="${SITE_URL}/hinario/${relatedLyric.numero}">Letra no Hinário</a>` : '',
      `<a href="${SITE_URL}/cifras-hinos-ccb">Cifras de Hinos CCB</a>`,
      `<a href="${SITE_URL}/hinos-ccb">Hinos CCB</a>`,
    ].filter(Boolean).join(' · ');

    return {
      title, description: desc, canonical, ogImage: c.cover_url || undefined,
      schemas: [schema, breadcrumb],
      bodyHtml: `
        <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/cifras">Cifras</a> &rsaquo; ${esc(displayTitle)}</nav>
        <h1>${esc(displayTitle)}</h1>
        ${c.composer_name ? `<p><strong>Artista:</strong> ${esc(c.composer_name)}</p>` : ''}
        ${c.original_key ? `<p><strong>Tom:</strong> ${esc(c.original_key)}</p>` : ''}
        <p>${relatedLinks}</p>
        ${buildV2CifraContentHtml(sectionRows)}
        <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
    };
  }

  const rows = await supaFetch('cifras', {
    slug: `eq.${slug}`,
    select: 'id,title,artist,original_key,content,cover_url,slug,hino_id',
    limit: '1',
  });
  if (!rows.length) return null;
  const c = rows[0];
  const inferredNumber = extractHymnNumberFromText(c.title || '');
  const [relatedHymn, relatedLyricRows] = await Promise.all([
    findRelatedHymnForSsr({ hymnId: c.hino_id || undefined, numero: inferredNumber, title: c.title || '' }),
    inferredNumber
      ? supaFetch('hinario', {
          numero: `eq.${inferredNumber}`,
          is_active: 'eq.true',
          select: 'numero,titulo',
          limit: '1',
        })
      : Promise.resolve([] as any[]),
  ]);
  const relatedLyric = relatedLyricRows[0];
  const title = `${relatedHymn?.numero ? `Hino ${relatedHymn.numero} CCB - ` : ''}${c.title || 'Cifra CCB'}${c.artist ? ` — ${c.artist}` : ''} | Tom ${c.original_key || ''} | Cânticos CCB`;
  const desc = `Cifra de "${c.title || ''}"${c.artist ? ` por ${c.artist}` : ''} em tom ${c.original_key || 'original'}.${relatedHymn ? ` Página do hino ${relatedHymn.numero || ''} disponível.` : ''}${relatedLyric ? ` Letra no Hinário ${relatedLyric.numero}.` : ''} Cifras de hinos da CCB com transposição de tom.`;
  const canonical = `${SITE_URL}/cifra/${slug}`;

  const schema = {
    '@context': 'https://schema.org', '@type': 'CreativeWork',
    name: c.title, url: canonical,
    ...(c.artist ? { author: { '@type': 'Person', name: c.artist } } : {}),
    genre: 'Cifra Musical', inLanguage: 'pt-BR',
  };
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Cifras', item: `${SITE_URL}/cifras` },
      { '@type': 'ListItem', position: 3, name: c.title, item: canonical },
    ],
  };

  const contentHtml = c.content
    ? `<section><h2>Cifra</h2><pre style="white-space:pre-wrap;">${esc(c.content)}</pre></section>`
    : '';
  const relatedLinks = [
    relatedHymn ? `<a href="${SITE_URL}${buildHinoUrl(String(relatedHymn.id), relatedHymn.titulo, relatedHymn.numero)}">Página do hino</a>` : '',
    relatedLyric ? `<a href="${SITE_URL}/hinario/${relatedLyric.numero}">Letra no Hinário</a>` : '',
    `<a href="${SITE_URL}/cifras-hinos-ccb">Cifras de Hinos CCB</a>`,
    `<a href="${SITE_URL}/hinos-ccb">Hinos CCB</a>`,
  ].filter(Boolean).join(' · ');

  return {
    title, description: desc, canonical, ogImage: c.cover_url || undefined,
    schemas: [schema, breadcrumb],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/cifras">Cifras</a> &rsaquo; ${esc(c.title || '')}</nav>
      <h1>${esc(c.title || 'Cifra')}</h1>
      ${c.artist ? `<p><strong>Artista:</strong> ${esc(c.artist)}</p>` : ''}
      ${c.original_key ? `<p><strong>Tom:</strong> ${esc(c.original_key)}</p>` : ''}
      <p>${relatedLinks}</p>
      ${contentHtml}
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handleCifrasList(): Promise<PageMeta> {
  const [publicCifras, legacyCifras] = await Promise.all([
    supaFetch('cifra_public_catalog', {
      select: 'public_slug,song_title,version_title,composer_name,original_key,published_at,is_primary',
      order: 'is_primary.desc,published_at.desc.nullslast',
      limit: '160',
    }),
    supaFetch('cifras', {
      is_active: 'eq.true',
      select: 'id,title,artist,slug,original_key',
      order: 'created_at.desc',
      limit: '100',
    }),
  ]);
  const title = 'Cifras de Hinos da CCB — Cifras com Transposição de Tom | Cânticos CCB';
  const desc = 'Encontre cifras de hinos da Congregação Cristã no Brasil. Cifras com transposição de tom em tempo real para violão, teclado e outros instrumentos.';
  const canonical = `${SITE_URL}/cifras`;
  const publicItems = publicCifras.map((c: any) => ({
    slug: c.public_slug,
    title: c.song_title || c.version_title,
    artist: c.composer_name || '',
    original_key: c.original_key || '',
  }));
  const usedSlugs = new Set(publicItems.map((item: any) => item.slug));
  const mergedItems = [
    ...publicItems,
    ...legacyCifras.filter((item: any) => !usedSlugs.has(item.slug)),
  ];
  const listHtml = mergedItems.length > 0
    ? `<ul>${mergedItems.map((c: any) => `<li><a href="${SITE_URL}/cifra/${c.slug}">${esc(c.title || '')}${c.artist ? ` — ${esc(c.artist)}` : ''} (${esc(c.original_key || '')})</a></li>`).join('')}</ul>`
    : '';
  return {
    title, description: desc, canonical,
    schemas: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Cifras CCB', url: canonical, description: desc }],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; Cifras</nav>
      <h1>Cifras de Hinos da CCB</h1><p>${esc(desc)}</p>
      <section><h2>Todas as Cifras</h2>${listHtml}</section>
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handleHinarioList(): Promise<PageMeta> {
  const hinos = await supaFetch('hinario', { select: 'numero,titulo', order: 'numero.asc', limit: '500' });
  const title = 'Hinário 5 — Letras dos Hinos da CCB | Hinos de Louvores e Súplicas a Deus | Cânticos CCB';
  const desc = 'Leia as letras completas dos 480 hinos do Hinário 5 (Hinos de Louvores e Súplicas a Deus) da Congregação Cristã no Brasil.';
  const canonical = `${SITE_URL}/hinario`;
  const listHtml = hinos.length > 0
    ? `<ul>${hinos.map((h: any) => `<li><a href="${SITE_URL}/hinario/${h.numero}">Hino ${h.numero}${h.titulo ? ` — ${esc(h.titulo)}` : ''}</a></li>`).join('')}</ul>`
    : '';
  return {
    title, description: desc, canonical,
    schemas: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Hinário 5', url: canonical, description: desc }],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; Hinário</nav>
      <h1>Hinário 5 — Hinos de Louvores e Súplicas a Deus</h1><p>${esc(desc)}</p>
      <section><h2>Todos os Hinos</h2>${listHtml}</section>
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handleBroadHinosHub(): Promise<PageMeta> {
  const [hinario, hymns] = await Promise.all([
    supaFetch('hinario', {
      is_active: 'eq.true',
      select: 'numero,titulo',
      order: 'numero.asc',
      limit: '500',
    }),
    supaFetch('hinos', {
      'or': '(ativo.eq.true,ativo.eq.1)',
      select: 'id,numero,titulo,compositor_nome',
      order: 'numero.asc',
      limit: '240',
    }),
  ]);

  const title = 'Hinos CCB | Ouça Hinos, Letras do Hinário 5 e Cifras | Cânticos CCB';
  const description = 'Explore hinos CCB com letras do Hinário 5, páginas para ouvir, cifras e hubs temáticos da Congregação Cristã no Brasil.';
  const canonical = `${SITE_URL}/hinos-ccb`;

  const hinarioHtml = hinario.length > 0
    ? `<ul>${hinario.slice(0, 120).map((item: any) => `<li><a href="${SITE_URL}/hinario/${item.numero}">Hino ${item.numero}${item.titulo ? ` — ${esc(item.titulo)}` : ''}</a></li>`).join('')}</ul>`
    : '<p>Nenhum hino do hinário foi publicado ainda.</p>';

  const hymnsHtml = hymns.length > 0
    ? `<ul>${hymns.slice(0, 60).map((item: any) => {
      const cleanTitle = normalizeHymnTitle(item.titulo || '', item.numero);
      return `<li><a href="${SITE_URL}${buildHinoUrl(String(item.id), cleanTitle, item.numero)}">${item.numero ? `Hino ${item.numero} — ` : ''}${esc(cleanTitle || item.titulo || 'Hino CCB')}</a>${item.compositor_nome ? ` — ${esc(item.compositor_nome)}` : ''}</li>`;
    }).join('')}</ul>`
    : '<p>Nenhuma página de hino foi publicada ainda.</p>';

  return {
    title,
    description,
    canonical,
    noindex: hinario.length === 0 && hymns.length === 0,
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Hinos CCB',
        url: canonical,
        description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Hinos CCB', item: canonical },
        ],
      },
    ],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; Hinos CCB</nav>
      <h1>Hinos CCB</h1>
      <p>${esc(description)}</p>
      <p><a href="${SITE_URL}/hinario-5-ccb">Hinário 5 CCB</a> · <a href="${SITE_URL}/letras-hinos-ccb">Letras dos Hinos</a> · <a href="${SITE_URL}/hinos-cantados-ccb">Hinos Cantados</a> · <a href="${SITE_URL}/cifras-hinos-ccb">Cifras de Hinos CCB</a></p>
      <section><h2>Números do Hinário</h2>${hinarioHtml}</section>
      <section><h2>Hinos publicados para ouvir</h2>${hymnsHtml}</section>
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function fetchMergedSsrCifras(params: { instrument?: string; limit?: number } = {}): Promise<Array<{
  slug: string;
  title: string;
  artist: string;
  original_key: string;
  instrument: string;
}>> {
  const limit = String(params.limit || 500);
  const [publicRows, legacyRows] = await Promise.all([
    supaFetch('cifra_public_catalog', {
      ...(params.instrument ? { instrument: `eq.${params.instrument}` } : {}),
      select: 'public_slug,song_title,version_title,composer_name,original_key,instrument,published_at,is_primary',
      order: 'is_primary.desc,published_at.desc.nullslast',
      limit,
    }),
    supaFetch('cifras', {
      ...(params.instrument ? { instrument: `eq.${params.instrument}` } : {}),
      is_active: 'eq.true',
      select: 'title,slug,artist,original_key,instrument',
      order: 'created_at.desc',
      limit,
    }),
  ]);

  const publicItems = publicRows.map((item: any) => ({
    slug: String(item.public_slug || ''),
    title: String(item.song_title || item.version_title || 'Cifra'),
    artist: String(item.composer_name || ''),
    original_key: String(item.original_key || ''),
    instrument: String(item.instrument || ''),
  }));

  const usedSlugs = new Set(publicItems.map((item: any) => item.slug));
  const remainingLegacy = legacyRows
    .filter((item: any) => !usedSlugs.has(String(item.slug || '')))
    .map((item: any) => ({
      slug: String(item.slug || ''),
      title: String(item.title || 'Cifra'),
      artist: String(item.artist || ''),
      original_key: String(item.original_key || ''),
      instrument: String(item.instrument || ''),
    }));

  return [...publicItems, ...remainingLegacy];
}

async function handleBroadCifrasHub(): Promise<PageMeta> {
  const cifras = await fetchMergedSsrCifras({ limit: 500 });

  const title = 'Cifras Hinos CCB | Cifras da Congregação Cristã no Brasil | Cânticos CCB';
  const description = 'Explore cifras de hinos CCB com links para violão, ukulele, teclado e páginas individuais de cifra da Congregação Cristã no Brasil.';
  const canonical = `${SITE_URL}/cifras-hinos-ccb`;

  const counts = cifras.reduce<Record<string, number>>((acc, item: any) => {
    const key = String(item.instrument || 'outros');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const cifrasHtml = cifras.length > 0
    ? `<ul>${cifras.slice(0, 120).map((item: any) => `<li><a href="${SITE_URL}/cifra/${item.slug}">${esc(item.title || 'Cifra')}</a>${item.artist ? ` — ${esc(item.artist)}` : ''}${item.original_key ? ` (${esc(item.original_key)})` : ''}</li>`).join('')}</ul>`
    : '<p>Nenhuma cifra foi publicada ainda.</p>';

  return {
    title,
    description,
    canonical,
    noindex: cifras.length === 0,
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Cifras de Hinos CCB',
        url: canonical,
        description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Cifras de Hinos CCB', item: canonical },
        ],
      },
    ],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; Cifras de Hinos CCB</nav>
      <h1>Cifras de Hinos CCB</h1>
      <p>${esc(description)}</p>
      <p><a href="${SITE_URL}/cifras">Ver todas as cifras</a> · <a href="${SITE_URL}/cifras-violao-ccb">Violão (${counts.violao || 0})</a> · <a href="${SITE_URL}/cifras-ukulele-ccb">Ukulele (${counts.ukulele || 0})</a> · <a href="${SITE_URL}/cifras-teclado-ccb">Teclado (${counts.teclado || 0})</a></p>
      <section><h2>Cifras publicadas</h2>${cifrasHtml}</section>
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handleCategoria(slug: string): Promise<PageMeta | null> {
  const categoryRows = await supaFetch('categorias', {
    slug: `eq.${slug}`,
    select: 'id,nome,slug,descricao,imagem_url,updated_at',
    limit: '1',
  });
  if (!categoryRows.length) return null;

  const category = categoryRows[0];
  const categoryId = String(category.id);
  const categoryName = compactWhitespace(category.nome || slug);
  const description = truncate(
    stripHtml(category.descricao || '') || `Explore hinos da categoria ${categoryName} na Congregação Cristã no Brasil, com letras, áudio e navegação por repertório.`,
    158
  );
  const canonical = `${SITE_URL}/categoria/${slug}`;

  let relatedSongIds: string[] = [];
  let songs: any[] = [];
  let dataUnavailable = false;
  try {
    const categoryRelations = await supaFetch('hino_categorias', {
      categoria_id: `eq.${categoryId}`,
      select: 'hino_id',
      limit: '1000',
    });
    if (categoryRelations.length > 0) {
      relatedSongIds = categoryRelations
        .map((row: any) => String(row.hino_id || ''))
        .filter(Boolean);
    }
    if (relatedSongIds.length > 0) {
      songs = await supaFetch('hinos', {
        id: `in.(${relatedSongIds.join(',')})`,
        'or': '(ativo.eq.true,ativo.eq.1)',
        select: 'id,numero,titulo,compositor_nome',
        order: 'numero.asc',
        limit: '200',
      });
    }
    const fallbackSongs = await supaFetch('hinos', {
      categoria: `ilike.%${categoryName}%`,
      'or': '(ativo.eq.true,ativo.eq.1)',
      select: 'id,numero,titulo,compositor_nome',
      order: 'numero.asc',
      limit: '200',
    });
    const mergedFallback = [...songs];
    const fallbackSeen = new Set(mergedFallback.map((song: any) => String(song.id)));
    for (const song of fallbackSongs) {
      const key = String(song.id);
      if (!fallbackSeen.has(key)) {
        mergedFallback.push(song);
        fallbackSeen.add(key);
      }
    }
    songs = mergedFallback;
  } catch (error) {
    dataUnavailable = true;
    console.warn(`[SSR] /categoria/${slug} dynamic content unavailable; serving safe fallback`, error);
  }


    const mergedSongs = songs;
  const listItems = mergedSongs.slice(0, 120);

  const songListHtml = listItems.length > 0
    ? `<ul>${listItems.map((song: any) => {
      const cleanTitle = normalizeHymnTitle(song.titulo || '', song.numero);
      return `<li><a href="${SITE_URL}${buildHinoUrl(String(song.id), cleanTitle, song.numero)}">Hino ${song.numero || ''}${cleanTitle ? ` - ${esc(cleanTitle)}` : ''}</a>${song.compositor_nome ? ` <span>— ${esc(song.compositor_nome)}</span>` : ''}</li>`;
    }).join('')}</ul>`
    : '<p>Nenhum hino desta categoria foi publicado ainda.</p>';

  return {
    title: `${categoryName} | Hinos CCB por Categoria | Cânticos CCB`,
    description,
    canonical,
    ogImage: category.imagem_url || undefined,
    noindex: dataUnavailable || mergedSongs.length === 0,
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: categoryName,
        url: canonical,
        description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Categorias', item: `${SITE_URL}/categorias` },
          { '@type': 'ListItem', position: 3, name: categoryName, item: canonical },
        ],
      },
    ],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/categorias">Categorias</a> &rsaquo; ${esc(categoryName)}</nav>
      <h1>${esc(categoryName)}</h1>
      <p>${esc(description)}</p>
      <section><h2>Hinos desta categoria</h2>${songListHtml}</section>
      ${dataUnavailable ? '<p>O catálogo dinâmico desta categoria está temporariamente indisponível. Volte mais tarde para ver os hinos publicados.</p>' : ''}
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

const HYMN_HUBS: Record<string, { keyword: string; heading: string; title: string; description: string }> = {
  '/hinos-cantados-ccb': {
    keyword: 'cantados',
    heading: 'Hinos Cantados CCB',
    title: 'Hinos Cantados CCB | Ouça Hinos Cantados da CCB | Cânticos CCB',
    description: 'Explore hinos cantados da CCB com links para ouvir, acessar a letra no hinário e navegar pelo repertório.',
  },
  '/hinos-tocados-ccb': {
    keyword: 'tocados',
    heading: 'Hinos Tocados CCB',
    title: 'Hinos Tocados CCB | Repertório Tocado da CCB | Cânticos CCB',
    description: 'Navegue por hinos tocados da CCB com links para páginas individuais, letras e repertório relacionado.',
  },
  '/hinos-avulsos-ccb': {
    keyword: 'avulsos',
    heading: 'Hinos Avulsos CCB',
    title: 'Hinos Avulsos CCB | Repertório Avulso da CCB | Cânticos CCB',
    description: 'Veja hinos avulsos da CCB com links para ouvir, navegar pelo repertório e acessar letras quando disponíveis.',
  },
};

const HINARIO_RANGE_PAGES: Record<string, { start: number; end: number; label: string; shortLabel: string; title: string; description: string }> = {
  '/hinos-1-a-120-ccb': {
    start: 1,
    end: 120,
    label: 'Hinos 1 a 120 CCB',
    shortLabel: '1 a 120',
    title: 'Hinos 1 a 120 CCB | Letras do Hinário CCB | Cânticos CCB',
    description: 'Veja os hinos 1 a 120 CCB com letras publicadas, navegação por número e links para ouvir hinos e explorar cifras relacionadas.',
  },
  '/hinos-121-a-240-ccb': {
    start: 121,
    end: 240,
    label: 'Hinos 121 a 240 CCB',
    shortLabel: '121 a 240',
    title: 'Hinos 121 a 240 CCB | Letras do Hinário CCB | Cânticos CCB',
    description: 'Acesse os hinos 121 a 240 CCB com letras publicadas, navegação por número e conexões com áudio e cifras.',
  },
  '/hinos-241-a-360-ccb': {
    start: 241,
    end: 360,
    label: 'Hinos 241 a 360 CCB',
    shortLabel: '241 a 360',
    title: 'Hinos 241 a 360 CCB | Letras do Hinário CCB | Cânticos CCB',
    description: 'Explore os hinos 241 a 360 CCB com letras do hinário, navegação por número e links para o repertório relacionado.',
  },
  '/hinos-361-a-480-ccb': {
    start: 361,
    end: 480,
    label: 'Hinos 361 a 480 CCB',
    shortLabel: '361 a 480',
    title: 'Hinos 361 a 480 CCB | Letras do Hinário CCB | Cânticos CCB',
    description: 'Navegue pelos hinos 361 a 480 CCB com letras publicadas, links por número e conexões com o restante do acervo.',
  },
};

async function fetchHymnsByKeyword(keyword: string): Promise<any[]> {
  const categories = await supaFetch('categorias', {
    select: 'id,nome,slug',
    or: `(slug.ilike.%${keyword}%,nome.ilike.%${keyword}%)`,
    limit: '100',
  });

  const categoryIds = categories.map((category: any) => String(category.id)).filter(Boolean);
  let songs: any[] = [];

  if (categoryIds.length > 0) {
    const relations = await supaFetch('hino_categorias', {
      categoria_id: `in.(${categoryIds.join(',')})`,
      select: 'hino_id',
      limit: '5000',
    });
    const hymnIds = relations.map((relation: any) => String(relation.hino_id || '')).filter(Boolean);
    if (hymnIds.length > 0) {
      songs = await supaFetch('hinos', {
        id: `in.(${hymnIds.join(',')})`,
        or: '(ativo.eq.true,ativo.eq.1)',
        select: 'id,numero,titulo,compositor_nome,categoria',
        order: 'numero.asc',
        limit: '500',
      });
    }
  }

  const fallbackSongs = await supaFetch('hinos', {
    categoria: `ilike.%${keyword}%`,
    or: '(ativo.eq.true,ativo.eq.1)',
    select: 'id,numero,titulo,compositor_nome,categoria',
    order: 'numero.asc',
    limit: '500',
  });

  const mergedSongs = [...songs];
  const seen = new Set(mergedSongs.map((song: any) => String(song.id)));
  for (const song of fallbackSongs) {
    const key = String(song.id);
    if (!seen.has(key)) {
      mergedSongs.push(song);
      seen.add(key);
    }
  }

  const filteredSongs = keyword === 'avulsos'
    ? mergedSongs.filter((song: any) => !isTraditionalHinarioSong(song))
    : mergedSongs;

  return filteredSongs.sort((a: any, b: any) => {
    const numA = Number(a.numero || 0);
    const numB = Number(b.numero || 0);
    if (numA > 0 && numB > 0) return numA - numB;
    if (numA > 0) return -1;
    if (numB > 0) return 1;
    return String(a.titulo || '').localeCompare(String(b.titulo || ''), 'pt-BR');
  });
}

async function handleHymnHub(pathname: string): Promise<PageMeta | null> {
  const config = HYMN_HUBS[pathname];
  if (!config) return null;

  let songs: any[] = [];
  let dataUnavailable = false;
  try {
    songs = await fetchHymnsByKeyword(config.keyword);
  } catch (error) {
    // Não inventar itens de acervo: servir apenas o conteúdo editorial estático
    // enquanto o catálogo dinâmico estiver indisponível.
    dataUnavailable = true;
    console.warn(`[SSR] ${pathname} dynamic content unavailable; serving safe fallback`, error);
  }
  const songListHtml = songs.length > 0
    ? `<ul>${songs.slice(0, 120).map((song: any) => {
      const cleanTitle = normalizeHymnTitle(song.titulo || '', song.numero);
      const href = `${SITE_URL}${buildHinoUrl(String(song.id), cleanTitle, song.numero)}`;
      const lyricLink = song.numero ? ` <a href="${SITE_URL}/hinario/${song.numero}">Ver letra</a>` : '';
      return `<li><a href="${href}">Hino ${song.numero || ''}${cleanTitle ? ` - ${esc(cleanTitle)}` : ''}</a>${song.compositor_nome ? ` — ${esc(song.compositor_nome)}` : ''}${lyricLink}</li>`;
    }).join('')}</ul>`
    : '<p>Nenhum hino foi publicado neste repertório ainda.</p>';

  return {
    title: config.title,
    description: config.description,
    canonical: `${SITE_URL}${pathname}`,
    noindex: dataUnavailable || songs.length === 0,
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: config.heading,
        url: `${SITE_URL}${pathname}`,
        description: config.description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: config.heading, item: `${SITE_URL}${pathname}` },
        ],
      },
    ],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; ${esc(config.heading)}</nav>
      <h1>${esc(config.heading)}</h1>
      <p>${esc(config.description)}</p>
      <section><h2>Hinos publicados</h2>${songListHtml}</section>
      ${dataUnavailable ? '<p>O catálogo dinâmico está temporariamente indisponível. Consulte o <a href="https://www.canticosccb.com.br/hinario">Hinário</a> ou volte mais tarde para ver os itens publicados.</p>' : ''}
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handleHinarioRangePage(pathname: string): Promise<PageMeta | null> {
  const config = HINARIO_RANGE_PAGES[pathname];
  if (!config) return null;

  const rows = await supaFetch('hinario', {
    select: 'id,numero,titulo,subtitulo',
    is_active: 'eq.true',
    order: 'numero.asc',
    limit: '500',
  });

  const hymns = rows.filter((row: any) => {
    const numero = Number(row.numero || 0);
    return numero >= config.start && numero <= config.end;
  });

  const hymnListHtml = hymns.length > 0
    ? `<ul>${hymns.slice(0, 180).map((hymn: any) => {
      const numero = Number(hymn.numero || 0);
      const title = esc(hymn.titulo || `Hino ${numero}`);
      return `<li><a href="${SITE_URL}/hinario/${numero}">Hino ${numero} CCB - ${title}</a>${hymn.subtitulo ? ` <span>— ${esc(hymn.subtitulo)}</span>` : ''}</li>`;
    }).join('')}</ul>`
    : '<p>Nenhum hino publicado foi encontrado nesta faixa.</p>';

  const otherRangesHtml = Object.entries(HINARIO_RANGE_PAGES)
    .filter(([path]) => path !== pathname)
    .map(([path, range]) => `<li><a href="${SITE_URL}${path}">${esc(range.label)}</a></li>`)
    .join('');

  return {
    title: config.title,
    description: config.description,
    canonical: `${SITE_URL}${pathname}`,
    noindex: hymns.length === 0,
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: config.label,
        url: `${SITE_URL}${pathname}`,
        description: config.description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Hinário', item: `${SITE_URL}/hinario` },
          { '@type': 'ListItem', position: 3, name: config.label, item: `${SITE_URL}${pathname}` },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: config.label,
        itemListElement: hymns.slice(0, 180).map((hymn: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: `Hino ${hymn.numero} CCB - ${hymn.titulo || `Hino ${hymn.numero}`}`,
          url: `${SITE_URL}/hinario/${hymn.numero}`,
        })),
      },
    ],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/hinario">Hinário</a> &rsaquo; ${esc(config.label)}</nav>
      <h1>${esc(config.label)}</h1>
      <p>${esc(config.description)}</p>
      <p>Faixa ${esc(config.shortLabel)} do Hinário CCB com letras publicadas, organizada para buscas por número e descoberta de repertório relacionado.</p>
      <section><h2>Hinos publicados nesta faixa</h2>${hymnListHtml}</section>
      <section><h2>Outras faixas do Hinário</h2><ul>${otherRangesHtml}</ul></section>
      <footer><p><a href="${SITE_URL}/hinos-ccb">Hinos CCB</a> · <a href="${SITE_URL}/letras-hinos-ccb">Letras dos Hinos</a> · <a href="${SITE_URL}/hinario">Abrir Hinário</a></p></footer>`,
  };
}

const CIFRA_HUBS: Record<string, { instrument: string; heading: string; title: string; description: string }> = {
  '/cifras-violao-ccb': {
    instrument: 'violao',
    heading: 'Cifras de Violao CCB',
    title: 'Cifras de Violao CCB | Hinos com Acordes para Violao | Cânticos CCB',
    description: 'Veja cifras de hinos da CCB para violao, com links para tom, acordes e repertório relacionado.',
  },
  '/cifras-ukulele-ccb': {
    instrument: 'ukulele',
    heading: 'Cifras de Ukulele CCB',
    title: 'Cifras de Ukulele CCB | Hinos com Acordes para Ukulele | Cânticos CCB',
    description: 'Acesse cifras de hinos da CCB para ukulele com links diretos para cada página individual.',
  },
  '/cifras-teclado-ccb': {
    instrument: 'teclado',
    heading: 'Cifras de Teclado CCB',
    title: 'Cifras de Teclado CCB | Hinos com Acordes para Teclado | Cânticos CCB',
    description: 'Explore cifras de hinos da CCB para teclado com tom original, acordes e repertório relacionado.',
  },
};

async function handleCifraInstrumentHub(pathname: string): Promise<PageMeta | null> {
  const config = CIFRA_HUBS[pathname];
  if (!config) return null;

  const cifras = await fetchMergedSsrCifras({
    instrument: config.instrument,
    limit: 500,
  });

  const listHtml = cifras.length > 0
    ? `<ul>${cifras.slice(0, 120).map((cifra: any) => `<li><a href="${SITE_URL}/cifra/${cifra.slug}">${esc(cifra.title || 'Cifra')}</a>${cifra.artist ? ` — ${esc(cifra.artist)}` : ''}${cifra.original_key ? ` (${esc(cifra.original_key)})` : ''}</li>`).join('')}</ul>`
    : '<p>Nenhuma cifra foi publicada para este instrumento ainda.</p>';

  return {
    title: config.title,
    description: config.description,
    canonical: `${SITE_URL}${pathname}`,
    noindex: cifras.length === 0,
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: config.heading,
        url: `${SITE_URL}${pathname}`,
        description: config.description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Cifras', item: `${SITE_URL}/cifras` },
          { '@type': 'ListItem', position: 3, name: config.heading, item: `${SITE_URL}${pathname}` },
        ],
      },
    ],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/cifras">Cifras</a> &rsaquo; ${esc(config.heading)}</nav>
      <h1>${esc(config.heading)}</h1>
      <p>${esc(config.description)}</p>
      <section><h2>Cifras publicadas</h2>${listHtml}</section>
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handlePlaylistsList(): Promise<PageMeta> {
  const playlists = await supaFetch('playlists', {
    'or': '(is_public.eq.true,is_public.eq.1)',
    select: 'id,name,description,updated_at',
    order: 'updated_at.desc',
    limit: '200',
  });
  const canonical = `${SITE_URL}/playlists`;
  const description = 'Explore playlists públicas de hinos da Congregação Cristã no Brasil, com seleções temáticas para ouvir e compartilhar.';
  const listHtml = playlists.length > 0
    ? `<ul>${playlists.map((playlist: any) => `<li><a href="${SITE_URL}/playlist/${playlist.id}">${esc(playlist.name || 'Playlist')}</a>${playlist.description ? ` — ${esc(truncate(playlist.description, 100))}` : ''}</li>`).join('')}</ul>`
    : '<p>Nenhuma playlist pública foi publicada ainda.</p>';

  return {
    title: 'Playlists de Hinos CCB | Playlists Públicas e Temáticas | Cânticos CCB',
    description,
    canonical,
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Playlists de Hinos CCB',
        url: canonical,
        description,
      },
    ],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; Playlists</nav>
      <h1>Playlists de Hinos CCB</h1>
      <p>${esc(description)}</p>
      <section><h2>Playlists públicas</h2>${listHtml}</section>
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handlePlaylistDetail(idParam: string): Promise<PageMeta | null> {
  const playlistRows = await supaFetch('playlists', {
    id: `eq.${idParam}`,
    'or': '(is_public.eq.true,is_public.eq.1)',
    select: 'id,name,description,cover_url,created_at,updated_at',
    limit: '1',
  });
  if (!playlistRows.length) return null;

  const playlist = playlistRows[0];
  const tracks = await supaFetch('playlist_tracks', {
    playlist_id: `eq.${idParam}`,
    select: 'track_id,title,artist,duration,position',
    order: 'position.asc',
    limit: '500',
  });

  const playlistTitle = compactWhitespace(playlist.name || 'Playlist CCB');
  const description = truncate(
    stripHtml(playlist.description || '') || `Ouça a playlist ${playlistTitle} com hinos da Congregação Cristã no Brasil.`,
    158
  );
  const canonical = `${SITE_URL}/playlist/${playlist.id}`;

  const trackListHtml = tracks.length > 0
    ? `<ol>${tracks.map((track: any) => `<li>${esc(track.title || 'Hino')}${track.artist ? ` — ${esc(track.artist)}` : ''}${track.duration ? ` (${esc(track.duration)})` : ''}</li>`).join('')}</ol>`
    : '<p>Esta playlist ainda não possui hinos publicados.</p>';

  return {
    title: `${playlistTitle} | Playlist de Hinos CCB | Cânticos CCB`,
    description,
    canonical,
    ogType: 'music.playlist',
    ogImage: playlist.cover_url || undefined,
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'MusicPlaylist',
        name: playlistTitle,
        url: canonical,
        description,
        numTracks: tracks.length,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Playlists', item: `${SITE_URL}/playlists` },
          { '@type': 'ListItem', position: 3, name: playlistTitle, item: canonical },
        ],
      },
    ],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/playlists">Playlists</a> &rsaquo; ${esc(playlistTitle)}</nav>
      <h1>${esc(playlistTitle)}</h1>
      <p>${esc(description)}</p>
      <section><h2>Faixas da playlist</h2>${trackListHtml}</section>
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

function handleHome(): PageMeta {
  const title = 'Cânticos CCB — Ouça Hinos da Congregação Cristã no Brasil | Hinário 5, Cifras e Compositores';
  const description = 'Ouça hinos da CCB online grátis. Hinário 5 completo, hinos cantados e tocados, cifras, compositores e playlists da Congregação Cristã no Brasil. Crie sua conta e salve seus hinos favoritos.';
  return {
    title,
    description,
    canonical: SITE_URL,
    schemas: [],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a></nav>
      <h1>Cânticos CCB — Hinos da Congregação Cristã no Brasil</h1>
      <p>Ouça hinos da Congregação Cristã no Brasil. Louvor e adoração em um só lugar.</p>
      <section>
        <h2>Explore o acervo CCB</h2>
        <p><a href="${SITE_URL}/hinos-ccb">Hinos CCB</a> · <a href="${SITE_URL}/hinario">Hinário 5</a> · <a href="${SITE_URL}/cifras-hinos-ccb">Cifras de Hinos CCB</a></p>
        <p><a href="${SITE_URL}/hinos-cantados-ccb">Hinos Cantados</a> · <a href="${SITE_URL}/hinos-tocados-ccb">Hinos Tocados</a> · <a href="${SITE_URL}/hinos-avulsos-ccb">Hinos Avulsos</a></p>
        <p><a href="${SITE_URL}/compositores">Compositores</a> · <a href="${SITE_URL}/albuns">Álbuns</a> · <a href="${SITE_URL}/playlists">Playlists</a></p>
      </section>
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}
function handleStaticPage(path: string): PageMeta | null {
  const pages: Record<string, { title: string; desc: string; h1: string; body: string; noindex?: boolean }> = {
    '/trends': {
      title: 'Tendências — Hinos Mais Ouvidos da CCB | Cânticos CCB',
      desc: 'Veja os hinos mais ouvidos e as tendências da Congregação Cristã no Brasil.',
      h1: 'Tendências — Hinos Mais Ouvidos',
      body: '<p>Descubra os hinos mais ouvidos e as tendências da Congregação Cristã no Brasil no Cânticos CCB.</p>',
    },
    '/tendencias': {
      title: 'Tendências — Hinos Mais Ouvidos da CCB | Cânticos CCB',
      desc: 'Veja os hinos mais ouvidos e as tendências da Congregação Cristã no Brasil.',
      h1: 'Tendências — Hinos Mais Ouvidos',
      body: '<p>Descubra os hinos mais ouvidos e as tendências da Congregação Cristã no Brasil no Cânticos CCB.</p>',
    },
    '/about': {
      title: 'Sobre o Cânticos CCB — Plataforma de Hinos da CCB',
      desc: 'Conheça o Cânticos CCB, projeto independente para organizar hinos, letras, cifras, álbuns e playlists relacionados à CCB.',
      h1: 'Sobre o Cânticos CCB',
      body: '<p>O Cânticos CCB é um projeto independente para organizar hinos, letras, cifras, álbuns, compositores, categorias e playlists relacionados à Congregação Cristã no Brasil.</p><p>A plataforma não possui vínculo, endosso, patrocínio ou relação institucional com a Congregação Cristã no Brasil. O uso de CCB é referencial e descritivo para organizar repertórios pesquisados pela comunidade.</p>',
    },
    '/sobre': {
      title: 'Sobre o Cânticos CCB — Plataforma de Hinos da CCB',
      desc: 'Conheça o Cânticos CCB, projeto independente para organizar hinos, letras, cifras, álbuns e playlists relacionados à CCB.',
      h1: 'Sobre o Cânticos CCB',
      body: '<p>O Cânticos CCB é um projeto independente para organizar hinos, letras, cifras, álbuns, compositores, categorias e playlists relacionados à Congregação Cristã no Brasil.</p><p>A plataforma não possui vínculo, endosso, patrocínio ou relação institucional com a Congregação Cristã no Brasil.</p>',
    },
    '/search': {
      title: 'Buscar Hinos da CCB — Pesquise por Título, Número ou Compositor | Cânticos CCB',
      desc: 'Busque hinos da Congregação Cristã no Brasil por título, número ou compositor.',
      h1: 'Buscar Hinos da CCB',
      body: '<p>Pesquise hinos por título, número ou compositor. Encontre hinos cantados, tocados, cifras e letras do Hinário 5.</p>',
    },
    '/buscar': {
      title: 'Buscar Hinos da CCB | Cânticos CCB',
      desc: 'Busque hinos da Congregação Cristã no Brasil por título, número ou compositor.',
      h1: 'Buscar Hinos da CCB',
      body: '<p>Pesquise hinos por título, número ou compositor.</p>',
    },
    '/hinario-5-ccb': {
      title: 'Hinário 5 CCB | Letras dos Hinos da Congregação Cristã | Cânticos CCB',
      desc: 'Acesse o Hinário 5 CCB com letras dos hinos, navegação por número e links para ouvir hinos da Congregação Cristã no Brasil.',
      h1: 'Hinário 5 CCB',
      body: '<p>Página-hub do Hinário 5 CCB com links para as letras dos hinos, navegação por número e atalhos para ouvir hinos e explorar cifras relacionadas.</p><p><a href="https://www.canticosccb.com.br/hinario">Abrir Hinário</a> · <a href="https://www.canticosccb.com.br/letras-hinos-ccb">Letras dos Hinos</a> · <a href="https://www.canticosccb.com.br/hinos-cantados-ccb">Hinos Cantados</a></p>',
    },
    '/letras-hinos-ccb': {
      title: 'Letras dos Hinos CCB | Hino 1 ao 480 com Letra | Cânticos CCB',
      desc: 'Veja letras dos hinos CCB com navegação por número, título e acesso ao Hinário da Congregação Cristã no Brasil.',
      h1: 'Letras dos Hinos CCB',
      body: '<p>Landing dedicada às letras dos hinos CCB, com foco em buscas por número, título e navegação rápida no repertório do Hinário.</p><p><a href="https://www.canticosccb.com.br/hinario">Ver números do Hinário</a> · <a href="https://www.canticosccb.com.br/hinario-5-ccb">Hinário 5 CCB</a> · <a href="https://www.canticosccb.com.br/cifras">Cifras</a></p>',
    },
    '/compositores': {
      title: 'Compositores de Hinos da CCB — Biografias e Discografias | Cânticos CCB',
      desc: 'Conheça os compositores de hinos da Congregação Cristã no Brasil. Biografias, discografias e hinos.',
      h1: 'Compositores de Hinos da CCB',
      body: '<p>Conheça os compositores de hinos da Congregação Cristã no Brasil. Acesse biografias, discografias e todos os hinos associados a cada compositor.</p>',
    },
    '/albuns': {
      title: 'Álbuns de Hinos da CCB — Hinos Cantados e Tocados | Cânticos CCB',
      desc: 'Ouça álbuns de hinos cantados e tocados da Congregação Cristã no Brasil.',
      h1: 'Álbuns de Hinos da CCB',
      body: '<p>Ouça álbuns completos de hinos cantados e tocados da Congregação Cristã no Brasil.</p>',
    },
    '/termos': {
      title: 'Termos de Uso | Cânticos CCB',
      desc: 'Termos de uso da plataforma Cânticos CCB.',
      h1: 'Termos de Uso',
      body: '<p>Leia os termos de uso da plataforma Cânticos CCB.</p>',
    },
    '/premium': {
      title: 'Continue Ouvindo com Cadastro Gratuito | Cânticos CCB',
      desc: 'Crie sua conta gratuita no Cânticos CCB para continuar ouvindo todo o acervo sem interrupcao.',
      h1: 'Continue ouvindo com cadastro gratuito',
      body: '<p>Crie sua conta gratuita para continuar ouvindo hinos, albuns e playlists sem interrupcao.</p>',
    },
    '/categorias': {
      title: 'Categorias de Hinos CCB | Explore Hinos por Tema | Cânticos CCB',
      desc: 'Explore hinos da Congregação Cristã no Brasil por categorias, temas e repertórios relacionados.',
      h1: 'Categorias de Hinos CCB',
      body: '<p>Navegue pelas categorias de hinos da Congregação Cristã no Brasil e encontre repertórios por tema, estilo e uso.</p>',
    },
    '/privacy': {
      title: 'Política de Privacidade | Cânticos CCB',
      desc: 'Leia a política de privacidade da plataforma Cânticos CCB.',
      h1: 'Política de Privacidade',
      body: '<p>Leia a política de privacidade da plataforma Cânticos CCB.</p>',
    },
    '/privacidade': {
      title: 'Política de Privacidade | Cânticos CCB',
      desc: 'Leia a política de privacidade da plataforma Cânticos CCB.',
      h1: 'Política de Privacidade',
      body: '<p>Leia a política de privacidade da plataforma Cânticos CCB.</p>',
    },
    '/cookies': {
      title: 'Política de Cookies | Cânticos CCB',
      desc: 'Entenda como a plataforma Cânticos CCB utiliza cookies e tecnologias relacionadas.',
      h1: 'Política de Cookies',
      body: '<p>Entenda como a plataforma Cânticos CCB utiliza cookies e tecnologias relacionadas.</p>',
    },
    '/disclaimer': {
      title: 'Aviso Legal | Cânticos CCB',
      desc: 'Leia o aviso legal e os esclarecimentos da plataforma Cânticos CCB.',
      h1: 'Aviso Legal',
      body: '<p>Leia o aviso legal e os esclarecimentos da plataforma Cânticos CCB.</p>',
    },
    '/lgpd': {
      title: 'LGPD e Proteção de Dados | Cânticos CCB',
      desc: 'Informações sobre tratamento de dados pessoais e LGPD na plataforma Cânticos CCB.',
      h1: 'LGPD e Proteção de Dados',
      body: '<p>Informações sobre tratamento de dados pessoais e LGPD na plataforma Cânticos CCB.</p>',
    },
    '/reivindicacao-de-conteudo': {
      title: 'Reivindicação de Conteúdo | Cânticos CCB',
      desc: 'Solicite análise de conteúdo e direitos autorais na plataforma Cânticos CCB.',
      h1: 'Reivindicação de Conteúdo',
      body: '<p>Solicite análise de conteúdo e direitos autorais na plataforma Cânticos CCB.</p>',
    },
    '/avisos': {
      title: 'Avisos e Atualizações | Cânticos CCB',
      desc: 'Acompanhe avisos, atualizações e novidades da plataforma Cânticos CCB.',
      h1: 'Avisos e Atualizações',
      body: '<p>Acompanhe avisos, atualizações e novidades da plataforma Cânticos CCB.</p>',
    },
    '/ajuda': {
      title: 'Ajuda e Suporte | Cânticos CCB',
      desc: 'Encontre respostas, suporte e orientações para usar o Cânticos CCB.',
      h1: 'Ajuda e Suporte',
      body: '<p>Encontre respostas e orientações para usar melhor o Cânticos CCB.</p>',
    },
    '/contato': {
      title: 'Contato | Cânticos CCB',
      desc: 'Entre em contato com a equipe do Cânticos CCB.',
      h1: 'Contato',
      body: '<p>Entre em contato com a equipe do Cânticos CCB.</p>',
    },
    '/baixar-hinos-ccb': {
      title: 'Baixar Hinos CCB | Como Ouvir Hinos da CCB Online | Cânticos CCB',
      desc: 'Guia para quem procura baixar hinos CCB. Veja como ouvir hinos online, acessar letras, cifras e repertório relacionado.',
      h1: 'Baixar Hinos CCB',
      body: '<p>Esta página atende a busca por baixar hinos CCB com orientação honesta. O foco da plataforma é ouvir online, acessar letras do hinário, explorar cifras e navegar pelo repertório publicado.</p><p><a href="https://www.canticosccb.com.br/hinario">Ver Hinário</a> · <a href="https://www.canticosccb.com.br/hinos-cantados-ccb">Hinos Cantados</a> · <a href="https://www.canticosccb.com.br/cifras">Cifras</a></p>',
    },
    '/baixar-albuns-ccb': {
      title: 'Baixar Albuns CCB | Como Ouvir Albuns e Coletâneas | Cânticos CCB',
      desc: 'Guia para quem procura baixar álbuns CCB. Veja como ouvir álbuns, explorar playlists e navegar pelo repertório relacionado.',
      h1: 'Baixar Albuns CCB',
      body: '<p>Esta página atende a busca por baixar álbuns CCB com foco em navegação honesta: ouvir online, explorar playlists, visitar álbuns publicados e encontrar repertório relacionado.</p><p><a href="https://www.canticosccb.com.br/albuns">Ver Álbuns</a> · <a href="https://www.canticosccb.com.br/playlists">Playlists</a> · <a href="https://www.canticosccb.com.br/hinos-tocados-ccb">Hinos Tocados</a></p>',
    },
    '/baixar-cds-ccb': {
      title: 'Baixar CDs CCB | Como Ouvir CDs e Coletâneas | Cânticos CCB',
      desc: 'Guia para quem procura baixar CDs CCB. Veja como ouvir coletâneas, playlists e álbuns da Congregação Cristã no Brasil.',
      h1: 'Baixar CDs CCB',
      body: '<p>Esta página atende a busca por baixar CDs CCB com orientação honesta. O foco da plataforma é navegar por álbuns, coletâneas, playlists e páginas canônicas do repertório publicado.</p><p><a href="https://www.canticosccb.com.br/albuns">Ver Álbuns</a> · <a href="https://www.canticosccb.com.br/baixar-albuns-ccb">Baixar Álbuns</a> · <a href="https://www.canticosccb.com.br/playlists">Playlists</a></p>',
    },
    '/biblia-ccb': {
      title: 'Biblia CCB | Biblia Narrada e Conteudo Biblico | Cânticos CCB',
      desc: 'Hub da Biblia CCB com acesso a Biblia narrada, livros publicados e navegacao por conteudo biblico no Canticos CCB.',
      h1: 'Biblia CCB',
      body: '<p>Esta é a área editorial da Biblia CCB no Canticos CCB. Aqui o usuário encontra acesso à biblioteca de Bíblia narrada, navegação por livros publicados e links internos para outras áreas relevantes da plataforma.</p><p><a href="https://www.canticosccb.com.br/biblia-narrada">Biblioteca de Bíblia Narrada</a> · <a href="https://www.canticosccb.com.br/instrumentais">Instrumentais</a> · <a href="https://www.canticosccb.com.br/hinos-cantados-ccb">Hinos Cantados</a></p>',
    },
    '/instrumentais': {
      title: 'Hinos Instrumentais CCB | Hinos Tocados e Cifras | Cânticos CCB',
      desc: 'Hub de hinos instrumentais CCB com links para hinos tocados, cifras por instrumento e repertorio relacionado da Congregação Cristã no Brasil.',
      h1: 'Hinos Instrumentais CCB',
      body: '<p>Esta página reúne o cluster de instrumentais da plataforma, ligando o usuário aos hinos tocados, às cifras por instrumento e às páginas individuais do repertório publicado.</p><p><a href="https://www.canticosccb.com.br/hinos-tocados-ccb">Hinos Tocados</a> · <a href="https://www.canticosccb.com.br/cifras-violao-ccb">Cifras de Violão</a> · <a href="https://www.canticosccb.com.br/cifras-teclado-ccb">Cifras de Teclado</a></p>',
    },
    '/biblia-narrada': {
      title: 'Biblia Narrada CCB | Ouvir Biblia Narrada Online | Cânticos CCB',
      desc: 'Biblioteca de Biblia narrada CCB com livros e capitulos publicados, organizada para navegacao e reproducao online.',
      h1: 'Bíblia Narrada CCB',
      body: '<p>A biblioteca de Bíblia narrada do Canticos CCB reúne conteúdo publicado com organização por livro e título, permitindo ouvir online e navegar por diferentes itens do acervo.</p><p><a href="https://www.canticosccb.com.br/biblia-ccb">Biblia CCB</a> · <a href="https://www.canticosccb.com.br/instrumentais">Instrumentais</a> · <a href="https://www.canticosccb.com.br/playlists">Playlists</a></p>',
    },
    '/radio': {
      title: 'Rádio CCB - Seleção Contínua de Hinos | Cânticos CCB',
      desc: 'Ouça uma programação contínua com hinos cantados, tocados, álbuns e seleções da plataforma Cânticos CCB.',
      h1: 'Rádio CCB',
      body: '<p>Ouça uma seleção contínua de hinos cantados, tocados, lançamentos e destaques organizados pela plataforma Cânticos CCB.</p><p><a href="https://www.canticosccb.com.br/playlists">Ver Playlists</a> · <a href="https://www.canticosccb.com.br/hinos-cantados-ccb">Hinos Cantados</a> · <a href="https://www.canticosccb.com.br/hinos-tocados-ccb">Hinos Tocados</a></p>',
    },
  };
  const page = pages[path];
  if (!page) return null;
  return {
    title: page.title, description: page.desc, canonical: `${SITE_URL}${path}`,
    schemas: [],
    noindex: page.noindex,
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; ${esc(page.h1)}</nav>
      <h1>${esc(page.h1)}</h1>
      ${page.body}
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

// ─── Main Handler ────────────────────────────────────────────────────────────
export default async function handler(req: Request): Promise<Response> {
  const ua = req.headers.get('user-agent') || '';
  const url = new URL(req.url);

  // The "path" query param is set by vercel.json rewrite
  const pathname = url.searchParams.get('path') || url.pathname.replace(/^\/api\/ssr/, '') || '/';

  // Playlists are private SPA routes. Never make them depend on Supabase SSR.
  if (pathname === '/playlist/criar' || /^\/playlist\/[^/]+$/.test(pathname)) {
    return serveSpaIndex();
  }

  let pageMeta: PageMeta | null = null;
  let dependencyError: SupabaseUnavailableError | null = null;

  try {
    if (pathname === '/') {
      pageMeta = handleHome();
    } else {
    const hinoMatch = pathname.match(/^\/hino\/(.+)$/);
    const compositorMatch = pathname.match(/^\/compositor\/(.+)$/);
    const albumMatch = pathname.match(/^\/album\/(.+)$/);
    const hinarioNumMatch = pathname.match(/^\/hinario\/(\d+)$/);
    const cifraMatch = pathname.match(/^\/cifra\/(.+)$/);
    const categoriaMatch = pathname.match(/^\/categoria\/([^/]+)$/);
    const playlistMatch = pathname.match(/^\/playlist\/([^/]+)$/);
    const hinarioRangeMatch = pathname.match(/^\/hinos-(1-a-120|121-a-240|241-a-360|361-a-480)-ccb$/);
    const broadHinosHubMatch = pathname === '/hinos-ccb';
    const broadCifrasHubMatch = pathname === '/cifras-hinos-ccb';
    const hymnHubMatch = pathname.match(/^\/hinos-(cantados|tocados|avulsos)-ccb$/);
    const cifraHubMatch = pathname.match(/^\/cifras-(violao|ukulele|teclado)-ccb$/);

    if (hinoMatch) {
      pageMeta = await handleHino(hinoMatch[1]);
    } else if (compositorMatch) {
      pageMeta = await handleCompositor(compositorMatch[1]);
    } else if (albumMatch) {
      pageMeta = await handleAlbum(albumMatch[1]);
    } else if (hinarioNumMatch) {
      pageMeta = await handleHinarioView(hinarioNumMatch[1]);
    } else if (cifraMatch) {
      pageMeta = await handleCifra(cifraMatch[1]);
    } else if (categoriaMatch) {
      pageMeta = await handleCategoria(categoriaMatch[1]);
    } else if (playlistMatch) {
      pageMeta = await handlePlaylistDetail(playlistMatch[1]);
    } else if (hinarioRangeMatch) {
      pageMeta = await handleHinarioRangePage(pathname);
    } else if (broadHinosHubMatch) {
      pageMeta = await handleBroadHinosHub();
    } else if (broadCifrasHubMatch) {
      pageMeta = await handleBroadCifrasHub();
    } else if (hymnHubMatch) {
      pageMeta = await handleHymnHub(pathname);
    } else if (cifraHubMatch) {
      pageMeta = await handleCifraInstrumentHub(pathname);
    } else if (pathname === '/cifras') {
      pageMeta = await handleCifrasList();
    } else if (pathname === '/hinario') {
      pageMeta = await handleHinarioList();
    } else if (pathname === '/playlists') {
      pageMeta = await handlePlaylistsList();
    } else {
      pageMeta = handleStaticPage(pathname);
    }
  }
  } catch (e) {
    if (e instanceof SupabaseUnavailableError) {
      dependencyError = e;
      console.error("[SSR] Supabase unavailable");
    } else {
      console.error("[SSR] Error:", e);
    }
  }
  if (dependencyError) {
    return new Response("<html><head><title>Serviço temporariamente indisponível | Cânticos CCB</title><meta name=\"robots\" content=\"noindex, follow\"></head><body><h1>Serviço temporariamente indisponível</h1><p>Tente novamente mais tarde.</p></body></html>", {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, follow",
        "Retry-After": "120",
      },
    });
  }

  // If no page meta found, return an actual 404/noindex page to avoid soft 404 indexing.
  if (!pageMeta) {
    pageMeta = {
      title: 'Página não encontrada | Cânticos CCB',
      description: 'A página solicitada não foi encontrada no Cânticos CCB.',
      canonical: `${SITE_URL}${pathname}`,
      schemas: [],
      noindex: true,
      status: 404,
      bodyHtml: `
        <h1>Página não encontrada</h1>
        <p>A página solicitada não existe ou foi movida.</p>
        <nav>
          <ul>
            <li><a href="${SITE_URL}/">Início</a></li>
            <li><a href="${SITE_URL}/search">Buscar Hinos</a></li>
            <li><a href="${SITE_URL}/hinos-ccb">Hinos CCB</a></li>
            <li><a href="${SITE_URL}/hinario">Hinário</a></li>
            <li><a href="${SITE_URL}/cifras">Cifras</a></li>
            <li><a href="${SITE_URL}/cifras-hinos-ccb">Cifras de Hinos CCB</a></li>
            <li><a href="${SITE_URL}/compositores">Compositores</a></li>
            <li><a href="${SITE_URL}/albuns">Álbuns</a></li>
          </ul>
        </nav>`,
    };
  }

  const html = buildFullHtml(pageMeta);
  return new Response(html, {
    status: pageMeta.status || 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      'Vary': 'User-Agent',
      'X-Robots-Tag': pageMeta.noindex ? 'noindex, follow' : 'index, follow',
    },
  });
}
