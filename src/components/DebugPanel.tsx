import React, { useState } from 'react';

interface DebugPanelProps {
  data: any;
  isLoading: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ data, isLoading }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 hover:bg-red-600"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-2xl z-50 max-w-md max-h-96 overflow-auto border-2 border-red-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-red-400">🐛 Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <strong className={isLoading ? 'text-yellow-400' : 'text-green-400'}>
            Status:
          </strong>{' '}
          {isLoading ? '⏳ Carregando...' : '✅ Carregado'}
        </div>

        <div>
          <strong className="text-blue-400">Banners:</strong>{' '}
          {data.banners?.length || 0}
        </div>

        <div>
          <strong className="text-blue-400">Álbuns:</strong>{' '}
          {data.albums?.length || 0}
        </div>

        <div>
          <strong className="text-blue-400">Hinos Cantados:</strong>{' '}
          {data.hymnsCantados?.length || 0}
        </div>

        <div>
          <strong className="text-blue-400">Hinos Tocados:</strong>{' '}
          {data.hymnsTocados?.length || 0}
        </div>

        <div>
          <strong className="text-blue-400">Hinos Avulsos:</strong>{' '}
          {data.hymnsAvulsos?.length || 0}
        </div>

        <div>
          <strong className="text-blue-400">Compositores:</strong>{' '}
          {data.composers?.length || 0}
        </div>

        <div>
          <strong className="text-blue-400">Categorias:</strong>{' '}
          {data.categories?.length || 0}
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-purple-400 hover:text-purple-300">
            Ver dados completos
          </summary>
          <pre className="mt-2 text-xs bg-black p-2 rounded overflow-auto max-h-48">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default DebugPanel;
