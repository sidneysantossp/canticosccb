import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Disc, Eye, Music2, Music4, Search } from 'lucide-react';
import { GiBanjo, GiGuitar, GiPianoKeys } from 'react-icons/gi';
import SEOHead from '@/components/SEO/SEOHead';
import { type Cifra } from '@/api/cifras';
import { fetchMergedPublicCifrasList, type PublicCifraPageData } from '@/lib/cifras-v2';
import { generateBreadcrumbSchema, generateCifraSchema, generateFAQSchema, generateItemListSchema } from '@/utils/schemaGenerator';
import { buildCifraUrl } from '@/utils/cifraUrl';

type DisplayCifra = Cifra | PublicCifraPageData;

type InstrumentHub = 'violao' | 'ukulele' | 'teclado';

type InstrumentConfig = {
  path: string;
  heading: string;
  title: string;
  description: string;
  intro: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  faq: Array<{ question: string; answer: string }>;
};

const HUBS: Record<InstrumentHub, InstrumentConfig> = {
  violao: {
    path: '/cifras/violao',
    heading: 'Cifras de Violao CCB',
    title: 'Cifras de Violao CCB | Hinos com Acordes para Violao',
    description: 'Veja cifras de hinos da CCB para violao, com acordes, tom original e links para repertorio relacionado.',
    intro: 'Hub de cifras de violao da CCB com repertorio especifico para quem busca acordes, tom original e navegacao por hino.',
    keywords: 'cifras violao ccb, cifra violao hinos ccb, acordes ccb violao, cifras de hinos no violao',
    icon: Music4,
    faq: [
      {
        question: 'Onde encontrar cifras de violao da CCB?',
        answer: 'Nesta pagina voce encontra cifras publicadas para violao, com links diretos para cada cifra, tom e repertorio relacionado.',
      },
      {
        question: 'As cifras de violao mostram o tom original?',
        answer: 'Sim. Quando o dado esta disponivel, a listagem exibe o tom original para facilitar estudo e execucao musical.',
      },
    ],
  },
  ukulele: {
    path: '/cifras/ukulele',
    heading: 'Cifras de Ukulele CCB',
    title: 'Cifras de Ukulele CCB | 480 Hinos para Tocar',
    description: 'Explore os 480 hinos da CCB organizados para ukulele. Encontre cifras, acordes e o repertório completo para estudo e ensaio.',
    intro: 'Hub dedicado a cifras de ukulele da CCB, pensado para buscas especificas por instrumento e navegacao rapida por repertorio.',
    keywords: 'cifras ukulele ccb, cifra ukulele hinos ccb, acordes ukulele ccb',
    icon: GiBanjo,
    faq: [
      {
        question: 'Existem cifras de ukulele da CCB nesta plataforma?',
        answer: 'Quando publicadas na base, as cifras de ukulele aparecem aqui com link direto para cada pagina individual.',
      },
      {
        question: 'Posso usar esta pagina para estudar repertorio?',
        answer: 'Sim. O objetivo deste hub e agrupar repertorio por instrumento e facilitar a descoberta de cifras especificas.',
      },
    ],
  },
  teclado: {
    path: '/cifras/teclado',
    heading: 'Cifras de Teclado CCB',
    title: 'Cifras de Teclado CCB | 480 Hinos para Tocar',
    description: 'Explore os 480 hinos da CCB organizados para teclado. Encontre cifras, acordes e o repertório completo para estudo e ensaio.',
    intro: 'Pagina focada em cifras de teclado da CCB para atender buscas especificas por instrumento e reforcar a navegacao por repertorio musical.',
    keywords: 'cifras teclado ccb, cifra teclado hinos ccb, acordes teclado ccb',
    icon: GiPianoKeys,
    faq: [
      {
        question: 'Onde encontrar cifras de teclado da CCB?',
        answer: 'Esta pagina concentra as cifras cadastradas para teclado, com links para tom, conteudo da cifra e repertorio relacionado.',
      },
      {
        question: 'As cifras de teclado ajudam na navegacao por hinos?',
        answer: 'Sim. Cada cifra individual pode levar o usuario ao hino correspondente e ampliar a navegacao interna do repertorio.',
      },
    ],
  },
};

interface CifraInstrumentHubPageProps {
  instrument: InstrumentHub;
}

const getHymnNumber = (title: string) => {
  const match = title.match(/^Hino\s+(\d{1,3})\b/i);
  return match ? Number(match[1]) : null;
};

const getHymnName = (title: string) => title.replace(/^Hino\s+\d{1,3}\s*-\s*/i, '');

const normalizeSearch = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR');

const HERO_IMAGES: Record<InstrumentHub, string> = {
  violao: '/images/cifras/hero-violao.png',
  ukulele: '/images/cifras/hero-ukulele.png',
  teclado: '/images/cifras/hero-teclado.png',
};

const CifraInstrumentHubPage: React.FC<CifraInstrumentHubPageProps> = ({ instrument }) => {
  const config = HUBS[instrument];
  const Icon = config.icon;
  const [items, setItems] = useState<DisplayCifra[]>([]);
  const [hinarioCatalog, setHinarioCatalog] = useState<DisplayCifra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchMergedPublicCifrasList();
        if (!cancelled) {
          setHinarioCatalog(data.filter((item) => item.instrument === 'violao' && item.category === 'hinario'));
          setItems(data.filter((item) => (
            item.instrument === instrument
            && (instrument !== 'violao' || item.category === 'hinario')
          )));
        }
      } catch (error) {
        console.error(`Erro ao carregar cifras de ${instrument}:`, error);
        if (!cancelled) {
          setItems([]);
          setHinarioCatalog([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [instrument]);

  const schemaData = useMemo(() => ([
    generateBreadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Cifras', url: '/cifras' },
      { name: config.heading, url: config.path },
    ]),
    generateItemListSchema({
      name: config.heading,
      description: config.description,
      url: config.path,
      items: items.slice(0, 80).map((item, index) => ({
        name: item.title,
        url: buildCifraUrl(item.instrument, item.slug),
        position: index + 1,
      })),
    }),
    generateFAQSchema(config.faq),
    ...items.slice(0, 20).map((item) => generateCifraSchema({
      name: item.title,
      url: buildCifraUrl(item.instrument, item.slug),
      artist: item.artist,
      description: item.content?.slice(0, 180),
      image: item.cover_url || undefined,
      musicalKey: item.original_key,
      instrument: instrument,
    })),
  ]), [config, instrument, items]);

  const orderedItems = useMemo(() => [...items].sort((first, second) => {
    const firstNumber = getHymnNumber(first.title) ?? Number.MAX_SAFE_INTEGER;
    const secondNumber = getHymnNumber(second.title) ?? Number.MAX_SAFE_INTEGER;
    return firstNumber - secondNumber || first.title.localeCompare(second.title, 'pt-BR');
  }), [items]);

  const orderedCatalog = useMemo(() => [...hinarioCatalog].sort((first, second) => {
    const firstNumber = getHymnNumber(first.title) ?? Number.MAX_SAFE_INTEGER;
    const secondNumber = getHymnNumber(second.title) ?? Number.MAX_SAFE_INTEGER;
    return firstNumber - secondNumber || first.title.localeCompare(second.title, 'pt-BR');
  }), [hinarioCatalog]);

  const displayItems = instrument === 'violao' ? orderedItems : orderedCatalog;
  const RowIcon = instrument === 'violao' ? GiGuitar : Icon;
  const searchResults = useMemo(() => {
    const term = searchTerm.trim();
    if (!term) return [];

    const requestedNumber = term.match(/^0*(\d{1,3})$/)?.[1];
    if (requestedNumber) {
      return displayItems.filter((item) => getHymnNumber(item.title) === Number(requestedNumber)).slice(0, 1);
    }

    const normalizedTerm = normalizeSearch(term);
    return displayItems.filter((item) => normalizeSearch(item.title).includes(normalizedTerm)).slice(0, 8);
  }, [displayItems, searchTerm]);

  if (['violao', 'ukulele', 'teclado'].includes(instrument)) {
    return (
      <div className="min-h-screen bg-background-primary">
        <SEOHead
          title={config.title}
          description={config.description}
          keywords={config.keywords}
          canonical={config.path}
          schemaData={schemaData}
          noindex={!isLoading && items.length === 0}
        />

        <section className="relative isolate min-h-[300px] overflow-hidden border-b border-white/10 sm:min-h-[360px]">
          <img
            src={HERO_IMAGES[instrument]}
            alt={`Mãos tocando ${instrument === 'teclado' ? 'teclado' : `acordes em um ${instrument}`}`}
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[64%_center]"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background-primary via-background-primary/85 to-background-primary/20" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background-primary/60 to-transparent" />

          <div className="mx-auto flex min-h-[300px] max-w-6xl flex-col justify-center px-4 py-10 sm:min-h-[360px] sm:px-6">
            <Link to="/cifras" className="mb-6 inline-flex w-fit items-center gap-2 text-white/80 transition-colors hover:text-primary-300">
              <ArrowLeft className="h-4 w-4" />
              Voltar para cifras
            </Link>
            <div className="max-w-xl">
              <h1 className="text-4xl font-bold leading-tight text-primary-500 sm:text-5xl">{config.heading}</h1>
              <p className="mt-3 text-base text-white/85 sm:text-lg">Os 480 hinos do Hinário CCB para estudar e tocar no {instrument === 'teclado' ? 'teclado' : instrument}.</p>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-white">Hinário CCB para {instrument === 'violao' ? 'Violão' : instrument === 'ukulele' ? 'Ukulele' : 'Teclado'}</h2>
              <p className="mt-1 text-text-muted">Selecione um hino para {instrument === 'violao' ? 'abrir a cifra' : 'acompanhar as cifras deste instrumento'}.</p>
            </div>
            {!isLoading && <span className="text-sm text-primary-300">{displayItems.length} hinos</span>}
          </div>

          <section className="mb-6 overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-primary-400" />
              <div className="min-w-0 flex-1">
                <label htmlFor={`hymn-search-${instrument}`} className="sr-only">Buscar hino</label>
                <input
                  id={`hymn-search-${instrument}`}
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Digite o número ou nome do hino"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
                />
              </div>
            </div>
            {searchTerm.trim() ? (
              <div className="border-t border-gray-700/80">
                {searchResults.length > 0 ? searchResults.map((item) => {
                  const number = getHymnNumber(item.title);
                  const publishedItem = items.find((published) => getHymnNumber(published.title) === number);
                  const hasPublishedVersion = Boolean(publishedItem);
                  const href = buildCifraUrl(instrument, publishedItem?.slug || item.slug);
                  const label = getHymnName(item.title);

                  return hasPublishedVersion ? (
                    <Link key={item.id} to={href} className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.05]" onClick={() => setSearchTerm('')}>
                      <span className="w-10 font-mono text-sm text-primary-300">{String(number).padStart(2, '0')}</span>
                      <span className="min-w-0 flex-1 truncate font-medium text-white">{label}</span>
                      <RowIcon className="h-5 w-5 shrink-0 text-primary-300" />
                    </Link>
                  ) : (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 text-left">
                      <span className="w-10 font-mono text-sm text-primary-300">{String(number).padStart(2, '0')}</span>
                      <span className="min-w-0 flex-1 truncate font-medium text-white/70">{label}</span>
                      <span className="text-xs text-gray-500">Em preparação</span>
                    </div>
                  );
                }) : <p className="px-4 py-3 text-sm text-gray-400">Nenhum hino encontrado.</p>}
              </div>
            ) : null}
          </section>

          {isLoading ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-background-secondary">
              {Array.from({ length: 12 }).map((_, index) => <div key={index} className="h-[68px] border-b border-white/10 bg-white/[0.03] animate-pulse last:border-b-0" />)}
            </div>
          ) : displayItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-background-secondary p-6 text-text-muted">Ainda não foi possível carregar a lista do Hinário.</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-background-secondary">
              {displayItems.map((item, index) => {
                const number = getHymnNumber(item.title);
                const name = getHymnName(item.title);
                const publishedItem = items.find((published) => getHymnNumber(published.title) === number);
                const hasPublishedVersion = Boolean(publishedItem);
                const href = buildCifraUrl(instrument, publishedItem?.slug || item.slug);

                return (
                  <article key={item.id} className="group flex min-h-[68px] items-center border-b border-white/10 last:border-b-0 hover:bg-white/[0.04]">
                    <span className="w-16 shrink-0 px-4 text-right font-mono text-sm text-primary-300 sm:w-20 sm:px-5">
                      {String(number ?? index + 1).padStart(2, '0')}
                    </span>
                    {hasPublishedVersion ? (
                      <Link to={href} className="min-w-0 flex-1 py-4 pr-4 text-base font-medium text-white transition-colors hover:text-primary-300 sm:text-lg">
                        {name === item.title && number !== null ? `Hino ${number}` : name}
                      </Link>
                    ) : (
                      <span className="min-w-0 flex-1 py-4 pr-4 text-base font-medium text-white/80 sm:text-lg">{name === item.title && number !== null ? `Hino ${number}` : name}</span>
                    )}
                    {hasPublishedVersion ? (
                      <Link to={href} aria-label={`Abrir cifra de ${instrument}: ${item.title}`} title={`Abrir cifra de ${instrument}`} className="mr-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/65 transition-colors group-hover:bg-primary-500/15 group-hover:text-primary-300 sm:mr-4">
                        <RowIcon className="h-5 w-5" />
                      </Link>
                    ) : (
                      <span title="Cifra em preparação" className="mr-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/30 sm:mr-4">
                        <RowIcon className="h-5 w-5" />
                      </span>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <SEOHead
        title={config.title}
        description={config.description}
        keywords={config.keywords}
        canonical={config.path}
        schemaData={schemaData}
        noindex={!isLoading && items.length === 0}
      />

      <div className="bg-gradient-to-b from-primary-700/25 to-transparent px-4 pt-16 pb-8 sm:px-6 sm:pt-20">
        <div className="max-w-6xl mx-auto">
          <Link to="/cifras" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar para cifras
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center sm:w-14 sm:h-14">
              <Icon className="w-7 h-7 text-primary-300" />
            </div>
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{config.heading}</h1>
              <p className="text-white/85 text-base md:text-lg mt-3">{config.intro}</p>
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-5 text-sm text-white/75">
                <span>{items.length} cifras encontradas</span>
                <span>Cluster especifico por instrumento</span>
                <span>Links diretos para as paginas de cifra</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.5fr,0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-semibold text-white">Cifras publicadas</h2>
                <p className="text-text-muted mt-1">Hub de descoberta por instrumento para reforcar cobertura organica de cifras.</p>
              </div>
              <Icon className="w-6 h-6 text-primary-400" />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-text-muted">
                Ainda nao ha cifras publicadas para este instrumento.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-primary-500/30 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold">
                          <Link to={buildCifraUrl(item.instrument, item.slug)} className="hover:text-primary-400 transition-colors">
                            {item.title}
                          </Link>
                        </h3>
                        <p className="text-text-muted text-sm mt-1">
                          {item.artist || 'Artista CCB'}{item.original_key ? ` • Tom ${item.original_key}` : ''}
                        </p>
                      </div>
                      <Link
                        to={buildCifraUrl(item.instrument, item.slug)}
                        className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-primary-500/40 hover:bg-primary-500/15 hover:text-primary-300"
                        aria-label={`Ver cifra ${item.title}`}
                        title="Ver cifra"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Rotas relacionadas</h2>
              <div className="space-y-3">
                <Link to="/cifras-hinos-ccb" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:border-primary-500/30 transition-colors">
                  <span>Cifras de Hinos CCB</span>
                  <Icon className="w-4 h-4 text-primary-400" />
                </Link>
                <Link to="/cifras" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:border-primary-500/30 transition-colors">
                  <span>Ver todas as cifras</span>
                  <Disc className="w-4 h-4 text-primary-400" />
                </Link>
                <Link to="/hinos-ccb" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:border-primary-500/30 transition-colors">
                  <span>Hinos CCB</span>
                  <Music4 className="w-4 h-4 text-primary-400" />
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Por que este hub importa</h2>
              <ul className="space-y-3 text-sm text-text-muted">
                <li>Cria uma URL especifica para o instrumento buscado.</li>
                <li>Ajuda a captar buscas como cifra violao CCB, ukulele CCB e teclado CCB.</li>
                <li>Distribui autoridade para as paginas individuais de cifra.</li>
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
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CifraInstrumentHubPage;
