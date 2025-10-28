import React from 'react';
import { motion } from 'framer-motion';
import { X, MoreVertical, ListPlus, Share2, Download, Info, Music, Trash2 } from 'lucide-react';

interface Props {
  isAlbumTheme: boolean;
  currentTrack: any;
  onClose: () => void;
  showMenu: boolean;
  onToggleMenu: () => void;
  onOpenAddToPlaylist: () => void;
  onShare: () => void;
  onDownload: () => void;
  onShowInfo: () => void;
  canDownload: boolean;
  isPlaylistContext: boolean;
  onRemoveFromPlaylist: () => void;
}

const FSPHeaderMenu: React.FC<Props> = ({
  isAlbumTheme,
  currentTrack,
  onClose,
  showMenu,
  onToggleMenu,
  onOpenAddToPlaylist,
  onShare,
  onDownload,
  onShowInfo,
  canDownload,
  isPlaylistContext,
  onRemoveFromPlaylist,
}) => {
  return (
    <div className="flex items-center justify-between p-4">
      <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="text-center flex-1">
        <p className="text-xs text-gray-300 uppercase tracking-wider flex items-center justify-center gap-2">
          {isAlbumTheme ? <Music className="w-3 h-3" /> : null}
          {isAlbumTheme ? 'Tocando do álbum' : 'Tocando o hino'}
        </p>
        <p className={`text-sm font-medium ${isAlbumTheme ? 'text-purple-400' : 'text-white'}`}>
          {isAlbumTheme ? ((currentTrack as any)?.album || 'Álbum') : (currentTrack?.artist || currentTrack?.title || 'Hino')}
        </p>
      </div>

      <div className="relative menu-container">
        <button onClick={onToggleMenu} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <MoreVertical className="w-6 h-6 text-white" />
        </button>

        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-[110]"
          >
            <button
              onClick={() => onOpenAddToPlaylist()}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
            >
              <ListPlus className="w-5 h-5 text-white" />
              <span className="text-white">Adicionar à playlist</span>
            </button>
            {isPlaylistContext && (
              <button
                onClick={() => onRemoveFromPlaylist()}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
              >
                <Trash2 className="w-5 h-5 text-white" />
                <span className="text-white">Remover da playlist</span>
              </button>
            )}
            <button
              onClick={() => onShare()}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
            >
              <Share2 className="w-5 h-5 text-white" />
              <span className="text-white">Compartilhar</span>
            </button>
            {canDownload && (
              <button
                onClick={() => onDownload()}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
              >
                <Download className="w-5 h-5 text-white" />
                <span className="text-white">Baixar</span>
              </button>
            )}
            <button
              onClick={() => onShowInfo()}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
            >
              <Info className="w-5 h-5 text-white" />
              <span className="text-white">Informações</span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FSPHeaderMenu;
