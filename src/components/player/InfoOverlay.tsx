import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: any;
}

const InfoOverlay: React.FC<Props> = ({ isOpen, onClose, currentTrack }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-b from-green-900 to-black rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Informações</h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img src={currentTrack?.coverUrl} alt={currentTrack?.title} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-1">{currentTrack?.title}</h4>
                  <p className="text-gray-300">{currentTrack?.artist}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex justify-between">
                  <span className="text-gray-400">Duração</span>
                  <span className="text-white font-medium">{currentTrack?.duration || 'N/A'}</span>
                </div>
                {'composer' in (currentTrack || {}) && (currentTrack as any).composer && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Compositor</span>
                    <span className="text-white font-medium">{(currentTrack as any).composer}</span>
                  </div>
                )}
                {'album' in (currentTrack || {}) && (currentTrack as any).album && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Álbum</span>
                    <span className="text-white font-medium">{(currentTrack as any).album}</span>
                  </div>
                )}
                {'year' in (currentTrack || {}) && (currentTrack as any).year && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ano</span>
                    <span className="text-white font-medium">{(currentTrack as any).year}</span>
                  </div>
                )}
                {'plays' in (currentTrack || {}) && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reproduções</span>
                    <span className="text-white font-medium">{(((currentTrack as any).plays || 0) as number).toLocaleString('pt-BR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">ID</span>
                  <span className="text-white font-medium">#{currentTrack?.id}</span>
                </div>
              </div>

              <button onClick={onClose} className="w-full mt-6 px-4 py-3 rounded-lg bg-primary-500 hover:bg-primary-400 text-black font-medium transition-colors">
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InfoOverlay;
