import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, BookOpen, Share2, Search, X } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import { buildHinoUrl } from '@/utils/slugUrl';
import { getHinarioRangeForNumero } from '@/lib/hinarioRanges';
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
  const hinarioRange = getHinarioRangeForNumero(currentNumero);

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
        description={`Leia a letra do Hino ${hymn.numero} CCB - ${hymn.titulo}. Página do Hinário da comunidade CCB com navegação por número e título.`}
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

      <main className="min-h-screen bg-background-primary px-4 py-8 md:px-6 md:py-12">
        <article className="mx-auto max-w-4xl rounded-3xl border border-gray-300 bg-gray-200 px-6 py-8 text-gray-900 shadow-xl md:px-12 md:py-12">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            {hymn.titulo}
          </h1>

          <div className="mt-8 border-t border-gray-300 pt-8">
            {verses.length > 0 ? (
              <div className="space-y-7" style={{ fontSize: `${fontSize}px` }}>
                {verses.map((verse, idx) => (
                  <div key={idx} className="flex gap-4">
                    {verse.number !== null && (
                      <span className="w-8 flex-shrink-0 select-none text-right font-semibold text-gray-700" style={{ fontSize: `${fontSize}px` }}>
                        {verse.number}.
                      </span>
                    )}
                    <div className={`leading-relaxed ${verse.number === null ? 'pl-12 italic text-gray-600' : 'text-gray-900'}`}>
                      {verse.lines.map((line, lineIndex) => (
                        <div key={lineIndex}>{line || '\u00A0'}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base text-gray-600 md:text-lg">A letra deste hino ainda não está disponível.</p>
            )}
          </div>
        </article>
      </main>
    </>
  );
};

export default HinarioViewPage;
