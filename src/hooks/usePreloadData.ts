import { useEffect } from 'react';

// Cache global para dados precarregados
const dataCache = new Map();

export const usePreloadData = () => {
  useEffect(() => {
    // Durante a migração, não fazemos preload de APIs.
    // Mantemos o hook para compatibilidade sem efeitos colaterais.
  }, []);
};

// Hook para acessar dados do cache
export const useCachedData = (key: string) => {
  return dataCache.get(key);
};

// Função para limpar cache (útil para logout)
export const clearDataCache = () => {
  dataCache.clear();
};
