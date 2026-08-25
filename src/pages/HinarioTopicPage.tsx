import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { fetchHinarioList, HinarioHymn } from '@/api/hinario';
import { HINARIO_RANGES, filterItemsByHinarioRange } from '@/lib/hinarioRanges';
import { generateBreadcrumbSchema, generateFAQSchema, generateItemListSchema } from '@/utils/schemaGenerator';
import { buildHinarioUrl } from '@/utils/hinarioSeo';

type HinarioTopic = 'hinario5' | 'letras';

type TopicConfig = {
  path: string;
  heading: string;
  title: string;
  description: string;
  intro: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  faq: Array<{ question: string; answer: string }>;
};

const TOPICS: Record<HinarioTopic, TopicConfig> = {
  hinario5: {
    path: '/hinario-5-ccb',
    heading: 'Hinário 5 CCB',
    title: 'Hinário 5 CCB | Letras dos Hinos da comunidade CCB',
    description: 'Acesse o Hinário 5 CCB com letras dos hinos, navegação por número e links para ouvir hinos da comunidade CCB.',
    intro: 'Página-hub do Hinário 5 CCB com letras, navegação por número e atalhos para ouvir hinos, explorar cifras e encontrar repertório relacionado.',
    keywords: 'hinário 5 ccb, hinario 5 ccb, hinos ccb, letra dos hinos ccb, hino 1 ccb, hino 480 ccb',
    icon: BookOpen,
    faq: [
      {
        question: 'Onde encontrar o Hinário 5 CCB com letra?',
        answer: 'Nesta página você encontra links para as letras do Hinário 5 CCB, com navegação por número e acesso rápido às páginas individuais de cada hino disponível.',
      },
      {
        question: 'O Hinário 5 CCB também tem áudio?',
        answer: 'Sim. Sempre que houver versão publicada no acervo, a página do hino também oferece caminho para ouvir o áudio correspondente.',
      },
    ],
  },
  letras: {
    path: '/letras-hinos-ccb',
    heading: 'Letras dos Hinos CCB',
    title: 'Letras dos Hinos CCB | Hino 1 ao 480 com Letra',
    description: 'Veja letras dos hinos CCB com navegação por número, título e acesso ao Hinário da comunidade CCB.',
    intro: 'Landing dedicada às letras dos hinos CCB, com foco em buscas por número, título e navegação rápida no repertório do Hinário.',
    keywords: 'letras hinos ccb, letra hino ccb, hino 1 ccb letra, hino 480 ccb letra, hinário ccb completo',
    icon: FileText,
    faq: [
      {
        question: 'Como encontrar a letra de um hino CCB pelo número?',
        answer: 'Use esta página para navegar pelos números do Hinário CCB e abrir diretamente a letra do hino desejado.',
      },
      {
        question: 'As letras dos hinos CCB estão organizadas por número?',
        answer: 'Sim. Os hinos disponíveis são organizados por número e também podem ser acessados pela listagem completa do Hinário.',
      },
    ],
  },
};

interface HinarioTopicPageProps {
  topic: HinarioTopic;
}

const HinarioTopicPage: React.FC<HinarioTopicPageProps> = ({ topic }) => {
  const config = TOPICS[topic];
  const Icon = config.icon;
  const [hymns, setHymns] = useState<HinarioHymn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchHinarioList({ is_active: true });
        if (!cancelled) {
          setHymns(data.sort((a, b) => a.numero - b.numero));
        }
      } catch (error) {
        console.error(`Erro ao carregar ${topic}:`, error);
        if (!cancelled) setHymns([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [topic]);

  const rangeSummaries = useMemo(() => {
    return HINARIO_RANGES.map((range) => ({
      ...range,
      count: filterItemsByHinarioRange(hymns, range).length,
    }));
  }, [hymns]);

  const schemaData = useMemo(() => ([
    generateBreadcrumbSchema([
      { name: 'Início', url: '/' },
      { name: config.heading, url: config.path },
    ]),
    generateItemListSchema({
      name: config.heading,
      description: config.description,
      url: config.path,
      items: hymns.slice(0, 180).map((hymn, index) => ({
        name: `Hino ${hymn.numero} CCB - ${hymn.titulo}`,
        url: buildHinarioUrl(hymn.numero, hymn.titulo),
        position: index + 1,
      })),
    }),
    generateFAQSchema(config.faq),
  ]), [config, hymns]);

  return (
    <div className="min-h-screen bg-background-primary">
      <SEOHead
        title={config.title}
        description={config.description}
        keywords={config.keywords}
        canonical={config.path}
        schemaData={schemaData}
        noindex={!isLoading && hymns.length === 0}
      />

      <div className="bg-gradient-to-b from-primary-900/20 to-background-primary pt-20 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Icon className="w-7 h-7 text-primary-300" />
            </div>
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{config.heading}</h1>
              <p className="text-white/85 text-base md:text-lg mt-3">{config.intro}</p>
              <div className="flex flex-wrap gap-4 mt-5 text-sm text-white/75">
                <span>{hymns.length} hinos com letra publicados</span>
                <span>Navegação por número do Hinário</span>
                <span>Links para ouvir e explorar cifras</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                <Link
                  to="/hinos-ccb"
                  className="inline-flex items-center rounded-full border border-gray-700 bg-background-secondary px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white"
                >
                  Hinos CCB
                </Link>
                <Link
                  to="/hinario"
                  className="inline-flex items-center rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-sm text-primary-300 transition-colors hover:bg-primary-500/20"
                >
                  Abrir Hinário completo
                </Link>
                <Link
                  to="/hinos-cantados-ccb"
                  className="inline-flex items-center rounded-full border border-gray-700 bg-background-secondary px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white"
                >
                  Hinos cantados
                </Link>
                <Link
                  to="/cifras"
                  className="inline-flex items-center rounded-full border border-gray-700 bg-background-secondary px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white"
                >
                  Cifras CCB
                </Link>
                <Link
                  to="/cifras-hinos-ccb"
                  className="inline-flex items-center rounded-full border border-gray-700 bg-background-secondary px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white"
                >
                  Cifras de Hinos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.3fr,0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
            <h2 className="text-2xl font-semibold text-white">Números do Hinário</h2>
            <p className="text-text-muted mt-2">
              Use os atalhos abaixo para abrir rapidamente a letra do hino desejado e navegar pelo acervo indexável do Hinário CCB.
            </p>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
              </div>
            ) : hymns.length === 0 ? (
              <p className="text-text-muted mt-6">Nenhum hino do hinário foi publicado ainda.</p>
            ) : (
              <>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {rangeSummaries.map((range) => (
                    <Link
                      key={range.key}
                      to={range.path}
                      className="rounded-2xl border border-white/10 bg-background-primary p-4 transition-colors hover:border-primary-500/40"
                    >
                      <p className="text-primary-400 text-sm font-semibold">{range.label}</p>
                      <p className="text-white font-medium mt-2">Faixa {range.shortLabel}</p>
                      <p className="text-text-muted text-sm mt-2">{range.count} hinos publicados</p>
                    </Link>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {hymns.map((hymn) => (
                    <Link
                      key={hymn.id}
                      to={buildHinarioUrl(hymn.numero, hymn.titulo)}
                      className="rounded-xl border border-white/10 bg-background-primary px-3 py-3 text-center text-sm font-semibold text-white transition-colors hover:border-primary-500/40 hover:text-primary-300"
                    >
                      {hymn.numero}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>

          <aside className="rounded-3xl border border-white/10 bg-background-secondary p-6">
            <h2 className="text-2xl font-semibold text-white">Perguntas rápidas</h2>
            <div className="mt-4 space-y-4">
              {config.faq.map((item) => (
                <div key={item.question} className="rounded-2xl border border-white/10 bg-background-primary p-4">
                  <h3 className="text-white font-medium">{item.question}</h3>
                  <p className="text-text-muted text-sm mt-2">{item.answer}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {!isLoading && hymns.length > 0 && (
          <section className="mt-8 rounded-3xl border border-white/10 bg-background-secondary p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-semibold text-white">Letras em destaque</h2>
                <p className="text-text-muted mt-1">Links diretos para letras do hinário com maior potencial de descoberta orgânica.</p>
              </div>
              <BookOpen className="w-6 h-6 text-primary-400" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {hymns.slice(0, 36).map((hymn) => (
                <Link
                  key={hymn.id}
                  to={buildHinarioUrl(hymn.numero, hymn.titulo)}
                  className="rounded-2xl border border-white/10 bg-background-primary p-4 transition-colors hover:border-primary-500/40"
                >
                  <p className="text-primary-400 text-sm font-semibold">Hino {hymn.numero}</p>
                  <h3 className="text-white font-medium mt-1 line-clamp-2">{hymn.titulo}</h3>
                  {hymn.subtitulo ? (
                    <p className="text-text-muted text-sm mt-2 line-clamp-2">{hymn.subtitulo}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default HinarioTopicPage;
