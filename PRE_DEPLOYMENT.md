# Pre-Deployment Audit — Ìlú Àṣẹ Platform

**Audited:** September 14, 2026
**Scope:** Full repo — backend (NestJS/Prisma/Postgres), frontend (React/Vite), Docker, CI/CD, AWS config, docs.
**Context:** The app is **already live** at https://iluase.com. This audit was run as if reviewing it for a first production deployment tomorrow, per request — findings below apply whether this is a first deploy or the next one.

**Note on scope overlap:** `ILUASE_V1_BACKLOG.md` already tracks feature gaps and several previously-fixed money/security bugs — this doc does not repeat those. Everything below is either a new finding from this pass or a doc/reality contradiction not previously tracked.

---

## 1. Critical Issues (must fix before next deploy)

### C1. ~~CI "staging deploy" job unconditionally force-deploys production ECS~~ — corrected finding, then fixed
**Correction (September 14, 2026):** the original version of this finding was wrong about the mechanism. It read `.github/workflows/ci-cd.yml`'s deploy job invoking `./scripts/deploy.sh` and matched that against the **repo-root** `deploy.sh` (ECR push + `aws ecs update-service` against `iluase-prod`) — but the SSH step's working directory is `/home/ubuntu/ifa_app`, so `./scripts/deploy.sh` actually resolves to **`scripts/deploy.sh`**, a completely different script (git pull + `npm run build` + PM2 restart) that never touches AWS/ECR/ECS at all. Two scripts, same filename, different directories, opposite blast radius — confirmed via `diff deploy.sh scripts/deploy.sh`. Apologies for the false alarm on the exact mechanism; there is **no** automated path from this pipeline to production ECS today (that gap is real and still tracked under Section 4, "No automated production deployment pipeline").

**What was real and has been fixed:** `scripts/deploy.sh` hardcoded `git pull origin v4/quality`, completely decoupled from whatever branch actually triggered the CI run that passed and invoked it (`july-2026-hardening-pass` per the job's `if:` condition). CI could test one commit and this script would silently deploy a different one from a stale branch. Fixed:
- `scripts/deploy.sh` now reads the branch from a `DEPLOY_BRANCH` env var (falling back to `v4/quality` only for a manual run directly on the box).
- `ci-cd.yml`'s deploy job now passes `DEPLOY_BRANCH: ${{ github.ref_name }}` through the SSH session, so it always deploys the exact branch/commit that just passed the test-backend/test-frontend jobs above it.
- Job renamed `deploy` → `deploy-staging` and given `environment: staging`, plus a comment block distinguishing it from the separate, manually-run production path, so this confusion doesn't recur.

**Still open, not code-fixable in this pass:** there is no CD job that pushes to ECR / runs `aws ecs update-service` at all — production deploys are 100% a human running the repo-root `deploy.sh` locally. Building a real gated `deploy-production` job is a larger, deliberate infra change (needs a GitHub Environment with required reviewers actually configured, and a decision on trigger — tag push? manual `workflow_dispatch`?) rather than a same-shape bug fix; see Section 4/5.

### C2. Local `main` has never been pushed; CI deploy branch doesn't match working branch
`git ls-remote --heads origin` (per `ILUASE_V1_BACKLOG.md`, still true) shows no `main` on the remote. `ci-cd.yml`'s `on.push.branches` includes `main`, but `deploy:` gates on `refs/heads/july-2026-hardening-pass` only. **Needs a human decision** (branch strategy), not a code fix — but block any deploy attempt until resolved, since right now nothing is verifiably wired to ship from the branch everyone is actually committing to.

### C3. `backend/Dockerfile.production`'s HEALTHCHECK references a file that's never copied into the image
```dockerfile
# Stage 2 (runtime) only copies:
COPY --from=builder --chown=nestjs:nodejs /app/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/backend/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/common/dist ./common/dist
...
HEALTHCHECK ... CMD node healthcheck.js   # <-- ./healthcheck.js does not exist in this stage
```
Every container built from this Dockerfile has a Docker-level HEALTHCHECK that fails immediately (`Error: Cannot find module 'healthcheck.js'`), which marks the container unhealthy in any orchestrator that reads the image's own HEALTHCHECK (plain `docker run`, ECS if `containerDefinitions[].healthCheck` isn't explicitly overridden, Docker Compose).

**Note:** the *actual* deploy script (`deploy.sh`) builds from `backend/Dockerfile` (no `.production` suffix), which has no HEALTHCHECK directive at all and relies entirely on the ECS task definition's own health check. `backend/Dockerfile.production` is referenced only by `docker-compose.production.yml`.

**Fixed and verified — this was much worse than the single bug above.** Applying just the healthcheck copy and rebuilding surfaced five *more* independent, fatal bugs in the same file, each confirmed by actually running `docker build` + `docker run` (not just static review) — this Dockerfile had evidently never once produced a working container:

1. **Missing `npx prisma generate`** before `npm run build` — the build's own type-check failed with ~280 TypeScript errors, because every file using an inferred Prisma model type breaks without the generated client. `backend/Dockerfile` runs this; `Dockerfile.production` never did.
2. **HEALTHCHECK referenced a file never copied in** — the original finding above.
3. **Wrong CMD path** — `CMD ["node", "dist/src/main.js"]`, but this project's actual build output (via `build.js`/webpack) lands at `dist/backend/src/main.js`. The container would immediately exit with `MODULE_NOT_FOUND`.
4. **Runtime stage never creates the `nestjs` user it switches to** — `USER nestjs` in stage 2 with no matching `RUN addgroup/adduser` in that stage (only in the discarded builder stage). Docker refused to start the container at all: `unable to find user nestjs: no matching entries in passwd file`.
5. **Wrong `node_modules` copied into the runtime image** — `COPY --from=builder .../backend/node_modules ./node_modules` copies only the small set of packages npm workspaces couldn't hoist; everything hoisted to the monorepo root (`@nestjs/core` included) was silently left behind. Runtime crash: `Error: Cannot find module '@nestjs/core'`.
6. **`@ile-ase/common` copied to a location nothing resolves** — placed at bare `./common/dist` instead of `./node_modules/@ile-ase/common/`, where `require('@ile-ase/common')` actually looks once there's no workspace symlink in the final image.
7. **Missing `libssl` for Prisma's query engine** — `node:22-alpine`'s runtime stage had no OpenSSL runtime library at all; the engine binary failed to `dlopen`. Needed the same `apk add openssl` `backend/Dockerfile` already does.

All seven are now fixed. **Verified via full end-to-end `docker build` + `docker run`** (not just a read-through): built and ran the image on both host-native arm64 and, since real Fargate is x86_64, an emulated `--platform linux/amd64` build — the container reached a running state, `HEALTHCHECK`'s `node healthcheck.js` executed successfully and correctly reported `503` against a deliberately-fake `DATABASE_URL` (i.e. the health check itself works; a 503 there is the *correct* response to no real database, not a bug), and every NestJS module (including the ones that were previously never reached) initialized cleanly.

**Given this file needed seven independent fixes to work at all, seriously consider deleting `backend/Dockerfile.production` and `docker-compose.production.yml` outright rather than keeping two backend Dockerfiles in sync going forward** — `backend/Dockerfile` is the one real deploys actually use, and an unused parallel config is exactly how a file gets this broken without anyone noticing for what was evidently its entire existence. This session fixed it rather than deleting it, since deleting deployment config is a bigger call than a same-session bug audit should make unilaterally — but the case for deleting it is now backed by hard evidence, not speculation.

### C4. Health check depends on `google.com` being reachable — couples app health to an unrelated third party
`backend/src/health/health.controller.ts:22-25`:
```ts
const healthCheckResult = await this.health.check([
  () => this.checkDatabase(),
  () => this.http.pingCheck('google', 'https://google.com'),
]);
```
This is the exact endpoint (`GET /api/health`) that `healthcheck.js`, the nginx `/health` route, and (per `AWS_SETUP_GUIDE.md`) the ALB target group all hinge on. If outbound internet from the ECS task's subnet is degraded, rate-limited, or NAT-gateway-throttled — with zero impact on the actual app or DB — this check fails, ECS marks the task unhealthy, and it gets cycled. A single upstream Google hiccup can trigger a self-inflicted outage.

**Fix:**
```diff
 const healthCheckResult = await this.health.check([
   () => this.checkDatabase(),
-  () => this.http.pingCheck('google', 'https://google.com'),
 ]);
```
If a "can we reach the internet" check is genuinely wanted, make it a separate, non-gating diagnostic endpoint — never let it fail the liveness/readiness probe.

### C5. Paystack webhook HMAC is computed over the re-serialized parsed body, not the raw bytes
`backend/src/payments/payments.controller.ts:133-137` receives `@Body() payload: PaystackWebhookPayload` (parsed JSON, no raw body access). `backend/src/payments/payments.service.ts:471-474`:
```ts
crypto.createHmac('sha512', secretKey).update(JSON.stringify(payload))
```
`main.ts` enables `rawBody: true` specifically so raw-byte HMAC verification is possible, and the sibling `subscriptions.controller.ts:127-144` does it correctly (`@Req() req: RawBodyRequest`, HMAC over `req.rawBody`). Because Nest JSON-parses the body then this code re-stringifies it, any byte-level difference from what Paystack actually sent (key ordering on retry, numeric formatting, whitespace) makes the computed signature diverge from Paystack's — **legitimate payment-confirmation webhooks get silently rejected**. This is a real-money reliability bug: payments can complete on Paystack's side while the platform never marks the order/escrow as paid.

**Fix:** mirror the `subscriptions.controller.ts` pattern —
```ts
// payments.controller.ts
@Post('webhook')
async handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers('x-paystack-signature') signature: string) {
  return this.paymentsService.handleWebhook(req.rawBody, signature);
}
```
```ts
// payments.service.ts
crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex')
```

### C6. Access tokens are hardcoded to 1 hour, silently overriding the documented 15-minute config
`backend/src/auth/auth.service.ts:524-543` (`generateTokens()`, used by register/login/Google-login/refresh/impersonation at lines 104, 273, 317, 408, 449):
```ts
expiresIn: '1h'
```
`backend/src/config/env.validation.ts:30` validates `JWT_EXPIRES_IN` (documented default `15m` in `.env.example`), but nothing in `generateTokens()` reads it. Every token — including admin-impersonation sessions, which should arguably be *shorter*-lived, not equal — gets a flat 1-hour window regardless of what's configured.

**Fix:**
```ts
constructor(private configService: ConfigService, ...) {}

private generateTokens(userId: string, ...) {
  const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
  return this.jwtService.sign(payload, { secret: ..., expiresIn });
}
```

### C7. No logout/token-revocation mechanism — stolen refresh tokens survive "logout"
No `POST /auth/logout` route exists in `auth.controller.ts`. Refresh tokens are stateless JWTs, verified purely by signature + expiry (`auth.service.ts:431-458`). `userSession` is an audit log, not a revocation table. A leaked refresh token (7-day TTL) remains valid for its full lifetime even after the user "logs out" client-side or resets their password.

**Fix:** add a Redis-backed denylist (keyed by JWT `jti`, TTL = remaining token lifetime) checked in `JwtStrategy.validate()`; populate it on logout and on password-reset. This is a real gap for a platform handling payments and PII — treat as pre-launch-blocking, not a nice-to-have.

### C8. Rate limiting is in-memory, not Redis-backed — meaningless across multiple instances
`backend/src/app.module.ts` registers `ThrottlerModule` (`backend/src/config/throttler.config.ts`) with no `storage:` option. `backend/package.json` has no `@nestjs/throttler-storage-redis` (or equivalent) dependency. Default storage is an in-process `Map`. Production runs 2 backend instances behind an ALB (per `AWS_SETUP_GUIDE.md`), so the 10 req/min auth-brute-force limit is really ~20 req/min, and trivially further evaded by repeatedly reconnecting until landing on the "fresher" instance. Redis is already provisioned and already used elsewhere in the app (currency-rate caching) — it's sitting right there unused for this.

**Fix:**
```bash
npm install @nestjs/throttler-storage-redis --workspace=backend
```
```ts
// throttler.config.ts
import { ThrottlerStorageRedisService } from '@nestjs/throttler-storage-redis';

storage: new ThrottlerStorageRedisService(redisClient),
```

---

## 2. Security Risks

| # | Finding | Evidence | Risk |
|---|---|---|---|
| S1 | No global auth guard — auth is opt-in per controller | `app.module.ts:130-138`: only `ThrottlerGuard`/`ThrottlerBehindProxyFix` are registered as `APP_GUARD`. `@Public()` exists but isn't consumed by any global guard as an opt-out — it's inert metadata. | Every new controller must remember to add `@UseGuards(JwtAuthGuard)` by hand. All money-adjacent controllers spot-checked (wallet, admin, subscriptions, payments) currently do have it — but the failure mode for a forgotten guard is "unauthenticated by default," the worst direction to fail in. |
| S2 | Internal AWS topology committed to git in plaintext | `docs/active/AWS_SETUP_GUIDE.md` — VPC ID, both subnet IDs, all 4 security group IDs, RDS/Redis endpoints, AWS account ID (`091653536932`, also hardcoded in `deploy.sh`), ACM cert ARN, Route53 zone ID. | Not credentials, but a full recon map handed to anyone with repo access. If this repo is ever made public, forked, or leaked, an attacker skips the entire reconnaissance phase of an attack. Move this to a private internal wiki or AWS Systems Manager Parameter Store notes, not a versioned markdown file. |
| S3 | Ops docs mix two different, incompatible architectures in the same files | `docs/active/AWS_SETUP_GUIDE.md` top half describes ECS Fargate + Secrets Manager (accurate, matches `deploy.sh`); its own "Quick Reference: SSH Commands" section and Cost Reference table further down describe EC2 + PM2 + SSH (`pm2 list`, `ssh ubuntu@<PROD-IP>`). `docs/active/SECRET_ROTATION.md` instructs rotating `JWT_SECRET` by SSHing in and running `nano /home/ubuntu/ifa_app/backend/.env` + `pm2 reload`. | During an actual incident (e.g. rotating a compromised secret under time pressure), an on-call engineer following the documented runbook will SSH into a box that isn't running production anymore and edit a file nothing reads. Reconcile these docs before they're needed for real. |
| S4 | `prisma db push` listed as a production deployment step | `docs/active/PRE_LAUNCH_CHECKLIST.md`, "Deployment steps" block, lists `npx prisma db push` immediately after `npx prisma migrate deploy`. | `db push` bypasses migration history entirely and can drop/alter columns to force schema sync — it is explicitly documented by Prisma as unsafe for production. The actual runtime path (`docker-entrypoint.sh`) correctly only runs `migrate deploy`; this checklist doc telling a human to also run `db push` is a live footgun if anyone follows it literally. Delete that line. |
| S5 | Error boundaries never reach Sentry | `frontend/src/components/common/error-boundary.tsx:26` → `error-handler.util.ts:87-93`'s `reportError()` is a literal no-op placeholder ("In a real implementation, this would send errors to Sentry"); `addLogger()` is never called anywhere. The second boundary (`shared/components/error-boundary.tsx:28`) only calls `console.error` in prod. | Sentry is correctly initialized and catches unhandled errors/explicit `captureException` calls elsewhere — but every render-time crash caught by a boundary (i.e., exactly the crashes serious enough to trip a boundary) is invisible to the team. Silent failures, zero alerting. |
| S6 | Console logging of push-notification payloads in production | `frontend/src/lib/firebase-messaging.ts:69,75` — raw `console.log('Push received:', notification)` / `console.log('Push tapped:', action)`, not gated by the app's own `isDev`-aware logger. | Order/appointment content in push payloads lands in any user's browser devtools console in production. |
| S7 | Stray migration SQL file invisible to Prisma's migration history | `backend/prisma/migrations/add_currency_cache.sql` sits loose, not inside a timestamped migration folder — `prisma migrate deploy`/`migrate status` cannot see it. | If this was applied to production by hand, Prisma has no record of it; a future `migrate deploy` could conflict with or silently skip a schema element it doesn't know exists. Fold it into a real timestamped migration or drop it if already superseded. |
| S8 | 48 backend + 33 frontend known npm CVEs, `npm audit` non-blocking in CI (`continue-on-error: true`, `ci-cd.yml`) | Already triaged in `ILUASE_V1_BACKLOG.md` (July 29, 2026) — most remaining are transitive/non-exploitable given actual usage, a few deliberately deferred pending major-version bumps. | Not re-litigated here — listed because "non-blocking security scan" is itself worth flagging as a standing risk-acceptance decision, not a fixed state. |

---

## 3. Performance Problems

| # | Finding | Evidence |
|---|---|---|
| P1 | Forum thread listing is fully unbounded | `backend/src/forum/forum.service.ts:328-370` (`findAllThreads`, `GET` via `forum.controller.ts:127`) — no `take`/`skip` on the main `findMany`, unlike the neighboring trending-query at line 315 which correctly caps results. At scale (10k+ threads, no category filter) this returns every row with nested `author`/`category` includes in one request. |
| P2 | Admin "list all users" is fully unbounded | `backend/src/admin/admin-users.service.ts:54` — `prisma.user.findMany({ where, select })`, no `take`. Clearing filters on the admin user-management screen fetches the entire `users` table. |
| P3 | N+1 queries in the inactive-practitioner monitor | `backend/src/admin/inactive-practitioner-monitor.service.ts:109-136` fetches all `BABALAWO` users, then loops issuing one `prisma.appointment.findFirst` per practitioner (repeated again at lines 157-168 over an already-N+1-derived list) instead of a single batched query. `admin-users.service.ts:681-690` has the same pattern for `userSession.findFirst`. This job scales linearly (or worse) with practitioner count instead of staying flat. |
| P4 | `User` model has zero `@@index` blocks despite constant `role`-filtered queries | `backend/prisma/schema.prisma` — `role` is filtered in 18+ call sites; every one does a full table scan on `users` past a few thousand rows. (For contrast: `Order`, `Transaction`, `ForumThread`, `Notification` are all properly indexed — this is an isolated gap, not a systemic one; only `User`, `AdvisoryVote`, `AdvisoryVoteOption`, `PlatformSettings` lack any index, and `User` is the one that matters.) |
| P5 | Raw `<img>` tags without lazy loading on most product/vendor surfaces | A working `OptimizedImage` component (IntersectionObserver lazy-load, `loading="lazy"`) exists at `frontend/src/components/common/optimized-image.tsx` but is used in exactly one feature file. `VendorStorefrontPage.tsx`, `product-detail-view.tsx`, `babalawo-profile-card.tsx`, `marketplace-view.tsx`, `CircleHero.tsx` all use bare `<img>` with no `loading` attribute (0 occurrences of `loading="lazy"` repo-wide outside the one unused component). Backend's `ImageOptimizationService` (WebP/responsive variants) is only wired into profile-avatar uploads, not marketplace product images. |
| P6 | No build-time console stripping | `frontend/vite.config.ts:50` uses `minify: 'esbuild'` with no `drop: ['console','debugger']`. The app's own logger is dev-gated correctly, but nothing strips stray raw `console.*` calls (see S6) at build time as a backstop. |

**Clean / no action needed:** source maps correctly disabled in prod builds (`vite.config.ts:85`); route-based code splitting is real and extensive (50+ `React.lazy` calls via `frontend/src/routes/lazy-views.tsx`); nginx cache headers match the documented caching strategy exactly (hashed assets get `immutable, max-age=2592000`, `index.html`/`sw.js` get `no-store`); no active service worker to worry about stale-caching money data; connection pool sizing (`connection_limit=10` × 2 instances = 20 app connections against RDS `db.t3.small`'s ~200 `max_connections`) has comfortable headroom today.

---

## 4. Missing / Inconsistent AWS Configuration

- **No Infrastructure-as-Code anywhere in the repo.** No Terraform, CDK, or CloudFormation — the entire VPC/ECS/RDS/Redis/ALB/Route53 topology described in `AWS_SETUP_GUIDE.md` was built by hand via console/CLI and exists nowhere as reproducible, version-controlled config. If the account were lost or a resource accidentally deleted, rebuilding it depends entirely on a human re-reading a markdown doc and re-running click-ops. This is the single biggest structural AWS gap.
- **No automated production deployment pipeline.** Confirmed independently by two passes over `.github/workflows/`: the only `deploy` job targets EC2 staging via SSH; there is no ECR-push / `ecs update-service` step anywhere in CI. Production deploys happen by a human running `deploy.sh` locally (hardcoded AWS account ID `091653536932` embedded in the script). No blue/green or canary despite `DEPLOYMENT_PIPELINE.md` describing blue-green deployment as if it were implemented — it isn't.
- **Backup scripts don't match the RDS+ECS architecture.** `scripts/backup-db.sh`/`restore-db.sh` hardcode `/home/ubuntu/ifa_app`, read `DATABASE_URL` from a local `.env` file, `pm2 stop/start`, and write dumps to local EC2 disk (S3 upload is present but commented out). These only work today because the CI "deploy" job happens to run from an EC2 box. RDS's own automated backups (7-day retention, per `AWS_SETUP_GUIDE.md`) are the actual safety net — the scripts are vestigial and should either be fixed to target S3/RDS snapshots directly or removed to stop implying they're the backup strategy.
- **Migrations run automatically on every container boot with no gate.** `backend/docker-entrypoint.sh` runs `npx prisma migrate deploy` on every single container start (including routine ECS task restarts/scaling events, not just deploys). Prisma's own migration lock makes concurrent runs safe, but there's no separation between "deploy a new version" and "apply a schema migration" — a bad migration gets retried on every subsequent scale-out event until fixed. Recommend running migrations as a distinct one-off ECS task (`aws ecs run-task` with an override command) in the deploy pipeline, not baked into every container's startup.
- **~15 Prisma migrations with no recorded confirmation of being applied to production RDS** (carried over from `ILUASE_V1_BACKLOG.md`, still open — needs a human to run `prisma migrate status` against the real prod `DATABASE_URL` and confirm).
- **Rate limiting has no Redis backing** (see C8) despite Redis already being provisioned in prod for other purposes.
- **Two backend Dockerfiles and two docker-compose files that disagree with each other** (see C3) — `docker-compose.production.yml` references `STRIPE_SECRET_KEY`/`STRIPE_PUBLISHABLE_KEY`/`STRIPE_WEBHOOK_SECRET` env vars, but the platform's actual payment gateways are Paystack and Flutterwave (confirmed in `backend/.env.example` and the real webhook controllers) — Stripe doesn't exist anywhere in this codebase. This file is stale/dead and should be deleted, not left as a trap for the next person who assumes it's current.

---

## 5. Recommended AWS Architecture

The architecture already described in `AWS_SETUP_GUIDE.md` is fundamentally sound for this app's current scale — the recommendation here is to **codify and harden what already exists**, not replace it:

```
Route53 (iluase.com, www.iluase.com)
   │
CloudFront (static assets + /api/* passthrough, uncached)
   │
ALB (public subnets, ACM wildcard cert, HTTP→HTTPS redirect)
   ├── /api/*, /socket.io/*  → target group → ECS Fargate "iluase-backend" (2+ tasks, private subnets)
   └── /*                    → target group → ECS Fargate "iluase-frontend" (2+ tasks, private subnets)
                                     │
                         NAT Gateway (private subnet egress — Paystack/Flutterwave/SendGrid/Agora API calls)
                                     │
         ┌───────────────────────────┴───────────────────────────┐
   RDS Postgres 16, Multi-AZ                          ElastiCache Redis 7 (replication group, TLS)
   (private subnets, encrypted, 7-day automated backups)   (rate-limit storage, currency cache)

Secrets Manager (iluase/prod/app-secrets, iluase/prod/connection-strings)
CloudWatch Logs (30-day retention) + Container Insights + alarms → SNS → email/Slack
Sentry (frontend + backend error tracking)
```

**Concrete additions on top of the existing setup:**
1. **Codify it.** Import the existing hand-built resources into Terraform (or CDK) — `terraform import` against every resource ID already documented in `AWS_SETUP_GUIDE.md` gets you there without rebuilding anything live.
2. **Add a real CD pipeline stage** — ECR push + `ecs update-service` from GitHub Actions, gated behind a GitHub Environment with required reviewers for production. (C1's `deploy-staging` job is now correctly branch-synced and environment-tagged, but there is still no automated path to production at all — see Section 4.)
3. **Decouple migrations from container boot** — run `prisma migrate deploy` as a one-off ECS task in the pipeline, before the service update, not inside every task's entrypoint.
4. **Point rate limiting at the Redis cluster that's already provisioned** (fixes C8) — zero new infrastructure cost, just wiring.
5. **Consider WAF on the ALB/CloudFront** — nothing in the repo indicates AWS WAF is attached; for a platform handling payments, basic managed rule groups (SQLi, known-bad-inputs, rate-based rules as defense-in-depth alongside the app-level throttler) are cheap and standard.

---

## 6. Estimated Monthly AWS Cost

`docs/active/AWS_SETUP_GUIDE.md`'s own "Cost Reference" section is **stale and does not describe this architecture** — it estimates an EC2 t3.medium + single-node ElastiCache setup (~$143–200/mo), which is a different, older topology than the ECS Fargate + Multi-AZ RDS + 2-node Redis cluster the same document's own "Production Environment — LIVE" table describes. Below is an estimate for the architecture actually documented as live, at the stated scale (2 backend + 2 frontend Fargate tasks, `db.t3.small` Multi-AZ, 2-node Redis, one NAT gateway):

| Resource | Spec | Est. Monthly Cost (us-east-1) |
|---|---|---|
| ECS Fargate — backend | 2 × (0.5 vCPU / 1 GB) | ~$36 |
| ECS Fargate — frontend | 2 × (0.25 vCPU / 0.5 GB) | ~$18 |
| RDS Postgres 16 | `db.t3.small`, Multi-AZ, 50 GB gp3 + backups | ~$60–70 |
| ElastiCache Redis 7 | 2-node cluster, small instance class | ~$25 |
| Application Load Balancer | base + LCU | ~$20 |
| NAT Gateway | 1 gateway, base + data processing | ~$35–40 |
| CloudFront | low-moderate traffic | ~$5–15 |
| Route53 | hosted zone + queries | ~$1.50 |
| ACM certificate | — | $0 |
| Secrets Manager | 2 secrets | ~$0.80 |
| CloudWatch | logs (30-day retention) + Container Insights + alarms | ~$10–15 |
| S3 (backups/uploads) | modest volume | ~$3–5 |
| Data transfer out | modest traffic | ~$10–20 |
| **Total (current documented scale, modest traffic)** | | **~$225–300/month** |

At real customer load (not "< 500 concurrent users," the assumption baked into the stale estimate), expect this to climb primarily via NAT/data-transfer and Fargate task count scaling — budget $400–600/month as a more realistic 6-months-post-launch number if traffic grows. **Action item: replace the stale cost table in `AWS_SETUP_GUIDE.md` with this one** so nobody budgets against a different architecture than what's actually running.

---

## 7. Deployment Checklist

**Blocking — do not deploy until these are resolved:**
- [x] C1 — `scripts/deploy.sh` now deploys the branch CI actually tested (`DEPLOY_BRANCH`), not a hardcoded stale branch; `deploy-staging` job tagged with `environment: staging`. Building a gated `deploy-production` CD stage is still open — see Section 4/5 (no code fix possible without a human decision on trigger/approval design).
- [ ] C2 — Resolve branch strategy (`main` vs `july-2026-hardening-pass`) with a human decision; confirm CI deploys from the branch people actually commit to
- [x] C3 — `backend/Dockerfile.production` had 7 independent fatal bugs (missing `prisma generate`, missing `healthcheck.js` copy, wrong CMD path, missing runtime user, wrong `node_modules` source, unresolvable `@ile-ase/common`, missing `libssl`); all fixed and verified with a real `docker build` + `docker run` on both arm64 and amd64. Consider deleting this file instead of maintaining it going forward — see Section 1.
- [x] C4 — Removed the `google.com` ping from `/api/health`
- [x] C5 — Paystack webhook signature verification now uses `req.rawBody`
- [x] C6 — Access-token expiry now reads `JWT_EXPIRES_IN`/`JWT_REFRESH_EXPIRES_IN` instead of hardcoded `1h`
- [x] C7 — Added `POST /auth/logout` + Redis-backed jti denylist, checked in `JwtStrategy.validate()`; refresh-token rotation also revokes the spent refresh token
- [x] C8 — `@nestjs/throttler` now uses `@nest-lab/throttler-storage-redis` against the existing Redis instance (falls back to in-memory only when `REDIS_URL` is unset, i.e. local dev)
- [ ] Confirm all ~15 pending Prisma migrations are actually applied to prod RDS (`prisma migrate status` against real `DATABASE_URL`)
- [ ] Confirm AWS Secrets Manager (`iluase/prod/app-secrets`, `iluase/prod/connection-strings`) actually contains current, correct values
- [ ] Set the 3 missing Paystack Devoted-tier env vars in production (subscription checkout is currently broken without them, per `ILUASE_V1_BACKLOG.md`)

**Should fix before next deploy, not launch-blocking:**
- [ ] P1/P2 — Add pagination to `forum.findAllThreads` and `admin-users` list endpoint
- [ ] P3 — Batch the N+1 queries in `inactive-practitioner-monitor.service.ts`
- [ ] P4 — Add `@@index([role])` to `User` model + migration
- [ ] S3/S4 — Rewrite `AWS_SETUP_GUIDE.md`'s bottom half and `SECRET_ROTATION.md` for the real ECS architecture; delete the `prisma db push` line from `PRE_LAUNCH_CHECKLIST.md`
- [ ] S5 — Wire error boundaries to `Sentry.captureException`
- [ ] S6 — Remove/guard raw `console.log` in `firebase-messaging.ts`
- [ ] S7 — Reconcile `add_currency_cache.sql` into the real migration history
- [ ] Reconcile `docker-compose.production.yml`'s Stripe env vars (dead reference) or delete the file

**Infrastructure hygiene (no urgency, but real gaps):**
- [ ] Stand up Terraform/CDK for the existing hand-built AWS resources
- [ ] Add a real production CD stage (ECR push + `ecs update-service`) gated by approval
- [ ] Move migrations out of container-boot into a discrete pipeline step
- [ ] Fix `backup-db.sh`/`restore-db.sh` to target S3/RDS snapshots directly, or remove them and document RDS automated backups as the sole mechanism
- [ ] Attach AWS WAF to the ALB/CloudFront
- [ ] Replace the stale cost table in `AWS_SETUP_GUIDE.md` (see Section 6)
- [ ] P5/P6 — Extend `OptimizedImage` usage to marketplace/vendor image surfaces; add `drop_console` to the Vite build as a backstop

**Standing risk acceptances (tracked, not urgent):**
- 48 backend + 33 frontend npm CVEs, non-blocking in CI, mostly transitive/non-exploitable (see `ILUASE_V1_BACKLOG.md`)
- Backend test coverage thresholds remain low (20%/18%/16%/20% — statements/branches/functions/lines)
- EC2 staging reportedly unreachable — blocks a full staging validation pass before prod deploys

---

## 8. Production Readiness Score

**As originally reviewed (September 14, 2026, before fixes): 54 / 100 — Conditional, not launch-ready.**

**What was genuinely solid even then** (credit where due): strict fail-closed CORS, Helmet + custom security headers, a global exception filter with proper error shaping, a global sensitive-field-stripping interceptor, encryption key validation that's correctly production-gated, zero raw-SQL-injection surface anywhere in the codebase, no hardcoded secrets or JWT fallback defaults, all money fields correctly typed as `Decimal`, IDOR checks present and consistent on the wallet/withdrawal endpoints, extensive prior hardening history (soft-delete safety, audit logging, marketplace commission logic) independently verified in `ILUASE_V1_BACKLOG.md`.

**Why it wasn't higher:** a real-money reliability bug (webhook signature verification, C5), a token-lifetime bug that silently overrode its own documented config (C6), a complete absence of session revocation (C7), rate limiting that didn't actually rate-limit across the deployed instance count (C8), a broken Docker health check on one of two backend Dockerfiles (C3), a health check coupling app liveness to an unrelated third party (C4), and operational runbooks that actively contradict each other about which architecture is even running (S3) — the kind of thing that turns a routine incident into a longer one.

**After this session's fixes: ~72/100 — Conditional, materially closer, not fully launch-ready.** C3–C8 are fixed and test-covered (100 backend tests green across `payments.service.spec.ts`, `payments.controller.spec.ts`, `auth.service.spec.ts`, `jwt.strategy.spec.ts` (new), `health.controller.spec.ts` (new), `roles.guard.spec.ts`, `paystack-api.service.spec.ts`, `currency.service.spec.ts`; full `tsc --noEmit` and `nest build` also clean). C3 specifically was verified with real `docker build`/`docker run`, not just code review — see its writeup for why that mattered. C1's real bug (deploy script pulling a hardcoded, CI-trigger-disconnected branch) is fixed; its original writeup also had to be corrected (see C1). What's still open and holding the score back:
- C2 (branch strategy) — explicitly needs a human decision, not something to fix by editing files
- No automated CD path to production ECS at all (Section 4) — the biggest remaining structural gap
- No Infrastructure-as-Code (Section 4)
- S1–S8 (Security Risks section) — global auth guard, contradictory ops docs, `prisma db push` in a checklist, Sentry-blind error boundaries, etc. — none were in the 8-item critical scope for this pass
- P1–P6 (Performance) — unbounded queries, N+1s, missing index — untouched
- Migration-applied confirmation and Secrets Manager contents — need a human with prod access to verify, not code-checkable

**Path to a passing score (80+):** close the human-decision items (C2, migration confirmation, Secrets Manager check), stand up a real gated production CD stage, and work through the Security Risks list. None of it is a rearchitecture — it's the same fixable-in-days shape as the items closed this session.

---

## 9. AWS Deployment Commands

These use the real, already-provisioned resource identifiers documented in `docs/active/AWS_SETUP_GUIDE.md` (account `091653536932`, region `us-east-1`). Replace with your own values for a from-scratch setup. **Run nothing here without confirming you're targeting the right environment — several commands below are destructive or affect live production.**

### 9.1 Docker build (local)

```bash
# Backend — uses the real Dockerfile deploy.sh actually builds from
docker build -f backend/Dockerfile -t iluase-backend:local .

# Frontend — production build, static output served by nginx
docker build -f frontend/Dockerfile.production \
  --build-arg VITE_API_URL=https://iluase.com/api \
  --build-arg VITE_GOOGLE_CLIENT_ID=<your-google-client-id> \
  -t iluase-frontend:local .
```

### 9.2 ECR push

```bash
ACCOUNT=091653536932
REGION=us-east-1
BACKEND_REPO=$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/iluase/backend
FRONTEND_REPO=$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/iluase/frontend

# One-time: create the repos if they don't exist yet
aws ecr create-repository --repository-name iluase/backend --region $REGION --image-scanning-configuration scanOnPush=true
aws ecr create-repository --repository-name iluase/frontend --region $REGION --image-scanning-configuration scanOnPush=true

# Authenticate Docker to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT.dkr.ecr.$REGION.amazonaws.com

# Tag and push (tag by git SHA, not just :latest, so you can roll back precisely)
GIT_SHA=$(git rev-parse --short HEAD)
docker build -f backend/Dockerfile -t $BACKEND_REPO:$GIT_SHA -t $BACKEND_REPO:latest .
docker build -f frontend/Dockerfile.production --build-arg VITE_API_URL=https://iluase.com/api -t $FRONTEND_REPO:$GIT_SHA -t $FRONTEND_REPO:latest .

docker push $BACKEND_REPO:$GIT_SHA && docker push $BACKEND_REPO:latest
docker push $FRONTEND_REPO:$GIT_SHA && docker push $FRONTEND_REPO:latest
```

### 9.3 ECS deployment

```bash
CLUSTER=iluase-prod
REGION=us-east-1

# Register a new task definition revision pointing at the new image
# (fetch current task def, patch the image, re-register — repeat per service)
aws ecs describe-task-definition --task-definition iluase-backend --region $REGION \
  --query 'taskDefinition' > /tmp/backend-taskdef.json
# edit /tmp/backend-taskdef.json: set containerDefinitions[0].image to $BACKEND_REPO:$GIT_SHA,
# strip taskDefinitionArn/revision/status/requiresAttributes/compatibilities/registeredAt/registeredBy
aws ecs register-task-definition --cli-input-json file:///tmp/backend-taskdef.json --region $REGION

# Roll the service to the new revision (rolling deployment, respects deployment circuit breaker if configured)
aws ecs update-service --cluster $CLUSTER --service iluase-backend --force-new-deployment --region $REGION
aws ecs update-service --cluster $CLUSTER --service iluase-frontend --force-new-deployment --region $REGION

# Watch rollout status
aws ecs wait services-stable --cluster $CLUSTER --services iluase-backend iluase-frontend --region $REGION
echo "Deployment stable"

# Run migrations as a ONE-OFF task, separate from container boot (see Section 4 recommendation)
aws ecs run-task \
  --cluster $CLUSTER \
  --task-definition iluase-backend \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<private-subnet-1>,<private-subnet-2>],securityGroups=[<ecs-sg>],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"backend","command":["npx","prisma","migrate","deploy"]}]}' \
  --region $REGION
```

### 9.4 EC2 deployment option (staging, or a simpler single-box production alternative)

```bash
# One-time box setup
ssh -i ~/.ssh/iluase-key.pem ubuntu@<EC2_HOST> 'bash -s' < scripts/ec2-setup.sh

# Every subsequent deploy
ssh -i ~/.ssh/iluase-key.pem ubuntu@<EC2_HOST> << 'EOF'
  cd /home/ubuntu/ifa_app
  git pull origin main
  docker compose -f docker-compose.staging.yml pull
  docker compose -f docker-compose.staging.yml up -d --build
  sleep 5
  curl -sf http://localhost:3000/api/health || echo "WARNING: health check failed"
EOF
```

### 9.5 RDS setup

```bash
REGION=us-east-1

# Subnet group (private subnets only — never expose RDS publicly)
aws rds create-db-subnet-group \
  --db-subnet-group-name iluase-prod-subnet-group \
  --db-subnet-group-description "Ilu Ase production RDS subnet group" \
  --subnet-ids <private-subnet-1> <private-subnet-2> \
  --region $REGION

# Multi-AZ Postgres 16 instance, encrypted, private
aws rds create-db-instance \
  --db-instance-identifier iluase-prod-postgres \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 16 \
  --master-username production_admin \
  --master-user-password "$(aws secretsmanager get-random-password --password-length 32 --exclude-punctuation --query RandomPassword --output text)" \
  --allocated-storage 50 \
  --storage-type gp3 \
  --multi-az \
  --storage-encrypted \
  --backup-retention-period 7 \
  --db-subnet-group-name iluase-prod-subnet-group \
  --vpc-security-group-ids <rds-sg> \
  --no-publicly-accessible \
  --region $REGION

aws rds wait db-instance-available --db-instance-identifier iluase-prod-postgres --region $REGION

# Store the connection string in Secrets Manager, never in a committed .env
aws secretsmanager create-secret \
  --name iluase/prod/connection-strings \
  --secret-string '{"DATABASE_URL":"postgresql://production_admin:<password>@<rds-endpoint>:5432/ilu_ase_production?schema=public&connection_limit=10&pool_timeout=10&sslmode=require"}' \
  --region $REGION

# Apply migrations (run once, from CI or the one-off ECS task in 9.3 — never from a laptop against prod)
cd backend && DATABASE_URL="<from-secrets-manager>" npx prisma migrate deploy
```

### 9.6 Route 53 configuration

```bash
ZONE_ID=Z07007663AAOEO6PNL4GK   # existing iluase.com hosted zone

# Point apex + www at the ALB via alias records (no CNAME at the apex)
cat > /tmp/route53-change.json << 'EOF'
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "iluase.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "<ALB-hosted-zone-id>",
          "DNSName": "iluase-prod-alb-972942739.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.iluase.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "<ALB-hosted-zone-id>",
          "DNSName": "iluase-prod-alb-972942739.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch file:///tmp/route53-change.json
```

### 9.7 SSL setup (ACM + ALB listener)

```bash
REGION=us-east-1

# Request a wildcard cert covering apex + all subdomains, DNS-validated
aws acm request-certificate \
  --domain-name iluase.com \
  --subject-alternative-names "*.iluase.com" \
  --validation-method DNS \
  --region $REGION

# Get the DNS validation CNAME record ACM wants, then create it in Route 53
aws acm describe-certificate --certificate-arn <cert-arn> --region $REGION \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord'
# → create that CNAME in the iluase.com hosted zone (same pattern as 9.6), then:
aws acm wait certificate-validated --certificate-arn <cert-arn> --region $REGION

# Attach to the ALB's HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS --port 443 \
  --certificates CertificateArn=<cert-arn> \
  --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \
  --default-actions Type=forward,TargetGroupArn=<frontend-target-group-arn>

# HTTP → HTTPS redirect listener
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP --port 80 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'
```
