import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

/**
 * Rate-limit storage that never hangs a request on Redis. The Redis storage used to be built with ioredis defaults
 * (offline queue on, 20 retries per command), so while Redis was down EVERY request (the limiter runs on all routes)
 * waited instead of answering. Now the client fails fast (see throttler.config.ts) and a failure is decided per limiter:
 * - `auth` (brute-force protection on sign-in routes): fail CLOSED, 503; guessing without a counter is not allowed.
 * - everything else: fail OPEN; rejecting all traffic because a counter is unavailable would be worse than briefly
 *   not counting.
 */
export class ResilientThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(ResilientThrottlerStorage.name);
  private lastWarnAt = 0;

  constructor(
    private readonly inner: ThrottlerStorage,
    private readonly failClosedThrottlers: ReadonlySet<string> = new Set(['auth'])
  ) {}

  async increment(key: string, ttl: number, limit: number, blockDuration: number, throttlerName: string): Promise<ThrottlerStorageRecord> {
    try {
      return await this.inner.increment(key, ttl, limit, blockDuration, throttlerName);
    } catch (error) {
      const now = Date.now();
      if (now - this.lastWarnAt > 10_000) {
        this.lastWarnAt = now;
        this.logger.error(`Rate-limit storage unavailable (${(error as Error)?.message ?? error}); auth routes 503, others not counted`);
      }
      if (this.failClosedThrottlers.has(throttlerName)) {
        throw new ServiceUnavailableException('Sign-in is temporarily unavailable. Please try again in a moment.');
      }
      return { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 };
    }
  }
}
