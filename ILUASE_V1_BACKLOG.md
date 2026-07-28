# Ìlú Àṣẹ V1 Backlog — The Single Source of Truth

**This is now the only backlog doc to read for "what's left."** Every other `*_BACKLOG.md`/`ProBacklog-v1.md` file in this repo is superseded — each has a banner at its own top pointing back here. They're kept for historical detail (file:line references, the reasoning behind past decisions) but none of them should be used to decide what to work on next. This one is.

**How this doc was built:** originally assembled July 28, 2026 from six parallel extraction passes over 13 source docs. That same day, a **second reconciliation pass** (also July 28, 2026) discovered that ~426 files / ~26,000 lines of real prior-session work had been sitting **uncommitted** in the working tree the whole time — meaning most of the doc's "still open" claims were already stale the moment it was written. That work was committed (13 commits, grouped by subsystem, full test suites green before and after), then four parallel agents independently re-verified every claim in this doc against the now-committed code. **Every item below reflects that second-pass verification** — treat 🔵 **verified [date]** as trustworthy (checked against real code, with file:line evidence), and 📄 **as claimed by source doc** as unverified in this pass. Given this platform's repeated history of stale "✅ DONE" claims, still spot-check 📄 items before relying on them.

**Story IDs are preserved** from their original docs (ADM-XXX, VND-XXX, MSP-XXX, FOR-XXX, EXP-XXX, Z1-XXX, V8-XXX, V5-XXX, F9-XXX, P0/P1/P2/P3-XX) so you can still search a source doc for the full original write-up if you need more detail than the one-liner here. **Warning:** `COMMUNITY_BACKLOG.md`'s FOR-XXX numbering has shifted/been reused since earlier extraction passes — match by content/title, not just number, if something looks off.

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

- **Marketplace commission is still never actually deducted from any vendor payout — 🔵 confirmed still true, July 28, 2026.** `backend/src/marketplace/marketplace.service.ts` returns this explicitly in three places: the vendor earnings response (`commission: { deducted: false, note: 'Not yet deducted from marketplace order payouts -- you currently receive the full order amount.' }`, ~L4037), the monthly statement PDF (~L4120, "not yet deducted from payouts"), and a dedicated `commissionNote` field (~L4209). `backend/src/wallet/wallet.service.ts` has zero commission/fee-deduction logic anywhere in withdrawal/payout code. The new `vendor-performance-tier.service.ts` (added this session) only sorts product listings by tier — it does not touch commission or fees at all, so VND-026's "reduced commission for top-tier vendors" perk is still fully unbuilt on top of an unbuilt base. This remains the single most important open item in the codebase.

- **`admin-finance.service.ts` now returns a *fabricated* `platformCostNgn` value in a live API response — 🔵 new finding, July 28, 2026.** The `getPlatformCost()` helper (~L724) computes `platformCostNgn` as `(consultationCommissionPct + marketplaceCommissionPct) * 10000` with its own code comment reading `// placeholder calculation`, falling back to a hardcoded `500000` if no settings row exists. This feeds the `/admin/forecasting/revenue` endpoint (see ✅ below — the endpoint itself is now real). This is arguably worse than the original "field doesn't exist" gap: it now looks like real operating-cost data to anyone reading the revenue forecast, directly conflicting with this repo's own principle of not fabricating data (see CLAUDE.md "Engineering Principles" #5). **No real `PlatformSettings.platformCostNgn` column exists in schema.prisma** — needs either a real field + admin input UI, or the forecast endpoint should say "operating cost: not yet tracked" instead of showing a computed-looking number.

- **Money is still `Float` for a handful of fields — 🔵 narrowed, July 28, 2026 (was "13+ tables", now much smaller).** Eight `float_to_decimal` migrations landed this session and converted: `Escrow.amount`, `WithdrawalRequest.amount`, `Order.totalAmount`/`taxAmount`, `Product.price`, `Course.price`, `Appointment.price`, `GuidancePlan.totalCost`/`platformServiceFee`, `TutorSession.price`, `Event.price`, `ForumTip.amount`, `Payment.amount`, `RefundRequest.amount`/`approvedAmount`, all of `PlatformSettings`'s money fields, and `PromoCode.value`. **Still `Float`:** `Transaction.amount` (schema.prisma ~L1913, the one field the doc originally named that never got converted) plus three not previously flagged: `ReturnRequest.offeredRefundAmount` (~L1577), `VendorPromotionRedemption.discountNgn` (~L1643), `PromoRedemption.discountNgn` (~L3017). `Float` arithmetic in JS can still silently lose cents on any calculation touching these four fields.

- **CI/CD workflow gates on a branch that may not match reality — 🔵 new finding, July 28, 2026.** `.github/workflows/ci-cd.yml` has a comment noting "no `main` branch exists on this remote" and gates deploy on `july-2026-hardening-pass`, but the local repo's actual working branch is `main` (confirmed: `git remote -v` → `origin https://github.com/MoyoOni/ifaapp.git`; `git branch -a` shows local `main`, `origin/HEAD -> origin/IfaAppV1`, `origin/IfaAppV1`, `origin/july-2026-hardening-pass`). Worth a human confirming which branch is actually meant to trigger CI/CD before assuming deploys work as configured.

- **A batch of ~15 Prisma migrations has no recorded confirmation of being applied to production — 🔵 new finding, July 28, 2026.** The float-to-Decimal batch, `add_vendor_cultural_certification`, `add_service_offerings`, plus several soft-delete/user-reports/circle-reactions migrations all landed in this session's checkpoint commit with no migration-status artifact anywhere in the repo. See ⚪ Needs a Human below.

- **Unlimited free subscription-pause exploit — 🔵 verified and FIXED (July 27, 2026), still fixed.** `POST /subscriptions/pause` had zero repeat-call protection; fixed via a `pausedAt` flag. See `V8_MONETISATION_BACKLOG.md`'s V8-503 for full detail. No action needed.

### Resolved since the doc was first written (moved from here to ✅ below, listed so you don't go looking)

The following 🔴 items from the original pass are now **✅ done** — see the ✅ section for evidence: the 14 "missing" admin endpoints, the 3 "partially real" admin features, the ban/unban endpoint, and the `trustScore` schema-drift risk. **ADM-004** (forum thread admin actions) and **ADM-030** (platform settings panel) are **partially** resolved — see 🟡 Admin Operations below for what's still actually missing.

---

## 🟠 STRUCTURAL / TECH DEBT

All 📄 *(ProBacklog-v1.md)* unless noted — this doc is the platform's own code-quality/structural audit, distinct from feature backlogs. Re-verified July 28, 2026.

- **Test coverage thresholds — 🔵 confirmed unchanged.** `backend/package.json`'s jest `coverageThreshold.global` is statements 20 / branches 18 / functions 16 / lines 20 — matches the doc's prior claim exactly, still far below the 80%/60%/20+E2E target. No regression, no progress either.
- **No DTO/serialization layer — 🔵 confirmed still open.** Only `SensitiveFieldStripInterceptor` exists; its own header comment states plainly: *"there is no DTO/ClassSerializerInterceptor layer in this codebase... sensitive-field stripping is done ad hoc per call site."* Zero `@Exclude()` usages anywhere in `backend/src`.
- **Frontend anti-corruption/DTO-mapping layer still auth-only — 🔵 confirmed still open.** `frontend/src/types/api/mappers/` contains only `auth.mapper.ts` + test. No mapper for `GET /users/:id` or other endpoints yet.
- **`forum.service.ts` is now 2727 lines — 🔵 grew, not shrank (was 2437).** Still one monolith, still deliberately deferred pending characterization tests.
- **19 structured-data fields still stored as opaque `Json`/`Json?` blobs — 🔵 count updated (was 17).** Spot-checked `User.availability` and `advisoryBoardVotes` — both still `Json?`. No conversions found; count went up, not down.
- **Soft-delete pattern — 🔵 real progress, was understated as "2 of 35."** `deletedAt`-style soft-delete now covers **12 models** (up from 5): `DreamEntry`, `MemorialEntry`, `Message`, `Document`, `ConsultationNote`, `ClientSessionNote`, `GuidancePlanTemplate`, `Lesson`, `CourseCertificate`, `Event`, `OralHistoryEntry`, `ServiceOffering` (plus `ForumThread`/`Circle` use a `status`-field convention). Raw `prisma.<model>.delete(` call sites are down to **19** (was 33), and the doc's specifically-named `academy`/`gdpr`/`certificates`/`events`/`dreams` areas now have **zero** raw deletes — fully converted. Still hard-deleting: `circles.service.ts`, `marketplace.service.ts`, `admin-promos.service.ts`, `admin-campaigns.service.ts`, `admin-integrity.service.ts`, `admin-content.service.ts`, `admin-cultural-content.service.ts`, `temples.service.ts`, `admin-community.service.ts`, `forum.service.ts`, `users.service.ts`, `wallet.service.ts`, `notification.service.ts` (~L306), `modules/user/user.service.ts`.
- **`hard_delete_audit` table — 🔵 confirmed still open.** No `HardDeleteAudit` model anywhere in schema.prisma. Admin deletions still only have `Logger.log()` calls.
- **Git repo now has a real remote — 🔵 updated.** `origin https://github.com/MoyoOni/ifaapp.git` exists (was previously "no remote"). Branch-protection status not checkable from this environment (no authenticated `gh` CLI). See the CI/CD branch-mismatch item under 🔴 Critical above — that's the more urgent git-related issue now.
- **2 orphaned frontend components — 🔵 one resolved, one moot.** `profile-views-panel.tsx` is **back and fully wired** — `frontend/src/features/devoted/profile-views-panel.tsx` calls `GET /users/:id/profile-viewers`, which is real (`backend/src/users/users.controller.ts` ~L168, backed by `usersService.getProfileViewers()`). Move to ✅. `role-management-tab.tsx` — confirmed absent on **both** sides (no frontend file, no `/admin/roles` backend route) — there's no orphan because neither half exists; drop this half of the item rather than "fix" it.
- **`@typescript-eslint/no-explicit-any` — 🔵 rule is `'warn'` not `'error'` on frontend (checked `.eslintrc.cjs`); rough proxy count `grep -rn ": any" backend/src` = 288 (not an exact violation count, doesn't match doc's 591 methodology — needs a real lint run to get a comparable number).** Still open, no CI gate.
- **Hardcoded-Tailwind-color lint rule — 🔵 rule status update.** `frontend/.eslintrc.cjs` (~L37-42) has the `no-restricted-syntax` rule for literal Tailwind color classes set to `'error'`, not disabled — the rule itself may already be enabled/blocking. Worth a fresh violation count (`npx eslint` run) to see if the frontend lint CI gate is actually achievable now or still blocked by volume.
- **87 unaudited npm CVEs — 🔵 partial progress, still non-blocking.** `.github/workflows/ci-cd.yml` (~L202-204) runs `npm audit --workspaces --audit-level=high` with `continue-on-error: true` (still non-blocking) but a comment (P3-03) notes it's "no longer double-suppressed with `|| true`" — real pass/fail is now visible in the Actions UI even though it doesn't fail the build. None of the 87 CVEs confirmed triaged.
- **P3-18: no custom-permission JSON layer for admin sub-role RBAC** — unchanged, explicitly deferred by product-owner decision. Not re-verified this pass (no code claim to check).
- **3 architecture "sins" never independently audited** (#6 landing page quality, #7 onboarding-edge-case audit, #28 AI-code review checklist) — not covered in this pass either; status still genuinely unknown.
- **P3-15's two open product questions** (dead push-notification admin routes, `ADVISORY_BOARD_MEMBER` impersonation ability) — not covered in this pass; still open.
- **P3-19's backup-restore-test caveat** — not covered in this pass (needs infra access); still open.
- **The orphaned `GoogleStrategy` is now *imported* but still functionally unused — 🔵 nuance update.** `backend/src/auth/auth.module.ts` now registers `GoogleStrategy` in its `providers` array (no longer literally unreferenced), but no route anywhere uses `AuthGuard('google')` — the real flow is `POST /auth/google/token` (ID-token verification in `auth.controller.ts`). Still dead weight, just less "orphaned" than before. Human decision to delete/keep still open — see ⚪ below.

---

## 🟡 FEATURE GAPS BY DOMAIN

### Monetisation (Devoted tier)

Full detail in `V8_MONETISATION_BACKLOG.md` (superseded for planning, kept as deep-dive reference).

- **V8-103** — still needs a human with real Paystack dashboard access for Quarterly/Annual Plans + 3 env vars. 🔵 Code confirmed to fail loudly: `subscriptions.service.ts` (~L65-78) throws naming the exact missing var; `subscriptions.controller.ts` (~L133-135) and `security-hardening.service.ts` (~L66-69) both refuse to process the webhook without `PAYSTACK_WEBHOOK_SECRET` rather than silently skipping verification (this replaced a previously-unsafe skip). `.env.example` now documents all 3 vars with explanatory comments.
- **V8-206 / V8-303** — 🔵 confirmed still open, correcting a stale file reference: the message-limit logic lives in `backend/src/messaging/messaging.service.ts` (~L76-104, L254-282 — "10 conversations/month for FREE, unlimited for DEVOTED"), not `messages/messages.service.ts` as previously written. Priority booking (`isPriority` sort-to-top for DEVOTED) confirmed in `appointments.service.ts` + `schema.prisma`. Frontend confirmed still unreachable — `frontend/src/features/messages/` and the booking half of `frontend/src/features/consultations/` were deleted in this session's MVP-pivot-cleanup commit; only an unrelated `consultation-notes-panel.tsx` remains. Revisit when Messaging/Consultations un-pause.
- **V8-305** — 🔵 confirmed still open. `grep -rin "attendance" backend/src` returns zero hits. No attendance-tracking mechanism exists anywhere; would be new feature work.

### Admin Operations

🔵 **The bulk of this is now done** — see ✅ below for the 14+3 previously-missing admin endpoints and the ban/unban endpoint, all confirmed implemented this session. What's still actually open:

- **ADM-004 (forum thread admin actions) — frontend gap, not backend.** Backend has all 7 actions including delete-with-reason (`forum.service.ts` `adminDeleteThread()`, soft-delete + logged reason) and `move`/`feature`/`merge`/`pin`/`unpin`/`lock`/`unlock`. But `admin-forum-management-tab.tsx` only calls move, merge, and the pin/unpin/lock/unlock/approve moderate-action endpoint — it never calls `/feature` or the delete-with-reason `DELETE admin/threads/:id` route. Small, well-scoped frontend wiring task.
- **ADM-030 Platform Settings Panel — 🔵 confirmed still open, exactly as claimed.** `PlatformSettings` model (schema.prisma ~L2896-2905) only has `consultationCommissionPct`, `marketplaceCommissionPct`, `minPayoutThresholdNgn`, `maxPayoutWithoutApprovalNgn`, `quizPassThreshold`. No feature-flags, maintenance-mode, welcome-message, or forum-limits fields anywhere (grepped all casings, zero hits).
- **The fabricated `platformCostNgn` in the revenue forecast** — see 🔴 Critical above, it's an admin-ops item but serious enough to live there.

### Vendor / Marketplace

📄 *(VENDOR_BACKLOG.md + SHOP_BACKLOG.md)*, re-verified 🔵 July 28, 2026.

- **VND-012** Customer Communication Hub — 🔵 confirmed still entirely unbuilt, blocked on Messaging.
- **VND-025** Wholesale & B2B — wholesale mode (price-gating for BABALAWO/ADMIN) is solid and working. "Temple purchasing" (shared temple wallet) is still unbuilt — 🔵 confirmed no `TempleWallet` concept anywhere. Note: the new `bulk-order-view.tsx` is **not** this — it's a single-vendor bulk-quantity form for one buyer, confirmed by its own code comment. Temple purchasing (pooled/shared wallet across a temple's members) remains a from-scratch design project.
- **VND-026** Vendor Performance Tiers — tiers/badges/sort-tiebreaker are real and now backed by a real nightly cron (`vendor-performance-tier.service.ts`), but 🔵 confirmed the tier *benefit* (reduced commission, waived fees) is still 100% unbuilt — the service only affects listing sort order, and there's no commission logic anywhere for it to hook into (see 🔴 Critical). `vendor-performance-tier-panel.tsx` has zero mentions of commission/fee/waive.
- **VND-021 referral reward — 🔵 worse than previously stated.** `admin-referrals.service.ts` `creditReferral()` (~L78-90) only flips `rewardGranted: true` — no wallet deposit or subscription credit actually happens; the code's own comment says "the actual reward... would typically happen here." Not "flat ₦500 instead of ongoing commission" as previously written — **no money moves at all yet.**
- Sub-gaps, re-verified: **VND-009** (per-order comm log) still open, blocked on Messaging. **VND-010** (digital revoke-access) partially resolved — `return-request.dto.ts` now has a structured `ReturnReasonCategory` enum, but actual digital-download access revocation on return still doesn't exist. **VND-011** (shipping presets) still open — full shipping-zone CRUD exists now but it's fully manual entry, no quick-apply templates. **VND-013** (view/cart tracking) still open. **VND-014** (message-response-rate) resolved *differently* — new `vendor-insights-panel.tsx`/`getVendorInsights()` ships a real scorecard (`avgDaysToShip`, `ratingAverage`, `returnRate`), genuinely useful, but not the specific response-rate metric (still blocked on Messaging for that one). **VND-016** (storefront response-time stat) still open. **VND-023** (SEO meta injection) still open — no `react-helmet`/SSR meta injection found.
- **MSP-002** Cross-Vendor Bundling — 🔵 **NOW RESOLVED.** `create-bundle.dto.ts` + `marketplace.service.ts` (~L1372-1520): vendors can propose bundles from any vendor's products, requires elder/admin approval, has a customization-request flow. Move to ✅.
- **MSP-003** Cultural Appropriation Prevention — 🔵 **NOW RESOLVED (mostly).** `marketplace.service.ts` (~L341-398) blocks Akose/Ebo sacred-prescription terms and counterfeit/replica language at product creation; `flagProduct()` (~L980) gives community flagging → `heldForReview` queue. Move to ✅.
- **MSP-005** Vendor Collaboration Spaces — 🔵 **PARTIALLY RESOLVED.** New `VendorPartnership` feature (`vendor-partnership.dto.ts`, `marketplace.service.ts` ~L1185-1330): self-service vendor groups with auto-created forum coordination threads, tied to a planned event. This is coordination, not literal shared-inventory pooling — the doc's original "shared inventory for large ceremonies" framing isn't fully met, but the collaboration-space need substantially is.
- **MSP-006** — already ✅, unchanged.
- **MSP-009** International Shipping & Customs — 🔵 confirmed still open. `shipping-zone.dto.ts` has only country/rate/processing-time fields, no customs-docs or insurance.
- **MSP-013** Vendor-to-Client Relationship Cultivation — 🔵 confirmed still open, blocked on Messaging. New vendor-community/insights panels are vendor-to-vendor or vendor-to-self, not vendor-to-client.
- **MSP-015** Community-Supported Authenticity — 🔵 **NOW RESOLVED.** `marketplace.service.ts` (~L889-909): `ProductEndorsement`/`communityEndorsed` ("this speaks to me"), `relatedStories` (item-level cultural wiki via oral-history links), plus the MSP-003 flagging-with-education flow. Move to ✅.
- **MSP-017** Vendor Cooperative Spaces — 🔵 **NOW RESOLVED**, same `VendorPartnership` feature as MSP-005. Move to ✅.
- **MSP-018** Vendor Wellbeing & Ritual Support — 🔵 **NOW RESOLVED.** `backend/src/vendor-community/vendor-community.service.ts` (`requestSpiritualLeave`, ~L178-197) + the new `backend/src/wellbeing/` module (consent-based check-in queue, claim/resolve by designated community carers) — code comment explicitly ties this to MSP-018. Move to ✅.
- **MSP-021** Marketplace as Spiritual Journey Companion — 🔵 confirmed still open (only a stray subtitle-copy match, no real feature).
- **MSP-022** Cultural Preservation Archive (interactive map) — 🔵 confirmed still open, no mapping library in `frontend/package.json`.
- **MSP-023** Vendor-to-Client Mentorship Marketplace — 🔵 confirmed still open. `service-offerings.service.ts` is a plain babalawo service catalog (no purchase/booking layer); `community-mentorship.service.ts` is general newcomer mentorship, not vendor-specific commerce.
- **MSP-024** Cultural Gifts & Offerings — 🔵 **PARTIALLY RESOLVED.** `create-order.dto.ts` + `marketplace.service.ts` (~L2497-2644, migration `add_order_gifting`): solid single-recipient gift-by-email with message + recipient notification. Still open: pooled/group gifting, gifting recognition threads, gifting-history badges.

### Community / Forum

📄 *(COMMUNITY_BACKLOG.md — note this source doc was itself substantially rewritten this session with real code-verified statuses; its claims held up under independent spot-check)*. Re-verified 🔵 July 28, 2026. **Numbering has shifted since the original extraction — matched by content below.**

- **FOR-001** (flag-rule engine unused) — 🔵 confirmed still open, deliberately: the seed script's own header says wiring real-time auto-flagging into `forum.service.ts` "would be a genuine, separate engineering decision."
- **FOR-002** (crisis path) — 🔵 **PARTIALLY RESOLVED.** Real `crisis-detection.service.ts` now exists (keyword-based), wired into `forum.service.ts` and `circles.service.ts`, flags `hasCrisisSignal` and notifies admins. Still missing: a dedicated unit test for the crisis path, and any temporary content restriction during review (flagged content stays fully visible). Babalawo-availability integration still blocked on paused Consultations.
- **FOR-003** (guidance-request threads) — 🔵 confirmed still open, entirely unbuilt.
- **FOR-005** (Circle content moderation queue) — 🔵 confirmed still open. `CircleFeedPost` has no review-queue field; only whole-Circle suspend/archive exists, plus the crisis-specific flag (not a general queue).
- **FOR-006** (milestone-celebration notifications) — 🔵 confirmed still open; badges still compute live-on-read only.
- **FOR-007** (calendar/marketplace/forum connection) — 🔵 **PARTIALLY RESOLVED.** New `seasonal-event-reminder.service.ts` (weekly cron) auto-creates post-event "Reflections" forum threads tied to `SacredCalendarEvent.reflectionThreadId` and sends pre-event reminders — real marketplace↔calendar↔forum wiring. Still missing: automatic thread-highlighting *during* upcoming significant days (only after-the-fact reflection threads exist).
- **FOR-009** (elder tech assistance) — 🔵 confirmed still a distinct open gap. `ask-an-elder-banner.tsx` is Q&A, `community-mentorship.service.ts` is general newcomer mentorship — neither is tech assistance for elders using the platform.
- **FOR-010 / FOR-011** — greenfield (VR/AR, blockchain), unchanged, still open.
- **FOR-013** (ritual coordination) — 🔵 **PARTIALLY RESOLVED.** New `RitualParticipation` model + live panel handles RSVP + public/private intention. Still open: cross-timezone coordination, post-ritual sharing threads, calendar-tied prep guides tied to Marketplace, community-generated-ritual approval, consent-based recording.
- **FOR-014** (elder governance/succession) — unchanged, deliberately deferred by product decision, not a code gap.
- **FOR-015** (grief/ancestral support) — 🔵 **PARTIALLY RESOLVED.** A seeded Grief Circle + new `MemorialEntry`/remembrance-wall module + crisis-integration into Circles shipped. Still open: practitioner referrals, grief-practice content, post-grief reintegration pattern. **Naming trap:** `backend/src/healing/healing.service.ts`'s own header labels itself "FOR-018" (conflict mediation), not FOR-015 — don't confuse the two modules.
- **FOR-016** (healthy-boundaries content) — 🔵 confirmed narrowed to a pure content gap; everything else in this item (keyword-flagging on complaints, elder review, restoration referral) already shipped.
- **FOR-017** (referral pathway / mental-health content / restoration pattern) — 🔵 **PARTIALLY RESOLVED.** New `/wellbeing` module (check-in request/claim/resolve loop with designated community carers) shipped. Referral beyond `hello@iluase.com`, cultural mental-health content, and the "restoration journey" pattern all still open.
- **FOR-018** (restoration/reconciliation) — 🔵 **PARTIALLY RESOLVED.** New `HealingCase` model + `/healing` module ships elder-mediated conflict mediation (report → claim → resolve, verified privacy — non-parties get 403). Still open: structured restoration-plan data, formal reconciliation ceremonies, conflict-feedback loop, forgiveness/trust-restoration process. Note `backend/src/user-reports/` is a **separate, unrelated** generic "report a user" flow — don't conflate with this item.
- **FOR-019** (storytelling events) — 🔵 **PARTIALLY RESOLVED, clarified.** The new marketplace "stories" feature (`relatedProductIds` on `OralHistoryEntry`, `stories-browse-view.tsx`) is a **marketplace-item-story link**, entirely separate from forum "storytelling events" (virtual gatherings), which is the part still genuinely unbuilt.
- **FOR-020** (video guidance/practice threads/elder workshops) — 🔵 confirmed still entirely unbuilt.
- **FOR-021** (dream interpretation) — 🔵 **PARTIALLY RESOLVED.** New `DreamEntry` model + `/dreams` module ships a real private-by-default journal, public sharing opt-in, Babalawo-only interpretation-request queue. Still open: the actual Yoruba dream-interpretation cultural framework content, and "anti-manipulation" is still an undefined policy question, not a scoped feature.
- **FOR-023** (milestone-triggered mentor matching) — 🔵 **PARTIALLY RESOLVED, clarified.** `community-mentorship.service.ts` is general 30-day newcomer mentorship (self-service, capped 3 mentees/mentor), **not** milestone-triggered matching. Milestone tracking itself already exists separately (`GET /users/:id/badges`). Mentor-matching-per-milestone-stage and the Academy/Marketplace growth-support connection remain unbuilt.
- **FOR-024** (oral history revision/licensing/governance) — 🔵 **PARTIALLY RESOLVED.** Community submission path (draft → admin review → publish) fully shipped and verified end-to-end. Revision history, accuracy discussion, licensing, governance model all still open.
- **FOR-Q2** (multi-language array) — unchanged, deliberately not built, reused `dialectPreference`.

### Experience / Platform Polish

📄 *(EXPERIENCE_BACKLOG.md + Z1_BACKLOG.md)*, re-verified 🔵 July 28, 2026 — **the doc was meaningfully wrong about several of these, worth reading closely if you were about to duplicate this work:**

- **EXP-007 / Z1-301** — 🔵 confirmed still open, pure content gap (3 onboarding videos still placeholders; `cultural-onboarding-path.tsx` still has an empty "Video Guide" tab).
- **Z1-801 Circle Patron Tier — 🔵 DOC WAS WRONG, NOW RESOLVED.** Despite `Z1_BACKLOG.md` still saying "❌ NOT STARTED," `circles.service.ts` (~L587-614) has a full `becomePatron()` flow gated on `subscriptionStatus === 'DEVOTED'`, `patronOnly` feed posts, and a live frontend flow (`circle-detail-view.tsx` ~L222-296, `POST /circles/:id/become-patron`). Only missing: patron-leader direct messaging (blocked on paused Messaging) and dedicated patron badges. **Move to ✅.**
- **Z1-802 Spiritual Journey Tracker** — 🔵 confirmed consistent with CLAUDE.md: exists, routed at `/client/spiritual-journey`, deprioritized not paused. No change.
- **Z1-803 Sentiment Analysis & Crisis Prevention** — 🔵 **PARTIALLY RESOLVED.** Automated admin/elder alerts on crisis-signal detection already exist (`notifyAdmins`). Still open: `crisis-detection.service.ts` is literally an 8-keyword `.includes()` scan — no real sentiment analysis, no intervention workflow.
- **Z1-1001/1002 Error States / Edge Cases** — 🔵 **PARTIALLY RESOLVED**, not a blank slate as claimed: `error-boundary.tsx`/`tab-error-boundary.tsx` exist, plus an outbox/retry-backoff pattern landed (git history: "P1: outbox pattern, retry/backoff"). No systematic edge-case audit found though.
- **Z1-1003 Internationalization Prep** — 🔵 confirmed still open, no `i18next`/`react-i18next` anywhere.
- **Z1-1101/1102/1201 (Ops Runbook / Monitoring Dashboard / Production Readiness Checklist) — 🔵 DOC WAS WRONG, NOW RESOLVED.** `docs/active/OPERATIONS_RUNBOOK.md` (208 lines), `MONITORING_DASHBOARDS.md` (102 lines), `MONITORING_DASHBOARD_SETUP.md` (253 lines), `PRE_LAUNCH_CHECKLIST.md` (330 lines) all exist with real content, contradicting "NOT STARTED." **Move to ✅** — but flag `OPERATIONS_RUNBOOK.md` itself as stale: it describes Docker Compose production deployment, which doesn't match CLAUDE.md's actual current infra (ECS Fargate) — needs its own refresh pass, tracked as a new small doc-freshness item.
- Z1_BACKLOG.md's other internal self-contradictions (self-referential "obsolete" notice, sprint-count denominator issue) — unchanged, not re-checked this pass.

### V5 / V9 (both otherwise essentially complete)

📄 *(V5_BACKLOG.md + V9_FORUM_BACKLOG.md)*, re-verified 🔵 July 28, 2026.

- **V5-505 Set Availability: Persist to Backend — 🔵 NOW MOOT, not open.** `set-availability-view.tsx` was deleted this session as part of the MVP-pivot cleanup (Consultations paused). Backend still has `babalawo.availability` (JSON, read-only, used by `checkAvailability` during booking) but no dedicated write endpoint — and since the only UI that would call one is gone, there's nothing to build right now. Reclassify as moot/blocked-on-Consultations-relaunch rather than "condition never resolved."
- V5's own 95%-not-100% caveat (demo-mode fallback code in forum/temple views) — not re-checked this pass, presumed unchanged.
- **F9-904 Oral History Archive — 🔵 RECONCILED, both source claims were actually about different things.** (a) The pinned "Share Your Story" forum thread (`seed-forum-categories.ts` ~L120-235, tag `oral-history`) is real, seeded, and live — done as originally scoped. (b) Separately, `backend/src/seeding/oral-history.seed.service.ts`'s `loadSeedData()` looks for `data/oral-history-data.json`, which **does not exist in the repo** — it silently falls back to 3 hardcoded placeholder entries (`getDefaultOralHistoryData()`, fake `createdBy: 'admin-user-id'`). That's the part CLAUDE.md correctly calls "deferred to separate seeding task" — real, authored oral-history content records still don't exist. State both facts rather than treating this as one contradiction to resolve either way.
- Both docs' explicit "not building yet" lists — unchanged, not re-checked, still genuinely out of scope.

---

## ⚪ NEEDS A HUMAN (not code work)

📄 *(HUMAN_BACKLOG.md)*, re-verified 🔵 July 28, 2026 where code-checkable.

- **EC2 staging deploy failing**, **restart local dev servers**, **authorize `localhost:8100` in Google Cloud Console**, **verify production Google OAuth origins**, **manual QA click-through of admin dashboard**, **visually check new Google Sign-In button**, **confirm AWS Secrets Manager contents** — none of these are code-checkable from this environment; still listed as-is, unchanged.
- **Decide the fate of `GoogleStrategy`** — 🔵 updated nuance: it's now *imported* into `auth.module.ts` (no longer literally orphaned/unreferenced) but still has zero routes using the `'google'` passport strategy — the real flow is `POST /auth/google/token`. Decision to delete/keep still open, just with better information.
- **Decide whether `role-management-tab.tsx`/`profile-views-panel.tsx` should come back** — 🔵 **half-resolved.** `profile-views-panel.tsx` **is back**, fully wired to a real endpoint (`GET /users/:id/profile-viewers`) — no decision needed for that half anymore. `role-management-tab.tsx` was never restored and its target route (`/admin/roles`) still doesn't exist either — decision only remains open for this half, and since nothing currently depends on it, it's low urgency.
- **7 local-dev placeholder env vars** — 🔵 unchanged in substance; `.env.example` now documents 3 of them (the Paystack Devoted plan vars) with clearer comments about fail-loud behavior, but still needs real values before those flows work locally. `BOOTSTRAP_ADMIN_PASSWORD` still needs a production check.
- **NEW — Confirm the ~15 pending Prisma migrations from this session's checkpoint have been applied to production.** 🔵 New finding, July 28, 2026: the float-to-Decimal batch, vendor-cultural-certification, service-offerings, soft-delete, and user-reports/circle-reactions migrations all landed in the checkpoint commit with no migration-status artifact anywhere. Someone needs to run `prisma migrate deploy` against production RDS and confirm.
- **NEW — Confirm which branch CI/CD is actually meant to deploy from.** 🔵 New finding: `.github/workflows/ci-cd.yml` gates on `july-2026-hardening-pass`, but the repo's real working branch is `main`. Worth a human decision before assuming deploys are wired correctly.
- **NEW — Mobile (Capacitor/Android) needs several human steps before it can ship.** 🔵 New finding: `README_MOBILE.md`'s own "Future Enhancements" section lists app icon/splash-screen asset generation, App Store/Play Store signing + distribution, and deep-linking support as not-yet-done. Only Android is scaffolded (`frontend/android/`) — no `frontend/ios/` exists yet, so iOS needs `npx cap add ios` on a macOS/Xcode machine first. Ties into the existing `VITE_FIREBASE_*` placeholder-vars item above for native push credentials.

Related, still open: **someone needs real Paystack dashboard access** to create the Devoted Quarterly/Annual Plans and set the 3 env vars in production (V8-103, see Monetisation above) — checkout can't take real payments until this happens.

---

## 📌 Paused Platform Features — Context, Not Action Items

🔵 **Re-verified July 28, 2026, still fully intact.** Consultations, 1:1 Messaging, and Guidance Plans creation remain paused platform-wide, frontend-only and fully reversible. `frontend/src/pages/BookingPage.tsx`/`MessagesPage.tsx` confirmed absent; `PausedFeatureNotice`, `ConsultationsPausedPage`, `MessagesPausedPage` confirmed present and routed (11 call sites in `App.tsx`). Only a harmless unrelated remnant (`consultation-notes-panel.tsx`, session-notes feature) remains under `features/consultations/`. This isn't itself remaining work — it's why so many items above say "blocked on Messaging/Consultations." When those features un-pause, revisit: V8-206, V8-303, VND-012, VND-009's comm log, VND-014/016's response-rate metrics, MSP-013, FOR-002's Babalawo-availability integration, FOR-003's booking half, Z1-801's patron-leader messaging.

---

## 🔵 DELIBERATELY DEFERRED / LONG-TERM / GREENFIELD

Explicitly out of scope by design, not oversights. Not re-checked this pass (no new evidence either way) — listed compactly so nobody re-discovers these as "gaps":

**Infrastructure-dependent:** FOR-010 (VR/AR community spaces), FOR-011 (blockchain oral-history), MSP-010 (AR/VR product visualization), MSP-011 (blockchain provenance tracking).

**From V5_BACKLOG.md's "not in any sprint yet" list:** real-time notification badges, global search (Cmd+K), bulk admin actions, admin activity log, email notification templates, Babalawo availability-calendar integration, platform-wide announcement broadcast, subscription/recurring bookings, API response envelope standardization, optimistic updates everywhere, WebSocket real-time for admin, offline detection banner.

**From V9_FORUM_BACKLOG.md's "not building yet" table:** rich text editor/media embeds, forum moderation AI/NLP, inter-tradition dialogue space (1,000+ members), embeddable "Ask a Babalawo" widget, Temple API, native WebRTC for Àṣẹ Live, forum coins/token rewards, sub-categories/nested categories.

**From V8_MONETISATION_BACKLOG.md's "not building yet" table:** HD session recordings, AI transcripts, Masterclass vault, family plans, two-tier pricing, advanced search filters, Babalawo premium placement.

---

## ✅ WHAT'S ACTUALLY FULLY DONE (so you don't re-litigate it)

- **14 previously-missing admin endpoints — 🔵 verified July 28, 2026, all real.** Campaigns, promos, referrals, community stars/badges, cultural content calendar, featured-content, revenue forecasting, integrity review queue, market-intelligence, morning-brief, featured practitioners, financial-command-centre, complaints, practitioner-performance — all confirmed wired to real services in `admin.controller.ts`, not stubs. (Revenue forecasting's `platformCostNgn` sub-field is fabricated placeholder data — see 🔴 Critical, that's a data-quality issue on an otherwise-real endpoint, not a missing endpoint.)
- **3 partially-real admin features — 🔵 verified, all real now.** `GET /admin/trust-score-adjustments`, the practitioner re-engagement action endpoint, and all 3 subscription list endpoints (`/active`, `/cancelled`, `/failed-payments`) all confirmed present in `admin.controller.ts`.
- **Ban/unban endpoint — 🔵 verified, fully implemented.** `POST /admin/users/:id/ban` and `/unban` in `admin.controller.ts`, backed by `admin-users.service.ts` `banUser()`/`unbanUser()`, sets `bannedAt`/`banReason` for real.
- **`trustScore` schema drift — 🔵 verified, fully fixed.** Migration `20260705120000_reconcile_schema_drift` altered the column to `DOUBLE PRECISION`, added `trustScoreOverride*` columns, and created the `notificationPreferencesId` unique index. A follow-up migration fixed a default-value bug (0.5 vs. the intended 0-100 scale).
- **`profile-views-panel.tsx` — 🔵 verified, back and fully wired** to the real `GET /users/:id/profile-viewers` endpoint.
- **MSP-002, MSP-003, MSP-015, MSP-017, MSP-018 — 🔵 verified, all now resolved.** See Vendor/Marketplace section above for evidence per item.
- **Z1-801 Circle Patron Tier — 🔵 verified, fully built** despite Z1_BACKLOG.md saying otherwise.
- **Z1-1101/1102/1201 (Ops Runbook, Monitoring Dashboards, Production Readiness Checklist) — 🔵 verified, all exist** with real content (though the runbook itself needs a Docker-Compose→ECS-Fargate refresh).
- **Soft-delete pattern — 🔵 verified, substantially expanded** from 5 to 12 models, raw-delete sites down from 33 to 19.
- **V8 Monetisation** — 28/30 stories, 🔵 verified prior session. Full detail in `V8_MONETISATION_BACKLOG.md`.
- **Whole-app UX/UI wiring audit** — ~30 issues across CLIENT/BABALAWO/VENDOR/ADMIN, all independently re-verified fixed. See CLAUDE.md.
- **VND-017/018/019** (Cultural Integrity sprint) — all 3 done, 🔵 verified prior session.
- **MSP-006** (Marketplace Trust) — 🔵 verified/completed prior session.
- **FOR-009** (Intergenerational Bridge) — mostly 🔵 verified (elder tech-assistance sub-item still open, listed above).
- **MVP Pivot (all 14 PIV stories)** — 🔵 verified July 28, 2026, done and stable, including after this session's cleanup commit.
- **P0/P1 tiers of ProBacklog-v1.md** — done except the specifically-caveated P0-03 (hard-delete audit table) item under Structural/Tech Debt above. P0-01 (git remote) is now partially resolved — see Structural section.
- **V5 (8 sprints, 187 SP)** and **V9 Forum (9 sprints, 180 SP)** — both essentially complete; see the small exceptions under V5/V9 above.
- Most of VENDOR_BACKLOG.md, COMMUNITY_BACKLOG.md, and SHOP_BACKLOG.md — only the items explicitly listed under Feature Gaps above remain open; everything else in those three docs is done.

---

## 📚 Source Document Index

Every doc below has (or will have) a superseded-banner at its own top pointing back here. Kept for historical detail only.

| Doc | What it covered | Status baked into this doc |
|---|---|---|
| `V8_MONETISATION_BACKLOG.md` | Devoted subscription tier, billing, referrals | 3 items carried forward |
| `ADMIN_BACKLOG.md` | Admin dashboard features (ADM-XXX) | Superseded by `ADMIN_BACKEND_GAPS_BACKLOG.md`'s findings — nearly all now resolved, 2 partial items remain |
| `ADMIN_BACKEND_GAPS_BACKLOG.md` | Evidence-based re-audit of ADMIN_BACKLOG.md's claims | Now stale itself — its 14+3 gaps are resolved, see ✅ above |
| `VENDOR_BACKLOG.md` | Vendor operations (VND-XXX) | Re-verified; commission-deduction gap confirmed still real, several sub-gaps updated |
| `SHOP_BACKLOG.md` | Marketplace-wide features (MSP-XXX) | Re-verified; 6 of 16 items now resolved |
| `COMMUNITY_BACKLOG.md` | Community/forum features (FOR-XXX) | Re-verified; most items partially resolved, numbering has shifted |
| `EXPERIENCE_BACKLOG.md` | Practitioner/client experience (EXP-XXX) | Re-verified; unchanged |
| `Z1_BACKLOG.md` | Consolidated production-readiness sprints (Z1-XXX) | Re-verified; doc was wrong about 4 items (Z1-801, 1101, 1102, 1201) — all actually done |
| `ProBacklog-v1.md` | Code-quality/structural-integrity audit (P0–P3, EMG) | Re-verified; real progress on soft-delete and trustScore, most else unchanged |
| `V5_BACKLOG.md` | Real-data platform wiring (V5-XXX) | Re-verified; V5-505 now moot |
| `V9_FORUM_BACKLOG.md` | Forum launch (F9-XXX) | Re-verified; F9-904 contradiction reconciled (both claims were true, about different things) |
| `HUMAN_BACKLOG.md` | Action items needing a human (not code) | Re-verified where checkable; 3 new human items added |
| `MVP_PIVOT_BACKLOG.md` | Consultations/Messaging pause (PIV-XXX) | 🔵 Re-verified still fully done and stable |

---

*Originally built July 28, 2026 from 6 parallel extraction passes over the 13 docs above. Reconciled a second time the same day (July 28, 2026) after discovering ~426 files of real prior-session work had been sitting uncommitted — that work was committed in 13 subsystem-grouped commits, then 4 parallel verification agents independently re-checked every claim in this doc against the resulting code. Update this doc, not the source docs, as work gets done — add a 🔵 verified/fixed note the same way this doc's own items are annotated, and move completed items down to the ✅ section rather than deleting them, so the "why isn't this still open" history stays visible.*
