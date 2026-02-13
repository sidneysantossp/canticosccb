import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Play, Pause, Heart, MoreHorizontal } from 'lucide-react';
import { buildHinoUrl } from '@/utils/slugUrl';

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
};

const TrendsSection: React.FC<Props> = ({
  title = 'Recém publicados',
  items,
  currentTrackId,
  isPlaying,
  onTogglePlay,
  isFavorited,
  onToggleFavorite
}) => {
  if (!items || items.length === 0) return null;
  return (
    <section className="px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 leading-tight">
            <span>
              {title === 'Recém publicados' ? (
                <>
                  Recém<br />publicados
                </>
              ) : title}
            </span>
            <TrendingUp className="w-7 h-7 text-primary-400" />
          </h2>
        </div>
        <Link to="/recem-chegados" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
          Ver todos
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.slice(0, 9).map((hino, index) => (
          <div
            key={hino.id}
            className="group bg-background-secondary hover:bg-background-tertiary p-2.5 sm:p-3 rounded-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex gap-3">
              {/* Cover Image */}
              <div className="relative flex-shrink-0">
                <img
                  src={hino.coverUrl}
                  alt={hino.title}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded object-cover"
                  loading="lazy"
                />
                <button
                  onClick={() => onTogglePlay(hino)}
                  className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Reproduzir ${hino.title}`}
                >
                  {currentTrackId === hino.id && isPlaying ? (
                    <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-current" />
                  ) : (
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-current" />
                  )}
                </button>
              </div>

              {/* Track Info - Title, Duration and Favorite */}
              <div className="flex-1 min-w-0">
                <Link to={buildHinoUrl(hino.id, hino.title)}>
                  <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors leading-tight cursor-pointer text-sm sm:text-base">
                    {hino.title}
                  </h3>
                </Link>
                
                {/* Author and Category - Below Title */}
                <p className="text-xs sm:text-sm text-gray-400 leading-tight mt-0.5 truncate">
                  {hino.artist} • {hino.category}
                </p>
                
                {/* Duration and Favorite - Below Author/Category */}
                <div className="flex items-center justify-between mt-1">
                  {/* Duration */}
                  <span className="text-xs sm:text-sm text-gray-400">
                    {hino.duration}
                  </span>

                  {/* Favorite icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(hino.id);
                    }}
                    className={`p-1.5 sm:p-2 rounded-full transition-all duration-300 ${
                      isFavorited(hino.id)
                        ? 'text-red-500 hover:bg-red-500/10 scale-110'
                        : 'text-gray-400 hover:text-red-400 hover:bg-background-primary'
                    }`}
                    aria-label={isFavorited(hino.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    title={isFavorited(hino.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Heart className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isFavorited(hino.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendsSection;
