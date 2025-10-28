import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  name: string;
  description: string;
  onChangeName: (v: string) => void;
  onChangeDescription: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const CreatePlaylistOverlay: React.FC<Props> = ({ isOpen, name, description, onChangeName, onChangeDescription, onSubmit, onClose }) => {
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
              <h3 className="text-2xl font-bold text-white">Nova Playlist</h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome da playlist *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onChangeName(e.target.value)}
                  placeholder="Ex: Minhas Favoritas"
                  className="w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descrição (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => onChangeDescription(e.target.value)}
                  placeholder="Adicione uma descrição..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  maxLength={200}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={onClose} className="flex-1 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">Cancelar</button>
                <button onClick={onSubmit} disabled={!name.trim()} className="flex-1 px-4 py-3 rounded-lg bg-primary-500 hover:bg-primary-400 text-black font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Criar</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePlaylistOverlay;
