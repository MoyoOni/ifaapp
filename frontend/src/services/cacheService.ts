/**
 * CacheService - Intelligent multi-tier caching strategy
 * Combines localStorage, memory caching, and smart invalidation
 */
import { logger } from '@/shared/utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  tags: string[]; // For invalidation grouping
}

interface CacheConfig {
  ttl?: number;
  storage?: 'memory' | 'localStorage' | 'hybrid';
  tags?: string[];
  priority?: 'high' | 'medium' | 'low';
}

class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private config = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxMemoryItems: 100,
    maxStorageSize: 5 * 1024 * 1024, // 5MB
  };

  /**
   * Get cached value by key
   */
  get<T>(key: string): T | null {
    // Check memory first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && !this.isExpired(memEntry)) {
      return memEntry.data;
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`cache:${key}`);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (!this.isExpired(entry)) {
          // Restore to memory for faster access
          this.memoryCache.set(key, entry);
          return entry.data;
        } else {
          localStorage.removeItem(`cache:${key}`);
        }
      }
    } catch (error) {
      logger.warn(`[CacheService] Failed to read from localStorage for key: ${key}`, error);
    }

    // Cache miss or expired
    this.memoryCache.delete(key);
    return null;
  }

  /**
   * Set cached value with TTL and tags
   */
  set<T>(key: string, data: T, config: CacheConfig = {}): void {
    const ttl = config.ttl ?? this.config.defaultTTL;
    const storage = config.storage ?? 'hybrid';
    const tags = config.tags ?? [];

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
    };

    // Store in memory
    if (this.memoryCache.size >= this.config.maxMemoryItems) {
      this.evictLRU();
    }
    this.memoryCache.set(key, entry);

    // Store in localStorage if requested
    if (storage === 'localStorage' || storage === 'hybrid') {
      try {
        const size = JSON.stringify(entry).length;
        const currentSize = this.getStorageSize();

        if (currentSize + size < this.config.maxStorageSize) {
          localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          this.evictStorage();
          try {
            localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
          } catch {
            logger.warn(`[CacheService] Failed to store in localStorage: ${key}`);
          }
        }
      }
    }
  }

  /**
   * Invalidate cache by key or tag
   */
  invalidate(keyOrTag: string, isTag: boolean = false): void {
    if (isTag) {
      // Invalidate all entries with this tag
      for (const [key, entry] of this.memoryCache) {
        if (entry.tags.includes(keyOrTag)) {
          this.memoryCache.delete(key);
          localStorage.removeItem(`cache:${key}`);
        }
      }

      // Also check localStorage for tagged entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache:')) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const entry: CacheEntry<any> = JSON.parse(stored);
              if (entry.tags.includes(keyOrTag)) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            logger.warn(`[CacheService] Failed to check localStorage key: ${key}`, error);
          }
        }
      }
    } else {
      // Invalidate single key
      this.memoryCache.delete(keyOrTag);
      localStorage.removeItem(`cache:${keyOrTag}`);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache:')) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      logger.warn('[CacheService] Failed to clear localStorage', error);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getStats() {
    return {
      memoryItems: this.memoryCache.size,
      memorySize: this.getMemorySize(),
      storageSize: this.getStorageSize(),
      maxMemoryItems: this.config.maxMemoryItems,
      maxStorageSize: this.config.maxStorageSize,
    };
  }

  /**
   * Batch cache operations for performance
   */
  batch<T>(operations: Array<{ key: string; data: T; config?: CacheConfig }>): void {
    for (const { key, data, config } of operations) {
      this.set(key, data, config);
    }
  }

  /**
   * Get multiple keys at once
   */
  getMultiple<T>(keys: string[]): Map<string, T | null> {
    const results = new Map<string, T | null>();
    for (const key of keys) {
      results.set(key, this.get<T>(key));
    }
    return results;
  }

  /**
   * Watch for cache changes (experimental)
   */
  private watchers = new Map<string, Set<(data: any) => void>>();

  watch<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }
    this.watchers.get(key)!.add(callback);

    return () => {
      this.watchers.get(key)?.delete(callback);
    };
  }

  private notifyWatchers(key: string, data: any): void {
    this.watchers.get(key)?.forEach(callback => callback(data));
  }

  // Private helper methods

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  private evictStorage(): void {
    // Remove oldest 20% of cached items
    const entries: Array<[string, CacheEntry<any>]> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache:')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry: CacheEntry<any> = JSON.parse(stored);
            entries.push([key, entry]);
          }
        } catch (error) {
          // Skip invalid entries
        }
      }
    }

    // Sort by timestamp and remove oldest 20%
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = Math.ceil(entries.length * 0.2);

    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i][0]);
    }
  }

  private getMemorySize(): number {
    let size = 0;
    for (const entry of this.memoryCache.values()) {
      size += JSON.stringify(entry).length;
    }
    return size;
  }

  private getStorageSize(): number {
    let size = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache:')) {
          const value = localStorage.getItem(key);
          if (value) {
            size += value.length;
          }
        }
      }
    } catch (error) {
      logger.warn('[CacheService] Failed to calculate storage size', error);
    }
    return size;
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export type for external use
export type { CacheConfig, CacheEntry };
