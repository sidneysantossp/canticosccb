import { supabaseRPC } from '@/lib/supabaseRest';

export interface BibleVerse {
  verse_number: number;
  verse_text: string;
  is_red_letter: boolean;
  paragraph_number: number | null;
  section_title: string | null;
}

export interface BibleChapterContent {
  chapterTitle: string | null;
  verses: BibleVerse[];
}

export async function fetchBibleChapter(bookSlug: string, chapterNumber: number): Promise<BibleChapterContent> {
  const rows = await supabaseRPC<Array<BibleVerse & { chapter_title: string | null }>>('get_bible_chapter', {
    p_translation_code: 'acf',
    p_book_slug: bookSlug,
    p_chapter_number: chapterNumber,
  });

  return {
    chapterTitle: rows[0]?.chapter_title ?? null,
    verses: rows.map(({ chapter_title: _chapterTitle, ...verse }) => verse),
  };
}
