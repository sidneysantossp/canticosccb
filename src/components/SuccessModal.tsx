import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  details?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'success',
  details
}) => {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle className="w-12 h-12 text-green-500" />,
    error: <AlertCircle className="w-12 h-12 text-red-500" />,
    info: <Info className="w-12 h-12 text-blue-500" />
  };

  const titleColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400'
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
          {icons[type]}
        </div>

        {/* Title */}
        <h2 className={`text-xl font-bold text-center mb-3 ${titleColors[type]}`}>
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-300 text-center mb-4 whitespace-pre-line">
          {message}
        </p>

        {/* Details (optional) */}
        {details && (
          <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-400 whitespace-pre-line">
              {details}
            </p>
          </div>
        )}

        {/* OK Button */}
        <button
          onClick={onClose}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            type === 'success'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : type === 'error'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
