import { ConfigService } from '@nestjs/config';
import { ThrottlerOptions } from '@nestjs/throttler';

/**
 * Configuration for rate limiting (throttling)
 * Sets up different limits for different endpoints based on security requirements
 */
export const getThrottlerConfig = (configService: ConfigService): ThrottlerOptions[] => {
  // Default rate limit: 100 requests per minute
  const defaultLimit = configService.get<number>('THROTTLE_DEFAULT_LIMIT', 100);
  const defaultTtl = configService.get<number>('THROTTLE_DEFAULT_TTL', 60000); // 1 minute

  // Auth-specific limits (more restrictive)
  const authLimit = configService.get<number>('THROTTLE_AUTH_LIMIT', 10);
  const authTtl = configService.get<number>('THROTTLE_AUTH_TTL', 60000); // 1 minute

  // API-intensive endpoints (less restrictive)
  const apiLimit = configService.get<number>('THROTTLE_API_LIMIT', 500);
  const apiTtl = configService.get<number>('THROTTLE_API_TTL', 60000); // 1 minute

  return [
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
};
