// ============================================
// BIBLE NARRATED API (Mock Implementation)
// ============================================

// // import { supabase } from '@/lib/backend'; // TODO: Criar API de bíblia narrada

export interface BibleNarrated {
  id: number;
  youtube_url: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string;
  book_name: string;
  description: string;
  content: string;
  duration?: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type CreateBibleNarratedData = Omit<BibleNarrated, 'id' | 'created_at' | 'updated_at'>;
export type UpdateBibleNarratedData = Partial<CreateBibleNarratedData>;

// Mock database
let mockBibleNarrated: BibleNarrated[] = [
  {
    id: 1,
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_video_id: 'dQw4w9WgXcQ',
    title: 'Gênesis 1 - A Criação',
    thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    book_name: 'Gênesis',
    description: 'Capítulo 1 do livro de Gênesis - A criação do mundo',
    content: 'No princípio criou Deus os céus e a terra...',
    duration: 3600,
    is_active: true,
    display_order: 1,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    youtube_url: 'https://www.youtube.com/watch?v=abc123xyz',
    youtube_video_id: 'abc123xyz',
    title: 'Êxodo 20 - Os Dez Mandamentos',
    thumbnail_url: 'https://i.ytimg.com/vi/abc123xyz/maxresdefault.jpg',
    book_name: 'Êxodo',
    description: 'Os Dez Mandamentos dados por Deus a Moisés',
    content: 'Então falou Deus todas estas palavras, dizendo...',
    duration: 2400,
    is_active: true,
    display_order: 2,
    created_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    youtube_url: 'https://www.youtube.com/watch?v=xyz789abc',
    youtube_video_id: 'xyz789abc',
    title: 'Salmos 23 - O Bom Pastor',
    thumbnail_url: 'https://i.ytimg.com/vi/xyz789abc/maxresdefault.jpg',
    book_name: 'Salmos',
    description: 'O Senhor é o meu pastor, nada me faltará',
    content: 'O Senhor é o meu pastor, nada me faltará...',
    duration: 1800,
    is_active: true,
    display_order: 3,
    created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    youtube_url: 'https://www.youtube.com/watch?v=def456ghi',
    youtube_video_id: 'def456ghi',
    title: 'João 3:16 - O Amor de Deus',
    thumbnail_url: 'https://i.ytimg.com/vi/def456ghi/maxresdefault.jpg',
    book_name: 'João',
    description: 'Porque Deus amou o mundo de tal maneira',
    content: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...',
    duration: 2100,
    is_active: false,
    display_order: 4,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    youtube_url: 'https://www.youtube.com/watch?v=ghi789jkl',
    youtube_video_id: 'ghi789jkl',
    title: 'Apocalipse 21 - Nova Jerusalém',
    thumbnail_url: 'https://i.ytimg.com/vi/ghi789jkl/maxresdefault.jpg',
    book_name: 'Apocalipse',
    description: 'A visão da Nova Jerusalém',
    content: 'E vi um novo céu, e uma nova terra...',
    duration: 3000,
    is_active: true,
    display_order: 5,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Flag global (mock) para habilitar/desabilitar a seção na Home
let bibleNarratedSectionEnabled = (() => {
  try {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('bibleNarratedSectionEnabled') : null;
    return v === null ? true : v === 'true';
  } catch {
    return true;
  }
})();

export async function getBibleNarratedSectionEnabled(): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 150));
  return bibleNarratedSectionEnabled;
}

export async function setBibleNarratedSectionEnabled(value: boolean): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 150));
  bibleNarratedSectionEnabled = value;
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('bibleNarratedSectionEnabled', String(value));
    }
  } catch {}
}

/**
 * Buscar todos os itens da Bíblia Narrada
 */
export async function fetchBibleNarrated(): Promise<BibleNarrated[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockBibleNarrated].sort((a, b) => a.display_order - b.display_order);
}

/**
 * Buscar apenas itens ativos da Bíblia Narrada (para frontend)
 */
export async function fetchActiveBibleNarrated(): Promise<BibleNarrated[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockBibleNarrated
    .filter(item => item.is_active)
    .sort((a, b) => a.display_order - b.display_order);
}

/**
 * Buscar um item específico da Bíblia Narrada
 */
export async function fetchBibleNarratedById(id: number): Promise<BibleNarrated | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockBibleNarrated.find(item => item.id === id) || null;
}

/**
 * Criar novo item da Bíblia Narrada
 */
export async function createBibleNarrated(data: CreateBibleNarratedData): Promise<BibleNarrated> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newItem: BibleNarrated = {
    id: Math.max(...mockBibleNarrated.map(i => i.id), 0) + 1,
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockBibleNarrated.push(newItem);
  return newItem;
}

/**
 * Atualizar item da Bíblia Narrada
 */
export async function updateBibleNarrated(id: number, data: UpdateBibleNarratedData): Promise<BibleNarrated> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockBibleNarrated.findIndex(item => item.id === id);
  if (index === -1) {
    throw new Error('Item não encontrado');
  }
  mockBibleNarrated[index] = {
    ...mockBibleNarrated[index],
    ...data,
    updated_at: new Date().toISOString()
  };
  return mockBibleNarrated[index];
}

/**
 * Deletar item da Bíblia Narrada
 */
export async function deleteBibleNarrated(id: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockBibleNarrated.findIndex(item => item.id === id);
  if (index !== -1) {
    mockBibleNarrated.splice(index, 1);
  }
}

/**
 * Alternar status ativo/inativo
 */
export async function toggleBibleNarratedActive(id: number): Promise<BibleNarrated> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockBibleNarrated.findIndex(item => item.id === id);
  if (index === -1) {
    throw new Error('Item não encontrado');
  }
  mockBibleNarrated[index].is_active = !mockBibleNarrated[index].is_active;
  mockBibleNarrated[index].updated_at = new Date().toISOString();
  return mockBibleNarrated[index];
}

/**
 * Reordenar itens
 */
export async function reorderBibleNarrated(items: { id: number; display_order: number }[]): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  items.forEach(({ id, display_order }) => {
    const item = mockBibleNarrated.find(i => i.id === id);
    if (item) {
      item.display_order = display_order;
      item.updated_at = new Date().toISOString();
    }
  });
}
