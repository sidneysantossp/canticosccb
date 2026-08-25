import { supabaseAuthDelete, supabaseAuthInsert, supabaseFetch, supabaseRPC, supabaseUpdate } from '@/lib/supabaseRest';

export interface BibleChapterAudio {
  id: number;
  chapter_id: number;
  youtube_video_id: string;
  youtube_url: string;
  title: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_active: boolean;
  created_at?: string;
}

export interface BibleChapterAudioAdmin extends BibleChapterAudio {
  chapter?: { chapter_number: number; book?: { name: string; slug: string } };
}

export async function fetchBibleChapterAudio(bookSlug: string, chapterNumber: number) {
  const rows = await supabaseRPC<Array<Omit<BibleChapterAudio, 'chapter_id' | 'is_active'>>>('get_bible_chapter_audio', {
    p_translation_code: 'acf', p_book_slug: bookSlug, p_chapter_number: chapterNumber,
  });
  return rows[0] ?? null;
}

export async function fetchBibleChapterAudios() {
  return supabaseFetch<BibleChapterAudioAdmin>('bible_chapter_audio', {
    select: '*,chapter:bible_chapters(chapter_number,book:bible_books(name,slug))', order: 'created_at.desc',
  },);
}

export async function resolveBibleChapterId(bookSlug: string, chapterNumber: number) {
  const books = await supabaseFetch<{ id: number }>('bible_books', { select: 'id', slug: `eq.${bookSlug}`, limit: '1' });
  if (!books[0]) throw new Error('Livro não encontrado.');
  const chapters = await supabaseFetch<{ id: number }>('bible_chapters', { select: 'id', book_id: `eq.${books[0].id}`, chapter_number: `eq.${chapterNumber}`, limit: '1' });
  if (!chapters[0]) throw new Error('Capítulo não encontrado.');
  return chapters[0].id;
}

export async function saveBibleChapterAudio(data: Omit<BibleChapterAudio, 'id' | 'created_at'> & { id?: number }) {
  const { id, ...payload } = data;
  if (id) return (await supabaseUpdate<BibleChapterAudio>('bible_chapter_audio', { id: `eq.${id}` }, payload))[0];
  return (await supabaseAuthInsert<BibleChapterAudio>('bible_chapter_audio', payload))[0];
}

export async function deleteBibleChapterAudio(id: number) {
  await supabaseAuthDelete<BibleChapterAudio>('bible_chapter_audio', { id: `eq.${id}` });
}
