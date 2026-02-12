import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase-auth';

const HEARTBEAT_INTERVAL = 60000; // 60 seconds

/**
 * Hook que envia heartbeat de presença para o Supabase.
 * Deve ser usado uma vez no componente raiz (App).
 */
export function usePresence() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      failedRef.current = false;
      return;
    }

    const sendHeartbeat = async () => {
      if (failedRef.current) return;

      try {
        const { error } = await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            user_name: (user as any).nome || user.email?.split('@')[0] || 'Anônimo',
            user_email: user.email || '',
            last_seen: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (error) {
          // Stop retrying if table doesn't exist or has schema issues
          failedRef.current = true;
        }
      } catch {
        failedRef.current = true;
      }
    };

    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.id]);
}
