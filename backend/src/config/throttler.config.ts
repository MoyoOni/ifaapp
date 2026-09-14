import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions, ThrottlerOptions } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

/**
 * Configuration for rate limiting (throttling)
 * Sets up different limits for different endpoints based on security requirements
 *
 * Storage is Redis-backed (not the package's in-memory default) because
 * production runs 2+ backend instances behind an ALB -- per-instance
 * in-memory counters would let every limit be trivially multiplied by the
 * instance count, since each instance tracks hits independently.
 */
export const getThrottlerConfig = (configService: ConfigService): ThrottlerModuleOptions => {
  // Default rate limit: 100 requests per minute
  const defaultLimit = configService.get<number>('THROTTLE_DEFAULT_LIMIT', 100);
  const defaultTtl = configService.get<number>('THROTTLE_DEFAULT_TTL', 60000); // 1 minute

  // Auth-specific limits (more restrictive)
  const authLimit = configService.get<number>('THROTTLE_AUTH_LIMIT', 10);
  const authTtl = configService.get<number>('THROTTLE_AUTH_TTL', 60000); // 1 minute

  // API-intensive endpoints (less restrictive)
  const apiLimit = configService.get<number>('THROTTLE_API_LIMIT', 500);
  const apiTtl = configService.get<number>('THROTTLE_API_TTL', 60000); // 1 minute

  const throttlers: ThrottlerOptions[] = [
    {
      name: 'default',
      ttl: defaultTtl,
      limit: defaultLimit,
    },
    {
      name: 'auth',
      ttl: authTtl,
      limit: authLimit,
    },
    {
      name: 'api',
      ttl: apiTtl,
      limit: apiLimit,
    },
  ];

  const redisUrl = configService.get<string>('REDIS_URL');
  if (!redisUrl) {
    // Local dev without Redis running: fall back to in-memory storage
    // rather than failing to boot. Every real environment (CI, staging,
    // production) sets REDIS_URL, so this path is dev-only.
    return { throttlers };
  }

  return {
    throttlers,
    storage: new ThrottlerStorageRedisService(redisUrl),
  };
};
