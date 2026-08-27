import { supabaseRPC } from '@/lib/supabaseRest';
import { getBibleBook } from '@/data/bibleCatalog';
import type { BibleCrossReference } from '@/data/bibleCrossReferences';

interface BibleCrossReferenceRow {
  source_verse: number;
  target_book_slug: string;
  target_chapter: number;
  target_verse: number;
  vote_count: number;
}

/**
 * Carrega somente as referencias do capitulo visivel. A funcao SQL limita a
 * quantidade por versiculo para preservar leitura, desempenho e foco editorial.
 */
export async function fetchBibleCrossReferences(bookSlug: string, chapter: number): Promise<BibleCrossReference[]> {
  const rows = await supabaseRPC<BibleCrossReferenceRow[]>('get_bible_cross_references', {
    p_translation_code: 'acf',
    p_book_slug: bookSlug,
    p_chapter_number: chapter,
    p_max_per_verse: 3,
  });

  const grouped = new Map<number, BibleCrossReference>();
  rows.forEach((row) => {
    const targetBook = getBibleBook(row.target_book_slug);
    if (!targetBook) return;
    const item = grouped.get(row.source_verse) || {
      translationCode: 'acf',
      sourceBookSlug: bookSlug,
      sourceChapter: chapter,
      sourceVerse: row.source_verse,
      targets: [],
    };
    item.targets.push({
      bookSlug: row.target_book_slug,
      chapter: row.target_chapter,
      verse: row.target_verse,
      label: `${targetBook.name} ${row.target_chapter}:${row.target_verse}`,
      relation: 'paralela',
    });
    grouped.set(row.source_verse, item);
  });

  return [...grouped.values()];
}
