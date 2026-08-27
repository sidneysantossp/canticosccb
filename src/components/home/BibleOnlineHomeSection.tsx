import React, { useState } from 'react';
import { BookOpen, Bookmark, ChevronRight, Clock3, Search, Sparkles, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const quickLinks = [
  { label: 'Livros', detail: 'Explore todos os livros da Bíblia.', icon: BookOpen, to: '/biblia-ccb#livros' },
  { label: 'Temas', detail: 'Encontre versículos por tema.', icon: Sparkles, to: '/biblia-ccb/temas' },
  { label: 'Personagens', detail: 'Conheça histórias e jornadas.', icon: Users, to: '/biblia-ccb/personagens' },
  { label: 'Dicionário', detail: 'Consulte termos e expressões.', icon: BookOpen, to: '/biblia-ccb/dicionario' },
];

const recentLinks = [
  { label: 'Salmo 23', detail: 'Salmos 23', to: '/biblia-ccb/salmos/23' },
  { label: 'João 3:16', detail: 'João 3:16', to: '/biblia-ccb/joao/3' },
  { label: 'Filipenses 4:13', detail: 'Filipenses 4:13', to: '/biblia-ccb/filipenses/4' },
  { label: 'Provérbios 3:5-6', detail: 'Provérbios 3:5-6', to: '/biblia-ccb/proverbios/3' },
];

const BibleOnlineHomeSection: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate(`/biblia-ccb/busca?q=${encodeURIComponent(value)}`);
    else navigate('/biblia-ccb/busca');
  };

  return <section className="mb-12 px-6" aria-label="Bíblia Online">
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#121212] shadow-2xl shadow-black/25">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="relative min-h-[560px] overflow-hidden p-6 sm:p-9 lg:p-12">
          <img src="/images/bible/hero-bible-online.webp" alt="Bíblia aberta sobre uma mesa" className="absolute inset-0 h-full w-full object-cover opacity-55" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080a09] via-[#0b0d0c]/90 to-[#0b0d0c]/40" />
          <div className="relative z-10 max-w-xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-primary-400">Leitura e inspiração</p>
            <h2 className="text-4xl font-black tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">Bíblia Online</h2>
            <p className="mt-3 max-w-md text-base leading-7 text-gray-300 sm:text-lg">Leia, pesquise e encontre inspiração.</p>
            <div className="relative mt-7 flex max-w-lg items-center">
              <Search className="pointer-events-none absolute left-4 h-5 w-5 text-gray-400" />
              <form onSubmit={submitSearch} className="relative w-full"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /><input aria-label="Buscar na Bíblia" value={query} onChange={(event) => setQuery(event.target.value)} className="h-14 w-full rounded-xl border border-white/15 bg-black/35 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-primary-500" placeholder="Buscar na Bíblia (ex.: Salmo 23, João 3:16)" /></form>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              {quickLinks.map(({ label, detail, icon: Icon, to }) => <Link key={label} to={to} className="group rounded-xl border border-white/10 bg-black/25 p-4 transition hover:border-primary-500/60 hover:bg-primary-500/10"><Icon className="h-6 w-6 text-primary-400" /><span className="mt-3 block text-sm font-bold text-white group-hover:text-primary-300">{label}<ChevronRight className="float-right mt-0.5 h-4 w-4 text-gray-500 transition group-hover:text-primary-300" /></span><span className="mt-1 block text-xs leading-5 text-gray-500">{detail}</span></Link>)}
            </div>
            <Link to="/biblia-ccb" className="mt-6 inline-flex h-12 items-center gap-3 rounded-xl bg-primary-500 px-6 text-sm font-bold text-gray-950 transition hover:bg-primary-400"><BookOpen className="h-5 w-5" />Explorar a Bíblia<ChevronRight className="h-4 w-4" /></Link>
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/20 p-6 sm:p-9 lg:border-l lg:border-t-0 lg:p-10">
          <div className="mb-6 flex items-center gap-3"><Clock3 className="h-5 w-5 text-primary-400" /><h3 className="text-xl font-bold text-white">Acessos recentes</h3></div>
          <div className="space-y-1">{recentLinks.map(({ label, detail, to }) => <Link key={label} to={to} className="group flex items-center gap-3 border-b border-white/10 py-4 transition hover:border-primary-500/50"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500/10"><Bookmark className="h-5 w-5 text-primary-400" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white group-hover:text-primary-300">{label}</p><p className="mt-1 text-xs text-gray-500">{detail}</p></div><ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-primary-300" /></Link>)}</div>
          <Link to="/biblia-ccb" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-400 hover:text-primary-300">Ver todos os acessos <ChevronRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  </section>;
};

export default BibleOnlineHomeSection;
