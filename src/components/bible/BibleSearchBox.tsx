import React, { useDeferredValue, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { buildBibleChapterPath, normalizeBibleSearch, searchBibleBooks } from '@/data/bibleCatalog';

interface BibleSearchBoxProps {
  compact?: boolean;
  onNavigate?: () => void;
}

const BibleSearchBox: React.FC<BibleSearchBoxProps> = ({ compact = false, onNavigate }) => {
  const navigate = useNavigate();
  const inputId = useId();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const match = deferredQuery.trim().match(/^(.*?)(?:\s+|\s*:\s*)(\d{1,3})$/);
    const bookQuery = match?.[1]?.trim() || deferredQuery;
    const chapter = match ? Number(match[2]) : undefined;
    return searchBibleBooks(bookQuery).slice(0, compact ? 4 : 7).map((book) => ({
      book,
      chapter: chapter && chapter <= book.chapters ? chapter : undefined,
    }));
  }, [compact, deferredQuery]);

  const goToResult = (bookSlug: string, chapter?: number) => {
    const result = results.find((entry) => entry.book.slug === bookSlug);
    if (!result) return;
    navigate(chapter ? buildBibleChapterPath(result.book, chapter) : `/biblia-ccb/${result.book.slug}`);
    setQuery('');
    onNavigate?.();
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const first = results[0];
    if (first) goToResult(first.book.slug, first.chapter);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={submit} className={`flex items-center rounded-2xl border border-primary-500/60 bg-[#111513]/95 shadow-[0_16px_50px_rgba(0,0,0,0.35)] transition-colors focus-within:border-primary-400 ${compact ? 'h-11 px-3' : 'h-14 px-5 sm:h-16'}`}>
        <Search className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} shrink-0 text-primary-400`} />
        <label htmlFor={inputId} className="sr-only">Buscar livro ou capítulo</label>
        <input
          id={inputId}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
          placeholder="Busque por livro ou capítulo: Gênesis 1"
          className={`min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-gray-500 ${compact ? 'px-2 text-sm' : 'px-4 text-sm sm:text-base'}`}
        />
        <button type="submit" aria-label="Pesquisar" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-primary-500/15 hover:text-primary-300">
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {query.trim() ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-[#171a18] p-2 shadow-2xl shadow-black/60">
          {results.length > 0 ? results.map(({ book, chapter }) => (
            <button key={`${book.slug}-${chapter || 0}`} type="button" onClick={() => goToResult(book.slug, chapter)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.06]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/10 text-xs font-black text-primary-300">{book.abbreviation}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{book.name}{chapter ? ` ${chapter}` : ''}</span>
                <span className="block text-xs text-gray-500">{chapter ? `${book.testament} · capítulo ${chapter}` : `${book.chapters} capítulos · ${book.testament}`}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-gray-600" />
            </button>
          )) : (
            <p className="px-3 py-4 text-sm text-gray-400">Nenhum livro encontrado para “{normalizeBibleSearch(query)}”.</p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default BibleSearchBox;
