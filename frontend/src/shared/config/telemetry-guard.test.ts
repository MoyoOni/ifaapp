/**
 * Source-level guards for the telemetry rules (November 2026 incident). These read the code
 * itself, so a new call site cannot quietly reintroduce a leak.
 *
 * Route templates: this test is also the generator of shared/utils/route-templates.ts.
 *   UPDATE_ROUTE_TEMPLATES=1 npx vitest run src/shared/config/telemetry-guard.test.ts
 * rewrites that file from the source; a normal run fails if the file differs from the source.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { API_ROUTE_TEMPLATES, PAGE_ROUTE_TEMPLATES } from '@/shared/utils/route-templates';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SENTRY_CONFIG = path.join('shared', 'config', 'sentry.ts');
const LOGGER_MODULE = path.join('shared', 'utils', 'logger.ts');
const TEMPLATES_FILE = path.join(SRC, 'shared', 'utils', 'route-templates.ts');
/** Tests that parse every source file (~380): normally ~2 s, but must not fail under CPU load (e.g. a parallel Docker build). */
const SOURCE_SCAN_TIMEOUT_MS = 60_000;

/** src/test holds test-only infrastructure (setup, factories); a guard test asserts no app file imports it. */
const TEST_SUPPORT = path.join(SRC, 'test');
function sourceFiles(dir = SRC): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return p === TEST_SUPPORT ? [] : sourceFiles(p);
    return /\.(ts|tsx)$/.test(d.name) && !/\.(test|spec)\./.test(d.name) && !d.name.endsWith('.d.ts') ? [p] : [];
  });
}
const files = sourceFiles();
const rel = (p: string) => path.relative(SRC, p);
const read = (p: string) => fs.readFileSync(p, 'utf8');
const parse = (file: string, text: string) =>
  ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const insideImport = (n: ts.Node): boolean => {
  for (let p: ts.Node | undefined = n.parent; p; p = p.parent) if (ts.isImportDeclaration(p)) return true;
  return false;
};

/**
 * False for identifiers that are not value references: the name of a declared property, method,
 * object key, enum member, JSX attribute or binding key, or anything in a type position.
 */
function isValueReference(id: ts.Identifier): boolean {
  const p = id.parent;
  if ((ts.isPropertyAccessExpression(p) || ts.isQualifiedName(p)) && p.name === id) return false;
  if ((ts.isPropertySignature(p) || ts.isPropertyDeclaration(p) || ts.isMethodDeclaration(p) || ts.isMethodSignature(p)
    || ts.isPropertyAssignment(p) || ts.isEnumMember(p) || ts.isGetAccessor(p) || ts.isSetAccessor(p)) && p.name === id) return false;
  if (ts.isBindingElement(p) && p.propertyName === id) return false;
  if (ts.isJsxAttribute(p) && p.name === id) return false;
  for (let q: ts.Node | undefined = p; q && !ts.isSourceFile(q); q = q.parent) if (ts.isTypeNode(q)) return false;
  return true;
}

/** True if `name` occurs in a binding name (identifier, or object/array destructuring). */
function binds(name: ts.BindingName, text: string): boolean {
  if (ts.isIdentifier(name)) return name.text === text;
  return name.elements.some((el) => !ts.isOmittedExpression(el) && binds(el.name, text));
}
/** True if this identifier refers to a local binding (parameter, block variable, catch clause) rather than the import. */
function isShadowed(id: ts.Identifier): boolean {
  for (let p: ts.Node | undefined = id.parent; p && !ts.isSourceFile(p); p = p.parent) {
    if (ts.isFunctionLike(p) && p.parameters.some((param) => binds(param.name, id.text))) return true;
    if (ts.isCatchClause(p) && p.variableDeclaration && binds(p.variableDeclaration.name, id.text)) return true;
    if (ts.isBlock(p) || ts.isCaseClause(p) || ts.isDefaultClause(p)) {
      for (const st of p.statements) {
        if (ts.isVariableStatement(st) && st.declarationList.declarations.some((d) => binds(d.name, id.text))) return true;
        if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.name?.text === id.text) return true;
      }
    }
    if ((ts.isForStatement(p) || ts.isForOfStatement(p) || ts.isForInStatement(p)) && p.initializer && ts.isVariableDeclarationList(p.initializer)
      && p.initializer.declarations.some((d) => binds(d.name, id.text))) return true;
  }
  return false;
}

/**
 * The declaration that binds this identifier, searching outward through every scope that can bind a
 * name: function parameters, a named function/class expression's own name, `for` / `for…of` /
 * `for…in` initialisers, catch clauses, and variable, function and class declarations in blocks.
 * Null if the name is not bound in this file.
 */
function nearestBinding(id: ts.Identifier): ts.Node | null {
  for (let p: ts.Node | undefined = id.parent; p; p = p.parent) {
    if (ts.isFunctionLike(p)) {
      const prm = p.parameters.find((x) => binds(x.name, id.text));
      if (prm) return prm;
      if ((ts.isFunctionExpression(p) || ts.isClassExpression(p)) && p.name?.text === id.text) return p;
    }
    if ((ts.isForStatement(p) || ts.isForOfStatement(p) || ts.isForInStatement(p))
      && p.initializer && ts.isVariableDeclarationList(p.initializer)) {
      const d = p.initializer.declarations.find((x) => binds(x.name, id.text));
      if (d) return d;
    }
    if (ts.isCatchClause(p) && p.variableDeclaration && binds(p.variableDeclaration.name, id.text)) return p.variableDeclaration;
    if (ts.isBlock(p) || ts.isSourceFile(p) || ts.isCaseClause(p) || ts.isDefaultClause(p) || ts.isModuleBlock(p)) {
      for (const st of p.statements) {
        if (ts.isVariableStatement(st)) {
          const d = st.declarationList.declarations.find((x) => binds(x.name, id.text));
          if (d) return d;
        }
        if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.name?.text === id.text) return st;
      }
    }
  }
  return null;
}
const enclosingFunction = (n: ts.Node): ts.SignatureDeclaration | null => {
  for (let p: ts.Node | undefined = n.parent; p; p = p.parent) if (ts.isFunctionLike(p)) return p;
  return null;
};
/**
 * True if this expression is written to: the target of any assignment (including compound and
 * destructuring assignment), ++/--, a `for…of`/`for…in` target, or `delete`.
 */
function isWriteTarget(n: ts.Node): boolean {
  let cur: ts.Node = n;
  let p = cur.parent;
  while (p && (ts.isObjectLiteralExpression(p) || ts.isArrayLiteralExpression(p) || ts.isShorthandPropertyAssignment(p)
    || (ts.isPropertyAssignment(p) && p.initializer === cur) || ts.isSpreadElement(p) || ts.isSpreadAssignment(p)
    || ts.isParenthesizedExpression(p))) { cur = p; p = p.parent; }
  if (!p) return false;
  if (ts.isBinaryExpression(p) && p.left === cur
    && p.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && p.operatorToken.kind <= ts.SyntaxKind.LastAssignment) return true;
  if ((ts.isForOfStatement(p) || ts.isForInStatement(p)) && p.initializer === cur) return true;
  if (cur !== n) return false;
  if ((ts.isPrefixUnaryExpression(p) || ts.isPostfixUnaryExpression(p))
    && (p.operator === ts.SyntaxKind.PlusPlusToken || p.operator === ts.SyntaxKind.MinusMinusToken)) return true;
  return ts.isDeleteExpression(p);
}
/** Every identifier in `scope` that refers to `binding` (by nearest-binding resolution). */
function referencesTo(scope: ts.Node, binding: ts.Node, name: string): ts.Identifier[] {
  const out: ts.Identifier[] = [];
  const visit = (n: ts.Node): void => {
    const p = n.parent;
    const isDeclarationName = (ts.isVariableDeclaration(p) || ts.isParameter(p) || ts.isBindingElement(p)) && p.name === n;
    if (ts.isIdentifier(n) && n.text === name && !isDeclarationName && isValueReference(n) && nearestBinding(n) === binding) out.push(n);
    ts.forEachChild(n, visit);
  };
  visit(scope);
  return out;
}

// ── Logger guard ────────────────────────────────────────────────────────────────────────────────
/**
 * The logger may only be used as `logger.<method>(...)` / `logger['<method>'](...)`; error/warn
 * must start with a constant string. Any other use of the logger as a value (alias, destructuring,
 * passing it on, .call/.bind, computed method) is an offence, so aliases cannot bypass the check.
 */
function loggerOffenders(file: string, text: string): string[] {
  const sf = parse(file, text);
  const direct = new Set<string>();
  const namespaces = new Set<string>();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
    if (!/(^|\/)logger$/.test(st.moduleSpecifier.text)) continue;
    const clause = st.importClause;
    if (clause?.name) direct.add(clause.name.text);
    const nb = clause?.namedBindings;
    if (nb && ts.isNamedImports(nb)) {
      for (const el of nb.elements) if ((el.propertyName ?? el.name).text === 'logger') direct.add(el.name.text);
    }
    if (nb && ts.isNamespaceImport(nb)) namespaces.add(nb.name.text);
  }
  if (direct.size === 0 && namespaces.size === 0) return [];
  const offenders: string[] = [];
  const loc = (n: ts.Node) => `${file}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;

  const checkUse = (ref: ts.Expression) => {
    const acc = ref.parent;
    let m: string;
    if (ts.isPropertyAccessExpression(acc) && acc.expression === ref) m = acc.name.text;
    else if (ts.isElementAccessExpression(acc) && acc.expression === ref) {
      m = ts.isStringLiteralLike(acc.argumentExpression) ? acc.argumentExpression.text : '<computed>';
    } else {
      offenders.push(`${loc(ref)} (logger used as a value: alias, destructuring or argument)`);
      return;
    }
    const call = acc.parent;
    if (!(ts.isCallExpression(call) && call.expression === acc)) {
      offenders.push(`${loc(ref)} (logger.${m} referenced outside a direct call)`);
    } else if (m === '<computed>') {
      offenders.push(`${loc(ref)} (computed logger method)`);
    } else if (m === 'error' || m === 'warn') {
      const a = call.arguments[0];
      if (!a || !(ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a))) offenders.push(`${loc(ref)} (non-constant message)`);
    }
  };
  const visit = (n: ts.Node): void => {
    if (ts.isIdentifier(n) && !insideImport(n) && isValueReference(n) && !isShadowed(n)) {
      const p = n.parent;
      if (direct.has(n.text)) checkUse(n);
      if (namespaces.has(n.text)) {
        if (ts.isPropertyAccessExpression(p) && p.expression === n) {
          if (p.name.text === 'logger') checkUse(p);
        } else {
          offenders.push(`${loc(n)} (logger module namespace used as a value)`);
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return offenders;
}

// ── Route inventory ─────────────────────────────────────────────────────────────────────────────
/** A path string (or template literal text with ${} placeholders) as a route template, or null. Must start with '/'. */
function templateOf(raw: string): string | null {
  if (!raw.startsWith('/') || /^\/[\\/]/.test(raw)) return null; // '//host' and '/\\host' are protocol-relative URLs, not paths
  const p = raw.replace(/\$\{[^}]*\}/g, '${}').split(/[?#]/)[0];
  const segs: string[] = [];
  for (const seg of p.split('/').slice(1)) {
    if (seg === '') continue;
    if (seg.includes('${}') || seg.startsWith(':')) segs.push(':param');
    else if (/^[a-z][a-z0-9-]{0,40}$/.test(seg) && !seg.endsWith('-')) segs.push(seg);
    else return null;
  }
  if (segs[0] === 'api') segs.shift();
  return `/${segs.join('/')}`;
}
/** Text of a string or template literal (template spans become ${}), or null for anything else. */
function literalText(e: ts.Expression): string | null {
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
  if (ts.isTemplateExpression(e)) return e.head.text + e.templateSpans.map((sp) => `\${}${sp.literal.text}`).join('');
  if (ts.isCallExpression(e) && ts.isIdentifier(e.expression) && e.expression.text === 'apiUrl' && e.arguments[0]) return literalText(e.arguments[0]);
  return null;
}
/** The literal `url` of a request config object, or null. */
function configUrl(e: ts.Expression | undefined): string | null {
  if (!e || !ts.isObjectLiteralExpression(e)) return null;
  const prop = e.properties.find((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'url');
  return prop ? literalText(prop.initializer) : null;
}

/** Request methods of the API client / axios: the path is the first argument. */
const PATH_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'postForm', 'putForm', 'patchForm']);
/** Members that never send a request. Any member not listed here or in PATH_METHODS/request is a problem. */
const NON_REQUEST_MEMBERS = new Set(['interceptors', 'defaults', 'isAxiosError', 'isCancel', 'CancelToken', 'getUri']);
// `create` returns a new client: it must be bound to a plain variable, which is then tracked like the import.
/**
 * The one retry: in lib/api.ts, inside the error handler of `<client>.interceptors.response.use(…, (error) => …)`,
 * `return <client>(originalRequest)` where `const originalRequest = error.config` is declared in that same handler,
 * `error` there is the handler's own parameter, and the config is never re-pointed: the only writes allowed are
 * `originalRequest._retry` and `originalRequest.headers.*`, and it is not aliased or passed anywhere else.
 * `error.config` is the same object, so it gets the same protection anywhere in the handler (before or after
 * the const): no writes through `error.config…`, no other use of `error.config` as a value, and `error` itself
 * is only read, given non-config fields, or passed to the read-only consumers below.
 */
const RETRY = { file: 'lib/api.ts', argument: 'originalRequest' } as const;
/**
 * Functions the retry handler may pass `error` to, each identified by its import (module + exported name), so a
 * local function with the same name is not trusted. Each only reads `error` (checked by hand; none writes
 * `config`). `Promise.reject` is allowed only while `Promise` is the global.
 */
const READ_ONLY_ERROR_CONSUMERS: ReadonlyMap<string, string> = new Map([
  ['isUnreachableError', path.join(SRC, 'shared', 'utils', 'server-reachability')],
  ['parseApiError', path.join(SRC, 'shared', 'utils', 'api-error')],
  ['reportApiError', path.join(SRC, 'shared', 'utils', 'api-error')],
]);
/** Members of originalRequest the handler may read (plain values: nothing can escape through them) and write. */
const RETRY_READABLE = new Set(['_retry', 'url']);
/**
 * The only member paths of the handler's `error` it may use (besides `config` in the approved initializer). Everything
 * else is refused, notably `error.response.config`: it is the same request config object as `error.config`.
 */
const ERROR_READABLE = new Set(['response.status', 'response.data']);
const ERROR_WRITABLE = new Set(['userMessage', 'isNetworkError']);
/**
 * The one forwarder: in use-api-query.ts, `<client>.get(endpoint, …)` where `endpoint` is bound by the first
 * parameter of the exported useApiQuery / usePaginatedApiQuery function (whose callers pass a literal endpoint)
 * and is never assigned anywhere in that function.
 */
const FORWARD = { file: 'shared/hooks/use-api-query.ts', method: 'get', argument: 'endpoint' } as const;
/** Exact origins (scheme://host[:port]) of the app itself: an absolute URL on one of these is inventoried like a '/…' path. */
const APP_ORIGINS: ReadonlySet<string> = new Set(['https://iluase.com', 'https://www.iluase.com']);
/** Exact external origins the app deliberately calls, with the reason. Any other absolute origin fails the guard. */
const APPROVED_EXTERNAL_ORIGINS: ReadonlyMap<string, string> = new Map([
  ['https://api.example.com', 'SentryTestPage: a deliberately failing request to test error capture'],
]);
/** Request mechanisms the app must not use (they bypass the inventoried clients). */
const UNSUPPORTED_MECHANISMS = new Set(['XMLHttpRequest', 'EventSource', 'sendBeacon']);
/** Names that may never be destructured from any object (that would alias a request mechanism). */
const REQUEST_NAMES = new Set(['fetch', ...UNSUPPORTED_MECHANISMS]);
/** Global objects: only `g.member`, `typeof g` and `'x' in g` are allowed; any other use would alias them. */
const GLOBAL_OBJECTS = new Set(['window', 'globalThis', 'self', 'navigator']);
/** Code-from-string and CommonJS loading: never allowed (requests could be built invisibly). */
const BANNED_GLOBALS = new Set(['eval', 'Function', 'require']);
const QUERY_HOOKS = new Set(['useApiQuery', 'usePaginatedApiQuery']);
const API_MODULE = path.join(SRC, 'lib', 'api');
const HOOK_MODULE = path.join(SRC, 'shared', 'hooks', 'use-api-query');

const resolveSpec = (file: string, spec: string): string | null =>
  (spec.startsWith('@/') ? path.join(SRC, spec.slice(2)) : spec.startsWith('.') ? path.resolve(path.dirname(file), spec) : null)
    ?.replace(/\.(ts|tsx)$/, '').replace(/[\\/]index$/, '') ?? null;
/** Is this import the app's API client module (by resolved path, whatever the specifier style)? */
function isApiModule(file: string, spec: string): boolean {
  return resolveSpec(file, spec) === API_MODULE;
}
/** Modules whose exports make requests: they may only be imported statically (and are then tracked). */
function isClientModule(file: string, spec: string): boolean {
  const t = resolveSpec(file, spec);
  return spec === 'axios' || t === API_MODULE || t === HOOK_MODULE;
}

interface Inventory { api: Set<string>; page: Set<string>; problems: string[] }

/**
 * API request paths and page routes of one source file. Every use of the API client or axios
 * (under any import name) must be a recognised request form with a statically known path, or a
 * known non-request member; anything else, and every unsupported request mechanism, is a problem.
 */
function inventoryOf(file: string, absPath: string, text: string): Inventory {
  const api = new Set<string>();
  const page = new Set<string>();
  const problems: string[] = [];
  const sf = parse(file, text);
  const loc = (n: ts.Node) => `${file}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
  const add = (n: ts.Node, raw: string | null, what: string) => {
    const t = raw === null ? null : templateOf(raw);
    if (t === null) problems.push(`${loc(n)} ${what}: path is not a literal absolute ('/…') plain route`);
    else api.add(t);
  };

  // Local names bound to the API client or axios (default, named default/api, or namespace).
  const clients = new Set<string>();
  const clientNamespaces = new Set<string>();
  const hooks = new Set<string>();
  const hookNamespaces = new Set<string>();
  /** Every named import of this file: local name -> exported name and resolved module path. */
  const importedNames = new Map<string, { exported: string; module: string | null }>();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
    const spec = st.moduleSpecifier.text;
    const nbAll = st.importClause?.namedBindings;
    if (st.importClause?.name) importedNames.set(st.importClause.name.text, { exported: 'default', module: resolveSpec(absPath, spec) });
    if (nbAll && ts.isNamedImports(nbAll)) {
      for (const el of nbAll.elements) importedNames.set(el.name.text, { exported: (el.propertyName ?? el.name).text, module: resolveSpec(absPath, spec) });
    }
    if (nbAll && ts.isNamespaceImport(nbAll)) importedNames.set(nbAll.name.text, { exported: '*', module: resolveSpec(absPath, spec) });
    const clause = st.importClause;
    const nb = clause?.namedBindings;
    if (spec === 'axios' || isApiModule(absPath, spec)) {
      if (clause?.name) clients.add(clause.name.text);
      if (nb && ts.isNamedImports(nb)) {
        for (const el of nb.elements) {
          const imported = (el.propertyName ?? el.name).text;
          if (imported === 'default' || (imported === 'api' && spec !== 'axios')) clients.add(el.name.text);
        }
      }
      if (nb && ts.isNamespaceImport(nb)) clientNamespaces.add(nb.name.text);
    }
    if (nb && ts.isNamedImports(nb)) {
      for (const el of nb.elements) if (QUERY_HOOKS.has((el.propertyName ?? el.name).text)) hooks.add(el.name.text);
    }
    if (nb && ts.isNamespaceImport(nb) && /(^|\/)use-api-query$/.test(spec)) hookNamespaces.add(nb.name.text);
  }

  /** A path given as an absolute URL: app hosts are inventoried, approved external hosts skipped, anything else fails. */
  const addUrlOrPath = (n: ts.Node, raw: string | null, what: string) => {
    if (raw !== null && /^\/[\\/]/.test(raw)) { problems.push(`${loc(n)} ${what}: protocol-relative URL (another origin)`); return; }
    if (raw !== null && /^[a-z][a-z0-9+.-]*:/i.test(raw)) {
      let origin: string | null = null;
      try { const u = new URL(raw.replace(/\$\{\}/g, 'x')); origin = `${u.protocol}//${u.host}`; } catch { /* unparseable */ }
      if (origin && APP_ORIGINS.has(origin) && raw.toLowerCase().startsWith(origin)) add(n, raw.slice(origin.length) || '/', what);
      else if (origin && APPROVED_EXTERNAL_ORIGINS.has(origin)) { /* approved external origin (exact scheme, host and port) */ }
      else problems.push(`${loc(n)} ${what}: absolute URL to an unapproved origin`);
      return;
    }
    add(n, raw, what);
  };

  /** Is this callee one of READ_ONLY_ERROR_CONSUMERS by import identity (or the global Promise.reject)? */
  const isReadOnlyConsumer = (callee: ts.Expression): boolean => {
    if (ts.isPropertyAccessExpression(callee)) {
      return callee.name.text === 'reject' && ts.isIdentifier(callee.expression) && callee.expression.text === 'Promise'
        && nearestBinding(callee.expression) === null && !importedNames.has('Promise');
    }
    if (!ts.isIdentifier(callee) || nearestBinding(callee) !== null) return false; // locally declared: not the import
    const imp = importedNames.get(callee.text);
    const expectedModule = imp ? READ_ONLY_ERROR_CONSUMERS.get(imp.exported) : undefined;
    return !!imp && !!expectedModule && imp.module === expectedModule;
  };

  /** Is this exactly the token-refresh retry call (see RETRY)? */
  const isTheRetry = (call: ts.CallExpression, clientName: string): boolean => {
    const arg = call.arguments[0];
    if (file !== RETRY.file || call.arguments.length !== 1 || !arg || !ts.isIdentifier(arg) || arg.text !== RETRY.argument) return false;
    const fn = enclosingFunction(call);
    if (!fn || !(ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))) return false;
    const use = fn.parent;
    if (!(ts.isCallExpression(use) && use.arguments[1] === fn && use.expression.getText(sf) === `${clientName}.interceptors.response.use`)) return false;
    const errorParam = fn.parameters[0];
    const b = nearestBinding(arg);
    if (!b || !ts.isVariableDeclaration(b) || enclosingFunction(b) !== fn || !b.initializer || !errorParam) return false;
    if (!ts.isVariableDeclarationList(b.parent) || !(b.parent.flags & ts.NodeFlags.Const)) return false;
    // The initializer is exactly `<error>.config`, where <error> resolves to the handler's own parameter.
    const init = b.initializer;
    if (!(ts.isPropertyAccessExpression(init) && init.name.text === 'config' && ts.isIdentifier(init.expression)
      && nearestBinding(init.expression) === errorParam)) return false;
    // Every other use of originalRequest must leave its URL/config intact.
    for (const ref of referencesTo(fn, b, RETRY.argument)) {
      if (ref === arg) continue;
      let top: ts.Expression = ref;
      const path: string[] = [];
      while ((ts.isPropertyAccessExpression(top.parent) || ts.isElementAccessExpression(top.parent)) && top.parent.expression === top) {
        const pa = top.parent;
        path.push(ts.isPropertyAccessExpression(pa) ? pa.name.text
          : ts.isStringLiteralLike(pa.argumentExpression) ? pa.argumentExpression.text : '<computed>');
        top = pa;
      }
      if (path.length) {
        if (isWriteTarget(top)) {
          const allowedWrite = (path[0] === '_retry' && path.length === 1) || (path[0] === 'headers' && path.length >= 2 && !path.includes('<computed>'));
          if (!allowedWrite) return false;
        } else if (!(path.length === 1 && RETRY_READABLE.has(path[0]))) {
          return false; // e.g. `const p = originalRequest.params`: a nested object escaping as a value
        }
        continue;
      }
      // A bare reference is allowed only as a truth test: climb through &&, ||, ! and parentheses;
      // the chain must end as the test of an if / while / ternary (so its value can never be captured).
      let top2: ts.Node = ref;
      while ((ts.isBinaryExpression(top2.parent) && (top2.parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
          || top2.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken))
        || (ts.isPrefixUnaryExpression(top2.parent) && top2.parent.operator === ts.SyntaxKind.ExclamationToken)
        || ts.isParenthesizedExpression(top2.parent)) top2 = top2.parent;
      const tp = top2.parent;
      const condition = (ts.isIfStatement(tp) && tp.expression === top2) || (ts.isWhileStatement(tp) && tp.expression === top2)
        || (ts.isConditionalExpression(tp) && tp.condition === top2)
        || (ts.isPrefixUnaryExpression(top2) && top2.operator === ts.SyntaxKind.ExclamationToken && top2 !== ref && !ts.isBinaryExpression(tp));
      if (!condition) return false; // aliased, passed to another function, reassigned, …
    }
    // error.config is the same object as originalRequest: protect it through `error` too.
    const errorName = ts.isIdentifier(errorParam.name) ? errorParam.name.text : null;
    if (errorName === null) return false;
    for (const ref of referencesTo(fn, errorParam, errorName)) {
      if (ref === init.expression) continue; // the approved `const originalRequest = error.config`
      let eff: ts.Expression = ref; // look through `(error as X)`, `error!`, `(error)`
      while (ts.isAsExpression(eff.parent) || ts.isParenthesizedExpression(eff.parent) || ts.isNonNullExpression(eff.parent)
        || ts.isSatisfiesExpression(eff.parent) || ts.isTypeAssertionExpression(eff.parent)) eff = eff.parent;
      let top: ts.Expression = eff;
      const path: string[] = [];
      while ((ts.isPropertyAccessExpression(top.parent) || ts.isElementAccessExpression(top.parent)) && top.parent.expression === top) {
        const pa = top.parent;
        path.push(ts.isPropertyAccessExpression(pa) ? pa.name.text
          : ts.isStringLiteralLike(pa.argumentExpression) ? pa.argumentExpression.text : '<computed>');
        top = pa;
      }
      if (path.length) {
        // Allow-list: reads of response.status / response.data; writes to userMessage / isNetworkError. Everything
        // else (error.config other than the initializer, error.response.config, computed members, other fields) fails.
        if (isWriteTarget(top)) {
          if (!(path.length === 1 && ERROR_WRITABLE.has(path[0]))) return false;
        } else if (!ERROR_READABLE.has(path.join('.'))) {
          return false;
        }
        continue;
      }
      if (isWriteTarget(eff)) return false;                    // error = …
      const q = eff.parent;
      if (ts.isCallExpression(q) && q.arguments.some((a) => a === eff) && isReadOnlyConsumer(q.expression)) continue;
      return false;                                            // aliased, destructured, spread, passed elsewhere
    }
    return true;
  };
  /** Is this exactly the hook forwarder call (see FORWARD)? */
  const isTheForward = (member: string, arg: ts.Expression | undefined): boolean => {
    if (file !== FORWARD.file || member !== FORWARD.method || !arg || !ts.isIdentifier(arg) || arg.text !== FORWARD.argument) return false;
    const b = nearestBinding(arg);
    if (!b || !ts.isParameter(b)) return false;
    const fn = b.parent;
    if (!(ts.isFunctionDeclaration(fn) && !!fn.name && QUERY_HOOKS.has(fn.name.text) && fn.parameters[0] === b && ts.isSourceFile(fn.parent))) return false;
    // `endpoint` must still be the caller's value: never assigned anywhere in the hook.
    return !referencesTo(fn, b, FORWARD.argument).some((ref) => isWriteTarget(ref));
  };

  const checkClientUse = (ref: ts.Expression, name: string) => {
    const parent = ref.parent;
    if (ts.isExportAssignment(parent) && file === RETRY.file) return; // lib/api.ts exports the client it created: importers are tracked
    // client(config)
    if (ts.isCallExpression(parent) && parent.expression === ref) {
      const url = configUrl(parent.arguments[0]);
      if (url === null && isTheRetry(parent, name)) return; // the token-refresh retry (exact call site)
      addUrlOrPath(parent, url, `${name}(config)`);
      return;
    }
    let member: string | null = null;
    if (ts.isPropertyAccessExpression(parent) && parent.expression === ref) member = parent.name.text;
    else if (ts.isElementAccessExpression(parent) && parent.expression === ref) {
      member = ts.isStringLiteralLike(parent.argumentExpression) ? parent.argumentExpression.text : null;
    } else {
      problems.push(`${loc(ref)} ${name} used as a value (alias, destructuring or argument): its requests cannot be inventoried`);
      return;
    }
    if (member === null) { problems.push(`${loc(ref)} ${name}[computed]: request method not statically known`); return; }
    if (NON_REQUEST_MEMBERS.has(member)) return;
    const call = parent.parent;
    const called = ts.isCallExpression(call) && call.expression === parent;
    if (member === 'create' && called) {
      const decl = call.parent;
      if (ts.isVariableDeclaration(decl) && decl.initializer === call && ts.isIdentifier(decl.name)) clients.add(decl.name.text); // track the new client
      else problems.push(`${loc(ref)} ${name}.create(): the new client must be bound to a plain variable so its requests are inventoried`);
    } else if (PATH_METHODS.has(member) && called) {
      const a = call.arguments[0];
      if (isTheForward(member, a)) return; // the hook forwarder (exact call site)
      addUrlOrPath(call, a ? literalText(a) : null, `${name}.${member}`);
    } else if (member === 'request' && called) {
      addUrlOrPath(call, configUrl(call.arguments[0]), `${name}.request`);
    } else {
      problems.push(`${loc(ref)} ${name}.${member}: not a recognised request form or non-request member`);
    }
  };

  const visit = (n: ts.Node): void => {
    if (ts.isIdentifier(n) && !insideImport(n) && isValueReference(n) && !isShadowed(n)) {
      const p = n.parent;
      if (clients.has(n.text)) checkClientUse(n, n.text);
      if (clientNamespaces.has(n.text)) {
        if (ts.isPropertyAccessExpression(p) && p.expression === n && (p.name.text === 'default' || p.name.text === 'api')) checkClientUse(p, `${n.text}.${p.name.text}`);
        else if (ts.isPropertyAccessExpression(p) && p.expression === n) problems.push(`${loc(n)} ${n.text}.${p.name.text}: unknown member of the API module`);
        else problems.push(`${loc(n)} API module namespace used as a value`);
      }
      const hookCall = (callee: ts.Expression, label: string) => {
        const call = callee.parent;
        if (!(ts.isCallExpression(call) && call.expression === callee)) {
          problems.push(`${loc(callee)} ${label} used as a value: its endpoint cannot be inventoried`);
          return;
        }
        const a = call.arguments[0];
        const ep = a && ts.isObjectLiteralExpression(a)
          ? a.properties.find((q): q is ts.PropertyAssignment => ts.isPropertyAssignment(q) && ts.isIdentifier(q.name) && q.name.text === 'endpoint')
          : undefined;
        add(call, ep ? literalText(ep.initializer) : null, `${label} endpoint`);
      };
      if (hooks.has(n.text)) hookCall(n, n.text);
      if (hookNamespaces.has(n.text)) {
        if (ts.isPropertyAccessExpression(p) && p.expression === n) {
          if (QUERY_HOOKS.has(p.name.text)) hookCall(p, `${n.text}.${p.name.text}`);
          else problems.push(`${loc(n)} ${n.text}.${p.name.text}: unknown member of the query-hook module`);
        } else problems.push(`${loc(n)} query-hook module namespace used as a value`);
      }
      // fetch: only a direct call is allowed; any other reference (alias, argument) fails.
      if (n.text === 'fetch') {
        if (ts.isCallExpression(p) && p.expression === n) {
          const a = p.arguments[0];
          addUrlOrPath(p, a ? literalText(a) : null, 'fetch');
        } else problems.push(`${loc(n)} fetch referenced as a value: its requests cannot be inventoried`);
      }
      // Unsupported mechanisms: any reference at all (constructor, alias, argument) fails.
      if (UNSUPPORTED_MECHANISMS.has(n.text)) problems.push(`${loc(n)} ${n.text}: unsupported request mechanism`);
      if (BANNED_GLOBALS.has(n.text)) problems.push(`${loc(n)} ${n.text}: not allowed (requests could be built or loaded invisibly)`);
      // Global objects: only as a member base, a typeof operand, or the right side of `in`.
      if (GLOBAL_OBJECTS.has(n.text)) {
        const memberBase = (ts.isPropertyAccessExpression(p) || ts.isElementAccessExpression(p)) && p.expression === n;
        const typeofOperand = ts.isTypeOfExpression(p);
        const inRight = ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.InKeyword && p.right === n;
        if (!memberBase && !typeofOperand && !inRight) problems.push(`${loc(n)} ${n.text} used as a value (alias, destructuring or argument)`);
      }
    }
    // Destructuring a request mechanism out of any object (`const { fetch: send } = x`).
    if (ts.isBindingElement(n)) {
      const key = n.propertyName ?? (ts.isIdentifier(n.name) ? n.name : undefined);
      const keyText = key && (ts.isIdentifier(key) || ts.isStringLiteralLike(key)) ? key.text : null;
      if (keyText !== null && REQUEST_NAMES.has(keyText)) problems.push(`${loc(n)} destructures ${keyText}: would alias a request mechanism`);
      if (key && ts.isComputedPropertyName(key)) problems.push(`${loc(n)} computed destructuring key: a request mechanism cannot be ruled out`);
    }
    // Dynamic loading and re-export of request-making modules.
    if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const a = n.arguments[0];
      const spec = a && ts.isStringLiteralLike(a) ? a.text : null;
      if (spec === null) problems.push(`${loc(n)} import() with a non-literal module: request-making modules cannot be ruled out`);
      else if (isClientModule(absPath, spec)) problems.push(`${loc(n)} dynamic import of ${spec}: its requests cannot be inventoried`);
    }
    if (ts.isExportDeclaration(n) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier) && isClientModule(absPath, n.moduleSpecifier.text)) {
      problems.push(`${loc(n)} re-export of ${n.moduleSpecifier.text}: importers of this module would not be tracked`);
    }
    // Member forms: window.fetch / globalThis.fetch / self.fetch, and any .XMLHttpRequest / .EventSource / .sendBeacon.
    if (ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n)) {
      const member = ts.isPropertyAccessExpression(n) ? n.name.text
        : ts.isStringLiteralLike(n.argumentExpression) ? n.argumentExpression.text : null;
      const onGlobal = ts.isIdentifier(n.expression) && GLOBAL_OBJECTS.has(n.expression.text) && !isShadowed(n.expression);
      if (member !== null && UNSUPPORTED_MECHANISMS.has(member)) problems.push(`${loc(n)} ${member}: unsupported request mechanism`);
      if (member !== null && BANNED_GLOBALS.has(member)) problems.push(`${loc(n)} .${member}: not allowed (requests could be built or loaded invisibly)`);
      if (member === 'fetch' && onGlobal) {
        const call = n.parent;
        if (ts.isCallExpression(call) && call.expression === n) {
          const a = call.arguments[0];
          addUrlOrPath(call, a ? literalText(a) : null, 'fetch');
        } else problems.push(`${loc(n)} ${n.getText(sf)} referenced as a value: its requests cannot be inventoried`);
      }
      if (member === 'fetch' && !onGlobal) problems.push(`${loc(n)} .fetch on a non-global object: cannot rule out an alias of fetch`);
      if (member === null && onGlobal) problems.push(`${loc(n)} computed member of ${n.expression.getText(sf)}: request mechanism cannot be ruled out`);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);

  for (const m of text.matchAll(/<Route\b[^>]*?\bpath=["']([^"']*)["']/g)) {
    if (m[1] === '*') continue;
    const t = templateOf(m[1]);
    if (t === null) problems.push(`${file} <Route path="${m[1]}">: not an absolute plain route`);
    else page.add(t);
  }
  return { api, page, problems };
}

function inventory(): Inventory {
  const all: Inventory = { api: new Set(), page: new Set(), problems: [] };
  for (const f of files) {
    const r = inventoryOf(rel(f), f, read(f));
    r.api.forEach((t) => all.api.add(t));
    r.page.forEach((t) => all.page.add(t));
    all.problems.push(...r.problems);
  }
  return all;
}

function renderTemplatesFile(api: Set<string>, page: Set<string>): string {
  const list = (s: Set<string>) => [...s].sort().map((t) => `  '${t}',`).join('\n');
  return `/**
 * GENERATED by telemetry-guard.test.ts (UPDATE_ROUTE_TEMPLATES=1). Do not edit by hand.
 *
 * The app's own route templates. A runtime path leaves the app only as one of these templates
 * (static words from the template, ':param' at every parameter position, whatever the runtime
 * value); a path matching none of them is sent as '/:unmatched'.
 *
 * PAGE_ROUTE_TEMPLATES: the <Route path> declarations. Page URLs are matched as React Router
 * matches them (a static segment beats a parameter): /events/create is the create-event page
 * and is never the event ':param' = "create".
 *
 * API_ROUTE_TEMPLATES: the paths of the app's actual API requests (api.get/post/put/patch/delete,
 * axios, fetch of '/…' paths, and useApiQuery endpoints), taken from the source with the
 * TypeScript parser. API paths are matched STRICTLY: where matching templates disagree on whether a
 * position is static, it is ':param'; a path matching no API template is '/:unmatched'.
 */
export const PAGE_ROUTE_TEMPLATES: readonly string[] = [
${list(page)}
];

export const API_ROUTE_TEMPLATES: readonly string[] = [
${list(api)}
];
`;
}

describe('telemetry guards', () => {
  it('finds the source tree', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it('only shared/config/sentry.ts imports the Sentry SDK', () => {
    const offenders = files.filter((f) => rel(f) !== SENTRY_CONFIG && /from ['"]@sentry\/(react|browser)['"]/.test(read(f)));
    expect(offenders.map(rel)).toEqual([]);
  });

  it('only reportError() calls captureException', () => {
    const offenders = files.filter((f) => rel(f) !== SENTRY_CONFIG && /\bcaptureException\b/.test(read(f)));
    expect(offenders.map(rel)).toEqual([]);
    const own = read(path.join(SRC, SENTRY_CONFIG)).match(/\bcaptureException\s*\(/g) ?? [];
    expect(own.length).toBe(1);
  });

  it('Session Replay and console capture are not configured anywhere', () => {
    const banned = /replayIntegration|replaysOnErrorSampleRate|replaysSessionSampleRate|captureConsoleIntegration|replayCanvasIntegration/;
    expect(files.filter((f) => banned.test(read(f))).map(rel)).toEqual([]);
  });

  it('every logger use in the app is a direct method call, and error/warn start with a constant string', () => {
    const offenders = files.filter((f) => rel(f) !== LOGGER_MODULE).flatMap((f) => loggerOffenders(rel(f), read(f)));
    expect(offenders).toEqual([]);
  }, SOURCE_SCAN_TIMEOUT_MS);

  it('the logger check itself catches every known bypass', () => {
    const imp = "import { logger } from '@/shared/utils/logger';\n";
    const bad: Record<string, string> = {
      aliasedImport: "import { logger as log } from '@/shared/utils/logger';\nlog.error(`Failed ${x}`, e);",
      defaultImport: "import l from './logger';\nl.warn(message);",
      bracket: `${imp}logger['error'](\`id \${id}\`);`,
      computed: `${imp}const k = 'error'; logger[k]('x');`,
      methodReference: `${imp}const e = logger.error; e(\`x \${y}\`);`,
      localAlias: `${imp}const log = logger;\nlog.error(password);`,
      destructuring: `${imp}const { error } = logger;\nerror(password);`,
      passedOn: `${imp}register(logger);`,
      callApply: `${imp}logger.error.call(null, password);`,
      namespace: "import * as L from '@/shared/utils/logger';\nL.logger.error(String(p));",
      namespaceAsValue: "import * as L from '@/shared/utils/logger';\nconst x = L;",
    };
    for (const [name, code] of Object.entries(bad)) expect(loggerOffenders(`${name}.ts`, code), name).not.toEqual([]);
    expect(loggerOffenders('ok.ts', "import { logger as log } from './logger';\nlog.error('Constant message', err);\nlog.info(`dev ${x}`);")).toEqual([]);
    // A local parameter or variable that merely shares the name is not the imported logger...
    expect(loggerOffenders('shadow.ts', `${imp}function add(logger: Fn) { list.push(logger); }\nlist.forEach((logger) => logger(d));`)).toEqual([]);
    // ...but the import used as a value next to it still is.
    expect(loggerOffenders('mixed.ts', `${imp}function add(logger: Fn) { list.push(logger); }\nconst log = logger;`)).not.toEqual([]);
  });

  it('the API inventory itself rejects or detects every known bypass', () => {
    const at = (code: string, file = 'features/x/fixture.ts') => inventoryOf(file, path.join(SRC, file), code);
    const bad: Record<string, string> = {
      defaultImportRenamed: "import client from '@/lib/api';\nclient.get('/reports/' + reportId);",
      namedDefaultRenamed: "import { default as client } from '@/lib/api';\nclient.get('/reports/' + id);",
      relativeImport: "import http from '../../lib/api';\nhttp.post(path);",
      requestMethod: "import api from '@/lib/api';\napi.request({ method: 'GET', url: '/reports/' + reportId });",
      callable: "import api from '@/lib/api';\napi({ url: someUrl });",
      computedMethod: "import api from '@/lib/api';\napi[method]('/reports');",
      aliasedAfterImport: "import api from '@/lib/api';\nconst c = api;\nc.get('/reports/' + id);",
      destructured: "import api from '@/lib/api';\nconst { get } = api;\nget('/x');",
      passedOn: "import api from '@/lib/api';\nuseThing(api);",
      unknownMember: "import api from '@/lib/api';\napi.postSomething('/x');",
      axiosRenamed: "import http from 'axios';\nhttp.get(`/reports/${id}` + suffix);",
      namespace: "import * as A from '@/lib/api';\nA.default.get(url);",
      relativeFetch: "fetch('api/reports');",
      variableFetch: 'fetch(url);',
      windowFetch: 'window.fetch(target);',
      xhr: 'const x = new XMLHttpRequest();',
      beacon: "navigator.sendBeacon('/api/log', data);",
      eventSource: "new EventSource('/api/stream');",
      queryHookRenamed: "import { useApiQuery as q } from '@/shared/hooks/use-api-query';\nq({ endpoint: base + '/x' });",
      // v6: aliased fetch
      fetchAlias: 'const send = fetch;\nsend(url);',
      windowFetchAlias: 'const send = window.fetch;\nsend(url);',
      fetchBracket: "window['fetch'](url);",
      fetchAsArgument: 'retry(fetch, url);',
      fetchBound: 'const f = globalThis.fetch.bind(globalThis);',
      // v6: clients from axios.create()
      createdClient: "import axios from 'axios';\nconst client = axios.create();\nclient.get('/orders/' + id);",
      createdUnbound: "import axios from 'axios';\nregister(axios.create());",
      createdRenamedAxios: "import http from 'axios';\nconst c = http.create({ baseURL: '/api' });\nc.post(path);",
      // v6: query hook aliased after import
      hookAlias: "import { useApiQuery } from '@/shared/hooks/use-api-query';\nconst query = useApiQuery;\nquery({ endpoint: '/reports' });",
      hookNamespace: "import * as Q from '@/shared/hooks/use-api-query';\nconst h = Q.useApiQuery;",
      // v6: aliased unsupported mechanisms
      xhrAlias: 'const XHR = XMLHttpRequest;\nnew XHR();',
      eventSourceAlias: "const Stream = EventSource;\nnew Stream('/updates');",
      beaconAlias: "const beacon = navigator.sendBeacon;\nbeacon('/telemetry', data);",
      windowXhr: 'new window.XMLHttpRequest();',
      computedGlobal: 'window[name](url);',
      // v6: absolute URLs
      unapprovedHost: "fetch('https://evil.example/collect');",
      unapprovedHostClient: "import api from '@/lib/api';\napi.get('https://tracker.example/x');",
      appHostDynamic: "fetch('https://iluase.com/api/reports/' + id);",
      // v7: destructuring and global-object aliases
      destructFetch: "const { fetch: send } = window;\nsend('/api/reports');",
      destructXhr: 'const { XMLHttpRequest: XHR } = window;\nnew XHR();',
      destructBeacon: "const { sendBeacon: beacon } = navigator;\nbeacon('/telemetry', data);",
      destructFromLocal: 'const nav = window.navigator;\nconst { sendBeacon } = nav;',
      destructComputedKey: 'const { [key]: f } = window;',
      globalAlias: "const browser = window;\nbrowser.fetch('/api/reports');",
      globalThisArgument: 'register(globalThis);',
      selfAlias: 'const g = self;',
      fetchOnLocal: 'const w = getWindow();\nw.fetch(url);',
      // v7: dynamic import / require / re-export
      dynamicImportApi: "const module = await import('@/lib/api');\nconst client = module.default;\nclient.get('/reports/' + id);",
      dynamicImportAxios: "const { default: ax } = await import('axios');",
      dynamicImportHook: "const m = await import('../../shared/hooks/use-api-query');",
      dynamicImportComputed: 'const m = await import(modulePath);',
      requireApi: "const client = require('@/lib/api').default;",
      reexportApi: "export { default as client } from '@/lib/api';",
      reexportStar: "export * from '../../lib/api';",
      reexportImportedDefault: "import api from '@/lib/api';\nexport default api;",
      reexportImportedNamed: "import api from '@/lib/api';\nexport { api };",
      evalUse: 'eval(code);',
      functionConstructor: "new Function('return fetch')();",
      // v7: exact origins (scheme, host, port) and inherited names
      httpOnAppHost: "fetch('http://iluase.com/api/x');",
      portOnAppHost: "fetch('https://iluase.com:8443/api/x');",
      httpOnApprovedHost: "fetch('http://api.example.com/x');",
      portOnApprovedHost: "fetch('https://api.example.com:444/x');",
      inheritedNameConstructor: "fetch('https://constructor/x');",
      inheritedNameToString: "fetch('https://tostring/x');",
      protocolRelative: "fetch('//evil.example/x');",
      // v7: unknown namespace members
      apiNamespaceUnknown: "import * as A from '@/lib/api';\nA.something.get('/x');",
      hookNamespaceUnknown: "import * as Q from '@/shared/hooks/use-api-query';\nQ.helper();",
      // v8: eval / Function / require reached as members
      windowEval: 'window.eval(code);',
      globalThisEval: 'globalThis.eval(code);',
      windowFunction: "window.Function('return fetch')();",
      computedFunction: "globalThis['Function']('return fetch')();",
      selfRequire: "self.require('@/lib/api');",
      // v8: protocol-relative URLs
      protocolRelativeBare: "fetch('//evil/x');",
      protocolRelativeBackslash: "fetch('/\\\\evil/x');",
      protocolRelativeClient: "import api from '@/lib/api';\napi.get('//evil/x');",
    };
    for (const [name, code] of Object.entries(bad)) expect(at(code).problems, name).not.toEqual([]);
    // v7: the retry and forwarder exemptions cover only their exact call; anything else in those files fails.
    const retryFile = 'lib/api.ts';
    const created = "import axios from 'axios';\nimport { setServerUnreachable, isUnreachableError } from '@/shared/utils/server-reachability';\n"
      + "import { parseApiError, reportApiError } from '@/shared/utils/api-error';\nconst api = axios.create({ baseURL: '/api' });\n";
    const retry = 'api.interceptors.response.use((r) => r, async (error) => {\n  const body = error.response?.data;\n  const originalRequest = error.config;\n'
      + '  setServerUnreachable(isUnreachableError(error));\n'
      + '  if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {\n    originalRequest._retry = true;\n'
      + '    originalRequest.headers.Authorization = `Bearer ${token}`;\n    return api(originalRequest);\n  }\n'
      + '  const status = error.response?.status ?? 0;\n'
      + '  const parsed = parseApiError(error);\n  (error as E).userMessage = parsed.userMessage;\n  (error as E).isNetworkError = parsed.isNetworkError;\n'
      + '  reportApiError(error, { endpoint: originalRequest?.url });\n  return Promise.reject(error);\n});';
    expect(at(`${created}export default api;\n${retry}`, retryFile).problems).toEqual([]);
    const notTheRetry: Record<string, string> = {
      otherConfig: 'api({ url: someVar });',
      otherArgument: 'api(otherConfig);',
      dynamicGet: 'api.get(path);',
      dynamicRequest: "api.request({ url: '/x/' + id });",
      sameNameUnrelatedFunction: 'async function unrelated(originalRequest) { return api(originalRequest); }',
      requestInterceptor: 'api.interceptors.request.use(async (error) => { const originalRequest = error.config; return api(originalRequest); });',
      notFromErrorConfig: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = build(error); return api(originalRequest); });',
      nestedFunction: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; const go = (originalRequest) => api(originalRequest); return go(x); });',
      // v9: loop- and declaration-scoped shadowing of the approved binding
      forOfShadow: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; for (const originalRequest of retryCandidates) { return api(originalRequest); } });',
      forInShadow: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; for (const originalRequest in table) { return api(originalRequest); } });',
      forShadow: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; for (let originalRequest = next(); originalRequest; ) { return api(originalRequest); } });',
      blockFunctionShadow: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; { function originalRequest() {} return api(originalRequest); } });',
      // v10: `error` must be the handler's parameter, and the config must not be re-pointed
      forgedError: 'api.interceptors.response.use((r) => r, async (error) => { { const error = forged(); const originalRequest = error.config; return api(originalRequest); } });',
      letReassigned: 'api.interceptors.response.use((r) => r, async (error) => { let originalRequest = error.config; originalRequest = other; return api(originalRequest); });',
      urlMutation: "api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; originalRequest.url = '/x/' + id; return api(originalRequest); });",
      bracketUrlMutation: "api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; originalRequest['url'] = path; return api(originalRequest); });",
      paramsMutation: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; originalRequest.params = p; return api(originalRequest); });',
      baseUrlMutation: "api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; originalRequest.baseURL += '/x'; return api(originalRequest); });",
      deleteMember: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; delete originalRequest.url; return api(originalRequest); });',
      objectAssign: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; Object.assign(originalRequest, { url: x }); return api(originalRequest); });',
      aliasMutation: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; const r2 = originalRequest; r2.url = x; return api(originalRequest); });',
      computedHeaderWrite: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; originalRequest.headers[k] = v; return api(originalRequest); });',
      aliasThroughLogical: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; const r2 = ok && originalRequest; r2.url = x; return api(originalRequest); });',
      passedToFunction: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; rewrite(originalRequest); return api(originalRequest); });',
      // v11: error.config is the same object as originalRequest; it must not be changed through `error` either
      configMutatedBefore: 'api.interceptors.response.use((r) => r, async (error) => { error.config.url = buildDynamicPath(); const originalRequest = error.config; return api(originalRequest); });',
      configMutatedAfter: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; error.config.url = x; return api(originalRequest); });',
      configReplaced: 'api.interceptors.response.use((r) => r, async (error) => { error.config = forged; const originalRequest = error.config; return api(originalRequest); });',
      configBracketWrite: "api.interceptors.response.use((r) => r, async (error) => { error['config'].url = x; const originalRequest = error.config; return api(originalRequest); });",
      configCastWrite: 'api.interceptors.response.use((r) => r, async (error) => { (error as E).config.params = p; const originalRequest = error.config; return api(originalRequest); });',
      configDeleteMember: 'api.interceptors.response.use((r) => r, async (error) => { delete error.config.baseURL; const originalRequest = error.config; return api(originalRequest); });',
      configAliased: 'api.interceptors.response.use((r) => r, async (error) => { const c = error.config; c.url = x; const originalRequest = error.config; return api(originalRequest); });',
      configPassedOn: 'api.interceptors.response.use((r) => r, async (error) => { rewrite(error.config); const originalRequest = error.config; return api(originalRequest); });',
      configDestructured: 'api.interceptors.response.use((r) => r, async (error) => { const { config } = error; config.url = x; const originalRequest = error.config; return api(originalRequest); });',
      errorPassedToUnknown: 'api.interceptors.response.use((r) => r, async (error) => { mutate(error); const originalRequest = error.config; return api(originalRequest); });',
      errorObjectAssign: 'api.interceptors.response.use((r) => r, async (error) => { Object.assign(error, { config: forged }); const originalRequest = error.config; return api(originalRequest); });',
      errorReassigned: 'api.interceptors.response.use((r) => r, async (error) => { error = forged; const originalRequest = error.config; return api(originalRequest); });',
      errorAliased: 'api.interceptors.response.use((r) => r, async (error) => { const e = error; e.config.url = x; const originalRequest = error.config; return api(originalRequest); });',
      errorComputedMember: 'api.interceptors.response.use((r) => r, async (error) => { error[k].url = x; const originalRequest = error.config; return api(originalRequest); });',
      // v12: nested objects must not escape from error.config or originalRequest
      nestedConfigParams: 'api.interceptors.response.use((r) => r, async (error) => { const params = error.config.params; params.token = buildDynamicToken(); const originalRequest = error.config; return api(originalRequest); });',
      nestedConfigRead: 'api.interceptors.response.use((r) => r, async (error) => { log(error.config.url); const originalRequest = error.config; return api(originalRequest); });',
      nestedConfigReceiver: "api.interceptors.response.use((r) => r, async (error) => { error.config.headers.set('X', v); const originalRequest = error.config; return api(originalRequest); });",
      originalRequestParamsEscape: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; const p = originalRequest.params; p.token = x; return api(originalRequest); });',
      originalRequestHeadersEscape: 'api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; const h = originalRequest.headers; rewrite(h); return api(originalRequest); });',
      originalRequestMethodReceiver: "api.interceptors.response.use((r) => r, async (error) => { const originalRequest = error.config; originalRequest.params.append('t', x); return api(originalRequest); });",
      // v12: permitted consumers are trusted by import identity, not by name
      shadowedConsumer: 'api.interceptors.response.use((r) => r, async (error) => { const isUnreachableError = (e) => { e.config.url = x; return false; }; isUnreachableError(error); const originalRequest = error.config; return api(originalRequest); });',
      shadowedConsumerFunction: 'api.interceptors.response.use((r) => r, async (error) => { { function parseApiError(e) { e.config.url = x; } parseApiError(error); } const originalRequest = error.config; return api(originalRequest); });',
      shadowedPromise: 'api.interceptors.response.use((r) => r, async (error) => { const Promise = Evil; Promise.reject(error); const originalRequest = error.config; return api(originalRequest); });',
      // v13: error.response.config is the same object as error.config; only response.status / response.data are usable
      responseConfigWrite: 'api.interceptors.response.use((r) => r, async (error) => { error.response.config.url = buildDynamicPath(); const originalRequest = error.config; return api(originalRequest); });',
      responseConfigOptionalWrite: 'api.interceptors.response.use((r) => r, async (error) => { Object.assign(error.response?.config, { url: x }); const originalRequest = error.config; return api(originalRequest); });',
      responseConfigBracket: "api.interceptors.response.use((r) => r, async (error) => { error['response']['config'].url = x; const originalRequest = error.config; return api(originalRequest); });",
      responseConfigAlias: 'api.interceptors.response.use((r) => r, async (error) => { const rc = error.response.config; rc.url = x; const originalRequest = error.config; return api(originalRequest); });',
      responseAliasNested: 'api.interceptors.response.use((r) => r, async (error) => { const resp = error.response; resp.config.url = x; const originalRequest = error.config; return api(originalRequest); });',
      responseDestructured: 'api.interceptors.response.use((r) => r, async (error) => { const { config } = error.response; config.params = p; const originalRequest = error.config; return api(originalRequest); });',
      responseRequestRef: 'api.interceptors.response.use((r) => r, async (error) => { const req = error.response.request; mutate(req); const originalRequest = error.config; return api(originalRequest); });',
      responseDataReplaced: 'api.interceptors.response.use((r) => r, async (error) => { error.response.data = error.config; const originalRequest = error.config; return api(originalRequest); });',
      responseDataNestedRead: 'api.interceptors.response.use((r) => r, async (error) => { use(error.response.data.config); const originalRequest = error.config; return api(originalRequest); });',
      otherErrorFieldWrite: 'api.interceptors.response.use((r) => r, async (error) => { error.request = forged; const originalRequest = error.config; return api(originalRequest); });',
    };
    // Each must fail because the request itself was refused the exemption (not for an unrelated reason).
    const refused = (problems: string[]) => problems.some((x) => /\bapi(\.(get|post|request))?\(config\)|\bapi\.(get|post|request)\b/.test(x));
    for (const [label, code] of Object.entries(notTheRetry)) expect(refused(at(created + code, retryFile).problems), `retry file: ${label}`).toBe(true);
    const handlerUsing = (consumerCall: string) => `api.interceptors.response.use((r) => r, async (error) => { ${consumerCall}; const originalRequest = error.config; return api(originalRequest); });`;
    const bareClient = "import axios from 'axios';\nconst api = axios.create({ baseURL: '/api' });\n";
    expect(refused(at(bareClient + handlerUsing('isUnreachableError(error)'), retryFile).problems), 'consumer not imported').toBe(true);
    expect(refused(at(`${bareClient}import { isUnreachableError } from './evil-module';\n${handlerUsing('isUnreachableError(error)')}`, retryFile).problems), 'consumer imported from another module').toBe(true);
    expect(refused(at(`${bareClient}import { mutateConfig as isUnreachableError } from '@/shared/utils/server-reachability';\n${handlerUsing('isUnreachableError(error)')}`, retryFile).problems), 'other export aliased to the trusted name').toBe(true);
    expect(at(`${bareClient}import { isUnreachableError as reach } from '@/shared/utils/server-reachability';\n${handlerUsing('reach(error)')}`, retryFile).problems, 'the real export under an alias is still trusted').toEqual([]);
    const forwardFile = 'shared/hooks/use-api-query.ts';
    const imp = "import api from '@/lib/api';\n";
    expect(at(`${imp}export function useApiQuery({ endpoint, params }) { if (!ok) throw new Error(\`API failed: \${endpoint}\`); return async () => api.get(endpoint, { params }); }`, forwardFile).problems).toEqual([]);
    const notTheForward: Record<string, string> = {
      otherMethod: 'export function useApiQuery({ endpoint }) { return api.post(endpoint); }',
      otherArgument: 'export function useApiQuery({ endpoint }) { return api.get(otherPath); }',
      concatenated: 'export function useApiQuery({ endpoint }) { return api.get(endpoint + suffix); }',
      sameNameUnrelatedFunction: 'export function fetchReport({ endpoint }) { return api.get(endpoint); }',
      topLevelUnbound: 'api.get(endpoint, { params });',
      shadowedInside: 'export function useApiQuery({ endpoint }) { return () => { const endpoint = pick(); return api.get(endpoint); }; }',
      // v9: loop- and declaration-scoped shadowing of the approved binding
      forOfShadow: 'export function useApiQuery({ endpoint }) { for (const endpoint of incomingPaths) { return api.get(endpoint); } }',
      forInShadow: 'export function useApiQuery({ endpoint }) { for (const endpoint in table) { return api.get(endpoint); } }',
      forShadow: 'export function useApiQuery({ endpoint }) { for (let endpoint = first(); endpoint; ) { return api.get(endpoint); } }',
      catchShadow: 'export function useApiQuery({ endpoint }) { try { go(); } catch (endpoint) { return api.get(endpoint); } }',
      blockClassShadow: 'export function useApiQuery({ endpoint }) { { class endpoint {} return api.get(endpoint); } }',
      // v10: `endpoint` must never be assigned inside the hook
      reassigned: 'export function useApiQuery({ endpoint }) { endpoint = buildDynamicPath(); return api.get(endpoint); }',
      compoundAssigned: 'export function useApiQuery({ endpoint }) { endpoint += suffix; return api.get(endpoint); }',
      destructuringAssigned: 'export function useApiQuery({ endpoint }) { ({ endpoint } = other); return api.get(endpoint); }',
      arrayDestructuringAssigned: 'export function useApiQuery({ endpoint }) { [endpoint] = list; return api.get(endpoint); }',
      forOfTarget: 'export function useApiQuery({ endpoint }) { for (endpoint of list) {} return api.get(endpoint); }',
      assignedInNestedFunction: 'export function useApiQuery({ endpoint }) { const later = () => { endpoint = other; }; later(); return async () => api.get(endpoint); }',
    };
    for (const [label, code] of Object.entries(notTheForward)) expect(refused(at(imp + code, forwardFile).problems), `forwarder file: ${label}`).toBe(true);
    // v7: legitimate uses of globals stay allowed.
    expect(at("if (typeof window !== 'undefined' && 'serviceWorker' in navigator) { window.location.href = '/'; }\nconst ua = navigator.userAgent;").problems).toEqual([]);
    expect(at("import api from '@/lib/api';\nconst o = { api };").problems, 'shorthand property is a value use').not.toEqual([]);
    // Names that merely match the client are not uses of it.
    expect(at("import api from '@/lib/api';\ninterface H { api: 'ok' | 'down' }\nconst h = { api: 'ok' };\ntype T = typeof api;\nfunction f(api: string) { return api; }").problems).toEqual([]);
    // Recognised forms are inventoried as templates (whatever the import name).
    const ok = at([
      "import client from '@/lib/api';",
      "import http from 'axios';",
      "import { useApiQuery as q } from '@/shared/hooks/use-api-query';",
      'client.get(`/reports/${id}`);',
      "client.request({ url: '/reports/export', method: 'GET' });",
      "http.post('/api/auth/refresh', body);",
      "client.defaults.headers.common.x = 'y';",
      "fetch('/api/health'); fetch('https://api.example.com/nonexistent-endpoint');",
      "fetch(`https://iluase.com/api/users/${id}`);",
      "import ax from 'axios';",
      "const made = ax.create({ baseURL: '/api' });",
      "made.get('/orders/mine');",
      "q({ endpoint: '/circles' });",
    ].join('\n'));
    expect(ok.problems).toEqual([]);
    expect([...ok.api].sort()).toEqual(['/auth/refresh', '/circles', '/health', '/orders/mine', '/reports/:param', '/reports/export', '/users/:param']);
  });

  it('no app file imports the test-only src/test directory (excluded from the scan above)', () => {
    const offenders = files.filter((f) => {
      const sf = parse(rel(f), read(f));
      return sf.statements.some((st) => ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier)
        && (resolveSpec(f, st.moduleSpecifier.text) ?? '').startsWith(TEST_SUPPORT));
    });
    expect(offenders.map(rel)).toEqual([]);
  }, SOURCE_SCAN_TIMEOUT_MS);

  it('route templates are exactly the app routes and API request paths, and every API path is statically known', () => {
    const { api, page, problems } = inventory();
    if (process.env.UPDATE_ROUTE_TEMPLATES === '1') fs.writeFileSync(TEMPLATES_FILE, renderTemplatesFile(api, page));
    expect(problems).toEqual([]);
    expect([...PAGE_ROUTE_TEMPLATES].sort()).toEqual([...page].sort());
    expect([...API_ROUTE_TEMPLATES].sort()).toEqual([...api].sort());
  }, SOURCE_SCAN_TIMEOUT_MS);

  it('templates contain only plain route words and :param', () => {
    const shape = (t: string) => t.split('/').slice(1).filter(Boolean).every((s) => s === ':param' || /^[a-z][a-z0-9-]{0,40}$/.test(s));
    expect([...PAGE_ROUTE_TEMPLATES, ...API_ROUTE_TEMPLATES].filter((t) => !shape(t))).toEqual([]);
  });
});
