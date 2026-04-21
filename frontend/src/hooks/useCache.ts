/**
 * useCache - React hook for intelligent caching
 * Automatically caches API responses and provides invalidation patterns
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cacheService, type CacheConfig } from '../services/cacheService';

interface UseCacheOptions extends CacheConfig {
  cacheKey: string;
  fetchFn: () => Promise<any>;
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * Hook for cached data fetching
 * Combines local caching with React Query for best of both worlds
 */
export const useCache = <T,>({
  cacheKey,
  fetchFn,
  ttl = 5 * 60 * 1000,
  storage = 'hybrid',
  tags = [],
  enabled = true,
  onSuccess,
  onError,
}: UseCacheOptions) => {
  const [isCached, setIsCached] = useState(false);

  // Check if data is already cached
  const cachedData = enabled ? cacheService.get<T>(cacheKey) : null;

  // Use React Query for validation and update
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [cacheKey],
    queryFn: async () => {
      // Check cache first
      const cached = cacheService.get<T>(cacheKey);
      if (cached) {
        setIsCached(true);
        return cached;
      }

      // Fetch fresh data
      setIsCached(false);
      const fresh = await fetchFn();

      // Cache the result
      cacheService.set(fresh, fresh, {
        ttl,
        storage,
        tags,
      });

      return fresh;
    },
    enabled,
    staleTime: ttl,
    gcTime: ttl * 2,
  });

  useEffect(() => {
    if (data) {
      onSuccess?.(data);
    }
  }, [data, onSuccess]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  return {
    data: data ?? cachedData,
    isLoading: isLoading && !cachedData,
    isCached,
    error,
    refetch,
    invalidate: () => cacheService.invalidate(cacheKey),
    invalidateTag: (tag: string) => cacheService.invalidate(tag, true),
  };
};

/**
 * Hook for cache statistics (debugging)
 */
export const useCacheStats = () => {
  const [stats, setStats] = useState(cacheService.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheService.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return stats;
};

/**
 * Hook for manual cache management
 */
export const useCacheManager = () => {
  const queryClient = useQueryClient();

  return {
    set: useCallback((key: string, data: any, config?: CacheConfig) => {
      cacheService.set(key, data, config);
      queryClient.setQueryData([key], data);
    }, [queryClient]),

    get: useCallback((key: string) => {
      return cacheService.get(key);
    }, []),

    invalidate: useCallback((keyOrTag: string, isTag?: boolean) => {
      cacheService.invalidate(keyOrTag, isTag);
      if (isTag) {
        queryClient.invalidateQueries();
      } else {
        queryClient.invalidateQueries({ queryKey: [keyOrTag] });
      }
    }, [queryClient]),

    clear: useCallback(() => {
      cacheService.clear();
      queryClient.clear();
    }, [queryClient]),

    getStats: useCallback(() => {
      return cacheService.getStats();
    }, []),
  };
};

/**
 * Hook for watching cache changes
 */
export const useCacheWatch = <T,>(cacheKey: string, callback: (data: T) => void) => {
  useEffect(() => {
    return cacheService.watch(cacheKey, callback);
  }, [cacheKey, callback]);
};
