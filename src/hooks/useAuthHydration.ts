import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuthHydration() {
  const [isHydrated, setIsHydrated] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkHydration = () => {
      attempts++;
      console.log(`Tentativa de hidratação ${attempts}/${maxAttempts}`);
      
      const hasLocalStorage = !!localStorage.getItem('auth-storage');
      
      if (hasLocalStorage) {
        try {
          const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}');
          const storedAuth = stored.state?.isAuthenticated || false;
          const storedUser = stored.state?.user || null;
          
          console.log('Estado da hidratação:', {
            hasLocalStorage,
            storedAuth,
            storedUser: storedUser ? `${storedUser.name} (${storedUser.role})` : null,
            zustandAuth: isAuthenticated,
            zustandUser: user ? `${user.name} (${user.role})` : null,
            attempt: attempts
          });
          
          // Se há dados no localStorage mas Zustand não carregou, forçar
          if (storedAuth && storedUser && !isAuthenticated) {
            console.log('🔄 Sincronizando Zustand com localStorage...');
            useAuthStore.setState({
              user: storedUser,
              isAuthenticated: storedAuth
            });
            
            // Aguardar um pouco para o estado propagar
            setTimeout(() => {
              console.log('✅ Sincronização concluída');
              setIsHydrated(true);
            }, 50);
            return;
          }
          
          // Se Zustand já tem os dados corretos
          if (isAuthenticated && user) {
            console.log('✅ Zustand já hidratado corretamente');
            setIsHydrated(true);
            return;
          }
          
        } catch (error) {
          console.error('❌ Erro ao verificar hidratação:', error);
        }
      }
      
      // Se não há localStorage ou tentativas esgotaram
      if (!hasLocalStorage || attempts >= maxAttempts) {
        console.log('✅ Hidratação finalizada (sem dados ou max tentativas)');
        setIsHydrated(true);
        return;
      }
      
      // Tentar novamente após delay
      setTimeout(checkHydration, 100);
    };

    // Iniciar verificação
    checkHydration();
    
  }, []); // Executar apenas uma vez na montagem

  return { isHydrated, isAuthenticated, user };
}
