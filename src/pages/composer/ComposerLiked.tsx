import React from 'react';

const ComposerLiked: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Mais Curtidas</h1>
        <p className="text-gray-400">Músicas do seu catálogo com mais curtidas</p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-400">Em breve: lista real com contagem de curtidas e período selecionável</p>
      </div>
    </div>
  );
};

export default ComposerLiked;
