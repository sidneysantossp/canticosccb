import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Music, FileText, Eye } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { generateItemListSchema, generateBreadcrumbSchema } from '@/utils/schemaGenerator';
import { Cifra, INSTRUMENTS, CATEGORIES } from '@/api/cifras';
import { fetchMergedPublicCifrasList, type PublicCifraPageData } from '@/lib/cifras-v2';
import { CIFRA_V2_INSTRUMENTS } from '@/types/cifras-v2';

type DisplayCifra = Cifra | PublicCifraPageData;

const DEMO_CIFRA_SLUG = 'demo-hoje-deus-te-abraca';

const DEMO_LIST_CIFRA: Cifra = {
  id: -1,
  title: 'Hoje Deus Te Abraça',
  artist: 'Hinos Avulsos CCB',
  slug: DEMO_CIFRA_SLUG,
  content: '',
  original_key: 'A',
  instrument: 'violao',
  capo: 4,
  cover_url: null,
  hino_id: null,
  category: 'avulsos',
  views_count: 0,
  is_active: true,
  created_by: null,
  created_at: '2026-08-08T00:00:00.000Z',
  updated_at: '2026-08-08T00:00:00.000Z',
};

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

  useEffect(() => {
    loadCifras();
  }, []);

  const loadCifras = async () => {
    try {
      setIsLoading(true);
      const data = await fetchMergedPublicCifrasList();
      setCifras([
        DEMO_LIST_CIFRA,
        ...data.filter((cifra) => cifra.slug !== DEMO_CIFRA_SLUG),
      ]);
    } catch (err) {
      console.error('Erro ao carregar cifras:', err);
      setCifras([DEMO_LIST_CIFRA]);
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

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl text-gray-400 mb-2">
            {searchTerm || filterInstrument || filterCategory ? 'Nenhuma cifra encontrada' : 'Nenhuma cifra disponível'}
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterInstrument || filterCategory ? 'Tente ajustar os filtros' : 'Em breve teremos cifras disponíveis'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(cifra => (
            <Link
              key={cifra.id}
              to={`/cifra/${cifra.slug}`}
              className={`group rounded-xl border p-4 transition-all ${
                cifra.slug === DEMO_CIFRA_SLUG
                  ? 'border-primary-500/40 bg-primary-500/10 hover:border-primary-400/70 hover:bg-primary-500/15'
                  : 'border-gray-700/50 bg-gray-800/40 hover:border-gray-600 hover:bg-gray-800/70'
              }`}
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
                    {cifra.slug === DEMO_CIFRA_SLUG ? (
                      <span className="px-2 py-0.5 bg-primary-500 text-black text-xs rounded-md font-bold">
                        Demo
                      </span>
                    ) : null}
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
