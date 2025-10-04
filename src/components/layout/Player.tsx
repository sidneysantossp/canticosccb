import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, MoreHorizontal, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import FullScreenPlayer from '@/components/FullScreenPlayer';

const Player: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    play,
    pause,
    resume,
    next,
    previous,
    setVolume
  } = usePlayerStore();

  const [shuffle, setShuffle] = React.useState(false);
  const [repeat, setRepeat] = React.useState<'off' | 'all' | 'one'>('off');
  const [isFullScreenOpen, setIsFullScreenOpen] = React.useState(false);

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * (duration || 0);
    // TODO: Implement seek functionality in store
    console.log('Seek to:', newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <FullScreenPlayer 
        isOpen={isFullScreenOpen} 
        onClose={() => setIsFullScreenOpen(false)} 
      />
      
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 bg-background-tertiary border-t border-gray-700 z-30 lg:z-40">
        {/* Progress Bar */}
        <div 
          className="w-full h-1 bg-gray-700 cursor-pointer hover:h-2 transition-all duration-200"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div 
          className="flex items-center justify-between px-4 py-3 cursor-pointer md:cursor-default"
          onClick={() => {
            // Abre fullscreen apenas no mobile
            if (window.innerWidth < 768) {
              setIsFullScreenOpen(true);
            }
          }}
        >
          {/* Track Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-12 h-12 rounded object-cover"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-text-primary font-medium text-sm truncate">
                {currentTrack.title}
              </h4>
              <p className="text-text-muted text-xs truncate">
                {currentTrack.artist}
              </p>
            </div>
            <button className="icon-button" onClick={(e) => e.stopPropagation()}>
              <Heart className="w-4 h-4" />
            </button>
          </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <button 
            onClick={() => setShuffle(!shuffle)}
            className={`icon-button hidden md:flex ${shuffle ? 'text-primary-500' : 'text-text-muted'}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          
          <button 
            onClick={previous}
            className="icon-button hidden sm:flex"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={handlePlayPause}
            className="w-10 h-10 bg-primary-500 text-black rounded-full flex items-center justify-center hover:bg-primary-400 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
          
          <button 
            onClick={next}
            className="icon-button hidden sm:flex"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
            className={`icon-button hidden md:flex ${repeat !== 'off' ? 'text-primary-500' : 'text-text-muted'}`}
          >
            {repeat === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Volume & More */}
        <div className="flex items-center space-x-3 flex-1 justify-end">
          <div className="hidden md:flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-text-muted" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          
          <span className="text-text-muted text-xs hidden sm:block">
            {formatTime(currentTime)} / {formatTime(duration || 180)}
          </span>
          
          <button className="icon-button" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default Player;
