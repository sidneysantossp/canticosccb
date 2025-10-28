import React from 'react';
import { X, Music, Play, Pause } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';

interface QueueSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const QueueSidebar: React.FC<QueueSidebarProps> = ({ isOpen, onClose }) => {
  const { currentTrack, queue, play, isPlaying, removeFromQueue } = usePlayerStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop com Blur */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[29]"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed top-[88px] right-0 bottom-0 w-80 bg-background-secondary rounded-tl-2xl z-[30] flex flex-col shadow-2xl" style={{ boxShadow: '-8px 0 24px -4px rgba(34, 197, 94, 0.3)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-white font-bold text-lg">Fila</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-40">
        {/* Tocando Agora */}
        {currentTrack && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Tocando agora</h3>
            <div className="flex items-center gap-3 p-2 bg-background-tertiary rounded">
              <div className="relative w-12 h-12 flex-shrink-0">
                <img 
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-full h-full rounded object-cover"
                />
                {/* Play/Pause Icon Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded">
                  {isPlaying ? (
                    <div className="flex gap-0.5">
                      <div className="w-1 h-3 bg-primary-500 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-3 bg-primary-500 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-3 bg-primary-500 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  ) : (
                    <Play className="w-5 h-5 text-primary-500 fill-primary-500" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium text-sm truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-gray-400 text-xs truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Próximas */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            Próximas de: Hinos CCB
          </h3>
          
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Music className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">
                Nenhuma música na fila
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Adicione músicas para reproduzir em seguida
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((track, index) => (
                <div 
                  key={`${track.id}-${index}`}
                  className="flex items-center gap-3 p-2 hover:bg-background-tertiary rounded transition-colors group"
                >
                  <div 
                    onClick={() => play(track)}
                    className="relative w-10 h-10 flex-shrink-0 cursor-pointer"
                  >
                    <img 
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full rounded object-cover"
                    />
                    {/* Play Icon on Hover */}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                  <div 
                    onClick={() => play(track)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <h4 className="text-white text-sm truncate group-hover:text-primary-400">
                      {track.title}
                    </h4>
                    <p className="text-gray-400 text-xs truncate">
                      {track.artist}
                    </p>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {track.duration}
                  </span>
                  {/* Botão Remover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(track.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                    title="Remover da fila"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default QueueSidebar;
