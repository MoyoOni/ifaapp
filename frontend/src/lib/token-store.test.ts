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
  keychain.clear();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('tokenStore on the website', () => {
  it('reads and writes straight through to localStorage', async () => {
    const store = await loadStore(false);
    await store.init();
    store.setTokens('a1', 'r1');
    expect(localStorage.getItem('accessToken')).toBe('a1');
    expect(localStorage.getItem('refreshToken')).toBe('r1');
    localStorage.setItem('accessToken', 'changed-elsewhere');
    expect(store.getAccessToken()).toBe('changed-elsewhere'); // no cache on web
    store.clearTokens();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(secureStorage.set).not.toHaveBeenCalled();
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

  it('initialises only once however often init() is called', async () => {
    const store = await loadStore(true);
    await Promise.all([store.init(), store.init(), store.init()]);
    expect(secureStorage.setDefaultKeychainAccess).toHaveBeenCalledTimes(1);
  });

  it('writes through to the Keychain (device-only, no iCloud sync) and clears on logout', async () => {
    const store = await loadStore(true);
    await store.init();
    store.setTokens('a2', 'r2');
    expect(store.getAccessToken()).toBe('a2'); // readable immediately from the cache
    await flush();
    expect(secureStorage.set).toHaveBeenCalledWith('accessToken', 'a2', false, false, 3);
    expect(keychain.get('refreshToken')).toBe('r2');
    store.clearTokens();
    await flush();
    expect(store.getAccessToken()).toBeNull();
    expect(keychain.size).toBe(0);
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
