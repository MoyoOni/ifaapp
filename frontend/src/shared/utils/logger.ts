/**
 * Centralized logger for the Ilé Àṣẹ frontend.
 * In production, only warn and error are emitted to reduce noise and avoid leaking debug info.
 *
 * warn/error never emit raw values: the first argument must be a constant string (enforced by
 * telemetry-guard.test.ts) and every other argument is reduced by safeLogArgs(). Console output
 * is captured by error tracking, so a raw error here once meant a member's password in Sentry.
 */
import { safeLogArgs, safeRequestId } from './telemetry-safe';

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

export interface LogContext {
  traceId?: string;
  userId?: string;
}

let logContext: LogContext = {};

/**
 * Set or merge context for subsequent log output (trace ID, user ID).
 * Called by API client when x-request-id is received, and by auth when user is set.
 */
export function setLogContext(ctx: Partial<LogContext>): void {
  logContext = { ...logContext, ...ctx };
}

/**
 * Get current log context (e.g. for Sentry or error reporting).
 */
export function getLogContext(): LogContext {
  return { ...logContext };
}

/**
 * Clear trace/user context (e.g. on logout).
 */
export function clearLogContext(): void {
  logContext = {};
}

function prefix(): string {
  const parts = ['[Ilé Àṣẹ]'];
  const requestId = safeRequestId(logContext.traceId); // only a validated UUID, never a raw value
  if (requestId) parts.push(`[${requestId}]`);
  return parts.join(' ');
}

export const logger = {
  debug(...args: unknown[]): void {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug(prefix(), ...args);
    }
  },

  log(...args: unknown[]): void {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(prefix(), ...args);
    }
  },

  info(...args: unknown[]): void {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.info(prefix(), ...args);
    }
  },

  warn(...args: unknown[]): void {
    // Always emit warnings (useful in production for monitoring)
    // eslint-disable-next-line no-console
    console.warn(prefix(), ...safeLogArgs(args));
  },

  error(...args: unknown[]): void {
    // Always emit errors (critical for production debugging)
    // eslint-disable-next-line no-console
    console.error(prefix(), ...safeLogArgs(args));
  },
};

export default logger;
