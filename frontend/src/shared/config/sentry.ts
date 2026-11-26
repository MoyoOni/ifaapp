/**
 * Sentry initialization for frontend error tracking.
 * Only initializes when VITE_SENTRY_DSN is set (e.g. in production).
 *
 * Deny by default. Every error event, transaction, span and breadcrumb is REBUILT from validated,
 * allow-listed fields before it leaves the browser; nothing is passed through and redacted.
 * Session Replay is removed: it recorded login request bodies (passwords) and token-bearing URLs
 * (November 2026). Re-adding it needs its own verified design and a passing local harness run.
 *
 * Errors are reported only through reportError(), which never sends the original error object.
 * Hook signatures are those of @sentry/react 10.42.0: beforeSend/beforeSendTransaction/
 * beforeBreadcrumb may drop (null); beforeSendSpan must return a span.
 */
import * as Sentry from '@sentry/react';
import {
  DiagnosticError, HTTP_METHODS, SAFE_ERROR_NAMES, describeDiagnostic, normalizeDiagnostic, safeRequestId, templateRoute, toDiagnostic,
  type RouteKind,
} from '@/shared/utils/telemetry-safe';

/**
 * Sentry runs only in builds that ask for it: VITE_SENTRY_ENABLED=true, set by frontend/Dockerfile.production (and
 * required for store builds of the native apps). frontend/.env.production carries the production DSN, so without this
 * switch a developer's local `vite build` + `vite preview` reported to production Sentry (found November 23, 2026).
 */
const sentryEnabled = import.meta.env.VITE_SENTRY_ENABLED === 'true';
const dsn = sentryEnabled ? (import.meta.env.VITE_SENTRY_DSN as string | undefined) : undefined;
const env = import.meta.env.MODE;
const isProd = env === 'production';

// P3-02: the trace sample rate is env-driven (like the DSN itself).
const parseSampleRate = (raw: string | undefined, fallback: number): number => {
  const parsed = raw !== undefined ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
};
const tracesSampleRate = parseSampleRate(
  import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE as string | undefined,
  isProd ? 0.1 : 1
);

// Types come from this SDK's own init signature, not from export names.
type Options = NonNullable<Parameters<typeof Sentry.init>[0]>;
type ErrorEvt = Parameters<NonNullable<Options['beforeSend']>>[0];
type Hint = Parameters<NonNullable<Options['beforeSend']>>[1];
type TxEvt = Parameters<NonNullable<Options['beforeSendTransaction']>>[0];
type Crumb = Parameters<NonNullable<Options['beforeBreadcrumb']>>[0];
type SpanJson = Parameters<NonNullable<Options['beforeSendSpan']>>[0];
type Obj = Record<string, unknown>;

export type TelemetryType =
  | 'api_error' | 'api_query' | 'paginated_api_query' | 'auth_login' | 'auth_user_fetch'
  | 'dashboard_client_fetch' | 'dashboard_babalawo_fetch' | 'dashboard_vendor_fetch' | 'sentry_test';
const TELEMETRY_TYPES: ReadonlySet<string> = new Set<TelemetryType>([
  'api_error', 'api_query', 'paginated_api_query', 'auth_login', 'auth_user_fetch',
  'dashboard_client_fetch', 'dashboard_babalawo_fetch', 'dashboard_vendor_fetch', 'sentry_test',
]);

// ── Validators ───────────────────────────────────────────────────────────────────────────────
const HEX32 = /^[0-9a-f]{32}$/;
const HEX16 = /^[0-9a-f]{16}$/;
/** Character/length policy for browser, OS, device and React name/version only (owner-approved). */
const TOKEN = /^[A-Za-z0-9 ._()/:+-]{1,64}$/;
const SEMVER = /^\d{1,3}\.\d{1,3}\.\d{1,4}$/;
const BUNDLE_PATH = /^\/(?:index|chunks\/[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]{6,12}\.js$/;
const UA = /^[\x20-\x7e]{1,256}$/;
const LEVELS: ReadonlySet<string> = new Set(['fatal', 'error', 'warning', 'log', 'info', 'debug']);
// Finite vocabularies of the values @sentry/react 10.42.0 (browser) emits. Anything else is dropped.
const resourceOps = ['script', 'link', 'css', 'img', 'image', 'fetch', 'xmlhttprequest', 'iframe', 'audio', 'video',
  'beacon', 'navigation', 'other', 'font', 'track', 'input', 'embed', 'object', 'svg', 'early-hints'].map((t) => `resource.${t}`);
const browserOps = ['domContentLoadedEvent', 'loadEvent', 'unloadEvent', 'connect', 'TLS/SSL', 'cache', 'DNS', 'request',
  'response', 'redirect', 'script.invoker'].map((t) => `browser.${t}`);
const SPAN_OPS: ReadonlySet<string> = new Set([
  'pageload', 'navigation', 'http', 'http.client', 'browser', 'mark', 'measure', 'paint', 'resource',
  'ui.action.click', 'ui.interaction.click', 'ui.interaction.hover', 'ui.interaction.drag', 'ui.interaction.press',
  'ui.elementtiming', 'ui.long-animation-frame', 'ui.long-task', 'ui.react.mount', 'ui.react.render', 'ui.react.update',
  'ui.webvital.cls', 'ui.webvital.lcp', 'ui.webvital.inp', ...resourceOps, ...browserOps,
]);
const SPAN_ORIGINS: ReadonlySet<string> = new Set([
  'manual', 'auto', 'auto.http.browser', 'auto.http.browser.cls', 'auto.http.browser.inp', 'auto.http.browser.lcp',
  'auto.navigation.browser', 'auto.pageload.browser', 'auto.resource.browser.metrics', 'auto.ui.browser.metrics',
  'auto.ui.browser.elementtiming', 'auto.ui.react.profiler',
]);
const SPAN_STATUSES: ReadonlySet<string> = new Set([
  'ok', 'cancelled', 'unknown', 'unknown_error', 'invalid_argument', 'deadline_exceeded', 'not_found', 'already_exists',
  'permission_denied', 'resource_exhausted', 'failed_precondition', 'aborted', 'out_of_range', 'unimplemented',
  'internal_error', 'unavailable', 'data_loss', 'unauthenticated',
]);
const SPAN_SOURCES: ReadonlySet<string> = new Set(['url', 'route', 'view', 'component', 'task', 'custom']);
const BREADCRUMB_TYPES: ReadonlySet<string> = new Set(['default', 'http', 'navigation', 'user', 'ui', 'info', 'debug', 'error', 'query']);
const MECHANISM_TYPES: ReadonlySet<string> = new Set([
  'generic', 'onerror', 'onunhandledrejection', 'chained', 'instrument', 'auto.core.linked_errors',
  'auto.browser.global_handlers.onerror', 'auto.browser.global_handlers.onunhandledrejection',
  'auto.function.react.error_boundary', 'auto.function.react.error_handler',
]);
const SDK_NAMES: ReadonlySet<string> = new Set(['sentry.javascript.react', 'sentry.javascript.browser']);
const ENVIRONMENTS: ReadonlySet<string> = new Set(['production', 'development', 'staging', 'test']);
const UNITS: ReadonlySet<string> = new Set(['millisecond', 'second', 'none', 'byte', 'ratio', 'percent', '']);
const RENDER_BLOCKING: ReadonlySet<string> = new Set(['blocking', 'non-blocking']);
/** Web-vital measurements the browser SDK produces, each with its plausible range; anything else is dropped. */
const MEASUREMENT_RANGES: Readonly<Record<string, readonly [number, number]>> = {
  fp: [0, 600_000], fcp: [0, 600_000], lcp: [0, 600_000], inp: [0, 600_000], fid: [0, 600_000],
  ttfb: [0, 600_000], 'ttfb.requestTime': [0, 600_000], 'connection.rtt': [0, 60_000], cls: [0, 100],
};

const str = (v: unknown, re: RegExp): string | undefined => (typeof v === 'string' && re.test(v) ? v : undefined);
// Field-specific numeric validation: each number must fall within the plausible range for what its
// field means, and is dropped otherwise. This rejects out-of-range values such as a phone or
// account number placed in a status, size, rate, duration, line/column, timestamp or web-vital
// field. LIMITATION: it cannot tell what an in-range number represents (e.g. a 7-digit value is a
// valid response size), so it narrows, but does not eliminate, what a numeric field could carry.
// Timestamps outside the window are removed; a span's required start_timestamp falls back to 0.
const inRange = (v: unknown, lo: number, hi: number, integer = false): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi && (!integer || Number.isInteger(v)) ? v : undefined;
const httpStatus = (v: unknown) => inRange(v, 100, 599, true);
const byteSize = (v: unknown) => inRange(v, 0, 50_000_000, true);
const sampleRate = (v: unknown) => inRange(v, 0, 1);
const durationMs = (v: unknown) => inRange(v, 0, 3_600_000);
const lineOrColumn = (v: unknown) => inRange(v, 0, 5_000_000, true);
/** Epoch seconds within two days of now, i.e. an SDK timestamp, never an arbitrary number. */
const epochSeconds = (v: unknown) => {
  const now = Date.now() / 1000;
  return inRange(v, now - 172_800, now + 86_400);
};
const bool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined);
/** Drops undefined values so rebuilt objects contain only what was validated. */
function defined<T extends Obj>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}
const oneOf = (v: unknown, set: ReadonlySet<string>): string | undefined => (typeof v === 'string' && set.has(v) ? v : undefined);
const routeOf = (v: unknown, kind: RouteKind): string | undefined => (typeof v === 'string' ? templateRoute(v, kind) : undefined);
/** Page loads and navigations carry page URLs; every other span carries API or resource URLs. */
const kindForOp = (op: string | undefined): RouteKind => (op === 'pageload' || op === 'navigation' ? 'page' : 'api');

function pageOrigin(): string | undefined {
  try { return typeof self !== 'undefined' ? `${self.location.protocol}//${self.location.host}` : undefined; } catch { return undefined; }
}
/** protocol//host: URL.origin is "null" for custom schemes such as capacitor://. */
const originOf = (u: URL) => `${u.protocol}//${u.host}`;
/** The app's own origins (website, iOS and Android apps). */
const APP_ORIGINS: ReadonlySet<string> = new Set([
  'https://iluase.com', 'https://www.iluase.com', 'capacitor://localhost', 'https://localhost',
]);
const LOOPBACK = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
/** An origin may appear in telemetry only if it is one of the app's own, or this page's own loopback origin (local testing). */
function allowedOrigin(origin: string): boolean {
  return APP_ORIGINS.has(origin) || (LOOPBACK.test(origin) && origin === pageOrigin());
}

// ── Stack frames: only this app's own bundle files ───────────────────────────────────────────
function cleanFrame(f: Obj): Obj | null {
  if (typeof f.filename !== 'string') return null;
  let u: URL;
  try { u = new URL(f.filename); } catch { return null; }
  const origin = originOf(u);
  if (origin !== pageOrigin() || !allowedOrigin(origin) || !BUNDLE_PATH.test(u.pathname) || u.search || u.hash) return null;
  return defined({
    filename: `${origin}${u.pathname}`,
    // Function names are omitted: they are not drawn from a finite set (and are minified anyway).
    lineno: lineOrColumn(f.lineno),
    colno: lineOrColumn(f.colno),
    in_app: bool(f.in_app),
  });
}
function cleanStacktrace(st: unknown): Obj | undefined {
  const frames = (st as { frames?: unknown })?.frames;
  if (!Array.isArray(frames)) return undefined;
  const kept = frames.map((f) => (f && typeof f === 'object' ? cleanFrame(f as Obj) : null)).filter((f): f is Obj => f !== null);
  return kept.length ? { frames: kept } : undefined;
}

// ── Spans, breadcrumbs, contexts, request ─────────────────────────────────────────────────────
const SPAN_DATA_URLS = ['url', 'http.url', 'url.full'];

function cleanSpanData(data: unknown, op: string | undefined): Obj {
  const d = (data && typeof data === 'object' ? data : {}) as Obj;
  const out: Obj = {};
  out['http.response.status_code'] = httpStatus(d['http.response.status_code']);
  out['http.response_content_length'] = byteSize(d['http.response_content_length']);
  out['http.response_transfer_size'] = byteSize(d['http.response_transfer_size']);
  out['sentry.sample_rate'] = sampleRate(d['sentry.sample_rate']);
  out['sentry.op'] = oneOf(d['sentry.op'], SPAN_OPS);
  out['sentry.origin'] = oneOf(d['sentry.origin'], SPAN_ORIGINS);
  out['sentry.source'] = oneOf(d['sentry.source'], SPAN_SOURCES);
  out['resource.render_blocking_status'] = oneOf(d['resource.render_blocking_status'], RENDER_BLOCKING);
  for (const k of ['http.method', 'http.request.method']) out[k] = oneOf(d[k], HTTP_METHODS);
  for (const k of SPAN_DATA_URLS) out[k] = routeOf(d[k], kindForOp(op));
  return defined(out);
}
function cleanDescription(op: string | undefined, d: unknown): string | undefined {
  if (typeof d !== 'string' || !d) return undefined;
  if (op === 'http' || op === 'http.client') {
    const [m, ...rest] = d.split(' ');
    return HTTP_METHODS.has(m) ? `${m} ${templateRoute(rest.join(' '), 'api')}` : templateRoute(d, 'api');
  }
  if (op === 'pageload' || op === 'navigation') return templateRoute(d, 'page');
  if (op?.startsWith('resource')) return templateRoute(d, 'api');
  return op ?? 'span'; // op is from SPAN_OPS; selectors and text are withheld
}

export function cleanSpan(s: SpanJson): SpanJson {
  const x = s as unknown as Obj;
  const op = oneOf(x.op, SPAN_OPS);
  return defined({
    span_id: str(x.span_id, HEX16) ?? '0000000000000000',
    trace_id: str(x.trace_id, HEX32) ?? '00000000000000000000000000000000',
    parent_span_id: str(x.parent_span_id, HEX16),
    start_timestamp: epochSeconds(x.start_timestamp) ?? 0,
    timestamp: epochSeconds(x.timestamp),
    op,
    origin: oneOf(x.origin, SPAN_ORIGINS),
    status: oneOf(x.status, SPAN_STATUSES),
    description: cleanDescription(op, x.description),
    exclusive_time: durationMs(x.exclusive_time),
    is_segment: bool(x.is_segment),
    segment_id: str(x.segment_id, HEX16),
    data: cleanSpanData(x.data, op),
  }) as unknown as SpanJson;
}

/** Only navigation, xhr/fetch and the fact of a click are kept; console, ui.input and all else are dropped. */
export function cleanCrumb(b: Crumb): Crumb | null {
  const base = defined({
    category: b.category,
    type: oneOf(b.type, BREADCRUMB_TYPES),
    level: typeof b.level === 'string' && LEVELS.has(b.level) ? b.level : undefined,
    timestamp: epochSeconds(b.timestamp),
  });
  const d = (b.data || {}) as Obj;
  if (b.category === 'navigation') return { ...base, data: defined({ from: routeOf(d.from, 'page'), to: routeOf(d.to, 'page') }) } as Crumb;
  if (b.category === 'xhr' || b.category === 'fetch') {
    return {
      ...base,
      data: defined({
        method: typeof d.method === 'string' && HTTP_METHODS.has(d.method) ? d.method : undefined,
        status_code: httpStatus(d.status_code),
        url: routeOf(d.url, 'api'),
      }),
    } as Crumb;
  }
  if (b.category === 'ui.click') return base as Crumb; // that a click happened; the selector is withheld
  return null;
}

function cleanTrace(t: unknown): Obj | undefined {
  if (!t || typeof t !== 'object') return undefined;
  const x = t as Obj;
  const op = oneOf(x.op, SPAN_OPS);
  return defined({
    trace_id: str(x.trace_id, HEX32),
    span_id: str(x.span_id, HEX16),
    parent_span_id: str(x.parent_span_id, HEX16),
    op,
    status: oneOf(x.status, SPAN_STATUSES),
    origin: oneOf(x.origin, SPAN_ORIGINS),
    data: cleanSpanData(x.data, op),
  });
}
function nameVersion(c: unknown): Obj | undefined {
  if (!c || typeof c !== 'object') return undefined;
  const x = c as Obj;
  const out = defined({ name: str(x.name, TOKEN), version: str(x.version, TOKEN) });
  return Object.keys(out).length ? out : undefined;
}
function cleanContexts(c: unknown): Obj {
  const x = (c && typeof c === 'object' ? c : {}) as Obj;
  const react = x.react && typeof x.react === 'object' ? defined({ version: str((x.react as Obj).version, TOKEN) }) : undefined;
  return defined({
    trace: cleanTrace(x.trace),
    browser: nameVersion(x.browser),
    os: nameVersion(x.os),
    device: nameVersion(x.device),
    react: react && Object.keys(react).length ? react : undefined,
  });
}
function cleanRequest(r: unknown): Obj | undefined {
  const x = r as { url?: unknown; headers?: Record<string, unknown> } | undefined;
  if (typeof x?.url !== 'string') return undefined;
  let origin = '';
  try {
    const o = originOf(new URL(x.url));
    origin = allowedOrigin(o) ? o : ''; // an unexpected host is never sent: route template only
  } catch { /* relative URL: route template only */ }
  const ua = str(x.headers?.['User-Agent'], UA);
  return defined({ url: `${origin}${templateRoute(x.url, 'page')}`, headers: ua ? { 'User-Agent': ua } : undefined });
}
function cleanTags(t: unknown): Obj {
  const type = (t as Obj | undefined)?.type;
  return typeof type === 'string' && TELEMETRY_TYPES.has(type) ? { type } : {};
}
function cleanExtra(x: unknown): Obj {
  const e = (x && typeof x === 'object' ? x : {}) as Obj;
  const d = normalizeDiagnostic(e); // every field re-validated; a raw URL route becomes /:unmatched
  return defined({
    kind: e.kind === 'http' || e.kind === 'error' || e.kind === 'unknown' ? d.kind : undefined,
    httpMethod: d.httpMethod,
    httpStatus: d.httpStatus,
    route: d.route,
    axiosCode: d.axiosCode,
    isNetworkError: d.isNetworkError,
    requestId: safeRequestId(e.requestId),
  });
}
function cleanSdk(s: unknown): Obj | undefined {
  if (!s || typeof s !== 'object') return undefined;
  const x = s as Obj;
  const out = defined({ name: oneOf(x.name, SDK_NAMES), version: str(x.version, SEMVER) });
  return Object.keys(out).length ? out : undefined;
}
function envelopeFields(e: Obj): Obj {
  return {
    event_id: str(e.event_id, HEX32),
    timestamp: epochSeconds(e.timestamp),
    start_timestamp: epochSeconds(e.start_timestamp),
    platform: e.platform === 'javascript' ? 'javascript' : undefined,
    level: typeof e.level === 'string' && LEVELS.has(e.level) ? e.level : undefined,
    environment: oneOf(e.environment, ENVIRONMENTS),
    sdk: cleanSdk(e.sdk),
  };
}

// ── Events ───────────────────────────────────────────────────────────────────────────────────
export function cleanErrorEvent(e: ErrorEvt, hint?: Hint): ErrorEvt {
  const x = e as unknown as Obj;
  // No exception message is ever forwarded. For a DiagnosticError the message is REBUILT here from
  // its re-validated diagnostic (being a DiagnosticError grants no trust); every other message is withheld.
  const original = hint?.originalException;
  const diag = original instanceof DiagnosticError ? normalizeDiagnostic(original.diagnostic) : null;
  const raw = (x.exception as { values?: Obj[] } | undefined)?.values ?? [];
  const values = raw.map((v, i) => {
    const isMain = i === raw.length - 1; // the SDK puts the captured error last (causes first)
    return defined({
      type: diag && isMain ? diag.name : typeof v.type === 'string' && SAFE_ERROR_NAMES.has(v.type) ? v.type : 'Error',
      value: diag && isMain ? describeDiagnostic(diag) : '[message withheld]',
      stacktrace: cleanStacktrace(v.stacktrace),
      mechanism: v.mechanism && typeof v.mechanism === 'object'
        ? defined({ type: oneOf((v.mechanism as Obj).type, MECHANISM_TYPES), handled: bool((v.mechanism as Obj).handled) })
        : undefined,
    });
  });
  return defined({
    ...envelopeFields(x),
    transaction: routeOf(x.transaction, 'page'),
    exception: values.length ? { values } : undefined,
    tags: cleanTags(x.tags),
    extra: cleanExtra(x.extra),
    contexts: cleanContexts(x.contexts),
    request: cleanRequest(x.request),
    breadcrumbs: Array.isArray(x.breadcrumbs)
      ? (x.breadcrumbs as Crumb[]).map(cleanCrumb).filter((b): b is Crumb => b !== null)
      : undefined,
  }) as unknown as ErrorEvt; // user, message, modules, debug_meta, fingerprint and everything else: dropped
}

export function cleanTransaction(e: TxEvt): TxEvt {
  const x = e as unknown as Obj;
  const measurements = x.measurements && typeof x.measurements === 'object'
    ? Object.fromEntries(
        Object.entries(x.measurements as Obj)
          .filter(([k, m]) => Object.prototype.hasOwnProperty.call(MEASUREMENT_RANGES, k) && m && typeof m === 'object'
            && inRange((m as Obj).value, ...MEASUREMENT_RANGES[k]) !== undefined)
          .map(([k, m]) => [k, defined({ value: (m as Obj).value as number, unit: oneOf((m as Obj).unit, UNITS) })]),
      )
    : undefined;
  return defined({
    ...envelopeFields(x),
    type: 'transaction',
    transaction: routeOf(x.transaction, 'page'),
    tags: cleanTags(x.tags),
    contexts: cleanContexts(x.contexts),
    request: cleanRequest(x.request),
    measurements,
    spans: Array.isArray(x.spans) ? (x.spans as SpanJson[]).map(cleanSpan) : undefined,
  }) as unknown as TxEvt;
}

// ── Reporting ────────────────────────────────────────────────────────────────────────────────
const reported = new WeakSet<object>();

/**
 * The only way to report an error. Sends a NEW DiagnosticError built from allow-listed fields;
 * the original error object never reaches Sentry. Reports each original error at most once.
 */
export function reportError(error: unknown, type: TelemetryType): void {
  if (!dsn || dsn.trim() === '') return;
  if (error && typeof error === 'object') {
    if (reported.has(error)) return;
    reported.add(error);
  }
  const d = toDiagnostic(error);
  Sentry.captureException(new DiagnosticError(d, error), {
    tags: { type },
    extra: {
      kind: d.kind, httpMethod: d.httpMethod, httpStatus: d.httpStatus, route: d.route,
      axiosCode: d.axiosCode, isNetworkError: d.isNetworkError, requestId: d.requestId,
    },
  });
}

export function initSentry(): void {
  if (!dsn || dsn.trim() === '') {
    return;
  }

  Sentry.init({
    dsn,
    environment: env,
    // Session Replay (its integration and both of its sample rates) removed; see the header comment.
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate,
    sendDefaultPii: false,
    beforeBreadcrumb: (b) => cleanCrumb(b),
    beforeSend: (e, hint) => cleanErrorEvent(e, hint),
    beforeSendTransaction: (e) => cleanTransaction(e),
    beforeSendSpan: (s) => cleanSpan(s),
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      'Loading chunk',
      'ChunkLoadError',
    ],
  });
}

export { Sentry };
