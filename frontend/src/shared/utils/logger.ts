/**
 * Centralized logger for the Ilé Àṣẹ frontend.
 * In production, only warn and error are emitted to reduce noise and avoid leaking debug info.
 * Supports trace ID (from API x-request-id) and user context for log correlation.
 */

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
  if (logContext.traceId) parts.push(`[${logContext.traceId}]`);
  if (logContext.userId) parts.push(`[user:${logContext.userId}]`);
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
    console.warn(prefix(), ...args);
  },

  error(...args: unknown[]): void {
    // Always emit errors (critical for production debugging)
    // eslint-disable-next-line no-console
    console.error(prefix(), ...args);
  },

  /**
   * Structured logging with context
   */
  structured(level: 'debug' | 'log' | 'info' | 'warn' | 'error', data: Record<string, unknown>): void {
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      context: getLogContext(),
      ...data,
    };
    
    if (level === 'error' || level === 'warn') {
      console[level](prefix(), JSON.stringify(logData, null, 2));
    } else if (isDev) {
      console[level](prefix(), JSON.stringify(logData, null, 2));
    }
  },
};

export default logger;
