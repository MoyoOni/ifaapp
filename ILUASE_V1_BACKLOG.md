# Ìlú Àṣẹ V1 Backlog — The Single Source of Truth

**This is now the only backlog doc to read for "what's left."** Every other `*_BACKLOG.md`/`ProBacklog-v1.md` file in this repo is superseded as of July 28, 2026 — each has a banner at its own top pointing back here. They're kept for historical detail (file:line references, the reasoning behind past decisions) but none of them should be used to decide what to work on next. This one is.

**How this doc was built:** six parallel extraction passes (one per source-doc group) pulled every item each source doc itself describes as not-done, plus one doc (ADMIN_BACKEND_GAPS_BACKLOG.md) that had already independently re-verified a whole domain against live code. A handful of items (marked 🔵 **verified this session**) were personally checked against the running code by direct inspection, not just extracted from a doc's own claim. Everything else is marked 📄 **as claimed by source doc** — trustworthy in that it's what the most recent status note in that doc says, but not re-verified against code in this pass. Given this platform's history of stale "✅ DONE" claims turning out to be wrong once someone actually checked, treat 📄 items as "probably true, worth a 5-minute spot-check before relying on it," not gospel.

**Story IDs are preserved** from their original docs (ADM-XXX, VND-XXX, MSP-XXX, FOR-XXX, EXP-XXX, Z1-XXX, V8-XXX, V5-XXX, F9-XXX, P0/P1/P2/P3-XX) so you can still search a source doc for the full original write-up if you need more detail than the one-liner here.

---

## 🚨 Priority Reading Order

1. **🔴 Critical — Money & Security** — read this section first, always.
2. **🟠 Structural / Tech Debt** — the platform's foundations; several of these make everything else riskier.
3. **🟡 Feature Gaps by Domain** — organized the way you'd actually pick up work: by area of the app.
4. **⚪ Needs a Human** — nothing here is code work; these are blocked on credentials, business calls, or a real browser.
5. **🔵 Deliberately Deferred / Long-Term** — greenfield ideas explicitly parked, not oversights. Skim, don't panic.
6. **✅ What's Actually Fully Done** — so you don't re-litigate it.
7. **📚 Source Document Index** — where each item above came from, and each doc's superseded-banner status.

---

## 🔴 CRITICAL — Money & Security

- **Marketplace commission is never actually deducted from any vendor payout.** `PlatformSettings.marketplaceCommissionPct` (10% default) is configured in the admin settings UI (ADM-014) and displayed in places, but no real money-movement code anywhere — not order creation, not escrow release, not payout processing — actually deducts it. Vendors currently receive 100% of order value; the platform takes 0% commission on every marketplace sale. This also blocks VND-026's tier-benefit half (can't give a "reduced commission" tier perk when there's no commission being charged at all) and affects VND-001/VND-003's earnings displays (both had to be rewritten to honestly show "not yet deducted" instead of a fabricated number). 📄 *(VENDOR_BACKLOG.md, cross-referenced under VND-001/003/026)*

- **14 admin-dashboard features are marked "✅ DONE / all tests passing" in ADMIN_BACKLOG.md but the backend endpoint they call literally 404s.** This was independently re-verified against live code by `ADMIN_BACKEND_GAPS_BACKLOG.md` (which explicitly warns not to trust ADMIN_BACKLOG.md's completion claims). The frontend UI for every one of these renders correctly and looks finished — the gap is invisible until you actually click the button:
  - **ADM-019** Segmented Email Campaigns — `GET/POST /admin/campaigns` etc. don't exist; the actual "resolve segment → send" mechanism is unresolved even in design.
  - **ADM-020** Promo Code & Discount System — `/admin/promos` CRUD doesn't exist.
  - **ADM-021** Referral Program Management — `/admin/referrals/*` doesn't exist (the underlying `Referral` data is real and used elsewhere, just no admin-facing routes).
  - **ADM-017** Community Recognition System — `/admin/community/stars`, badge award/revoke don't exist. Also a real field-name mismatch: frontend expects `badgeName`/`badgeSlug`, model has `badgeKey`/`reason`.
  - **ADM-015** Cultural Content Calendar — all 12 endpoints across Daily Words/Oral History/Sacred Calendar missing. Plus a mismatch: frontend sends `publish: boolean`, model only has `publishedAt: DateTime?`.
  - **ADM-016** Featured Content Management — `/admin/featured-content` endpoints missing (underlying `isFeatured`/`featuredUntil` fields do exist and match schema).
  - **ADM-025** Revenue Forecasting — `/admin/forecasting/revenue` doesn't exist. Also: no data source anywhere for `platformCostNgn` (operating cost) — needs a real `PlatformSettings` field, not a guess.
  - **ADM-018** Cultural Integrity Review Queue — queue/approve/reject/flag-rules CRUD all missing. Open design question: what should "reject" do to post visibility, and does the author get notified?
  - **ADM-024** Practitioner Leaderboard & Market Intelligence — `/admin/market-intelligence/*` doesn't exist.
  - **ADM-001** Morning Dashboard — `/admin/morning-brief` aggregator doesn't exist (depends on ADM-025/018/024 logic existing first).
  - **ADM-007** Featured Practitioners — endpoints missing (the `isFeatured`/`featuredOrder`/`featuredExpiry` User columns do exist).
  - **ADM-011** Financial Command Centre — `/admin/financial-command-centre` doesn't exist.
  - **ADM-008** Practitioner Complaint Handling — endpoints missing. Plus two response-shape mismatches: frontend status values (`PENDING/RESOLVED/DISMISSED`) vs. schema (`OPEN/UNDER_REVIEW/RESOLVED/DISMISSED`), and frontend expects `resolver: {name}` vs. the actual `resolvedBy` relation name.
  - **ADM-006** Practitioner Performance Dashboard — `/admin/practitioner-performance` doesn't exist. Open decision: exact Active/Quiet/Inactive/At-Risk thresholds are undefined anywhere.
  📄 *(ADMIN_BACKLOG.md vs. ADMIN_BACKEND_GAPS_BACKLOG.md — the gaps doc wins on conflict, per its own stated purpose)*

- **3 more admin features are partially real** — one action works, a companion listing/view endpoint doesn't:
  - **ADM-009/029** Trust Score — override action works; `GET /admin/trust-score-adjustments` listing doesn't exist.
  - **ADM-010** Inactive Practitioner Re-engagement — the query logic exists but is only used by a cron job, no controller route exposes it to the UI at all; two action endpoints don't exist.
  - **ADM-013** Subscription Management — cancel/extend/grant/reminder genuinely work; the three list endpoints (`/active`, `/cancelled`, `/failed-payments`) don't exist. *(Note: this specific gap was independently found and fixed as part of V8-402 this session — worth re-checking whether ADM-013's frontend now actually uses the same endpoint V8-402 built, or still points at something that doesn't exist.)*
  📄 *(ADMIN_BACKEND_GAPS_BACKLOG.md)*

- **2 admin stories contradict themselves within ADMIN_BACKLOG.md** (no independent code check, just the doc disagreeing with itself):
  - **ADM-004** Forum Category & Thread Management — summary tables say ✅ DONE, but the story's own detail section is headed "🟡 PARTIAL" and says thread-level admin actions (pin/unpin/lock/move/feature/delete-with-reason/merge) aren't built — only category CRUD is.
  - **ADM-030** Platform Settings Panel — summary says ✅ DONE, but a later note in the same doc instructs "add missing settings: feature flags, maintenance mode, welcome message, forum limits," implying only the commission-rate slice (ADM-014) is actually built.
  📄 *(ADMIN_BACKLOG.md, internal contradiction)*

- **No backend "ban user" endpoint exists at all**, despite CLAUDE.md documenting ADM-003 as a complete "suspension & ban system." `suspendedUntil`/`bannedAt`/`banReason` exist on the `User` model and are *read* elsewhere, but nothing anywhere ever *sets* them. 📄 *(ProBacklog-v1.md, P3-11 "found, not fixed" note)*

- **Money is still stored as `Float`, not `Decimal`, in 13+ tables.** Only `Wallet.balance` was converted this session (see the "money stored as Float" fix earlier in this project's history). Still `Float`: `Transaction.amount`, `Escrow.amount`, `WithdrawalRequest.amount`, `Order.totalAmount`, and fields on Product/Course/Appointment/GuidancePlan/TutorSession/Event/ForumTip/Payment/RefundRequest/PlatformSettings/PromoCode. `Float` arithmetic in JS can silently lose cents on every calculation that touches these fields. 📄 *(ProBacklog-v1.md, 🔴🔴 EXPLOITABLE NOW tier, item 15)*

- **Schema drift risk on `trustScore`.** Missing `trustScoreOverride*` columns, a `trustScore` type/default mismatch (actual column is `INTEGER`, schema says `Float @default(0.5)`), and a missing unique index on `notificationPreferencesId`. Deliberately not blind-fixed — a wrong migration here risks silently mis-scaling every user's trust score by 100x. Needs someone to manually reconcile schema vs. actual DB column types before writing the migration. 📄 *(ProBacklog-v1.md, P3-19)*

- **Unlimited free subscription-pause exploit — 🔵 verified and FIXED this session (July 27, 2026).** Listed here only so it's not accidentally "rediscovered" as still-open: `POST /subscriptions/pause` had zero repeat-call protection; fixed via a new `pausedAt` flag. See `V8_MONETISATION_BACKLOG.md`'s V8-503 for full detail. No action needed.

---

## 🟠 STRUCTURAL / TECH DEBT

All 📄 *(ProBacklog-v1.md)* unless noted — this doc is the platform's own code-quality/structural audit, distinct from feature backlogs.

- **Test coverage is still far below target.** P1-03 fixed the *broken build/tooling* (compile errors, 5 broken Jest suites), and is marked "done" for that — but the actual CI coverage gate only moved from 17/15/13/17% to **20/18/16/20%** (backend/frontend/branches/functions), nowhere near the 80%/60%/20+E2E target this item and the old V2 backlog both set. "Done" here means "the tooling works," not "coverage is adequate."
- **No DTO/serialization layer.** P0-04 shipped a global `SensitiveFieldStripInterceptor` (a real safety net for `passwordHash`/`emailVerificationToken` specifically) instead of the originally-scoped `ClassSerializerInterceptor` + `@Exclude()`-decorated DTOs. 114+ endpoints across `users`/`payments`/`wallet`/`admin` still return raw Prisma objects with no formal response shape.
- **Frontend anti-corruption/DTO-mapping layer only covers the auth flow** (login/register/quickAccess). The other ~50+ API call sites across the app, including the richer `GET /users/:id` shape, remain untyped passthroughs. (P2-01)
- **`forum.service.ts` is still 2437 lines** (the one monolith P2-04 didn't split) — deliberately deferred because its existing test suites tested a fictional never-implemented schema and had to be deleted, leaving zero real test coverage to protect a split. Needs characterization tests written first.
- **17 structured-data fields stored as opaque `Json`/`Json?` blobs** (order line items, `availability`, `advisoryBoardVotes`, etc.) — no story anywhere addresses this. No status update at all; presumably exactly as originally found.
- **Soft-delete pattern only covers 2 of 35 original raw-delete call sites.** `ForumThread`/`Circle`/`Document` (+ later `MemorialEntry`/`GuidancePlanTemplate`) were converted; the other 33 — across `admin-*` services, `temples`, `academy`, `gdpr`, `certificates`, `events`, `dreams`, `notification.service.ts` — remain hard-deletes, un-triaged. (Some may legitimately stay hard-deleted, e.g. expired-token cleanup — needs individual review, not a blanket conversion.)
- **`hard_delete_audit` table was never built** — the one specifically-caveated open item from P0-03. Admin deletions currently have only `Logger.log()` calls as an audit trail, not a queryable table.
- **Git repo has no remote, no branch protection, no documented branch strategy.** `git init` + first commit happened (P0-01); everything past that is blocked on the platform owner's account/credentials. The existing `.github/workflows/` CI skeleton also hasn't been reviewed against this task's original intent.
- **2 orphaned frontend components call backend routes that don't exist:** `role-management-tab.tsx` → `/admin/roles` (no route at all); `profile-views-panel.tsx` → `GET /users/profile-views/mine` (the service method `getProfileViewers()` exists but nothing exposes it via a controller — **note:** this may already be resolved by this session's V8-302 work, which built a real profile-viewers panel and wired `GET /users/:id/profile-viewers` — worth checking whether this is the same gap closed under a different name before treating it as still open).
- **591 `@typescript-eslint/no-explicit-any` violations** (425 in production code, 115 files) — deliberately deferred as multi-session work; blocks adding a backend lint CI gate.
- **2304 hardcoded-Tailwind-color-class lint violations** (`no-restricted-syntax`) — same story on the frontend; blocks the frontend lint CI gate.
- **87 unaudited high/critical npm CVEs** (60 backend, 27 frontend) — `npm audit` now runs in CI but is deliberately non-blocking; none of the 87 have been triaged.
- **P3-18: no custom-permission JSON layer for admin sub-role RBAC** — explicitly deferred by product-owner decision ("keep it simple, don't build yet"). Not a gap, just a captured decision so it isn't re-litigated from scratch.
- **3 architecture "sins" never independently audited:** generic marketing landing page quality (#6), full onboarding-edge-case audit beyond ghost-record-creation (#7), AI-generated-code review checklist (#28). Status genuinely unknown, not "presumed open."
- **P3-15's two open product questions:** whether 3 dead `push-notification.controller.ts` admin routes should just be deleted, and whether `ADVISORY_BOARD_MEMBER` should retain user-impersonation ability at all.
- **P3-19's other caveat:** worth re-verifying the CLAUDE.md-documented V6-206 "RDS backup restore test" actually replayed migrations from a truly fresh DB — this story suggests that path may have been broken in a way the restore test wouldn't have caught.

---

## 🟡 FEATURE GAPS BY DOMAIN

### Monetisation (Devoted tier)
Full detail in `V8_MONETISATION_BACKLOG.md` (kept as a deep-dive reference even though superseded for planning purposes — its per-story status write-ups are more detailed than what's practical to repeat here).

- **V8-103** — needs a human with real Paystack dashboard access to create the Quarterly/Annual Plans and set 3 env vars in production. Code fails loudly rather than silently degrading until this happens.
- **V8-206 / V8-303** — backend is fully correct (message limits, priority booking) but has no reachable frontend since messaging/booking are paused platform-wide. Revisit when those un-pause.
- **V8-305** — event-attendance XP has nothing to hook into; there's no attendance-tracking mechanism anywhere in this codebase. Would be a new feature, not a fix.

### Admin Operations
See 🔴 Critical above — the bulk of open admin work is money/security-adjacent and listed there (14 missing endpoints, 3 partial, 2 self-contradicting stories, missing ban endpoint).

### Vendor / Marketplace
📄 *(VENDOR_BACKLOG.md + SHOP_BACKLOG.md)*

- **VND-012** Customer Communication Hub — entirely unbuilt, blocked on Messaging (paused).
- **VND-025** Wholesale & B2B Sales — wholesale mode is built; "temple purchasing" (bulk orders from a shared temple wallet) isn't — no `Temple` wallet concept exists anywhere, needs its own design project first.
- **VND-026** Vendor Performance Tiers — tiers/badges/search-tiebreaker are real; the actual tier *benefit* (reduced commission, waived withdrawal fees) can't work until commission is actually deducted (see 🔴 Critical above).
- Smaller sub-gaps inside otherwise-✅-DONE items: VND-009 (no per-order communication log, blocked on Messaging), VND-010 (digital-item "revoke access" on return — worth checking if VND-024 incidentally covered this; admin dispute view's message history, blocked on Messaging), VND-011 (no "shipping presets" quick-apply), VND-013 (no view/add-to-cart event tracking, low priority), VND-014 (no message-response-rate metric, blocked on Messaging), VND-016 (no storefront "response time" stat, blocked on Messaging), VND-021 (referral is flat ₦500, not true per-purchase ongoing commission — real scope gap, recommend its own item), VND-023 (SEO meta tags stored but not injected into real `<meta>` tags — blocked on no SSR/per-route meta injection existing).
- **MSP-002** Cross-Vendor Bundling — cross-sell recommendations based on ritual completeness not built.
- **MSP-003** Cultural Appropriation Prevention — no documented blacklist of prohibited items/categories; vendor education module still thin.
- **MSP-005** Vendor Collaboration Spaces — shared inventory for large ceremonies blocked on VND-025 (above, unbuilt).
- **MSP-006** — 🔵 verified this session, mostly done. One sub-item still open: vendor accountability/shipping-reliability data isn't tracked anywhere — would need a new signal.
- **MSP-009** International Shipping & Customs — customs docs + shipping insurance both blocked on VND-011 data plus real external expertise/provider integrations the team doesn't have in-house.
- **MSP-013** Vendor-to-Client Relationship Cultivation — entirely unbuilt, explicitly sequenced after Messaging relaunch.
- **MSP-015** Community-Supported Authenticity — item-level cultural wiki content, vendor education, and "this speaks to me" storytelling (coordinate with FOR-019) all unbuilt — mostly content-authoring tasks.
- **MSP-017** Vendor Cooperative Spaces — entirely unbuilt, blocked on VND-025.
- **MSP-018** Vendor Wellbeing & Ritual Support — no dedicated support-request flow beyond the existing forum/wellness-checkin; fuller resource directory is a content task.
- **MSP-021** Marketplace as Spiritual Journey Companion — entirely unbuilt; Spiritual Journey feature itself is deprioritized (not paused) — confirm priority with its owner before starting.
- **MSP-022** Cultural Preservation Archive — interactive map of item origins not built (needs new regional data + mapping library); rest of item is done.
- **MSP-023** Vendor-to-Client Mentorship Marketplace — entirely unbuilt; flagged as a possible Devoted-tier monetization perk, raise with Product before scoping.
- **MSP-024** Cultural Gifts & Offerings — group/pooled gifting, gifting recognition threads, per-occasion cultural guidance, and gifting-history badges all unbuilt (core gift/dedication loop is done).

### Community / Forum
📄 *(COMMUNITY_BACKLOG.md)* — 22 items with open scope, most are either content-authoring tasks (need a human writer, not an engineer) or explicitly deferred pending a product/community-governance decision. Full one-liners:

- **FOR-001** — flag-rule engine exists but nothing in the actual post-creation path ever checks against it; the admin review queue it feeds will always be empty in practice.
- **FOR-002** — no dedicated crisis-path unit test; no temporary content restriction during active crisis review; Babalawo-availability integration blocked on Consultations relaunch.
- **FOR-003** — entirely unbuilt: dedicated guidance-request thread type, privacy controls, closure/archiving, booking integration (blocked on Consultations).
- **FOR-005** — no moderation-queue mechanism exists for Circle content at all (platform-wide gap); expert facilitators is a staffing task.
- **FOR-006** — no event-triggered milestone-celebration notification (badges are computed live-on-read); storytelling deferred to FOR-019.
- **FOR-007** — no automatic thread-highlighting on spiritual calendar days; no calendar-tied discussion threads; no Marketplace connection.
- **FOR-009** — 🔵 verified this session, mostly done. One sub-item open: tech assistance for elders using the platform (distinct from mentorship-matching, which is done).
- **FOR-010 / FOR-011** — VR/AR sacred spaces, blockchain oral-history preservation — greenfield, no infrastructure exists.
- **FOR-013** — cross-timezone ritual coordination display, post-ritual sharing pattern, calendar-tied prep guides, community-generated-ritual approval (governance decision), consent-based virtual-ceremony recording all open.
- **FOR-014** — elder governance on cultural matters and succession planning both deliberately unbuilt pending a real product/community-leadership decision (voting rights? formal council?).
- **FOR-015** — healing-support practitioner referrals (may already be covered by existing Babalawo discovery, unconfirmed), grief-practice content, post-grief reintegration pattern.
- **FOR-016** — healthy-spiritual-boundaries education content not authored (needs a human writer).
- **FOR-017** — dedicated referral pathway beyond the interim `hello@iluase.com` contact; mental-health support content; restoration-journey pattern (needs product input).
- **FOR-018** — restoration pathways for those who caused harm, reconciliation ceremonies, conflict-feedback loop, forgiveness/trust-restoration process — all vague-scope, deferred pending product input.
- **FOR-019** — storytelling *events* (virtual gatherings) not built; could reuse `SacredCalendarEvent`.
- **FOR-020** — entirely unbuilt: video guidance, practice guides/threads, elder workshops, practice verification/documentation.
- **FOR-021** — Yoruba dream-interpretation framework content not authored; anti-manipulation/anxiety protection is a policy question for Product.
- **FOR-023** — mentor-matching-per-milestone (worth re-checking against FOR-009's now-done matching system — may be closeable), privacy-control verification, Academy/Marketplace growth-support connection.
- **FOR-024** — revision history, accuracy discussion, licensing, governance model all open (submission path itself is done).
- **FOR-Q2** — multi-language array deliberately not built; reused existing single-value `dialectPreference` instead.

### Experience / Platform Polish
📄 *(EXPERIENCE_BACKLOG.md + Z1_BACKLOG.md)* — these two docs' "27/30 done" and "31/32 done" headlines both silently exclude real open work; here's what they exclude:

- **EXP-007 / Z1-301** (same real-world gap, tracked under two IDs) — the 3 cultural-onboarding videos are still placeholders; UI/tabs are built, no real video content exists. Blocked on content production, not engineering.
- **Z1-801** Circle Patron Tier (20 SP) — not started.
- **Z1-802** Spiritual Journey Tracker (30 SP) — not started.
- **Z1-803** Sentiment Analysis & Crisis Prevention enhancements (15 SP) — not started (only basic crisis detection exists today).
- **Z1-1001** Error State Improvements (10 SP) — not started.
- **Z1-1002** Edge Case Handling — network failures, concurrent ops (10 SP) — not started.
- **Z1-1003** Internationalization Prep (5 SP) — not started.
- **Z1-1101** Operations Runbook (10 SP) — not started.
- **Z1-1102** Monitoring Dashboard Setup — Grafana, alerts (10 SP) — not started.
- **Z1-1201** Production Readiness Checklist (15 SP) — not started.
- Z1_BACKLOG.md also has several internal self-contradictions worth knowing about if you go read it directly: a self-referential "obsolete, see below" notice pointing at itself, a "27/30 done" total that quietly drops 3 whole sprints (Z1-10/11/12) from the denominator, and a sprint marked "✅ COMPLETED (Partially...)" which is a contradiction in terms.

### V5 / V9 (both otherwise essentially complete)
📄 *(V5_BACKLOG.md + V9_FORUM_BACKLOG.md)*

- **V5-505** Set Availability: Persist to Backend — the doc's own instructions were conditional ("if no endpoint exists, mark blocked") and the condition was never resolved one way or the other in the document. Worth a 2-minute check: does a real availability-persistence endpoint exist today or not?
- V5's own closing audit says **95%, not 100%**, real-data wired — demo-mode-guarded fallback code still exists in forum/temple views (deemed production-safe, but present).
- **F9-904 Oral History Archive** — V9_FORUM_BACKLOG.md says ✅ DONE; CLAUDE.md says "🟡 Deferred to separate seeding task (structure ready)." These directly disagree — reconcile before assuming either is current.
- Both docs have explicit "not building yet" lists (12 items in V5, 8 in V9) covering things like real-time notification badges, global search, rich-text/media embeds in forum, forum moderation AI, sub-categories, WebRTC audio — genuinely out of scope, not oversights, listed in 🔵 below only if worth remembering.

---

## ⚪ NEEDS A HUMAN (not code work)

📄 *(HUMAN_BACKLOG.md — read that doc directly for full context on each; these are the still-open items as of its last update, July 26, 2026)*

- **EC2 staging deploy failing** — instance appears unreachable (connection timeout on health check), not a CI/workflow problem. Needs someone with AWS console access to check whether the instance is running/reachable.
- **Restart both local dev servers** — `.env` changes (Google OAuth) need a restart to take effect; neither Vite nor NestJS's `ConfigService` hot-reloads env vars.
- **Google Cloud Console: authorize `localhost:8100`** for OAuth (Authorized JavaScript origins) — without this, "Continue with Google" will trigger Google's flow but get rejected with an origin-mismatch error.
- **Verify production Google OAuth origins** — confirm `iluase.com`/`www.iluase.com` are already authorized (probably yes, but worth a 30-second check).
- **Decide the fate of the orphaned `GoogleStrategy`** (`backend/src/auth/strategies/google.strategy.ts`) — a second, complete, unused Google-auth implementation. Delete or keep both?
- **Decide whether `role-management-tab.tsx`/`profile-views-panel.tsx` should come back** — both deleted in an earlier cleanup pass; recoverable from git history if wanted. *(Note: this may partially overlap with this session's V8-302 profile-viewers panel — worth checking before restoring the old one.)*
- **Manual QA: click through the admin dashboard end-to-end** with the real `admin-test@iluase.test` account — everything fixed in that session was verified via API calls/code tracing, never an actual rendered browser session.
- **Visually check the new Google Sign-In button** — renders via Google's own widget now, won't be pixel-identical to the old custom button.
- **7 local-dev placeholder env vars** still need real values before their corresponding flows can be tested locally: `PAYSTACK_SECRET_KEY`/`FLUTTERWAVE_SECRET_KEY`/`FLUTTERWAVE_SECRET_HASH`, `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`, `SENDGRID_API_KEY`, `AGORA_APP_ID`/`AGORA_APP_CERTIFICATE`, `GOOGLE_CLIENT_SECRET` (currently harmless), all 7 `VITE_FIREBASE_*` values (push notifications need a real Firebase project), and `BOOTSTRAP_ADMIN_PASSWORD` (still literally `ChangeMe123!` — check it isn't still this in production).
- **Confirm what's actually in AWS Secrets Manager for production** — CLAUDE.md's Sprint 10 table flags Stripe keys and Sentry DSN as launch-blocking/not-done, but the codebase integrates Paystack/Flutterwave (not Stripe) and `VITE_SENTRY_DSN` already has a real value in `frontend/.env.production` — that CLAUDE.md line may just be stale. Worth confirming against the actual Secrets Manager contents rather than the doc.

Related, from this session's V8 work: **someone needs real Paystack dashboard access** to create the Devoted Quarterly/Annual Plans and set `PAYSTACK_DEVOTED_QUARTERLY_PLAN`/`PAYSTACK_DEVOTED_ANNUAL_PLAN`/`PAYSTACK_WEBHOOK_SECRET` in production (V8-103, see Monetisation above) — checkout can't take real payments until this happens.

---

## 📌 Paused Platform Features — Context, Not Action Items

🔵 **Verified this session.** Consultations, 1:1 Messaging, and (as a consequence) Guidance Plans creation are paused platform-wide, frontend-only and fully reversible, per `MVP_PIVOT_BACKLOG.md`. All 14 PIV-XXX stories in that doc are done — every route/component described there exists and is wired exactly as specified (spot-checked `PausedFeatureNotice`, `ConsultationsPausedPage`, `MessagesPausedPage`, the `App.tsx` route swap). This isn't itself remaining work — it's why so many items above say "blocked on Messaging/Consultations." When those features un-pause, revisit: V8-206, V8-303, VND-012, VND-009's comm log, VND-014/016's response-rate metrics, MSP-013, FOR-002's Babalawo-availability integration, FOR-003's booking half.

---

## 🔵 DELIBERATELY DEFERRED / LONG-TERM / GREENFIELD

Explicitly out of scope by design, not oversights. Listed compactly so nobody re-discovers these as "gaps":

**Infrastructure-dependent (no AR/VR/blockchain/video infra exists anywhere in this codebase):** FOR-010 (VR/AR community spaces), FOR-011 (blockchain oral-history), MSP-010 (AR/VR product visualization), MSP-011 (blockchain provenance tracking).

**From V5_BACKLOG.md's "not in any sprint yet" list:** real-time notification badges, global search (Cmd+K), bulk admin actions, admin activity log, email notification templates, Babalawo availability-calendar integration, platform-wide announcement broadcast, subscription/recurring bookings, API response envelope standardization, optimistic updates everywhere, WebSocket real-time for admin (fraud/verification/withdrawal), offline detection banner.

**From V9_FORUM_BACKLOG.md's "not building yet" table:** rich text editor/media embeds (YouTube/Instagram/TikTok), forum moderation AI/NLP auto-flagging, inter-tradition dialogue space (planned at 1,000+ verified members), embeddable "Ask a Babalawo" widget, Temple API, native WebRTC for Àṣẹ Live (external-platform scheduling is built instead), forum coins/token rewards (XP system used instead), sub-categories/nested categories.

**From V8_MONETISATION_BACKLOG.md's "not building yet" table:** HD session recordings, AI transcripts, Masterclass vault, family plans (revisit at 1,000+ subscribers), two-tier pricing (revisit if conversion <3% at 6 months), advanced search filters, Babalawo premium placement.

---

## ✅ WHAT'S ACTUALLY FULLY DONE (so you don't re-litigate it)

- **V8 Monetisation** — 28/30 stories, 🔵 verified this session. Full detail + real bugs found/fixed in `V8_MONETISATION_BACKLOG.md`.
- **Whole-app UX/UI wiring audit** — ~30 issues across CLIENT/BABALAWO/VENDOR/ADMIN (403s, dead links, dead buttons, duplicate routes, fake data), all independently re-verified fixed on July 28, 2026. See CLAUDE.md.
- **VND-017/018/019** (Cultural Integrity sprint) — all 3 done, 🔵 verified this session.
- **MSP-006** (Marketplace Trust) — 🔵 verified/completed this session.
- **FOR-009** (Intergenerational Bridge) — mostly 🔵 verified this session (one tech-assistance sub-item still open, listed above).
- **MVP Pivot (all 14 PIV stories)** — 🔵 verified this session, done and stable.
- **P0/P1 tiers of ProBacklog-v1.md** — done except the specifically-caveated P0-01 (git remote/branch protection) and P0-03 (audit table) items listed under Structural/Tech Debt above.
- **V5 (8 sprints, 187 SP)** and **V9 Forum (9 sprints, 180 SP)** — both essentially complete; see the two small exceptions under V5/V9 above.
- Most of VENDOR_BACKLOG.md (23+ of 26 items), COMMUNITY_BACKLOG.md, and SHOP_BACKLOG.md — only the items explicitly listed under Feature Gaps above remain open; everything else in those three docs is done.

---

## 📚 Source Document Index

Every doc below has (or will have, as of this consolidation) a superseded-banner at its own top pointing back here. Kept for historical detail only.

| Doc | What it covered | Status baked into this doc |
|---|---|---|
| `V8_MONETISATION_BACKLOG.md` | Devoted subscription tier, billing, referrals | 3 items carried forward |
| `ADMIN_BACKLOG.md` | Admin dashboard features (ADM-XXX) | Superseded by `ADMIN_BACKEND_GAPS_BACKLOG.md`'s findings — 19 items carried forward |
| `ADMIN_BACKEND_GAPS_BACKLOG.md` | Evidence-based re-audit of ADMIN_BACKLOG.md's claims | Source of truth for admin gaps — fully absorbed above |
| `VENDOR_BACKLOG.md` | Vendor operations (VND-XXX) | 3 whole items + 8 sub-gaps + 1 cross-cutting (commission) carried forward |
| `SHOP_BACKLOG.md` | Marketplace-wide features (MSP-XXX) | 16 items carried forward |
| `COMMUNITY_BACKLOG.md` | Community/forum features (FOR-XXX) | 22 items carried forward |
| `EXPERIENCE_BACKLOG.md` | Practitioner/client experience (EXP-XXX) | 1 item carried forward (shared with Z1-301) |
| `Z1_BACKLOG.md` | Consolidated production-readiness sprints (Z1-XXX) | 10 items carried forward (3 deferred features, 6 polish/ops items, video content) |
| `ProBacklog-v1.md` | Code-quality/structural-integrity audit (P0–P3, EMG) | Most of 🔴 Critical + all of 🟠 Structural carried forward |
| `V5_BACKLOG.md` | Real-data platform wiring (V5-XXX) | 2 small items carried forward |
| `V9_FORUM_BACKLOG.md` | Forum launch (F9-XXX) | 1 contradiction + deferred-feature list carried forward |
| `HUMAN_BACKLOG.md` | Action items needing a human (not code) | All open items carried forward into ⚪ section |
| `MVP_PIVOT_BACKLOG.md` | Consultations/Messaging pause (PIV-XXX) | 🔵 Verified fully done — nothing carried forward, kept as context in 📌 section |

---

*Built July 28, 2026, from 6 parallel extraction passes over the 13 docs above plus direct reading of HUMAN_BACKLOG.md and MVP_PIVOT_BACKLOG.md. Update this doc, not the source docs, as work gets done — add a 🔵 verified/fixed note the same way this doc's own predecessor items were annotated, and move completed items down to the ✅ section rather than deleting them, so the "why isn't this still open" history stays visible.*
