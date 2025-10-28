import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'blue' | 'green' | 'amber';
  songTitle?: string;
  songArtist?: string;
  songCover?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancelar',
  confirmColor = 'blue',
  songTitle,
  songArtist,
  songCover
}: ConfirmModalProps) {
  
  // Debug: ver o que está sendo recebido
  React.useEffect(() => {
    if (isOpen && songTitle) {
      console.log('📋 ConfirmModal aberto:', {
        songTitle,
        songArtist,
        songCover,
        hasCover: !!songCover
      });
    }
  }, [isOpen, songTitle, songArtist, songCover]);
  
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-500',
    green: 'bg-green-600 hover:bg-green-500',
    amber: 'bg-amber-600 hover:bg-amber-500'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-b from-[#124e2a] to-[#000201] rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-bold text-white">Atenção</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Song Info */}
            {songTitle && (
              <>
                <div className="flex items-center gap-3 mb-4 bg-black/20 p-3 rounded-lg">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                    {songCover ? (
                      <img 
                        src={songCover} 
                        alt={songTitle}
                        className="w-full h-full object-cover bg-gray-700"
                        onError={(e) => {
                          console.log('❌ Erro ao carregar imagem:', songCover);
                          // Se falhar, substituir por fallback
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
                                <span class="text-white text-sm font-bold">CCB</span>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">CCB</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{songTitle}</h3>
                    <p className="text-white/70 text-sm truncate">{songArtist || 'Coral CCB'}</p>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="border-t border-white/10 mb-4"></div>
              </>
            )}

            {/* Message */}
            <div className="mb-6">
              <p className="text-white/80 text-sm leading-relaxed">
                {message}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg bg-gray-700/80 hover:bg-gray-700 text-white font-medium transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-4 py-3 rounded-lg ${colorClasses[confirmColor]} text-white font-semibold transition-colors`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
