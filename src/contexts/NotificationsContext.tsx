import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase-auth';

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
  const composerIdRef = useRef<string | null>(null);

  // Resolver compositor_id uma vez
  useEffect(() => {
    const resolve = async () => {
      if (!user?.id) { composerIdRef.current = null; return; }
      try {
        const { data: rows, error: err } = await supabase
          .from('composers')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (!err && rows && rows.length > 0) {
          composerIdRef.current = String(rows[0].id);
        } else {
          composerIdRef.current = null;
        }
      } catch {
        composerIdRef.current = null;
      }
    };
    resolve();
  }, [user?.id]);

  const refreshCount = useCallback(async () => {
    if (!user?.id) { setUnreadCount(0); return; }

    try {
      const orParts: string[] = [];
      if (composerIdRef.current) orParts.push(`composer_id.eq.${composerIdRef.current}`);
      orParts.push(`user_id.eq.${user.id}`);

      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .or(orParts.join(','))
        .eq('is_read', false);

      if (!error) setUnreadCount(count ?? 0);
    } catch {
      setUnreadCount(0);
    }
  }, [user?.id]);

  const decrementCount = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Carregar contagem inicial (aguardar composerId resolver)
  useEffect(() => {
    const timer = setTimeout(() => refreshCount(), 1000);
    return () => clearTimeout(timer);
  }, [user?.id, refreshCount]);

  // Atualizar a cada 30 segundos
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => refreshCount(), 30000);
    return () => clearInterval(interval);
  }, [user?.id, refreshCount]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshCount, decrementCount }}>
      {children}
    </NotificationsContext.Provider>
  );
};
