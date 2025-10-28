import React from 'react';
import { Link } from 'react-router-dom';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

export type HymnCard = {
  id: string;
  title: string;
  subtitle?: string;
  cover: string;
};

type Props = {
  title: string;
  viewAllHref: string;
  items: HymnCard[] | undefined;
  onPlay: (item: HymnCard) => void;
  onScrollLeft?: () => void;
  onScrollRight?: () => void;
};

const HymnsSection: React.FC<Props> = ({ title, viewAllHref, items, onPlay, onScrollLeft, onScrollRight }) => {
  if (!items || items.length === 0) return null;
  return (
    <section className="px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={viewAllHref}
            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            Ver todos
          </Link>
          <div className="flex gap-2">
            <button
              onClick={onScrollLeft}
              className="p-2 rounded-full bg-background-secondary hover:bg-background-tertiary text-white transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onScrollRight}
              className="p-2 rounded-full bg-background-secondary hover:bg-background-tertiary text-white transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {items.map((hino: any, index: number) => (
          <div key={`${hino.id}-${index}`} className="group flex-shrink-0 w-48 bg-background-secondary hover:bg-background-tertiary p-4 rounded-lg transition-all duration-300 hover:scale-105">
            <div className="relative mb-4">
              <img
                src={hino.cover}
                alt={hino.title}
                className="w-full aspect-square object-cover rounded-lg shadow-lg"
                loading="lazy"
              />
              <button
                onClick={() => onPlay(hino)}
                className="absolute bottom-2 right-2 bg-primary-500 hover:bg-primary-600 text-black p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"
                aria-label={`Reproduzir ${hino.title}`}
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
            <h3 className="font-bold text-white mb-1 line-clamp-2">{hino.title}</h3>
            {hino.subtitle && (
              <p className="text-sm text-gray-400 line-clamp-1">{hino.subtitle}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default HymnsSection;
