import {
  retryWithBackoff,
  isNetworkLevelFailure,
  isTimeout,
  isServerError,
} from './retry-with-backoff.util';

describe('retryWithBackoff (P1-02)', () => {
  it('returns the result immediately on first success — no delay, no retry', async () => {
    const fn = jest.fn().mockResolvedValue('ok');

    const result = await retryWithBackoff(fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a retryable error up to maxAttempts and then succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockResolvedValueOnce('ok');

    const result = await retryWithBackoff(fn, { baseDelayMs: 1 });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('gives up and throws after maxAttempts consecutive failures', async () => {
    const fn = jest.fn().mockRejectedValue({ code: 'ECONNRESET' });

    await expect(retryWithBackoff(fn, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toEqual({
      code: 'ECONNRESET',
    });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry a non-retryable error (e.g. 4xx) — fails on the first attempt', async () => {
    const fn = jest.fn().mockRejectedValue({ response: { status: 400 } });

    await expect(retryWithBackoff(fn, { baseDelayMs: 1 })).rejects.toEqual({
      response: { status: 400 },
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('respects a custom isRetryable predicate', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('custom'));
    const isRetryable = jest.fn().mockReturnValue(false);

    await expect(retryWithBackoff(fn, { isRetryable, baseDelayMs: 1 })).rejects.toThrow('custom');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(isRetryable).toHaveBeenCalledWith(new Error('custom'));
  });

  it('retries 5xx responses by default', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValueOnce('ok');

    const result = await retryWithBackoff(fn, { baseDelayMs: 1 });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries a timeout by default', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce({ code: 'ECONNABORTED' })
      .mockResolvedValueOnce('ok');

    const result = await retryWithBackoff(fn, { baseDelayMs: 1 });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('error classifiers (P1-02)', () => {
  it('isNetworkLevelFailure recognizes connection-level error codes', () => {
    expect(isNetworkLevelFailure({ code: 'ECONNREFUSED' })).toBe(true);
    expect(isNetworkLevelFailure({ code: 'ECONNRESET' })).toBe(true);
    expect(isNetworkLevelFailure({ code: 'ENOTFOUND' })).toBe(true);
    expect(isNetworkLevelFailure({ code: 'EAI_AGAIN' })).toBe(true);
    expect(isNetworkLevelFailure({ code: 'ECONNABORTED' })).toBe(false);
    expect(isNetworkLevelFailure({ response: { status: 500 } })).toBe(false);
  });

  it('isTimeout recognizes axios timeout codes', () => {
    expect(isTimeout({ code: 'ECONNABORTED' })).toBe(true);
    expect(isTimeout({ code: 'ETIMEDOUT' })).toBe(true);
    expect(isTimeout({ code: 'ECONNRESET' })).toBe(false);
  });

  it('isServerError recognizes 5xx but not 4xx', () => {
    expect(isServerError({ response: { status: 500 } })).toBe(true);
    expect(isServerError({ response: { status: 503 } })).toBe(true);
    expect(isServerError({ response: { status: 404 } })).toBe(false);
    expect(isServerError({ response: { status: 400 } })).toBe(false);
    expect(isServerError({})).toBe(false);
  });
});
