import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Play, Pause, Heart, MoreHorizontal } from 'lucide-react';

export type TrendItem = {
  id: string;
  title: string;
  artist: string;
  category: string;
  duration: string;
  coverUrl: string;
};

type Props = {
  title?: string;
  items: TrendItem[];
  currentTrackId?: string | null;
  isPlaying?: boolean;
  onTogglePlay: (item: TrendItem) => void;
  isFavorited: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  getTrendingArrow: (item: TrendItem) => React.ReactNode;
  getRankChange: (item: TrendItem) => React.ReactNode;
  getTrendingIcon: (item: TrendItem) => React.ReactNode;
};

const TrendsSection: React.FC<Props> = ({
  title = 'Recém publicados',
  items,
  currentTrackId,
  isPlaying,
  onTogglePlay,
  isFavorited,
  onToggleFavorite,
  getTrendingArrow,
  getRankChange,
  getTrendingIcon
}) => {
  if (!items || items.length === 0) return null;
  return (
    <section className="px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <span>{title}</span>
            <TrendingUp className="w-7 h-7 text-primary-400" />
          </h2>
        </div>
        <Link to="/recem-chegados" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
          Ver todos
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.slice(0, 9).map((hino, index) => (
          <div
            key={hino.id}
            className="group flex items-center gap-4 bg-background-secondary hover:bg-background-tertiary p-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
          >
            {/* Ranking Number */}
            <div className="flex-shrink-0 w-12 text-center">
              <div className="flex flex-col items-center">
                {/* Mobile arrow above number */}
                <div className="md:hidden">
                  {getTrendingArrow(hino)}
                </div>
                <span className="text-lg font-bold text-gray-400 group-hover:text-primary-400 transition-colors">
                  {index + 1}
                </span>
                {/* Desktop indicator below number */}
                <div className="hidden md:block">
                  {getRankChange(hino)}
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className="relative flex-shrink-0">
              <img
                src={hino.coverUrl}
                alt={hino.title}
                className="w-12 h-12 rounded object-cover"
                loading="lazy"
              />
              <button
                onClick={() => onTogglePlay(hino)}
                className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Reproduzir ${hino.title}`}
              >
                {currentTrackId === hino.id && isPlaying ? (
                  <Pause className="w-4 h-4 text-white fill-current" />
                ) : (
                  <Play className="w-4 h-4 text-white fill-current" />
                )}
              </button>
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
                {hino.title}
              </h3>
              <p className="text-sm text-gray-400 truncate">
                {hino.artist} • {hino.category}
              </p>
            </div>

            {/* Trailing Info & Actions */}
            <div className="flex items-center gap-4 ml-auto -mr-[22px] pr-[3px]">
              <span className="hidden md:inline-block text-sm text-gray-400 md:min-w-[52px] text-right">
                {hino.duration}
              </span>
              <div className="flex items-center gap-1">
                {/* Mobile trending indicator next to heart */}
                <div className="md:hidden mr-1">
                  {getTrendingIcon(hino)}
                </div>

                {/* Favorite icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(hino.id);
                  }}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    isFavorited(hino.id)
                      ? 'text-red-500 hover:bg-red-500/10 scale-110'
                      : 'text-gray-400 hover:text-red-400 hover:bg-background-primary'
                  }`}
                  aria-label={isFavorited(hino.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  title={isFavorited(hino.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <Heart className={`w-4 h-4 transition-transform ${isFavorited(hino.id) ? 'fill-current' : ''}`} />
                </button>

                {/* More options */}
                <button
                  className="p-2 hover:bg-background-primary rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Mais opções"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendsSection;
