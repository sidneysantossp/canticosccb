import React from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFreePlayGateStore } from '@/stores/freePlayGateStore';
import { googleOAuthLogin } from '@/lib/supabase-auth';

const FreePlayGateModal: React.FC = () => {
  const navigate = useNavigate();
  const { isModalOpen, blockedTrack, closeGate } = useFreePlayGateStore();

  if (!isModalOpen || !blockedTrack) return null;

  const handleGoogleLogin = async () => {
    try {
      await googleOAuthLogin();
    } catch (err) {
      console.error('Erro no Google Login:', err);
      // Fallback: redirecionar para página de login
      closeGate();
      navigate('/login', { state: { from: window.location.pathname } });
    }
  };

  const handleEmailRegister = () => {
    closeGate();
    navigate('/register', { state: { from: window.location.pathname } });
  };

  const handleLogin = () => {
    closeGate();
    navigate('/login', { state: { from: window.location.pathname } });
  };

  const coverUrl = blockedTrack.coverUrl || '';

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center" style={{ zIndex: 99999 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeGate}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 mb-0 sm:mb-0 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl">
        {/* Gradient background */}
        <div className="bg-gradient-to-b from-purple-700 via-purple-800 to-purple-950 p-6 pb-8">
          {/* Close button */}
          <button
            onClick={closeGate}
            className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-colors z-10"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>

          {/* Content */}
          <div className="flex flex-col items-center text-center pt-2">
            {/* Hymn Cover */}
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-lg overflow-hidden shadow-2xl mb-6 ring-2 ring-white/20">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={blockedTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-purple-600 flex items-center justify-center">
                  <Music className="w-16 h-16 text-white/40" />
                </div>
              )}
            </div>

            {/* Hymn Title */}
            <h3 className="text-white font-bold text-lg sm:text-xl mb-2 line-clamp-2 px-4">
              {blockedTrack.title}
            </h3>

            {/* Artist */}
            {blockedTrack.artist && (
              <p className="text-white/60 text-sm mb-4">
                {blockedTrack.artist}
              </p>
            )}

            {/* Message */}
            <h2 className="text-white font-bold text-xl sm:text-2xl mb-2 leading-tight">
              Crie sua conta gratuita<br />para continuar ouvindo
            </h2>
            <p className="text-white/70 text-sm mb-6">
              Ouça milhares de hinos da CCB sem limites
            </p>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full max-w-xs bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3.5 px-6 rounded-full flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg mb-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar com Google
            </button>

            {/* Email Register Button */}
            <button
              onClick={handleEmailRegister}
              className="w-full max-w-xs bg-transparent hover:bg-white/10 text-white font-semibold py-3.5 px-6 rounded-full border border-white/40 hover:border-white/60 flex items-center justify-center gap-3 transition-all mb-6"
            >
              <Mail className="w-5 h-5" />
              Registrar com e-mail
            </button>

            {/* Already have account */}
            <p className="text-white/60 text-sm">
              Já tem uma conta?{' '}
              <button
                onClick={handleLogin}
                className="text-white font-semibold underline underline-offset-2 hover:text-primary-400 transition-colors"
              >
                Entrar
              </button>
            </p>
          </div>
        </div>

        {/* Bottom close button (mobile) */}
        <div className="bg-purple-950 py-4 sm:hidden">
          <button
            onClick={closeGate}
            className="w-full text-white/60 font-medium text-sm hover:text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default FreePlayGateModal;
