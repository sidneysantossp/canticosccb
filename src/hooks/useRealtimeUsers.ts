// STUB temporário - Substituir com implementação real quando backend estiver pronto
import { useState, useEffect } from 'react';

export const useRealtimeUsers = (_options?: any) => {
  const [users] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  return { users, loading, error, refetch: () => {} };
};

export default useRealtimeUsers;
