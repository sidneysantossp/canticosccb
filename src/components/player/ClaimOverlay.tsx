import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Copyright } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: any;
  claimType: 'composer' | 'author' | 'both';
  onChangeClaimType: (v: 'composer' | 'author' | 'both') => void;
  claimDescription: string;
  onChangeClaimDescription: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ClaimOverlay: React.FC<Props> = ({ isOpen, onClose, currentTrack, claimType, onChangeClaimType, claimDescription, onChangeClaimDescription, onSubmit }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-md flex items-start justify-center p-4 pt-safe overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-b from-amber-950 via-gray-900 to-black rounded-2xl p-6 max-w-lg w-full shadow-2xl my-8 mt-20 border border-amber-900/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Copyright className="w-8 h-8 text-amber-400" />
                <h3 className="text-2xl font-bold text-white">Reivindicar Direitos Autorais</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Info do Hino */}
            <div className="bg-black/40 border border-amber-900/20 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-semibold text-amber-500 mb-3">INFORMAÇÕES DO HINO</h4>
              <div className="flex items-center gap-4 mb-4">
                <img src={currentTrack?.coverUrl} alt={currentTrack?.title} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1">
                  <h5 className="text-lg font-semibold text-white mb-1">{currentTrack?.title}</h5>
                  <p className="text-gray-300">{currentTrack?.artist}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Duração:</span>
                  <span className="text-white ml-2">{currentTrack?.duration || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400">ID:</span>
                  <span className="text-white ml-2">#{currentTrack?.id}</span>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-100 mb-2">Tipo de Reivindicação *</label>
                <select
                  value={claimType}
                  onChange={(e) => onChangeClaimType(e.target.value as 'composer' | 'author' | 'both')}
                  className="w-full px-4 py-3 bg-gray-900 border border-amber-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  style={{ colorScheme: 'dark' }}
                  required
                >
                  <option value="composer" className="bg-gray-900 text-white">Compositor</option>
                  <option value="author" className="bg-gray-900 text-white">Autor da Letra</option>
                  <option value="both" className="bg-gray-900 text-white">Compositor e Autor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-100 mb-2">Descreva sua reivindicação *</label>
                <textarea
                  value={claimDescription}
                  onChange={(e) => onChangeClaimDescription(e.target.value)}
                  placeholder="Explique detalhadamente sua relação com este hino e por que você está reivindicando os direitos autorais..."
                  rows={6}
                  className="w-full px-4 py-3 bg-black/30 border border-amber-900/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 resize-none"
                  maxLength={1000}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Máximo 1000 caracteres</p>
              </div>

              <div className="bg-amber-950/50 border border-amber-900/40 rounded-lg p-4">
                <p className="text-sm text-amber-200">
                  ⚠️ <strong className="text-amber-400">Atenção:</strong> Reivindicações falsas podem resultar no banimento da plataforma.
                  Nossa equipe analisará cuidadosamente todas as informações fornecidas.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={!claimDescription.trim()} className="flex-1 px-4 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed">Enviar Reivindicação</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClaimOverlay;
