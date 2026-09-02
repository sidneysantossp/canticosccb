import React from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, Radio, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: () => void;
  title?: string;
  message?: string;
  context?: 'favorites' | 'radio';
}

const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  title = "Login Necessário",
  message = "Você precisa estar logado para adicionar favoritos",
  context = 'favorites',
}) => {
  const navigate = useNavigate();
  const isRadioContext = context === 'radio';

  if (!isOpen) return null;

  const handleLogin = () => {
    const from = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    onLogin?.();
    onClose();
    navigate('/login', { state: { from, reason: isRadioContext ? 'radio' : 'favorite' } });
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ zIndex: 99999 }}>
      {/* Backdrop com blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-green-800 to-green-900 rounded-2xl p-6 mx-4 w-full max-w-md shadow-2xl border border-green-700/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar aviso de login"
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              {isRadioContext ? (
                <Radio className="w-6 h-6 text-green-400" />
              ) : (
                <Heart className="w-6 h-6 text-green-400" />
              )}
            </div>
            <div>
              <p className="text-white font-medium">{isRadioContext ? 'Rádio online' : 'Favoritos'}</p>
              <p className="text-green-200 text-sm">
                {isRadioContext ? 'Conteúdo exclusivo para usuários' : 'Salve seus hinos preferidos'}
              </p>
            </div>
          </div>
          
          <p className="text-green-100 text-sm leading-relaxed">
            {isRadioContext
              ? message
              : `${message}. Faça login para salvar seus hinos favoritos e acessá-los em qualquer dispositivo.`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleLogin}
            className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-400 text-black rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Login
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default LoginRequiredModal;
