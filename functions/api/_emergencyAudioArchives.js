const ZIP_SEGMENTS = [
  {
    id: 'orquestrados-001-020',
    start: 1,
    end: 20,
    originalUrl: 'http://canticosccb.com.br/zip/acompanhamentos-orquestrados-hinos-001-020-www.canticosccb.com.br.zip',
    albumSlug: 'acompanhamentos-orquestrados-hinos-001-020',
    albumTitle: 'Acompanhamentos Orquestrados Hinos 001-020',
  },
  {
    id: 'orquestrados-021-040',
    start: 21,
    end: 40,
    originalUrl: 'http://canticosccb.com.br/zip/acompanhamentos-orquestrados-021-040-www.canticosccb.com.br.zip',
    albumSlug: 'acompanhamentos-orquestrados-021-040',
    albumTitle: 'Acompanhamentos Orquestrados 021-040',
  },
  {
    id: 'coletania-026-050',
    start: 26,
    end: 50,
    originalUrl: 'http://canticosccb.com.br/zip/coletania-26-a-50-www.canticosccb.com.br.zip',
    albumSlug: 'coletania-26-a-50',
    albumTitle: 'Coletania 26 a 50',
  },
  {
    id: 'coletania-101-125',
    start: 101,
    end: 125,
    originalUrl: 'http://canticosccb.com.br/zip/coletania-101-a-125-www.canticosccb.com.br.zip',
    albumSlug: 'coletania-101-a-125',
    albumTitle: 'Coletania 101 a 125',
  },
  {
    id: 'coletania-126-150',
    start: 126,
    end: 150,
    originalUrl: 'http://canticosccb.com.br/zip/coletania-126-a-150-www.canticosccb.com.br.zip',
    albumSlug: 'coletania-126-a-150',
    albumTitle: 'Coletania 126 a 150',
  },
  {
    id: 'coletania-201-225',
    start: 201,
    end: 225,
    originalUrl: 'http://canticosccb.com.br/zip/coletania-201-a-225-www.canticosccb.com.br.zip',
    albumSlug: 'coletania-201-a-225',
    albumTitle: 'Coletania 201 a 225',
  },
  {
    id: 'coletania-226-250',
    start: 226,
    end: 250,
    originalUrl: 'http://canticosccb.com.br/zip/coletania-226-a-250-www.canticosccb.com.br.zip',
    albumSlug: 'coletania-226-a-250',
    albumTitle: 'Coletania 226 a 250',
  },
  {
    id: 'coletania-251-275',
    start: 251,
    end: 275,
    originalUrl: 'http://canticosccb.com.br/zip/coletania-251-a-275-www.canticosccb.com.br.zip',
    albumSlug: 'coletania-251-a-275',
    albumTitle: 'Coletania 251 a 275',
  },
  {
    id: 'coletania-276-300',
    start: 276,
    end: 300,
    originalUrl: 'http://canticosccb.com.br/zip/coletania-276-a-300-www.canticosccb.com.br.zip',
    albumSlug: 'coletania-276-a-300',
    albumTitle: 'Coletania 276 a 300',
  },
  {
    id: 'coletania-301-325',
    start: 301,
    end: 325,
    originalUrl: 'http://canticosccb.com.br/zip/coletania-301-a-325-www.canticosccb.com.br.zip',
    albumSlug: 'coletania-301-a-325',
    albumTitle: 'Coletania 301 a 325',
  },
  {
    id: 'coletania-326-350',
    start: 326,
    end: 350,
    originalUrl: 'http://canticosccb.com.br/zip/coletania-326-a-350-www.canticosccb.com.br.zip',
    albumSlug: 'coletania-326-a-350',
    albumTitle: 'Coletania 326 a 350',
  },
  {
    id: 'coletania-351-375',
    start: 351,
    end: 375,
    originalUrl: 'http://canticosccb.com.br/zip/coletania-351-a-375-www.canticosccb.com.br.zip',
    albumSlug: 'coletania-351-a-375',
    albumTitle: 'Coletania 351 a 375',
  },
  {
    id: 'decio-361-380',
    start: 361,
    end: 380,
    originalUrl: 'http://canticosccb.com.br/zip/decio-4-vozes-361-a380-www.canticosccb.com.br.zip',
    albumSlug: 'decio-4-vozes-361-a380',
    albumTitle: 'Decio 4 Vozes 361 a 380',
  },
  {
    id: 'decio-381-400',
    start: 381,
    end: 400,
    originalUrl: 'http://canticosccb.com.br/zip/decio-4-vozes-hinos-381-a-400-www.canticosccb.com.br.zip',
    albumSlug: 'decio-4-vozes-hinos-381-a-400',
    albumTitle: 'Decio 4 Vozes Hinos 381 a 400',
  },
  {
    id: 'decio-401-420',
    start: 401,
    end: 420,
    originalUrl: 'http://canticosccb.com.br/zip/decio-4-vozes-hinos-401-a-420-www.canticosccb.com.br.zip',
    albumSlug: 'decio-4-vozes-hinos-401-a-420',
    albumTitle: 'Decio 4 Vozes Hinos 401 a 420',
  },
  {
    id: 'coletania-426-450',
    start: 426,
    end: 450,
    originalUrl: 'http://canticosccb.com.br/zip/coletania-426-a-450-www.canticosccb.com.br.zip',
    albumSlug: 'coletania-426-a-450',
    albumTitle: 'Coletania 426 a 450',
  },
  {
    id: 'decio-461-480',
    start: 461,
    end: 480,
    originalUrl: 'http://canticosccb.com.br/zip/decio-4-vozes-hinos-461-a-480-coros-www.canticosccb.com.br.zip',
    albumSlug: 'decio-4-vozes-hinos-461-a-480-coros',
    albumTitle: 'Decio 4 Vozes Hinos 461 a 480 Coros',
  },
];

export const EMERGENCY_ARCHIVE_ZIP_SEGMENTS = [...ZIP_SEGMENTS].sort((left, right) => {
  const leftSpan = left.end - left.start;
  const rightSpan = right.end - right.start;
  return leftSpan - rightSpan || left.start - right.start;
});

export function getEmergencyArchiveZipSegmentById(id) {
  return EMERGENCY_ARCHIVE_ZIP_SEGMENTS.find((segment) => segment.id === id);
}

export function getEmergencyArchiveZipSegmentByNumber(number) {
  if (!Number.isFinite(Number(number))) {
    return undefined;
  }

  const parsed = Number(number);
  return EMERGENCY_ARCHIVE_ZIP_SEGMENTS.find((segment) => parsed >= segment.start && parsed <= segment.end);
}
