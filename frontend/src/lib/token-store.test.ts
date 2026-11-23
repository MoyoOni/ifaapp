import { describe, it, expect, vi, beforeEach } from 'vitest';

// An in-memory stand-in for the Keychain/Keystore plugin.
const keychain = new Map<string, unknown>();
const secureStorage = {
  setDefaultKeychainAccess: vi.fn(async () => {}),
  get: vi.fn(async (key: string) => (keychain.has(key) ? keychain.get(key) : null)),
  set: vi.fn(async (key: string, value: unknown) => { keychain.set(key, value); }),
  remove: vi.fn(async (key: string) => keychain.delete(key)),
};

async function loadStore(native: boolean) {
  vi.resetModules();
  vi.doMock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native } }));
  vi.doMock('@aparajita/capacitor-secure-storage', () => ({
    SecureStorage: secureStorage,
    KeychainAccess: { afterFirstUnlockThisDeviceOnly: 3 },
  }));
  return (await import('./token-store')).tokenStore;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.unstubAllGlobals();
  keychain.clear();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('tokenStore on the website (httpOnly cookie session)', () => {
  const fetchMock = vi.fn();
  beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });

  it('keeps only public session claims, never tokens, for a cookie session', async () => {
    const store = await loadStore(false);
    expect(store.usesCookies).toBe(true);
    store.saveSession({ session: { userId: 'u1', role: 'CLIENT' } });
    expect(store.hasSession()).toBe(true);
    expect(store.getAccessToken()).toBeNull();
    expect(store.getClaims()).toEqual({ userId: 'u1', role: 'CLIENT' });
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('session')).not.toBeNull();
    store.clear();
    expect(store.hasSession()).toBe(false);
    expect(secureStorage.set).not.toHaveBeenCalled();
  });

  it('falls back to Bearer tokens if a response still carries them (backend without cookie support)', async () => {
    const store = await loadStore(false);
    store.saveSession({ accessToken: 'a1', refreshToken: 'r1' });
    expect(localStorage.getItem('accessToken')).toBe('a1');
    expect(store.getRefreshToken()).toBe('r1');
    expect(store.hasSession()).toBe(true);
  });

  it('migrates a legacy localStorage session to cookies once, then deletes the tokens', async () => {
    localStorage.setItem('accessToken', 'legacy-a');
    localStorage.setItem('refreshToken', 'legacy-r');
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ session: { userId: 'u1', role: 'CLIENT' } }) });
    const store = await loadStore(false);
    await store.init();
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['X-Auth-Transport']).toBe('cookie');
    expect(JSON.parse(init.body)).toEqual({ refreshToken: 'legacy-r' });
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(store.getClaims()?.userId).toBe('u1');
  });

  it('drops a dead legacy session (401) but keeps it through a network failure', async () => {
    localStorage.setItem('refreshToken', 'legacy-r');
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    let store = await loadStore(false);
    await store.init();
    expect(localStorage.getItem('refreshToken')).toBeNull();

    localStorage.setItem('refreshToken', 'legacy-r');
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    store = await loadStore(false);
    await expect(store.init()).resolves.toBeUndefined();
    expect(localStorage.getItem('refreshToken')).toBe('legacy-r');
  });

  it('does nothing on init when there is no legacy session', async () => {
    const store = await loadStore(false);
    await store.init();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('tokenStore in the native app', () => {
  it('loads the session from the Keychain and never touches localStorage', async () => {
    keychain.set('accessToken', 'a1');
    keychain.set('refreshToken', 'r1');
    const store = await loadStore(true);
    await store.init();
    expect(store.getAccessToken()).toBe('a1');
    expect(store.getRefreshToken()).toBe('r1');
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('migrates a legacy localStorage session into the Keychain once, then removes it', async () => {
    localStorage.setItem('accessToken', 'legacy-a');
    localStorage.setItem('refreshToken', 'legacy-r');
    const store = await loadStore(true);
    await store.init();
    expect(store.getAccessToken()).toBe('legacy-a');
    expect(keychain.get('accessToken')).toBe('legacy-a');
    expect(keychain.get('refreshToken')).toBe('legacy-r');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('prefers an existing Keychain session over stale localStorage copies', async () => {
    keychain.set('accessToken', 'keychain-a');
    localStorage.setItem('accessToken', 'stale-a');
    const store = await loadStore(true);
    await store.init();
    expect(store.getAccessToken()).toBe('keychain-a');
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('continues signed out instead of crashing when the Keychain read fails', async () => {
    secureStorage.get.mockRejectedValueOnce(new Error('locked'));
    const store = await loadStore(true);
    await expect(store.init()).resolves.toBeUndefined();
    expect(store.getAccessToken()).toBeNull();
  });

  it('impersonation keeps the single token and drops the admin refresh token', async () => {
    keychain.set('refreshToken', 'admin-r');
    const store = await loadStore(true);
    await store.init();
    store.saveSession({ token: 'imp-a' });
    await flush();
    expect(store.getAccessToken()).toBe('imp-a');
    expect(store.getRefreshToken()).toBeNull();
    expect(store.usesCookies).toBe(false);
  });

  it('initialises only once however often init() is called', async () => {
    const store = await loadStore(true);
    await Promise.all([store.init(), store.init(), store.init()]);
    expect(secureStorage.setDefaultKeychainAccess).toHaveBeenCalledTimes(1);
  });

  it('writes through to the Keychain (device-only, no iCloud sync) and clears on logout', async () => {
    const store = await loadStore(true);
    await store.init();
    store.saveSession({ accessToken: 'a2', refreshToken: 'r2' });
    expect(store.getAccessToken()).toBe('a2'); // readable immediately from the cache
    await flush();
    expect(secureStorage.set).toHaveBeenCalledWith('accessToken', 'a2', false, false, 3);
    expect(keychain.get('refreshToken')).toBe('r2');
    store.clear();
    await flush();
    expect(store.getAccessToken()).toBeNull();
    expect(keychain.size).toBe(0);
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
