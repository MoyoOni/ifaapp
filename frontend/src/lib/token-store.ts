/**
 * Session token storage — the only place access/refresh tokens are kept.
 *
 * Website: reads and writes go straight through to localStorage, exactly as
 * before (moving web tokens to httpOnly cookies needs a backend change).
 *
 * iOS/Android app: tokens live in the Keychain / Android Keystore via
 * @aparajita/capacitor-secure-storage, never in the web view's localStorage.
 * The API stays synchronous so callers (the axios interceptor, auth state)
 * don't change: `init()` loads the tokens into an in-memory cache before the
 * app renders, reads come from the cache, and writes update the cache at once
 * and persist to the Keychain asynchronously.
 *
 * Known trade-off: if the app is killed in the moment between a cache update
 * and the Keychain write finishing, that write is lost and the user signs in
 * again. A synchronous Keychain write would block the UI thread.
 */
import { Capacitor } from '@capacitor/core';
import { SecureStorage, KeychainAccess } from '@aparajita/capacitor-secure-storage';
import { logger } from '@/shared/utils/logger';

const ACCESS_TOKEN = 'accessToken';
const REFRESH_TOKEN = 'refreshToken';
type TokenKey = typeof ACCESS_TOKEN | typeof REFRESH_TOKEN;

// Never synchronise tokens to iCloud Keychain; keep them on this device only.
const ICLOUD_SYNC = false;
const KEYCHAIN_ACCESS = KeychainAccess.afterFirstUnlockThisDeviceOnly;
const INIT_TIMEOUT_MS = 2500;

const isNative = Capacitor.isNativePlatform();
const cache = new Map<TokenKey, string>();
let initPromise: Promise<void> | null = null;

function read(key: TokenKey): string | null {
  return isNative ? cache.get(key) ?? null : localStorage.getItem(key);
}

function write(key: TokenKey, value: string): void {
  if (!isNative) {
    localStorage.setItem(key, value);
    return;
  }
  cache.set(key, value);
  SecureStorage.set(key, value, false, ICLOUD_SYNC, KEYCHAIN_ACCESS).catch((err) =>
    logger.warn(`[tokenStore] Keychain write failed for ${key}`, err),
  );
}

function remove(key: TokenKey): void {
  if (!isNative) {
    localStorage.removeItem(key);
    return;
  }
  cache.delete(key);
  SecureStorage.remove(key, ICLOUD_SYNC).catch((err) =>
    logger.warn(`[tokenStore] Keychain remove failed for ${key}`, err),
  );
}

async function loadFromKeychain(): Promise<void> {
  await SecureStorage.setDefaultKeychainAccess(KEYCHAIN_ACCESS);
  const [access, refresh] = await Promise.all([
    SecureStorage.get(ACCESS_TOKEN, false, ICLOUD_SYNC),
    SecureStorage.get(REFRESH_TOKEN, false, ICLOUD_SYNC),
  ]);
  if (typeof access === 'string' && access) cache.set(ACCESS_TOKEN, access);
  if (typeof refresh === 'string' && refresh) cache.set(REFRESH_TOKEN, refresh);

  // One-time migration for installs that stored tokens in localStorage.
  // The Keychain wins if it already has a session.
  const legacyAccess = localStorage.getItem(ACCESS_TOKEN);
  const legacyRefresh = localStorage.getItem(REFRESH_TOKEN);
  if (!legacyAccess && !legacyRefresh) return;
  if (cache.size === 0) {
    const writes: Promise<void>[] = [];
    if (legacyAccess) {
      cache.set(ACCESS_TOKEN, legacyAccess);
      writes.push(SecureStorage.set(ACCESS_TOKEN, legacyAccess, false, ICLOUD_SYNC, KEYCHAIN_ACCESS));
    }
    if (legacyRefresh) {
      cache.set(REFRESH_TOKEN, legacyRefresh);
      writes.push(SecureStorage.set(REFRESH_TOKEN, legacyRefresh, false, ICLOUD_SYNC, KEYCHAIN_ACCESS));
    }
    await Promise.all(writes);
    logger.info('[tokenStore] Migrated session tokens from localStorage to the Keychain');
  }
  // Only reached once the Keychain holds the session: drop the plaintext copies.
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
}

async function doInit(): Promise<void> {
  if (!isNative) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      loadFromKeychain(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${INIT_TIMEOUT_MS}ms`)), INIT_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    // Never block the app on storage: continue signed out; the user signs in again.
    cache.clear();
    logger.warn('[tokenStore] Keychain read failed; continuing with no stored session', err);
  } finally {
    clearTimeout(timer);
  }
}

export const tokenStore = {
  /** Load tokens before first render (native only; resolves at once on web). Never rejects. */
  init(): Promise<void> {
    if (!initPromise) initPromise = doInit();
    return initPromise;
  },
  getAccessToken: (): string | null => read(ACCESS_TOKEN),
  getRefreshToken: (): string | null => read(REFRESH_TOKEN),
  setAccessToken: (token: string): void => write(ACCESS_TOKEN, token),
  setRefreshToken: (token: string): void => write(REFRESH_TOKEN, token),
  /** Store a new pair; a missing refresh token leaves the current one in place. */
  setTokens(accessToken: string, refreshToken?: string | null): void {
    write(ACCESS_TOKEN, accessToken);
    if (refreshToken) write(REFRESH_TOKEN, refreshToken);
  },
  removeAccessToken: (): void => remove(ACCESS_TOKEN),
  removeRefreshToken: (): void => remove(REFRESH_TOKEN),
  clearTokens(): void {
    remove(ACCESS_TOKEN);
    remove(REFRESH_TOKEN);
  },
};
