import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Music } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: any;
}

const CifrasOverlay: React.FC<Props> = ({ isOpen, onClose, currentTrack }) => {
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
              <div className="flex items-center gap-3">
                <Music className="w-8 h-8 text-primary-400" />
                <h3 className="text-2xl font-bold text-white">Cifras</h3>
              </div>
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

              <div className="p-6 bg-amber-900/20 border border-amber-700/30 rounded-xl text-center">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Music className="w-8 h-8 text-amber-400" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Em Desenvolvimento</h4>
                <p className="text-gray-300 leading-relaxed">
                  O recurso de <strong className="text-primary-400">Cifras e Acordes</strong> está sendo desenvolvido e estará disponível em breve!
                </p>
                <p className="text-gray-400 text-sm mt-3">
                  Você poderá visualizar e aprender os acordes de todos os hinos da plataforma.
                </p>
              </div>

              <button onClick={onClose} className="w-full mt-6 px-4 py-3 rounded-lg bg-primary-500 hover:bg-primary-400 text-black font-medium transition-colors">
                Entendi
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CifrasOverlay;
