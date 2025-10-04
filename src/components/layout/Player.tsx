import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, MoreHorizontal, Shuffle, Repeat, Repeat1, ChevronUp, X } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
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

  const { isFullScreenOpen, openFullScreen, closeFullScreen } = usePlayerContext();

  const [shuffle, setShuffle] = React.useState(false);
  const [repeat, setRepeat] = React.useState<'off' | 'all' | 'one'>('off');

  if (!currentTrack) return null;

  const handleClose = () => {
    pause();
    // Aqui você pode adicionar lógica para limpar o currentTrack se necessário
  };

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
        onClose={closeFullScreen} 
      />
      
      {/* Barra sempre visível, fullscreen sobrepõe */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 bg-background-tertiary border-t border-gray-700 z-30 lg:z-40 relative">
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

        {/* Botão Expandir - Mobile (Canto Superior Direito) */}
        <button 
          className="lg:hidden absolute top-2 right-2 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
          onClick={openFullScreen}
        >
          <ChevronUp className="w-5 h-5 text-primary-500" />
        </button>

        <div className="flex items-center justify-between px-4 py-3 gap-3">
          {/* Track Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-12 h-12 rounded object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-text-primary font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                {currentTrack.title}
              </h4>
              <p className="text-text-muted text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                {currentTrack.artist}
              </p>
            </div>
          </div>
          
          {/* Controles Mobile - Direita */}
          <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
            {/* Play Button */}
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
            
            {/* Botão Fechar */}
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
          
          {/* Desktop Heart */}
          <button className="icon-button hidden lg:flex">
            <Heart className="w-4 h-4" />
          </button>

        {/* Controls - Desktop */}
        <div className="hidden lg:flex items-center space-x-2 md:space-x-4">
          <button 
            onClick={() => setShuffle(!shuffle)}
            className={`icon-button ${shuffle ? 'text-primary-500' : 'text-text-muted'}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          
          <button 
            onClick={previous}
            className="icon-button"
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
            className="icon-button"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
            className={`icon-button ${repeat !== 'off' ? 'text-primary-500' : 'text-text-muted'}`}
          >
            {repeat === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Volume & More - Desktop */}
        <div className="hidden lg:flex items-center space-x-3 flex-1 justify-end">
          <div className="flex items-center space-x-2">
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
          
          <span className="text-text-muted text-xs">
            {formatTime(currentTime)} / {formatTime(duration || 180)}
          </span>
        </div>
      </div>
    </div>
    </>
  );
};

export default Player;
