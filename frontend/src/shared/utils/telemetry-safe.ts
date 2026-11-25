/**
 * The ONLY error data allowed to leave the app (browser console or Sentry).
 *
 * Deny by default: every value that leaves is built from a fixed set (HTTP methods, status
 * range, error names, Axios codes), a validated UUID, or one of the app's own route templates
 * (parameter positions always ':param', whatever their runtime value; see route-templates.ts). Error messages, server messages, request bodies, headers, query
 * strings and unknown fields are never copied; they are dropped, not "redacted".
 *
 * Background (November 2026): raw Axios errors passed to the console were recorded by Sentry
 * Replay with the login request body, i.e. members' passwords in plain text, and token-bearing
 * URLs (password reset, email verification, email change) reached errors, traces and Replay.
 */
import { isAxiosError } from 'axios';
import { API_ROUTE_TEMPLATES, PAGE_ROUTE_TEMPLATES } from './route-templates';

export const HTTP_METHODS: ReadonlySet<string> = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const AXIOS_CODES: ReadonlySet<string> = new Set([
  'ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT', 'ERR_CANCELED', 'ERR_BAD_REQUEST', 'ERR_BAD_RESPONSE',
]);
export const SAFE_ERROR_NAMES: ReadonlySet<string> = new Set([
  'Error', 'TypeError', 'ReferenceError', 'RangeError', 'SyntaxError', 'URIError', 'AggregateError',
  'AbortError', 'ChunkLoadError', 'NotAllowedError', 'QuotaExceededError', 'SecurityError', 'HttpError',
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REQUEST_ID_HEADER = 'x-request-id';

export interface Diagnostic {
  kind: 'http' | 'error' | 'unknown';
  name: string;
  httpMethod?: string;
  httpStatus?: number;
  route?: string;
  axiosCode?: string;
  isNetworkError?: boolean;
  requestId?: string;
}

export type RouteKind = 'page' | 'api';

function byLength(templates: readonly string[]): Map<number, string[][]> {
  const m = new Map<number, string[][]>();
  for (const t of templates) {
    const segs = t.split('/').filter(Boolean);
    const list = m.get(segs.length) ?? [];
    list.push(segs);
    m.set(segs.length, list);
  }
  return m;
}
const PAGE_BY_LENGTH = byLength(PAGE_ROUTE_TEMPLATES);
const API_BY_LENGTH = byLength(API_ROUTE_TEMPLATES);

function matches(tpl: string[], segs: string[]): boolean {
  return tpl.every((t, i) => (t === ':param' ? segs[i] !== '' : t === segs[i]));
}

/** Page URLs: as React Router resolves them, the template with the most static segments wins. */
function matchPage(segs: string[]): string[] | null {
  let best: string[] | null = null;
  let bestStatic = -1;
  for (const tpl of PAGE_BY_LENGTH.get(segs.length) ?? []) {
    if (!matches(tpl, segs)) continue;
    const statics = tpl.filter((t) => t !== ':param').length;
    if (statics > bestStatic) { best = tpl; bestStatic = statics; }
  }
  return best;
}

/**
 * API paths: STRICT. A position keeps its static word only if every matching template has that
 * same static word there; if any matching template has ':param' there, it is ':param'.
 */
function matchApi(segs: string[]): string[] | null {
  const all = (API_BY_LENGTH.get(segs.length) ?? []).filter((tpl) => matches(tpl, segs));
  if (all.length === 0) return null;
  return segs.map((_, i) => (all.every((tpl) => tpl[i] !== ':param' && tpl[i] === all[0][i]) ? all[0][i] : ':param'));
}

/**
 * The route template of a URL: no origin, query or fragment; static words only where the template
 * says so; ':param' at every parameter position regardless of the runtime value. A path matching
 * no template becomes '/:unmatched'. Paths under '/api' are always matched as API paths.
 */
export function templateRoute(url: string, kind: RouteKind): string {
  let path: string;
  try {
    path = new URL(url, 'http://route.invalid').pathname;
  } catch {
    return '/:unparseable';
  }
  const segs = path.split('/').filter(Boolean);
  const isApi = segs[0] === 'api';
  if (isApi) segs.shift();
  const prefix = isApi ? '/api' : '';
  const match = isApi || kind === 'api' ? matchApi(segs) : matchPage(segs);
  if (match === null) return `${prefix}/:unmatched`;
  return match.length === 0 ? prefix || '/' : `${prefix}/${match.join('/')}`;
}

const TEMPLATE_SHAPE = /^(\/api)?(\/(:param|:unmatched|[a-z][a-z0-9-]{0,40}))*\/?$/;
/** Re-validates a route that should already be a template (e.g. from a Diagnostic). */
function revalidateRoute(route: unknown): string | undefined {
  if (typeof route !== 'string') return undefined;
  if (/^(\/api)?\/:unmatched$/.test(route)) return route;
  return TEMPLATE_SHAPE.test(route) ? templateRoute(route, 'api') : '/:unmatched';
}

/** A request ID is kept only if it is a UUID; anything else is dropped. */
export function safeRequestId(value: unknown): string | undefined {
  return typeof value === 'string' && UUID.test(value) ? value.toLowerCase() : undefined;
}

function headerValue(headers: unknown, name: string): unknown {
  if (!headers || typeof headers !== 'object') return undefined;
  const h = headers as { get?: (n: string) => unknown } & Record<string, unknown>;
  if (typeof h.get === 'function') {
    try { return h.get(name); } catch { /* fall through */ }
  }
  return h[name];
}

/**
 * The failing request's own x-request-id (generated by the API client and sent to the backend).
 * If the response carries a different ID, neither is trusted and none is returned.
 */
function requestIdOf(e: { config?: { headers?: unknown }; response?: { headers?: unknown } }): string | undefined {
  const sent = safeRequestId(headerValue(e.config?.headers, REQUEST_ID_HEADER));
  const echoed = headerValue(e.response?.headers, REQUEST_ID_HEADER);
  if (echoed !== undefined && echoed !== null && safeRequestId(echoed) !== sent) return undefined;
  return sent;
}

/** Allow-listed summary of any thrown value. Never its message, config, body, headers or response. */
export function toDiagnostic(e: unknown): Diagnostic {
  if (isAxiosError(e)) {
    const method = typeof e.config?.method === 'string' ? e.config.method.toUpperCase() : undefined;
    const status = e.response?.status;
    return {
      kind: 'http',
      name: 'HttpError',
      httpMethod: method && HTTP_METHODS.has(method) ? method : undefined,
      httpStatus: typeof status === 'number' && Number.isInteger(status) && status >= 100 && status < 600 ? status : undefined,
      route: typeof e.config?.url === 'string' ? templateRoute(e.config.url, 'api') : undefined,
      axiosCode: typeof e.code === 'string' && AXIOS_CODES.has(e.code) ? e.code : undefined,
      isNetworkError: !e.response,
      requestId: requestIdOf(e),
    };
  }
  if (e instanceof Error) return { kind: 'error', name: SAFE_ERROR_NAMES.has(e.name) ? e.name : 'Error' };
  return { kind: 'unknown', name: 'Error' };
}

/**
 * Re-validates every field of a value claiming to be a Diagnostic. A Diagnostic is never trusted
 * because of its type: anything that fails validation is dropped.
 */
export function normalizeDiagnostic(input: unknown): Diagnostic {
  const d = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const kind = d.kind === 'http' || d.kind === 'error' || d.kind === 'unknown' ? d.kind : 'unknown';
  const status = d.httpStatus;
  const out: Diagnostic = {
    kind,
    name: typeof d.name === 'string' && SAFE_ERROR_NAMES.has(d.name) ? d.name : 'Error',
    httpMethod: typeof d.httpMethod === 'string' && HTTP_METHODS.has(d.httpMethod) ? d.httpMethod : undefined,
    httpStatus: typeof status === 'number' && Number.isInteger(status) && status >= 100 && status < 600 ? status : undefined,
    route: revalidateRoute(d.route),
    axiosCode: typeof d.axiosCode === 'string' && AXIOS_CODES.has(d.axiosCode) ? d.axiosCode : undefined,
    isNetworkError: typeof d.isNetworkError === 'boolean' ? d.isNetworkError : undefined,
    requestId: safeRequestId(d.requestId),
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) as unknown as Diagnostic;
}

/** The message of a DiagnosticError: built only from re-validated fields. */
export function describeDiagnostic(input: unknown): string {
  const d = normalizeDiagnostic(input);
  return [d.kind, d.httpMethod, d.route, d.httpStatus, d.axiosCode].filter((x) => x !== undefined).join(' ');
}

const V8_FRAME = /^\s+at\s/;
const JSC_SM_FRAME = /^[^\s@]*@\S+:\d+:\d+$/;

/**
 * A NEW error whose message is built only from a Diagnostic. It keeps the source error's stack
 * frame lines (never its message line); the Sentry cleaner then rebuilds each frame from validated
 * fields and drops any frame that is not from this app's own bundle.
 */
export class DiagnosticError extends Error {
  readonly diagnostic: Diagnostic;

  constructor(input: Diagnostic, source?: unknown) {
    const d = normalizeDiagnostic(input);
    super(describeDiagnostic(d));
    this.name = d.name;
    this.diagnostic = d;
    const frames = source instanceof Error && typeof source.stack === 'string'
      ? source.stack.split('\n').filter((l) => V8_FRAME.test(l) || JSC_SM_FRAME.test(l)).slice(0, 50)
      : [];
    this.stack = [`${this.name}: ${this.message}`, ...frames].join('\n');
  }
}

/**
 * Console arguments after the first (the first must be a constant string; telemetry-guard.test.ts
 * enforces that at every call site). null/undefined are kept; numbers, booleans and strings become
 * placeholders (a number can be an account or phone number); errors become a Diagnostic;
 * everything else '[object]'. Numeric diagnostics travel only inside a Diagnostic's fixed fields.
 */
export function safeLogArgs(args: unknown[]): unknown[] {
  return args.map((a, i) => {
    if (i === 0 && typeof a === 'string') return a;
    if (a === null || a === undefined) return a;
    if (typeof a === 'number' || typeof a === 'bigint') return '[number]';
    if (typeof a === 'boolean') return '[boolean]';
    if (typeof a === 'string') return `[string:${a.length}]`;
    if (a instanceof Error || isAxiosError(a)) return toDiagnostic(a);
    return '[object]';
  });
}
