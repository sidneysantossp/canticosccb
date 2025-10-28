// STUB temporário - Substituir com implementação real quando backend estiver pronto
import { useState, useEffect } from 'react';

export const useRealtimeTable = (tableName: string, options?: any) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simular carregamento
    setLoading(false);
  }, [tableName]);

  return { data, loading, error, refetch: () => {} };
};

export default useRealtimeTable;
