import { registerAs } from '@nestjs/config';

export const infrastructureConfig = registerAs('infrastructure', () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  queue: {
    defaultAttempts: parseInt(process.env.QUEUE_DEFAULT_ATTEMPTS || '3', 10),
    defaultBackoffDelay: parseInt(process.env.QUEUE_BACKOFF_DELAY || '2000', 10),
  },
}));
