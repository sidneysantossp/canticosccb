import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface NotificationsContextType {
  unreadCount: number;
  refreshCount: () => Promise<void>;
  decrementCount: () => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  unreadCount: 0,
  refreshCount: async () => {},
  decrementCount: () => {}
});

export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await fetch(`/api/notificacoes/index.php?usuario_id=${user.id}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.nao_lidas || 0);
      }
    } catch (err) {
      console.error('Erro ao buscar contagem de notificações:', err);
    }
  }, [user?.id]);

  const decrementCount = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Carregar contagem inicial
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Atualizar a cada 30 segundos
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      refreshCount();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user?.id, refreshCount]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshCount, decrementCount }}>
      {children}
    </NotificationsContext.Provider>
  );
};
