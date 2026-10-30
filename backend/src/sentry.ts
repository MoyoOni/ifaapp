/**
 * Sentry initialization for backend error tracking.
 * Only initializes when SENTRY_DSN is set (e.g. in production). Called once,
 * at the top of main.ts, before the Nest app is created.
 *
 * Until October 30, 2026 @sentry/node was never installed: the old code
 * required it inside a try/catch, got nothing, and silently reported no
 * backend error ever.
 */
import { Logger } from '@nestjs/common';
import * as SentrySdk from '@sentry/node';

const logger = new Logger('Sentry');
let enabled = false;

export function initSentry(): boolean {
  const dsn = process.env.SENTRY_DSN?.trim();
  const env = process.env.NODE_ENV || 'development';
  if (!dsn || env === 'development' || env === 'test') {
    logger.log('Sentry disabled (no SENTRY_DSN, or development/test)');
    return false;
  }

  try {
    SentrySdk.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || env,
      tracesSampleRate: env === 'production' ? 0.1 : 1,
      sendDefaultPii: false,
      ignoreErrors: ['ValidationError'],
    });
    enabled = true;
    logger.log(`Sentry initialized for environment: ${env}`);
  } catch (error) {
    logger.error(`Failed to initialize Sentry: ${(error as Error).message}`);
  }
  return enabled;
}

export function isSentryEnabled(): boolean {
  return enabled;
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!enabled) return;
  SentrySdk.captureException(error, context ? { extra: context } : undefined);
}

export function captureMessage(message: string, level: SentrySdk.SeverityLevel = 'info'): void {
  if (!enabled) return;
  SentrySdk.captureMessage(message, level);
}

export function setUser(user: { id: string; role?: string } | null): void {
  if (!enabled) return;
  SentrySdk.setUser(user);
}

export function addBreadcrumb(breadcrumb: SentrySdk.Breadcrumb): void {
  if (!enabled) return;
  SentrySdk.addBreadcrumb(breadcrumb);
}

export function flushSentry(timeoutMs = 2000): Promise<boolean> {
  return enabled ? SentrySdk.flush(timeoutMs) : Promise.resolve(true);
}
