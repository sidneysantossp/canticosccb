import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Type, ScrollText, Settings2, Eye, Printer, Share2, ChevronDown, Music, X } from 'lucide-react';
import { fetchCifraBySlug, incrementCifraViews, Cifra, INSTRUMENTS, ALL_KEYS } from '@/api/cifras';
import {
  isChordLine,
  isSectionLine,
  extractChords,
  getSemitonesBetweenKeys,
  transposeCifraContent,
  getChordDiagram,
  ChordDiagram,
} from '@/utils/chordUtils';

const CifraPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [cifra, setCifra] = useState<Cifra | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User controls
  const [selectedKey, setSelectedKey] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('violao');
  const [fontSize, setFontSize] = useState(14);
  const [showChords, setShowChords] = useState(true);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); // 0 = off
  const [showOptions, setShowOptions] = useState(false);
  const [showKeySelector, setShowKeySelector] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (slug) loadCifra(slug);
    return () => stopAutoScroll();
  }, [slug]);

  const loadCifra = async (slug: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchCifraBySlug(slug);
      if (data) {
        setCifra(data);
        setSelectedKey(data.original_key);
        setSelectedInstrument(data.instrument);
        incrementCifraViews(data.id);
      } else {
        setError('Cifra não encontrada');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar cifra');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll
  const startAutoScroll = useCallback((speed: number) => {
    stopAutoScroll();
    if (speed <= 0) return;
    scrollIntervalRef.current = window.setInterval(() => {
      window.scrollBy({ top: speed, behavior: 'smooth' });
    }, 100);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoScrollSpeed > 0) {
      startAutoScroll(autoScrollSpeed);
    } else {
      stopAutoScroll();
    }
    return () => stopAutoScroll();
  }, [autoScrollSpeed, startAutoScroll, stopAutoScroll]);

  // Transposition
  const semitones = cifra ? getSemitonesBetweenKeys(cifra.original_key, selectedKey) : 0;
  const transposedContent = cifra ? transposeCifraContent(cifra.content, semitones, selectedKey) : '';
  const chords = extractChords(transposedContent);

  const transposeUp = () => {
    const majorKeys = ALL_KEYS.filter(k => !k.includes('m'));
    const minorKeys = ALL_KEYS.filter(k => k.includes('m'));
    const keys = selectedKey.includes('m') ? minorKeys : majorKeys;
    const idx = keys.indexOf(selectedKey);
    const newIdx = (idx + 1) % keys.length;
    setSelectedKey(keys[newIdx]);
  };

  const transposeDown = () => {
    const majorKeys = ALL_KEYS.filter(k => !k.includes('m'));
    const minorKeys = ALL_KEYS.filter(k => k.includes('m'));
    const keys = selectedKey.includes('m') ? minorKeys : majorKeys;
    const idx = keys.indexOf(selectedKey);
    const newIdx = (idx - 1 + keys.length) % keys.length;
    setSelectedKey(keys[newIdx]);
  };

  const handlePrint = () => window.print();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: cifra?.title,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  // Render chord line with colored chords
  const renderLine = (line: string, idx: number) => {
    if (isSectionLine(line)) {
      return (
        <div key={idx} className="text-white font-bold mt-8 mb-3 text-base">
          {line}
        </div>
      );
    }
    if (isChordLine(line) && showChords) {
      return (
        <div key={idx} className="text-primary-400 font-bold whitespace-pre">
          {line}
        </div>
      );
    }
    if (isChordLine(line) && !showChords) {
      return null;
    }
    return (
      <div key={idx} className="text-gray-200 whitespace-pre-wrap">
        {line || '\u00A0'}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !cifra) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Music className="w-16 h-16 text-gray-600" />
        <h2 className="text-xl text-gray-400">{error || 'Cifra não encontrada'}</h2>
        <Link to="/cifras" className="text-primary-400 hover:underline">
          Voltar para cifras
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 print:px-0 print:py-0">
      {/* Header */}
      <div className="mb-6">
        <Link to="/cifras" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors print:hidden">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="flex items-start gap-4">
          {cifra.cover_url && (
            <img src={cifra.cover_url} alt={cifra.title} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shadow-lg flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{cifra.title}</h1>
            {cifra.artist && (
              <p className="text-primary-400 font-medium mt-1">{cifra.artist}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">{cifra.views_count.toLocaleString()} exibições</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-background-primary/95 backdrop-blur-sm border-b border-gray-800 -mx-4 px-4 py-3 mb-6 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Instrument selector */}
          <select
            value={selectedInstrument}
            onChange={e => setSelectedInstrument(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {INSTRUMENTS.map(i => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>

          {/* Transpose controls */}
          <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg">
            <button onClick={transposeDown} className="px-3 py-2 hover:bg-gray-700 rounded-l-lg transition-colors text-white">
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowKeySelector(!showKeySelector)}
              className="px-3 py-2 hover:bg-gray-700 transition-colors text-sm font-medium min-w-[60px] text-center"
            >
              <span className="text-gray-400 text-xs">Tom </span>
              <span className="text-primary-400 font-bold">{selectedKey}</span>
            </button>
            <button onClick={transposeUp} className="px-3 py-2 hover:bg-gray-700 rounded-r-lg transition-colors text-white">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Font size */}
          <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg">
            <button
              onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
              className="px-2 py-2 hover:bg-gray-700 rounded-l-lg transition-colors text-white text-xs"
            >
              A
            </button>
            <button
              onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
              className="px-2 py-2 hover:bg-gray-700 rounded-r-lg transition-colors text-white text-base font-bold"
            >
              A
            </button>
          </div>

          {/* Auto scroll */}
          <button
            onClick={() => setAutoScrollSpeed(prev => prev === 0 ? 1 : prev === 1 ? 2 : prev === 2 ? 3 : 0)}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              autoScrollSpeed > 0
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <ScrollText className="w-4 h-4 inline mr-1" />
            {autoScrollSpeed > 0 ? `${autoScrollSpeed}x` : 'Rolagem'}
          </button>

          {/* Toggle chords */}
          <button
            onClick={() => setShowChords(!showChords)}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              showChords
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
          >
            Acordes
          </button>

          {/* Options */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors ml-auto"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Key selector dropdown */}
        {showKeySelector && (
          <div className="absolute top-full left-0 right-0 bg-gray-900 border border-gray-700 rounded-b-xl p-4 shadow-2xl z-30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Tom</h3>
              <button onClick={() => setShowKeySelector(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_KEYS.filter(k => !k.includes('m')).map(k => (
                <button
                  key={k}
                  onClick={() => { setSelectedKey(k); setShowKeySelector(false); }}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    k === selectedKey
                      ? 'bg-primary-500 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-3 mb-2">Menores</p>
            <div className="flex flex-wrap gap-2">
              {ALL_KEYS.filter(k => k.includes('m')).map(k => (
                <button
                  key={k}
                  onClick={() => { setSelectedKey(k); setShowKeySelector(false); }}
                  className={`px-3 h-10 rounded-lg text-sm font-medium transition-colors ${
                    k === selectedKey
                      ? 'bg-primary-500 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Options panel */}
        {showOptions && (
          <div className="absolute top-full right-4 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl z-30 w-64">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Opções da cifra</h3>
              <button onClick={() => setShowOptions(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <button onClick={handlePrint} className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm">
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button onClick={handleShare} className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm">
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
              <div className="border-t border-gray-700 pt-3">
                <p className="text-gray-400 text-xs mb-2">Tamanho da fonte</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setFontSize(prev => Math.max(10, prev - 1))} className="p-1 bg-gray-800 rounded text-white">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-white text-sm min-w-[30px] text-center">{fontSize}px</span>
                  <button onClick={() => setFontSize(prev => Math.min(24, prev + 1))} className="p-1 bg-gray-800 rounded text-white">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {cifra.capo > 0 && (
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-gray-400 text-xs">Capotraste</p>
                  <p className="text-white font-medium">{cifra.capo}ª casa</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chord Diagrams */}
      {showChords && chords.length > 0 && selectedInstrument === 'violao' && (
        <div className="mb-6 print:mb-4">
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {chords.slice(0, 8).map(chord => {
              const diagram = getChordDiagram(chord);
              if (!diagram) return null;
              return (
                <div key={chord} className="flex-shrink-0 text-center">
                  <ChordDiagramSVG diagram={diagram} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cifra Content */}
      <div
        ref={contentRef}
        className="font-mono leading-relaxed"
        style={{ fontSize: `${fontSize}px` }}
      >
        {/* Key info */}
        <div className="mb-6">
          <span className="text-gray-400">Tom: </span>
          <span className="text-primary-400 font-bold text-lg">{selectedKey}</span>
          {cifra.capo > 0 && (
            <span className="text-gray-500 ml-4">Capo: {cifra.capo}ª casa</span>
          )}
        </div>

        {/* Lines */}
        {transposedContent.split('\n').map((line, idx) => renderLine(line, idx))}
      </div>

      {/* Bottom toolbar (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-4 py-3 flex items-center justify-around sm:hidden print:hidden z-30">
        <button
          onClick={() => setAutoScrollSpeed(prev => prev === 0 ? 1 : prev === 1 ? 2 : prev === 2 ? 3 : 0)}
          className={`flex flex-col items-center gap-1 text-xs ${autoScrollSpeed > 0 ? 'text-primary-400' : 'text-gray-400'}`}
        >
          <ScrollText className="w-5 h-5" />
          Rolagem
        </button>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="flex flex-col items-center gap-1 text-xs text-gray-400"
        >
          <Settings2 className="w-5 h-5" />
          Opções
        </button>
      </div>
    </div>
  );
};

// =============================================
// SVG Chord Diagram Component
// =============================================

interface ChordDiagramSVGProps {
  diagram: ChordDiagram;
}

const ChordDiagramSVG: React.FC<ChordDiagramSVGProps> = ({ diagram }) => {
  const { name, frets, baseFret, barres } = diagram;
  const numStrings = 6;
  const numFrets = 5;
  const stringSpacing = 16;
  const fretSpacing = 18;
  const startX = 14;
  const startY = 30;
  const width = startX * 2 + stringSpacing * (numStrings - 1);
  const height = startY + fretSpacing * numFrets + 30;

  return (
    <div className="inline-flex flex-col items-center">
      <span className="text-primary-400 font-bold text-sm mb-1">{name}</span>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="text-gray-300">
        {/* Nut or fret number */}
        {baseFret === 1 ? (
          <rect x={startX - 1} y={startY - 2} width={stringSpacing * (numStrings - 1) + 2} height={3} fill="currentColor" rx={1} />
        ) : (
          <text x={startX - 10} y={startY + fretSpacing / 2 + 4} fontSize="10" fill="#9CA3AF" textAnchor="end">
            {baseFret}fr
          </text>
        )}

        {/* Fret lines */}
        {Array.from({ length: numFrets + 1 }, (_, i) => (
          <line
            key={`fret-${i}`}
            x1={startX}
            y1={startY + i * fretSpacing}
            x2={startX + stringSpacing * (numStrings - 1)}
            y2={startY + i * fretSpacing}
            stroke="#4B5563"
            strokeWidth={1}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: numStrings }, (_, i) => (
          <line
            key={`string-${i}`}
            x1={startX + i * stringSpacing}
            y1={startY}
            x2={startX + i * stringSpacing}
            y2={startY + numFrets * fretSpacing}
            stroke="#6B7280"
            strokeWidth={1}
          />
        ))}

        {/* Barres */}
        {barres.map((barre, idx) => {
          const barreStrings = frets.reduce<number[]>((acc, f, i) => {
            if (f === barre) acc.push(i);
            return acc;
          }, []);
          if (barreStrings.length < 2) return null;
          const first = Math.min(...barreStrings);
          const last = Math.max(...barreStrings);
          const y = startY + (barre - baseFret + 0.5) * fretSpacing;
          return (
            <rect
              key={`barre-${idx}`}
              x={startX + first * stringSpacing - 4}
              y={y - 5}
              width={(last - first) * stringSpacing + 8}
              height={10}
              rx={5}
              fill="#10B981"
              opacity={0.8}
            />
          );
        })}

        {/* Finger dots */}
        {frets.map((fret, stringIdx) => {
          if (fret <= 0) return null;
          // Skip if it's the barre fret (already drawn)
          if (barres.includes(fret)) return null;
          const x = startX + stringIdx * stringSpacing;
          const y = startY + (fret - baseFret + 0.5) * fretSpacing;
          return (
            <circle
              key={`dot-${stringIdx}`}
              cx={x}
              cy={y}
              r={6}
              fill="#10B981"
            />
          );
        })}

        {/* Open/Muted string indicators */}
        {frets.map((fret, stringIdx) => {
          const x = startX + stringIdx * stringSpacing;
          if (fret === 0) {
            return (
              <circle
                key={`open-${stringIdx}`}
                cx={x}
                cy={startY - 10}
                r={4}
                fill="none"
                stroke="#9CA3AF"
                strokeWidth={1.5}
              />
            );
          }
          if (fret === -1) {
            return (
              <text
                key={`muted-${stringIdx}`}
                x={x}
                y={startY - 6}
                fontSize="10"
                fill="#9CA3AF"
                textAnchor="middle"
              >
                ×
              </text>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

export default CifraPage;
