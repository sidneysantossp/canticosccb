import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';

interface PlaylistItem {
  id: string;
  name: string;
  coverUrl?: string;
  tracks: Array<any>;
}

interface Props {
  isOpen: boolean;
  playlists: PlaylistItem[];
  onClose: () => void;
  onOpenCreate: () => void;
  onSelectPlaylist: (playlistId: string) => void;
}

const AddToPlaylistOverlay: React.FC<Props> = ({ isOpen, playlists, onClose, onOpenCreate, onSelectPlaylist }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-sm flex items-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full bg-gradient-to-b from-green-900 to-black rounded-t-3xl max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Adicionar à playlist</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)]">
              {/* Nova Playlist */}
              <button onClick={onOpenCreate} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-medium">Nova playlist</span>
              </button>

              {/* Minhas Playlists */}
              {playlists.length > 0 ? (
                <div className="space-y-2">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => onSelectPlaylist(playlist.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <img
                        src={playlist.coverUrl}
                        alt={playlist.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{playlist.name}</p>
                        <p className="text-gray-400 text-sm">
                          {playlist.tracks.length} {playlist.tracks.length === 1 ? 'hino' : 'hinos'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-2">Você ainda não criou nenhuma playlist</p>
                  <p className="text-gray-500 text-sm">Crie sua primeira playlist para organizar seus hinos</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddToPlaylistOverlay;
