import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, BookOpen, Share2, Search, X } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import {
  fetchHinarioByNumero,
  fetchHinarioCount,
  fetchHinarioList,
  incrementHinarioViews,
  parseVerses,
  HinarioHymn,
  HinarioVerse,
} from '@/api/hinario';

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const HinarioViewPage: React.FC = () => {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();

  const [hymn, setHymn] = useState<HinarioHymn | null>(null);
  const [verses, setVerses] = useState<HinarioVerse[]>([]);
  const [totalHymns, setTotalHymns] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [goToInput, setGoToInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HinarioHymn[]>([]);
  const [allHymns, setAllHymns] = useState<HinarioHymn[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentNumero = Number(numero) || 1;

  const loadHymn = useCallback(async (num: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchHinarioByNumero(num);
      if (data) {
        setHymn(data);
        setVerses(parseVerses(data.conteudo));
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
    fetchHinarioCount().then(setTotalHymns);
    fetchHinarioList({ is_active: true }).then(setAllHymns);
  }, []);

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = normalize(searchQuery.trim());
    const results = allHymns.filter(h =>
      String(h.numero) === q ||
      String(h.numero).startsWith(q) ||
      normalize(h.titulo).includes(q)
    ).slice(0, 15);
    setSearchResults(results);
  }, [searchQuery, allHymns]);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectHymn = (num: number) => {
    setShowSearch(false);
    setSearchQuery('');
    navigate(`/hinario/${num}`);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentNumero > 1) {
        navigate(`/hinario/${currentNumero - 1}`);
      } else if (e.key === 'ArrowRight' && currentNumero < totalHymns) {
        navigate(`/hinario/${currentNumero + 1}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentNumero, totalHymns, navigate]);

  const handleGoTo = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(goToInput, 10);
    if (num >= 1 && num <= totalHymns) {
      navigate(`/hinario/${num}`);
      setGoToInput('');
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
        title={`Hino ${hymn.numero} - ${hymn.titulo} | Hinário CCB`}
        description={`Letra do hino ${hymn.numero} - ${hymn.titulo}. Hinário da Congregação Cristã no Brasil.`}
        keywords={`hino ${hymn.numero}, ${hymn.titulo}, hinário, CCB, letra, congregação cristã`}
        canonical={`/hinario/${hymn.numero}`}
        schemaData={[
          generateBreadcrumbSchema([
            { name: 'Início', url: '/' },
            { name: 'Hinário', url: '/hinario' },
            { name: `Hino ${hymn.numero}`, url: `/hinario/${hymn.numero}` },
          ]),
        ]}
      />

      {/* Top sticky area: search + nav */}
      <div className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/60">
        {/* Search bar */}
        <div className="max-w-3xl mx-auto px-4 pt-2 pb-1" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              placeholder="Buscar hino por número ou nome..."
              className="w-full pl-9 pr-8 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowSearch(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dropdown results */}
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
                {searchResults.map(h => (
                  <button
                    key={h.id}
                    onClick={() => handleSelectHymn(h.numero)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-700/70 transition-colors ${
                      h.numero === currentNumero ? 'bg-primary-500/10 border-l-2 border-primary-500' : ''
                    }`}
                  >
                    <span className="text-primary-400 font-bold text-sm w-8 text-right flex-shrink-0">{h.numero}</span>
                    <span className="text-gray-200 text-sm truncate">{h.titulo}</span>
                  </button>
                ))}
              </div>
            )}

            {showSearch && searchQuery.trim() && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-50">
                <p className="text-gray-500 text-sm text-center">Nenhum hino encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation bar */}
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between gap-2">
          <button
            onClick={() => currentNumero > 1 && navigate(`/hinario/${currentNumero - 1}`)}
            disabled={currentNumero <= 1}
            className="flex items-center gap-1 px-2 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <form onSubmit={handleGoTo} className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={totalHymns || 480}
              value={goToInput}
              onChange={e => setGoToInput(e.target.value)}
              placeholder={String(currentNumero)}
              className="w-14 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-center text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-gray-500 text-xs">/ {totalHymns || '...'}</span>
          </form>

          <div className="flex items-center gap-1">
            <button onClick={zoomOut} disabled={fontSize <= 12} className="p-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white rounded-lg transition-colors" title="Diminuir fonte">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button onClick={zoomIn} disabled={fontSize >= 32} className="p-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white rounded-lg transition-colors" title="Aumentar fonte">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => currentNumero < totalHymns && navigate(`/hinario/${currentNumero + 1}`)}
            disabled={currentNumero >= totalHymns}
            className="flex items-center gap-1 px-2 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-xs"
          >
            <span>Próximo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Back link + share - inside sticky */}
        <div className="max-w-3xl mx-auto px-4 pb-2 flex items-center justify-between">
          <Link
            to="/hinario"
            className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Voltar</span>
          </Link>

          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Compartilhar"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="max-w-3xl mx-auto px-4 pt-4 pb-28 md:pb-8 select-none"
        onCopy={e => e.preventDefault()}
        onCut={e => e.preventDefault()}
        onContextMenu={e => e.preventDefault()}
        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
      >

        {/* Hymn header */}
        <div className="mb-8">
          <h1 className="text-lg md:text-2xl font-bold text-white leading-tight">
            {hymn.numero} - {hymn.titulo}
          </h1>
          {hymn.subtitulo && (
            <p className="text-gray-400 text-sm mt-1">{hymn.subtitulo}</p>
          )}
        </div>

        {/* Verses */}
        <div className="space-y-8" style={{ fontSize: `${fontSize}px` }}>
          {verses.map((verse, idx) => (
            <div key={idx} className="flex gap-4">
              {verse.number !== null && (
                <span className="text-primary-400 font-semibold flex-shrink-0 w-8 text-right select-none" style={{ fontSize: `${fontSize}px` }}>
                  {verse.number}.
                </span>
              )}
              <div className={`text-gray-200 leading-relaxed ${verse.number === null ? 'pl-12 italic text-gray-400' : ''}`}>
                {verse.lines.map((line, li) => (
                  <div key={li}>{line || '\u00A0'}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom navigation bar - mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/60 md:hidden">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Prev */}
          <button
            onClick={() => currentNumero > 1 && navigate(`/hinario/${currentNumero - 1}`)}
            disabled={currentNumero <= 1}
            className="flex items-center gap-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Anterior</span>
          </button>

          {/* Go-to input */}
          <form onSubmit={handleGoTo} className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={totalHymns || 480}
              value={goToInput}
              onChange={e => setGoToInput(e.target.value)}
              placeholder={String(currentNumero)}
              className="w-16 px-2 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-gray-500 text-xs">
              / {totalHymns || '...'}
            </span>
          </form>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={zoomOut}
              disabled={fontSize <= 12}
              className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white rounded-lg transition-colors"
              title="Diminuir fonte"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={zoomIn}
              disabled={fontSize >= 32}
              className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white rounded-lg transition-colors"
              title="Aumentar fonte"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Next */}
          <button
            onClick={() => currentNumero < totalHymns && navigate(`/hinario/${currentNumero + 1}`)}
            disabled={currentNumero >= totalHymns}
            className="flex items-center gap-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
          >
            <span className="text-xs sm:text-sm">Próximo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};

export default HinarioViewPage;
