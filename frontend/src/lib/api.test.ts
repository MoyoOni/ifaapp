import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { type InternalAxiosRequestConfig } from 'axios';

vi.mock('@sentry/react', () => ({ captureException: vi.fn(), setUser: vi.fn(), setContext: vi.fn(), addBreadcrumb: vi.fn() }));

import api from './api';

// A fake server behind the real interceptor chain: only the current valid
// access token gets a 200; anything else is a 401.
let validAccess = 'access-1';
const seenAuth: (string | undefined)[] = [];

function fakeAdapter(config: InternalAxiosRequestConfig) {
  const auth = (config.headers as Record<string, string>)?.Authorization;
  seenAuth.push(auth);
  if (auth === `Bearer ${validAccess}`) {
    return Promise.resolve({ data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config });
  }
  const err: any = new Error('Request failed with status code 401');
  err.isAxiosError = true;
  err.config = config;
  err.response = { status: 401, data: {}, headers: {}, config, statusText: 'Unauthorized' };
  return Promise.reject(err);
}

describe('api client — token refresh', () => {
  let refreshPost: ReturnType<typeof vi.spyOn>;
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.clear();
    seenAuth.length = 0;
    validAccess = 'access-1';
    api.defaults.adapter = fakeAdapter as any;
    Object.defineProperty(window, 'location', { value: { href: '/current' }, writable: true });
    refreshPost = vi.spyOn(axios, 'post');
  });

  afterEach(() => {
    refreshPost.mockRestore();
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });

  it('stores the ROTATED refresh token as well as the new access token, and retries the request', async () => {
    localStorage.setItem('accessToken', 'stale');
    localStorage.setItem('refreshToken', 'refresh-1');
    refreshPost.mockResolvedValue({ data: { accessToken: 'access-1', refreshToken: 'refresh-2' } });

    const res = await api.get('/anything');

    expect(res.data).toEqual({ ok: true });
    expect(refreshPost).toHaveBeenCalledWith('/api/auth/refresh', { refreshToken: 'refresh-1' });
    expect(localStorage.getItem('accessToken')).toBe('access-1');
    // the server revokes the token it was given, so keeping refresh-1 would break the next refresh
    expect(localStorage.getItem('refreshToken')).toBe('refresh-2');
  });

  it('uses the rotated token on the NEXT refresh (about 30 minutes later), not the spent original', async () => {
    localStorage.setItem('accessToken', 'stale');
    localStorage.setItem('refreshToken', 'refresh-1');
    refreshPost.mockResolvedValueOnce({ data: { accessToken: 'access-1', refreshToken: 'refresh-2' } });
    await api.get('/first');

    validAccess = 'access-2'; // access-1 has now "expired"
    refreshPost.mockResolvedValueOnce({ data: { accessToken: 'access-2', refreshToken: 'refresh-3' } });
    await api.get('/second');

    expect(refreshPost).toHaveBeenNthCalledWith(2, '/api/auth/refresh', { refreshToken: 'refresh-2' });
    expect(localStorage.getItem('refreshToken')).toBe('refresh-3');
  });

  it('shares ONE refresh across concurrent 401s instead of spending the single-use token repeatedly', async () => {
    localStorage.setItem('accessToken', 'stale');
    localStorage.setItem('refreshToken', 'refresh-1');
    refreshPost.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return { data: { accessToken: 'access-1', refreshToken: 'refresh-2' } };
    });

    const results = await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);

    expect(results.map((r) => r.data)).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(refreshPost).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('/current'); // nobody was bounced to /login
  });

  it('clears the session and sends the user to /login only when the refresh itself fails', async () => {
    localStorage.setItem('accessToken', 'stale');
    localStorage.setItem('refreshToken', 'revoked');
    refreshPost.mockRejectedValue(new Error('Invalid refresh token'));

    await expect(api.get('/anything')).rejects.toBeTruthy();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(window.location.href).toBe('/login');
  });
});
