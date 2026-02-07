import { useState, useEffect } from 'react';
import { getPremiumVisibility } from '@/lib/admin/premiumAdminApi';

/**
 * Hook that returns whether premium features are enabled globally.
 * Reads from site_config (cached in localStorage for speed).
 */
export function usePremiumEnabled(): boolean {
  const [enabled, setEnabled] = useState<boolean>(() => {
    // Sync read from localStorage for instant render
    try {
      const cached = localStorage.getItem('premium_enabled_flag_v1');
      return cached === '1' || cached === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let cancelled = false;
    getPremiumVisibility().then((val) => {
      if (!cancelled) setEnabled(val);
    });
    return () => { cancelled = true; };
  }, []);

  return enabled;
}
