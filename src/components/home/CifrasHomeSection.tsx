import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ChevronRight, Clock3, Eye, MoreVertical, Music, Play, TrendingUp } from 'lucide-react';
import { Cifra, INSTRUMENTS } from '@/api/cifras';
import { fetchMergedPublicCifrasListDetailed, type PublicCifraPageData } from '@/lib/cifras-v2';
import { CIFRA_V2_INSTRUMENTS } from '@/types/cifras-v2';
import { buildCifraUrl } from '@/utils/cifraUrl';

type DisplayCifra = Cifra | PublicCifraPageData;
const INSTRUMENT_OPTIONS = [...INSTRUMENTS, ...CIFRA_V2_INSTRUMENTS.filter((x) => !INSTRUMENTS.some((i) => i.value === x.value))];
const labelFor = (value: string) => INSTRUMENT_OPTIONS.find((x) => x.value === value)?.label || value;
const heroImage = '/images/cifras/hero-violao.png';

const CifrasHomeSection: React.FC = () => {
  const [items, setItems] = useState<DisplayCifra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [warning, setWarning] = useState(false);
  const [instrument, setInstrument] = useState('all');
  const [sort, setSort] = useState<'popular' | 'recent'>('popular');

  const load = async () => {
    try { setLoading(true); setError(false); const result = await fetchMergedPublicCifrasListDetailed(); setItems(result.items); setWarning(result.unavailableSources.length > 0); }
    catch (err) { console.error('[CifrasHomeSection]', err); setItems([]); setError(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const visible = useMemo(() => {
    const filtered = instrument === 'all' ? items : items.filter((x) => x.instrument === instrument);
    return [...filtered].sort((a, b) => sort === 'popular' ? (b.views_count || 0) - (a.views_count || 0) : new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [items, instrument, sort]);

  if (loading) return <section className="mb-12" aria-label="Cifras"><h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">Cifras</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-24 animate-pulse rounded-2xl bg-gray-800/50" />)}</div></section>;

  return <section className="mb-12" aria-label="Cifras">
    <div className="rounded-[2rem] bg-[#121212] p-5 shadow-2xl shadow-black/25 sm:p-7">
      <div className="mb-7 flex items-start justify-between gap-4"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary-400">Estude e toque</p><h2 className="text-3xl font-bold text-white">Cifras</h2><p className="mt-2 max-w-xl text-sm text-gray-400">Encontre cifras de hinos CCB para tocar no instrumento que você ama.</p>{warning && <p className="mt-1 text-xs text-amber-200">Parte do catálogo está temporariamente indisponível.</p>}</div><Link to="/cifras" className="shrink-0 text-sm font-semibold text-primary-400 hover:text-primary-300">Ver todas <ChevronRight className="ml-1 inline h-4 w-4" /></Link></div>
      {error ? <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-gray-300"><AlertCircle className="h-5 w-5 text-red-300" /><div><p className="font-medium text-white">Não foi possível carregar as cifras agora.</p><button type="button" onClick={load} className="mt-2 text-primary-300">Tentar novamente</button></div></div> : visible.length === 0 ? <div className="rounded-2xl border border-gray-700/60 p-5 text-sm text-gray-400">Ainda não há cifras verificadas em destaque.</div> : <>
        <div className="mb-6 flex flex-wrap gap-2">{[{ value: 'all', label: 'Todos' }, ...INSTRUMENT_OPTIONS.filter((x) => ['violao', 'ukulele', 'teclado'].includes(x.value))].map((x) => <button key={x.value} type="button" onClick={() => setInstrument(x.value)} className={`rounded-full border px-4 py-2 text-xs font-medium transition ${instrument === x.value ? 'border-primary-500 bg-primary-500/15 text-primary-300' : 'border-gray-700 text-gray-400 hover:border-primary-500/60 hover:text-white'}`}>{x.label}</button>)}</div>
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.2fr)]">
          <Link to={buildCifraUrl(visible[0].instrument, visible[0].slug)} className="group relative flex min-h-[360px] flex-col justify-end overflow-hidden rounded-2xl border border-gray-700/70 bg-gray-950 p-6 sm:min-h-[400px]">
            <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
            <div className="relative"><span className="mb-3 inline-flex rounded bg-primary-500 px-2 py-1 text-[11px] font-bold uppercase text-gray-950">Destaque</span><h3 className="text-2xl font-bold text-white">{visible[0].title}</h3><p className="mt-1 text-sm text-gray-300">{labelFor(visible[0].instrument)} · Tom {visible[0].original_key}</p><span className="mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-gray-950"><Play className="h-5 w-5 fill-current" /></span></div>
          </Link>
          <div><div className="mb-3 flex items-center justify-between"><div className="flex gap-1 rounded-lg bg-gray-900 p-1"><button type="button" onClick={() => setSort('popular')} className={`rounded-md px-3 py-2 text-xs font-medium ${sort === 'popular' ? 'bg-primary-500/15 text-primary-300' : 'text-gray-500 hover:text-white'}`}><TrendingUp className="mr-1 inline h-3.5 w-3.5" />Mais populares</button><button type="button" onClick={() => setSort('recent')} className={`rounded-md px-3 py-2 text-xs font-medium ${sort === 'recent' ? 'bg-primary-500/15 text-primary-300' : 'text-gray-500 hover:text-white'}`}><Clock3 className="mr-1 inline h-3.5 w-3.5" />Recentes</button></div><span className="text-xs text-gray-500">{visible.length} disponíveis</span></div>
            <div className="space-y-2">{visible.slice(1, 7).map((x) => <Link key={x.id} to={buildCifraUrl(x.instrument, x.slug)} className="group flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/80 p-3 transition hover:border-primary-500/60 hover:bg-gray-800"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-800">{x.cover_url ? <img src={x.cover_url} alt="" className="h-full w-full object-cover" /> : <Music className="h-5 w-5 text-gray-500" />}</div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-white group-hover:text-primary-300">{x.title}</h3><p className="mt-1 truncate text-xs text-gray-500"><span className="mr-2 rounded bg-primary-500/15 px-1.5 py-0.5 text-primary-300">{x.original_key}</span>{labelFor(x.instrument)}</p></div><span className="hidden items-center gap-1 text-[11px] text-gray-600 sm:flex"><Eye className="h-3 w-3" />{x.views_count || 0}</span><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary-500 text-primary-300"><Play className="h-3.5 w-3.5 fill-current" /></span><MoreVertical className="hidden h-4 w-4 text-gray-600 sm:block" /></Link>)}</div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-800 bg-gradient-to-r from-primary-950/50 to-gray-900 p-4"><div className="flex items-center gap-3"><Music className="h-6 w-6 text-primary-400" /><p className="text-sm text-gray-300">Explore milhares de hinos com cifras revisadas e compatíveis com diversos instrumentos.</p></div><Link to="/cifras" className="hidden shrink-0 items-center rounded-full border border-primary-500 px-5 py-2 text-sm font-semibold text-primary-300 hover:bg-primary-500/10 sm:inline-flex">Ver todas as cifras <ChevronRight className="ml-2 h-4 w-4" /></Link></div>
      </>}
    </div>
  </section>;
};
export default CifrasHomeSection;
