/**
 * Sentry initialization for frontend error tracking.
 * Only initializes when VITE_SENTRY_DSN is set (e.g. in production).
 */
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const env = import.meta.env.MODE;
const isProd = env === 'production';

// P3-02: sample rates are env-driven (like the DSN itself) rather than
// hardcoded, so they can be tuned per-environment without a code change.
// Defaults match the previous hardcoded behavior exactly.
const parseSampleRate = (raw: string | undefined, fallback: number): number => {
  const parsed = raw !== undefined ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
};

const tracesSampleRate = parseSampleRate(
  import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE as string | undefined,
  isProd ? 0.1 : 1
);
const replaysOnErrorSampleRate = parseSampleRate(
  import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE as string | undefined,
  1
);
const replaysSessionSampleRate = parseSampleRate(
  import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE as string | undefined,
  isProd ? 0.1 : 0
);

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
    tracesSampleRate,
    replaysOnErrorSampleRate,
    replaysSessionSampleRate,
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
