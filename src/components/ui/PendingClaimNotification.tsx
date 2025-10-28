import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Music } from 'lucide-react';
import { useAuthHydration } from '@/hooks/useAuthHydration';

interface PendingClaim {
  songId: string;
  songTitle: string;
  songArtist: string;
  songCoverUrl?: string;
  timestamp: string;
}

export default function PendingClaimNotification() {
  const { isHydrated, isAuthenticated, user } = useAuthHydration();
  const [pendingClaim, setPendingClaim] = useState<PendingClaim | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Verificar na montagem do componente
  useEffect(() => {
    console.log('PendingClaimNotification - MONTAGEM do componente');
    checkForPendingClaim();
    
    // Listener para teste manual
    const handleTestClaim = () => {
      console.log('Teste manual disparado!');
      checkForPendingClaim();
    };
    
    window.addEventListener('checkPendingClaim', handleTestClaim);
    
    return () => {
      window.removeEventListener('checkPendingClaim', handleTestClaim);
    };
  }, []);

  // Verificar quando auth mudar (só após hidratação)
  useEffect(() => {
    if (!isHydrated) {
      console.log('Aguardando hidratação...');
      return;
    }
    
    console.log('PendingClaimNotification - AUTH mudou', {
      isHydrated,
      isAuthenticated,
      user,
      userRole: user?.role
    });
    
    if (isAuthenticated && user) {
      checkForPendingClaim();
    }
  }, [isHydrated, isAuthenticated, user]);

  const checkForPendingClaim = () => {
    const savedClaim = sessionStorage.getItem('pendingCopyrightClaim');
    console.log('Verificando claim pendente:', savedClaim);
    
    if (!savedClaim) {
      console.log('Nenhuma claim pendente encontrada');
      return;
    }

    // Verificação dupla de autenticação
    const zustandAuth = { isAuthenticated, user };
    const localStorageData = localStorage.getItem('auth-storage');
    
    let finalUser = user;
    let finalAuth = isAuthenticated;
    
    // Se Zustand falhar, tentar localStorage diretamente
    if (!isAuthenticated && localStorageData) {
      try {
        const parsed = JSON.parse(localStorageData);
        const state = parsed.state || parsed;
        if (state.isAuthenticated && state.user) {
          finalAuth = true;
          finalUser = state.user;
          console.log('Usando auth do localStorage:', state);
        }
      } catch (e) {
        console.log('Erro ao ler localStorage:', e);
      }
    }

    console.log('Auth final:', { finalAuth, finalUser });

    if (!finalAuth || !finalUser) {
      console.log('Usuário não autenticado, mantendo claim para depois');
      return;
    }

    try {
      const claimData: PendingClaim = JSON.parse(savedClaim);
      const userRole = finalUser?.role || 'user';
      
      console.log('Dados da claim:', claimData);
      console.log('Role do usuário:', userRole);
      
      if (userRole === 'composer' || userRole === 'admin') {
        console.log('Usuário é compositor/admin, mostrando notificação');
        setPendingClaim(claimData);
        setIsVisible(true);
        
        // Auto-hide após 15 segundos
        setTimeout(() => {
          console.log('Auto-hide da notificação');
          setIsVisible(false);
        }, 15000);
      } else {
        console.log('Usuário não é compositor/admin, limpando claim');
        sessionStorage.removeItem('pendingCopyrightClaim');
      }
      
    } catch (error) {
      console.error('Erro ao processar reivindicação pendente:', error);
      sessionStorage.removeItem('pendingCopyrightClaim');
    }
  };

  const handleContinue = () => {
    if (pendingClaim) {
      // Usar alert temporário para mostrar que funcionou
      alert(`Continuando reivindicação para "${pendingClaim.songTitle}".\n\nEm uma implementação real, isso abriria o player com a música e o formulário de reivindicação.`);
      
      // TODO: Implementar navegação real
      // Opções:
      // 1. window.location.href = `/player?song=${pendingClaim.songId}&openClaim=true`;
      // 2. Usar react-router: navigate(`/player?song=${pendingClaim.songId}&openClaim=true`);
      // 3. Chamar função do player store para tocar música específica
      
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
            Você estava reivindicando direitos autorais desta música. Deseja continuar?
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
