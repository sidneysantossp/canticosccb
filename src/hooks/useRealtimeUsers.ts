// STUB temporário - Substituir com implementação real quando backend estiver pronto
import { useState, useEffect } from 'react';

export const useRealtimeUsers = (options?: any) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  return { users, loading, error, refetch: () => {} };
};

export default useRealtimeUsers;
