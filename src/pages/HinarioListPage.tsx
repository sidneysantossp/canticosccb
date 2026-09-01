import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ChevronRight, Clock3, Music2, Search, TrendingUp } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { generateBreadcrumbSchema, generateItemListSchema } from '@/utils/schemaGenerator';
import { fetchHinarioList, type HinarioHymn } from '@/api/hinario';
import { fetchMergedPublicCifrasList } from '@/lib/cifras-v2';
import { buildHinarioUrl } from '@/utils/hinarioSeo';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const HYMNS_PER_RANGE = 50;
const HINARIO_RANGES = Array.from({ length: 10 }, (_, index) => {
  const start = index * HYMNS_PER_RANGE + 1;
  const end = Math.min(480, start + HYMNS_PER_RANGE - 1);
  return { key: `${start}-${end}`, start, end, label: `${start}–${end}` };
});
const formatHymnNumber = (number: number) => String(number).padStart(2, '0');
const getHymnTitle = (title: string, number: number) => title
  .replace(new RegExp(`^\\s*hino\\s*0?${number}\\s*(?:ccb)?\\s*[-–—:.]*\\s*`, 'i'), '')
  .replace(/^\s*hino\s*(?:n[ºo.]?\s*)?\d+\s*(?:ccb)?\s*[-–—:.]*\s*/i, '')
  .trim() || title;
const getCifraHymnNumber = (title: string, hinarioNumber?: number | null) => {
  const directNumber = Number(hinarioNumber || 0);
  if (directNumber >= 1 && directNumber <= 480) return directNumber;
  const match = title.match(/^\s*hino\s*(\d{1,3})\b/i);
  const number = Number(match?.[1] || 0);
  return number >= 1 && number <= 480 ? number : null;
};

const HinarioListPage: React.FC = () => {
  const [hymns, setHymns] = useState<HinarioHymn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRange, setActiveRange] = useState<string | null>(null);
  const [sortByViews, setSortByViews] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const loadHymns = async () => {
      try {
        setIsLoading(true);
        const [publishedHymns, cifraCatalog] = await Promise.all([
          fetchHinarioList({ is_active: true }),
          fetchMergedPublicCifrasList(),
        ]);
        const byNumber = new Map(publishedHymns.map((hymn) => [hymn.numero, hymn]));
        for (const cifra of cifraCatalog) {
          const number = getCifraHymnNumber(cifra.title, 'hinario_numero' in cifra ? cifra.hinario_numero : null);
          if (!number || byNumber.has(number)) continue;
          byNumber.set(number, {
            id: number,
            numero: number,
            titulo: cifra.title,
            subtitulo: null,
            conteudo: '',
            categoria: 'hinario5',
            tags: null,
            views_count: cifra.views_count || 0,
            is_active: true,
            created_at: cifra.created_at,
            updated_at: cifra.updated_at,
          });
        }
        setHymns(Array.from(byNumber.values()).sort((first, second) => first.numero - second.numero));
      } catch (error) {
        console.error('Erro ao carregar hinário:', error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadHymns();
  }, []);

  const normalizedQuery = normalize(searchTerm.trim());
  const selectedRange = HINARIO_RANGES.find((range) => range.key === activeRange) || null;
  const searchResults = useMemo(() => hymns.filter((hymn) => {
    if (!normalizedQuery) return true;
    const number = String(hymn.numero);
    return normalize(hymn.titulo).includes(normalizedQuery) || number === searchTerm.trim() || number.startsWith(searchTerm.trim());
  }), [hymns, normalizedQuery, searchTerm]);
  const visibleHymns = useMemo(() => {
    const inRange = normalizedQuery || !selectedRange ? searchResults : searchResults.filter((hymn) => hymn.numero >= selectedRange.start && hymn.numero <= selectedRange.end);
    return [...inRange].sort((first, second) => (sortByViews ? second.views_count - first.views_count || first.numero - second.numero : first.numero - second.numero));
  }, [normalizedQuery, searchResults, selectedRange, sortByViews]);
  const suggestions = searchTerm.trim() ? searchResults.slice(0, 5) : [];
  const showResults = () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const selectRange = (rangeKey: string) => {
    setActiveRange(rangeKey);
    setSearchTerm('');
    setSortByViews(false);
    window.setTimeout(showResults, 0);
  };

  return (
    <>
      <SEOHead
        title="Hinário CCB Completo - Letras dos 480 Hinos"
        description="Leia as letras dos 480 hinos do Hinário 5 da CCB. Navegue por número, título e categoria no hinário completo da comunidade CCB."
        keywords="hinário ccb completo, 480 hinos ccb, letras dos hinos ccb, hinário 5, hino 1 ccb, hino 480 ccb"
        canonical="/hinario"
        schemaData={[
          generateBreadcrumbSchema([{ name: 'Início', url: '/' }, { name: 'Hinário', url: '/hinario' }]),
          generateItemListSchema({
            name: 'Hinário CCB', description: 'Lista dos hinos do Hinário 5 da comunidade CCB.', url: '/hinario',
            items: hymns.slice(0, 120).map((hymn) => ({ name: `Hino ${hymn.numero} CCB - ${hymn.titulo}`, url: buildHinarioUrl(hymn.numero, hymn.titulo) })),
          }),
        ]}
      />

      <section className="relative isolate min-h-[280px] overflow-hidden sm:min-h-[360px]" aria-label="Capa do Hinário CCB">
        <img src="/images/hinario/hero-hinario-ccb.png" alt="Hinário de Louvores e Súplicas a Deus sobre uma mesa" className="absolute inset-0 -z-20 h-full w-full object-cover object-[68%_center]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background-primary via-background-primary/85 to-background-primary/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background-primary/60 to-transparent" />
        <div className="mx-auto flex min-h-[280px] max-w-6xl flex-col justify-center px-4 py-10 sm:min-h-[360px] sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-300">Hinário CCB</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-primary-500 sm:text-5xl">Encontre o hino que você procura</h1>
            <p className="mt-3 text-base text-white/85 sm:text-lg">Letras dos 480 hinos do Hinário CCB.</p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <section className="py-9 sm:py-12">
            <div className="relative">
              <input type="text" inputMode="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Digite o número ou nome do hino" aria-label="Buscar hino por número ou nome" className="w-full appearance-none rounded-2xl border border-primary-500/60 bg-background-secondary py-4 pr-14 text-base text-white shadow-lg shadow-black/10 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" style={{ paddingLeft: '2rem' }} />
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-primary-400" style={{ right: '1.25rem' }} />
              {suggestions.length > 0 ? <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#171a1a] shadow-2xl shadow-black/40">
                {suggestions.map((hymn) => <Link key={hymn.id} to={buildHinarioUrl(hymn.numero, hymn.titulo)} className="flex items-center gap-3 border-b border-white/10 px-4 py-3 text-sm transition-colors last:border-0 hover:bg-white/[0.05]">
                  <span className="font-mono font-semibold text-primary-400">{formatHymnNumber(hymn.numero)}</span><span className="min-w-0 flex-1 truncate text-white">{hymn.titulo}</span><ArrowRight className="h-4 w-4 text-gray-500" />
                </Link>)}
              </div> : null}
            </div>

            <nav aria-label="Atalhos do Hinário" className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
              <button type="button" onClick={showResults} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-background-secondary px-3 py-3 text-sm font-medium text-white transition hover:border-primary-500/50 hover:bg-white/[0.04]"><Clock3 className="h-4 w-4 text-primary-400" /> Continuar lendo</button>
              <button type="button" onClick={() => { setSortByViews(true); window.setTimeout(showResults, 0); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-background-secondary px-3 py-3 text-sm font-medium text-white transition hover:border-primary-500/50 hover:bg-white/[0.04]"><TrendingUp className="h-4 w-4 text-primary-400" /> Mais acessados</button>
              <Link to="/hinos-cantados-ccb" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-background-secondary px-3 py-3 text-sm font-medium text-white transition hover:border-primary-500/50 hover:bg-white/[0.04]"><Music2 className="h-4 w-4 text-primary-400" /> Hinos cantados</Link>
              <Link to="/cifras" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-background-secondary px-3 py-3 text-sm font-medium text-white transition hover:border-primary-500/50 hover:bg-white/[0.04]"><BookOpen className="h-4 w-4 text-primary-400" /> Cifras</Link>
            </nav>
          </section>

          <section className="pt-8" aria-labelledby="browse-hinario">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="browse-hinario" className="text-2xl font-semibold text-white">Navegue pelo Hinário</h2><button type="button" onClick={() => { setSearchTerm(''); setSortByViews(false); setActiveRange(null); }} className="text-sm text-primary-300 transition hover:text-primary-200">Ver todos os 480 hinos</button></div>
            <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-5">
              {HINARIO_RANGES.map((range) => {
                const isActive = activeRange === range.key && !normalizedQuery;
                return <button key={range.key} type="button" onClick={() => selectRange(range.key)} className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${isActive ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-white/10 bg-background-secondary text-gray-300 hover:border-primary-500/40 hover:text-white'}`}>{range.label}</button>;
              })}
            </div>
          </section>

          <section ref={resultsRef} className="scroll-mt-6 pt-16 sm:pt-20" aria-live="polite">
            {isLoading ? null : visibleHymns.length === 0 ? <div className="rounded-2xl border border-white/10 bg-background-secondary px-6 py-16 text-center"><BookOpen className="mx-auto h-10 w-10 text-gray-600" /><h3 className="mt-4 text-lg font-medium text-white">Nenhum hino encontrado</h3><p className="mt-1 text-sm text-text-muted">Tente outro número ou trecho do título.</p></div> : <div className="w-full space-y-1">
              {visibleHymns.map((hymn) => <Link key={hymn.id} to={buildHinarioUrl(hymn.numero, hymn.titulo)} className="group flex w-full items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-primary-500/10 sm:px-4">
                <span className="w-10 shrink-0 font-mono text-sm font-semibold text-primary-400 transition-colors group-hover:text-primary-300">{formatHymnNumber(hymn.numero)}</span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-white transition-colors group-hover:text-primary-400">{getHymnTitle(hymn.titulo, hymn.numero)}</span>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-300" />
              </Link>)}
            </div>}
          </section>
      </main>
    </>
  );
};

export default HinarioListPage;
