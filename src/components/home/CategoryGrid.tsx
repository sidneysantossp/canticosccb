import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchActiveCategories, type CategoryRecord } from '@/lib/categoriesApi';
import { Plus } from 'lucide-react';
import { buildAlbumCoverUrl } from '@/lib/media-helper';

const CategoryGrid: React.FC = () => {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const visibleCategories = categories.slice(0, Math.min(8, categories.length));
  const showViewMore = categories.length > 8;

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchActiveCategories();
        if (isMounted) {
          setCategories(data);
        }
        console.log('[CategoryGrid] categorias carregadas:', data.length);
      } catch (error) {
        if (isMounted) {
          setCategories([]);
        }
        console.error('[CategoryGrid] erro ao carregar categorias:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Explore por Categoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/3] bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white">Explore por Categoria</h2>
        <p className="text-gray-400 text-sm mt-1">Navegue por diferentes estilos e tipos de hino</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visibleCategories.map((category) => (
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

        {showViewMore && (
          <Link
            to="/categorias"
            className="group flex items-center gap-4 bg-background-secondary hover:bg-background-tertiary p-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 rounded bg-primary-500/20 flex items-center justify-center">
              <Plus className="w-6 h-6 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">Ver mais</h3>
              <p className="text-sm text-gray-400 truncate">Ver todas as categorias</p>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
};

export default CategoryGrid;
