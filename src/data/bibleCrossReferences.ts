/**
 * Referências cruzadas editoriais da Bíblia.
 *
 * O modelo mantém a passagem de origem separada das passagens relacionadas
 * para que a interface possa exibir links inline, prévias ou uma lista ao fim
 * do capítulo sem duplicar conteúdo bíblico.
 */
export interface BibleCrossReferenceTarget {
  bookSlug: string;
  chapter: number;
  verse?: number;
  /** Texto curto usado no link, por exemplo: "João 1:1". */
  label: string;
  /** Motivo editorial da relação, opcional para a camada de apresentação. */
  relation?: 'paralela' | 'tema' | 'profecia' | 'citação' | 'contexto';
}

export interface BibleCrossReference {
  translationCode: string;
  sourceBookSlug: string;
  sourceChapter: number;
  sourceVerse: number;
  /** Trecho/termo ao qual a referência pode ser ancorada na leitura. */
  anchorText?: string;
  targets: BibleCrossReferenceTarget[];
}

const acf = (sourceBookSlug: string, sourceChapter: number, sourceVerse: number, anchorText: string | undefined, targets: BibleCrossReferenceTarget[]): BibleCrossReference => ({
  translationCode: 'acf',
  sourceBookSlug,
  sourceChapter,
  sourceVerse,
  anchorText,
  targets,
});

/** Piloto editorial para Gênesis 1, baseado em referências bíblicas clássicas. */
export const bibleCrossReferences: BibleCrossReference[] = [
  acf('genesis', 1, 1, 'No princípio', [
    { bookSlug: 'joao', chapter: 1, verse: 1, label: 'João 1:1', relation: 'paralela' },
    { bookSlug: 'hebreus', chapter: 11, verse: 3, label: 'Hebreus 11:3', relation: 'contexto' },
  ]),
  acf('genesis', 1, 3, 'Haja luz', [
    { bookSlug: 'joao', chapter: 1, verse: 4, label: 'João 1:4', relation: 'tema' },
    { bookSlug: '2-corintios', chapter: 4, verse: 6, label: '2 Coríntios 4:6', relation: 'tema' },
  ]),
  acf('genesis', 1, 26, 'Façamos o homem', [
    { bookSlug: 'genesis', chapter: 2, verse: 7, label: 'Gênesis 2:7', relation: 'contexto' },
    { bookSlug: 'salmos', chapter: 8, verse: 6, label: 'Salmos 8:6', relation: 'tema' },
  ]),
  acf('exodo', 1, 8, 'novo rei sobre o Egito', [
    { bookSlug: 'atos', chapter: 7, verse: 18, label: 'Atos 7:18', relation: 'paralela' },
  ]),
  acf('exodo', 1, 10, 'oprimamos', [
    { bookSlug: 'atos', chapter: 7, verse: 19, label: 'Atos 7:19', relation: 'contexto' },
  ]),
  acf('levitico', 1, 3, 'holocausto', [
    { bookSlug: 'hebreus', chapter: 10, verse: 10, label: 'Hebreus 10:10', relation: 'contexto' },
    { bookSlug: 'efesios', chapter: 5, verse: 2, label: 'Efésios 5:2', relation: 'tema' },
  ]),
  acf('levitico', 1, 9, 'cheiro suave', [
    { bookSlug: 'efesios', chapter: 5, verse: 2, label: 'Efésios 5:2', relation: 'paralela' },
  ]),
];

/** Índice em memória para consultas O(1) durante a renderização dos capítulos. */
export const bibleCrossReferencesByChapter = new Map<string, BibleCrossReference[]>();

bibleCrossReferences.forEach((reference) => {
  const key = `${reference.translationCode}:${reference.sourceBookSlug}:${reference.sourceChapter}`;
  const current = bibleCrossReferencesByChapter.get(key) || [];
  current.push(reference);
  bibleCrossReferencesByChapter.set(key, current);
});

export const getBibleCrossReferences = (
  bookSlug: string,
  chapter: number,
  verse?: number,
  translationCode = 'acf',
) => (bibleCrossReferencesByChapter.get(`${translationCode}:${bookSlug}:${chapter}`) || [])
  .filter((reference) => verse === undefined || reference.sourceVerse === verse);
