import { of, lastValueFrom } from 'rxjs';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  SessionCookieInterceptor,
  clearSessionCookies,
  cookieToken,
  readCookie,
} from './session-cookies';

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const fakeJwt = (claims: object) => `h.${b64(claims)}.s`;
const exp = Math.floor(Date.now() / 1000) + 900;

function mockRes() {
  return { cookie: jest.fn(), clearCookie: jest.fn() };
}
function ctx(headers: Record<string, string>, res = mockRes()) {
  return {
    res,
    context: {
      switchToHttp: () => ({ getRequest: () => ({ headers }), getResponse: () => res }),
    } as any,
  };
}

describe('session cookies', () => {
  it('reads a named cookie from the raw Cookie header', () => {
    const req = { headers: { cookie: `a=1; ${ACCESS_COOKIE}=tok%2Ebody; b=2` } };
    expect(readCookie(req as any, ACCESS_COOKIE)).toBe('tok.body');
    expect(readCookie(req as any, 'missing')).toBeUndefined();
    expect(readCookie({ headers: {} } as any, ACCESS_COOKIE)).toBeUndefined();
  });

  it('ignores the cookie unless the request opted into cookie transport (CSRF guard)', () => {
    const cookie = `${ACCESS_COOKIE}=t1`;
    expect(cookieToken({ headers: { cookie } } as any, ACCESS_COOKIE)).toBeUndefined();
    expect(cookieToken({ headers: { cookie, 'x-auth-transport': 'cookie' } } as any, ACCESS_COOKIE)).toBe('t1');
  });

  it('clears both cookies on their own paths', () => {
    const res = mockRes();
    clearSessionCookies(res as any);
    expect(res.clearCookie).toHaveBeenCalledWith(ACCESS_COOKIE, expect.objectContaining({ path: '/api' }));
    expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_COOKIE, expect.objectContaining({ path: '/api/auth' }));
  });
});

describe('SessionCookieInterceptor', () => {
  const interceptor = new SessionCookieInterceptor();
  const access = fakeJwt({ sub: 'u1', role: 'CLIENT', exp });
  const refresh = fakeJwt({ sub: 'u1', exp: exp + 3600 });

  it('leaves bearer-transport responses untouched (native apps, older bundles)', async () => {
    const { context, res } = ctx({});
    const body = { user: { id: 'u1' }, accessToken: access, refreshToken: refresh };
    const out = await lastValueFrom(interceptor.intercept(context, { handle: () => of(body) }));
    expect(out).toBe(body);
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('moves tokens into httpOnly cookies and returns only public session claims', async () => {
    const { context, res } = ctx({ 'x-auth-transport': 'cookie' });
    const out: any = await lastValueFrom(
      interceptor.intercept(context, { handle: () => of({ user: { id: 'u1' }, accessToken: access, refreshToken: refresh }) }),
    );
    expect(out.accessToken).toBeUndefined();
    expect(out.refreshToken).toBeUndefined();
    expect(out.user).toEqual({ id: 'u1' });
    expect(out.session).toMatchObject({ userId: 'u1', role: 'CLIENT', isImpersonated: false });
    expect(res.cookie).toHaveBeenCalledWith(ACCESS_COOKIE, access, expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/api' }));
    expect(res.cookie).toHaveBeenCalledWith(REFRESH_COOKIE, refresh, expect.objectContaining({ httpOnly: true, path: '/api/auth' }));
    const maxAge = res.cookie.mock.calls[0][2].maxAge;
    expect(maxAge).toBeGreaterThan(800_000);
    expect(maxAge).toBeLessThanOrEqual(900_000);
  });

  it('impersonation: sets only the access cookie and removes any refresh cookie', async () => {
    const { context, res } = ctx({ 'x-auth-transport': 'cookie' });
    const imp = fakeJwt({ sub: 'u2', isImpersonated: true, impersonatorId: 'admin1', exp });
    const out: any = await lastValueFrom(interceptor.intercept(context, { handle: () => of({ token: imp }) }));
    expect(out.token).toBeUndefined();
    expect(out.session).toMatchObject({ userId: 'u2', isImpersonated: true, impersonatorId: 'admin1' });
    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_COOKIE, expect.objectContaining({ path: '/api/auth' }));
  });

  it('passes through responses without tokens', async () => {
    const { context, res } = ctx({ 'x-auth-transport': 'cookie' });
    const body = { message: 'ok' };
    expect(await lastValueFrom(interceptor.intercept(context, { handle: () => of(body) }))).toBe(body);
    expect(res.cookie).not.toHaveBeenCalled();
  });
});
