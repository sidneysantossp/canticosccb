import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { GiGuitar, GiBanjo, GiPianoKeys } from 'react-icons/gi';
import type { IconType } from 'react-icons';
import SEOHead from '@/components/SEO/SEOHead';
import HeroSection from '@/components/home/HeroSection';
import { getCifrasBanner, type HomeBanner } from '@/lib/homeApi';
import { generateItemListSchema, generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import { Cifra } from '@/api/cifras';
import { fetchHinario5NumberMap } from '@/api/hinario';
import { fetchMergedPublicCifrasListDetailed, type PublicCifraPageData } from '@/lib/cifras-v2';

type DisplayCifra = Cifra | PublicCifraPageData;

function isCifraV2(cifra: DisplayCifra): cifra is PublicCifraPageData {
  return 'source' in cifra && cifra.source === 'v2';
}

function normalizeHymnTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(hino|hinario|ccb)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveHinario5Number(title: string, numbers: Record<string, number>): number | null {
  const normalizedTitle = normalizeHymnTitle(title);
  if (!normalizedTitle) return null;
  if (numbers[normalizedTitle]) return numbers[normalizedTitle];

  const titleTokens = new Set(normalizedTitle.split(' ').filter(Boolean));
  let bestMatch: { number: number; score: number } | null = null;

  for (const [officialTitle, number] of Object.entries(numbers)) {
    const officialTokens = new Set(officialTitle.split(' ').filter(Boolean));
    const overlap = [...titleTokens].filter((token) => officialTokens.has(token)).length;
    const containsAllTitleTokens = titleTokens.size >= 3 && overlap === titleTokens.size;
    const score = containsAllTitleTokens ? 1 : overlap / Math.max(titleTokens.size, officialTokens.size);
    if ((containsAllTitleTokens || score >= 0.75) && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { number, score };
    }
  }

  return bestMatch?.number ?? null;
}

const INSTRUMENT_SHORTCUTS: Array<{ value: 'violao' | 'ukulele' | 'teclado'; label: string; Icon: IconType }> = [
  { value: 'violao', label: 'Violão', Icon: GiGuitar },
  { value: 'ukulele', label: 'Ukulele/Cavaquinho', Icon: GiBanjo },
  { value: 'teclado', label: 'Teclado', Icon: GiPianoKeys },
];

function normalizeInstrument(value: string): 'violao' | 'ukulele' | 'teclado' {
  const normalized = value.toLowerCase();
  if (normalized.includes('ukulele')) return 'ukulele';
  if (normalized.includes('teclado') || normalized.includes('piano')) return 'teclado';
  return 'violao';
}

type CifraCardGroup = {
  key: string;
  title: string;
  artist: string;
  hinarioNumero: number | null;
  versions: Partial<Record<'violao' | 'ukulele' | 'teclado', DisplayCifra>>;
};

const CifrasListPage: React.FC = () => {
  const [cifras, setCifras] = useState<DisplayCifra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [heroBanners, setHeroBanners] = useState<HomeBanner[]>([]);
  const [hinario5Numbers, setHinario5Numbers] = useState<Record<string, number>>({});

  useEffect(() => {
    loadCifras();
    fetchHinario5NumberMap()
      .then((items) => {
        const numbers = Object.fromEntries(
          Object.entries(items).map(([title, number]) => [normalizeHymnTitle(title), number])
        );
        setHinario5Numbers(numbers);
      })
      .catch((error) => console.error('Erro ao carregar a numeração do Hinário 5:', error));
    getCifrasBanner()
      .then(setHeroBanners)
      .catch((error) => console.error('Erro ao carregar o banner de cifras:', error));
  }, []);

  const loadCifras = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setLoadWarning(null);

      const result = await fetchMergedPublicCifrasListDetailed();
      setCifras(result.items);

      if (result.unavailableSources.length > 0) {
        setLoadWarning('Parte do catálogo está temporariamente indisponível. Os resultados exibidos continuam disponíveis para estudo.');
      }
    } catch (err) {
      console.error('Erro ao carregar cifras:', err);
      setCifras([]);
      setLoadError('Não foi possível carregar as cifras agora. Tente novamente em instantes.');
    } finally {
      setIsLoading(false);
    }
  };

  const grouped = Array.from(
    cifras.reduce((map, cifra) => {
      const groupKey = cifra.hino_id || `${cifra.title}::${cifra.artist}`;
      const current = map.get(groupKey) || {
        key: groupKey,
        title: cifra.title,
        artist: cifra.artist,
        hinarioNumero: resolveHinario5Number(cifra.title, hinario5Numbers),
        versions: {},
      } satisfies CifraCardGroup;
      if (!current.hinarioNumero) {
        current.hinarioNumero = resolveHinario5Number(cifra.title, hinario5Numbers);
      }
      const instrument = normalizeInstrument(cifra.instrument);
      if (!current.versions[instrument]) current.versions[instrument] = cifra;
      map.set(groupKey, current);
      return map;
    }, new Map<string, CifraCardGroup>()).values()
  );

  return (
    <>
    <SEOHead
      title="Cifras Musicais - Acordes e Tablaturas"
      description="Encontre cifras com acordes para violão, guitarra, ukulele e teclado. Tablaturas de hinos da comunidade CCB."
      keywords="cifras, acordes, tablatura, violão, guitarra, ukulele, teclado, hinos, CCB"
      canonical="/cifras"
      schemaData={[
        ...(cifras.length > 0 ? [generateItemListSchema({
          name: 'Cifras Musicais',
          description: 'Cifras com acordes para hinos da CCB',
          url: '/cifras',
          items: cifras.slice(0, 20).map((c, i) => ({
            name: c.title,
            url: `/cifra/${c.slug}`,
            position: i + 1,
          })),
        })] : []),
        generateBreadcrumbSchema([
          { name: 'Início', url: '/' },
          { name: 'Cifras', url: '/cifras' },
        ]),
      ]}
    />
    <div className="max-w-5xl mx-auto px-4 pt-0 pb-24 sm:pb-8">
      {/* Único FullBanner da página de cifras, gerido na aba Categorias do admin */}
      {heroBanners.length > 0 && (
        <div className="mb-6">
          <HeroSection banners={heroBanners.slice(0, 1)} variant="fullBanner" />
        </div>
      )}

      {loadWarning && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-300" />
          <p>{loadWarning}</p>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : loadError ? (
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-red-300/80 mx-auto mb-4" />
          <h3 className="text-xl text-gray-200 mb-2">Não foi possível carregar o catálogo</h3>
          <p className="text-gray-500 mb-5">{loadError}</p>
          <button
            type="button"
            onClick={loadCifras}
            className="inline-flex items-center gap-2 rounded-xl border border-primary-500/40 px-4 py-2 text-sm font-medium text-primary-200 transition-colors hover:border-primary-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      ) : cifras.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl text-gray-400 mb-2">
            Ainda não há cifras verificadas neste catálogo
          </h3>
          <p className="text-gray-500">
            Quando uma cifra estiver pronta para estudo, ela aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {grouped.map(group => (
            <article
              key={group.key}
              className="group flex min-h-[56px] items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-800/40 px-2.5 py-1.5 transition-colors hover:border-gray-600 hover:bg-gray-800/70 sm:min-h-[60px] sm:px-3 sm:py-2"
            >
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-sm font-semibold leading-5 text-white transition-colors group-hover:text-primary-400 sm:text-base">
                  {group.title}
                </h3>
                <span className="mt-0.5 inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold leading-3 text-emerald-300 sm:text-[10px]">
                  {group.hinarioNumero ? `Hino ${group.hinarioNumero}` : 'Hino avulso'}
                </span>
                {group.artist && (
                  <p className="mt-0.5 line-clamp-1 text-[10px] leading-3 text-gray-400 sm:text-[11px]">{group.artist}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5" aria-label={`Cifras de ${group.title}`}>
                {INSTRUMENT_SHORTCUTS.map(({ value, label, Icon }) => {
                  const version = group.versions[value];
                  if (!version) return null;
                  return (
                    <Link
                      key={`${group.key}-${value}`}
                      to={`/cifra/${version.slug}`}
                      aria-label={`${label}: ${group.title}`}
                      title={`${label}: ${group.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-700/70 text-gray-300 transition-colors hover:border-primary-400 hover:bg-primary-500/15 hover:text-primary-300 sm:h-8 sm:w-8"
                    >
                      <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
    </>
  );
};

export default CifrasListPage;
