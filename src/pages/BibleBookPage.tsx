import React, { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import BibleSearchBox from '@/components/bible/BibleSearchBox';
import BibleTopNav from '@/components/bible/BibleTopNav';
import { buildBibleChapterPath, getBibleBook, getBibleChapterTitle } from '@/data/bibleCatalog';
import { generateBreadcrumbSchema, generateItemListSchema } from '@/utils/schemaGenerator';

const BibleBookPage: React.FC = () => {
  const { bookSlug } = useParams<{ bookSlug: string }>();
  const book = getBibleBook(bookSlug);
  const schemaData = useMemo(() => book ? [generateBreadcrumbSchema([{ name: 'Bíblia CCB', url: '/biblia-ccb' }, { name: book.name, url: `/biblia-ccb/${book.slug}` }]), generateItemListSchema({ name: `Capítulos de ${book.name}`, description: `Todos os ${book.chapters} capítulos do livro de ${book.name}.`, url: `/biblia-ccb/${book.slug}`, items: Array.from({ length: book.chapters }, (_, index) => ({ name: `${book.name} ${index + 1}`, url: buildBibleChapterPath(book, index + 1), position: index + 1 })) }), { '@context': 'https://schema.org', '@type': 'Book', name: book.name, inLanguage: 'pt-BR' }] : [], [book]);
  if (!book) return <Navigate to="/biblia-ccb" replace />;

  return <div className="min-h-screen bg-[#0d0f0e] text-white">
    <SEOHead exactTitle title={`${book.name}: Todos os Capítulos | Bíblia CCB`} description={`Leia ${book.name} na Bíblia Online CCB. Encontre todos os ${book.chapters} capítulos, navegue com rapidez, use a busca por referência e consulte a tradução ACF.`} canonical={`/biblia-ccb/${book.slug}`} schemaData={schemaData} />
    <BibleTopNav />
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <Link to="/biblia-ccb" className="inline-flex items-center gap-2 text-sm text-primary-300 hover:text-primary-200"><ArrowLeft className="h-4 w-4" /> Voltar para todos os livros</Link>
      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr,360px] lg:items-end"><div><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary-500/30 bg-primary-500/10"><BookOpen className="h-6 w-6 text-primary-400" /></span><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">{book.testament}</span></div><h1 className="mt-6 text-5xl font-black tracking-[-0.05em] sm:text-6xl">{book.name}</h1><p className="mt-3 text-gray-400">{book.chapters} capítulos · Tradução de referência ACF</p></div><BibleSearchBox compact /></div>
      <section className="mt-12 border-t border-white/10 pt-8"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">Escolha um capítulo</h2><span className="text-xs text-gray-600">{book.chapters} capítulos</span></div><div className="grid grid-cols-[repeat(auto-fill,44px)] gap-2">{Array.from({ length: book.chapters }, (_, index) => { const chapter = index + 1; const title = getBibleChapterTitle(book.slug, chapter); return <Link key={chapter} to={buildBibleChapterPath(book, chapter)} aria-label={`${book.name} capítulo ${chapter}${title ? `: ${title}` : ''}`} title={title || `Capítulo ${chapter}`} className="group flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-xs font-bold text-gray-300 transition-all hover:-translate-y-0.5 hover:border-primary-500/50 hover:bg-primary-500/10 hover:text-primary-300">{chapter}<ArrowRight className="ml-0.5 hidden h-2.5 w-2.5 group-hover:block" /></Link>; })}</div></section>
    </main>
  </div>;
};

export default BibleBookPage;
