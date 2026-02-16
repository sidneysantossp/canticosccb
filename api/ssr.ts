// Vercel Edge Function — serves pre-rendered HTML to bots/crawlers
// For a Vite SPA, this is the correct way to do SSR on Vercel
// Deployed at /api/ssr and called via vercel.json rewrites for bot user-agents

export const config = { runtime: 'edge' };

// ─── Bot Detection ───────────────────────────────────────────────────────────
const BOT_UA_PATTERNS = [
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'slurp', 'baiduspider',
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot',
  'discordbot', 'applebot', 'pinterest', 'redditbot',
  'gptbot', 'claudebot', 'google-extended', 'applebot-extended',
  'perplexitybot', 'bytespider', 'ccbot', 'amazonbot', 'meta-externalagent',
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
const SITE_URL = 'https://canticosccb.com.br';

async function supaFetch(table: string, params: Record<string, string>): Promise<any[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString(), {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

// ─── UUID Extraction ─────────────────────────────────────────────────────────
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function extractUUID(param: string): string {
  const m = param.match(UUID_RE);
  return m ? m[0] : param;
}

// ─── HTML Builder ────────────────────────────────────────────────────────────
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogType?: string;
  ogImage?: string;
  schemas?: object[];
  bodyHtml: string;
}

function buildFullHtml(meta: PageMeta): string {
  const ogType = meta.ogType || 'website';
  const ogImage = meta.ogImage || `${SITE_URL}/logo-canticos-ccb.png`;
  const schemasHtml = (meta.schemas || [])
    .map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n    ');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(meta.title)}</title>
    <meta name="description" content="${esc(meta.description)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${esc(meta.canonical)}">
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
  const titulo = h.titulo || 'Hino CCB';
  const title = `Hino ${num} — ${titulo}${h.compositor_nome ? ` por ${h.compositor_nome}` : ''} | Ouça e Leia a Letra | Cânticos CCB`;
  const desc = `Ouça o Hino ${num} "${titulo}" da CCB${h.compositor_nome ? ` por ${h.compositor_nome}` : ''}. Letra completa, áudio e cifra do Hinário 5 da Congregação Cristã no Brasil.`;
  const canonical = `${SITE_URL}/hino/${idParam}`;

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

  return {
    title, description: desc, canonical, ogType: 'music.song', ogImage: h.cover_url || undefined,
    schemas: [schema, breadcrumb],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/search">Hinos</a> &rsaquo; Hino ${num}</nav>
      <h1>Hino ${num} — ${esc(titulo)}</h1>
      ${h.compositor_nome ? `<p><strong>Compositor:</strong> ${esc(h.compositor_nome)}</p>` : ''}
      ${h.categoria ? `<p><strong>Categoria:</strong> ${esc(h.categoria)}</p>` : ''}
      ${h.duracao ? `<p><strong>Duração:</strong> ${esc(h.duracao)}</p>` : ''}
      ${letraHtml}
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handleCompositor(idParam: string): Promise<PageMeta | null> {
  const uuid = extractUUID(idParam);
  const rows = await supaFetch('composers', {
    id: `eq.${uuid}`,
    select: 'id,name,artistic_name,bio,biography,avatar_url,photo_url,category',
    limit: '1',
  });
  if (!rows.length) return null;
  const c = rows[0];
  const nome = c.artistic_name || c.name || 'Compositor CCB';
  const bio = c.biography || c.bio || '';
  const title = `${nome} — Hinos e Biografia | Compositor CCB | Cânticos CCB`;
  const desc = bio
    ? bio.substring(0, 155).replace(/\n/g, ' ') + '...'
    : `Conheça ${nome}, compositor de hinos da Congregação Cristã no Brasil. Ouça seus hinos, veja sua biografia e discografia completa.`;
  const canonical = `${SITE_URL}/compositor/${idParam}`;
  const image = c.photo_url || c.avatar_url || undefined;

  const hinos = await supaFetch('hinos', {
    compositor_nome: `ilike.%${c.name}%`,
    ativo: 'eq.true',
    select: 'id,numero,titulo',
    order: 'numero.asc',
    limit: '50',
  });

  const schema = {
    '@context': 'https://schema.org', '@type': 'Person',
    name: nome, url: canonical, description: desc.substring(0, 200),
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
    ? `<section><h2>Hinos de ${esc(nome)}</h2><ul>${hinos.map((h: any) => `<li><a href="${SITE_URL}/hino/${h.id}">Hino ${h.numero} — ${esc(h.titulo || '')}</a></li>`).join('')}</ul></section>`
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
  const title = `${a.title || 'Álbum'} — ${a.artist || 'CCB'} | Cânticos CCB`;
  const desc = a.description || `Ouça o álbum "${a.title}" de ${a.artist || 'CCB'}. Hinos da Congregação Cristã no Brasil.`;
  const canonical = `${SITE_URL}/album/${idParam}`;

  const schema = {
    '@context': 'https://schema.org', '@type': 'MusicAlbum',
    name: a.title, url: canonical,
    ...(a.artist ? { byArtist: { '@type': 'Person', name: a.artist } } : {}),
    ...(a.cover_url ? { image: a.cover_url } : {}),
  };
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Álbuns', item: `${SITE_URL}/albuns` },
      { '@type': 'ListItem', position: 3, name: a.title, item: canonical },
    ],
  };

  return {
    title, description: desc, canonical, ogType: 'music.album', ogImage: a.cover_url || undefined,
    schemas: [schema, breadcrumb],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/albuns">Álbuns</a> &rsaquo; ${esc(a.title || '')}</nav>
      <h1>${esc(a.title || 'Álbum')}</h1>
      ${a.artist ? `<p><strong>Artista:</strong> ${esc(a.artist)}</p>` : ''}
      ${a.description ? `<p>${esc(a.description)}</p>` : ''}
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handleHinarioView(numero: string): Promise<PageMeta | null> {
  const num = parseInt(numero, 10);
  if (isNaN(num)) return null;
  const rows = await supaFetch('hinario', {
    numero: `eq.${num}`,
    select: 'id,numero,titulo,letra,compositor,tom',
    limit: '1',
  });
  if (!rows.length) return null;
  const h = rows[0];
  const titulo = h.titulo || '';
  const title = `Hino ${h.numero} — ${titulo} | Letra Completa do Hinário 5 | Cânticos CCB`;
  const desc = `Leia a letra completa do Hino ${h.numero} "${titulo}" do Hinário 5 da CCB.${h.compositor ? ` Compositor: ${h.compositor}.` : ''}`;
  const canonical = `${SITE_URL}/hinario/${h.numero}`;

  const schema = {
    '@context': 'https://schema.org', '@type': 'CreativeWork',
    name: `Hino ${h.numero} — ${titulo}`, url: canonical,
    inLanguage: 'pt-BR', genre: 'Hino Religioso',
    isPartOf: { '@type': 'Book', name: 'Hinário 5 — Hinos de Louvores e Súplicas a Deus' },
    ...(h.compositor ? { author: { '@type': 'Person', name: h.compositor } } : {}),
  };
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Hinário', item: `${SITE_URL}/hinario` },
      { '@type': 'ListItem', position: 3, name: `Hino ${h.numero}`, item: canonical },
    ],
  };

  const letraHtml = h.letra
    ? `<section><h2>Letra</h2><div style="white-space:pre-line;">${esc(h.letra)}</div></section>`
    : '';

  return {
    title, description: desc, canonical,
    schemas: [schema, breadcrumb],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/hinario">Hinário</a> &rsaquo; Hino ${h.numero}</nav>
      <h1>Hino ${h.numero} — ${esc(titulo)}</h1>
      ${h.compositor ? `<p><strong>Compositor:</strong> ${esc(h.compositor)}</p>` : ''}
      ${h.tom ? `<p><strong>Tom:</strong> ${esc(h.tom)}</p>` : ''}
      ${letraHtml}
      <nav style="margin-top:20px;">
        ${num > 1 ? `<a href="${SITE_URL}/hinario/${num - 1}">&larr; Hino ${num - 1}</a> ` : ''}
        ${num < 480 ? `<a href="${SITE_URL}/hinario/${num + 1}">Hino ${num + 1} &rarr;</a>` : ''}
      </nav>
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handleCifra(slug: string): Promise<PageMeta | null> {
  const rows = await supaFetch('cifras', {
    slug: `eq.${slug}`,
    select: 'id,title,artist,original_key,content,cover_url,slug',
    limit: '1',
  });
  if (!rows.length) return null;
  const c = rows[0];
  const title = `Cifra: ${c.title || 'Cifra CCB'}${c.artist ? ` — ${c.artist}` : ''} | Tom ${c.original_key || ''} | Cânticos CCB`;
  const desc = `Cifra de "${c.title || ''}"${c.artist ? ` por ${c.artist}` : ''} em tom ${c.original_key || 'original'}. Cifras de hinos da CCB com transposição de tom.`;
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

  return {
    title, description: desc, canonical, ogImage: c.cover_url || undefined,
    schemas: [schema, breadcrumb],
    bodyHtml: `
      <nav><a href="${SITE_URL}">Início</a> &rsaquo; <a href="${SITE_URL}/cifras">Cifras</a> &rsaquo; ${esc(c.title || '')}</nav>
      <h1>${esc(c.title || 'Cifra')}</h1>
      ${c.artist ? `<p><strong>Artista:</strong> ${esc(c.artist)}</p>` : ''}
      ${c.original_key ? `<p><strong>Tom:</strong> ${esc(c.original_key)}</p>` : ''}
      ${contentHtml}
      <footer><p><a href="${SITE_URL}">Cânticos CCB</a> — Plataforma de hinos da Congregação Cristã no Brasil</p></footer>`,
  };
}

async function handleCifrasList(): Promise<PageMeta> {
  const cifras = await supaFetch('cifras', {
    is_active: 'eq.true', select: 'id,title,artist,slug,original_key',
    order: 'created_at.desc', limit: '100',
  });
  const title = 'Cifras de Hinos da CCB — Cifras com Transposição de Tom | Cânticos CCB';
  const desc = 'Encontre cifras de hinos da Congregação Cristã no Brasil. Cifras com transposição de tom em tempo real para violão, teclado e outros instrumentos.';
  const canonical = `${SITE_URL}/cifras`;
  const listHtml = cifras.length > 0
    ? `<ul>${cifras.map((c: any) => `<li><a href="${SITE_URL}/cifra/${c.slug}">${esc(c.title || '')}${c.artist ? ` — ${esc(c.artist)}` : ''} (${esc(c.original_key || '')})</a></li>`).join('')}</ul>`
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

function handleStaticPage(path: string): PageMeta | null {
  const pages: Record<string, { title: string; desc: string; h1: string; body: string }> = {
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
      desc: 'Conheça o Cânticos CCB, a plataforma digital de hinos da Congregação Cristã no Brasil.',
      h1: 'Sobre o Cânticos CCB',
      body: '<p>O Cânticos CCB é a plataforma digital mais completa para ouvir, ler e estudar hinos da Congregação Cristã no Brasil (CCB). Oferecemos acesso gratuito a hinos cantados e tocados do Hinário 5, cifras musicais, perfis de compositores, letras do hinário e playlists temáticas.</p>',
    },
    '/sobre': {
      title: 'Sobre o Cânticos CCB — Plataforma de Hinos da CCB',
      desc: 'Conheça o Cânticos CCB, a plataforma digital de hinos da Congregação Cristã no Brasil.',
      h1: 'Sobre o Cânticos CCB',
      body: '<p>O Cânticos CCB é a plataforma digital mais completa para ouvir, ler e estudar hinos da Congregação Cristã no Brasil (CCB).</p>',
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
      title: 'Premium — Plano Premium | Cânticos CCB',
      desc: 'Conheça o plano premium do Cânticos CCB com recursos exclusivos.',
      h1: 'Cânticos CCB Premium',
      body: '<p>Conheça os benefícios do plano premium do Cânticos CCB.</p>',
    },
  };
  const page = pages[path];
  if (!page) return null;
  return {
    title: page.title, description: page.desc, canonical: `${SITE_URL}${path}`,
    schemas: [],
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

  // If not a bot, redirect to the SPA (shouldn't happen if rewrites are correct)
  if (!isBot(ua)) {
    return new Response(null, { status: 302, headers: { Location: pathname } });
  }

  let pageMeta: PageMeta | null = null;

  try {
    const hinoMatch = pathname.match(/^\/hino\/(.+)$/);
    const compositorMatch = pathname.match(/^\/compositor\/(.+)$/);
    const albumMatch = pathname.match(/^\/album\/(.+)$/);
    const hinarioNumMatch = pathname.match(/^\/hinario\/(\d+)$/);
    const cifraMatch = pathname.match(/^\/cifra\/(.+)$/);

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
    } else if (pathname === '/cifras') {
      pageMeta = await handleCifrasList();
    } else if (pathname === '/hinario') {
      pageMeta = await handleHinarioList();
    } else {
      pageMeta = handleStaticPage(pathname);
    }
  } catch (e) {
    console.error('[SSR] Error:', e);
  }

  // If no page meta found, return a basic page
  if (!pageMeta) {
    pageMeta = {
      title: 'Cânticos CCB — Hinos da Congregação Cristã no Brasil',
      description: 'Ouça hinos da CCB online grátis. Hinário 5 completo, cifras, compositores e playlists.',
      canonical: `${SITE_URL}${pathname}`,
      schemas: [],
      bodyHtml: `
        <h1>Cânticos CCB</h1>
        <p>Plataforma de hinos da Congregação Cristã no Brasil.</p>
        <nav>
          <ul>
            <li><a href="${SITE_URL}/">Início</a></li>
            <li><a href="${SITE_URL}/search">Buscar Hinos</a></li>
            <li><a href="${SITE_URL}/hinario">Hinário</a></li>
            <li><a href="${SITE_URL}/cifras">Cifras</a></li>
            <li><a href="${SITE_URL}/compositores">Compositores</a></li>
            <li><a href="${SITE_URL}/albuns">Álbuns</a></li>
          </ul>
        </nav>`,
    };
  }

  const html = buildFullHtml(pageMeta);
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'index, follow',
    },
  });
}
