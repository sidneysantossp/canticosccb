import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { mockUsers } from '@/data/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User>) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: mockUsers[0], // Mock user logado por padrão
      isAuthenticated: true,

      login: async (email: string, password: string) => {
        // Mock login - sempre sucesso
        const user = mockUsers.find(u => u.email === email) || mockUsers[0];
        set({ user, isAuthenticated: true });
        return true;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      register: async (userData: Partial<User>) => {
        // Mock register
        const newUser: User = {
          id: Date.now().toString(),
          email: userData.email || '',
          name: userData.name || '',
          avatar: userData.avatar,
          isPremium: false,
          createdAt: new Date().toISOString()
        };
        set({ user: newUser, isAuthenticated: true });
        return true;
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);
