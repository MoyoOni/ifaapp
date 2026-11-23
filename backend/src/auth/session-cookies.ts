import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response, CookieOptions } from 'express';
import { map } from 'rxjs/operators';

/**
 * httpOnly session cookies for the website.
 *
 * Two transports coexist:
 * - **Bearer** (native apps, and any browser tab still running an older bundle):
 *   tokens travel in JSON bodies and the Authorization header, exactly as before.
 * - **Cookie** (the website): the request carries `X-Auth-Transport: cookie`. Token
 *   responses set httpOnly cookies and drop the tokens from the body, so page
 *   JavaScript never sees them; the client keeps only the non-secret `session`
 *   claims returned alongside.
 *
 * CSRF: cookies are only ever read when that custom header is present. A cross-site
 * form or `<img>` can't add a custom header, and a cross-site fetch that does must
 * pass CORS (our own origins only). SameSite=Lax is a second layer.
 */
export const AUTH_TRANSPORT_HEADER = 'x-auth-transport';
export const ACCESS_COOKIE = 'iluase_at';
export const REFRESH_COOKIE = 'iluase_rt';
const ACCESS_COOKIE_PATH = '/api';
// Only refresh and logout need the refresh token, both under /api/auth.
const REFRESH_COOKIE_PATH = '/api/auth';

export function isCookieTransport(req: Pick<Request, 'headers'>): boolean {
  const value = req.headers[AUTH_TRANSPORT_HEADER];
  return (Array.isArray(value) ? value[0] : value) === 'cookie';
}

/** Reads one cookie from the raw Cookie header (no cookie-parser dependency). */
export function readCookie(req: Pick<Request, 'headers'>, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      try {
        return decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

/** The session cookie for this request, only when the client asked for cookie transport. */
export function cookieToken(req: Pick<Request, 'headers'>, name: string): string | undefined {
  return isCookieTransport(req) ? readCookie(req, name) : undefined;
}

interface PublicClaims {
  sub?: string;
  role?: string;
  isImpersonated?: boolean;
  impersonatorId?: string;
  exp?: number;
}

/** Decodes (does not verify) a JWT payload. Only used on tokens this server just signed. */
export function decodeClaims(token: string): PublicClaims | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function cookieOptions(path: string, token: string): CookieOptions {
  const exp = decodeClaims(token)?.exp;
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path,
    ...(exp ? { maxAge: Math.max(0, exp * 1000 - Date.now()) } : {}),
  };
}

export function setSessionCookies(res: Response, tokens: { accessToken?: string; refreshToken?: string | null }): void {
  if (tokens.accessToken) res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOptions(ACCESS_COOKIE_PATH, tokens.accessToken));
  if (tokens.refreshToken) res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(REFRESH_COOKIE_PATH, tokens.refreshToken));
  // An explicit null means "this session has no refresh token" (impersonation).
  if (tokens.refreshToken === null) res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
}

export function clearSessionCookies(res: Response): void {
  const base = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const };
  res.clearCookie(ACCESS_COOKIE, { ...base, path: ACCESS_COOKIE_PATH });
  res.clearCookie(REFRESH_COOKIE, { ...base, path: REFRESH_COOKIE_PATH });
}

/**
 * Applied to AuthController. In cookie transport, any response carrying tokens
 * (`accessToken`/`refreshToken`, or impersonation's single `token`) has them moved
 * into httpOnly cookies and replaced by `session` — the token's public claims.
 * Bearer-transport responses pass through untouched.
 */
@Injectable()
export class SessionCookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    if (!isCookieTransport(req)) return next.handle();

    // Two rxjs copies are installed (backend 7.8.1, root 7.8.2); cast through `any`
    // the same way sensitive-field-strip.interceptor.ts does.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (next.handle() as any).pipe(
      map((body: unknown) => {
        if (!body || typeof body !== 'object') return body;
        const { accessToken, refreshToken, token, ...rest } = body as Record<string, unknown>;
        if (typeof accessToken === 'string') {
          setSessionCookies(res, { accessToken, refreshToken: typeof refreshToken === 'string' ? refreshToken : undefined });
          return { ...rest, session: publicSession(accessToken) };
        }
        if (typeof token === 'string') {
          // Impersonation: a short-lived access token and deliberately no refresh token.
          setSessionCookies(res, { accessToken: token, refreshToken: null });
          return { ...rest, session: publicSession(token) };
        }
        return body;
      }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
  }
}

export function publicSession(accessToken: string) {
  const c = decodeClaims(accessToken) ?? {};
  return {
    userId: c.sub,
    role: c.role,
    isImpersonated: c.isImpersonated ?? false,
    impersonatorId: c.impersonatorId,
    expiresAt: c.exp ? new Date(c.exp * 1000).toISOString() : undefined,
  };
}
