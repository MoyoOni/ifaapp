import { describe, it, expect } from 'vitest';
import { cleanCrumb, cleanErrorEvent, cleanSpan, cleanTransaction } from './sentry';
import { DiagnosticError } from '@/shared/utils/telemetry-safe';

// Shapes below mirror what the local harness captured from the production configuration
// (November 2026): token URLs in request/breadcrumbs/spans, request bodies in console arguments.
const EMAIL = 'canary-7f3a@harness.invalid';
const PASSWORD = 'CANARY-pw-7f3a9';
const TOKEN = 'CANARY-TOKEN-5b21e0';
const USER_ID = 'user-CANARY-42';
const CANARIES = [EMAIL, 'canary-7f3a', PASSWORD, TOKEN, USER_ID, 'CANARY'];
const origin = self.location.origin;
const expectNoCanary = (v: unknown) => { const t = JSON.stringify(v); for (const c of CANARIES) expect(t).not.toContain(c); };

function errorEvent() {
  return {
    event_id: 'a'.repeat(32), timestamp: 1700000000, platform: 'javascript', level: 'error', environment: 'production',
    sdk: { name: 'sentry.javascript.react', version: '10.42.0', integrations: ['x'], packages: [{ name: 'npm:@sentry/react', version: '10.42.0' }] },
    transaction: `/verify-email?token=${TOKEN}`,
    exception: { values: [{
      type: 'AxiosError', value: `Request failed for ${EMAIL}`,
      mechanism: { type: 'generic', handled: true, data: { password: PASSWORD } },
      stacktrace: { frames: [
        { filename: `${origin}/index.BwHqlA2f.js`, function: 'reportApiError', lineno: 10, colno: 5, in_app: true,
          abs_path: `${origin}/x?token=${TOKEN}`, context_line: `password=${PASSWORD}`, vars: { password: PASSWORD } },
        { filename: `${origin}/chunks/VerifyEmailPage.BbM5gZet.js?token=${TOKEN}`, function: 'f', lineno: 1, colno: 1 },
        { filename: 'https://evil.example/x.js', function: 'g', lineno: 1, colno: 1 },
        { filename: `${origin}/src/${TOKEN}.ts`, function: 'h', lineno: 1, colno: 1 },
        { filename: `${origin}/chunks/LoginPage.AbC12345.js`, function: `x;${PASSWORD}`, lineno: 2, colno: 2 },
      ] },
    }] },
    request: { url: `${origin}/verify-email?token=${TOKEN}`, query_string: `token=${TOKEN}`, data: { password: PASSWORD },
      cookies: { iluase_at: TOKEN },
      headers: { 'User-Agent': 'Mozilla/5.0 (test)', Referer: `${origin}/reset-password?token=${TOKEN}`, Cookie: `iluase_at=${TOKEN}` } },
    extra: { email: EMAIL, userId: USER_ID, userMessage: `No account for ${EMAIL}`, params: { q: EMAIL },
      endpoint: `/auth/verify-email?token=${TOKEN}`, route: `/auth/verify-email?token=${TOKEN}`, httpStatus: 400,
      requestId: `not-a-uuid-${TOKEN}`, nested: { password: PASSWORD } },
    user: { id: USER_ID, email: EMAIL, ip_address: '{{auto}}' },
    tags: { type: 'auth_login', endpoint: `/x?token=${TOKEN}`, replayId: 'r', email: EMAIL },
    contexts: {
      culture: { locale: 'en-NG', timezone: 'Africa/Lagos' },
      trace: { trace_id: 'b'.repeat(32), span_id: 'c'.repeat(16), op: 'pageload',
        data: { 'http.query': `?token=${TOKEN}`, url: `${origin}/reset-password?token=${TOKEN}`, 'user.email': EMAIL } },
      react: { version: '19.0.0', extra: PASSWORD },
      browser: { name: 'Chrome', version: '130', extra: PASSWORD },
      custom: { password: PASSWORD },
    },
    breadcrumbs: [
      { category: 'console', level: 'error', message: `API error ${EMAIL}`, data: { arguments: ['x', { config: { data: `{"password":"${PASSWORD}"}` } }] } },
      { category: 'xhr', type: 'http', timestamp: 1, data: { method: 'GET', url: `/api/auth/verify-email?token=${TOKEN}`, status_code: 400, request_body: PASSWORD } },
      { category: 'navigation', data: { from: '/login', to: `/reset-password?token=${TOKEN}` } },
      { category: 'ui.input', message: 'input#password' },
      { category: 'ui.click', message: `button "${PASSWORD}"` },
      { category: 'sentry.event', message: EMAIL },
    ],
    fingerprint: [PASSWORD], debug_meta: { images: [{ code_file: PASSWORD }] }, modules: { a: PASSWORD }, message: PASSWORD,
    unknown_top_level: { password: PASSWORD },
  };
}

describe('cleanErrorEvent', () => {
  const out = cleanErrorEvent(errorEvent() as never) as unknown as Record<string, any>;

  it('carries none of the canaries anywhere', () => expectNoCanary(out));

  it('keeps only allow-listed top-level fields', () => {
    const allowed = ['event_id', 'timestamp', 'platform', 'level', 'environment', 'sdk', 'transaction', 'exception',
      'tags', 'extra', 'contexts', 'request', 'breadcrumbs'];
    for (const k of Object.keys(out)) expect(allowed).toContain(k);
    for (const k of ['user', 'message', 'modules', 'debug_meta', 'fingerprint', 'unknown_top_level']) expect(out).not.toHaveProperty(k);
  });

  it('withholds messages of errors the app did not build, and normalises names', () => {
    expect(out.exception.values[0].value).toBe('[message withheld]');
    expect(out.exception.values[0].type).toBe('Error');
    expect(out.exception.values[0].mechanism).toEqual({ type: 'generic', handled: true });
  });

  it('rebuilds stack frames, keeping only same-origin bundle files', () => {
    expect(out.exception.values[0].stacktrace.frames).toEqual([
      { filename: `${origin}/index.BwHqlA2f.js`, lineno: 10, colno: 5, in_app: true },   // no function names
      { filename: `${origin}/chunks/LoginPage.AbC12345.js`, lineno: 2, colno: 2 },
    ]);
  });

  it('templates URLs and reduces request, tags, extra, contexts and breadcrumbs', () => {
    expect(out.transaction).toBe('/verify-email');
    expect(out.request).toEqual({ url: `${origin}/verify-email`, headers: { 'User-Agent': 'Mozilla/5.0 (test)' } });
    expect(out.tags).toEqual({ type: 'auth_login' });
    expect(out.extra).toEqual({ httpStatus: 400, route: '/:unmatched' }); // a raw URL is never accepted as a route
    expect(Object.keys(out.contexts).sort()).toEqual(['browser', 'react', 'trace']);
    expect(out.contexts.browser).toEqual({ name: 'Chrome', version: '130' });
    expect(out.contexts.trace.data).toEqual({ url: '/reset-password' });
    expect(out.breadcrumbs.map((b: any) => b.category)).toEqual(['xhr', 'navigation', 'ui.click']);
    expect(out.breadcrumbs[0].data).toEqual({ method: 'GET', url: '/api/auth/verify-email', status_code: 400 });
    expect(out.breadcrumbs[1].data).toEqual({ from: '/login', to: '/reset-password' });
    expect(out.breadcrumbs[2]).not.toHaveProperty('message');
  });

  it('keeps the message of a DiagnosticError (built from allow-listed values only)', () => {
    const d = { kind: 'http' as const, name: 'HttpError', httpMethod: 'GET', route: '/auth/verify-email', httpStatus: 400 };
    const ev = errorEvent();
    ev.exception.values[0].type = 'HttpError';
    ev.exception.values[0].value = 'http GET /auth/verify-email 400';
    const kept = cleanErrorEvent(ev as never, { originalException: new DiagnosticError(d) } as never) as unknown as Record<string, any>;
    expect(kept.exception.values[0]).toMatchObject({ type: 'HttpError', value: 'http GET /auth/verify-email 400' });
    expectNoCanary(kept);
  });

  it('never sends an unexpected origin: route template only', () => {
    for (const host of ['https://evil.example', 'https://iluase.com.evil.example', `https://${EMAIL.replace('@', '.')}`, 'http://localhost:9999']) {
      const ev = errorEvent();
      ev.request.url = `${host}/verify-email?token=${TOKEN}`;
      const r = (cleanErrorEvent(ev as never) as any).request;
      expect(r.url).toBe('/verify-email');
      expectNoCanary(r);
    }
  });

  it('keeps an app origin', () => {
    const ev = errorEvent();
    ev.request.url = `https://iluase.com/reset-password?token=${TOKEN}`;
    expect((cleanErrorEvent(ev as never) as any).request.url).toBe('https://iluase.com/reset-password');
  });

  it('drops stack frames from any origin other than the page itself', () => {
    const ev = errorEvent();
    ev.exception.values[0].stacktrace.frames = [
      { filename: 'https://iluase.com.evil.example/index.AbCdEfGh.js', function: 'a', lineno: 1, colno: 1 },
      { filename: 'https://iluase.com/index.AbCdEfGh.js', function: 'b', lineno: 1, colno: 1 }, // not this page's origin
    ] as never;
    expect((cleanErrorEvent(ev as never) as any).exception.values[0]).not.toHaveProperty('stacktrace');
  });

  it('a DiagnosticError grants no trust: its message is rebuilt from re-validated fields', () => {
    const hostile = { kind: 'http', name: `Evil${PASSWORD}`, httpMethod: EMAIL, route: `/users/${EMAIL}?token=${TOKEN}`,
      httpStatus: 401, axiosCode: TOKEN, requestId: EMAIL };
    const ev = errorEvent();
    ev.exception.values[0].type = `Evil${PASSWORD}`;
    ev.exception.values[0].value = `${EMAIL} ${PASSWORD} ${TOKEN}`; // whatever the event claims
    const res = cleanErrorEvent(ev as never, { originalException: new DiagnosticError(hostile as never) } as never) as any;
    expect(res.exception.values[0]).toMatchObject({ type: 'Error', value: 'http /:unmatched 401' });
    expectNoCanary(res);
  });

  it('only the captured error (last value) gets a rebuilt message; causes stay withheld', () => {
    const d = { kind: 'http' as const, name: 'HttpError', httpMethod: 'GET', route: '/users/:param', httpStatus: 404 };
    const ev = errorEvent();
    ev.exception.values = [{ ...ev.exception.values[0], type: 'TypeError', value: `cause ${EMAIL}` }, { ...ev.exception.values[0], type: 'HttpError' }];
    const res = cleanErrorEvent(ev as never, { originalException: new DiagnosticError(d) } as never) as any;
    expect(res.exception.values.map((v: any) => v.value)).toEqual(['[message withheld]', 'http GET /users/:param 404']);
  });

  it('op, origin, status, breadcrumb type, mechanism, SDK and environment must be known values', () => {
    const ev = errorEvent() as any;
    ev.environment = `prod-${EMAIL}`;
    ev.sdk = { name: `sdk ${PASSWORD}`, version: '10.42.0' };
    ev.exception.values[0].mechanism = { type: `auto.${TOKEN.toLowerCase()}`, handled: false };
    ev.contexts.trace = { trace_id: 'b'.repeat(32), span_id: 'c'.repeat(16), op: 'pageload.CANARYOP', status: 'ok-CANARY', origin: 'auto.CANARY' };
    ev.breadcrumbs = [{ category: 'xhr', type: 'CANARYTYPE', data: { method: 'GET', url: '/api/auth/login', status_code: 401 } }];
    const res = cleanErrorEvent(ev as never) as any;
    expect(res).not.toHaveProperty('environment');
    expect(res.sdk).toEqual({ version: '10.42.0' });
    expect(res.exception.values[0].mechanism).toEqual({ handled: false });
    expect(res.contexts.trace).toEqual({ trace_id: 'b'.repeat(32), span_id: 'c'.repeat(16), data: {} });
    expect(res.breadcrumbs[0]).not.toHaveProperty('type');
    expectNoCanary(res);
  });

  it('no numeric field can carry a phone- or account-sized number', () => {
    const PHONE = 2348031234567;
    const ev = errorEvent() as any;
    ev.timestamp = PHONE;
    ev.exception.values[0].stacktrace.frames = [{ filename: `${origin}/index.BwHqlA2f.js`, function: `Object.member_${PHONE}`, lineno: PHONE, colno: PHONE }];
    ev.breadcrumbs = [{ category: 'xhr', timestamp: PHONE, data: { method: 'GET', url: '/api/auth/login', status_code: PHONE } }];
    const res = cleanErrorEvent(ev as never) as any;
    expect(JSON.stringify(res)).not.toContain(String(PHONE));
    expect(res.exception.values[0].stacktrace.frames[0]).toEqual({ filename: `${origin}/index.BwHqlA2f.js` });
    expect(res.breadcrumbs[0].data).toEqual({ method: 'GET', url: '/api/auth/login' });
  });

  it('keeps a valid request ID and drops an invalid one', () => {
    const ev = errorEvent();
    ev.extra.requestId = '3f2c1a9e-8b7d-4c6e-9f10-a1b2c3d4e5f6';
    expect((cleanErrorEvent(ev as never) as any).extra.requestId).toBe('3f2c1a9e-8b7d-4c6e-9f10-a1b2c3d4e5f6');
  });
});

describe('cleanTransaction and cleanSpan', () => {
  const spans = [
    { span_id: 'd'.repeat(16), trace_id: 'b'.repeat(32), start_timestamp: 1, timestamp: 2, op: 'http.client', origin: 'auto.http.browser',
      description: `GET ${origin}/api/auth/verify-email?token=${TOKEN}`,
      data: { 'http.method': 'GET', 'http.query': `token=${TOKEN}`, url: `${origin}/api/auth/verify-email?token=${TOKEN}`,
        'http.url': `${origin}/api/auth/verify-email?token=${TOKEN}`, 'http.response.status_code': 400, 'user.email': EMAIL } },
    { span_id: 'e'.repeat(16), trace_id: 'b'.repeat(32), start_timestamp: 1, op: 'ui.interaction.click', description: `button.${PASSWORD}`, data: {} },
    { span_id: 'f'.repeat(16), trace_id: 'b'.repeat(32), start_timestamp: 1, op: 'resource.script',
      description: `${origin}/chunks/VerifyEmailPage.BbM5gZet.js?v=${TOKEN}`, data: { 'resource.render_blocking_status': 'non-blocking' } },
    { span_id: `${PASSWORD}`, trace_id: EMAIL, start_timestamp: 1, op: `op ${PASSWORD}`, description: EMAIL, data: { x: PASSWORD } },
  ];
  const tx = {
    event_id: 'a'.repeat(32), type: 'transaction', platform: 'javascript', timestamp: 3, start_timestamp: 1,
    transaction: `/reset-password?token=${TOKEN}`,
    request: { url: `${origin}/reset-password?token=${TOKEN}`, headers: { 'User-Agent': 'Mozilla/5.0 (test)' } },
    user: { id: USER_ID }, extra: { email: EMAIL }, tags: { type: 'nope', email: EMAIL },
    contexts: { trace: { trace_id: 'b'.repeat(32), span_id: 'c'.repeat(16), op: 'pageload', data: { url: `/reset-password?token=${TOKEN}` } } },
    measurements: { lcp: { value: 1200, unit: 'millisecond' }, [`x${PASSWORD}`]: { value: 1 } },
    spans,
  };
  const out = cleanTransaction(tx as never) as unknown as Record<string, any>;

  it('carries none of the canaries', () => expectNoCanary(out));

  it('templates the transaction name and every span', () => {
    expect(out.transaction).toBe('/reset-password');
    expect(out).not.toHaveProperty('user');
    expect(out).not.toHaveProperty('extra');
    expect(out.tags).toEqual({});
    expect(out.measurements).toEqual({ lcp: { value: 1200, unit: 'millisecond' } });
    expect(out.spans[0].description).toBe('GET /api/auth/verify-email');
    expect(out.spans[0].data).toEqual({ 'http.method': 'GET', 'http.response.status_code': 400,
      url: '/api/auth/verify-email', 'http.url': '/api/auth/verify-email' });
    expect(out.spans[1].description).toBe('ui.interaction.click');
    expect(out.spans[2].description).toBe('/:unmatched');
  });

  it('a span with an unknown op, origin or status keeps none of them, and its description is withheld', () => {
    const s = cleanSpan({ span_id: 'a'.repeat(16), trace_id: 'b'.repeat(32), start_timestamp: 1, op: 'ui.custom.CANARY',
      origin: 'auto.CANARY', status: 'CANARY', description: `div.${PASSWORD}`, data: { 'sentry.op': 'x.CANARY', 'sentry.origin': 'manual' } } as never) as any;
    expect(s).not.toHaveProperty('op');
    expect(s).not.toHaveProperty('origin');
    expect(s).not.toHaveProperty('status');
    expect(s.description).toBe('span');
    expect(s.data).toEqual({ 'sentry.origin': 'manual' });
    expectNoCanary(s);
  });

  it('span and transaction numbers are range-checked by meaning', () => {
    const PHONE = 2348031234567;
    const now = Date.now() / 1000;
    const s = cleanSpan({ span_id: 'a'.repeat(16), trace_id: 'b'.repeat(32), start_timestamp: now, timestamp: PHONE, op: 'http.client',
      exclusive_time: PHONE, data: { 'http.response.status_code': PHONE, 'http.response_content_length': PHONE,
        'http.response_transfer_size': 1234567890, 'sentry.sample_rate': PHONE } } as never) as any;
    expect(s.data).toEqual({});
    expect(s).not.toHaveProperty('timestamp');
    expect(s).not.toHaveProperty('exclusive_time');
    expect(s.start_timestamp).toBe(now);
    const ok = cleanSpan({ span_id: 'a'.repeat(16), trace_id: 'b'.repeat(32), start_timestamp: now, op: 'http.client',
      data: { 'http.response.status_code': 404, 'http.response_content_length': 5120, 'sentry.sample_rate': 0.1 } } as never) as any;
    expect(ok.data).toEqual({ 'http.response.status_code': 404, 'http.response_content_length': 5120, 'sentry.sample_rate': 0.1 });
    const tx = cleanTransaction({ type: 'transaction', measurements: { lcp: { value: PHONE, unit: 'millisecond' }, fcp: { value: 900, unit: 'millisecond' },
      cls: { value: PHONE }, constructor: { value: 1 } }, spans: [] } as never) as any;
    expect(tx.measurements).toEqual({ fcp: { value: 900, unit: 'millisecond' } });
    expect(JSON.stringify([s, tx])).not.toContain(String(PHONE));
  });

  it('cleanSpan always returns a span, even from garbage', () => {
    const s = cleanSpan(spans[3] as never) as unknown as Record<string, any>;
    expect(s.span_id).toBe('0000000000000000');
    expect(s.trace_id).toBe('00000000000000000000000000000000');
    expect(s.data).toEqual({});
    expectNoCanary(s);
  });
});

describe('cleanCrumb', () => {
  it('drops console breadcrumbs entirely (the Replay password path)', () => {
    expect(cleanCrumb({ category: 'console', message: PASSWORD, data: { arguments: [PASSWORD] } } as never)).toBeNull();
  });
  it('drops input and unknown categories', () => {
    expect(cleanCrumb({ category: 'ui.input', message: 'input#password' } as never)).toBeNull();
    expect(cleanCrumb({ category: 'custom', message: EMAIL } as never)).toBeNull();
  });
});
