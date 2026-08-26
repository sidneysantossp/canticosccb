import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchActiveCategories, type CategoryRecord } from '@/lib/categoriesApi';
import { buildCategoryImageUrl } from '@/lib/media-helper';
import { DEFAULT_COVER_URL } from '@/lib/config';
import SEOHead from '@/components/SEO/SEOHead';

const CategoriesPage: React.FC = () => {
  const [allCategories, setAllCategories] = useState<CategoryRecord[]>([]);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const list = await fetchActiveCategories();
        if (mounted) setAllCategories(list);
      } catch {
        if (mounted) setAllCategories([]);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const [activeFilter, setActiveFilter] = useState<'all' | 'cantados' | 'avulsos' | 'tocados'>('all');

  const filtered = useMemo(() => {
    let list = allCategories.slice();
    if (activeFilter !== 'all') {
      const key = activeFilter; // 'cantados' | 'avulsos' | 'tocados'
      list = list.filter((c) => {
        const s = (c.slug || '').toLowerCase();
        const n = (c.name || '').toLowerCase();
        if (key === 'cantados') return s === 'cantados' || s === 'hinos-cantados' || n.includes('cantad');
        if (key === 'avulsos')  return s === 'avulsos'  || s === 'hinos-avulsos'  || n.includes('avuls');
        if (key === 'tocados')  return s === 'tocados'  || s === 'hinos-tocados'  || n.includes('tocado');
        return true;
      });
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [allCategories, activeFilter]);

  return (
    <div className="min-h-screen bg-background-primary">
      <SEOHead
        title="Categorias de Hinos CCB"
        description="Explore hinos da comunidade CCB por categorias, temas e repertórios relacionados."
        keywords="categorias hinos CCB, hinos cantados CCB, hinos tocados CCB, hinos avulsos CCB"
        canonical="/categorias"
      />

      {/* Hero em formato de playlist */}
      <div className="-mx-6 bg-gradient-to-b from-primary-600/35 via-primary-950/25 to-background-primary px-6 pt-16 pb-10 text-white sm:-mx-8 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="mb-7 inline-flex items-center gap-2 text-white/80 transition-colors hover:text-white">← Voltar</Link>
          <div className="sm:flex sm:items-center sm:gap-8">
            <div className="mb-6 flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl bg-black/35 shadow-xl sm:mb-0" aria-hidden="true">
              <div className="h-28 w-28 rounded-full border-4 border-white/10 bg-[radial-gradient(circle_at_center,#19c463_0_13%,#0b1710_14%_20%,#303735_21%_42%,#101513_43%_60%,#343b38_61%_63%,#111514_64%_100%)] shadow-2xl" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-200">Explorar</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight md:text-5xl">Categorias</h1>
              <p className="mt-3 text-base text-white/80 md:text-lg">Explore nosso conteúdo organizado por categorias</p>
              <p className="mt-5 text-sm text-white/70">{allCategories.length} categorias disponíveis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros por categoria */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 md:overflow-visible md:flex-wrap"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {[
            { id: 'all', label: 'Todos' },
            { id: 'cantados', label: 'Hinos Cantados' },
            { id: 'avulsos', label: 'Hinos Avulsos' },
            { id: 'tocados', label: 'Hinos Tocados' },
          ].map((f: any) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm border ${
                activeFilter === f.id
                  ? 'bg-primary-600 text-black border-primary-500'
                  : 'bg-background-secondary text-white border-gray-700 hover:bg-background-tertiary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Grid - Row-style cards (como na Home), SEM 'Ver mais' */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((category) => (
            <Link
              key={category.id}
              to={`/categoria/${category.slug}`}
              className="group flex items-center gap-4 bg-background-secondary hover:bg-background-tertiary p-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={buildCategoryImageUrl({ id: String(category.id), image_url: category.image_url })}
                  alt={category.name}
                  className="w-12 h-12 rounded object-cover"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_COVER_URL; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-400 truncate">{category.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-background-secondary py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-text-muted">
            Encontre facilmente o conteúdo que você procura navegando pelas categorias acima
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
