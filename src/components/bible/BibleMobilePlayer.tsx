import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  ChevronDown, ChevronUp, Heart, Share2, Download, X 
} from 'lucide-react';
import { formatDuration } from '@/utils/youtubeApi';

interface BibleMobilePlayerProps {
  id: number;
  title: string;
  bookName: string;
  description: string;
  content: string; // HTML content
  audioUrl: string;
  thumbnail?: string;
  onClose?: () => void;
  onEnded?: () => void;
}

const BibleMobilePlayer: React.FC<BibleMobilePlayerProps> = ({
  id,
  title,
  bookName,
  description,
  content,
  audioUrl,
  thumbnail,
  onClose,
  onEnded
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onEnded]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white z-50 overflow-y-auto">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20">
        <div className="text-center flex-1">
          <p className="text-xs text-blue-200 uppercase tracking-wide">TOCANDO DA BÍBLIA</p>
          <p className="text-sm font-medium">Bíblia Narrada</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Album Art */}
      <div className="flex justify-center py-8">
        <div className="relative">
          <div className="w-80 h-80 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl overflow-hidden">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-6xl font-bold opacity-20">📖</div>
              </div>
            )}
          </div>
          
          {/* Play/Pause Overlay */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-2xl"
          >
            {isLoading ? (
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-16 h-16 text-white" />
            ) : (
              <Play className="w-16 h-16 text-white ml-2" />
            )}
          </button>
        </div>
      </div>

      {/* Track Info */}
      <div className="px-6 text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-blue-200 text-lg">{bookName}</p>
        {description && (
          <p className="text-blue-300 text-sm mt-2 opacity-80">{description}</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-6">
        <div className="relative mb-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${progressPercentage}%, rgba(255,255,255,0.2) ${progressPercentage}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-blue-200">
          <span>{formatDuration(Math.floor(currentTime))}</span>
          <span>{formatDuration(Math.floor(duration))}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8 px-6 mb-6">
        <button
          onClick={() => skipTime(-15)}
          className="p-3 hover:bg-white/10 rounded-full transition-colors"
        >
          <SkipBack className="w-6 h-6" />
        </button>

        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="p-4 bg-white text-blue-900 rounded-full hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-8 h-8 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </button>

        <button
          onClick={() => skipTime(15)}
          className="p-3 hover:bg-white/10 rounded-full transition-colors"
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-6 px-6 mb-6">
        <button
          onClick={() => setIsFavorited(!isFavorited)}
          className={`p-3 rounded-full transition-colors ${
            isFavorited ? 'text-red-400 bg-red-400/20' : 'hover:bg-white/10'
          }`}
        >
          <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={toggleMute}
          className="p-3 hover:bg-white/10 rounded-full transition-colors"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        <button className="p-3 hover:bg-white/10 rounded-full transition-colors">
          <Share2 className="w-5 h-5" />
        </button>

        <button className="p-3 hover:bg-white/10 rounded-full transition-colors">
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Content Toggle - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Content Panel */}
        <div className={`bg-gradient-to-t from-blue-900 to-blue-800 transition-transform duration-300 ease-in-out ${
          showContent ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <div 
              className="prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setShowContent(!showContent)}
          className="w-full flex items-center justify-between p-4 bg-blue-900/90 backdrop-blur-sm border-t border-blue-700/50"
        >
          <span className="font-medium text-white">Abrir Legenda</span>
          {showContent ? (
            <ChevronDown className="w-5 h-5 text-white" />
          ) : (
            <ChevronUp className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Bottom Padding for fixed button */}
      <div className="h-20" />

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #60a5fa;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #60a5fa;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .prose h1, .prose h2, .prose h3 {
          color: #dbeafe;
        }

        .prose p {
          color: #bfdbfe;
          line-height: 1.7;
        }

        .prose strong {
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default BibleMobilePlayer;
