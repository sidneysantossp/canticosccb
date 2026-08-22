import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Headphones, Music4 } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { fetchHinarioList, type HinarioHymn } from '@/api/hinario';
import { supabaseFetch } from '@/lib/supabaseRest';
import { HINARIO_RANGES, filterItemsByHinarioRange } from '@/lib/hinarioRanges';
import { generateBreadcrumbSchema, generateFAQSchema, generateItemListSchema } from '@/utils/schemaGenerator';
import { buildHinoUrl } from '@/utils/slugUrl';

type PublicHymn = {
  id: string;
  numero: number;
  titulo: string;
  compositor_nome: string;
  categoria?: string;
};

const faq = [
  {
    question: 'Onde encontrar hinos CCB com letra e audio?',
    answer: 'Nesta pagina voce encontra o caminho mais amplo para o repertorio da plataforma: Hinario 5, letras, paginas de audio, cifras e hubs especificos por tipo de hino.',
  },
  {
    question: 'Os hinos CCB estao organizados por numero?',
    answer: 'Sim. O hub leva para o Hinario por numero e tambem para as paginas individuais de hinos publicados com audio, compositor e repertorio relacionado.',
  },
  {
    question: 'Posso encontrar hinos cantados, tocados e avulsos aqui?',
    answer: 'Sim. Esta landing distribui a navegacao para hubs especificos de hinos cantados, tocados e avulsos, alem do Hinario e das cifras.',
  },
];

const relatedLinks = [
  { label: 'Hinario 5 CCB', href: '/hinario-5-ccb' },
  { label: 'Letras dos Hinos', href: '/letras-hinos-ccb' },
  { label: 'Hinos Cantados', href: '/hinos-cantados-ccb' },
  { label: 'Hinos Tocados', href: '/hinos-tocados-ccb' },
  { label: 'Hinos Avulsos', href: '/hinos-avulsos-ccb' },
  { label: 'Cifras de Hinos CCB', href: '/cifras-hinos-ccb' },
];

const HinosHubPage: React.FC = () => {
  const [hinarioItems, setHinarioItems] = useState<HinarioHymn[]>([]);
  const [publishedHymns, setPublishedHymns] = useState<PublicHymn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const [hinario, hymns] = await Promise.all([
          fetchHinarioList({ is_active: true, limit: 500 }),
          supabaseFetch<any>('hinos', {
            or: '(ativo.eq.true,ativo.eq.1)',
            select: 'id,numero,titulo,compositor_nome,categoria',
            order: 'numero.asc',
            limit: '500',
          }),
        ]);

        if (cancelled) return;

        setHinarioItems(hinario.sort((a, b) => a.numero - b.numero));
        setPublishedHymns(
          hymns.map((item) => ({
            id: String(item.id),
            numero: Number(item.numero || 0),
            titulo: String(item.titulo || 'Hino CCB'),
            compositor_nome: String(item.compositor_nome || 'Compositor CCB'),
            categoria: item.categoria || undefined,
          }))
        );
      } catch (error) {
        console.error('Erro ao carregar hub amplo de hinos:', error);
        if (!cancelled) {
          setHinarioItems([]);
          setPublishedHymns([]);
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

  const rangeSummaries = useMemo(() => {
    return HINARIO_RANGES.map((range) => ({
      ...range,
      count: filterItemsByHinarioRange(hinarioItems, range).length,
    }));
  }, [hinarioItems]);

  const schemaData = useMemo(() => ([
    generateBreadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Hinos CCB', url: '/hinos-ccb' },
    ]),
    generateItemListSchema({
      name: 'Hinos CCB',
      description: 'Hub amplo para quem procura hinos da CCB com letra, audio, Hinario 5 e repertorio relacionado.',
      url: '/hinos-ccb',
      items: hinarioItems.slice(0, 180).map((item, index) => ({
        name: `Hino ${item.numero} CCB - ${item.titulo}`,
        url: `/hinario/${item.numero}`,
        position: index + 1,
      })),
    }),
    generateFAQSchema(faq),
  ]), [hinarioItems]);

  return (
    <div className="min-h-screen bg-background-primary">
      <SEOHead
        title="Hinos CCB | Ouvir Hinos, Letras do Hinario 5 e Cifras"
        description="Explore hinos CCB com letras do Hinario 5, paginas para ouvir, cifras, albuns e hubs tematicos da comunidade CCB."
        keywords="hinos ccb, ouvir hinos ccb, letras dos hinos ccb, hinario 5 ccb, hinos comunidade CCB"
        canonical="/hinos-ccb"
        schemaData={schemaData}
        noindex={!isLoading && hinarioItems.length === 0 && publishedHymns.length === 0}
      />

      <div className="bg-gradient-to-b from-primary-900/20 to-background-primary pt-20 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Music4 className="w-7 h-7 text-primary-300" />
            </div>
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">Hinos CCB</h1>
              <p className="text-white/85 text-base md:text-lg mt-3">
                Landing ampla para quem procura hinos da CCB com letra, audio, Hinario 5, cifras, albuns e navegacao por repertorio da comunidade CCB.
              </p>
              <div className="flex flex-wrap gap-4 mt-5 text-sm text-white/75">
                <span>{hinarioItems.length} hinos com letra publicados</span>
                <span>{publishedHymns.length} paginas de hinos com audio ou repertorio</span>
                <span>Cluster principal para busca generica por hinos CCB</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                {relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="inline-flex items-center rounded-full border border-white/10 bg-background-secondary px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,0.95fr]">
          <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-semibold text-white">Navegacao pelo Hinario</h2>
                <p className="text-text-muted mt-1">
                  Atalhos indexaveis para numeros do Hinario 5, reforcando buscas como hino 1 CCB, hino 85 CCB letra e hino 480 CCB.
                </p>
              </div>
              <BookOpen className="w-6 h-6 text-primary-400" />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {Array.from({ length: 40 }).map((_, index) => (
                  <div key={index} className="h-12 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : hinarioItems.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-text-muted">
                Nenhum hino com letra foi publicado ainda no Hinario.
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-6">
                  {rangeSummaries.map((range) => (
                    <Link
                      key={range.key}
                      to={range.path}
                      className="rounded-2xl border border-white/10 bg-background-primary p-4 transition-colors hover:border-primary-500/40"
                    >
                      <p className="text-primary-400 text-sm font-semibold">{range.label}</p>
                      <p className="text-white font-medium mt-2">Faixa {range.shortLabel}</p>
                      <p className="text-text-muted text-sm mt-2">{range.count} hinos publicados nesta faixa</p>
                    </Link>
                  ))}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {hinarioItems.slice(0, 120).map((item) => (
                    <Link
                      key={item.id}
                      to={`/hinario/${item.numero}`}
                      className="rounded-xl border border-white/10 bg-background-primary px-3 py-3 text-center text-sm font-semibold text-white transition-colors hover:border-primary-500/40 hover:text-primary-300"
                    >
                      {item.numero}
                    </Link>
                  ))}
                </div>
                <div className="mt-4">
                  <Link
                    to="/hinario"
                    className="inline-flex items-center rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-primary-400"
                  >
                    Abrir Hinario completo
                  </Link>
                </div>
              </>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Rotas principais</h2>
              <div className="space-y-3">
                {relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors hover:border-primary-500/30"
                  >
                    <span>{link.label}</span>
                    <Headphones className="w-4 h-4 text-primary-400" />
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Perguntas frequentes</h2>
              <div className="space-y-4">
                {faq.map((item) => (
                  <div key={item.question}>
                    <h3 className="text-white font-medium">{item.question}</h3>
                    <p className="text-text-muted text-sm mt-1">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-background-secondary p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-semibold text-white">Hinos publicados para ouvir</h2>
              <p className="text-text-muted mt-1">
                Lista de paginas canonicas de hino para fortalecer buscas amplas por hinos CCB, repertorio e compositores.
              </p>
            </div>
            <Headphones className="w-6 h-6 text-primary-400" />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : publishedHymns.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-text-muted">
              Ainda nao ha paginas de hinos publicadas para este hub.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {publishedHymns.slice(0, 36).map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-background-primary p-4 transition-colors hover:border-primary-500/40">
                  <p className="text-primary-400 text-sm font-semibold">
                    {item.numero > 0 ? `Hino ${item.numero}` : 'Hino CCB'}
                  </p>
                  <h3 className="text-white font-medium mt-1 line-clamp-2">
                    <Link to={buildHinoUrl(item.id, item.titulo, item.numero)} className="hover:text-primary-300 transition-colors">
                      {item.titulo}
                    </Link>
                  </h3>
                  <p className="text-text-muted text-sm mt-2 line-clamp-1">{item.compositor_nome}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link
                      to={buildHinoUrl(item.id, item.titulo, item.numero)}
                      className="inline-flex items-center rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-300 transition-colors hover:bg-primary-500/20"
                    >
                      Ver pagina do hino
                    </Link>
                    {item.numero > 0 ? (
                      <Link
                        to={`/hinario/${item.numero}`}
                        className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 transition-colors hover:border-primary-500/30 hover:text-white"
                      >
                        Ver letra
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HinosHubPage;
