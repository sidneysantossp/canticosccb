import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BookOpen, Menu, Search } from 'lucide-react';

const navItems = [
  { label: 'Livros', to: '/biblia-ccb#livros' },
  { label: 'Temas', to: '/biblia-ccb/temas' },
  { label: 'Personagens', to: '/biblia-ccb/personagens' },
  { label: 'Dicionário', to: '/biblia-ccb/dicionario' },
];

const BibleTopNav: React.FC = () => (
  <header className="relative z-40 border-b border-white/10 bg-[#0d0f0e]/95 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-10">
      <Link to="/biblia-ccb" className="flex shrink-0 items-center gap-2 text-white" aria-label="Bíblia CCB - início">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary-500/30 bg-primary-500/10">
          <BookOpen className="h-5 w-5 text-primary-400" />
        </span>
        <span className="text-base font-black tracking-[-0.02em]">Bíblia CCB</span>
      </Link>

      <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação da Bíblia">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className="rounded-full px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white">
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <Link to="/biblia-ccb/busca" aria-label="Buscar na Bíblia" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-300 transition-colors hover:border-primary-500/50 hover:text-primary-300">
          <Search className="h-4 w-4" />
        </Link>
        <span className="hidden rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-xs font-bold text-primary-300 sm:inline-flex">ACF</span>
        <Link to="/cadastro" className="hidden rounded-full border border-primary-500/70 px-4 py-2 text-sm font-semibold text-primary-300 transition-colors hover:bg-primary-500/10 md:inline-flex">Registrar</Link>
        <Link to="/login" className="hidden rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-gray-200 md:inline-flex">Entrar</Link>
        <Link to="/biblia-ccb#livros" aria-label="Abrir lista de livros" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-300 lg:hidden">
          <Menu className="h-4 w-4" />
        </Link>
      </div>
    </div>
  </header>
);

export default BibleTopNav;

