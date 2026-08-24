export function buildCifraUrl(instrument: string, slug: string): string {
  return `/cifras/${encodeURIComponent(instrument)}/${encodeURIComponent(slug)}`;
}
