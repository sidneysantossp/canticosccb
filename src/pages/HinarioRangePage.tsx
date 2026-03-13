import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Headphones, ListMusic } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { fetchHinarioList, type HinarioHymn } from '@/api/hinario';
import { generateBreadcrumbSchema, generateFAQSchema, generateItemListSchema } from '@/utils/schemaGenerator';
import { HINARIO_RANGES, filterItemsByHinarioRange, getHinarioRangeByKey, type HinarioRangeKey } from '@/lib/hinarioRanges';

interface HinarioRangePageProps {
  rangeKey: HinarioRangeKey;
}

const HinarioRangePage: React.FC<HinarioRangePageProps> = ({ rangeKey }) => {
  const range = getHinarioRangeByKey(rangeKey);
  const [items, setItems] = useState<HinarioHymn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const allItems = await fetchHinarioList({ is_active: true });
        if (!cancelled) {
          setItems(filterItemsByHinarioRange(allItems, range).sort((a, b) => a.numero - b.numero));
        }
      } catch (error) {
        console.error(`Erro ao carregar faixa ${range.label}:`, error);
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
  }, [range]);

  const faq = useMemo(() => ([
    {
      question: `Onde encontrar os hinos ${range.shortLabel} CCB com letra?`,
      answer: `Nesta página você encontra a faixa ${range.shortLabel} do Hinário CCB com links diretos para as letras publicadas e navegação por número.`,
    },
    {
      question: `Essa faixa ${range.shortLabel} também leva para áudio e cifra?`,
      answer: 'Sim. As páginas individuais do hinário se conectam aos hinos com áudio, às cifras relacionadas e aos hubs estratégicos do repertório.',
    },
  ]), [range]);

  const schemaData = useMemo(() => ([
    generateBreadcrumbSchema([
      { name: 'Início', url: '/' },
      { name: 'Hinário', url: '/hinario' },
      { name: range.label, url: range.path },
    ]),
    generateItemListSchema({
      name: range.label,
      description: `Faixa ${range.shortLabel} do Hinário CCB com letras publicadas e links por número.`,
      url: range.path,
      items: items.slice(0, 180).map((item, index) => ({
        name: `Hino ${item.numero} CCB - ${item.titulo}`,
        url: `/hinario/${item.numero}`,
        position: index + 1,
      })),
    }),
    generateFAQSchema(faq),
  ]), [faq, items, range]);

  const otherRanges = HINARIO_RANGES.filter((item) => item.key !== range.key);

  return (
    <div className="min-h-screen bg-background-primary">
      <SEOHead
        title={`${range.label} | Letras do Hinário CCB`}
        description={`Acesse os ${range.label.toLowerCase()} com letras publicadas, navegação por número e links para ouvir hinos e explorar cifras relacionadas.`}
        keywords={`${range.label.toLowerCase()}, letra hino ccb, hinos ccb com letra, hinário 5 ccb`}
        canonical={range.path}
        schemaData={schemaData}
        noindex={!isLoading && items.length === 0}
      />

      <div className="bg-gradient-to-b from-primary-900/20 to-background-primary pt-20 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-primary-300" />
            </div>
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{range.label}</h1>
              <p className="text-white/85 text-base md:text-lg mt-3">
                Faixa programática do Hinário CCB para buscas por número, cobrindo os hinos {range.shortLabel} com letras publicadas, contexto editorial e links para ouvir e estudar.
              </p>
              <div className="flex flex-wrap gap-4 mt-5 text-sm text-white/75">
                <span>{items.length} hinos publicados nesta faixa</span>
                <span>Cluster específico para busca por número</span>
                <span>Ligação com áudio, cifras e hubs do hinário</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                <Link
                  to="/hinario"
                  className="inline-flex items-center rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-sm text-primary-300 transition-colors hover:bg-primary-500/20"
                >
                  Abrir Hinário completo
                </Link>
                <Link
                  to="/letras-hinos-ccb"
                  className="inline-flex items-center rounded-full border border-white/10 bg-background-secondary px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white"
                >
                  Letras dos Hinos
                </Link>
                <Link
                  to="/hinos-ccb"
                  className="inline-flex items-center rounded-full border border-white/10 bg-background-secondary px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white"
                >
                  Hinos CCB
                </Link>
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
                <h2 className="text-2xl font-semibold text-white">Números desta faixa</h2>
                <p className="text-text-muted mt-1">
                  Navegação direta pelos hinos {range.shortLabel}, com links canônicos para as letras publicadas desta faixa do Hinário CCB.
                </p>
              </div>
              <ListMusic className="w-6 h-6 text-primary-400" />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {Array.from({ length: 30 }).map((_, index) => (
                  <div key={index} className="h-12 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-text-muted">
                Nenhum hino publicado foi encontrado para esta faixa.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      to={`/hinario/${item.numero}`}
                      className="rounded-xl border border-white/10 bg-background-primary px-3 py-3 text-center text-sm font-semibold text-white transition-colors hover:border-primary-500/40 hover:text-primary-300"
                    >
                      {item.numero}
                    </Link>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mt-6">
                  {items.slice(0, 18).map((item) => (
                    <Link
                      key={`featured-${item.id}`}
                      to={`/hinario/${item.numero}`}
                      className="rounded-2xl border border-white/10 bg-background-primary p-4 transition-colors hover:border-primary-500/40"
                    >
                      <p className="text-primary-400 text-sm font-semibold">Hino {item.numero}</p>
                      <h3 className="text-white font-medium mt-1 line-clamp-2">{item.titulo}</h3>
                      {item.subtitulo ? (
                        <p className="text-text-muted text-sm mt-2 line-clamp-2">{item.subtitulo}</p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Outras faixas do hinário</h2>
              <div className="space-y-3">
                {otherRanges.map((item) => (
                  <Link
                    key={item.key}
                    to={item.path}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors hover:border-primary-500/30"
                  >
                    <span>{item.label}</span>
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
      </div>
    </div>
  );
};

export default HinarioRangePage;
