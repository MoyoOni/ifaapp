/**
 * P1-02: shared retry-with-exponential-backoff-and-jitter helper for outbound
 * HTTP calls (WhatsApp, Paystack). Mirrors the policy already proven in
 * queues/job-queue.service.ts's BullMQ config (3 attempts, exponential
 * backoff) so both places agree on the same numbers instead of inventing a
 * second, different policy.
 */
export interface RetryOptions {
  /** Total attempts including the first — default 3. */
  maxAttempts?: number;
  /** Base delay before the first retry, in ms — default 1000 (doubles each attempt). */
  baseDelayMs?: number;
  /** Decides whether a given error is worth retrying. Defaults to network-error/5xx heuristics. */
  isRetryable?: (error: unknown) => boolean;
}

/**
 * True for errors where nothing was received back from the server at all —
 * connection refused/reset, DNS failure, etc. Safe to retry for both
 * read-only and mutating calls, since the request never reached the server.
 */
export function isNetworkLevelFailure(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === 'ECONNREFUSED' || code === 'ECONNRESET' || code === 'ENOTFOUND' || code === 'EAI_AGAIN';
}

/** True for a client-side timeout (axios gives up waiting) — the request may or may not have reached the server. */
export function isTimeout(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === 'ECONNABORTED' || code === 'ETIMEDOUT';
}

/** True for a 5xx response — the server received the request and failed; safe to retry for idempotent operations. */
export function isServerError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return typeof status === 'number' && status >= 500;
}

/** Default retry policy: network failures, timeouts, and 5xx — everything else (4xx) fails immediately. */
function defaultIsRetryable(error: unknown): boolean {
  return isNetworkLevelFailure(error) || isTimeout(error) || isServerError(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 1000, isRetryable = defaultIsRetryable } = options;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !isRetryable(error)) {
        throw error;
      }
      const exponential = baseDelayMs * 2 ** (attempt - 1);
      const jitter = exponential * 0.2 * (Math.random() * 2 - 1); // +/-20%
      await sleep(Math.max(0, Math.round(exponential + jitter)));
    }
  }
  // Unreachable (the loop always returns or throws), but keeps TS satisfied.
  throw lastError;
}
