import { slugifyText } from '@/utils/slugUrl';

export function getHinarioOfficialTitle(title: string, numero?: number): string {
  let officialTitle = title.trim();
  officialTitle = officialTitle.replace(/^hino\s*\d+\s*ccb\s*[-–—:]\s*/i, '');
  officialTitle = officialTitle.replace(/\s*[-–—]\s*Elias Brandão\s*$/i, '');
  officialTitle = officialTitle.replace(/^hino\s*\d+\s*[-–—:]\s*/i, '');
  if (numero) {
    officialTitle = officialTitle.replace(new RegExp(`^${numero}\\s*[-–—:]\\s*`, 'i'), '');
  }
  return officialTitle.trim();
}

export function buildHinarioSlug(numero: number, title: string): string {
  const officialTitle = getHinarioOfficialTitle(title, numero);
  return `hino-${numero}-ccb-${slugifyText(officialTitle)}`;
}

export function buildHinarioUrl(numero: number, title: string): string {
  return `/hinario/${buildHinarioSlug(numero, title)}`;
}

export function getHinarioNumberFromRoute(routeParam?: string): number {
  if (!routeParam) return 0;
  if (/^\d+$/.test(routeParam)) return Number(routeParam);
  const match = routeParam.match(/^hino-(\d+)-ccb(?:-|$)/i);
  return match ? Number(match[1]) : 0;
}

export function buildHinarioMetaTitle(numero: number, title: string): string {
  return `Hino ${numero} CCB – ${getHinarioOfficialTitle(title, numero)}: Letra`;
}

export function buildHinarioMetaDescription(numero: number, title: string): string {
  const officialTitle = getHinarioOfficialTitle(title, numero);
  return `Use o Hinário Digital CCB para acompanhar o Hino ${numero} CCB – ${officialTitle} pelo celular, tablet ou computador. Navegue pelo número ou nome entre os 480 hinos disponíveis.`;
}
