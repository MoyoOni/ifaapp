> ⚠️ **SUPERSEDED as of July 28, 2026** — see [`ILUASE_V1_BACKLOG.md`](ILUASE_V1_BACKLOG.md)'s ⚪ "Needs a Human" section for the current consolidated list. This doc's full context/reasoning per item is still the place to read for detail; its open items as of July 26, 2026 are all carried forward there.

# Human Backlog

Things that came up during recent work that need a human — an external console,
a credential only you hold, a product/business call, or a real browser to click
through. Everything here is **not code I can fix myself**; the code-side fixes
that prompted these items are already done and verified where noted.

Last updated: 2026-07-26

---

## ✅ 2026-07-26: Vendor escrow creation required the customer's internal wallet balance — vendors were never actually paid

Follow-up to the entry directly below this one. That fix made the Paystack
webhook correctly reach `processSuccessfulPayment` → `processMarketplaceOrderPayment`
for `MARKETPLACE_ORDER` payments — described there as "fully-correct." It
wasn't: `processMarketplaceOrderPayment` calls `WalletService.createEscrow`
to hold the vendor's payout, and `createEscrow` requires the **depositor's
own internal wallet balance** to already contain the escrow amount, then
decrements it. That's correct for BOOKING/TUTOR_SESSION/GUIDANCE_PLAN
escrows (customers really do fund those from wallet balance) — it's wrong
for `MARKETPLACE_ORDER` escrows, where the money came from an external
Paystack charge and never touched the customer's wallet at all. A fresh
wallet defaults to balance 0, so `createEscrow` throws `Insufficient funds`
on essentially every real order. That error was silently swallowed by
`processMarketplaceOrderPayment`'s per-order `try/catch`, so the order still
showed `PAID` to the customer — but no escrow was ever created, meaning the
vendor was never actually paid, with no error surfaced to anyone.

Found while building `VENDOR_BACKLOG.md`'s VND-010 (returns/refunds), which
needed to reverse an order's escrow hold on refund — tracing that logic
back to how the escrow was created in the first place surfaced this.
Flagged to the user before fixing, same reasoning as the entry below: real
money, already live (my own earlier fix this session was what made this
code path reachable from the live webhook in the first place).

Fixed:
- `WalletService.createExternallyFundedEscrow(userId, dto)` — new method,
  creates the same `HOLD` escrow row as `createEscrow` but skips the
  wallet-balance check/decrement and the misleading debit `Transaction`
  entirely (the `Payment` row and `Order.paidAt` already carry the audit
  trail for where the money came from). `processMarketplaceOrderPayment`
  now calls this instead of `createEscrow`.
- `WalletService.refundMarketplaceOrder(orderId, customerId, refundAmount, currency, refundedBy)`
  — new method. `MarketplaceService.refundOrder` previously only flipped
  the `Order` row's `status`/`refundAmount` fields; **no money ever
  actually moved** on a refund, for any order, ever. Now cancels the
  order's escrow if still `HOLD` (so the vendor can't later be paid out for
  a refunded order) and credits the customer's wallet with the real refund
  amount — works correctly for partial refunds too, and is safe to call on
  orders that predate this fix (no escrow existed for those; it just
  credits the wallet directly).
- Known, documented simplification: if the escrow is `PARTIALLY_RELEASED`
  (a shipped/delivered tier already paid out to the vendor before the
  refund), that portion is left alone — recovering money already paid to a
  vendor is a manual payout-deduction operation, out of scope here. The
  customer is still made whole via the direct wallet credit either way.
- 6 new backend unit tests across `wallet.service.spec.ts` (both new
  methods) and `marketplace.service.spec.ts` (`refundOrder` calls the new
  method with the right args, full and partial refund amounts), plus the
  `payments.service.spec.ts` assertion updated to check for
  `createExternallyFundedEscrow` instead of `createEscrow`.

---

## ✅ 2026-07-26: Marketplace card payments were silently crediting buyer wallets instead of paying orders

Discovered while auditing `VENDOR_BACKLOG.md`'s VND-004 (vendor sales
notifications) — checking whether "order payment confirmed" notifications
actually fire led straight to this. **This was live in production**: any
marketplace order paid via real Paystack card checkout never actually got
marked as paid.

Root cause: `PaymentsService.handlePaystackWebhook`'s `charge.success` handler
treated **every** successful charge as a wallet top-up, unconditionally,
regardless of `metadata.purpose`. A `MARKETPLACE_ORDER` payment's money went
into the buyer's wallet balance instead of marking their order `PAID` — the
order stayed `PENDING` forever, the vendor was never notified, and no escrow
was ever created. The purpose-aware completion logic
(`processSuccessfulPayment`'s `MARKETPLACE_ORDER`/`BOOKING`/etc. switch,
including a fully-correct `processMarketplaceOrderPayment` that marks the
order PAID, creates the 50/50-tier vendor escrow, and notifies both
customer and vendor) already existed — but it was only reachable via the
admin-only `manuallyVerifyPayment` action, because **nothing ever created a
`Payment` database row for a real gateway-initiated payment** for this to
look up. It had no way to fire from a live webhook.

Fixed, scoped narrowly to the confirmed bug (not the untouched/unverified
BOOKING/COURSE_ENROLLMENT cases, which weren't reported or audited here):
- `PaymentsService.initializePayment` now creates a `Payment` row (status
  `PENDING`) when `purpose === MARKETPLACE_ORDER`, keyed by the gateway
  reference, before redirecting to Paystack.
- `handlePaystackWebhook`'s `charge.success` handler now checks
  `metadata.purpose` first: for a `MARKETPLACE_ORDER` with a matching
  `Payment` row, it marks the row `success` and calls the existing
  `processSuccessfulPayment` dispatch (idempotent — a replayed webhook
  delivery for an already-`success` row is a no-op). Anything else (no
  matching row, or any other purpose) falls through to the **exact same**
  wallet-deposit code that ran before this fix — zero behavior change for
  wallet top-ups or any other payment purpose.
- `InitializePaymentDto.relatedId` was `@IsUUID()`, which would have
  rejected marketplace checkout's comma-joined multi-vendor order-id list
  outright (`processMarketplaceOrderPayment` already expected and split on
  commas) — relaxed to `@IsString()` so the fix actually works for
  multi-vendor carts, not just single-vendor ones.
- 6 new backend unit tests: Payment-row creation on initialize, correct
  order/escrow/notification side effects on webhook, idempotent replay, and
  the legacy-fallback path for non-order payments.

Flagged to the user directly before fixing, given the severity (real money,
already live) and that it required touching the core payment webhook —
fixed only after explicit go-ahead, not fixed silently mid-backlog-sweep.

---

## ✅ 2026-07-09: AWS cost audit — cut ~$36/month (over half of total spend)

Asked to minimize AWS cost. Pulled real Cost Explorer data rather than
guessing, broke it down by usage type, and verified each finding before
touching anything (checked DNS records, network interfaces, VPC endpoints,
IAM policy, and app source code for actual runtime usage before deleting or
keeping each item).

**Deleted (with explicit per-resource confirmation):**

- **NAT Gateway `nat-0be36c09489eeae80`** — ~$32.40/month, by far the single
  largest line item on the whole bill. Served two private subnets
  (`subnet-0e9abfd04b5fb760d`, `subnet-0788046c003a849fb`) with **zero**
  network interfaces in them and no VPC endpoints depending on it — leftover
  from the abandoned ECS/multi-AZ architecture (see the production-redeploy
  section above: real production is a single EC2 box in a *public* subnet
  with direct Internet Gateway routing, not the private-subnet/NAT-gateway
  topology this was built for). Deleted.
- **Unattached Elastic IP `52.4.116.79`** — ~$3.60/month, attached to
  nothing, no DNS record anywhere referenced it (checked the full
  `iluase.com` hosted zone). Released.

**Verified as genuinely needed, left alone:**

- **Secrets Manager** (`iluase/prod/app-secrets`, `iluase/prod/connection-strings`,
  ~$0.80/mo combined) — almost flagged as ECS-era leftovers, but
  `paystack-api.service.ts` and `sentry-initializer.service.ts` actively call
  `secretsService.getSecret(...)` against these at runtime, for every payment
  and every error report. Deleting them would have broken live payments.
- **Route53 health checks** (2 checks, ~$2/mo) — both correctly point at the
  real live endpoint (`https://iluase.com/api/health`), not a dead ALB.
  Working as intended.
- **RDS snapshot** `iluase-prod-final-snapshot-20260325` (20GB, ~$0.27/mo) —
  left untouched without asking; looks like the final backup taken when the
  real RDS instance was decommissioned in favor of the self-hosted Postgres
  setup, and deleting a database backup isn't a call to make unilaterally.
  Small enough to not matter much either way — flagging in case it's no
  longer wanted.
- EC2 compute (~$15/mo), EBS volume (~$1.60/mo), S3/ECR storage (~$0.70/mo),
  Route53 hosted zone (~$0.50/mo) — all directly needed for the one real
  production box.

**Result:** verified via `describe-addresses`/`describe-nat-gateways` that
both are fully gone, and confirmed `https://iluase.com/` still returns 200
immediately after (expected — the deleted resources had zero dependents).
Estimated total AWS spend drops from ~$60/month to ~$24/month.

**Considered and declined: EC2 Savings Plan.** Pulled exact rates from AWS's
live Savings Plans rate card for `BoxUsage:t3.small`/`Linux/UNIX` in
us-east-1 (confirmed on-demand baseline: $0.0208/hr, ~$15.19/mo):

| Term | Payment | Rate/hr | Monthly | Savings | Upfront |
|---|---|---|---|---|---|
| 1yr | No Upfront | $0.0150 | $10.96 | 28% | $0 |
| 1yr | All Upfront | $0.0140 | $10.23 | 33% | $122.76 |
| 3yr | No Upfront | $0.0103 | $7.52 | 50% | $0 |
| 3yr | All Upfront | $0.0094 | $6.87 | 55% | $247.32 |

AWS's own `get-savings-plans-purchase-recommendation` returned **empty** for
this account — its confidence algorithm doesn't consider there's enough
stable usage history yet to recommend a purchase, which lines up with
tonight's bigger finding that the documented production architecture
doesn't match what's actually running. Presented all four options; decided
to stay on-demand rather than lock in a 1-3 year commitment on
infrastructure that might legitimately change. Revisit once the
single-EC2-box-vs-proper-multi-AZ architecture question (above) is settled
and usage has been stable for a while.

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

- [x] **Withdrawal approval doesn't move real money and has a double-spend
  gap.** — **FIXED July 26, 2026.** This was a bigger fix than it looked:
  the intake form (`payout-management.tsx`) was also sending a nested
  `bankDetails: {...}` body while the backend DTO expected flat fields — the
  global `ValidationPipe`'s `whitelist: true` silently stripped it, meaning
  **every withdrawal request ever filed through that form had no bank
  details captured at all**, on top of the missing debit/transfer logic.
  Fixed the whole pipeline:
  - `WalletService.createWithdrawalRequest` now holds funds atomically at
    request time (the EMG-06 conditional-decrement pattern: `balance: {
    gte: amount }` checked and applied in one `updateMany`, closing the
    double-spend gap) instead of only checking balance and leaving the
    wallet untouched.
  - Added `bankCode` to `WithdrawalRequest` (migration `20260726140224`) —
    a Paystack transfer needs the bank's numeric code, not a free-typed
    name, which is all the form used to collect.
  - `PaystackApiService` gained `listBanks()`, `createTransferRecipient()`,
    and `initiateTransfer()` (real Paystack Transfer API calls, using the
    existing retry-on-network-failure-only policy for the mutating calls —
    same conservative philosophy as `createRefund`). New `GET
    /payments/banks` endpoint backs a real bank-picker dropdown in the
    withdrawal form (replacing the free-text bank name field).
  - `AdminFinanceService.processWithdrawal` now actually calls Paystack on
    APPROVE and refunds the held amount (via a new
    `WalletService.refundWithdrawalAmount`) on REJECT or on any Paystack
    failure — previously it only flipped `status` to the literal strings
    `'APPROVE'`/`'REJECT'` (not even the real `WithdrawalStatus` enum
    values). A failed Paystack call now refunds the hold and puts the
    request back to `PENDING` for retry, rather than silently pretending
    success.
  - Added `transfer.success`/`transfer.failed`/`transfer.reversed` webhook
    handling in `payments.service.ts` to reconcile transfers that Paystack
    completes asynchronously rather than in the initial API response
    (idempotent — a repeated webhook delivery after the first refund is a
    no-op).
  - `payout-approvals-view.tsx` (admin) previously had no error handling on
    the approve/reject mutation — a failed approval looked identical to a
    successful one. Now surfaces the failure via toast.
  - 44 new backend unit tests across `wallet.service.spec.ts`,
    `admin-finance.service.spec.ts`, `payments.service.spec.ts`, and
    `paystack-api.service.spec.ts`.
  - **Not built**: OTP finalization for Paystack accounts with "OTP for
    API-initiated transfers" enabled — this platform has no OTP-entry UI,
    so that Paystack account setting needs to stay disabled for this flow
    to work unattended. That's a Paystack dashboard configuration decision,
    not something fixable in code.

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
  request flow. **The withdraw half is now actually wired up** — see the
  withdrawal item at the top of the 🔴 Blocking section above (fixed July 26,
  2026) — so this decision now genuinely delivers real money, not just an
  in-app number.

- [x] **Admin-cancelled subscriptions don't cancel the Paystack recurring
  charge.** — **FIXED July 26, 2026.** Turned out to be two bugs, not one:
  (1) the admin path (`AdminFinanceService.cancelSubscriptionById`) never
  touched Paystack at all, only the local DB row; (2) the self-service path
  (`SubscriptionsService.cancelSubscription`) *did* call Paystack, but with
  the wrong `token` value — it passed the subscription code as both `code`
  and `token`, when Paystack's `/subscription/disable` actually requires a
  separate `email_token` from the original `subscription.create` webhook,
  which was never being stored. So the self-service path would have silently
  failed against the real API too. Fixed by: adding `paystackEmailToken` to
  the `Subscription` model (migration `20260726135131`), storing it from the
  webhook payload, adding a real `disableSubscription()` method to
  `PaystackApiService` (using its existing retry/timeout-configured client
  instead of a raw unguarded `fetch()`), and extracting a shared
  `disablePaystackSubscription()` helper on `SubscriptionsService` that both
  the self-service and admin cancel paths now call. Gracefully no-ops (with
  a warning log) for pre-existing subscription rows that predate this fix
  and have no stored email token. 12 new unit tests across
  `subscriptions.service.spec.ts` and `admin-finance.service.spec.ts`.

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
