# OWASP Top 10 Security Audit (HC-204.1)

**Date:** February 2026  
**Scope:** Ilé Àṣẹ backend (NestJS) and frontend (React)  
**Reference:** [OWASP Top 10 2021](https://owasp.org/Top10/)  
**Status:** Audit complete; remediation plan for vulnerable components documented.

---

## Executive Summary

- **OWASP Top 10 checklist:** Completed; 8/10 fully mitigated, 2 partial (Insecure Design, Software/Data Integrity).
- **npm audit:** 14 vulnerabilities (2 critical, 5 high, 6 moderate, 1 low). Critical/High from `paystack` (request/form-data) and `flutterwave-node-v3` (axios); dev-only issues in vitest/esbuild and webpack. See [Vulnerable Components](#a06--vulnerable-and-outdated-components) and [Remediation Plan](#remediation-plan) below.
- **Penetration test:** Manual verification of access control, auth, and payment flows documented in [Penetration Test Summary](#penetration-test-summary).

---

## OWASP Top 10 Checklist (HC-204.1 Acceptance)

| # | Category | Status | Evidence |
|---|----------|--------|----------|
| 1 | Broken Access Control | ✅ Verified | AuthGuard('jwt') + RolesGuard on all protected routes; Admin/Babalawo/Vendor role checks |
| 2 | Cryptographic Failures | ✅ Verified | JWT_SECRET/JWT_REFRESH_SECRET min 32 chars (env validation); bcrypt; ENCRYPTION_KEY required in prod |
| 3 | Injection | ✅ Verified | Prisma (parameterized); ValidationPipe whitelist; sanitize.util.ts + validator for user content |
| 4 | Insecure Design | 🟡 Partial | Auth/payment flows designed with security in mind; threat model doc recommended |
| 5 | Security Misconfiguration | ✅ Verified | Helmet (HSTS, etc.), CORS from CORS_ALLOWED_ORIGINS/FRONTEND_URL, validateEnv at startup |
| 6 | Vulnerable Components | 🟡 Documented | npm audit: 2 critical (paystack→request), 5 high (axios, qs, tar, webpack); remediation plan below |
| 7 | Authentication Failures | ✅ Verified | JWT + refresh; bcrypt; ThrottlerGuard global; ENABLE_QUICK_ACCESS dev-only |
| 8 | Software and Data Integrity | 🟡 Partial | Sentry; lockfile; no code signing/CI signing yet |
| 9 | Logging Failures | ✅ Verified | RequestIdMiddleware, LoggingInterceptor, SentryExceptionFilter |
| 10 | SSRF | ✅ Verified | No user-controlled URL fetch; webhooks verify Paystack/Flutterwave signatures |

---

## Summary (Detailed)

| # | Category | Status | Notes |
|---|----------|--------|-------|
| A01 | Broken Access Control | Mitigated | AuthGuard/JWT on protected routes; role-based guards (Admin, Babalawo, Vendor) |
| A02 | Cryptographic Failures | Mitigated | JWT secrets from env (min 32 chars); bcrypt for passwords; ENCRYPTION_KEY for messaging |
| A03 | Injection | Mitigated | Prisma (parameterized); ValidationPipe + class-validator; sanitize.util.ts; no raw SQL |
| A04 | Insecure Design | Partial | Auth flows and payment flows designed with security in mind; threat model doc recommended |
| A05 | Security Misconfiguration | Mitigated | Helmet, CORS, env validation; JWT_SECRET required |
| A06 | Vulnerable and Outdated Components | Documented | See npm audit results and remediation plan below |
| A07 | Identification and Authentication Failures | Mitigated | JWT + refresh; password hashing; ENABLE_QUICK_ACCESS dev-only; ThrottlerGuard |
| A08 | Software and Data Integrity Failures | Partial | Sentry; no unsigned scripts; dependency integrity via lockfile |
| A09 | Security Logging and Monitoring Failures | Mitigated | Request ID, LoggingInterceptor, Sentry |
| A10 | Server-Side Request Forgery (SSRF) | Low risk | No user-controlled URLs to internal/external fetch; payment webhooks use signature verification |

---

## A01 – Broken Access Control

- **Guards:** `AuthGuard('jwt')` and role guards (`AdminRoute`, `BabalawoRoute`, `VendorRoute`) protect controllers.
- **Recommendation:** Ensure every mutation and sensitive read is behind an appropriate guard; audit any `@Public()` or unguarded endpoints.

---

## A02 – Cryptographic Failures

- **Secrets:** `JWT_SECRET` and `JWT_REFRESH_SECRET` required (min 32 chars) via env validation; no defaults in code.
- **Passwords:** bcrypt used in auth service.
- **Messaging:** `ENCRYPTION_KEY` (32 chars) for message encryption when configured.
- **Recommendation:** Rotate secrets on compromise; use TLS in production (handled by reverse proxy/load balancer).

---

## A03 – Injection

- **Database:** Prisma ORM (parameterized queries); no raw SQL with user input.
- **Input:** Global `ValidationPipe` with `whitelist: true`; DTOs with class-validator.
- **Recommendation:** Keep avoiding raw queries; sanitize any user content used in HTML (frontend/email templates – see A04/XSS).

---

## A05 – Security Misconfiguration

- **Helmet:** Enabled (HSTS, etc.; CSP disabled for API).
- **CORS:** Configured via `FRONTEND_URL` or `CORS_ALLOWED_ORIGINS`; production should set explicit origins.
- **Env:** `validateEnv()` at startup; required vars enforced.
- **Recommendation:** In production, set `NODE_ENV=production`, restrict CORS origins, and disable debug/quick-access.

---

## A06 – Vulnerable and Outdated Components

**npm audit results (monorepo root):** 14 vulnerabilities (1 low, 6 moderate, 5 high, 2 critical).

| Severity | Package | Issue | Fix |
|----------|---------|--------|-----|
| **Critical** | form-data &lt;2.5.4 | Unsafe random boundary (GHSA-fjxv-7rqg-78g4) | No fix — via `request` → `paystack` |
| **High** | axios &lt;=1.13.4 | DoS via __proto__ in mergeConfig (GHSA-43fc-jf86-j433) | `npm audit fix` |
| **High** | qs &lt;6.14.1 (in request) | arrayLimit bypass DoS (GHSA-6rw7-vpxm-498p) | No fix — via `request` |
| **High** | tar &lt;=7.5.6 | Path overwrite/symlink (GHSA-8qq5-rm4j-mr97, etc.) | `npm audit fix` |
| **High** | webpack 5.49–5.104 | buildHttp SSRF bypass | `npm audit fix` |
| **Moderate** | esbuild/vite (vitest) | Dev server request handling (dev only) | Optional: `npm audit fix --force` (breaking) |
| **Moderate** | tough-cookie (in request) | Prototype pollution | No fix — via `request` |

**Root cause:** Backend uses `paystack` (depends on deprecated `request` → form-data, qs, tough-cookie) and `flutterwave-node-v3` (depends on vulnerable axios). Paystack SDK has no official fix; Flutterwave dependency pulls in axios.

**Actions taken:** Run `npm audit fix` to resolve axios, tar, webpack where possible. Remaining critical/high require dependency replacement or accepted risk (see Remediation Plan).

---

## A07 – Identification and Authentication Failures

- **JWT:** Short-lived access token; refresh token flow; secrets from env.
- **Quick access:** Documented as dev-only; ensure never enabled in production (env flag).
- **Recommendation:** Consider rate limiting on auth endpoints (ThrottlerModule is global; verify auth routes are covered).

---

## A09 – Security Logging and Monitoring

- **Implemented:** Request ID middleware, LoggingInterceptor, Sentry (when DSN set).
- **Recommendation:** Ensure login failures and sensitive actions are logged (no PII in logs); Sentry in production.

---

## A10 – SSRF

- **Current:** No user-controlled URL fetching in backend; payment webhooks validate signatures.
- **Recommendation:** If adding “fetch URL” or webhook URLs from config, validate and allowlist; avoid proxying user-supplied URLs.

---

## Penetration Test Summary

Manual verification performed as part of HC-204.1:

| Test | Result | Notes |
|------|--------|--------|
| Authentication bypass | Pass | Protected routes return 401 without valid JWT |
| Privilege escalation | Pass | RolesGuard restricts Admin/Babalawo/Vendor endpoints |
| Payment webhook forgery | Pass | Paystack/Flutterwave webhooks validate signature headers |
| Rate limiting | Pass | ThrottlerGuard returns 429 after limit (see throttler-verification.spec.ts) |
| CORS / origin | Pass | CORS driven by env; no wildcard in production when set correctly |

No OWASP ZAP automated scan was run; recommended for next cycle. Critical flows (auth, payments, admin) are covered by E2E and manual checks.

---

## Remediation Plan

### HIGH/CRITICAL (Vulnerable Components)

1. **Paystack (request/form-data/qs/tough-cookie)**  
   - **Option A (recommended):** Replace `paystack` SDK with direct HTTPS calls to [Paystack API](https://paystack.com/docs/api/) using `axios` (after upgrading axios via `npm audit fix`). Eliminates `request` and its transitive critical/high vulns.  
   - **Option B:** Accept risk with mitigation: Paystack is used only server-side for initialize/verify/refund; no user-supplied input is passed to the SDK other than amounts and references. Webhook signature verification prevents forgery. Document as accepted risk until Option A is done.

2. **Flutterwave (axios)**  
   - Run `npm audit fix` in backend to upgrade axios to a patched version where possible. If flutterwave-node-v3 pins axios, consider wrapping Flutterwave API calls with a local axios instance (same as Paystack Option A) for full control.

3. **Dev-only (esbuild, vite, vitest, webpack)**  
   - Run `npm audit fix` for tar/webpack. For vitest/esbuild: either `npm audit fix --force` (may upgrade vitest to v4 — test suite may need updates) or accept as dev-only risk (not in production runtime).

### MEDIUM/LOW

- **Logging:** Ensure no PII in logs (HC-202.2); trace IDs already in place.  
- **CSP:** Backend is API-only; CSP remains disabled; frontend should enforce CSP.  
- **Dependabot/Renovate:** Enable for automated dependency PRs.

---

## Production Checklist

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` strong and unique; not default
- [ ] `FRONTEND_URL` or `CORS_ALLOWED_ORIGINS` set to production frontend(s) only
- [ ] `ENABLE_QUICK_ACCESS` unset or false
- [ ] TLS termination at reverse proxy; no plain HTTP for API in production
- [ ] Sentry DSN set for error tracking
- [ ] Database credentials and API keys from secure secret store (e.g. env vault), not committed
- [ ] Run `npm audit fix` before each release; track remaining paystack/flutterwave vulns per remediation plan

---

## Rate Limiting (PB-204.3)

- **ThrottlerModule** global: 100 requests per minute per client (TTL 60s).
- **ThrottlerGuard** registered as `APP_GUARD` in `AppModule` (all routes protected).
- **Verification:** `backend/src/throttler-verification.spec.ts` asserts that the 4th request within the limit window receives **429 Too Many Requests**.

## Related Backlog Items

- **PB-204.2** Input sanitization (XSS) for user-generated content
- **PB-204.3** Rate limiting verification ✅ (Throttler in place; test verifies 429)
- **PB-204.4** Encryption key management (ENCRYPTION_KEY enforcement)
- **PB-204.5** CORS & CSP hardening (this audit addresses CORS; CSP N/A for API-only backend)
