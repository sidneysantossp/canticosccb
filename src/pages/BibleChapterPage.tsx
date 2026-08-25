import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookOpen, ChevronLeft, ChevronRight, Minus, Plus, ScrollText, Search, Share2, Type, Video, X } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import BibleSearchBox from '@/components/bible/BibleSearchBox';
import BibleToolsSidebar from '@/components/bible/BibleToolsSidebar';
import { fetchBibleChapter, type BibleVerse } from '@/api/bible';
import { fetchBibleChapterAudio, type BibleChapterAudio } from '@/api/bibleAudio';
import BibleChapterAudioPlayer from '@/components/bible/BibleChapterAudioPlayer';
import { buildBibleChapterPath, getBibleBook, getBibleChapterTitle } from '@/data/bibleCatalog';
import { generateBreadcrumbSchema } from '@/utils/schemaGenerator';

const BibleChapterPage: React.FC = () => {
  const { bookSlug, chapterSlug } = useParams<{ bookSlug: string; chapterSlug: string }>();
  const book = getBibleBook(bookSlug);
  const chapter = Number(chapterSlug?.match(/^\d+/)?.[0]);
  const title = book && Number.isInteger(chapter) ? getBibleChapterTitle(book.slug, chapter) : undefined;
  const canonicalPath = book && chapter >= 1 && chapter <= book.chapters ? buildBibleChapterPath(book, chapter) : undefined;
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState<'dark' | 'sepia'>('dark');
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [bookmarked, setBookmarked] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTextControls, setShowTextControls] = useState(false);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [chapterTitle, setChapterTitle] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [contentError, setContentError] = useState(false);
  const [chapterAudio, setChapterAudio] = useState<Omit<BibleChapterAudio, 'chapter_id' | 'is_active'> | null>(null);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const scrollTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!canonicalPath) return;
    setBookmarked(localStorage.getItem(`bible-bookmark:${canonicalPath}`) === '1');
  }, [canonicalPath]);

  useEffect(() => {
    if (!book || !Number.isInteger(chapter)) return;
    let cancelled = false;
    setIsLoadingContent(true);
    setContentError(false);
    fetchBibleChapter(book.slug, chapter)
      .then((content) => {
        if (cancelled) return;
        setVerses(content.verses);
        setChapterTitle(content.chapterTitle);
      })
      .catch((error) => {
        console.error('Não foi possível carregar o capítulo bíblico:', error);
        if (!cancelled) {
          setVerses([]);
          setChapterTitle(null);
          setContentError(true);
        }
      })
      .finally(() => { if (!cancelled) setIsLoadingContent(false); });
    return () => { cancelled = true; };
  }, [book, chapter]);

  useEffect(() => {
    if (!book || !Number.isInteger(chapter)) return;
    let cancelled = false;
    setIsAudioPlayerOpen(false);
    fetchBibleChapterAudio(book.slug, chapter)
      .then((audio) => { if (!cancelled) setChapterAudio(audio); })
      .catch(() => { if (!cancelled) setChapterAudio(null); });
    return () => { cancelled = true; };
  }, [book, chapter]);

  useEffect(() => {
    if (!autoScroll) return undefined;
    scrollTimer.current = window.setInterval(() => window.scrollBy({ top: 1, behavior: 'auto' }), Math.max(15, 45 / scrollSpeed));
    return () => { if (scrollTimer.current) window.clearInterval(scrollTimer.current); };
  }, [autoScroll, scrollSpeed]);

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

  const resolvedTitle = chapterTitle || title;
  const readerTitle = `${book.name} ${chapter}${resolvedTitle ? `: ${resolvedTitle}` : ''}`;
  const description = `Leia ${readerTitle} na Bíblia Online CCB, com tradução de referência ACF, navegação entre capítulos, busca por livro, modo de leitura e recursos para estudar.`;

  return (
    <div className={`min-h-screen transition-colors ${theme === 'sepia' ? 'bg-[#19150f] text-[#f3ead7]' : 'bg-[#0d0f0e] text-white'}`}>
      <SEOHead exactTitle title={`${readerTitle} | Bíblia CCB`} description={description} keywords={`${book.name} ${chapter}, ${resolvedTitle || `capítulo ${chapter}`}, bíblia ccb, bíblia acf online`} canonical={canonicalPath} schemaData={schemaData} />
      <main className="mx-auto flex max-w-[1360px] items-start gap-7 px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
        <BibleToolsSidebar autoScroll={autoScroll} bookmarked={bookmarked} fontSize={fontSize} theme={theme} hasAudio={Boolean(chapterAudio)} onAudio={() => setIsAudioPlayerOpen(true)} onAutoScroll={() => setAutoScroll((current) => !current)} onBookmark={toggleBookmark} onFontSize={setFontSize} onShare={() => void share()} onTheme={() => setTheme((current) => current === 'dark' ? 'sepia' : 'dark')} />

        <article className="min-w-0 flex-1 pb-8 lg:pb-0">
          <div className="flex items-center justify-between gap-2">
            <Link to={`/biblia-ccb/${book.slug}`} className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary-300 hover:text-primary-200"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
            <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1 lg:hidden">
              <button type="button" onClick={toggleBookmark} aria-label={bookmarked ? 'Remover marcação' : 'Salvar capítulo'} className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${bookmarked ? 'border-primary-500/50 bg-primary-500/15 text-primary-300' : 'border-white/10 bg-white/[0.04] text-gray-300'}`}><Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} /></button>
              <button type="button" onClick={() => void share()} aria-label="Compartilhar capítulo" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gray-300 transition-colors"><Share2 className="h-4 w-4" /></button>
              <div className={`flex h-9 items-center overflow-hidden rounded-xl border transition-colors ${autoScroll ? 'border-primary-500/50 bg-primary-500/15 text-primary-300' : 'border-white/10 bg-white/[0.04] text-gray-300'}`}>
                <button type="button" onClick={() => setAutoScroll((current) => !current)} aria-label={autoScroll ? 'Pausar rolagem' : 'Iniciar rolagem'} className="flex h-full w-9 items-center justify-center"><ScrollText className="h-4 w-4" /></button>
                <span className="h-5 w-px bg-white/10" />
                <button type="button" onClick={() => setScrollSpeed((current) => Math.max(1, current - 1))} disabled={scrollSpeed <= 1} aria-label="Diminuir velocidade de rolagem" className="flex h-full w-6 items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"><Minus className="h-3 w-3" /></button>
                <button type="button" onClick={() => setScrollSpeed((current) => Math.min(3, current + 1))} disabled={scrollSpeed >= 3} aria-label="Aumentar velocidade de rolagem" className="flex h-full w-6 items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"><Plus className="h-3 w-3" /></button>
              </div>
              <button type="button" disabled={!chapterAudio} onClick={() => setIsAudioPlayerOpen(true)} aria-label={chapterAudio ? 'Ouvir capítulo' : 'Áudio ainda não disponível'} className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${chapterAudio ? 'border-white/10 bg-white/[0.04] text-gray-300 hover:border-primary-500/45 hover:text-primary-300' : 'border-white/5 text-gray-700'}`}><Video className="h-4 w-4" /></button>
              <button type="button" onClick={() => setShowTextControls((current) => !current)} aria-label="Ajustar texto" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gray-300"><Type className="h-4 w-4" /></button>
            </div>
          </div>
          <header className="mt-7 border-b border-white/10 pb-8">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-primary-500/35 bg-primary-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-primary-300">ACF</span><span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-gray-400">{book.testament}</span></div>
            <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-primary-400">{book.name}</p>
            <h1 className="mt-2 text-[28px] font-black leading-[1.14] tracking-[-0.04em] sm:text-5xl sm:leading-[1.06] lg:text-6xl">{resolvedTitle || `Capítulo ${chapter}`}</h1>
          </header>

          <section aria-label={`Texto de ${book.name} ${chapter}`} className="mx-auto max-w-3xl py-6 sm:py-14">
            <div className="mb-10 flex items-center gap-3 text-sm text-gray-500"><BookOpen className="h-4 w-4 text-primary-400" /><span>Capítulo {chapter}</span><span className="h-px flex-1 bg-white/10" /></div>
            <div style={{ fontSize: `${fontSize}px` }} className="space-y-5 leading-[1.78] tracking-[-0.01em]">
              {isLoadingContent ? <div aria-label="Carregando versículos" className="space-y-5 opacity-45">{[92, 78, 96, 71, 88, 64, 94, 76].map((width, index) => <div key={index} className="flex items-start gap-4"><span className="w-6 shrink-0 pt-1 text-right font-mono text-[11px] font-bold text-primary-400">{index + 1}</span><span className="h-4 rounded-full bg-white/10" style={{ width: `${width}%` }} /></div>)}</div> : null}
              {!isLoadingContent && contentError ? <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.05] p-6 text-base text-gray-300">Não foi possível carregar este capítulo agora. Atualize a página e tente novamente.</div> : null}
              {!isLoadingContent && !contentError && verses.map((verse, index) => <React.Fragment key={verse.verse_number}>{verse.section_title && (index === 0 || verse.section_title !== verses[index - 1]?.section_title) ? <h2 className="pt-6 text-[0.82em] font-bold uppercase tracking-[0.14em] text-primary-300">{verse.section_title}</h2> : null}<p id={`versiculo-${verse.verse_number}`} className={`text-justify ${verse.is_red_letter ? 'text-red-300' : ''}`}><span className="relative top-[0.18em] mr-2 select-none align-baseline font-mono text-[0.55em] font-bold text-primary-400">{verse.verse_number}</span>{verse.verse_text}</p></React.Fragment>)}
              {!isLoadingContent && !contentError && verses.length === 0 ? <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-base text-gray-400">Este capítulo ainda não possui versículos publicados.</div> : null}
            </div>
          </section>

          <nav aria-label="Navegação entre capítulos" className="mx-auto grid w-full max-w-3xl gap-3 border-t border-white/10 py-8 sm:grid-cols-2">
            {previousPath ? <Link to={previousPath} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-primary-500/40"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]"><ChevronLeft className="h-5 w-5 text-primary-300" /></span><span><span className="block text-xs text-gray-500">Capítulo anterior</span><span className="font-bold">{book.name} {chapter - 1}</span></span></Link> : <span />}
            {nextPath ? <Link to={nextPath} className="group flex items-center justify-end gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-right transition-colors hover:border-primary-500/40"><span><span className="block text-xs text-gray-500">Próximo capítulo</span><span className="font-bold">{book.name} {chapter + 1}</span></span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]"><ChevronRight className="h-5 w-5 text-primary-300" /></span></Link> : null}
          </nav>
        </article>
      </main>

      {showSearch ? <div className="fixed inset-0 z-50 bg-black/75 p-4 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Buscar na Bíblia"><div className="mx-auto mt-16 max-w-lg rounded-3xl border border-white/10 bg-[#171a18] p-4 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Buscar livro ou capítulo</h2><button type="button" onClick={() => setShowSearch(false)} aria-label="Fechar busca" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05]"><X className="h-4 w-4" /></button></div><BibleSearchBox compact onNavigate={() => setShowSearch(false)} /><div className="mt-5 flex items-center gap-2 text-xs text-gray-500"><Search className="h-3.5 w-3.5" /> Digite, por exemplo, “João 3”.</div></div></div> : null}
      {showTextControls ? <div className="fixed bottom-3 right-3 z-[9999] flex w-12 flex-col items-center rounded-2xl border border-white/10 bg-[#171a18]/90 py-2 shadow-[0_12px_34px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:hidden" role="dialog" aria-label="Ajustar tamanho do texto"><button type="button" onClick={() => setFontSize((current) => Math.min(28, current + 1))} aria-label="Aumentar texto" className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-300 active:bg-primary-500/15"><Plus className="h-4 w-4" /></button><span className="my-1 text-[10px] font-bold text-gray-400">{fontSize}</span><input type="range" aria-label="Tamanho do texto" min="16" max="28" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} className="h-24 w-1 cursor-pointer accent-[#1db954] [writing-mode:vertical-lr] [direction:rtl]" /><button type="button" onClick={() => setFontSize((current) => Math.max(16, current - 1))} aria-label="Diminuir texto" className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl text-gray-300 active:bg-white/10"><Minus className="h-4 w-4" /></button></div> : null}
      {isAudioPlayerOpen && chapterAudio ? <BibleChapterAudioPlayer videoId={chapterAudio.youtube_video_id} title={chapterAudio.title || `${book.name} ${chapter}`} onClose={() => setIsAudioPlayerOpen(false)} /> : null}
    </div>
  );
};

export default BibleChapterPage;
