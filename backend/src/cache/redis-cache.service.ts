import { Injectable, Logger, OnModuleInit, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

/**
 * Thrown by the *Strict methods when Redis cannot answer. Session security (token revocation and refresh rotation)
 * depends on Redis, so those checks fail CLOSED with a 503 instead of treating every token as valid. Deliberate
 * trade-off (November 26, 2026): during a Redis outage signed-in requests get 503 rather than letting logged-out or
 * revoked sessions keep working. Public routes stay available (their optional auth treats the caller as anonymous).
 */
export class SessionStoreUnavailableException extends ServiceUnavailableException {
  constructor() {
    super('Sign-in is temporarily unavailable. Please try again in a moment.');
  }
}

/** How long a strict call may wait for Redis before failing closed. */
const STRICT_TIMEOUT_MS = 2000;

/**
 * Redis Cache Service
 * Provides caching functionality for frequently accessed data
 */
@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: RedisClientType | null = null;
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connect to Redis server
   */
  private async connect(): Promise<void> {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          // Never give up: session checks fail closed while Redis is away, so a client that stopped reconnecting
          // (it used to after 10 tries, about 3 seconds) would turn a short Redis restart into an outage that
          // lasted until the backend restarted.
          reconnectStrategy: (retries: number) => {
            if (retries === 10 || (retries > 10 && retries % 60 === 0)) {
              this.logger.error(`Redis still unreachable after ${retries} reconnection attempts; retrying`);
            }
            return Math.min(retries * 100, 5000);
          },
        },
      });

      this.client.on('error', (err: any) => {
        this.logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Connected to Redis');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Disconnect from Redis server
   */
  private async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.logger.log('Disconnected from Redis');
      } catch (error) {
        this.logger.error('Error disconnecting from Redis:', error);
      } finally {
        this.isConnected = false;
      }
    }
  }

  /**
   * Check if Redis is connected and available
   */
  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /** Runs a Redis command for a session-security check; throws SessionStoreUnavailableException instead of guessing. */
  private async strict<T>(what: string, run: (client: RedisClientType) => Promise<T>): Promise<T> {
    if (!this.isAvailable()) {
      this.logger.error(`Session store unavailable (${what}): Redis not connected`);
      throw new SessionStoreUnavailableException();
    }
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        run(this.client!),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`timed out after ${STRICT_TIMEOUT_MS} ms`)), STRICT_TIMEOUT_MS);
        }),
      ]);
    } catch (error) {
      this.logger.error(`Session store unavailable (${what}): ${(error as Error)?.message ?? error}`);
      throw new SessionStoreUnavailableException();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /** EXISTS for session security: throws (fails closed) when Redis cannot answer. */
  async existsStrict(key: string): Promise<boolean> {
    return this.strict('exists', async (c) => (await c.exists(key)) === 1);
  }

  /** SET with TTL for session security: throws (fails closed) when Redis cannot store it. */
  async setStrict<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.strict('set', (c) => c.setEx(key, Math.max(1, Math.ceil(ttlSeconds)), JSON.stringify(value)));
  }

  /** Atomic SET … NX EX: true if this call created the key, false if it already existed. Throws when Redis cannot answer. */
  async setIfAbsentStrict<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
    const reply = await this.strict('set-nx', (c) =>
      c.sendCommand(['SET', key, JSON.stringify(value), 'EX', String(Math.max(1, Math.ceil(ttlSeconds))), 'NX'])
    );
    return reply === 'OK';
  }

  /** GET for session security: null if absent; throws when Redis cannot answer. */
  async getStrict<T>(key: string): Promise<T | null> {
    const value = await this.strict('get', (c) => c.get(key));
    return value === null || value === undefined ? null : (JSON.parse(String(value)) as T);
  }

  /**
   * Get value from cache.
   * Returns null on miss or error — callers should fall back to DB.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const value = await this.client!.get(key);
      return value === null ? null : (JSON.parse(value) as T);
    } catch (error) {
      this.logger.warn(`Redis unavailable for key ${key}, falling back to DB`);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL.
   * Returns false on error — does not throw.
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client!.setEx(key, ttlSeconds, stringValue);
      } else {
        await this.client!.set(key, stringValue);
      }
      return true;
    } catch (error) {
      this.logger.warn(`Redis set failed for key ${key}, skipping cache`);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment numeric value in cache
   */
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const result = await this.client!.incr(key);
      if (ttlSeconds && result === 1) {
        // Set TTL only on first increment
        await this.client!.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      this.logger.error(`Error incrementing cache key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isAvailable() || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.client!.mGet(keys);
      return values.map((value: string | null) =>
        value === null ? null : (JSON.parse(value) as T)
      );
    } catch (error) {
      this.logger.error(`Error getting multiple cache keys:`, error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(keyValues: Record<string, any>, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const pipeline = this.client!.multi();

      Object.entries(keyValues).forEach(([key, value]) => {
        const stringValue = JSON.stringify(value);
        if (ttlSeconds) {
          pipeline.setEx(key, ttlSeconds, stringValue);
        } else {
          pipeline.set(key, stringValue);
        }
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      this.logger.error('Error setting multiple cache keys:', error);
      return false;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async flushAll(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client!.flushAll();
      this.logger.log('Cache flushed successfully');
      return true;
    } catch (error) {
      this.logger.error('Error flushing cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    if (!this.isAvailable()) {
      return {
        connected: false,
        uptime: 0,
        connectedClients: 0,
        usedMemory: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
      };
    }

    try {
      const info = await this.client!.info();
      const lines = info.split('\n');

      const stats: Record<string, string> = {};
      lines.forEach((line: string) => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key.trim()] = value.trim();
        }
      });

      return {
        connected: true,
        uptime: parseInt(stats.uptime_in_seconds || '0'),
        connectedClients: parseInt(stats.connected_clients || '0'),
        usedMemory: parseInt(stats.used_memory || '0'),
        hits: parseInt(stats.keyspace_hits || '0'),
        misses: parseInt(stats.keyspace_misses || '0'),
        hitRate:
          stats.keyspace_hits && stats.keyspace_misses
            ? parseFloat(stats.keyspace_hits) /
              (parseFloat(stats.keyspace_hits) + parseFloat(stats.keyspace_misses))
            : 0,
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        connected: false,
        uptime: 0,
        connectedClients: 0,
        usedMemory: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
      };
    }
  }
}

// Types
export interface CacheStats {
  connected: boolean;
  uptime: number;
  connectedClients: number;
  usedMemory: number;
  hits: number;
  misses: number;
  hitRate: number;
}
