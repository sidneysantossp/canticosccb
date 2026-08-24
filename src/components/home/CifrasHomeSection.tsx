import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music, Eye, AlertCircle } from 'lucide-react';
import { Cifra, INSTRUMENTS } from '@/api/cifras';
import { fetchMergedPublicCifrasListDetailed, type PublicCifraPageData } from '@/lib/cifras-v2';
import { CIFRA_V2_INSTRUMENTS } from '@/types/cifras-v2';
import { buildCifraUrl } from '@/utils/cifraUrl';

type DisplayCifra = Cifra | PublicCifraPageData;

const PUBLIC_INSTRUMENTS = [
  ...INSTRUMENTS,
  ...CIFRA_V2_INSTRUMENTS.filter((entry) => !INSTRUMENTS.some((legacy) => legacy.value === entry.value)),
];

const CifrasHomeSection: React.FC = () => {
  const [cifras, setCifras] = useState<DisplayCifra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isXl, setIsXl] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadWarning, setLoadWarning] = useState(false);

  useEffect(() => {
    const check = () => setIsXl(window.innerWidth >= 1280);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const maxCards = isXl ? 8 : 6;

  useEffect(() => {
    loadCifras();
  }, []);

  const loadCifras = async () => {
    try {
      setIsLoading(true);
      setLoadError(false);
      setLoadWarning(false);
      const result = await fetchMergedPublicCifrasListDetailed();
      setCifras(result.items);
      setLoadWarning(result.unavailableSources.length > 0);
    } catch (err) {
      console.error('[CifrasHomeSection] Erro ao carregar cifras:', err);
      setCifras([]);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            Cifras
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const getInstrumentLabel = (value: string) =>
    PUBLIC_INSTRUMENTS.find(i => i.value === value)?.label || value;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            Cifras
          </h2>
          {loadWarning && (
            <p className="mt-1 text-xs text-amber-200">Parte do catálogo está temporariamente indisponível.</p>
          )}
        </div>
        <Link
          to="/cifras"
          className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
        >
          Ver todas
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-4 text-sm text-gray-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-300" />
            <div>
              <p className="font-medium text-white">Não foi possível carregar as cifras agora.</p>
              <button type="button" onClick={loadCifras} className="mt-2 text-primary-300 hover:text-primary-200">Tentar novamente</button>
            </div>
          </div>
        </div>
      ) : cifras.length === 0 ? (
        <div className="rounded-xl border border-gray-700/60 bg-gray-800/30 px-4 py-5 text-sm text-gray-400">
          <p className="font-medium text-gray-200">Ainda não há cifras verificadas em destaque.</p>
          <p className="mt-1">Consulte o catálogo para acompanhar os materiais liberados para estudo.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {cifras.slice(0, maxCards).map(cifra => (
          <Link
            key={cifra.id}
            to={buildCifraUrl(cifra.instrument, cifra.slug)}
            className="group flex items-center gap-3 bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/40 hover:border-gray-600 rounded-xl px-3 py-3 transition-all"
          >
            {cifra.cover_url ? (
              <img
                src={cifra.cover_url}
                alt={`Cifra de ${cifra.title}`}
                className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-gray-700/60 flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white text-sm font-semibold group-hover:text-primary-400 transition-colors line-clamp-1">
                {cifra.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 bg-primary-500/15 text-primary-400 text-[10px] rounded font-medium">
                  {cifra.original_key}
                </span>
                <span className="text-gray-500 text-xs line-clamp-1">
                  {getInstrumentLabel(cifra.instrument)}
                </span>
                <span className="text-gray-600 text-[10px] ml-auto flex items-center gap-0.5 flex-shrink-0">
                  <Eye className="w-3 h-3" />
                  {cifra.views_count}
                </span>
              </div>
            </div>
          </Link>
        ))}

      </div>
      )}
    </section>
  );
};

export default CifrasHomeSection;
