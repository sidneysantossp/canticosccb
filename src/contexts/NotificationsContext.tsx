import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured, supabaseFetch } from '@/lib/supabaseRest';

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
    if (!user?.id || !isSupabaseConfigured) {
      setUnreadCount(0);
      return;
    }

    // Validar se user.id é um UUID válido (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(String(user.id))) {
      // User ID não é UUID válido (provavelmente vem da API antiga), ignorar notificações silenciosamente
      setUnreadCount(0);
      return;
    }

    try {
      const rows = await supabaseFetch<{ read?: boolean }>('notifications', {
        user_id: `eq.${user.id}`,
        read: 'eq.false',
        select: 'id,read'
      });
      const unread = rows.filter((row) => !row.read).length;
      setUnreadCount(unread);
    } catch (err) {
      // Silenciosamente ignorar erros de notificações (não crítico)
      setUnreadCount(0);
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
