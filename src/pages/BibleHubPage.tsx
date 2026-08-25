import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Headphones, Heart, Quote, Search, Sparkles, Users } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import BibleSearchBox from '@/components/bible/BibleSearchBox';
import { bibleBooks } from '@/data/bibleCatalog';
import { generateBreadcrumbSchema, generateItemListSchema } from '@/utils/schemaGenerator';

const quickActions = [
  { label: 'Continuar lendo', detail: 'Retome seu último capítulo', icon: Clock3, to: '/biblia-ccb/genesis/1-a-criacao-do-mundo' },
  { label: 'Ouvir a Bíblia', detail: 'Capítulos narrados', icon: Headphones, to: '/biblia-narrada' },
  { label: 'Versículo do dia', detail: 'Uma leitura para hoje', icon: Sparkles, to: '/biblia-ccb/genesis/1-a-criacao-do-mundo' },
];

const discoveryCards = [
  { eyebrow: 'GUIAS DE LEITURA', title: 'Planos para cada momento', copy: 'Percursos organizados para transformar a leitura em um hábito claro e consistente.', icon: Heart, to: '/biblia-ccb/temas' },
  { eyebrow: 'PERSONAGENS', title: 'Histórias e jornadas', copy: 'Encontre passagens relacionadas aos principais personagens e suas trajetórias.', icon: Users, to: '/biblia-ccb/personagens' },
  { eyebrow: 'DICIONÁRIO', title: 'Entenda cada termo', copy: 'Consulte palavras, lugares e conceitos enquanto você lê, sem perder o contexto.', icon: Quote, to: '/biblia-ccb/dicionario' },
];

const BibleHubPage: React.FC = () => {
  const oldBooks = bibleBooks.filter((book) => book.testament === 'Antigo Testamento');
  const newBooks = bibleBooks.filter((book) => book.testament === 'Novo Testamento');
  const schemaData = useMemo(() => ([
    generateBreadcrumbSchema([{ name: 'Início', url: '/' }, { name: 'Bíblia CCB', url: '/biblia-ccb' }]),
    generateItemListSchema({
      name: 'Livros da Bíblia CCB',
      description: 'Navegação pelos 66 livros da Bíblia na tradução de referência ACF.',
      url: '/biblia-ccb',
      items: bibleBooks.map((book, index) => ({ name: book.name, url: `/biblia-ccb/${book.slug}`, position: index + 1 })),
    }),
    { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Bíblia Online CCB', description: 'Bíblia Online CCB organizada por livros, capítulos, temas, personagens e recursos de leitura.', url: 'https://www.canticosccb.com.br/biblia-ccb', inLanguage: 'pt-BR' },
  ]), []);

  return (
    <div className="min-h-screen bg-[#0d0f0e] text-white">
      <SEOHead exactTitle title="Bíblia Online CCB | Leia por Livro, Capítulo e Tema" description="Leia a Bíblia Online CCB com navegação rápida por livros e capítulos, busca inteligente, recursos de leitura, temas, personagens e referência ACF." keywords="bíblia online ccb, bíblia ccb, bíblia acf online, livros da bíblia, capítulos da bíblia" canonical="/biblia-ccb" ogImage="/images/bible/hero-bible-online.webp" schemaData={schemaData} />
      <section className="relative isolate min-h-[520px] overflow-hidden border-b border-white/10 sm:min-h-[610px]">
        <img src="/images/bible/hero-bible-online.webp" alt="Bíblia aberta sobre uma mesa de madeira" className="absolute inset-0 -z-30 h-full w-full object-cover object-[68%_center]" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(8,10,9,0.98)_0%,rgba(8,10,9,0.9)_34%,rgba(8,10,9,0.34)_72%,rgba(8,10,9,0.28)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0d0f0e] via-transparent to-black/20" />
        <div className="mx-auto flex min-h-[520px] max-w-[1440px] items-center px-5 py-16 sm:min-h-[610px] sm:px-8 lg:px-14">
          <div className="w-full max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center gap-2"><span className="rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-primary-300">Bíblia Digital</span><span className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-xs font-semibold text-gray-200">Tradução de referência: ACF</span></div>
            <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">Bíblia Online <span className="text-primary-500">CCB</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-300 sm:text-lg">Leia, estude e encontre passagens com uma experiência criada para ser simples no celular e completa em qualquer tela.</p>
            <div className="mt-8 max-w-2xl"><BibleSearchBox /></div>
            <p className="mt-3 text-xs text-gray-500">Experimente buscar “Gênesis 1”, “Salmos” ou o nome de um livro.</p>
          </div>
        </div>
      </section>

      <main>
        <section className="mx-auto max-w-[1360px] px-5 py-10 sm:px-8 lg:px-10"><div className="grid gap-3 md:grid-cols-3">{quickActions.map(({ label, detail, icon: Icon, to }) => <Link key={label} to={to} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-all hover:-translate-y-0.5 hover:border-primary-500/40 hover:bg-primary-500/[0.06]"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-bold text-white">{label}</span><span className="mt-0.5 block text-xs text-gray-500">{detail}</span></span><ArrowRight className="h-4 w-4 text-gray-600 transition-transform group-hover:translate-x-1 group-hover:text-primary-300" /></Link>)}</div></section>

        <section id="livros" className="scroll-mt-20 border-y border-white/10 bg-[#101311]"><div className="mx-auto max-w-[1360px] px-5 py-14 sm:px-8 lg:px-10">
          <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary-400">Navegue pela Bíblia</p><h2 className="mt-2 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Todos os livros</h2></div><Link to="/biblia-ccb/busca" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-300 hover:text-primary-200"><Search className="h-4 w-4" /> Busca avançada</Link></div>
          <div className="grid gap-10 xl:grid-cols-2">{[{ title: 'Antigo Testamento', books: oldBooks }, { title: 'Novo Testamento', books: newBooks }].map(({ title, books }) => <div key={title}><div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3"><h3 className="font-bold text-white">{title}</h3><span className="text-xs text-gray-600">{books.length} livros</span></div><div className="grid grid-cols-2 gap-x-5 sm:grid-cols-3">{books.map((book) => <Link key={book.slug} to={`/biblia-ccb/${book.slug}`} className="group flex items-center gap-2 border-b border-white/[0.055] py-3 text-sm text-gray-300 transition-colors hover:text-primary-300"><span className="w-8 shrink-0 font-mono text-[11px] font-bold text-primary-500/80">{book.abbreviation}</span><span className="truncate">{book.name}</span></Link>)}</div></div>)}</div>
        </div></section>

        <section className="mx-auto max-w-[1360px] px-5 py-16 sm:px-8 lg:px-10"><div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-primary-400">Aprofunde sua leitura</p><h2 className="mt-2 text-3xl font-black tracking-[-0.035em]">Explore além dos capítulos</h2></div><div className="grid gap-4 lg:grid-cols-3">{discoveryCards.map(({ eyebrow, title, copy, icon: Icon, to }) => <Link key={title} to={to} className="group relative min-h-60 overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(29,185,84,0.14),transparent_45%),#141715] p-6 transition-all hover:border-primary-500/40"><Icon className="h-8 w-8 text-primary-400" /><p className="mt-8 text-[11px] font-black tracking-[0.16em] text-primary-400">{eyebrow}</p><h3 className="mt-2 text-2xl font-black tracking-[-0.03em]">{title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-gray-400">{copy}</p><ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-gray-600 transition-all group-hover:translate-x-1 group-hover:text-primary-300" /></Link>)}</div></section>
      </main>
    </div>
  );
};

export default BibleHubPage;
