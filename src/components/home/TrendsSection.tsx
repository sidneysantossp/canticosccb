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
            className="group flex items-center gap-3 bg-background-secondary hover:bg-background-tertiary p-3 md:p-4 rounded-lg transition-all duration-300 hover:scale-[1.02]"
          >
            {/* Ranking Number - Desktop only on left */}
            <div className="hidden md:flex flex-shrink-0 w-10 text-center">
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-gray-400 group-hover:text-primary-400 transition-colors">
                  {index + 1}
                </span>
                <div>
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
            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              {/* Duration - Desktop only */}
              <span className="hidden md:inline-block text-sm text-gray-400 min-w-[40px] text-right">
                {hino.duration}
              </span>
              
              {/* Ranking Number - Mobile only on right */}
              <span className="md:hidden text-sm font-bold text-primary-400 min-w-[20px] text-center">
                #{index + 1}
              </span>

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

              {/* More options - Desktop only */}
              <button
                className="hidden md:block p-2 hover:bg-background-primary rounded-full transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Mais opções"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendsSection;
