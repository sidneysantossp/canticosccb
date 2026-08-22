import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Disc, Music2, Music4 } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { type Cifra } from '@/api/cifras';
import { fetchMergedPublicCifrasList, type PublicCifraPageData } from '@/lib/cifras-v2';
import { generateBreadcrumbSchema, generateFAQSchema, generateItemListSchema } from '@/utils/schemaGenerator';

type DisplayCifra = Cifra | PublicCifraPageData;

const faq = [
  {
    question: 'Onde encontrar cifras de hinos CCB?',
    answer: 'Nesta landing voce encontra o caminho mais amplo para cifras de hinos CCB, com links para a listagem geral, hubs por instrumento e paginas individuais de cifra.',
  },
  {
    question: 'Existem cifras por instrumento na plataforma?',
    answer: 'Sim. O hub distribui a navegacao para cifras de violao, ukulele e teclado, alem de listar as cifras ativas ja publicadas.',
  },
  {
    question: 'As cifras se conectam aos hinos e ao Hinario?',
    answer: 'Sempre que houver relacao de repertorio, as cifras reforcam a navegacao interna para paginas de hinos, letras do Hinario e outras areas relevantes do site.',
  },
];

const relatedLinks = [
  { label: 'Ver todas as cifras', href: '/cifras' },
  { label: 'Cifras de Violao', href: '/cifras-violao-ccb' },
  { label: 'Cifras de Ukulele', href: '/cifras-ukulele-ccb' },
  { label: 'Cifras de Teclado', href: '/cifras-teclado-ccb' },
  { label: 'Hinos CCB', href: '/hinos-ccb' },
];

const iconByInstrument: Record<string, React.ComponentType<{ className?: string }>> = {
  violao: Music4,
  ukulele: Music2,
  teclado: Disc,
};

const labelByInstrument: Record<string, string> = {
  violao: 'Violao',
  ukulele: 'Ukulele',
  teclado: 'Teclado',
};

const hubHrefByInstrument: Record<string, string> = {
  violao: '/cifras-violao-ccb',
  ukulele: '/cifras-ukulele-ccb',
  teclado: '/cifras-teclado-ccb',
};

const CifrasHubPage: React.FC = () => {
  const [items, setItems] = useState<DisplayCifra[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchMergedPublicCifrasList();
        if (!cancelled) {
          setItems(data);
        }
      } catch (error) {
        console.error('Erro ao carregar hub amplo de cifras:', error);
        if (!cancelled) {
          setItems([]);
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

  const instrumentCounts = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = String(item.instrument || 'outros');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [items]);

  const schemaData = useMemo(() => ([
    generateBreadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Cifras de Hinos CCB', url: '/cifras-hinos-ccb' },
    ]),
    generateItemListSchema({
      name: 'Cifras de Hinos CCB',
      description: 'Hub amplo para quem procura cifras de hinos da CCB com links por instrumento e paginas individuais.',
      url: '/cifras-hinos-ccb',
      items: items.slice(0, 180).map((item, index) => ({
        name: item.title,
        url: `/cifra/${item.slug}`,
        position: index + 1,
      })),
    }),
    generateFAQSchema(faq),
  ]), [items]);

  return (
    <div className="min-h-screen bg-background-primary">
      <SEOHead
        title="Cifras Hinos CCB | Cifras da comunidade CCB"
        description="Explore cifras de hinos CCB com links para violao, ukulele, teclado e paginas individuais de cifra da comunidade CCB."
        keywords="cifras hinos ccb, cifras ccb, cifra hino ccb, cifras violao ccb, cifras teclado ccb, cifras ukulele ccb"
        canonical="/cifras-hinos-ccb"
        schemaData={schemaData}
        noindex={!isLoading && items.length === 0}
      />

      <div className="bg-gradient-to-b from-primary-700/25 to-transparent px-4 pt-16 pb-8 sm:px-6 sm:pt-20">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center sm:w-14 sm:h-14">
              <Music4 className="w-7 h-7 text-primary-300" />
            </div>
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">Cifras Hinos CCB</h1>
              <p className="text-white/85 text-base md:text-lg mt-3">
                Hub amplo para buscas por cifras de hinos CCB, com atalhos para instrumentos, paginas individuais de cifra e conexao com o repertorio principal da plataforma.
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-5 text-sm text-white/75">
                <span>{items.length} cifras ativas publicadas</span>
                <span>Cluster principal para busca generica por cifras CCB</span>
                <span>Links por instrumento e repertorio</span>
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

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,0.95fr]">
          <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-semibold text-white">Cifras publicadas</h2>
                <p className="text-text-muted mt-1">
                  Lista indexavel de cifras para buscas amplas por cifras de hinos CCB, conectando o usuario a paginas canonicas e hubs por instrumento.
                </p>
              </div>
              <Music4 className="w-6 h-6 text-primary-400" />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-text-muted">
                Nenhuma cifra foi publicada ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {items.slice(0, 60).map((item) => (
                  <article key={item.id} className="rounded-2xl border border-white/10 bg-background-primary p-4 transition-colors hover:border-primary-500/40">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="text-primary-400 text-sm font-medium">
                          {labelByInstrument[item.instrument] || 'Cifra CCB'}
                        </p>
                        <h3 className="text-white font-semibold mt-1">
                          <Link to={`/cifra/${item.slug}`} className="hover:text-primary-300 transition-colors">
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
                          className="inline-flex w-full justify-center px-3 py-2 rounded-full bg-primary-500 text-black text-sm font-semibold transition-colors hover:bg-primary-400 sm:w-auto"
                        >
                          Ver cifra
                        </Link>
                        <Link
                          to={hubHrefByInstrument[item.instrument] || '/cifras'}
                          className="inline-flex w-full justify-center px-3 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-white/85 transition-colors hover:border-primary-500/30 hover:text-white sm:w-auto"
                        >
                          Mais do instrumento
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
              <h2 className="text-xl font-semibold text-white mb-3">Instrumentos com cobertura</h2>
              <div className="space-y-3">
                {relatedLinks.slice(1, 4).map((link) => {
                  const instrumentKey = link.href.replace('/cifras-', '').replace('-ccb', '');
                  const Icon = iconByInstrument[instrumentKey] || Music4;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors hover:border-primary-500/30"
                    >
                      <span>
                        {link.label}
                        <span className="block text-xs text-text-muted mt-1">
                          {instrumentCounts[instrumentKey] || 0} cifras publicadas
                        </span>
                      </span>
                      <Icon className="w-4 h-4 text-primary-400" />
                    </Link>
                  );
                })}
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
      </div>
    </div>
  );
};

export default CifrasHubPage;
