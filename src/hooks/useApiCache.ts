import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Verificar se expirou
    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();

interface UseApiCacheOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number;
  enabled?: boolean;
}

export function useApiCache<T>({
  key,
  fetcher,
  ttl,
  enabled = true
}: UseApiCacheOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Verificar cache primeiro
    const cached = apiCache.get<T>(key);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    // Se não tem cache, buscar
    try {
      setIsLoading(true);
      const result = await fetcher();
      apiCache.set(key, result, ttl);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error(`Error fetching ${key}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    apiCache.invalidate(key);
    return fetchData();
  }, [key, fetchData]);

  const mutate = useCallback((newData: T) => {
    apiCache.set(key, newData, ttl);
    setData(newData);
  }, [key, ttl]);

  return {
    data,
    isLoading,
    error,
    refetch,
    mutate
  };
}

export default useApiCache;
