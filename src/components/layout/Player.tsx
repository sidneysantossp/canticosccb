import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, List, X, Heart, ChevronUp } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { usePlayerContext } from '@/contexts/PlayerContext';
import useFavoritesStore from '@/stores/favoritesStore';
import { useAuth } from '@/contexts/AuthContextMock';
import { registerPlay } from '@/lib/api/registerPlay';
import FullScreenPlayer from '@/components/FullScreenPlayer';
import QueueSidebar from '@/components/QueueSidebar';

interface PlayerProps {
  isHidden?: boolean;
}

const Player: React.FC<PlayerProps> = ({ isHidden = false }) => {
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
    setVolume,
    setCurrentTime,
    repeat,
    setRepeat,
    playNext,
    stop
  } = usePlayerStore();

  const { isFullScreenOpen, openFullScreen, closeFullScreen } = usePlayerContext();
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const { user } = useAuth();

  const [shuffle, setShuffle] = React.useState(false);
  const [isQueueOpen, setIsQueueOpen] = React.useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = React.useState(false);

  // Fechar volume slider quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showVolumeSlider && !(event.target as Element).closest('.volume-container')) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showVolumeSlider]);

  // Simular progresso da música e auto-stop no final
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        const newTime = currentTime + 1;
        
        // Se chegou ao final
        if (newTime >= duration) {
          playNext(); // Chama função que trata repeat
        } else {
          setCurrentTime(newTime);
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration, playNext, setCurrentTime]);

  // Registrar play real apenas uma vez por faixa iniciada
  const lastReportedTrackIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const id = currentTrack?.id;
    if (!id) return;
    // Se começou a tocar e ainda não reportamos este id nesta sessão
    if (isPlaying && lastReportedTrackIdRef.current !== id) {
      lastReportedTrackIdRef.current = id;
      const parsedId = parseInt(id, 10);
      if (!Number.isNaN(parsedId)) {
        registerPlay(parsedId, user?.id).catch(() => {});
      }
    }
  }, [currentTrack?.id, isPlaying, user?.id]);

  if (!currentTrack) {
    return null;
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const [isDragging, setIsDragging] = React.useState(false);
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * (duration || 0);
    setCurrentTime(newTime);
  };
  
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };
  
  const handleProgressMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const progressBar = document.querySelector('.progress-bar-player') as HTMLElement;
    if (!progressBar) return;
    
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * (duration || 0);
    setCurrentTime(newTime);
  };
  
  const handleProgressMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleProgressTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * (duration || 0);
    setCurrentTime(newTime);
  };
  
  const handleProgressTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * (duration || 0);
    setCurrentTime(newTime);
  };
  
  const handleProgressTouchEnd = () => {
    setIsDragging(false);
  };
  
  // Event listeners para drag
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleProgressMouseMove);
      document.addEventListener('mouseup', handleProgressMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleProgressMouseMove);
        document.removeEventListener('mouseup', handleProgressMouseUp);
      };
    }
  }, [isDragging]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <QueueSidebar 
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />
      
      <FullScreenPlayer 
        isOpen={isFullScreenOpen} 
        onClose={closeFullScreen} 
      />
      
      {/* Audio Player Bar - Fixed at bottom - Hidden when FullScreen is open */}
      {!isFullScreenOpen && (
      <div className={`fixed bottom-16 lg:bottom-0 left-0 right-0 bg-background-tertiary border-t border-gray-700 z-50 transition-transform duration-300 ${
        isHidden ? 'translate-y-full' : 'translate-y-0'
      }`}>
        <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-3 md:gap-6">
          {/* Track Info - Left Side */}
          <div 
            className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0 max-w-[300px] md:max-w-[400px] cursor-pointer" 
            onClick={() => openFullScreen()}
          >
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-12 h-12 md:w-14 md:h-14 rounded object-cover flex-shrink-0"
            />
            
            <div className="flex-1 min-w-0 hidden md:block">
              <h4 className="text-white font-semibold text-sm truncate">
                {currentTrack.title}
              </h4>
              <p className="text-gray-400 text-xs truncate">
                {currentTrack.artist}
              </p>
            </div>
            
            <button 
              onClick={() => {
                const isCurrentlyFavorite = isFavorite(parseInt(currentTrack.id));
                const uid = user?.id ? Number(user.id) : undefined;
                if (isCurrentlyFavorite) {
                  removeFavorite(parseInt(currentTrack.id), uid);
                } else {
                  addFavorite({
                    id: parseInt(currentTrack.id),
                    title: currentTrack.title,
                    artist: currentTrack.artist,
                    album: 'album' in currentTrack ? (currentTrack as any).album : 'Álbum Desconhecido',
                    duration: currentTrack.duration || '0:00',
                    coverUrl: currentTrack.coverUrl
                  }, uid);
                }
              }}
              className={`transition-colors flex-shrink-0 p-1 ${
                isFavorite(parseInt(currentTrack.id)) 
                  ? 'text-primary-500 hover:text-red-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
              title={isFavorite(parseInt(currentTrack.id)) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isFavorite(parseInt(currentTrack.id)) ? 'fill-current' : ''}`} />
            </button>
          </div>

        {/* Controls - Center */}
        <div className="flex flex-col items-center gap-1 md:gap-2 flex-1 max-w-[500px] md:max-w-[700px]">
          <div className="flex items-center gap-2 md:gap-4">
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
            onClick={() => setRepeat(repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none')}
            className={`text-gray-400 hover:text-white transition-colors ${repeat !== 'none' ? 'text-green-500' : ''}`}
            title={repeat === 'none' ? 'Repetir: Desligado' : repeat === 'one' ? 'Repetir: Uma Música' : 'Repetir: Todas'}
          >
            {repeat === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
          </div>
          
          {/* Progress Bar with Time */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-gray-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div 
              className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer group progress-bar-player" 
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
              onTouchStart={handleProgressTouchStart}
              onTouchMove={handleProgressTouchMove}
              onTouchEnd={handleProgressTouchEnd}
            >
              <div 
                className="h-full bg-white rounded-full group-hover:bg-green-500 transition-colors"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-10">
              {formatTime(duration || 225)}
            </span>
          </div>
        </div>

        {/* Volume & More - Right Side */}
        <div className="flex items-center gap-3 flex-1 justify-end max-w-[120px] relative">
          <div className="relative volume-container hidden md:block">
            <button 
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            
            {/* Volume Slider Vertical */}
            {showVolumeSlider && (
              <div 
                className="absolute bottom-full right-0 mb-2 bg-background-tertiary border border-gray-600 rounded-lg p-3 shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-center h-28 w-12">
                  <div 
                    className="relative h-20 w-1 bg-gray-600 rounded-full cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const percentage = Math.max(0, Math.min(1, 1 - (y / rect.height)));
                      setVolume(percentage);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      if (e.changedTouches.length > 0) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.changedTouches[0].clientY - rect.top;
                        const percentage = Math.max(0, Math.min(1, 1 - (y / rect.height)));
                        setVolume(percentage);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = moveEvent.clientY - rect.top;
                        const percentage = Math.max(0, Math.min(1, 1 - (y / rect.height)));
                        setVolume(percentage);
                      };
                      
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      const handleTouchMove = (moveEvent: TouchEvent) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = moveEvent.touches[0].clientY - rect.top;
                        const percentage = Math.max(0, Math.min(1, 1 - (y / rect.height)));
                        setVolume(percentage);
                      };
                      
                      const handleTouchEnd = () => {
                        document.removeEventListener('touchmove', handleTouchMove);
                        document.removeEventListener('touchend', handleTouchEnd);
                      };
                      
                      document.addEventListener('touchmove', handleTouchMove);
                      document.addEventListener('touchend', handleTouchEnd);
                    }}
                  >
                    {/* Track */}
                    <div 
                      className="absolute bottom-0 w-full bg-primary-500 rounded-full transition-all duration-150 pointer-events-none"
                      style={{ height: `${volume * 100}%` }}
                    />
                    {/* Thumb */}
                    <div 
                      className="absolute w-3 h-3 bg-primary-500 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-1/2 left-1/2 transition-all duration-150 pointer-events-none"
                      style={{ bottom: `${volume * 100}%`, transform: 'translateX(-50%) translateY(50%)' }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 mt-2">{Math.round(volume * 100)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Abrir Full Screen (Mobile Only) */}
          <button 
            onClick={() => openFullScreen()}
            className="text-gray-400 hover:text-white transition-colors md:hidden"
            aria-label="Expandir player"
            title="Expandir"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          
          {/* Botão Fila */}
          <button 
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            className={`transition-colors ml-2 ${isQueueOpen ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
            aria-label="Abrir fila"
          >
            <List className="w-5 h-5" />
          </button>
          
          {/* Botão Fechar */}
          <button 
            onClick={stop}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Fechar player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
      )}
    </>
  );
};

export default Player;
