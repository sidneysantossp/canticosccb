import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-6 h-6" />,
    error: <XCircle className="w-6 h-6" />,
    warning: <AlertCircle className="w-6 h-6" />,
    info: <Info className="w-6 h-6" />
  };

  const colors = {
    success: {
      bg: 'bg-green-500/20',
      border: 'border-green-500',
      text: 'text-green-400',
      icon: 'text-green-400'
    },
    error: {
      bg: 'bg-red-500/20',
      border: 'border-red-500',
      text: 'text-red-400',
      icon: 'text-red-400'
    },
    warning: {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500',
      text: 'text-yellow-400',
      icon: 'text-yellow-400'
    },
    info: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500',
      text: 'text-blue-400',
      icon: 'text-blue-400'
    }
  };

  const style = colors[type];

  return (
    <div 
      className={`
        ${style.bg} ${style.border} border rounded-lg p-4 shadow-lg
        flex items-start gap-3 min-w-[320px] max-w-md
        animate-slide-in
      `}
    >
      <div className={style.icon}>
        {icons[type]}
      </div>
      
      <div className="flex-1">
        <h4 className={`font-semibold ${style.text}`}>{title}</h4>
        {message && (
          <p className="text-gray-300 text-sm mt-1">{message}</p>
        )}
      </div>

      <button
        onClick={() => onClose(id)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;
