import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface PendingClaim {
  songId: string;
  songTitle: string;
  songArtist: string;
  songCoverUrl?: string;
  timestamp: string;
}

export function usePendingCopyrightClaim() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const pendingClaim = sessionStorage.getItem('pendingCopyrightClaim');
    
    if (pendingClaim) {
      try {
        const claimData: PendingClaim = JSON.parse(pendingClaim);
        const userRole = user?.role || 'user';
        
        // Criar uma notificação persistente para o usuário
        if (userRole === 'composer' || userRole === 'admin') {
          // Mostrar toast ou notificação
          const message = `Você tem uma reivindicação pendente para "${claimData.songTitle}". Clique aqui para continuar.`;
          
          // Criar um elemento de notificação
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 z-[200] bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-lg shadow-lg max-w-sm cursor-pointer';
          notification.innerHTML = `
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0">⚠️</div>
              <div class="flex-1">
                <p class="font-semibold text-sm">Reivindicação Pendente</p>
                <p class="text-xs opacity-90 mt-1">${message}</p>
              </div>
              <button class="ml-2 text-white/80 hover:text-white" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
          `;
          
          // Adicionar evento de clique para navegar para a música
          notification.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).tagName !== 'BUTTON') {
              // Aqui você pode implementar a navegação para a música específica
              // Por exemplo: window.location.href = `/hino/${claimData.songId}`;
              alert(`Navegando para "${claimData.songTitle}"...`);
              notification.remove();
            }
          });
          
          document.body.appendChild(notification);
          
          // Remover após 10 segundos se não interagir
          setTimeout(() => {
            if (document.body.contains(notification)) {
              notification.remove();
            }
          }, 10000);
          
        } else {
          // Para não-compositores, mostrar alerta e limpar
          alert(`Caro(a) ${user?.name || 'Usuário'},\n\nVocê tinha uma reivindicação pendente, mas apenas compositores podem acelerar o processo. Para continuar, envie um e-mail para direitosautorais@canticosccb.com.br`);
          sessionStorage.removeItem('pendingCopyrightClaim');
        }
        
      } catch (error) {
        console.error('Erro ao processar reivindicação pendente:', error);
        sessionStorage.removeItem('pendingCopyrightClaim');
      }
    }
  }, [isAuthenticated, user]);

  return null;
}
