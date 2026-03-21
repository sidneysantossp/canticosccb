import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Music } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PendingClaim {
  songId: string;
  songTitle: string;
  songArtist: string;
  songCoverUrl?: string;
  timestamp: string;
}

export default function PendingClaimNotification() {
  const navigate = useNavigate();
  const { user, profile, loading, isAdmin, isComposer } = useAuth();
  const [pendingClaim, setPendingClaim] = useState<PendingClaim | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Verificar na montagem do componente
  useEffect(() => {
    if (!loading) {
      checkForPendingClaim();
    }

    const handleTestClaim = () => {
      if (!loading) {
        checkForPendingClaim();
      }
    };

    window.addEventListener('checkPendingClaim', handleTestClaim);
    return () => {
      window.removeEventListener('checkPendingClaim', handleTestClaim);
    };
  }, [loading, user, profile, isAdmin, isComposer]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (user && profile) {
      checkForPendingClaim();
    }
  }, [loading, user, profile, isAdmin, isComposer]);

  const checkForPendingClaim = () => {
    const savedClaim = sessionStorage.getItem('pendingCopyrightClaim');

    if (!savedClaim) {
      return;
    }

    if (!user || !profile) {
      return;
    }

    try {
      const claimData: PendingClaim = JSON.parse(savedClaim);

      if (isComposer || isAdmin) {
        setPendingClaim(claimData);
        setIsVisible(true);

        setTimeout(() => {
          setIsVisible(false);
        }, 15000);
      } else {
        sessionStorage.removeItem('pendingCopyrightClaim');
      }
    } catch (error) {
      console.error('Erro ao processar reivindicação pendente:', error);
      sessionStorage.removeItem('pendingCopyrightClaim');
    }
  };

  const handleContinue = () => {
    if (pendingClaim) {
      navigate('/compositor/direitos-autorais', {
        state: {
          pendingClaim,
        },
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.removeItem('pendingCopyrightClaim');
    setPendingClaim(null);
  };

  if (!pendingClaim || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 right-4 z-[200] max-w-sm"
      >
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-lg p-4 text-white">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h4 className="font-semibold text-sm">Reivindicação Pendente</h4>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Song Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/20 flex-shrink-0">
              {pendingClaim.songCoverUrl ? (
                <img 
                  src={pendingClaim.songCoverUrl} 
                  alt={pendingClaim.songTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{pendingClaim.songTitle}</p>
              <p className="text-xs opacity-90 truncate">{pendingClaim.songArtist}</p>
            </div>
          </div>

          {/* Message */}
          <p className="text-xs opacity-90 mb-4">
            Você estava reivindicando direitos autorais deste hino. Deseja continuar?
          </p>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-medium transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 px-3 py-2 rounded-lg bg-white text-amber-600 hover:bg-white/90 text-xs font-semibold transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
