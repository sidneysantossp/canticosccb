import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: {
      icon: 'text-red-500',
      confirmBtn: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: 'text-yellow-500',
      confirmBtn: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      icon: 'text-blue-500',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <AlertTriangle className={`w-12 h-12 ${colors[type].icon}`} />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-3 text-white">
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-300 text-center mb-6 whitespace-pre-line">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg font-semibold transition-colors bg-gray-800 hover:bg-gray-700 text-white"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors text-white ${colors[type].confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
