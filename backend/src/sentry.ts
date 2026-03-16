/**
 * Sentry initialization for backend error tracking.
 * Only initializes when SENTRY_DSN is set (e.g. in production).
 * Uses dynamic require to avoid crashing when @opentelemetry peer deps are missing.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SentryModule: any = null;

function getSentry() {
  if (SentryModule) return SentryModule;
  try {
    // Check required peer deps before loading @sentry/node to avoid crash at init time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require.resolve('@opentelemetry/core');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SentryModule = require('@sentry/node');
  } catch {
    // @opentelemetry peer deps missing — Sentry unavailable
  }
  return SentryModule;
}

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || dsn.trim() === '') return;

  const sentry = getSentry();
  if (!sentry) return;

  const env = process.env.NODE_ENV || 'development';
  const isProd = env === 'production';

  try {
    sentry.init({
      dsn,
      environment: env,
      tracesSampleRate: isProd ? 0.1 : 1,
      ignoreErrors: ['ValidationError'],
    });
  } catch {
    // @opentelemetry peer deps missing — Sentry init failed, continuing without it
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!process.env.SENTRY_DSN?.trim()) return;
  const sentry = getSentry();
  if (!sentry) return;
  sentry.captureException(error, context ? { extra: context } : undefined);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Sentry: any = new Proxy({} as Record<string, unknown>, {
  get(_target, prop) {
    return getSentry()?.[prop as string];
  },
});

export function captureMessage(message: string, level = 'info'): void {
  if (!process.env.SENTRY_DSN?.trim()) return;
  getSentry()?.captureMessage?.(message, level);
}

export function setUser(user: Record<string, unknown> | null): void {
  if (!process.env.SENTRY_DSN?.trim()) return;
  getSentry()?.setUser?.(user);
}

export function addBreadcrumb(breadcrumb: Record<string, unknown>): void {
  if (!process.env.SENTRY_DSN?.trim()) return;
  getSentry()?.addBreadcrumb?.(breadcrumb);
}

export function withScope(callback: (scope: unknown) => void): void {
  if (!process.env.SENTRY_DSN?.trim()) return;
  getSentry()?.withScope?.(callback);
}
