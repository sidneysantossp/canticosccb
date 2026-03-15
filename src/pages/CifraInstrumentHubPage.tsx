import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Disc, Music2, Music4 } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { type Cifra } from '@/api/cifras';
import { fetchMergedPublicCifrasList, type PublicCifraPageData } from '@/lib/cifras-v2';
import { generateBreadcrumbSchema, generateCifraSchema, generateFAQSchema, generateItemListSchema } from '@/utils/schemaGenerator';

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
    path: '/cifras-violao-ccb',
    heading: 'Cifras de Violao CCB',
    title: 'Cifras de Violao CCB | Hinos com Acordes para Violao',
    description: 'Veja cifras de hinos da CCB para violao, com acordes, tom original e links para repertorio relacionado.',
    intro: 'Hub de cifras de violao da CCB com repertorio especifico para quem busca acordes, tom original e navegacao por hino.',
    keywords: 'cifras violao ccb, cifra violao hinos ccb, acordes ccb violao, cifras congregacao cristã violao',
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
    path: '/cifras-ukulele-ccb',
    heading: 'Cifras de Ukulele CCB',
    title: 'Cifras de Ukulele CCB | Hinos com Acordes para Ukulele',
    description: 'Acesse cifras de hinos da CCB para ukulele, com links para acordes, tom e repertorio relacionado.',
    intro: 'Hub dedicado a cifras de ukulele da CCB, pensado para buscas especificas por instrumento e navegacao rapida por repertorio.',
    keywords: 'cifras ukulele ccb, cifra ukulele hinos ccb, acordes ukulele ccb',
    icon: Music2,
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
    path: '/cifras-teclado-ccb',
    heading: 'Cifras de Teclado CCB',
    title: 'Cifras de Teclado CCB | Hinos com Acordes para Teclado',
    description: 'Explore cifras de hinos da CCB para teclado, com tom original, repertorio relacionado e links para cada cifra.',
    intro: 'Pagina focada em cifras de teclado da CCB para atender buscas especificas por instrumento e reforcar a navegacao por repertorio musical.',
    keywords: 'cifras teclado ccb, cifra teclado hinos ccb, acordes teclado ccb',
    icon: Disc,
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

const CifraInstrumentHubPage: React.FC<CifraInstrumentHubPageProps> = ({ instrument }) => {
  const config = HUBS[instrument];
  const Icon = config.icon;
  const [items, setItems] = useState<DisplayCifra[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchMergedPublicCifrasList();
        if (!cancelled) {
          setItems(data.filter((item) => item.instrument === instrument));
        }
      } catch (error) {
        console.error(`Erro ao carregar cifras de ${instrument}:`, error);
        if (!cancelled) setItems([]);
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
        url: `/cifra/${item.slug}`,
        position: index + 1,
      })),
    }),
    generateFAQSchema(config.faq),
    ...items.slice(0, 20).map((item) => generateCifraSchema({
      name: item.title,
      url: `/cifra/${item.slug}`,
      artist: item.artist,
      description: item.content?.slice(0, 180),
      image: item.cover_url || undefined,
      musicalKey: item.original_key,
      instrument: instrument,
    })),
  ]), [config, instrument, items]);

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
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h3 className="text-white font-semibold">
                          <Link to={`/cifra/${item.slug}`} className="hover:text-primary-400 transition-colors">
                            {item.title}
                          </Link>
                        </h3>
                        <p className="text-text-muted text-sm mt-1">
                          {item.artist || 'Artista CCB'}{item.original_key ? ` • Tom ${item.original_key}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/cifra/${item.slug}`}
                          className="inline-flex w-full justify-center px-3 py-2 rounded-full bg-primary-500 text-black text-sm font-semibold hover:bg-primary-400 transition-colors sm:w-auto"
                        >
                          Ver cifra
                        </Link>
                      </div>
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
