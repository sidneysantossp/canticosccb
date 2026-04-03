import React from 'react';
import { Link } from 'react-router-dom';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_COVER_URL } from '@/lib/config';
import { buildHinoUrl } from '@/utils/slugUrl';
import { hasPlayableTrackSource } from '@/lib/playerFeedback';

export type HymnCard = {
  id: string;
  number?: number;
  title: string;
  subtitle?: string;
  cover: string;
};

type Props = {
  title: React.ReactNode;
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
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
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
          (() => {
            const canPlay = hasPlayableTrackSource({
              number: hino.number,
              title: hino.title,
              artist: hino.subtitle,
              audioUrl: hino.audioUrl,
              youtubeSource: hino.youtubeSource,
            });

            return (
              <Link
                key={`${hino.id}-${index}`}
                to={buildHinoUrl(hino.id, hino.title, hino.number)}
                className="group flex-shrink-0 w-48 bg-background-secondary hover:bg-background-tertiary p-4 rounded-lg transition-all duration-300 hover:scale-105 no-underline"
              >
                <div className="relative mb-4">
                  <img
                    src={hino.cover || DEFAULT_COVER_URL}
                    alt={hino.title}
                    className="w-full aspect-square object-cover rounded-lg shadow-lg"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = DEFAULT_COVER_URL;
                    }}
                  />
                  {canPlay ? (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlay(hino); }}
                      className="absolute bottom-2 right-2 bg-primary-500 hover:bg-primary-600 text-black p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"
                      aria-label={`Reproduzir ${hino.title}`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  ) : null}
                </div>
                <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors leading-tight cursor-pointer text-sm sm:text-base mb-1 line-clamp-2">{hino.title}</h3>
                {hino.subtitle && (
                  <p className="text-sm text-gray-400 line-clamp-1">{hino.subtitle}</p>
                )}
              </Link>
            );
          })()
        ))}
      </div>
    </section>
  );
};

export default HymnsSection;
