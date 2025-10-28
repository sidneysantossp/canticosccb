import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  buttonText?: string;
  buttonColor?: 'blue' | 'green' | 'amber' | 'red';
  imageUrl?: string;
  imageName?: string;
}

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'Fechar',
  buttonColor = 'green',
  imageUrl,
  imageName
}: AlertModalProps) {
  
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-500',
    green: 'bg-green-600 hover:bg-green-500',
    amber: 'bg-amber-600 hover:bg-amber-500',
    red: 'bg-red-600 hover:bg-red-500'
  } as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
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
                <h2 className="text-xl font-bold text-white">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Thumbnail e Nome do Álbum */}
            {imageUrl && (
              <div className="mb-6 flex flex-col items-center">
                <img
                  src={imageUrl}
                  alt={imageName || 'Capa'}
                  className="w-32 h-32 rounded-lg object-cover shadow-lg mb-3"
                />
                {imageName && (
                  <p className="text-white font-semibold text-lg">{imageName}</p>
                )}
              </div>
            )}

            {/* Content */}
            <div className="mb-6">
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>

            {/* Button */}
            <button
              onClick={onClose}
              className={`w-full px-4 py-3 rounded-lg ${colorClasses[buttonColor]} text-white font-semibold transition-colors`}
            >
              {buttonText}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
