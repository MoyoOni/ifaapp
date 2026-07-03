/**
 * Sentry initialization for frontend error tracking.
 * Only initializes when VITE_SENTRY_DSN is set (e.g. in production).
 */
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const env = import.meta.env.MODE;
const isProd = env === 'production';

export function initSentry(): void {
  if (!dsn || dsn.trim() === '') {
    return;
  }

  Sentry.init({
    dsn,
    environment: env,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: isProd ? 0.1 : 1,
    replaysOnErrorSampleRate: 1,
    replaysSessionSampleRate: isProd ? 0.1 : 0,
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      'Loading chunk',
      'ChunkLoadError',
    ],
  });
}

/** Report an error to Sentry if DSN is configured. Safe to call when Sentry is not inited. */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!dsn || dsn.trim() === '') return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export { Sentry };
