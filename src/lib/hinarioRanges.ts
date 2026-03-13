export type HinarioRangeKey = '1-120' | '121-240' | '241-360' | '361-480';

export type HinarioRangeConfig = {
  key: HinarioRangeKey;
  path: string;
  label: string;
  shortLabel: string;
  start: number;
  end: number;
};

export const HINARIO_RANGES: HinarioRangeConfig[] = [
  {
    key: '1-120',
    path: '/hinos-1-a-120-ccb',
    label: 'Hinos 1 a 120 CCB',
    shortLabel: '1 a 120',
    start: 1,
    end: 120,
  },
  {
    key: '121-240',
    path: '/hinos-121-a-240-ccb',
    label: 'Hinos 121 a 240 CCB',
    shortLabel: '121 a 240',
    start: 121,
    end: 240,
  },
  {
    key: '241-360',
    path: '/hinos-241-a-360-ccb',
    label: 'Hinos 241 a 360 CCB',
    shortLabel: '241 a 360',
    start: 241,
    end: 360,
  },
  {
    key: '361-480',
    path: '/hinos-361-a-480-ccb',
    label: 'Hinos 361 a 480 CCB',
    shortLabel: '361 a 480',
    start: 361,
    end: 480,
  },
];

export function getHinarioRangeByKey(key: HinarioRangeKey): HinarioRangeConfig {
  return HINARIO_RANGES.find((range) => range.key === key) || HINARIO_RANGES[0];
}

export function getHinarioRangeForNumero(numero?: number | null): HinarioRangeConfig | null {
  const numericValue = Number(numero || 0);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return null;
  return HINARIO_RANGES.find((range) => numericValue >= range.start && numericValue <= range.end) || null;
}

export function filterItemsByHinarioRange<T extends { numero?: number | null }>(
  items: T[],
  rangeOrKey: HinarioRangeConfig | HinarioRangeKey
): T[] {
  const range = typeof rangeOrKey === 'string' ? getHinarioRangeByKey(rangeOrKey) : rangeOrKey;
  return items.filter((item) => {
    const numero = Number(item.numero || 0);
    return numero >= range.start && numero <= range.end;
  });
}
