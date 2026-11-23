/**
 * Session storage — the only place the client keeps anything about the session.
 *
 * Website (cookie transport): the access and refresh tokens live in httpOnly
 * cookies the backend sets (see backend/src/auth/session-cookies.ts), so page
 * JavaScript never sees them. Every API request carries `X-Auth-Transport: cookie`.
 * This store only remembers that a session exists plus its public claims (user
 * id, role, impersonation) under SESSION_KEY.
 *   - Older sessions that still have tokens in localStorage are migrated once in
 *     `init()`: the refresh token is exchanged for cookies, then deleted.
 *   - If a token ever arrives in a response body on the web (a backend without
 *     cookie support, e.g. mid-deploy), it is kept in localStorage and sent as a
 *     Bearer header exactly as before, so login never breaks on deploy order.
 *
 * iOS/Android app (Bearer transport): tokens live in the Keychain / Android
 * Keystore via @aparajita/capacitor-secure-storage. `init()` loads them into an
 * in-memory cache before the app renders; reads come from the cache, writes
 * update it at once and persist asynchronously.
 *
 * Known trade-off (native): if the app is killed between a cache update and the
 * Keychain write finishing, that write is lost and the user signs in again. A
 * synchronous Keychain write would block the UI thread.
 */
import { Capacitor } from '@capacitor/core';
import { SecureStorage, KeychainAccess } from '@aparajita/capacitor-secure-storage';
import { logger } from '@/shared/utils/logger';
import { decodeJwtPayload } from '@/shared/utils/jwt';
import { apiUrl } from './api-base';

const ACCESS_TOKEN = 'accessToken';
const REFRESH_TOKEN = 'refreshToken';
const SESSION_KEY = 'session';
type TokenKey = typeof ACCESS_TOKEN | typeof REFRESH_TOKEN;

export const AUTH_TRANSPORT_HEADER = 'X-Auth-Transport';

/** Public, non-secret facts about the current session. */
export interface SessionClaims {
  userId?: string;
  role?: string;
  isImpersonated?: boolean;
  impersonatorId?: string;
  expiresAt?: string;
}

/** Anything an auth endpoint returns: tokens (Bearer transport) and/or session claims (cookie transport). */
export interface AuthPayload {
  accessToken?: string;
  refreshToken?: string | null;
  /** Impersonation returns a single short-lived token and no refresh token. */
  token?: string;
  session?: SessionClaims;
}

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

function claimsFromToken(token: string | null): SessionClaims | null {
  if (!token) return null;
  const c = decodeJwtPayload<{ sub?: string; role?: string; isImpersonated?: boolean; impersonatorId?: string; impersonatedBy?: string; exp?: number }>(token);
  if (!c) return null;
  return {
    userId: c.sub,
    role: c.role,
    isImpersonated: c.isImpersonated ?? false,
    impersonatorId: c.impersonatorId ?? c.impersonatedBy,
    expiresAt: c.exp ? new Date(c.exp * 1000).toISOString() : undefined,
  };
}

function readWebSession(): SessionClaims | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionClaims) : null;
  } catch {
    return null;
  }
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

/**
 * Website: exchange a legacy localStorage refresh token for httpOnly cookies.
 * 401 → the old session is dead, clear it. Network error → keep it (Bearer still
 * works) and try again on the next load.
 */
async function migrateWebSession(): Promise<void> {
  const legacyRefresh = localStorage.getItem(REFRESH_TOKEN);
  if (!legacyRefresh) return;
  const response = await fetch(apiUrl('/auth/refresh'), {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', [AUTH_TRANSPORT_HEADER]: 'cookie' },
    body: JSON.stringify({ refreshToken: legacyRefresh }),
  });
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    return;
  }
  if (!response.ok) return;
  tokenStore.saveSession((await response.json()) as AuthPayload);
  logger.info('[tokenStore] Moved the website session from localStorage to httpOnly cookies');
}

async function doInit(): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      isNative ? loadFromKeychain() : migrateWebSession(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${INIT_TIMEOUT_MS}ms`)), INIT_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    if (isNative) {
      // Never block the app on storage: continue signed out; the user signs in again.
      cache.clear();
      logger.warn('[tokenStore] Keychain read failed; continuing with no stored session', err);
    } else {
      logger.warn('[tokenStore] Session migration did not complete; will retry next load', err);
    }
  } finally {
    clearTimeout(timer);
  }
}

export const tokenStore = {
  /** True on the website: tokens live in httpOnly cookies, not here. */
  usesCookies: !isNative,

  /** Load (native) or migrate (web) the session before first render. Never rejects. */
  init(): Promise<void> {
    if (!initPromise) initPromise = doInit();
    return initPromise;
  },

  /** Bearer token to send, if any (native always; web only for a legacy session). */
  getAccessToken: (): string | null => read(ACCESS_TOKEN),
  getRefreshToken: (): string | null => read(REFRESH_TOKEN),

  /** Whether a session exists (native: a token; web: cookie session marker or a legacy token). */
  hasSession(): boolean {
    if (isNative) return !!read(ACCESS_TOKEN);
    return !!readWebSession() || !!read(ACCESS_TOKEN);
  },

  /** Whether a refresh can be attempted. */
  canRefresh(): boolean {
    if (isNative) return !!read(REFRESH_TOKEN);
    return !!readWebSession() || !!read(REFRESH_TOKEN);
  },

  /** Public claims of the current session (role, impersonation, user id). */
  getClaims(): SessionClaims | null {
    if (!isNative) {
      const session = readWebSession();
      if (session) return session;
    }
    return claimsFromToken(read(ACCESS_TOKEN));
  },

  /**
   * Store whatever an auth endpoint returned. Native keeps the tokens; the website
   * keeps only the session claims (tokens are in cookies) — unless the body still
   * carried tokens, in which case it keeps them as before (see the header comment).
   */
  saveSession(payload: AuthPayload): void {
    const access = payload.accessToken ?? payload.token;
    const isImpersonation = !payload.accessToken && !!payload.token;
    if (isNative || access) {
      if (access) write(ACCESS_TOKEN, access);
      if (payload.refreshToken) write(REFRESH_TOKEN, payload.refreshToken);
      // Impersonation has no refresh token by design: drop the admin's own so an
      // expired impersonation can't silently swap back to the admin identity.
      if (isImpersonation) remove(REFRESH_TOKEN);
      if (!isNative) localStorage.removeItem(SESSION_KEY);
      return;
    }
    if (payload.session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(payload.session));
      // Cookie session established: any legacy plaintext tokens are now stale.
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN);
    }
  },

  /** Dev/demo mode only: mark a client-side session with no backend tokens. */
  markDevSession(userId: string, role: string): void {
    if (isNative) write(ACCESS_TOKEN, 'dev-token');
    else localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, role, dev: true }));
  },

  /** Forget the session on this device (the server side is ended by /auth/logout). */
  clear(): void {
    remove(ACCESS_TOKEN);
    remove(REFRESH_TOKEN);
    if (!isNative) localStorage.removeItem(SESSION_KEY);
  },
};
