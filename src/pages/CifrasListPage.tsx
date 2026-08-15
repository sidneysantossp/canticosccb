import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Music, FileText, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { generateItemListSchema, generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import { Cifra, INSTRUMENTS, CATEGORIES } from '@/api/cifras';
import { fetchMergedPublicCifrasListDetailed, type PublicCifraPageData } from '@/lib/cifras-v2';
import { CIFRA_V2_INSTRUMENTS } from '@/types/cifras-v2';

type DisplayCifra = Cifra | PublicCifraPageData;

const PUBLIC_INSTRUMENTS = [
  ...INSTRUMENTS,
  ...CIFRA_V2_INSTRUMENTS.filter((entry) => !INSTRUMENTS.some((legacy) => legacy.value === entry.value)),
];

function isCifraV2(cifra: DisplayCifra): cifra is PublicCifraPageData {
  return 'source' in cifra && cifra.source === 'v2';
}

const CifrasListPage: React.FC = () => {
  const [cifras, setCifras] = useState<DisplayCifra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInstrument, setFilterInstrument] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);

  useEffect(() => {
    loadCifras();
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

  const filtered = cifras.filter(c => {
    const matchSearch = !searchTerm ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchInstrument = !filterInstrument || c.instrument === filterInstrument;
    const matchCategory = !filterCategory || c.category === filterCategory;
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
          items: filtered.slice(0, 20).map((c, i) => ({
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
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 sm:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
          Cifras<br />Musicais
        </h1>
        <p className="text-gray-400 mt-2">Encontre cifras com acordes para violão, guitarra, ukulele e teclado</p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link to="/cifras-violao-ccb" className="px-4 py-2 rounded-full border border-primary-500/30 text-primary-300 hover:border-primary-400 hover:text-white transition-colors text-sm">
            Cifras de Violão
          </Link>
          <Link to="/cifras-ukulele-ccb" className="px-4 py-2 rounded-full border border-primary-500/30 text-primary-300 hover:border-primary-400 hover:text-white transition-colors text-sm">
            Cifras de Ukulele
          </Link>
          <Link to="/cifras-teclado-ccb" className="px-4 py-2 rounded-full border border-primary-500/30 text-primary-300 hover:border-primary-400 hover:text-white transition-colors text-sm">
            Cifras de Teclado
          </Link>
        </div>
      </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(cifra => (
            <Link
              key={cifra.id}
              to={`/cifra/${cifra.slug}`}
              className="group bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/50 hover:border-gray-600 rounded-xl p-4 transition-all"
            >
              <div className="flex items-start gap-3">
                {cifra.cover_url ? (
                  <img src={cifra.cover_url} alt={`Cifra de ${cifra.title}`} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                    <Music className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold group-hover:text-primary-400 transition-colors line-clamp-1">
                    {cifra.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-1">{cifra.artist}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-primary-500/15 text-primary-400 text-xs rounded-md font-medium">
                      {cifra.original_key}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {PUBLIC_INSTRUMENTS.find(i => i.value === cifra.instrument)?.label || cifra.instrument}
                    </span>
                    <span className="text-gray-600 text-xs ml-auto flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {isCifraV2(cifra) ? 'V2' : cifra.views_count}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </>
  );
};

export default CifrasListPage;
