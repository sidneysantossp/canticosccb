import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock3, Headphones, Music2, Music4, Mic2, Play } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import AlbumsSection from '@/components/home/AlbumsSection';
import { getAll as getAllCategories } from '@/lib/categoriesApi';
import { buildAlbumCoverUrl } from '@/lib/media-helper';
import { supabaseFetch } from '@/lib/supabaseRest';
import { generateBreadcrumbSchema, generateFAQSchema, generateItemListSchema } from '@/utils/schemaGenerator';
import { buildHinoUrl } from '@/utils/slugUrl';
import { buildHinarioUrl } from '@/utils/hinarioSeo';

type HymnHubType = 'cantados' | 'tocados' | 'avulsos';

type HubConfig = {
  path: string;
  heading: string;
  title: string;
  description: string;
  intro: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  faq: Array<{ question: string; answer: string }>;
};

type HubHymn = {
  id: string;
  numero: number;
  titulo: string;
  compositor_nome: string;
  categoria?: string;
  duracao?: string;
};

type HubSongCandidate = {
  numero?: number | null;
  titulo?: string | null;
  categoria?: string | null;
};

type HubAlbum = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
};

const HUBS: Record<HymnHubType, HubConfig> = {
  cantados: {
    path: '/hinos-cantados-ccb',
    heading: 'Hinos Cantados CCB',
    title: 'Hinos Cantados CCB | Ouça Hinos Cantados da CCB',
    description: 'Explore hinos cantados da CCB com links para letra, áudio e navegação pelo repertório da comunidade CCB.',
    intro: 'Página dedicada aos hinos cantados da CCB, com repertório navegável, links para letra e acesso rápido às páginas individuais de cada hino.',
    keywords: 'hinos cantados ccb, ouvir hinos cantados ccb, hinos ccb cantados, hinos comunidade CCB',
    icon: Mic2,
    accentClass: 'from-emerald-600/30 to-transparent',
    faq: [
      {
        question: 'Onde ouvir hinos cantados da CCB?',
        answer: 'Nesta página você encontra uma seleção de hinos cantados da CCB com links para ouvir, ver a letra e navegar pelo repertório relacionado.',
      },
      {
        question: 'Os hinos cantados têm letra disponível?',
        answer: 'Sim. Sempre que o hino possui número no hinário, a página também oferece link para a letra correspondente no Hinário da CCB.',
      },
    ],
  },
  tocados: {
    path: '/hinos-tocados-ccb',
    heading: 'Hinos Tocados CCB',
    title: 'Hinos Tocados CCB | Repertório Instrumental e Tocado',
    description: 'Navegue por hinos tocados da CCB com acesso rápido às páginas de áudio, letra e repertório relacionado.',
    intro: 'Hub temático para hinos tocados da CCB, ideal para quem procura repertório instrumental, execução musical e navegação por número e título.',
    keywords: 'hinos tocados ccb, hinos instrumental ccb, ouvir hinos tocados ccb, repertório tocado ccb',
    icon: Music2,
    accentClass: 'from-sky-600/30 to-transparent',
    faq: [
      {
        question: 'O que encontro nos hinos tocados da CCB?',
        answer: 'Você encontra páginas de hinos com foco no repertório tocado, incluindo navegação por número, compositor e acesso à letra quando disponível.',
      },
      {
        question: 'Os hinos tocados servem para estudo musical?',
        answer: 'Sim. Esta área ajuda a localizar rapidamente repertório tocado e a conectar cada hino com letra, cifra e contexto do hinário quando houver.',
      },
    ],
  },
  avulsos: {
    path: '/hinos-avulsos-ccb',
    heading: 'Hinos Avulsos CCB',
    title: 'Hinos Avulsos CCB | Repertório Avulso da comunidade CCB',
    description: 'Veja hinos avulsos da CCB com links para ouvir, acessar letra, cifra e navegar por compositor e repertório relacionado.',
    intro: 'Hub dedicado aos hinos avulsos da CCB, com acesso organizado às páginas individuais, letras, compositores e repertório relacionado.',
    keywords: 'hinos avulsos ccb, ouvir hinos avulsos ccb, repertório avulso ccb, hinos comunidade CCB',
    icon: Music4,
    accentClass: 'from-amber-500/30 to-transparent',
    faq: [
      {
        question: 'O que são hinos avulsos da CCB?',
        answer: 'São hinos disponibilizados fora da navegação tradicional do hinário, organizados aqui com links para ouvir, ler letra e explorar repertórios relacionados.',
      },
      {
        question: 'Posso encontrar letra e cifra dos hinos avulsos?',
        answer: 'Quando disponíveis na base, as páginas ligam o hino avulso à sua letra, cifra e outras informações úteis de navegação.',
      },
    ],
  },
};

const normalizeText = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const shouldIncludeHubSong = (song: HubSongCandidate, hub: HymnHubType) => {
  const normalizedCategory = normalizeText(song.categoria || '');

  if (hub === 'avulsos') {
    return true;
  }

  if (hub === 'tocados') {
    return normalizedCategory.includes('tocado') || normalizedCategory.includes('instrument');
  }

  if (hub === 'cantados') {
    return normalizedCategory.includes('cantado');
  }

  return true;
};

const isAvulsosAlbum = (album: any, relatedAvulsoAlbumIds: Set<string>) => {
  const albumId = String(album?.id || '');
  const title = normalizeText(album?.title || album?.titulo || '');
  const genre = normalizeText(album?.genre || album?.genero || '');
  const type = normalizeText(album?.type || album?.tipo || '');

  return (
    relatedAvulsoAlbumIds.has(albumId) ||
    title.includes('avulso') ||
    genre.includes('avulso') ||
    type.includes('avulso')
  );
};

async function fetchHubHymns(hub: HymnHubType): Promise<HubHymn[]> {
  const categories = await getAllCategories({ limit: 1000 });
  const matchingCategories = categories.filter((category) => {
    const slug = normalizeText(category.slug);
    const name = normalizeText(category.name);
    return slug.includes(hub) || name.includes(hub);
  });

  const categoryIds = matchingCategories.map((category) => String(category.id));

  let songs: any[] = [];
  if (categoryIds.length > 0) {
    const relations = await supabaseFetch<any>('hino_categorias', {
      categoria_id: `in.(${categoryIds.join(',')})`,
      select: 'hino_id',
      limit: '5000',
    });
    const hymnIds = relations
      .map((relation) => String(relation.hino_id || ''))
      .filter(Boolean);

    if (hymnIds.length > 0) {
      songs = await supabaseFetch<any>('hinos', {
        id: `in.(${hymnIds.join(',')})`,
        or: '(ativo.eq.true,ativo.eq.1)',
        select: 'id,numero,titulo,compositor_nome,categoria',
        order: 'numero.asc',
        limit: '500',
      });
    }
  }

  const merged = [...songs];

  if (hub !== 'avulsos') {
    const fallbackTerm = hub.slice(0, -1);
    const fallbackSongs = await supabaseFetch<any>('hinos', {
      categoria: `ilike.%${fallbackTerm}%`,
      or: '(ativo.eq.true,ativo.eq.1)',
      select: 'id,numero,titulo,compositor_nome,categoria',
      order: 'numero.asc',
      limit: '500',
    });

    const seen = new Set(merged.map((song) => String(song.id)));
    for (const song of fallbackSongs) {
      const key = String(song.id);
      if (!seen.has(key)) {
        merged.push(song);
        seen.add(key);
      }
    }
  }

  return merged
    .filter((song) => shouldIncludeHubSong(song, hub))
    .map((song) => ({
      id: String(song.id),
      numero: Number(song.numero || 0),
      titulo: String(song.titulo || 'Hino'),
      compositor_nome: String(song.compositor_nome || 'Compositor CCB'),
      categoria: song.categoria || undefined,
      duracao: song.duracao || song.duration || song.duracao_formatada || undefined,
    }))
    .sort((a, b) => {
      if (a.numero > 0 && b.numero > 0) return a.numero - b.numero;
      if (a.numero > 0) return -1;
      if (b.numero > 0) return 1;
      return a.titulo.localeCompare(b.titulo, 'pt-BR');
    });
}

async function fetchHubAlbums(hub: HymnHubType): Promise<HubAlbum[]> {
  if (hub !== 'avulsos') return [];

  const categories = await getAllCategories({ limit: 1000 });
  const avulsosCategoryIds = categories
    .filter((category) => {
      const slug = normalizeText(category.slug);
      const name = normalizeText(category.name);
      return slug.includes('avulso') || name.includes('avulso');
    })
    .map((category) => String(category.id));

  let relatedAvulsoAlbumIds = new Set<string>();

  if (avulsosCategoryIds.length > 0) {
    const hymnRelations = await supabaseFetch<any>('hino_categorias', {
      categoria_id: `in.(${avulsosCategoryIds.join(',')})`,
      select: 'hino_id',
      limit: '5000',
    });

    const avulsoHymnIds = Array.from(
      new Set(hymnRelations.map((relation) => String(relation.hino_id || '')).filter(Boolean))
    );

    if (avulsoHymnIds.length > 0) {
      const albumRelations = await supabaseFetch<any>('album_hinos', {
        hino_id: `in.(${avulsoHymnIds.join(',')})`,
        select: 'album_id',
        limit: '5000',
      });

      relatedAvulsoAlbumIds = new Set(
        albumRelations.map((relation) => String(relation.album_id || '')).filter(Boolean)
      );
    }
  }

  const albums = await supabaseFetch<any>('albums', {
    select: '*',
    order: 'created_at.desc',
    limit: '1000',
  });

  return albums
    .filter((album) => album?.is_published !== false && album?.active !== false)
    .filter((album) => isAvulsosAlbum(album, relatedAvulsoAlbumIds))
    .slice(0, 24)
    .map((album) => ({
      id: String(album.id),
      title: String(album.title || album.titulo || 'Álbum de Hinos Avulsos'),
      artist: String(album.artist || 'Cânticos CCB'),
      coverUrl: buildAlbumCoverUrl({ id: String(album.id), cover_url: album.cover_url || '' }),
    }));
}

interface HymnHubPageProps {
  hub: HymnHubType;
}

const HymnHubPage: React.FC<HymnHubPageProps> = ({ hub }) => {
  const config = HUBS[hub];
  const Icon = config.icon;
  const playlistHero = hub === 'avulsos' || hub === 'cantados' || hub === 'tocados';
  const [items, setItems] = useState<HubHymn[]>([]);
  const [albums, setAlbums] = useState<HubAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const [hymnsData, albumsData] = await Promise.all([
          fetchHubHymns(hub),
          fetchHubAlbums(hub),
        ]);
        if (!cancelled) {
          setItems(hymnsData);
          setAlbums(albumsData);
        }
      } catch (error) {
        console.error(`Erro ao carregar hub ${hub}:`, error);
        if (!cancelled) {
          setItems([]);
          setAlbums([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [hub]);

  const schemaData = useMemo(() => ([
    generateBreadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: config.heading, url: config.path },
    ]),
    generateItemListSchema({
      name: config.heading,
      description: config.description,
      url: config.path,
      items: items.slice(0, 80).map((item, index) => ({
        name: item.numero > 0 ? `Hino ${item.numero} - ${item.titulo}` : item.titulo,
        url: buildHinoUrl(item.id, item.titulo, item.numero),
        position: index + 1,
      })),
    }),
    generateFAQSchema(config.faq),
  ]), [config, items]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background-primary">
      <SEOHead
        title={config.title}
        description={config.description}
        keywords={config.keywords}
        canonical={config.path}
        schemaData={schemaData}
        noindex={!isLoading && items.length === 0}
      />

      <div className={`w-full bg-gradient-to-b ${playlistHero ? 'from-primary-600/35 via-primary-950/25 to-background-primary' : config.accentClass} px-6 pb-8 pt-20 sm:px-8`}>
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          {playlistHero ? (
            <div className="sm:flex sm:items-center sm:gap-8">
              <div className="mb-6 flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl bg-black/35 shadow-xl sm:mb-0" style={albums[0]?.coverUrl ? { backgroundImage: `url(${albums[0].coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} aria-hidden="true"><div className="h-28 w-28 rounded-full border-4 border-white/10 bg-[radial-gradient(circle_at_center,#19c463_0_13%,#0b1710_14%_20%,#303735_21%_42%,#101513_43%_60%,#343b38_61%_63%,#111514_64%_100%)] shadow-2xl" /></div>
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-200">Playlist pública</p>
                <h1 className="mt-2 text-3xl font-bold leading-tight text-white md:text-5xl">{config.heading}</h1>
                <p className="mt-3 text-base text-white/80 md:text-lg">{config.intro}</p>
                <p className="mt-5 text-sm text-white/70">{items.length} faixas · Repertório avulso</p>
              </div>
            </div>
          ) : <div className="flex items-start gap-4">
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold text-primary-400 leading-tight">{config.heading}</h1>
              <p className="text-white/85 text-base md:text-lg mt-3">{config.intro}</p>
              <div className="flex flex-wrap gap-4 mt-5 text-sm text-white/75">
                <span>{items.length} hinos encontrados</span>
                <span>Links para ouvir e navegar por repertorio</span>
                <span>Foco em intencao especifica de busca</span>
              </div>
            </div>
          </div>}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className={`grid min-w-0 gap-6 ${hub === 'avulsos' ? '' : 'lg:grid-cols-[1.5fr,0.9fr]'}`}>
          <div className="min-w-0 space-y-8">
            <section className={`w-full min-w-0 rounded-2xl border border-white/10 bg-background-secondary p-6 ${hub === 'avulsos' ? 'border-0 bg-transparent p-0 lg:p-0' : ''}`}>
              {hub !== 'avulsos' && <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Repertorio indexavel</h2>
                  <p className="text-text-muted mt-1">Selecao navegavel com links para paginas individuais e letras do hinario quando houver numero.</p>
                </div>
                <Headphones className="w-6 h-6 text-primary-400" />
              </div>}

              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-text-muted">
                  Nenhum hino publicado foi encontrado para este hub ainda.
                </div>
              ) : hub === 'avulsos' ? (
                <div className="w-full max-w-full overflow-hidden">
                  <div className="hidden w-full grid-cols-[40px_minmax(0,1fr)_minmax(120px,180px)_72px_40px] items-center gap-4 border-b border-white/10 px-2 pb-3 text-xs uppercase tracking-wider text-text-muted lg:grid">
                    <span>#</span>
                    <span>Nome do hino</span>
                    <span>Categoria</span>
                    <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Tempo</span>
                    <span />
                  </div>
                  {items.map((item, index) => (
                    <article key={item.id} className="group w-full min-w-0 border-b border-white/10 px-2 py-4 transition-colors last:border-b-0 hover:bg-primary-500/10">
                      <div className="grid w-full min-w-0 grid-cols-[32px_minmax(0,1fr)_40px] items-center gap-3 lg:grid-cols-[40px_minmax(0,1fr)_minmax(120px,180px)_72px_40px] lg:gap-4">
                        <span className="text-center text-sm text-text-muted">{index + 1}</span>
                        <div className="min-w-0 overflow-hidden">
                          <h3 className="truncate font-semibold text-white">
                            <Link to={buildHinoUrl(item.id, item.titulo, item.numero)} className="transition-colors hover:text-primary-400">
                              {item.numero > 0 ? `Hino ${item.numero} - ${item.titulo}` : item.titulo}
                            </Link>
                          </h3>
                          <p className="mt-1 truncate text-sm text-text-muted">{item.compositor_nome}</p>
                        </div>
                        <span className="hidden min-w-0 truncate text-sm text-text-muted lg:block">{item.categoria || 'Hinos Avulsos'}</span>
                        <span className="hidden text-sm text-text-muted lg:block">{item.duracao || '—'}</span>
                        <Link
                          to={buildHinoUrl(item.id, item.titulo, item.numero)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-black transition-colors hover:bg-primary-400"
                          aria-label={`Ouvir ${item.titulo}`}
                        >
                          <Play className="h-4 w-4 fill-current" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((item) => (
                    <article key={item.id} className="group border-b border-white/10 px-2 py-4 transition-colors last:border-b-0 hover:bg-white/5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-white">
                              <Link to={buildHinoUrl(item.id, item.titulo, item.numero)} className="transition-colors hover:text-primary-400">
                                {item.numero > 0 ? `Hino ${item.numero} - ${item.titulo}` : item.titulo}
                              </Link>
                            </h3>
                            <p className="mt-1 truncate text-sm text-text-muted">{item.compositor_nome}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            to={buildHinoUrl(item.id, item.titulo, item.numero)}
                            className="rounded-full bg-primary-500 px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-primary-400"
                          >Ouvir hino</Link>
                          {item.numero > 0 && (
                            <Link
                              to={buildHinarioUrl(item.numero, item.titulo)}
                              className="rounded-full border border-white/15 px-3 py-2 text-sm text-white transition-colors hover:border-primary-500/40 hover:text-primary-300"
                            >
                              Ver letra
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {hub === 'avulsos' && albums.length > 0 && (
              <AlbumsSection
                albums={albums}
                title={<>Álbuns<br />de Hinos Avulsos</>}
                viewAllHref="/albuns"
                className="px-0 mb-0"
              />
            )}
          </div>

          {hub !== 'avulsos' && <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Como esta pagina ajuda no Google</h2>
              <ul className="space-y-3 text-sm text-text-muted">
                <li>Atende uma intencao especifica de busca com URL propria.</li>
                <li>Distribui links internos para hinos individuais e paginas de letra.</li>
                <li>Entrega contexto textual antes da listagem do repertorio.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Perguntas frequentes</h2>
              <div className="space-y-4">
                {config.faq.map((faq) => (
                  <div key={faq.question}>
                    <h3 className="text-white font-medium">{faq.question}</h3>
                    <p className="text-text-muted text-sm mt-1">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>}
        </div>
      </div>
    </div>
  );
};

export default HymnHubPage;
