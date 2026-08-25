import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Minus, Plus, Search, X } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import BibleMobileTools from '@/components/bible/BibleMobileTools';
import BibleSearchBox from '@/components/bible/BibleSearchBox';
import BibleToolsSidebar from '@/components/bible/BibleToolsSidebar';
import { buildBibleChapterPath, getBibleBook, getBibleChapterTitle } from '@/data/bibleCatalog';
import { generateBreadcrumbSchema } from '@/utils/schemaGenerator';

const BibleChapterPage: React.FC = () => {
  const { bookSlug, chapterSlug } = useParams<{ bookSlug: string; chapterSlug: string }>();
  const book = getBibleBook(bookSlug);
  const chapter = Number(chapterSlug?.match(/^\d+/)?.[0]);
  const title = book && Number.isInteger(chapter) ? getBibleChapterTitle(book.slug, chapter) : undefined;
  const canonicalPath = book && chapter >= 1 && chapter <= book.chapters ? buildBibleChapterPath(book, chapter) : undefined;
  const [fontSize, setFontSize] = useState(20);
  const [theme, setTheme] = useState<'dark' | 'sepia'>('dark');
  const [autoScroll, setAutoScroll] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTextControls, setShowTextControls] = useState(false);
  const scrollTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!canonicalPath) return;
    setBookmarked(localStorage.getItem(`bible-bookmark:${canonicalPath}`) === '1');
  }, [canonicalPath]);

  useEffect(() => {
    if (!autoScroll) return undefined;
    scrollTimer.current = window.setInterval(() => window.scrollBy({ top: 1, behavior: 'auto' }), 45);
    return () => { if (scrollTimer.current) window.clearInterval(scrollTimer.current); };
  }, [autoScroll]);

  const schemaData = useMemo(() => book && canonicalPath ? [
    generateBreadcrumbSchema([{ name: 'Bíblia CCB', url: '/biblia-ccb' }, { name: book.name, url: `/biblia-ccb/${book.slug}` }, { name: `${book.name} ${chapter}`, url: canonicalPath }]),
    { '@context': 'https://schema.org', '@type': 'Chapter', name: `${book.name} ${chapter}${title ? `: ${title}` : ''}`, position: chapter, isPartOf: { '@type': 'Book', name: book.name, url: `https://www.canticosccb.com.br/biblia-ccb/${book.slug}` }, url: `https://www.canticosccb.com.br${canonicalPath}`, inLanguage: 'pt-BR', about: title || `Capítulo ${chapter} de ${book.name}` },
    { '@context': 'https://schema.org', '@type': 'WebPage', name: `${book.name} ${chapter}${title ? `: ${title}` : ''} | Bíblia CCB`, url: `https://www.canticosccb.com.br${canonicalPath}`, inLanguage: 'pt-BR' },
  ] : [], [book, canonicalPath, chapter, title]);

  if (!book || !canonicalPath) return <Navigate to="/biblia-ccb" replace />;
  if (`/biblia-ccb/${bookSlug}/${chapterSlug}` !== canonicalPath) return <Navigate to={canonicalPath} replace />;

  const previousPath = chapter > 1 ? buildBibleChapterPath(book, chapter - 1) : undefined;
  const nextPath = chapter < book.chapters ? buildBibleChapterPath(book, chapter + 1) : undefined;
  const toggleBookmark = () => {
    setBookmarked((current) => {
      const next = !current;
      localStorage.setItem(`bible-bookmark:${canonicalPath}`, next ? '1' : '0');
      return next;
    });
  };
  const share = async () => {
    const data = { title: `${book.name} ${chapter} | Bíblia CCB`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard.writeText(window.location.href);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.warn('Não foi possível compartilhar o capítulo:', error);
    }
  };

  const readerTitle = `${book.name} ${chapter}${title ? `: ${title}` : ''}`;
  const description = `Leia ${readerTitle} na Bíblia Online CCB, com tradução de referência ACF, navegação entre capítulos, busca por livro, modo de leitura e recursos para estudar.`;

  return (
    <div className={`min-h-screen transition-colors ${theme === 'sepia' ? 'bg-[#19150f] text-[#f3ead7]' : 'bg-[#0d0f0e] text-white'}`}>
      <SEOHead exactTitle noindex title={`${readerTitle} | Bíblia CCB`} description={description} keywords={`${book.name} ${chapter}, ${title || `capítulo ${chapter}`}, bíblia ccb, bíblia acf online`} canonical={canonicalPath} schemaData={schemaData} />
      <main className="mx-auto flex max-w-[1360px] items-start gap-7 px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
        <BibleToolsSidebar autoScroll={autoScroll} bookmarked={bookmarked} fontSize={fontSize} theme={theme} onAutoScroll={() => setAutoScroll((current) => !current)} onBookmark={toggleBookmark} onFontSize={setFontSize} onShare={() => void share()} onTheme={() => setTheme((current) => current === 'dark' ? 'sepia' : 'dark')} />

        <article className="min-w-0 flex-1">
          <BibleMobileTools autoScroll={autoScroll} bookmarked={bookmarked} onAutoScroll={() => setAutoScroll((current) => !current)} onBookmark={toggleBookmark} onOpenSearch={() => setShowSearch(true)} onShare={() => void share()} onTheme={() => setTheme((current) => current === 'dark' ? 'sepia' : 'dark')} onText={() => setShowTextControls(true)} />

          <Link to={`/biblia-ccb/${book.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-primary-300 hover:text-primary-200"><ArrowLeft className="h-4 w-4" /> Voltar para {book.name}</Link>
          <header className="mt-7 border-b border-white/10 pb-8">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-primary-500/35 bg-primary-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-primary-300">ACF</span><span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-gray-400">{book.testament}</span></div>
            <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-primary-400">{book.name}</p>
            <h1 className="mt-2 text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Capítulo {chapter}</h1>
            {title ? <p className="mt-4 text-xl font-medium text-gray-300 sm:text-2xl">{title}</p> : null}
          </header>

          <section aria-label={`Texto de ${book.name} ${chapter}`} className="mx-auto max-w-3xl py-10 sm:py-14">
            <div className="mb-10 flex items-center gap-3 text-sm text-gray-500"><BookOpen className="h-4 w-4 text-primary-400" /><span>Leitura do capítulo</span><span className="h-px flex-1 bg-white/10" /></div>
            <div style={{ fontSize: `${fontSize}px` }} className="space-y-7 leading-[1.9] tracking-[-0.01em]">
              <div className="rounded-3xl border border-primary-500/20 bg-primary-500/[0.055] p-6 sm:p-8">
                <p className="text-base font-bold text-primary-300">Conteúdo ACF aguardando autorização editorial</p>
                <p className="mt-3 text-[0.78em] leading-7 text-gray-400">A estrutura de leitura está pronta para receber os versículos deste capítulo. O texto integral será exibido somente após a validação da licença da tradução, preservando a fidelidade da fonte e os direitos de publicação.</p>
              </div>
              <div aria-hidden="true" className="space-y-5 opacity-45">
                {[92, 78, 96, 71, 88, 64, 94, 76].map((width, index) => <div key={index} id={`versiculo-${index + 1}`} className="flex items-start gap-4"><span className="w-6 shrink-0 pt-1 text-right font-mono text-[11px] font-bold text-primary-400">{index + 1}</span><span className="h-4 rounded-full bg-white/10" style={{ width: `${width}%` }} /></div>)}
              </div>
            </div>
          </section>

          <nav aria-label="Navegação entre capítulos" className="mx-auto grid w-full max-w-3xl gap-3 border-t border-white/10 py-8 sm:grid-cols-2">
            {previousPath ? <Link to={previousPath} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-primary-500/40"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]"><ChevronLeft className="h-5 w-5 text-primary-300" /></span><span><span className="block text-xs text-gray-500">Capítulo anterior</span><span className="font-bold">{book.name} {chapter - 1}</span></span></Link> : <span />}
            {nextPath ? <Link to={nextPath} className="group flex items-center justify-end gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-right transition-colors hover:border-primary-500/40"><span><span className="block text-xs text-gray-500">Próximo capítulo</span><span className="font-bold">{book.name} {chapter + 1}</span></span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]"><ChevronRight className="h-5 w-5 text-primary-300" /></span></Link> : null}
          </nav>
        </article>
      </main>

      {showSearch ? <div className="fixed inset-0 z-50 bg-black/75 p-4 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Buscar na Bíblia"><div className="mx-auto mt-16 max-w-lg rounded-3xl border border-white/10 bg-[#171a18] p-4 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Buscar livro ou capítulo</h2><button type="button" onClick={() => setShowSearch(false)} aria-label="Fechar busca" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05]"><X className="h-4 w-4" /></button></div><BibleSearchBox compact onNavigate={() => setShowSearch(false)} /><div className="mt-5 flex items-center gap-2 text-xs text-gray-500"><Search className="h-3.5 w-3.5" /> Digite, por exemplo, “João 3”.</div></div></div> : null}
      {showTextControls ? <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-white/10 bg-[#171a18] p-5 shadow-[0_-20px_60px_rgba(0,0,0,0.65)] lg:hidden" role="dialog" aria-modal="true" aria-label="Ajustar texto"><div className="mx-auto flex max-w-lg items-center gap-4"><button type="button" onClick={() => setShowTextControls(false)} aria-label="Fechar controles de texto" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05]"><X className="h-4 w-4" /></button><span className="flex-1 font-bold">Tamanho do texto</span><button type="button" onClick={() => setFontSize((current) => Math.max(16, current - 1))} aria-label="Diminuir texto" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10"><Minus className="h-4 w-4" /></button><span className="w-12 text-center text-sm text-gray-400">{fontSize}px</span><button type="button" onClick={() => setFontSize((current) => Math.min(28, current + 1))} aria-label="Aumentar texto" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10"><Plus className="h-4 w-4" /></button></div></div> : null}
    </div>
  );
};

export default BibleChapterPage;
