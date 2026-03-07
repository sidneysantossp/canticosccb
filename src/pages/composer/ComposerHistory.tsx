import React from 'react';
import { Clock } from 'lucide-react';

const ComposerHistory: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Histórico do Catálogo</h1>
        <p className="text-gray-400">Acompanhe o histórico operacional do seu conteúdo</p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
        <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">
          Em breve: linha do tempo de alterações, publicações e revisões dos seus hinos e álbuns.
        </p>
      </div>
    </div>
  );
};

export default ComposerHistory;
