import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';
import { mockUsers } from '@/data/mockData';
import { setSimpleAuth, clearSimpleAuth } from '@/utils/simpleAuth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User>) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          // Mock login - sempre sucesso
          const user = mockUsers.find(u => u.email === email) || mockUsers[0];
          console.log('🔐 Tentando login:', { user: user?.name, email, role: user?.role });
          
          // Atualizar estado Zustand
          set({ user, isAuthenticated: true });
          
          // SEMPRE salvar no SimpleAuth como backup
          if (user) {
            const simpleUser = {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role || 'user',
              isPremium: user.isPremium,
              createdAt: user.createdAt
            };
            setSimpleAuth(simpleUser);
            console.log('✅ SimpleAuth backup salvo');
          }
          
          // Aguardar persist processar
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verificar se persistiu
          const saved = localStorage.getItem('auth-storage');
          console.log('📦 Zustand persist status:', saved ? 'OK' : 'FALHOU');
          
          if (!saved) {
            console.warn('⚠️ Zustand persist falhou, mas SimpleAuth está ativo');
          }
          
          return true;
        } catch (error) {
          console.error('❌ Erro no login:', error);
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        clearSimpleAuth(); // Limpar backup também
        console.log('🚪 Logout realizado - Zustand e SimpleAuth limpos');
      },

      register: async (userData: Partial<User>) => {
        // Mock register
        const newUser: User = {
          id: Date.now().toString(),
          email: userData.email || '',
          name: userData.name || '',
          avatar: userData.avatar,
          role: userData.role || 'user',
          isPremium: false,
          createdAt: new Date().toISOString()
        };
        set({ user: newUser, isAuthenticated: true });
        return true;
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        console.log('Migrando auth store, versão:', version);
        return persistedState;
      },
      onRehydrateStorage: () => {
        console.log('🔄 Iniciando hidratação do auth store');
        return (state, error) => {
          if (error) {
            console.error('❌ Erro na hidratação do auth store:', error);
          } else {
            console.log('✅ Auth store hidratado com sucesso:', {
              isAuthenticated: state?.isAuthenticated,
              user: state?.user ? `${state.user.name} (${state.user.role})` : null
            });
          }
        };
      },
      // Configurações adicionais para melhor performance
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      skipHydration: false
    }
  )
);

export default useAuthStore;
