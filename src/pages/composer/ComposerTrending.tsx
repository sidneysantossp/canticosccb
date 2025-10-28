import React from 'react';

const ComposerTrending: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Músicas em Alta</h1>
        <p className="text-gray-400">Veja as músicas que mais cresceram recentemente</p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-400">Em breve: ranking real de músicas em alta do seu catálogo</p>
      </div>
    </div>
  );
};

export default ComposerTrending;
