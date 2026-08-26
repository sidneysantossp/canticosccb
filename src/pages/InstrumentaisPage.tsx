import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Disc3, Music2, Music4 } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { type Cifra } from '@/api/cifras';
import { fetchMergedPublicCifrasList, type PublicCifraPageData } from '@/lib/cifras-v2';
import { supabaseFetch } from '@/lib/supabaseRest';
import { generateBreadcrumbSchema, generateFAQSchema, generateItemListSchema } from '@/utils/schemaGenerator';
import { buildHinoUrl } from '@/utils/slugUrl';

type DisplayCifra = Cifra | PublicCifraPageData;

type HymnItem = {
  id: string;
  numero: number;
  titulo: string;
  compositor_nome: string;
  categoria?: string;
};

const instrumentFaq = [
  {
    question: 'Onde encontrar hinos instrumentais CCB?',
    answer: 'Esta pagina concentra o hub de instrumentais da plataforma, com links para hinos tocados, cifras por instrumento e repertorio relacionado.',
  },
  {
    question: 'A pagina de instrumentais mostra cifras por instrumento?',
    answer: 'Sim. O hub distribui a navegacao para cifras de violao, ukulele e teclado, alem de repertorio instrumental publicado.',
  },
  {
    question: 'Qual a diferenca entre instrumentais e hinos tocados?',
    answer: 'Instrumentais funciona como hub tematico mais amplo. Hinos Tocados e a pagina focada no repertorio instrumental publicado e navegavel.',
  },
];

const normalizeText = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const instrumentLinks = [
  {
    title: 'Cifras de Violao',
    description: 'Acordes e cifras para repertorio da CCB no violao.',
    href: '/cifras-violao-ccb',
    icon: Music4,
  },
  {
    title: 'Cifras de Ukulele',
    description: 'Cluster especifico para cifras de ukulele da CCB.',
    href: '/cifras-ukulele-ccb',
    icon: Disc3,
  },
  {
    title: 'Cifras de Teclado',
    description: 'Repertorio de teclado com links para cifras e tom.',
    href: '/cifras-teclado-ccb',
    icon: Music2,
  },
];

const InstrumentaisPage: React.FC = () => {
  const [hymns, setHymns] = useState<HymnItem[]>([]);
  const [cifras, setCifras] = useState<DisplayCifra[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const [hinoRows, cifraRows] = await Promise.all([
          supabaseFetch<any>('hinos', {
            select: 'id,numero,titulo,compositor_nome,categoria',
            or: '(ativo.eq.true,ativo.eq.1)',
            order: 'numero.asc',
            limit: '800',
          }),
          fetchMergedPublicCifrasList(),
        ]);

        const filteredHymns = hinoRows
          .filter((row) => {
            const category = normalizeText(row.categoria || '');
            return category.includes('tocado') || category.includes('instrument');
          })
          .map((row) => ({
            id: String(row.id),
            numero: Number(row.numero || 0),
            titulo: String(row.titulo || 'Hino'),
            compositor_nome: String(row.compositor_nome || 'Compositor CCB'),
            categoria: row.categoria || undefined,
          }))
          .sort((a, b) => {
            if (a.numero > 0 && b.numero > 0) return a.numero - b.numero;
            if (a.numero > 0) return -1;
            if (b.numero > 0) return 1;
            return a.titulo.localeCompare(b.titulo, 'pt-BR');
          });

        if (!cancelled) {
          setHymns(filteredHymns);
          setCifras(cifraRows);
        }
      } catch (error) {
        console.error('Erro ao carregar hub de instrumentais:', error);
        if (!cancelled) {
          setHymns([]);
          setCifras([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const instrumentCounts = useMemo(() => ({
    violao: cifras.filter((item) => item.instrument === 'violao').length,
    ukulele: cifras.filter((item) => item.instrument === 'ukulele').length,
    teclado: cifras.filter((item) => item.instrument === 'teclado').length,
  }), [cifras]);

  const schemaData = useMemo(() => ([
    generateBreadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Instrumentais', url: '/instrumentais' },
    ]),
    generateItemListSchema({
      name: 'Instrumentais CCB',
      description: 'Hub de hinos instrumentais, hinos tocados e cifras por instrumento da CCB.',
      url: '/instrumentais',
      items: hymns.slice(0, 80).map((item, index) => ({
        name: item.numero > 0 ? `Hino ${item.numero} - ${item.titulo}` : item.titulo,
        url: buildHinoUrl(item.id, item.titulo, item.numero),
        position: index + 1,
      })),
    }),
    generateFAQSchema(instrumentFaq),
  ]), [hymns]);

  return (
    <div className="min-h-screen bg-background-primary">
      <SEOHead
        title="Hinos Instrumentais CCB | Hinos Tocados e Cifras"
        description="Hub de hinos instrumentais CCB com links para hinos tocados, cifras de violao, ukulele e teclado e navegacao por repertorio relacionado."
        keywords="hinos instrumentais ccb, hinos tocados ccb, cifras violao ccb, cifras teclado ccb, cifras ukulele ccb"
        canonical="/instrumentais"
        schemaData={schemaData}
      />

      <div className="-mx-4 bg-gradient-to-b from-primary-600/35 via-primary-950/25 to-background-primary px-4 pt-16 pb-8 sm:-mx-6 sm:px-6 sm:pt-20">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="sm:flex sm:items-center sm:gap-8">
            <div className="mb-6 flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl bg-black/35 shadow-xl sm:mb-0" aria-hidden="true"><div className="h-28 w-28 rounded-full border-4 border-white/10 bg-[radial-gradient(circle_at_center,#19c463_0_13%,#0b1710_14%_20%,#303735_21%_42%,#101513_43%_60%,#343b38_61%_63%,#111514_64%_100%)] shadow-2xl" /></div>
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-200">Playlist pública</p>
              <h1 className="mt-2 text-3xl md:text-5xl font-bold text-white leading-tight">Instrumentais CCB</h1>
              <p className="text-white/85 text-base md:text-lg mt-3">
                Hub publico para buscas por hinos instrumentais, hinos tocados e cifras da comunidade CCB.
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-5 text-sm text-white/75">
                <span>{hymns.length} hinos instrumentais mapeados</span>
                <span>{cifras.length} cifras publicadas</span>
                <span>Links por instrumento e por repertorio</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.45fr,0.95fr]">
          <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-semibold text-white">Hinos tocados e instrumentais</h2>
                <p className="text-text-muted mt-1">
                  Repertorio navegavel para ampliar cobertura organica de hinos instrumentais CCB.
                </p>
              </div>
              <Disc3 className="w-6 h-6 text-primary-400" />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : hymns.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-text-muted">
                Ainda nao ha repertorio instrumental publicado suficiente para listar aqui.
              </div>
            ) : (
              <div className="space-y-3">
                {hymns.slice(0, 24).map((item) => (
                  <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-primary-500/30 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h3 className="text-white font-semibold">
                          <Link to={buildHinoUrl(item.id, item.titulo, item.numero)} className="hover:text-primary-400 transition-colors">
                            {item.numero > 0 ? `Hino ${item.numero} - ${item.titulo}` : item.titulo}
                          </Link>
                        </h3>
                        <p className="text-text-muted text-sm mt-1">
                          {item.compositor_nome}
                          {item.categoria ? ` • ${item.categoria}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={buildHinoUrl(item.id, item.titulo, item.numero)}
                          className="inline-flex w-full justify-center px-3 py-2 rounded-full bg-primary-500 text-black text-sm font-semibold hover:bg-primary-400 transition-colors sm:w-auto"
                        >
                          Ver hino
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
              <h2 className="text-xl font-semibold text-white mb-4">Clusters por instrumento</h2>
              <div className="space-y-3">
                {instrumentLinks.map((link) => {
                  const Icon = link.icon;
                  const countKey = link.href.includes('violao')
                    ? 'violao'
                    : link.href.includes('ukulele')
                      ? 'ukulele'
                      : 'teclado';
                  const count = instrumentCounts[countKey];
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:border-primary-500/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-white font-medium">{link.title}</p>
                        <p className="text-sm text-text-muted">{link.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary-400 ml-auto mb-1" />
                        <p className="text-xs text-white/70">{count} cifras</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Rotas relacionadas</h2>
              <div className="space-y-3 text-sm">
                <Link to="/hinos-tocados-ccb" className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:border-primary-500/30 transition-colors">
                  Hinos Tocados CCB
                </Link>
                <Link to="/cifras" className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:border-primary-500/30 transition-colors">
                  Biblioteca de Cifras
                </Link>
                <Link to="/biblia-narrada" className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:border-primary-500/30 transition-colors">
                  Biblia Narrada
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Perguntas frequentes</h2>
              <div className="space-y-4">
                {instrumentFaq.map((faq) => (
                  <div key={faq.question}>
                    <h3 className="text-white font-medium">{faq.question}</h3>
                    <p className="text-sm text-text-muted mt-1">{faq.answer}</p>
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

export default InstrumentaisPage;
