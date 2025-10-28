import React from 'react';
import { motion } from 'framer-motion';
import { Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1, Music, Share2, Plus, Copyright } from 'lucide-react';

interface Props {
  isAlbumTheme: boolean;
  storeShuffle: boolean;
  onToggleShuffle: () => void;
  onPrevious: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  storeRepeat: 'none' | 'one' | 'all' | string;
  onRepeatToggle: () => void;
  onAddToPlaylist: () => void;
  onShowCifras: () => void;
  onClaim: () => void;
  onShare: () => void;
}

const PlayerControls: React.FC<Props> = ({
  isAlbumTheme,
  storeShuffle,
  onToggleShuffle,
  onPrevious,
  isPlaying,
  onPlayPause,
  onNext,
  storeRepeat,
  onRepeatToggle,
  onAddToPlaylist,
  onShowCifras,
  onClaim,
  onShare,
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onToggleShuffle}
          className={`p-2 rounded-full transition-colors relative ${storeShuffle ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
          title={isAlbumTheme ? 'Embaralhar álbum' : 'Embaralhar playlist'}
        >
          <Shuffle className="w-5 h-5" />
          {isAlbumTheme && <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full" />}
        </button>

        <button onClick={onPrevious} className="p-3 text-white hover:scale-110 transition-transform" title={isAlbumTheme ? 'Faixa anterior' : 'Música anterior'}>
          <SkipBack className="w-7 h-7 fill-current" />
        </button>

        <motion.button whileTap={{ scale: 0.9 }} onClick={onPlayPause} className="p-6 bg-white rounded-full shadow-2xl hover:scale-105 transition-transform">
          {isPlaying ? <Pause className="w-8 h-8 text-black fill-current" /> : <Play className="w-8 h-8 text-black fill-current ml-1" />}
        </motion.button>

        <button onClick={onNext} className="p-3 text-white hover:scale-110 transition-transform" title={isAlbumTheme ? 'Próxima faixa' : 'Próxima música'}>
          <SkipForward className="w-7 h-7 fill-current" />
        </button>

        <button
          onClick={onRepeatToggle}
          className={`p-2 rounded-full transition-colors relative ${storeRepeat === 'none' ? 'text-gray-400 hover:text-white' : 'text-green-500'}`}
          title={isAlbumTheme ? `Repetir: ${storeRepeat === 'none' ? 'Desligado' : storeRepeat === 'one' ? 'Faixa atual' : 'Todo o álbum'}` : `Repetir: ${storeRepeat === 'none' ? 'Desligado' : storeRepeat === 'one' ? 'Música atual' : 'Toda a playlist'}`}
        >
          {storeRepeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          {isAlbumTheme && storeRepeat !== 'none' && <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full" />}
        </button>
      </div>

      <div className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={onAddToPlaylist} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title={isAlbumTheme ? 'Adicionar faixa à playlist' : 'Adicionar música à playlist'}>
            <Plus className="w-5 h-5 text-white" />
            <span className="text-sm text-white font-medium">Adicionar</span>
          </button>

          <button onClick={onShowCifras} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <Music className="w-5 h-5 text-white" />
            <span className="text-sm text-white font-medium">Cifras</span>
          </button>

          <button onClick={onClaim} className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Reivindicar Direitos Autorais">
            <Copyright className="w-5 h-5 text-white" />
          </button>

          <button onClick={onShare} className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors" title="Compartilhar">
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </>
  );
};

export default PlayerControls;
