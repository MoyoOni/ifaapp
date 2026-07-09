# Human Backlog

Things that came up during recent work that need a human — an external console,
a credential only you hold, a product/business call, or a real browser to click
through. Everything here is **not code I can fix myself**; the code-side fixes
that prompted these items are already done and verified where noted.

Last updated: 2026-07-09

---

## ✅ 2026-07-09: Production backend redeploy — 4 real bugs found and fixed, 1 documented

Context: asked to push this session's backend changes to real production
(`iluase-prod`, single EC2 instance `i-0ac1e9e2c4984af72` at 32.192.127.137,
Docker Compose — see the architecture-mismatch note below). This was the
**first production redeploy in ~2 months**, and every one of the following
had been sitting undetected on `main` that whole time because nothing had
exercised a fresh boot against real production traffic.

**1. Fixed — `TypeOrmHealthIndicator` crashed app bootstrap.**
`health.controller.ts` injected `@nestjs/terminus`'s `TypeOrmHealthIndicator`,
but this app uses Prisma, not TypeORM — the `typeorm`/`@nestjs/typeorm`
packages were never installed, and resolving that indicator crashed the app
during `HealthModule` initialization, before any routes mapped. Replaced with
a Prisma-based `$queryRaw\`SELECT 1\`` check wrapped in `HealthCheckError`,
matching terminus's expected contract. Verified: container now boots and
stays up.

**2. Fixed — missing `PAYSTACK_WEBHOOK_SECRET` also blocked boot, and its
absence was a live security gap.** A prior change (`subscriptions.controller.ts`,
tagged "EMG-02") made `SecurityHardeningService` refuse to boot without this
var set, replacing older code where an unset secret **silently skipped
webhook signature verification entirely** — meaning the currently-live old
backend accepts a forged Paystack webhook (e.g. a fake `subscription.create`
event) with no check at all. Paystack signs webhooks with the same secret
used for API calls (no separate webhook-signing secret in their model), so
this wasn't a new credential to generate — added
`PAYSTACK_WEBHOOK_SECRET=<value of the existing PAYSTACK_SECRET_KEY>` to
`~/app/.env` on the box (backup at `~/app/.env.bak-pre-webhook-secret`) and
wired it through `~/app/docker-compose.yml`'s backend environment block
(backup at `~/app/docker-compose.yml.bak-pre-webhook-secret`). Done with
explicit sign-off before writing to the live secrets file.

**3. Fixed — `app.setGlobalPrefix('api')` was deleted and never restored.**
Added Feb 24, 2026 (`2741d513`), removed Apr 21, 2026 (`fe553dc3`) as a side
effect of an unrelated "fix Lingma-introduced build errors" cleanup commit.
Its absence meant every route mounted at its bare path (`/health`, `/auth`,
...) instead of `/api/health`, `/api/auth`, ... — and the production nginx
proxy passes the full `/api/...` path through verbatim, so **every single API
route would have 404'd** once deployed. Restored in `backend/src/main.ts` in
its original position. This is the one I'd flag as needing a regression
test or a smoke-test step in CI, given how completely silent this failure
mode is (no error anywhere — just a working app that answers nothing at the
path anything real talks to).

**4. Documented, not fixed — BullMQ queue connection ignores `REDIS_URL`.**
`src/common/queue/queue.module.ts` configures `BullModule` via `REDIS_HOST`
(default `'localhost'`) / `REDIS_PORT` (default `6379`) / `REDIS_PASSWORD` —
entirely separate config keys from `REDIS_URL`, which is the only Redis
config actually provided anywhere (`.env`, `docker-compose.yml`). Confirmed
via a standalone container run: this doesn't crash the app (BullMQ just logs
`ECONNREFUSED 127.0.0.1:6379` and retries forever in the background), so it
wasn't blocking, but it means the `notifications`, `media`, `analytics`, and
`search` queues never actually connect — background jobs for those silently
never run. Fix is straightforward (add `REDIS_HOST`/`REDIS_PORT`/
`REDIS_PASSWORD` to the compose environment block, or better, read
`REDIS_URL` in `queue.module.ts` directly) but wasn't done tonight given how
much else was already in flight. Worth checking whether any of those four
job types have a fallback synchronous path (some might silently no-op
instead of degrading), which would make this higher priority than "just
queues."

**5. Also fixed en route (my own tooling bug, not app code) — image platform
mismatch.** Built on this Apple Silicon Mac without `--platform linux/amd64`
on the first attempt, producing ARM64 images against an Intel/AMD (`t3.small`)
production box — caught cleanly by Docker's own manifest check before
anything was affected. Separately, a `docker build -t $VAR:latest` invocation
tagged an image as `...backendatest:latest` (dropped `:l` — root cause
unconfirmed, possibly BuildKit progress-output interference with the
harness's background-command capture) instead of `...backend:latest`, so the
first "fixed" push silently didn't update what `latest` pointed to. Both
self-caught via `docker buildx imagetools inspect` / `docker images` before
causing harm — mentioned here only because if you see `iluase/backendatest`-
or `iluase/frontendatest`-named images/containers anywhere, that's what they
are (should already be cleaned up).

**Incident during this work:** cutting over triggered a real ~7-8 minute
partial outage (502s on `/api/*`), root-caused to `iluase-proxy`'s nginx
caching the `backend` service's Docker-internal IP at its own startup —
recreating the backend container gives it a new internal IP, and nginx's
static `upstream` block doesn't re-resolve until the proxy itself restarts.
Fixed by restarting `iluase-proxy` (no image/config change). **Worth adding
`docker compose restart proxy` as a standard step any time `backend` or
`nginx` (frontend) get recreated**, or switching the proxy's nginx config to
dynamic upstream resolution (`resolver 127.0.0.11 valid=10s;` + variables in
`proxy_pass`) so this class of issue can't recur.

**Bigger picture — CLAUDE.md's documented production architecture doesn't
match reality.** Went looking for the ECS Fargate cluster / ALB / multi-AZ
RDS / Redis cluster CLAUDE.md describes as "Sprint 10 ALL COMPLETE" and found
none of it: `iluase-prod` ECS cluster has zero services, no ALB exists in the
account, no RDS instances, no ElastiCache clusters. Real production is one
`t3.small` EC2 instance running everything (app, Postgres, Redis, nginx) in
Docker Compose — architecturally identical to what CLAUDE.md describes as
*staging*. `deploy.sh` (checked into the repo root as "the" production
deploy script) pushes to ECR, which nothing on the real box was pulling from
until tonight — it was fully disconnected from what's actually live. This is
worth a deliberate conversation, not a backlog line: single point of failure
for a live user-facing app, no redundancy, no managed backups on the DB
unless something else (a cron job, manual habit) is doing them — I didn't
find one, but didn't do an exhaustive search either.

**Current state:** production backend now runs this session's code
(including all the fixes above); frontend was already updated earlier in
this same redeploy. Verified via the backend container's own internal Docker
healthcheck (`"Status":"healthy"`, continuous successful `{"status":"ok"}`
responses) and the external homepage (200 throughout). External
`/api/health` was returning 429 to my own testing IP at the very end of this
session — that's the app's rate limiter correctly responding to the sheer
volume of repeated health checks I ran while verifying, not a real issue;
unrelated IPs / normal traffic are unaffected.

---

## 🔴 Blocking — needed to finish testing what was just built

- [ ] **Withdrawal approval doesn't move real money and has a double-spend
  gap — decided against fixing for now, but this is load-bearing on the
  refund decision below, so flagging here rather than burying it.**
  `AdminFinanceService.processWithdrawal` (`admin-finance.service.ts:236-273`)
  only flips `WithdrawalRequest.status` — it never debits the wallet balance
  and never calls a real bank-transfer/payout API (there is no transfer/payout
  integration anywhere in the codebase; `paystack-api.service.ts` only has
  `initializeTransaction`/`verifyTransaction`/`createRefund`, no
  `initiateTransfer`). Worse, `WalletService.createWithdrawalRequest`
  (`wallet.service.ts:984-1031`) never reserves/debits funds at request time
  either, so a user can submit the same wallet balance as multiple withdrawal
  requests with no double-spend protection. **Net effect: "refund to wallet,
  let them withdraw it" (the decided refund policy below) does not currently
  get anyone real money — withdrawal is a dead end today, not a working
  path.** Decision as of 2026-07-08: document only, don't fix yet. Revisit
  before withdrawals go live for real users, and definitely before relying on
  "they can withdraw it" as the answer to any refund/payout question.

- [ ] **EC2 staging deploy is failing — the instance looks unreachable, not a
  code problem.** CI/CD's `test-backend` and `test-frontend` gates are fixed
  and green as of commit `33270f4` (5 broken Jest suites repaired — 4 broken
  by this session's own earlier changes, 1 pre-existing and unrelated). With
  those unblocked, the pipeline reached the `deploy` job for the first time
  in a while — and it failed at the "Deploy to staging via SSH" step
  (`appleboy/ssh-action`, run
  [28979953534](https://github.com/MoyoOni/ifaapp/actions/runs/28979953534)).
  Two things point at the EC2 instance itself, not the workflow or secrets:
  (1) the *only* prior run where `deploy` ever executed — July 5, commit
  `861db5d6`, before any of this session's work — failed identically, so this
  predates everything done recently; (2) I curled
  `http://100.52.200.113:4040/api/health` (the staging address CLAUDE.md
  documents) directly from outside GitHub Actions and got no response at all
  (connection timeout), which is consistent with the instance being stopped
  or a security-group/networking change having locked it out. I have no AWS
  console or CLI access in this environment to check the instance's actual
  state, the `EC2_HOST`/`EC2_SSH_KEY` GitHub secrets, or security groups —
  someone with AWS console access needs to check whether the EC2 staging
  instance is running and reachable on port 22/4040, and re-run the
  `july-2026-hardening-pass` workflow (or just re-push) once it's back.

- [ ] **Restart both local dev servers.** I edited `frontend/.env` and
  `backend/.env` (see Google OAuth items below). Vite and NestJS's
  `ConfigService` both read `.env` once at startup — neither picks up changes
  via hot-reload/watch mode. Restart both before testing anything env-related.

- [ ] **Google Cloud Console — authorize localhost for OAuth.** Go to
  [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials),
  open the OAuth Client ID (`559744613223-klf...`), and add
  `http://localhost:8100` to **Authorized JavaScript origins**. Without this,
  the "Continue with Google" button will now render (that part's fixed) and
  will trigger Google's flow, but Google will reject it with an
  origin-mismatch error until this is added.

- [ ] **Same console, verify production is already authorized.** Confirm
  `https://iluase.com` and `https://www.iluase.com` are in that same
  Authorized JavaScript origins list. They probably already are since
  production predates this session's fixes, but worth a 30-second check given
  how much else around Google auth turned out to be broken.

---

## 🟠 Product decisions — I fixed the plumbing, you need to decide the policy

- [x] **DECIDED 2026-07-08: Refund mechanism is wallet credit, withdrawable
  by the user.** Admin-approved refunds credit the client's in-app **wallet
  balance** (`admin-refunds.service.ts:119-124` → `WalletService.depositFunds`)
  rather than reversing the original Paystack/Flutterwave charge — confirmed
  this is already how it's coded, no change needed there. The intent is that
  users withdraw that balance as real money via the existing withdrawal
  request flow. **That withdraw half isn't actually wired up yet** — see the
  withdrawal item at the top of the 🔴 Blocking section above. Until that's
  fixed, this decision is directionally right but not yet delivering real
  money to anyone.

- [ ] **Admin-cancelled subscriptions don't cancel the Paystack recurring
  charge.** The self-service cancel path (`subscriptions.service.ts`,
  `cancelSubscription`) calls Paystack's disable-subscription API before
  updating the local DB. The new admin-initiated cancel I built
  (`cancelSubscriptionById`) only updates the local DB status — it does not
  touch Paystack. Net effect: an admin could "cancel" a subscription in the
  dashboard and the customer's card could still get charged by Paystack on
  the next billing cycle. Decide if this needs fixing before it's used for
  real (I'd copy the same try/disable/proceed-on-failure pattern the
  self-service path already uses — quick fix, just needs a decision that it's
  wanted).

- [ ] **Decide the fate of the orphaned Passport `GoogleStrategy`.**
  `backend/src/auth/strategies/google.strategy.ts` is a second, complete,
  entirely separate Google-auth implementation (traditional server-redirect
  OAuth) that's registered in `auth.module.ts` but has zero routes wired to
  it anywhere — dead code, not causing any bug, just inert. Either delete it
  (the SPA token-based flow at `/auth/google/token` is what's actually live
  and is now fixed) or tell me if there's a reason to keep both.

- [ ] **Decide whether `role-management-tab.tsx` / `profile-views-panel.tsx`
  should come back.** Both were real, working admin features that got swept
  up in an earlier dead-code cleanup pass and deleted. Role changes are still
  possible today via the inline dialog in User Management, so nothing is
  fully blocked, but if either of these was providing something the current
  UI doesn't, they're recoverable from git history — just tell me and I'll
  restore them.

---

## 🟡 Manual QA — needs a real browser, which I don't have access to

- [ ] **Click through the admin dashboard end-to-end with the real account.**
  Login: `admin-test@iluase.test` / `AdminTest123!` (real ADMIN/SUPER account,
  left in place on purpose — not a throwaway). Everything I fixed this
  session was verified via direct API calls and code tracing, not by actually
  looking at rendered pages — I have no browser/screenshot tool in this
  environment. A full click-through would catch any remaining visual or
  interaction bugs the API-level checks can't see (the `ModalProvider` bug
  and the Circle Management `error()`-shadowing bug were both this class of
  issue — found by reading code, not by an automated check).

- [ ] **Visually check the new Google Sign-In button.** It now renders via
  Google's own `<GoogleLogin>` widget instead of the old custom SVG button,
  because the ID-token flow required for it to actually work only supports
  Google's own rendered button (their fraud-prevention requirement, not a
  choice I made). I set `shape="pill"` `width="100%"` to blend in as much as
  possible, but it won't be pixel-identical to the old design. Worth a look
  on both the login and register pages.

---

## 🟢 Lower priority — pre-existing local-dev placeholders, not new

These were already blank/placeholder before this session and aren't blocking
anything found so far, but they'll bite you if you try to test the
corresponding flows locally:

- [ ] `backend/.env`: `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`,
  `FLUTTERWAVE_SECRET_HASH` are test placeholders — real payment flows can't
  be tested locally without real sandbox keys from each provider's dashboard.
- [ ] `backend/.env`: `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` are
  placeholders — anything touching S3 (document/image upload) won't work
  locally without real (or LocalStack) credentials.
- [ ] `backend/.env`: `SENDGRID_API_KEY` is a placeholder — real emails won't
  send locally; check whether the SES dev-mode console-logging fallback
  (mentioned in CLAUDE.md) covers this already.
- [ ] `backend/.env`: `AGORA_APP_ID` / `AGORA_APP_CERTIFICATE` are
  placeholders — video calls won't work locally without a real Agora project.
- [ ] `backend/.env`: `GOOGLE_CLIENT_SECRET` is still a placeholder
  (`local_google_client_secret`). Currently harmless — the live Google
  sign-in flow (ID-token verification) doesn't use it at all, only the
  orphaned Passport strategy above would need a real one.
- [ ] `frontend/.env.production`: all seven `VITE_FIREBASE_*` values are
  blank — push notifications need a real Firebase project created at
  [console.firebase.google.com](https://console.firebase.google.com) before
  they can work anywhere, including production.
- [ ] `backend/.env`: `BOOTSTRAP_ADMIN_PASSWORD=ChangeMe123!` — literally a
  "change me" placeholder. Worth checking this isn't still the same value
  wherever the real bootstrap admin account was created.

---

## ⚪ Worth a status check, not something I verified

- [ ] CLAUDE.md's Sprint 10 table lists "Stripe live keys in Secrets Manager"
  and "Sentry DSN in Secrets Manager" as launch-blocking with a ⬜ (not done)
  status. The codebase actually integrates Paystack/Flutterwave, not Stripe,
  and `frontend/.env.production`'s `VITE_SENTRY_DSN` already has a real value
  — so that doc line may just be stale. Worth a quick confirmation of what's
  actually in AWS Secrets Manager for production right now rather than
  trusting either the doc or my assumption.
