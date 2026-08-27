export type BibleTestament = 'Antigo Testamento' | 'Novo Testamento';

export interface BibleBook {
  name: string;
  slug: string;
  abbreviation: string;
  chapters: number;
  testament: BibleTestament;
}

const oldTestament: Array<[string, string, string, number]> = [
  ['Gênesis', 'genesis', 'Gn', 50], ['Êxodo', 'exodo', 'Êx', 40], ['Levítico', 'levitico', 'Lv', 27],
  ['Números', 'numeros', 'Nm', 36], ['Deuteronômio', 'deuteronomio', 'Dt', 34], ['Josué', 'josue', 'Js', 24],
  ['Juízes', 'juizes', 'Jz', 21], ['Rute', 'rute', 'Rt', 4], ['1 Samuel', '1-samuel', '1Sm', 31],
  ['2 Samuel', '2-samuel', '2Sm', 24], ['1 Reis', '1-reis', '1Rs', 22], ['2 Reis', '2-reis', '2Rs', 25],
  ['1 Crônicas', '1-cronicas', '1Cr', 29], ['2 Crônicas', '2-cronicas', '2Cr', 36], ['Esdras', 'esdras', 'Ed', 10],
  ['Neemias', 'neemias', 'Ne', 13], ['Ester', 'ester', 'Et', 10], ['Jó', 'jo', 'Jó', 42],
  ['Salmos', 'salmos', 'Sl', 150], ['Provérbios', 'proverbios', 'Pv', 31], ['Eclesiastes', 'eclesiastes', 'Ec', 12],
  ['Cantares', 'cantares', 'Ct', 8], ['Isaías', 'isaias', 'Is', 66], ['Jeremias', 'jeremias', 'Jr', 52],
  ['Lamentações', 'lamentacoes', 'Lm', 5], ['Ezequiel', 'ezequiel', 'Ez', 48], ['Daniel', 'daniel', 'Dn', 12],
  ['Oséias', 'oseias', 'Os', 14], ['Joel', 'joel', 'Jl', 3], ['Amós', 'amos', 'Am', 9],
  ['Obadias', 'obadias', 'Ob', 1], ['Jonas', 'jonas', 'Jn', 4], ['Miquéias', 'miqueias', 'Mq', 7],
  ['Naum', 'naum', 'Na', 3], ['Habacuque', 'habacuque', 'Hc', 3], ['Sofonias', 'sofonias', 'Sf', 3],
  ['Ageu', 'ageu', 'Ag', 2], ['Zacarias', 'zacarias', 'Zc', 14], ['Malaquias', 'malaquias', 'Ml', 4],
];

const newTestament: Array<[string, string, string, number]> = [
  ['Mateus', 'mateus', 'Mt', 28], ['Marcos', 'marcos', 'Mc', 16], ['Lucas', 'lucas', 'Lc', 24],
  ['João', 'joao', 'Jo', 21], ['Atos', 'atos', 'At', 28], ['Romanos', 'romanos', 'Rm', 16],
  ['1 Coríntios', '1-corintios', '1Co', 16], ['2 Coríntios', '2-corintios', '2Co', 13], ['Gálatas', 'galatas', 'Gl', 6],
  ['Efésios', 'efesios', 'Ef', 6], ['Filipenses', 'filipenses', 'Fp', 4], ['Colossenses', 'colossenses', 'Cl', 4],
  ['1 Tessalonicenses', '1-tessalonicenses', '1Ts', 5], ['2 Tessalonicenses', '2-tessalonicenses', '2Ts', 3],
  ['1 Timóteo', '1-timoteo', '1Tm', 6], ['2 Timóteo', '2-timoteo', '2Tm', 4], ['Tito', 'tito', 'Tt', 3],
  ['Filemom', 'filemom', 'Fm', 1], ['Hebreus', 'hebreus', 'Hb', 13], ['Tiago', 'tiago', 'Tg', 5],
  ['1 Pedro', '1-pedro', '1Pe', 5], ['2 Pedro', '2-pedro', '2Pe', 3], ['1 João', '1-joao', '1Jo', 5],
  ['2 João', '2-joao', '2Jo', 1], ['3 João', '3-joao', '3Jo', 1], ['Judas', 'judas', 'Jd', 1],
  ['Apocalipse', 'apocalipse', 'Ap', 22],
];

const toBooks = (
  rows: Array<[string, string, string, number]>,
  testament: BibleTestament,
): BibleBook[] => rows.map(([name, slug, abbreviation, chapters]) => ({ name, slug, abbreviation, chapters, testament }));

export const bibleBooks: BibleBook[] = [
  ...toBooks(oldTestament, 'Antigo Testamento'),
  ...toBooks(newTestament, 'Novo Testamento'),
];

export const bibleBooksBySlug = new Map(bibleBooks.map((book) => [book.slug, book]));

export const getBibleBook = (slug?: string) => slug ? bibleBooksBySlug.get(slug) : undefined;

/**
 * Every chapter needs a stable human-readable label. Imported chapter metadata
 * overrides the fallback when available; the fallback keeps older records
 * canonical and avoids leaking numeric-only URLs to search engines.
 */
// Compatibilidade com o catálogo legado, que foi gerado com os nomes dos
// livros truncados durante a normalização do PDF. Mantemos a correção aqui
// para que URLs canônicas nunca voltem ao título numérico.
const legacyTitleKeys: Record<string, string> = {
  genesis: 'e-nesis', exodo: 'xodo', levitico: 'evi-tico', numeros: 'meros',
  deuteronomio: 'eterono-mio', josue: 'ose', juizes: 'i-zes', rute: 'te',
  '1-samuel': 'amel', '2-samuel': 'amel', '1-reis': 'eis', '2-reis': 'eis',
  '1-cronicas': 'ro-nicas', '2-cronicas': 'ro-nicas', esdras: 'sdras', neemias: 'eemias',
  ester: 'ster', jo: 'o', salmos: 'o', proverbios: 'rove-rbios', eclesiastes: 'clesiastes',
  cantares: 'antares', isaias: 'sai-as', jeremias: 'eremias', lamentacoes: 'amentac-o-es',
  ezequiel: 'zeqiel', daniel: 'aniel', oseias: 'oseias', joel: 'oel', amos: 'mo-s',
  obadias: 'abam', jonas: 'onas', miqueias: 'i-queias', naum: 'am',
  habacuque: 'abacqe', sofonias: 'oonias', ageu: 'ge', zacarias: 'acarias', malaquias: 'alaqias',
  mateus: 'ateus', marcos: 'arcos', lucas: 'cas', joao: 'oa-o', atos: 'tos', romanos: 'omanos',
  '1-corintios': 'ori-ntios', '2-corintios': 'ori-ntios', galatas: 'a-latas', efesios: 'e-sios',
  filipenses: 'ilipenses', colossenses: 'olossenses', '1-tessalonicenses': 'essalonicenses',
  '2-tessalonicenses': 'essalonicenses', '1-timoteo': 'imo-teo', '2-timoteo': 'imo-teo',
  tito: 'ito', filemom: 'ilemom', hebreus: 'ebres', tiago: 'iago', '1-pedro': 'edro', '2-pedro': 'edro',
  '1-joao': 'oao', '2-joao': 'oao', '3-joao': 'oao', judas: 'udas', apocalipse: 'pocalipse',
};

export const getBibleChapterTitle = (bookSlug: string, chapter: number) =>
  bibleChapterTitles[bookSlug]?.[chapter]
  || bibleChapterTitles[legacyTitleKeys[bookSlug]]?.[chapter]
  || `Capítulo ${chapter}`;

export const buildBibleChapterPath = (book: BibleBook, chapter: number) => {
  const title = getBibleChapterTitle(book.slug, chapter);
  const normalizedTitle = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `/biblia-ccb/${book.slug}/${chapter}-${normalizedTitle}`;
};

export const normalizeBibleSearch = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

export const searchBibleBooks = (query: string) => {
  const normalized = normalizeBibleSearch(query);
  if (!normalized) return [];
  return bibleBooks.filter((book) => {
    const haystack = normalizeBibleSearch(`${book.name} ${book.abbreviation}`);
    return haystack.includes(normalized) || normalized.includes(normalizeBibleSearch(book.name));
  });
};
import { bibleChapterTitles } from './bibleChapterTitles';
