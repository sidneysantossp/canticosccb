import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, BookOpen, Share2, Search, X } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import { buildHinoUrl } from '@/utils/slugUrl';
import { findRelatedCifra, findRelatedHymn } from '@/lib/hymnConnectionsApi';
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
  const [audioVersion, setAudioVersion] = useState<{ id: string; titulo: string; numero?: number } | null>(null);
  const [cifraVersion, setCifraVersion] = useState<{ slug: string; title: string; original_key?: string } | null>(null);
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

  useEffect(() => {
    let cancelled = false;

    const loadConnections = async () => {
      try {
        const [relatedHymn, relatedCifra] = await Promise.all([
          findRelatedHymn({ numero: currentNumero, titulo: hymn?.titulo || '' }),
          findRelatedCifra({ numero: currentNumero, titulo: hymn?.titulo || '' }),
        ]);

        if (!cancelled) {
          setAudioVersion(relatedHymn ? {
            id: relatedHymn.id,
            titulo: relatedHymn.titulo,
            numero: relatedHymn.numero || undefined,
          } : null);
          setCifraVersion(relatedCifra ? {
            slug: relatedCifra.slug,
            title: relatedCifra.title,
            original_key: relatedCifra.original_key,
          } : null);
        }
      } catch {
        if (!cancelled) {
          setAudioVersion(null);
          setCifraVersion(null);
        }
      }
    };

    void loadConnections();
    return () => {
      cancelled = true;
    };
  }, [currentNumero, hymn?.titulo]);

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
        title={`Hino ${hymn.numero} CCB - ${hymn.titulo} | Letra do Hinário`}
        description={`Leia a letra do Hino ${hymn.numero} CCB - ${hymn.titulo}. Página do Hinário da Congregação Cristã no Brasil com navegação por número e título.`}
        keywords={`hino ${hymn.numero} ccb, ${hymn.titulo}, letra hino ${hymn.numero}, hino ${hymn.numero} ccb letra completa, cifra hino ${hymn.numero} ccb, hinário ccb, hinário 5`}
        canonical={`/hinario/${hymn.numero}`}
        schemaData={[
          generateBreadcrumbSchema([
            { name: 'Início', url: '/' },
            { name: 'Hinário', url: '/hinario' },
            { name: `Hino ${hymn.numero} CCB - ${hymn.titulo}`, url: `/hinario/${hymn.numero}` },
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
        className="max-w-3xl mx-auto px-4 pt-4 pb-8 select-none"
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
          <p className="text-gray-400 text-sm md:text-base mt-4 leading-relaxed">
            Letra do Hino {hymn.numero} CCB com navegação rápida pelo Hinário 5, acesso à versão em áudio quando disponível
            e links para categorias e cifras relacionadas.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {audioVersion && (
              <Link
                to={buildHinoUrl(audioVersion.id, audioVersion.titulo, audioVersion.numero)}
                className="inline-flex items-center rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-sm text-primary-300 transition-colors hover:bg-primary-500/20"
              >
                Ouvir este hino
              </Link>
            )}
            {cifraVersion && (
              <Link
                to={`/cifra/${cifraVersion.slug}`}
                className="inline-flex items-center rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-sm text-primary-300 transition-colors hover:bg-primary-500/20"
              >
                Ver cifra{cifraVersion.original_key ? ` • Tom ${cifraVersion.original_key}` : ''}
              </Link>
            )}
            <Link
              to="/hinos-cantados-ccb"
              className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white"
            >
              Hinos cantados
            </Link>
            <Link
              to="/hinos-tocados-ccb"
              className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white"
            >
              Hinos tocados
            </Link>
            <Link
              to="/cifras"
              className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white"
            >
              Ver cifras CCB
            </Link>
          </div>
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

        <section className="mt-10 rounded-2xl border border-gray-700/60 bg-gray-800/60 p-5">
          <h2 className="text-lg font-semibold text-white">Escutar ou estudar este hino</h2>
          <p className="text-gray-400 text-sm mt-2">
            Use estes atalhos para abrir a versao em audio, a cifra relacionada e outros hubs estrategicos do repertorio CCB.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {audioVersion ? (
              <Link
                to={buildHinoUrl(audioVersion.id, audioVersion.titulo, audioVersion.numero)}
                className="inline-flex items-center rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-sm text-primary-300 transition-colors hover:bg-primary-500/20"
              >
                Ouvir Hino {hymn.numero} CCB
              </Link>
            ) : null}
            {cifraVersion ? (
              <Link
                to={`/cifra/${cifraVersion.slug}`}
                className="inline-flex items-center rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-sm text-primary-300 transition-colors hover:bg-primary-500/20"
              >
                Cifra do Hino {hymn.numero}{cifraVersion.original_key ? ` • Tom ${cifraVersion.original_key}` : ''}
              </Link>
            ) : null}
            <Link
              to="/hinos-ccb"
              className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white"
            >
              Hinos CCB
            </Link>
            <Link
              to="/cifras-hinos-ccb"
              className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-primary-500/40 hover:text-white"
            >
              Cifras de Hinos
            </Link>
          </div>
        </section>

        {/* Navigation bar - below content */}
        <div className="mt-10 mb-8 border-t border-gray-700/60 pt-6">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => currentNumero > 1 && navigate(`/hinario/${currentNumero - 1}`)}
              disabled={currentNumero <= 1}
              className="flex items-center gap-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Anterior</span>
            </button>

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
              <span className="text-gray-500 text-xs">/ {totalHymns || '...'}</span>
            </form>

            <div className="flex items-center gap-1">
              <button onClick={zoomOut} disabled={fontSize <= 12} className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white rounded-lg transition-colors" title="Diminuir fonte">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={zoomIn} disabled={fontSize >= 32} className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-white rounded-lg transition-colors" title="Aumentar fonte">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

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
      </div>
    </>
  );
};

export default HinarioViewPage;
