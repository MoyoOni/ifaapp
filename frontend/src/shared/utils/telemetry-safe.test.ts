import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { DiagnosticError, describeDiagnostic, normalizeDiagnostic, safeLogArgs, safeRequestId, templateRoute, toDiagnostic } from './telemetry-safe';

// Synthetic canaries. None of these may appear in anything that leaves the app.
const EMAIL = 'canary-7f3a@harness.invalid';
const PASSWORD = 'CANARY-pw-7f3a9';
const TOKEN = 'CANARY-TOKEN-5b21e0';
const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJDQU5BUlkifQ.CANARYSIG';
const SERVER_MESSAGE = `No account for ${EMAIL}`;
const CANARIES = [EMAIL, 'canary-7f3a', PASSWORD, TOKEN, JWT, 'CANARYSIG', 'CANARY'];
const REQUEST_ID = '3f2c1a9e-8b7d-4c6e-9f10-a1b2c3d4e5f6';

function axiosErr(opts: { url?: string; requestId?: string; echoed?: string | null; status?: number } = {}): AxiosError {
  const headers = new AxiosHeaders({ Authorization: `Bearer ${JWT}`, 'x-request-id': opts.requestId ?? REQUEST_ID });
  const config = {
    url: opts.url ?? `/auth/verify-email?token=${TOKEN}`,
    method: 'post',
    data: JSON.stringify({ email: EMAIL, password: PASSWORD, nested: { token: TOKEN } }),
    headers,
  } as unknown as InternalAxiosRequestConfig;
  const response = opts.status === undefined ? undefined : {
    status: opts.status,
    statusText: 'x',
    data: { message: SERVER_MESSAGE, error: { userMessage: SERVER_MESSAGE } },
    headers: opts.echoed === null ? {} : { 'x-request-id': opts.echoed ?? opts.requestId ?? REQUEST_ID },
    config,
  };
  return new AxiosError(`Request failed: ${SERVER_MESSAGE} ${PASSWORD}`, 'ERR_BAD_REQUEST', config, {}, response as never);
}
const expectNoCanary = (value: unknown) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  for (const c of CANARIES) expect(text).not.toContain(c);
};

describe('templateRoute', () => {
  it('drops origin, query and fragment', () => {
    expect(templateRoute(`https://iluase.com/reset-password?token=${TOKEN}#x`, 'page')).toBe('/reset-password');
  });
  it('page URLs: router precedence, parameter positions always :param', () => {
    expect(templateRoute('/login', 'page')).toBe('/login');
    expect(templateRoute('/babalawo-adeyemi', 'page')).toBe('/:param');           // public profile slug
    expect(templateRoute('/profile/edit', 'page')).toBe('/profile/:param');       // not a declared page route
    expect(templateRoute('/events/create', 'page')).toBe('/events/create');      // declared static page beats /events/:param
    expect(templateRoute('/events/harvest-festival', 'page')).toBe('/events/:param');
    expect(templateRoute('/', 'page')).toBe('/');
  });
  it('API paths: only real request templates; strict where they disagree on a position', () => {
    expect(templateRoute('/users/directory', 'api')).toBe('/users/:param');       // real API calls: /users/directory AND /users/:param
    expect(templateRoute('/profile/edit', 'api')).toBe('/:unmatched');            // page path, not an API request: never matched as one
    expect(templateRoute('/login', 'api')).toBe('/:unmatched');
    expect(templateRoute('/users/dashboard', 'api')).toBe('/users/:param');
    expect(templateRoute('/api/forum/threads/123/posts', 'page')).toBe('/api/forum/threads/:param/posts'); // /api forces API rules
    expect(templateRoute('/forum/threads/community/posts', 'api')).toBe('/forum/threads/:param/posts');
    expect(templateRoute('/users/clx9abcdefghijklmnopqrst', 'api')).toBe('/users/:param');
    expect(templateRoute(`/users/${encodeURIComponent(EMAIL)}`, 'api')).toBe('/users/:param');
    expect(templateRoute('/users/+2348000000000', 'api')).toBe('/users/:param');
    expect(templateRoute('/api/auth/verify-email', 'api')).toBe('/api/auth/verify-email');
    expect(templateRoute('/api', 'api')).toBe('/api/:unmatched');                 // no request goes to /api itself
  });
  it('a path matching no template is sent as /:unmatched, never segment by segment', () => {
    expect(templateRoute(`/no/such/route/${EMAIL}`, 'page')).toBe('/:unmatched');
    expect(templateRoute(`/api/no/such/${TOKEN}`, 'api')).toBe('/api/:unmatched');
    expect(templateRoute(`/${'forum/'.repeat(60)}`, 'page')).toBe('/:unmatched');
  });
  it('survives unparseable input', () => {
    expect(templateRoute('http://[bad', 'page')).toBe('/:unparseable');
  });
});

describe('safeRequestId', () => {
  it('keeps only UUIDs', () => {
    expect(safeRequestId(REQUEST_ID)).toBe(REQUEST_ID);
    expect(safeRequestId(`${REQUEST_ID}x`)).toBeUndefined();
    expect(safeRequestId(`1732540000000-${TOKEN}`)).toBeUndefined();
    expect(safeRequestId(42)).toBeUndefined();
  });
});

describe('toDiagnostic', () => {
  it('keeps only allow-listed fields of an Axios error carrying credentials', () => {
    const d = toDiagnostic(axiosErr({ status: 401 }));
    expect(d).toEqual({
      kind: 'http', name: 'HttpError', httpMethod: 'POST', httpStatus: 401, route: '/auth/verify-email',
      axiosCode: 'ERR_BAD_REQUEST', isNetworkError: false, requestId: REQUEST_ID,
    });
    expectNoCanary(d);
  });
  it("uses the failing request's own ID, and drops it if the response echoes a different one", () => {
    expect(toDiagnostic(axiosErr({ status: 500, echoed: null })).requestId).toBe(REQUEST_ID); // no echo
    expect(toDiagnostic(axiosErr({ status: 500, echoed: '00000000-0000-4000-8000-000000000000' })).requestId).toBeUndefined();
    expect(toDiagnostic(axiosErr({ status: 500, requestId: 'not-a-uuid' })).requestId).toBeUndefined();
  });
  it('marks network errors and keeps no response data', () => {
    const d = toDiagnostic(axiosErr());
    expect(d.isNetworkError).toBe(true);
    expect(d.httpStatus).toBeUndefined();
    expectNoCanary(d);
  });
  it('never keeps a plain error message, and only known error names', () => {
    expect(toDiagnostic(new TypeError(`bad ${PASSWORD}`))).toEqual({ kind: 'error', name: 'TypeError' });
    const odd = new Error(EMAIL); odd.name = `Evil${PASSWORD}`;
    expect(toDiagnostic(odd)).toEqual({ kind: 'error', name: 'Error' });
    expect(toDiagnostic({ password: PASSWORD })).toEqual({ kind: 'unknown', name: 'Error' });
  });
});

describe('DiagnosticError', () => {
  it('builds its message from the diagnostic and drops the source message line', () => {
    const source = axiosErr({ status: 401 });
    const e = new DiagnosticError(toDiagnostic(source), source);
    expect(e.message).toBe('http POST /auth/verify-email 401 ERR_BAD_REQUEST');
    expect(e.name).toBe('HttpError');
    expectNoCanary(e.message);
    expectNoCanary(e.stack);
  });
});

describe('normalizeDiagnostic: a Diagnostic is never trusted because of its type', () => {
  const hostile = {
    kind: 'http', name: `Evil ${PASSWORD}`, httpMethod: EMAIL, httpStatus: 2348031234567,
    route: `/users/${EMAIL}?token=${TOKEN}`, axiosCode: TOKEN, isNetworkError: 'yes', requestId: EMAIL, extra: { password: PASSWORD },
  };
  it('re-validates every field and drops the rest', () => {
    expect(normalizeDiagnostic(hostile)).toEqual({ kind: 'http', name: 'Error', route: '/:unmatched' });
    expectNoCanary(normalizeDiagnostic(hostile));
    expectNoCanary(describeDiagnostic(hostile));
  });
  it('a DiagnosticError built from hostile input carries nothing sensitive', () => {
    const e = new DiagnosticError(hostile as never, new Error(`source ${PASSWORD}`));
    expectNoCanary(e.message);
    expectNoCanary(e.stack);
    expectNoCanary(e.diagnostic);
  });
  it('keeps a valid template route and validated fields', () => {
    expect(normalizeDiagnostic({ kind: 'http', name: 'HttpError', httpMethod: 'GET', route: '/users/:param', httpStatus: 404 }))
      .toEqual({ kind: 'http', name: 'HttpError', httpMethod: 'GET', route: '/users/:param', httpStatus: 404 });
  });
});

describe('safeLogArgs', () => {
  it('reduces every argument after the first to a safe shape', () => {
    const err = new Error(`boom ${EMAIL}`);
    const out = safeLogArgs(['Login failed', TOKEN, 42, true, null, undefined, { password: PASSWORD }, [PASSWORD], err, axiosErr({ status: 401 })]);
    expect(out.slice(0, 8)).toEqual(['Login failed', `[string:${TOKEN.length}]`, '[number]', '[boolean]', null, undefined, '[object]', '[object]']);
    expect(out[8]).toEqual({ kind: 'error', name: 'Error' });
    expect(out[9]).toMatchObject({ kind: 'http', route: '/auth/verify-email', httpStatus: 401 });
    expectNoCanary(out);
  });
  it('never passes a raw number (an account or phone number) through', () => {
    const out = safeLogArgs(['Payment failed', 2348031234567, 1234567890, BigInt(9007199254740993)]);
    expect(out).toEqual(['Payment failed', '[number]', '[number]', '[number]']);
    expect(JSON.stringify(out)).not.toMatch(/\d{6,}/);
  });
});
