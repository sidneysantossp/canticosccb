import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchActiveCategories, type CategoryRecord } from '@/lib/categoriesApi';
import { buildAlbumCoverUrl } from '@/lib/media-helper';

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

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'cantados' | 'avulsos' | 'tocados'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('name');

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
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
    }
    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [allCategories, activeFilter, search, sortBy]);

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Hero Gradient (álbum-like) */}
      <div className="text-white bg-gradient-to-b from-green-700 to-transparent pt-16 pb-6 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Categorias</h1>
          <p className="text-xl text-primary-100">
            Explore nosso conteúdo organizado por categorias
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="relative w-full md:max-w-md">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nas categorias"
              className="w-full px-4 py-2 rounded-full bg-background-secondary border border-gray-700 text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <div className="ml-auto hidden md:flex items-center gap-2">
            <label className="text-sm text-text-muted">Ordenar</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-background-secondary border border-gray-700 text-white"
            >
              <option value="name">Nome</option>
              <option value="recent">Recentes</option>
            </select>
          </div>
        </div>
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
                  src={buildAlbumCoverUrl({ id: String(category.id), cover_url: category.image_url })}
                  alt={category.name}
                  className="w-12 h-12 rounded object-cover"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/seed/category-fallback-${category.id}/200/200`; }}
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
