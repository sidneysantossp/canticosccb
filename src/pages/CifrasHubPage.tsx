import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Keyboard, Music2, Music4 } from 'lucide-react';
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

const labelByInstrument: Record<string, string> = {
  violao: 'Violao',
  ukulele: 'Ukulele',
  teclado: 'Teclado',
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
        <div>
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
                    <div className="flex items-center gap-4">
                      <Link
                        to={`/cifra/${item.slug}`}
                        aria-label={`Abrir cifra de ${item.title}`}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary-300 transition-colors hover:border-primary-500/50 hover:bg-primary-500/10"
                      >
                        <Music4 className="h-6 w-6" />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <p className="text-primary-400 text-xs font-medium uppercase tracking-wide">
                          {labelByInstrument[item.instrument] || 'Cifra CCB'}
                        </p>
                        <h3 className="truncate text-white font-semibold mt-1">
                          <Link to={`/cifra/${item.slug}`} className="hover:text-primary-300 transition-colors">
                            {item.title}
                          </Link>
                        </h3>
                        <p className="truncate text-text-muted text-sm mt-1">
                          {item.artist || 'Artista CCB'}{item.original_key ? ` • Tom ${item.original_key}` : ''}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 sm:gap-2" aria-label="Instrumentos disponíveis em breve">
                        {[
                          { key: 'violao', label: 'Violão', Icon: Music4 },
                          { key: 'ukulele', label: 'Ukulele', Icon: Music2 },
                          { key: 'teclado', label: 'Teclado', Icon: Keyboard },
                        ].map(({ key, label, Icon }) => (
                          <button
                            key={key}
                            type="button"
                            disabled
                            title={`${label}: página em cadastro`}
                            aria-label={`${label}: página em cadastro`}
                            className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/35 opacity-70"
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default CifrasHubPage;
