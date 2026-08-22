import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Keyboard, Music, Music2, Music4, FileText, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { generateItemListSchema, generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import { Cifra, INSTRUMENTS, CATEGORIES } from '@/api/cifras';
import { fetchMergedPublicCifrasListDetailed, type PublicCifraPageData } from '@/lib/cifras-v2';
import { fetchCifrasPageBanner, type HomeBanner } from '@/lib/homeApi';
import HeroSection from '@/components/home/HeroSection';
import { CIFRA_V2_INSTRUMENTS } from '@/types/cifras-v2';

type DisplayCifra = Cifra | PublicCifraPageData;

const PUBLIC_INSTRUMENTS = [
  ...INSTRUMENTS,
  ...CIFRA_V2_INSTRUMENTS.filter((entry) => !INSTRUMENTS.some((legacy) => legacy.value === entry.value)),
];

function isCifraV2(cifra: DisplayCifra): cifra is PublicCifraPageData {
  return 'source' in cifra && cifra.source === 'v2';
}

type GroupedCifra = {
  key: string;
  primary: DisplayCifra;
  versions: PublicCifraPageData[];
};

function groupCifrasByHino(items: DisplayCifra[]): GroupedCifra[] {
  const groups = new Map<string, GroupedCifra>();
  const instrumentOrder = ['violao', 'ukulele', 'teclado'];

  items.forEach((item) => {
    const key = isCifraV2(item)
      ? `song:${item.song_id || item.hinario_numero || item.title}`
      : `legacy:${item.slug}`;
    const current = groups.get(key);

    if (!current) {
      groups.set(key, {
        key,
        primary: item,
        versions: isCifraV2(item) ? [item] : [],
      });
      return;
    }

    if (isCifraV2(item)) {
      current.versions.push(item);
      const currentRank = instrumentOrder.indexOf(isCifraV2(current.primary) ? current.primary.instrument : '');
      const nextRank = instrumentOrder.indexOf(item.instrument);
      if (nextRank !== -1 && (currentRank === -1 || nextRank < currentRank)) {
        current.primary = item;
      }
    }
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    versions: group.versions.sort((left, right) => instrumentOrder.indexOf(left.instrument) - instrumentOrder.indexOf(right.instrument)),
  }));
}

const CifrasListPage: React.FC = () => {
  const [cifras, setCifras] = useState<GroupedCifra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInstrument, setFilterInstrument] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [pageBanner, setPageBanner] = useState<HomeBanner | null>(null);

  useEffect(() => {
    loadCifras();
  }, []);

  const loadCifras = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setLoadWarning(null);

      const [result, banner] = await Promise.all([
        fetchMergedPublicCifrasListDetailed(),
        fetchCifrasPageBanner(),
      ]);
      setCifras(groupCifrasByHino(result.items));
      setPageBanner(banner);

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

  const filtered = cifras.filter(({ primary, versions }) => {
    const matchSearch = !searchTerm ||
      primary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      primary.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchInstrument = !filterInstrument || versions.some((version) => version.instrument === filterInstrument) || (!isCifraV2(primary) && primary.instrument === filterInstrument);
    const matchCategory = !filterCategory || primary.category === filterCategory;
    return matchSearch && matchInstrument && matchCategory;
  });


  return (
    <>
    <SEOHead
      title="Cifras Musicais - Acordes e Tablaturas"
      description="Encontre cifras com acordes para violão, guitarra, ukulele e teclado. Tablaturas de hinos da Congregação Cristã no Brasil."
      keywords="cifras, acordes, tablatura, violão, guitarra, ukulele, teclado, hinos, CCB"
      canonical="/cifras"
      schemaData={[
        ...(filtered.length > 0 ? [generateItemListSchema({
          name: 'Cifras Musicais',
          description: 'Cifras com acordes para hinos da CCB',
          url: '/cifras',
          items: filtered.slice(0, 20).map(({ primary }, i) => ({
            name: primary.title,
            url: `/cifra/${primary.slug}`,
            position: i + 1,
          })),
        })] : []),
        generateBreadcrumbSchema([
          { name: 'Início', url: '/' },
          { name: 'Cifras', url: '/cifras' },
        ]),
      ]}
    />
    <div className="max-w-5xl mx-auto px-4 pt-0 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:pb-8">
      {pageBanner && <HeroSection banners={[pageBanner]} className="mx-0 mt-0" />}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cifra por título ou artista..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterInstrument}
          onChange={e => setFilterInstrument(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 sm:w-auto"
        >
          <option value="">Instrumento</option>
          {PUBLIC_INSTRUMENTS.map(i => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 sm:w-auto"
        >
          <option value="">Categoria</option>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

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
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl text-gray-400 mb-2">
            {searchTerm || filterInstrument || filterCategory ? 'Nenhuma cifra encontrada' : 'Ainda não há cifras verificadas neste catálogo'}
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterInstrument || filterCategory
              ? 'Tente ajustar os filtros ou buscar pelo título do hino.'
              : 'Quando uma cifra estiver pronta para estudo, ela aparecerá aqui.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(({ key: groupKey, primary, versions }) => {
            const instrumentOptions = [
              { key: 'violao', label: 'Violão', Icon: Music4 },
              { key: 'ukulele', label: 'Ukulele', Icon: Music2 },
              { key: 'teclado', label: 'Teclado', Icon: Keyboard },
            ];
            const versionByInstrument = new Map(versions.map((version) => [version.instrument, version]));

            return (
              <article
                key={groupKey}
                className="group rounded-xl border border-gray-700/50 bg-gray-800/40 p-4 transition-all hover:border-gray-600 hover:bg-gray-800/70"
              >
                <div className="flex items-center gap-4">
                  <Link
                    to={`/cifra/${primary.slug}`}
                    aria-label={`Abrir cifra de ${primary.title}`}
                    className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gray-700/50 text-gray-400 transition-colors hover:bg-primary-500/15 hover:text-primary-300"
                  >
                    {primary.cover_url ? (
                      <img src={primary.cover_url} alt={`Cifra de ${primary.title}`} className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <Music className="h-6 w-6" />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link to={`/cifra/${primary.slug}`} className="block min-w-0">
                      <h3 className="truncate font-semibold text-white transition-colors group-hover:text-primary-400">
                        {primary.title}
                      </h3>
                    </Link>
                    <div className="mt-2 flex min-w-0 items-center gap-2">
                      <span className="rounded-md bg-primary-500/15 px-2 py-0.5 text-xs font-medium text-primary-400">
                        {primary.original_key}
                      </span>
                      <span className="truncate text-xs text-gray-500">
                        {versions.length > 0 ? `${versions.length} instrumentos` : (PUBLIC_INSTRUMENTS.find(i => i.value === primary.instrument)?.label || primary.instrument)}
                      </span>
                      <span className="ml-auto hidden shrink-0 items-center gap-1 text-xs text-gray-600 sm:flex">
                        <Eye className="h-3 w-3" />
                        {isCifraV2(primary) ? 'V2' : primary.views_count}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 sm:gap-2" aria-label="Instrumentos disponíveis">
                    {instrumentOptions.map(({ key, label, Icon }) => {
                      const version = versionByInstrument.get(key);
                      return version ? (
                        <Link
                          key={key}
                          to={`/cifra/${version.slug}`}
                          title={`Abrir versão de ${label}`}
                          aria-label={`Abrir versão de ${label}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary-500/30 bg-primary-500/10 text-primary-300 transition-colors hover:border-primary-400 hover:bg-primary-500/20"
                        >
                          <Icon className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span
                          key={key}
                          title={`${label}: versão indisponível`}
                          aria-label={`${label}: versão indisponível`}
                          className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/25"
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                      );
                    })}
                  </div>
                </div>
                <p className="mt-2 truncate pl-[4.5rem] text-sm text-gray-400">{primary.artist}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
};

export default CifrasListPage;
