import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onShareWhatsApp: () => void;
  onShareEmail: () => void;
}

const ShareOverlay: React.FC<Props> = ({ isOpen, onClose, onCopyLink, onShareWhatsApp, onShareEmail }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Compartilhar</h3>
            <div className="space-y-2">
              <button
                onClick={onCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Share2 className="w-5 h-5 text-white" />
                <span className="text-white">Copiar link</span>
              </button>
              <button
                onClick={onShareWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <span className="text-2xl">📱</span>
                <span className="text-white">WhatsApp</span>
              </button>
              <button
                onClick={onShareEmail}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <span className="text-2xl">✉️</span>
                <span className="text-white">E-mail</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareOverlay;
