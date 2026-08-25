import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Minus, Plus, Printer, Search, Share2, ScrollText, Type } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import {
  fetchHinarioByNumero,
  fetchHinarioList,
  incrementHinarioViews,
  parseVerses,
  HinarioHymn,
  HinarioVerse,
} from '@/api/hinario';
import {
  buildHinarioMetaDescription,
  buildHinarioMetaTitle,
  buildHinarioUrl,
  getHinarioNumberFromRoute,
  getHinarioOfficialTitle,
} from '@/utils/hinarioSeo';

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const CHORD_LINE_TOKEN = /^[A-G](?:#|b)?(?:m|maj|min|sus|add|dim|aug|°|º)?\d?(?:\/[A-G](?:#|b)?)?\*?$/i;
const isChordLine = (line: string) => {
  const tokens = line.trim().match(/[A-Za-z#b/°º*]+|\d+/g) || [];
  return tokens.length > 0 && tokens.every((token) => CHORD_LINE_TOKEN.test(token) || (/^\d{1,2}$/.test(token)));
};
const cleanLyricContent = (content: string) => content
  .split('\n')
  .filter((line) => !isChordLine(line))
  .join('\n');

const HinarioViewPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [hymn, setHymn] = useState<HinarioHymn | null>(null);
  const [verses, setVerses] = useState<HinarioVerse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [goToInput, setGoToInput] = useState('');
  const [quickSearchMessage, setQuickSearchMessage] = useState('');
  const [allHymns, setAllHymns] = useState<HinarioHymn[]>([]);

  const currentNumero = getHinarioNumberFromRoute(slug) || 1;
  const officialTitle = hymn ? getHinarioOfficialTitle(hymn.titulo, hymn.numero) : '';
  const canonicalPath = hymn ? buildHinarioUrl(hymn.numero, hymn.titulo) : `/hinario/${currentNumero}`;
  const canonicalUrl = `https://www.canticosccb.com.br${canonicalPath}`;
  const metaTitle = hymn ? buildHinarioMetaTitle(hymn.numero, hymn.titulo) : '';
  const metaDescription = hymn ? buildHinarioMetaDescription(hymn.numero, hymn.titulo) : '';

  const loadHymn = useCallback(async (num: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchHinarioByNumero(num);
      if (data) {
        setHymn(data);
        setVerses(parseVerses(cleanLyricContent(data.conteudo)));
        incrementHinarioViews(data.id);
      } else {
        setError('Hino não encontrado');
        setHymn(null);
        setVerses([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar hino');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHymn(currentNumero);
  }, [currentNumero, loadHymn]);

  useEffect(() => {
    if (hymn && hymn.numero === currentNumero && location.pathname !== canonicalPath) {
      navigate(canonicalPath, { replace: true });
    }
  }, [canonicalPath, currentNumero, hymn, location.pathname, navigate]);

  useEffect(() => {
    fetchHinarioList({ is_active: true }).then(setAllHymns);
  }, []);

  const getHymnUrl = useCallback((number: number) => {
    const target = allHymns.find(item => item.numero === number);
    return target ? buildHinarioUrl(target.numero, target.titulo) : `/hinario/${number}`;
  }, [allHymns]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentNumero > 1) {
        navigate(getHymnUrl(currentNumero - 1));
      } else if (e.key === 'ArrowRight' && currentNumero < 480) {
        navigate(getHymnUrl(currentNumero + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentNumero, getHymnUrl, navigate]);

  const handleGoTo = (e: React.FormEvent) => {
    e.preventDefault();
    const query = goToInput.trim();
    if (!query) return;

    const normalizedQuery = normalize(query);
    const directNumber = Number(query);
    const matchedHymn = allHymns.find(item =>
      String(item.numero) === query || normalize(item.titulo).includes(normalizedQuery)
    );

    if (matchedHymn?.numero || (Number.isInteger(directNumber) && directNumber >= 1 && directNumber <= 480)) {
      const targetNumber = matchedHymn?.numero || directNumber;
      navigate(getHymnUrl(targetNumber));
      setGoToInput('');
      setQuickSearchMessage('');
    } else {
      setQuickSearchMessage('Nenhum hino encontrado. Tente o número ou parte do título.');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: hymn ? `${hymn.numero} - ${hymn.titulo}` : 'Hinário CCB', url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copiado!');
    }
  };

  const zoomIn = () => setFontSize(prev => Math.min(prev + 2, 32));
  const zoomOut = () => setFontSize(prev => Math.max(prev - 2, 12));
  const handlePrint = () => window.print();

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Error
  if (error || !hymn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <BookOpen className="w-16 h-16 text-gray-600" />
        <h2 className="text-xl text-gray-400">{error || 'Hino não encontrado'}</h2>
        <Link to="/hinario" className="text-primary-400 hover:underline">
          Voltar para o Hinário
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={metaTitle}
        description={metaDescription}
        keywords={`hino ${hymn.numero} ccb, ${officialTitle}, letra hino ${hymn.numero}, hino ${hymn.numero} ccb letra completa, cifra hino ${hymn.numero} ccb, hinário ccb, hinário 5`}
        canonical={canonicalPath}
        schemaData={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              '@id': `${canonicalUrl}#webpage`,
              url: canonicalUrl,
              name: metaTitle,
              description: metaDescription,
              inLanguage: 'pt-BR',
              isPartOf: { '@id': 'https://www.canticosccb.com.br/#website' },
              breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` },
              mainEntity: { '@id': `${canonicalUrl}#hino` },
            },
            {
              '@type': 'MusicComposition',
              '@id': `${canonicalUrl}#hino`,
              name: officialTitle,
              alternateName: `Hino ${hymn.numero} CCB`,
              url: canonicalUrl,
              inLanguage: 'pt-BR',
              position: hymn.numero,
              identifier: {
                '@type': 'PropertyValue',
                propertyID: 'Número do Hinário',
                value: String(hymn.numero),
              },
              isPartOf: { '@id': 'https://www.canticosccb.com.br/hinario#hinario' },
              mainEntityOfPage: { '@id': `${canonicalUrl}#webpage` },
              ...(hymn.conteudo ? {
                lyrics: {
                  '@type': 'CreativeWork',
                  inLanguage: 'pt-BR',
                  text: hymn.conteudo,
                },
              } : {}),
            },
            {
              '@type': 'Book',
              '@id': 'https://www.canticosccb.com.br/hinario#hinario',
              name: 'Hinário Digital CCB',
              url: 'https://www.canticosccb.com.br/hinario',
              inLanguage: 'pt-BR',
              numberOfItems: 480,
            },
            {
              '@type': 'BreadcrumbList',
              '@id': `${canonicalUrl}#breadcrumb`,
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.canticosccb.com.br/' },
                { '@type': 'ListItem', position: 2, name: 'Hinário', item: 'https://www.canticosccb.com.br/hinario' },
                { '@type': 'ListItem', position: 3, name: `Hino ${hymn.numero}`, item: canonicalUrl },
              ],
            },
          ],
        }}
      />

      <main className="min-h-screen bg-background-primary px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside className="print:hidden lg:sticky lg:top-6 lg:self-start">
            <div className="hidden lg:block">
              <div className="mb-5 flex items-center justify-between px-1">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Ferramentas</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handlePrint} title="Imprimir" aria-label="Imprimir" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"><Printer className="h-4 w-4" /></button>
                  <button type="button" onClick={handleShare} title="Compartilhar" aria-label="Compartilhar" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"><Share2 className="h-4 w-4" /></button>
                </div>
              </div>
              <form onSubmit={handleGoTo} className="overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
                <div className="flex items-center gap-2 px-3 py-2.5"><Search className="h-4 w-4 shrink-0 text-primary-400" /><input id="hinario-quick-search" type="text" inputMode="search" value={goToInput} onChange={e => { setGoToInput(e.target.value); setQuickSearchMessage(''); }} placeholder="Buscar hino" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500" autoComplete="off" /></div>
              </form>
              <div className="mt-3 overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
                <button type="button" onClick={() => window.scrollBy({ top: Math.max(180, window.innerHeight * 0.65), behavior: 'smooth' })} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70"><ScrollText className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Rolagem</span><span className="text-xs text-gray-400">Manual</span><ChevronRight className="h-4 w-4 text-gray-500" /></button>
              </div>
              <div className="mt-3 overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
                <div className="flex items-center gap-3 px-3 py-3 text-sm text-gray-100"><Type className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Texto</span><button type="button" onClick={zoomOut} className="text-gray-300 transition hover:text-white" aria-label="Diminuir texto"><Minus className="h-4 w-4" /></button><span className="min-w-9 text-center text-xs text-gray-400">{fontSize}px</span><button type="button" onClick={zoomIn} className="text-gray-300 transition hover:text-white" aria-label="Aumentar texto"><Plus className="h-4 w-4" /></button></div>
              </div>
              <div className="mt-3 overflow-hidden rounded-2xl border border-gray-700/80 bg-gray-800/75 shadow-lg shadow-black/20">
                <button type="button" onClick={handleShare} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70"><Share2 className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Compartilhar</span><ChevronRight className="h-4 w-4 text-gray-500" /></button>
                <button type="button" onClick={handlePrint} className="flex w-full items-center gap-3 border-t border-gray-700/80 px-3 py-3 text-left text-sm text-gray-100 transition-colors hover:bg-gray-700/70"><Printer className="h-4 w-4 text-gray-300" /><span className="flex-1 font-medium">Imprimir</span><ChevronRight className="h-4 w-4 text-gray-500" /></button>
              </div>
              {quickSearchMessage ? <p className="mt-3 text-xs text-red-300">{quickSearchMessage}</p> : null}
            </div>
          </aside>

          <article className="min-w-0 text-white">
            <div className="mb-7 flex items-center justify-between gap-4 print:hidden lg:hidden">
              <Link to="/hinario" className="inline-flex items-center gap-2 text-sm text-primary-300 transition hover:text-primary-200"><ArrowLeft className="h-4 w-4" /> Voltar ao Hinário</Link>
              <div className="flex items-center gap-2"><button type="button" onClick={handleShare} className="rounded-full p-2 text-primary-300 transition hover:bg-primary-500/10" aria-label="Compartilhar"><Share2 className="h-5 w-5" /></button><button type="button" onClick={handlePrint} className="rounded-full p-2 text-primary-300 transition hover:bg-primary-500/10" aria-label="Imprimir"><Printer className="h-5 w-5" /></button></div>
            </div>
            <Link to="/hinario" className="mb-6 hidden w-fit items-center gap-2 text-sm text-primary-300 transition hover:text-primary-200 lg:inline-flex"><ArrowLeft className="h-4 w-4" /> Voltar ao Hinário</Link>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">{officialTitle}</h1>
            <p className="mt-3 text-base text-gray-400"><span className="text-primary-400">Hinário</span> <span className="mx-1 text-gray-600">/</span> Hino {String(hymn.numero).padStart(2, '0')}</p>

            <div className="mt-7 border-t border-white/10 pt-7 sm:mt-9 sm:pt-9">
              {verses.length > 0 ? <div className="mx-auto max-w-3xl space-y-8 sm:space-y-10" style={{ fontSize: `${fontSize}px` }}>
                {verses.map((verse, idx) => <div key={idx} className="flex gap-4 sm:gap-5">
                  {verse.number !== null ? <span className="w-6 shrink-0 select-none text-right font-medium text-primary-400">{verse.number}.</span> : null}
                  <div className="min-w-0 leading-relaxed text-gray-100">{verse.label ? <p className="mb-1.5 text-sm font-bold uppercase tracking-[0.16em] text-primary-400">{verse.label}</p> : null}{verse.lines.map((line, lineIndex) => <div key={lineIndex}>{line || '\u00A0'}</div>)}</div>
                </div>)}
              </div> : <p className="py-10 text-base text-gray-400">A letra deste hino ainda não está disponível.</p>}
            </div>

            <div className="mt-8 flex items-center justify-end gap-2 lg:hidden print:hidden"><Type className="h-4 w-4 text-primary-400" /><button type="button" onClick={zoomOut} className="rounded-lg px-2 py-1 text-lg text-white hover:bg-primary-500/10">−</button><span className="min-w-10 text-center text-sm text-gray-300">{fontSize}px</span><button type="button" onClick={zoomIn} className="rounded-lg px-2 py-1 text-lg text-white hover:bg-primary-500/10">+</button></div>

            <nav className="mx-auto mt-12 grid w-full max-w-3xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-white/10 pt-6 print:hidden max-[520px]:grid-cols-2" aria-label="Navegação entre hinos">
              {currentNumero > 1 ? <button type="button" onClick={() => navigate(getHymnUrl(currentNumero - 1))} className="inline-flex whitespace-nowrap items-center justify-center gap-1.5 rounded-lg border border-primary-500/70 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-500/10"><ChevronLeft className="h-4 w-4 text-primary-400" /> Hino anterior</button> : <span />}
              <form onSubmit={handleGoTo} className="relative min-w-0 max-[520px]:order-3 max-[520px]:col-span-2"><input type="text" inputMode="search" value={goToInput} onChange={(event) => { setGoToInput(event.target.value); setQuickSearchMessage(''); }} placeholder="Buscar por número ou nome" aria-label="Buscar outro hino" className="w-full rounded-lg border border-gray-700 bg-background-secondary py-1.5 pl-3 pr-9 text-sm text-white outline-none transition focus:border-primary-500" /><Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" /></form>
              {currentNumero < 480 ? <button type="button" onClick={() => navigate(getHymnUrl(currentNumero + 1))} className="inline-flex whitespace-nowrap items-center justify-center gap-1.5 rounded-lg border border-primary-500/70 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-500/10">Próximo hino <ChevronRight className="h-4 w-4 text-primary-400" /></button> : <span />}
            </nav>
          </article>
        </div>
      </main>
    </>
  );
};

export default HinarioViewPage;
