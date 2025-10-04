import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MoreVertical, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Volume2, Share2, Plus, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useState } from 'react';

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FullScreenPlayer({ isOpen, onClose }: FullScreenPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    pause,
    resume,
    next,
    previous,
    setVolume,
  } = usePlayerStore();

  const [isLiked, setIsLiked] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [showLyrics, setShowLyrics] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleSeek = (value: number) => {
    // TODO: Implementar seek no store
    console.log('Seek to:', value);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-50 bg-gradient-to-b from-green-900 via-green-800 to-black overflow-y-auto pb-20"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            <div className="text-center flex-1">
              <p className="text-xs text-gray-300 uppercase tracking-wider">
                Tocando da playlist
              </p>
              <p className="text-sm text-white font-medium">
                Minha Playlist
              </p>
            </div>

            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <MoreVertical className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Album Art - Centralizado e Grande */}
          <div className="flex items-center justify-center px-8 py-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-56 h-56 rounded-3xl shadow-2xl object-cover"
              />
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/50 to-transparent" />
              
              {/* Ícone Pause Flutuante - Só quando está tocando */}
              {isPlaying && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="p-4 bg-black/60 rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors">
                    <Pause className="w-8 h-8 text-white" />
                  </div>
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Track Info */}
          <div className="px-8 py-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <motion.h1
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  {currentTrack.title}
                </motion.h1>
                <motion.p
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-base text-gray-300"
                >
                  {currentTrack.artist}
                </motion.p>
              </div>

              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                onClick={() => setIsLiked(!isLiked)}
                className="p-3 rounded-full hover:bg-white/10 transition-colors"
              >
                <Heart
                  className={`w-7 h-7 transition-colors ${
                    isLiked ? 'fill-red-500 text-red-500' : 'text-white'
                  }`}
                />
              </motion.button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-8 py-4">
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-3
                  [&::-moz-range-thumb]:h-3
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:shadow-lg
                  [&::-moz-range-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, white ${progress}%, rgba(255,255,255,0.2) ${progress}%)`,
                }}
              />
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>{formatTime((progress / 100) * (duration || 180))}</span>
              <span>{formatTime(duration || 180)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="px-8 py-0">
            <div className="flex items-center justify-between mb-2">
              {/* Shuffle */}
              <button
                onClick={() => setShuffle(!shuffle)}
                className={`p-2 rounded-full transition-colors ${
                  shuffle ? 'text-green-500' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              {/* Previous */}
              <button
                onClick={previous}
                className="p-3 text-white hover:scale-110 transition-transform"
              >
                <SkipBack className="w-7 h-7 fill-current" />
              </button>

              {/* Play/Pause - Grande e centralizado */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handlePlayPause}
                className="p-6 bg-white rounded-full shadow-2xl hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-black fill-current" />
                ) : (
                  <Play className="w-8 h-8 text-black fill-current ml-1" />
                )}
              </motion.button>

              {/* Next */}
              <button
                onClick={next}
                className="p-3 text-white hover:scale-110 transition-transform"
              >
                <SkipForward className="w-7 h-7 fill-current" />
              </button>

              {/* Repeat */}
              <button
                onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
                className={`p-2 rounded-full transition-colors ${
                  repeat === 'off'
                    ? 'text-gray-400 hover:text-white'
                    : repeat === 'all'
                    ? 'text-green-500'
                    : 'text-green-500'
                }`}
              >
                <Repeat className="w-5 h-5" />
                {repeat === 'one' && (
                  <span className="absolute -mt-6 ml-2 text-xs font-bold">1</span>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Plus className="w-5 h-5 text-white" />
                <span className="text-sm text-white font-medium">Adicionar</span>
              </button>

              <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Lyrics Button */}
            <button
              onClick={() => setShowLyrics(true)}
              className="w-full flex items-center justify-between px-4 py-3 mt-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-white" />
                <span className="text-sm text-white font-medium">Letra do Hino</span>
              </div>
              <ChevronUp className="w-5 h-5 text-white" />
            </button>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lyrics Overlay - Abre por cima com fundo desfocado */}
      <AnimatePresence>
        {showLyrics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-md flex items-end"
            onClick={() => setShowLyrics(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full bg-gradient-to-b from-green-900 to-black rounded-t-3xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Letra do Hino</h2>
                <button
                  onClick={() => setShowLyrics(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <ChevronDown className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Lyrics Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                <p className="text-white text-base leading-relaxed whitespace-pre-line">
                  {currentTrack.lyrics || 'Letra não disponível para este hino.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
