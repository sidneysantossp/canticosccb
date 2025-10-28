import React from 'react';
import { Check, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop com blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Ícone de sucesso */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-500" strokeWidth={3} />
          </div>
        </div>

        {/* Título */}
        <h3 className="text-xl font-bold text-white text-center mb-2">
          {title}
        </h3>

        {/* Mensagem */}
        <p className="text-gray-400 text-center mb-6">
          {message}
        </p>

        {/* Botão OK */}
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
