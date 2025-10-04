import React, { useState } from 'react';
import { X, Play, GripVertical, Trash2, ListMusic, Shuffle } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';

interface QueueProps {
  isOpen: boolean;
  onClose: () => void;
}

const Queue: React.FC<QueueProps> = ({ isOpen, onClose }) => {
  const { currentTrack, play } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  // Mock queue data
  const queueItems = [
    {
      id: 1,
      title: 'Hino 100 - Vencendo Vem Jesus',
      artist: 'Coral CCB',
      duration: '3:45',
      coverUrl: 'https://picsum.photos/seed/queue1/100/100',
      isPlaying: true
    },
    {
      id: 2,
      title: 'Hino 50 - Saudosa Lembrança',
      artist: 'Coral CCB',
      duration: '4:12',
      coverUrl: 'https://picsum.photos/seed/queue2/100/100',
      isPlaying: false
    },
    {
      id: 3,
      title: 'Hino 200 - Jerusalém Celeste',
      artist: 'Coral CCB',
      duration: '3:58',
      coverUrl: 'https://picsum.photos/seed/queue3/100/100',
      isPlaying: false
    },
    {
      id: 4,
      title: 'Hino 1 - Deus Eterno',
      artist: 'Coral CCB',
      duration: '3:30',
      coverUrl: 'https://picsum.photos/seed/queue4/100/100',
      isPlaying: false
    },
    {
      id: 5,
      title: 'Hino 5 - Vem Pecador',
      artist: 'Coral CCB',
      duration: '4:05',
      coverUrl: 'https://picsum.photos/seed/queue5/100/100',
      isPlaying: false
    }
  ];

  const historyItems = [
    {
      id: 101,
      title: 'Hino 300 - Além do Véu',
      artist: 'Coral CCB',
      duration: '3:22',
      coverUrl: 'https://picsum.photos/seed/history1/100/100',
      playedAt: '2 minutos atrás'
    },
    {
      id: 102,
      title: 'Hino 150 - Fé Mais Fé',
      artist: 'Coral CCB',
      duration: '3:55',
      coverUrl: 'https://picsum.photos/seed/history2/100/100',
      playedAt: '5 minutos atrás'
    },
    {
      id: 103,
      title: 'Hino 75 - Ceia do Senhor',
      artist: 'Coral CCB',
      duration: '4:18',
      coverUrl: 'https://picsum.photos/seed/history3/100/100',
      playedAt: '10 minutos atrás'
    }
  ];

  const handleRemoveFromQueue = (id: number) => {
    // TODO: Implement remove from queue
    console.log('Remove from queue:', id);
  };

  const handleClearQueue = () => {
    // TODO: Implement clear queue
    console.log('Clear queue');
  };

  const handleShuffleQueue = () => {
    // TODO: Implement shuffle queue
    console.log('Shuffle queue');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Queue Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-background-secondary border-l border-gray-700 z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <ListMusic className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-bold text-white">Fila de Reprodução</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-background-hover transition-colors"
          >
            <X className="w-5 h-5 text-text-muted hover:text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'queue' ? 'text-white' : 'text-text-muted hover:text-white'
            }`}
          >
            Próximas ({queueItems.length})
            {activeTab === 'queue' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'history' ? 'text-white' : 'text-text-muted hover:text-white'
            }`}
          >
            Histórico ({historyItems.length})
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
        </div>

        {/* Actions Bar */}
        {activeTab === 'queue' && queueItems.length > 0 && (
          <div className="flex items-center gap-2 p-3 border-b border-gray-700">
            <button
              onClick={handleShuffleQueue}
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-white transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              Embaralhar
            </button>
            <button
              onClick={handleClearQueue}
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-red-500 transition-colors ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              Limpar fila
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'queue' ? (
            /* Queue Items */
            queueItems.length > 0 ? (
              <div className="p-2">
                {queueItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`group flex items-center gap-3 p-2 rounded-lg hover:bg-background-hover transition-colors ${
                      item.isPlaying ? 'bg-background-hover' : ''
                    }`}
                  >
                    {/* Drag Handle */}
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-4 h-4 text-text-muted" />
                    </button>

                    {/* Cover */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded"
                      />
                      {item.isPlaying && (
                        <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                          <div className="w-1 h-4 bg-primary-500 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium truncate ${
                        item.isPlaying ? 'text-primary-500' : 'text-white'
                      }`}>
                        {item.title}
                      </h4>
                      <p className="text-text-muted text-xs truncate">{item.artist}</p>
                    </div>

                    {/* Duration & Actions */}
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted text-xs">{item.duration}</span>
                      <button
                        onClick={() => handleRemoveFromQueue(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background-tertiary rounded"
                      >
                        <X className="w-4 h-4 text-text-muted hover:text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty Queue State */
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-background-tertiary rounded-full flex items-center justify-center mb-4">
                  <ListMusic className="w-8 h-8 text-text-muted" />
                </div>
                <h3 className="text-white font-semibold mb-2">Fila vazia</h3>
                <p className="text-text-muted text-sm mb-4">
                  Adicione músicas à fila para ouvi-las depois
                </p>
              </div>
            )
          ) : (
            /* History Items */
            historyItems.length > 0 ? (
              <div className="p-2">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 p-2 rounded-lg hover:bg-background-hover transition-colors"
                  >
                    {/* Cover */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded opacity-80"
                      />
                      <button
                        onClick={() => play(item)}
                        className="absolute inset-0 bg-black/50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white/80 truncate">
                        {item.title}
                      </h4>
                      <p className="text-text-muted text-xs truncate">{item.artist}</p>
                    </div>

                    {/* Played At */}
                    <span className="text-text-muted text-xs whitespace-nowrap">
                      {item.playedAt}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty History State */
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-background-tertiary rounded-full flex items-center justify-center mb-4">
                  <ListMusic className="w-8 h-8 text-text-muted" />
                </div>
                <h3 className="text-white font-semibold mb-2">Sem histórico</h3>
                <p className="text-text-muted text-sm">
                  Suas músicas recentes aparecerão aqui
                </p>
              </div>
            )
          )}
        </div>

        {/* Footer Info */}
        {activeTab === 'queue' && queueItems.length > 0 && (
          <div className="p-4 border-t border-gray-700 bg-background-tertiary">
            <p className="text-text-muted text-xs text-center">
              Tempo total da fila: <span className="text-white font-medium">18min 30s</span>
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Queue;
