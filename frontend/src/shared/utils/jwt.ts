/**
 * Decodes a JWT's payload without verifying its signature. Safe for reading
 * claims for UI purposes only (e.g. "am I currently impersonating someone") —
 * the token was already verified server-side when it was issued; this never
 * makes an authorization decision on the client's say-so.
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
