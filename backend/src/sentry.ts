/**
 * Sentry initialization for backend error tracking.
 * Only initializes when SENTRY_DSN is set (e.g. in production).
 */
import * as Sentry from '@sentry/node';

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || dsn.trim() === '') {
    return;
  }

  const env = process.env.NODE_ENV || 'development';
  const isProd = env === 'production';

  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: isProd ? 0.1 : 1,
    ignoreErrors: ['ValidationError'],
  });
}

/** Report an error to Sentry if DSN is configured. Safe when Sentry is not inited. */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!process.env.SENTRY_DSN?.trim()) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export { Sentry };
