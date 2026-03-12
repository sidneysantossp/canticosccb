import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Headphones, ListMusic } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { fetchActiveBibleNarrated, type BibleNarrated } from '@/api/bibleNarrated';
import { generateBreadcrumbSchema, generateFAQSchema, generateItemListSchema } from '@/utils/schemaGenerator';

const bibleFaq = [
  {
    question: 'Onde ouvir Biblia CCB online?',
    answer: 'Nesta area do Canticos CCB voce encontra a biblioteca de Biblia narrada com capitulos organizados, navegacao por livro e acesso rapido ao acervo publicado.',
  },
  {
    question: 'A Biblia narrada CCB tem lista de livros e capitulos?',
    answer: 'Sim. A pagina publica organiza os itens narrados por livro e titulo, facilitando a descoberta e o acesso ao conteudo disponivel.',
  },
  {
    question: 'Qual a diferenca entre Biblia CCB e Biblia narrada CCB?',
    answer: 'A pagina Biblia CCB funciona como hub editorial e de descoberta. A pagina Biblia Narrada concentra a biblioteca navegavel e o acesso ao acervo narrado publicado.',
  },
];

const BibleHubPage: React.FC = () => {
  const [items, setItems] = useState<BibleNarrated[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchActiveBibleNarrated();
        if (!cancelled) {
          setItems(data);
        }
      } catch (error) {
        console.error('Erro ao carregar hub da Biblia:', error);
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
      { name: 'Biblia CCB', url: '/biblia-ccb' },
    ]),
    generateItemListSchema({
      name: 'Biblioteca Biblica CCB',
      description: 'Hub com acesso a Biblia narrada e conteudo biblico publicado no Canticos CCB.',
      url: '/biblia-ccb',
      items: items.slice(0, 24).map((item, index) => ({
        name: item.title || item.book_name || `Biblia Narrada ${index + 1}`,
        url: `/biblia-narrada#capitulo-${item.id}`,
        position: index + 1,
      })),
    }),
    generateFAQSchema(bibleFaq),
  ]), [items]);

  return (
    <div className="min-h-screen bg-background-primary">
      <SEOHead
        title="Biblia CCB | Biblia Narrada e Conteudo Biblico"
        description="Hub da Biblia CCB no Canticos CCB com acesso a Biblia narrada, livros publicados, capitulos organizados e navegacao por conteudo biblico."
        keywords="biblia ccb, biblia narrada ccb, ouvir biblia ccb, capitulos biblia narrada, conteudo biblico ccb"
        canonical="/biblia-ccb"
        schemaData={schemaData}
      />

      <div className="bg-gradient-to-b from-primary-700/25 to-transparent pt-20 pb-8 px-6">
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
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">Biblia CCB</h1>
              <p className="text-white/85 text-base md:text-lg mt-3">
                Area editorial e de descoberta para quem procura Biblia CCB, Biblia narrada e navegacao por livros e capitulos publicados na plataforma.
              </p>
              <div className="flex flex-wrap gap-4 mt-5 text-sm text-white/75">
                <span>{items.length} itens narrados publicados</span>
                <span>Hub para buscas por Biblia CCB e Biblia narrada</span>
                <span>Links internos para o acervo publicado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.45fr,0.95fr]">
          <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-semibold text-white">Biblioteca biblica publicada</h2>
                <p className="text-text-muted mt-1">
                  Selecao de livros e capitulos narrados disponiveis hoje para navegacao e reproducao.
                </p>
              </div>
              <Headphones className="w-6 h-6 text-primary-400" />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-text-muted">
                Ainda nao ha itens narrados publicados nesta biblioteca.
              </div>
            ) : (
              <div className="space-y-3">
                {items.slice(0, 12).map((item) => (
                  <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-primary-500/30 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="text-primary-300 text-sm font-medium">{item.book_name || 'Biblia Narrada'}</p>
                        <h3 className="text-white font-semibold mt-1">{item.title}</h3>
                        <p className="text-text-muted text-sm mt-2 line-clamp-2">
                          {item.description || 'Conteudo biblico narrado disponivel na plataforma.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/biblia-narrada#capitulo-${item.id}`}
                          className="px-3 py-2 rounded-full bg-primary-500 text-black text-sm font-semibold hover:bg-primary-400 transition-colors"
                        >
                          Ver na biblioteca
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
              <h2 className="text-xl font-semibold text-white mb-3">Como usar este hub</h2>
              <ul className="space-y-3 text-sm text-text-muted">
                <li>Use esta pagina para buscas amplas por Biblia CCB.</li>
                <li>Acesse a biblioteca completa em <Link to="/biblia-narrada" className="text-primary-400 hover:underline">Biblia Narrada</Link>.</li>
                <li>Combine com hinos e playlists para ampliar a navegacao interna do site.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Rotas relacionadas</h2>
              <div className="space-y-3">
                <Link to="/biblia-narrada" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:border-primary-500/30 transition-colors">
                  <span>Biblioteca de Biblia Narrada</span>
                  <ListMusic className="w-4 h-4 text-primary-400" />
                </Link>
                <Link to="/instrumentais" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:border-primary-500/30 transition-colors">
                  <span>Instrumentais CCB</span>
                  <Headphones className="w-4 h-4 text-primary-400" />
                </Link>
                <Link to="/hinos-cantados-ccb" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:border-primary-500/30 transition-colors">
                  <span>Hinos Cantados</span>
                  <BookOpen className="w-4 h-4 text-primary-400" />
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Perguntas frequentes</h2>
              <div className="space-y-4">
                {bibleFaq.map((faq) => (
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

export default BibleHubPage;
