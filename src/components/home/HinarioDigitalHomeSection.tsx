import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Bookmark, ChevronRight, Clock3, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchHinarioList, type HinarioHymn } from '@/api/hinario';
import { buildHinarioUrl } from '@/utils/hinarioSeo';

const ranges = ['1–50', '51–100', '101–150', '151–200', '201–250', '251–300', '301–350', '351–400', '401–450', '451–480'];
const rangePaths = [
  '/hinos-1-a-120-ccb',
  '/hinos-1-a-120-ccb',
  '/hinos-1-a-120-ccb',
  '/hinos-121-a-240-ccb',
  '/hinos-121-a-240-ccb',
  '/hinos-241-a-360-ccb',
  '/hinos-241-a-360-ccb',
  '/hinos-361-a-480-ccb',
  '/hinos-361-a-480-ccb',
  '/hinos-361-a-480-ccb',
];

const HinarioDigitalHomeSection: React.FC = () => {
  const navigate = useNavigate();
  const [hymns, setHymns] = useState<HinarioHymn[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    fetchHinarioList({ is_active: true, limit: 480 }).then((items) => {
      if (active) setHymns(items.sort((a, b) => a.numero - b.numero));
    });
    return () => { active = false; };
  }, []);

  const suggestions = useMemo(() => {
    const value = query.trim().toLocaleLowerCase('pt-BR');
    if (!value) return [];
    return hymns.filter((hymn) => String(hymn.numero).includes(value) || hymn.titulo.toLocaleLowerCase('pt-BR').includes(value)).slice(0, 5);
  }, [hymns, query]);
  const featured = hymns[0];
  const preview = hymns.filter((hymn) => [1, 121, 480].includes(hymn.numero)).slice(0, 3);
  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    const match = suggestions[0] || (value && !Number.isNaN(Number(value)) ? hymns.find((hymn) => hymn.numero === Number(value)) : undefined);
    if (match) navigate(buildHinarioUrl(match.numero, match.titulo));
    else navigate('/hinario');
  };

  return <section className="mb-12 px-6" aria-label="Hinário Digital">
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">Hinário Digital</h2>
        <p className="mt-2 max-w-xl text-sm text-gray-400 sm:text-base">Leve o hinário com você. Encontre e acompanhe os 480 hinos em qualquer lugar.</p>
      </div>
      <Link to="/hinario" className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary-400 transition hover:text-primary-300 sm:inline-flex">Abrir Hinário <ChevronRight className="h-4 w-4" /></Link>
    </div>

    <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-[#121514] shadow-2xl shadow-black/20">
      <img src="/images/hinario/hero-hinario-ccb.png" alt="Hinário de Louvores e Súplicas a Deus sobre uma mesa" className="absolute inset-0 -z-20 h-full w-full object-cover object-[68%_center] opacity-60" loading="lazy" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#070a09] via-[#090d0c]/95 to-[#0a0d0c]/35" />
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
        <div className="p-6 sm:p-9 lg:p-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-400">Hinário completo</p>
          <h3 className="mt-4 max-w-md text-3xl font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-5xl">Encontre o hino que você procura</h3>
          <form onSubmit={submitSearch} className="relative mt-7 max-w-xl">
            <input aria-label="Buscar no Hinário" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Digite o número ou nome do hino" className="h-14 w-full rounded-xl border border-white/20 bg-black/35 px-4 pr-12 text-sm text-white outline-none transition placeholder:text-gray-400 focus:border-primary-500" />
            <button type="submit" aria-label="Buscar hino" className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary-400 transition hover:bg-primary-500/15"><Search className="h-5 w-5" /></button>
            {suggestions.length > 0 && <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-xl border border-white/10 bg-[#171918] shadow-xl">{suggestions.map((hymn) => <Link key={hymn.id} to={buildHinarioUrl(hymn.numero, hymn.titulo)} onClick={() => setQuery('')} className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-primary-500/10"><span className="w-8 font-bold text-primary-400">{String(hymn.numero).padStart(2, '0')}</span><span className="truncate text-white">{hymn.titulo}</span></Link>)}</div>}
          </form>
          <Link to="/hinario" className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-primary-500 px-6 text-sm font-bold text-gray-950 transition hover:bg-primary-400">Explorar o Hinário <ChevronRight className="h-4 w-4" /></Link>
        </div>
        <div className="hidden items-end justify-end p-8 lg:flex"><div className="max-w-xs rounded-xl border border-white/10 bg-black/25 p-5 backdrop-blur-sm"><BookOpen className="h-7 w-7 text-primary-400" /><p className="mt-3 text-sm font-semibold text-white">Uma leitura simples, acessível e feita para acompanhar seu ritmo.</p></div></div>
      </div>
    </div>

    {featured && <div className="mt-6"><p className="mb-3 text-sm font-bold text-white">Continue de onde parou</p><Link to={buildHinarioUrl(featured.numero, featured.titulo)} className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#141615] p-3 transition hover:border-primary-500/50 hover:bg-primary-500/5 sm:p-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 text-lg font-black text-primary-400">{String(featured.numero).padStart(2, '0')}</span><span className="min-w-0 flex-1"><span className="block text-xs text-gray-500">Hino {featured.numero}</span><span className="block truncate font-semibold text-white group-hover:text-primary-300">{featured.titulo}</span></span><span className="hidden items-center gap-2 text-xs text-gray-400 sm:flex"><span className="h-2 w-2 rounded-full bg-primary-500" /> Última leitura</span><span className="inline-flex items-center gap-1 rounded-lg border border-primary-500/70 px-3 py-2 text-xs font-semibold text-primary-300">Continuar <ChevronRight className="h-4 w-4" /></span></Link></div>}

    <div className="mt-7"><div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold text-white">Navegue pelo Hinário</h3><span className="text-xs text-gray-500">480 hinos</span></div><div className="flex gap-2 overflow-x-auto pb-1">{ranges.map((range, index) => <Link key={range} to={rangePaths[index]} className={`shrink-0 rounded-lg border px-4 py-2 text-xs font-semibold transition ${index === 0 ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-white/10 text-gray-300 hover:border-primary-500/60 hover:text-primary-300'}`}>{range}</Link>)}</div></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-3"><Link to="/hinario?ordenar=mais-acessados" className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#141615] px-4 py-3 text-sm font-semibold text-white transition hover:border-primary-500/50"><span className="text-lg text-primary-400">↗</span>Mais acessados<ChevronRight className="ml-auto h-4 w-4 text-gray-500" /></Link><Link to="/hinario?filtro=favoritos" className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#141615] px-4 py-3 text-sm font-semibold text-white transition hover:border-primary-500/50"><Bookmark className="h-5 w-5 text-primary-400" />Meus favoritos<ChevronRight className="ml-auto h-4 w-4 text-gray-500" /></Link><Link to="/hinario?filtro=historico" className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#141615] px-4 py-3 text-sm font-semibold text-white transition hover:border-primary-500/50"><Clock3 className="h-5 w-5 text-primary-400" />Histórico de leitura<ChevronRight className="ml-auto h-4 w-4 text-gray-500" /></Link></div>
    {preview.length > 0 && <div className="mt-6"><h3 className="mb-3 text-lg font-bold text-white">Alguns hinos do Hinário</h3><div className="overflow-hidden rounded-xl border border-white/10 bg-[#141615]">{preview.map((hymn) => <Link key={hymn.id} to={buildHinarioUrl(hymn.numero, hymn.titulo)} className="group flex items-center gap-4 border-b border-white/10 px-4 py-3 last:border-0 transition hover:bg-primary-500/10"><span className="w-8 font-bold text-primary-400">{String(hymn.numero).padStart(2, '0')}</span><span className="truncate text-sm font-semibold text-white group-hover:text-primary-300">{hymn.titulo}</span><ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-500 group-hover:text-primary-300" /></Link>)}</div></div>}
  </section>;
};

export default HinarioDigitalHomeSection;
