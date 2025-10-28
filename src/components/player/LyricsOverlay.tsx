import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: any;
  isAlbumTheme: boolean;
}

const LyricsOverlay: React.FC<Props> = ({ isOpen, onClose, currentTrack, isAlbumTheme }) => {
  const sanitizeHtml = (html: string) => {
    if (!html) return '';
    let out = html;
    out = out.replace(/<\/(?:script|style)>/gi, '');
    out = out.replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
    out = out.replace(/ on\w+\s*=\s*"[^"]*"/gi, '');
    out = out.replace(/ on\w+\s*=\s*'[^']*'/gi, '');
    out = out.replace(/ on\w+\s*=\s*[^\s>]+/gi, '');
    return out;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-md flex items-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full bg-gradient-to-b from-green-900 to-black rounded-t-3xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Letra</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <ChevronDown className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="mb-6 pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white mb-1">{currentTrack?.title}</h3>
                <p className="text-sm text-gray-300">{currentTrack?.artist}</p>
                {('album' in (currentTrack || {})) && (currentTrack as any).album && (
                  <p className="text-xs text-gray-400 mt-1">Álbum: {(currentTrack as any).album}</p>
                )}
              </div>

              <div className="text-white text-base leading-relaxed">
                {(() => {
                  const lyrics = currentTrack?.lyrics || '';
                  if (!lyrics) return 'Letra não disponível para este hino.';
                  const looksHtml = /<[^>]+>/.test(lyrics);
                  if (looksHtml) {
                    return (
                      <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(lyrics) }} />
                    );
                  }
                  return <div className="whitespace-pre-line">{lyrics}</div>;
                })()}
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 text-center">
                <p className="text-xs text-gray-500">
                  {isAlbumTheme ? '🎵 Tocando do álbum' : '🎵 Tocando da playlist'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LyricsOverlay;
