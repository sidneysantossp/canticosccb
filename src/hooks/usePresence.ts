import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

/**
 * Hook que envia heartbeat de presença para o Supabase.
 * Deve ser usado uma vez no componente raiz (App).
 */
export function usePresence() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user?.id) {
      // Limpar intervalo se o usuário deslogou
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const sendHeartbeat = async () => {
      try {
        const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

        const url = `${SUPABASE_URL}/rest/v1/user_presence`;
        
        await fetch(url, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            user_id: user.id,
            user_name: user.nome || user.email?.split('@')[0] || 'Anônimo',
            user_email: user.email || '',
            last_seen: new Date().toISOString(),
          }),
        });
      } catch (err) {
        // Silently fail - presence is non-critical
      }
    };

    // Send immediately on mount / login
    sendHeartbeat();

    // Then every HEARTBEAT_INTERVAL
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.id, user?.nome, user?.email]);
}
