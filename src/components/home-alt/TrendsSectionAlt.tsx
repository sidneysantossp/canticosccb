import React from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { hasPlayableTrackSource } from '@/lib/playerFeedback';

interface TrendsSectionAltProps {
  title: string;
  items: any[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onTogglePlay: (item: any) => void;
  isFavorited: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  getTrendingArrow: (item: any) => React.ReactNode;
  getRankChange: (item: any) => React.ReactNode;
  getTrendingIcon: (item: any) => React.ReactNode;
  isDarkMode: boolean;
}

const TrendsSectionAlt: React.FC<TrendsSectionAltProps> = ({
  title,
  items,
  currentTrackId,
  isPlaying,
  onTogglePlay,
  isFavorited,
  onToggleFavorite,
  getTrendingArrow,
  getRankChange: _getRankChange,
  getTrendingIcon: _getTrendingIcon,
  isDarkMode
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="px-6">
      <h2 className={`text-2xl md:text-3xl font-bold mb-6 ${
        isDarkMode ? 'text-white' : 'text-black'
      }`}>
        {title}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => {
          const isCurrentTrack = currentTrackId === item.id;
          const isCurrentlyPlaying = isCurrentTrack && isPlaying;
          const canPlay = hasPlayableTrackSource({
            number: item.number,
            title: item.title,
            artist: item.artist,
            audioUrl: item.audioUrl,
            youtubeSource: item.youtubeSource,
          });
          
          return (
            <div
              key={item.id}
              className={`group relative rounded-lg overflow-hidden transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-900 hover:bg-gray-800' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-4 p-4">
                {/* Rank */}
                <div className="flex flex-col items-center min-w-[40px]">
                  {getTrendingArrow(item)}
                  <span className={`text-lg font-bold ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    {item.rank || index + 1}
                  </span>
                </div>

                {/* Cover */}
                <div className="relative w-16 h-16 flex-shrink-0">
                  <img
                    src={item.coverUrl || '/placeholder-hymn.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover rounded"
                  />
                  {canPlay ? (
                    <button
                      onClick={() => onTogglePlay(item)}
                      className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                        isDarkMode ? 'bg-black/60' : 'bg-white/60'
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause className={isDarkMode ? 'text-white' : 'text-black'} size={24} />
                      ) : (
                        <Play className={isDarkMode ? 'text-white' : 'text-black'} size={24} />
                      )}
                    </button>
                  ) : null}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold truncate ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm truncate ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {item.artist}
                  </p>
                </div>

                {/* Favorite */}
                <button
                  onClick={() => onToggleFavorite(item.id)}
                  className="flex-shrink-0"
                >
                  <Heart
                    size={20}
                    className={`transition-colors ${
                      isFavorited(item.id)
                        ? 'fill-red-500 text-red-500'
                        : isDarkMode
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrendsSectionAlt;
