import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Headphones, Play } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import BibleMobilePlayer from '@/components/bible/BibleMobilePlayer';
import { fetchActiveBibleNarrated, type BibleNarrated } from '@/api/bibleNarrated';
import { usePlayerStore } from '@/stores/playerStore';
import { getYouTubeAudioUrl } from '@/utils/youtubeApi';
import { generateBreadcrumbSchema, generateFAQSchema, generateItemListSchema } from '@/utils/schemaGenerator';

const pageFaq = [
  {
    question: 'Onde ouvir Biblia narrada CCB online?',
    answer: 'Nesta biblioteca voce encontra os itens de Biblia narrada publicados no Canticos CCB, com navegacao por livro, titulo e acesso rapido para reproducao.',
  },
  {
    question: 'A pagina de Biblia narrada mostra capitulos publicados?',
    answer: 'Sim. A listagem mostra os itens narrados disponiveis na base, com nome do livro, titulo, descricao e duracao quando informada.',
  },
  {
    question: 'Posso navegar da Biblia narrada para outras areas do site?',
    answer: 'Sim. A pagina liga a outros hubs publicos do site para ampliar a descoberta de hinos, playlists, instrumentais e conteudo relacionado.',
  },
];

const formatDuration = (seconds: number) => {
  const safeSeconds = Number(seconds || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const BibliaNarradaPage: React.FC = () => {
  const { play } = usePlayerStore();
  const [items, setItems] = useState<BibleNarrated[]>([]);
  const [selectedBible, setSelectedBible] = useState<BibleNarrated | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);

    return () => {
      window.removeEventListener('resize', updateIsMobile);
    };
  }, []);

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
        console.error('Erro ao carregar Biblia Narrada:', error);
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

  const handlePlayBible = (item: BibleNarrated) => {
    if (isMobile) {
      setSelectedBible(item);
      return;
    }

    play({
      id: String(item.id),
      number: item.id,
      title: item.title,
      artist: 'Biblia Narrada',
      category: 'Biblia',
      duration: formatDuration(item.duration || 0),
      plays: 0,
      isLiked: false,
      coverUrl: item.thumbnail_url,
      audioUrl: getYouTubeAudioUrl(item.youtube_video_id),
      createdAt: item.created_at || new Date().toISOString(),
    });
  };

  const schemaData = useMemo(() => ([
    generateBreadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Biblia CCB', url: '/biblia-ccb' },
      { name: 'Biblia Narrada', url: '/biblia-narrada' },
    ]),
    generateItemListSchema({
      name: 'Biblia Narrada CCB',
      description: 'Biblioteca de Biblia narrada publicada no Canticos CCB.',
      url: '/biblia-narrada',
      items: items.slice(0, 50).map((item, index) => ({
        name: item.title || item.book_name || `Biblia Narrada ${index + 1}`,
        url: `/biblia-narrada#capitulo-${item.id}`,
        position: index + 1,
      })),
    }),
    generateFAQSchema(pageFaq),
  ]), [items]);

  return (
    <div className="min-h-screen bg-background-primary">
      <SEOHead
        title="Biblia Narrada CCB | Ouvir Biblia Narrada Online"
        description="Ouça Biblia narrada CCB no Canticos CCB com biblioteca organizada por livro, capitulos publicados e acesso rapido ao conteudo biblico narrado."
        keywords="biblia narrada ccb, ouvir biblia narrada, biblia ccb online, capitulos narrados ccb, conteudo biblico narrado"
        canonical="/biblia-narrada"
        schemaData={schemaData}
      />

      <div className="bg-gradient-to-b from-primary-700/25 to-transparent pt-20 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <Link to="/biblia-ccb" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Biblia CCB
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-primary-300" />
            </div>
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">Biblia Narrada CCB</h1>
              <p className="text-white/85 text-base md:text-lg mt-3">
                Biblioteca publica com conteudo biblico narrado, organizada por livro e titulo para facilitar descoberta, reproducao e navegacao interna.
              </p>
              <div className="flex flex-wrap gap-4 mt-5 text-sm text-white/75">
                <span>{items.length} itens narrados publicados</span>
                <span>Biblioteca organizada por livro e titulo</span>
                <span>Foco em buscas por Biblia narrada CCB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.55fr,0.85fr]">
          <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-semibold text-white">Acervo narrado</h2>
                <p className="text-text-muted mt-1">
                  Itens publicados com acesso rapido para ouvir e navegar por livro.
                </p>
              </div>
              <Headphones className="w-6 h-6 text-primary-400" />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-text-muted">
                Ainda nao ha itens narrados publicados nesta biblioteca.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={item.id}
                    id={`capitulo-${item.id}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-primary-500/30 transition-colors scroll-mt-24"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <img
                        src={item.thumbnail_url || 'https://placehold.co/240x160/101010/ffffff?text=Biblia+CCB'}
                        alt={item.title}
                        className="w-full md:w-44 h-28 rounded-2xl object-cover border border-white/10"
                        loading="lazy"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-primary-300 text-sm font-medium">{item.book_name || 'Biblia Narrada'}</p>
                        <h3 className="text-white text-lg font-semibold mt-1">{item.title}</h3>
                        <p className="text-text-muted text-sm mt-2 line-clamp-2">
                          {item.description || 'Conteudo biblico narrado disponivel na plataforma.'}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-white/70">
                          {(item.duration || 0) > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDuration(item.duration || 0)}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            Biblioteca biblica publicada
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handlePlayBible(item)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500 text-black text-sm font-semibold hover:bg-primary-400 transition-colors"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Reproduzir
                        </button>
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
                <Link to="/biblia-ccb" className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:border-primary-500/30 transition-colors">
                  Biblia CCB
                </Link>
                <Link to="/instrumentais" className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:border-primary-500/30 transition-colors">
                  Instrumentais CCB
                </Link>
                <Link to="/hinos-cantados-ccb" className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:border-primary-500/30 transition-colors">
                  Hinos Cantados CCB
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Perguntas frequentes</h2>
              <div className="space-y-4">
                {pageFaq.map((faq) => (
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

      {selectedBible && (
        <BibleMobilePlayer
          id={selectedBible.id}
          title={selectedBible.title}
          bookName={selectedBible.book_name}
          description={selectedBible.description}
          content={selectedBible.content}
          audioUrl={getYouTubeAudioUrl(selectedBible.youtube_video_id)}
          thumbnail={selectedBible.thumbnail_url}
          onClose={() => setSelectedBible(null)}
        />
      )}
    </div>
  );
};

export default BibliaNarradaPage;
