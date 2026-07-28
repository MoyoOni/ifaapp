> ⚠️ **SUPERSEDED as of July 28, 2026** — see [`ILUASE_V1_BACKLOG.md`](ILUASE_V1_BACKLOG.md) for the current single source of truth on remaining work. This file is kept for its detailed per-story write-ups only; don't use it to decide what to work on next.

# Ìlú Àṣẹ — SHOP_BACKLOG — Sacred Goods Marketplace

> **Last Updated**: July 24, 2026 (reality-checked against the actual codebase)
> **Next Review**: August 2, 2026 — after initial vendor feedback integration
> **Platform Status**: Production-ready marketplace with vendor operations, cultural authenticity verification, multi-currency support, escrow payments, and admin oversight. This backlog tracks marketplace-specific features and enhancements beyond the core vendor operations documented in VENDOR_BACKLOG.md. Existing docs (VENDOR_BACKLOG.md, Z1_BACKLOG.md) describe vendor capabilities; this backlog focuses on **marketplace-wide dynamics, discovery, curation, and cross-vendor experiences** that those docs don't cover.
>
> **What changed in this revision**: every item below has been checked against the real Prisma schema, marketplace service/controller code, and frontend components rather than treated as a wishlist written in isolation. More of the foundation exists than the original draft assumed — a real three-tier authenticity system, per-product provenance/usage fields, a cultural taxonomy with subcategory notes, and a working vendor cultural-vetting flow all already ship. Nothing already-built is re-proposed here — each item says plainly what exists today and what the remaining gap actually is. **All AI-driven discovery/matching concepts have been removed** (MSP-012 entirely, plus the "semantic/visual search" and AI bullets inside MSP-001 and MSP-003) — they conflicted with this document's own Cultural Integrity Principle #2 ("AI/technology is a tool, not a replacement for human spiritual leadership") and duplicated vetting work a real admin review flow already does. One stale cross-reference was also fixed: MSP-002 cited a "VND-015 (Bundle Builder)" dependency that doesn't exist in VENDOR_BACKLOG.md — VND-015 is actually Seasonal & Festival Planning.
>
> **Follow-up pass (same day)**: added an "At a Glance" table, notes on reviewer-capacity and the illustrative (not real) nature of "Owner" fields, a Success Metrics section, and monetization-candidate flags on MSP-023. Also linked MSP-006 and MSP-015/020/022 to two new coordination items now living in `COMMUNITY_BACKLOG.md` (FOR-025 unifies trust scoring across both docs; FOR-026 consolidates oral-history/storytelling effort) so this doc's own trust and storytelling work doesn't get built as a disconnected duplicate of Community's. The paused/deprioritized-dependency notes for MSP-013 and MSP-021 now point to a single shared list in `CLAUDE.md` instead of restating status here.

---

## ✅ Already Live — Don't Rebuild This

A quick inventory so nothing below gets re-proposed as new work. If your idea is "add X," check here first — X may already exist and just need a follow-on enhancement (each item below links to the MSP-XXX it feeds).

**Cultural taxonomy & authenticity** (this is the biggest gap between what the original backlog assumed and what's real):
- 8 marketplace categories with subcategories, each carrying a real Yoruba **cultural context note** in the data itself (`marketplace-categories.ts` — e.g. "Divination Tools: Opon Ifá, Ikin, Opele chains, Iyerosa powder"). This *is* the "cultural taxonomy" MSP-001 assumed needed building from scratch.
- A real three-tier authenticity system — `VerifiedTier`: `COUNCIL_APPROVED`, `ARTISAN_DIRECT`, `COMMUNITY_LISTED` — set per product and displayed as a badge on the product detail page. This is what MSP-001's "Community Verified / Elder Endorsed / Regional Origin" filter idea already exists as underneath; **it's just not exposed as a filter control in the browse UI yet** — that's the real remaining gap.
- A working vendor cultural-vetting pipeline: `artisanHeritageProof`, `culturalAuthenticityNotes`, `yorubaProficiencyLevel`/`yorubaProficiencyProof` fields captured at vendor signup, reviewed by admins with approve/reject + notes (`admin.service.ts`, `admin-users.service.ts`), surfaced in `vendor-review-view.tsx`. This is VND-017 (Cultural Authenticity Certification) already substantially built, not a future item.
- Per-product `provenance`, `usageProtocol`, and `requiresInitiation` fields already exist in the schema — the data model for "where this came from" and "how to use it respectfully" is there; it's just not richly surfaced in product-listing UI yet (feeds MSP-007, MSP-019, MSP-020).

**Reviews & moderation**:
- `ProductReview` model with built-in moderation (`flaggedCount`, `status`, `moderatedAt`/`moderatedBy`, `moderationNotes`) — a real review + moderation system exists (feeds MSP-006). What's missing is a *vendor-level* aggregate trust score; today's reviews are per-product only.

**Admin & platform infrastructure**:
- Featured-content system (`isFeatured`/`featuredUntil` on `Product`) via `admin-cultural-content-tab.tsx`/admin tooling — admins can already spotlight products (feeds MSP-008)
- `SacredCalendarEvent` + `OralHistoryEntry` models with full admin CRUD (shared with the Forum's cultural-content system) — a real cultural calendar already exists (feeds MSP-008, MSP-014)
- `PromoCode` and `Referral` models with admin CRUD — discount/promotion and referral infrastructure already exists (feeds MSP-008; adjacent to, not the same as, MSP-013's vendor-client loyalty idea)
- `Wallet` and `Escrow` models — a real payment/holding rail already exists, which is the natural foundation to build gifting (MSP-024) on top of, rather than a payment system to invent
- The **Spiritual Journey** feature exists and is routed (`/client/spiritual-journey`) — but per `CLAUDE.md` it's deprioritized for the current launch window (not actively paused like Consultations, just not a current focus). MSP-021 depends on it; treat as "exists, low current priority" rather than "blocked."

**Genuinely not built** (confirmed by checking, not assumed): no bundle/kit model of any kind, no wholesale/B2B pricing fields on `Product`, no vendor-cooperative or apprenticeship data model, no gift-specific fields on `Order`. Where an item below depends on one of these, it's marked NOT STARTED — these are real gaps, not just unexposed infrastructure.

**A note on dependencies that are currently paused or deprioritized**: this is tracked in exactly one place now — see `CLAUDE.md`'s "Paused / Deprioritized Platform Dependencies" list — so a relaunch updates one file instead of two. As of this revision: MSP-013 depends on Messaging (paused), MSP-021 depends on the Spiritual Journey feature (exists, deprioritized — confirm current priority before starting, don't assume "exists" means "active").

**A note on "Owner" fields below**: they're illustrative labels ("Innovation Team," "Logistics Team"), not real assigned teams. Read every `Owner` field as one of three realistic buckets instead: **Engineering** (schema/API/UI work), **Product & Content** (policy, listings, curation), or **Community & Vendor Ops** (the people actually reviewing vendors, running promotions, and supporting the marketplace day to day). See `COMMUNITY_BACKLOG.md` for the fuller version of this note — same issue, same fix, don't restate it differently in two places.

**A note on reviewer capacity**: MSP-001, MSP-003, MSP-006, and MSP-015 all route to the existing vendor/admin review pipeline. That pipeline is real and already ships — but it assumes reviewer headcount that should be checked before promising review-turnaround times to vendors, same caveat as `COMMUNITY_BACKLOG.md`'s equivalent note.

---

## 📊 At a Glance

| ID | Item | Priority | Status | SP |
|---|---|---|---|---|
| MSP-001 | Authenticity-Aware Product Discovery | P0 | ✅ Done (July 26, 2026) | 2 |
| MSP-002 | Cross-Vendor Product Bundling & Ritual Kits | P0 | ✅ DONE (July 24, 2026) — full loop, all UIs | 8 |
| MSP-003 | Cultural Appropriation Prevention | P0 | 🟡 Partial (product flagging shipped July 25 via MSP-015) | 3 |
| MSP-004 | Marketplace-Wide Recommendation Rules | P1 | 🟢 Mostly built (July 25, 2026) | 2 |
| MSP-005 | Vendor Collaboration Spaces | P1 | 🟢 Mostly built (July 25, 2026) | 2 |
| MSP-006 | Marketplace Reputation & Trust System | P1 | 🟢 Mostly built (transparency report + trust restoration shipped July 27) | 1 |
| MSP-007 | Cultural Education Integration | P2 | 🟢 Mostly built (July 25, 2026) | 1 |
| MSP-008 | Seasonal & Ceremonial Marketplace Events (merged w/ MSP-014) | P0 | 🟢 Mostly built (July 25, 2026) | 1 |
| MSP-009 | International Shipping & Customs Support | P2 | 🟡 Partial (July 25, 2026) — 3/5 closed, 2 genuinely blocked on VND-011 | 6 |
| MSP-010 | AR/VR Product Visualization | P3 | ⬜ Not started | 21 |
| MSP-011 | Blockchain Provenance Tracking | P3 | ⬜ Not started | 18 |
| ~~MSP-012~~ | ~~AI-Powered Cultural Matching~~ | — | ❌ Removed | — |
| MSP-013 | Vendor-to-Client Relationship Cultivation | P0 | ⬜ Not started (blocked on Messaging) | 8 |
| ~~MSP-014~~ | ~~Cultural Celebration Calendar Integration~~ | — | 🔀 Merged into MSP-008 | — |
| MSP-015 | Community-Supported Authenticity | P0 | 🟢 Mostly built (July 25, 2026) — badge/story/flag shipped, wiki/education content-only remains | 3 |
| MSP-016 | Apprenticeship-to-Vendor Pathway | P1 | 🟢 Mostly built (July 25, 2026) | 2 |
| MSP-017 | Vendor Cooperative Spaces | P1 | ⬜ Not started (depends on unbuilt VND-025) | 9 |
| MSP-018 | Vendor Wellbeing & Ritual Support | P1 | 🟢 Mostly built (July 25, 2026) | 2 |
| MSP-019 | Ritual Readiness Kits | P2 | 🟢 Mostly built (July 25, 2026) | 1 |
| MSP-020 | Marketplace Storytelling (Item Origins) | P2 | 🟢 Mostly built (July 25, 2026) | 1 |
| MSP-021 | Marketplace as Spiritual Journey Companion | P2 | ⬜ Not started (confirm dependency priority) | 9 |
| MSP-022 | Marketplace as Cultural Preservation Archive | P3 | 🟢 Mostly built (July 25, 2026) | 3 |
| MSP-023 | Vendor-to-Client Mentorship Marketplace | P3 | ⬜ Not started | 12 |
| MSP-024 | Marketplace for Cultural Gifts & Offerings | P3 | 🟢 Core loop done (July 25, 2026) | 4 |

**Total remaining effort**: ~123 SP across 21 open items (down from 24 after removing MSP-012 and merging MSP-014 into MSP-008; down further as of July 24-25, 2026 now that FOR-025/FOR-026 shipped, MSP-001 partially shipped, MSP-015's endorsement/flagging system shipped (which also closed most of MSP-003's remaining scope), MSP-016/MSP-018 shipped alongside `VENDOR_BACKLOG.md`'s VND-019, MSP-020/MSP-022's story browse + collections shipped, MSP-004's rule-based recommendations shipped, MSP-019's ritual kit guides/threads/customization shipped, MSP-007's education integration shipped, MSP-005's vendor partnerships shipped, MSP-009 partially shipped (3/5 criteria — the other 2 are honestly blocked on VND-011 and real external commitments, not left unbuilt by oversight), and MSP-008 fully shipped (its own notes' "no event↔product relation" limitation resolved along the way).

**Implementation started July 24, 2026** (same session as the reality-check pass): MSP-001's tier filter and ranking, and MSP-008's calendar-to-featured-items connection, are both live and verified end-to-end. Two things found and fixed along the way that weren't part of either item's original scope but blocked them from actually working: (1) `MarketplaceController` had the same broken-auth-guard bug already fixed on Academy this session — every browse/detail endpoint 401'd for anonymous visitors; fixed for products/reviews, deliberately **not** fixed for `GET /marketplace/vendors` since that endpoint leaks raw vendor PII (`taxId`, `businessLicense`, `rejectionReason`) with no field scoping — that's a real, separate security gap worth its own ticket. (2) The frontend already sent a `search` query param that the backend silently ignored — dead code, not a regression, but confirms MSP-001's "keyword search" criterion is genuinely unbuilt, not partially built.

---

## 🔴 CRITICAL — Marketplace Core Experience

### MSP-001: Authenticity-Aware Product Discovery
- **Priority**: P0
- **Status**: ✅ DONE (July 26, 2026)
- **Owner**: Marketplace Team
- **Story Points**: 2
- **Description**: Product search is currently category/subcategory only. The cultural taxonomy (8 categories with per-subcategory cultural notes) and the authenticity tier system (`VerifiedTier`) already existed in the data model; this item exposed them as real filters.
- **Acceptance Criteria**:
  - [x] Cultural taxonomy with contextual notes per subcategory — exists (`marketplace-categories.ts`)
  - [x] Filter control for authenticity tier on the browse page — **shipped**: `verifiedTier` query param on `GET /marketplace/products` (`marketplace.controller.ts`/`marketplace.service.ts`), plus a chip-style filter row in `marketplace-view.tsx` ("Council Approved" / "Artisan Direct" / "Community Listed" / "All Tiers")
  - [x] ~~Semantic search~~ / ~~visual search~~ — removed; reframed below
  - [x] Keyword search across the existing taxonomy's cultural notes (e.g. searching "Cascarilla" surfaces items in the `ritual-supplies` subcategory even if no individual product's own text mentions it), not an ML/semantic layer — **shipped July 26, 2026**: `search` query param on `GET /marketplace/products` now matches `name`/`description`/`longDescription` case-insensitively, OR'd with any subcategory whose cultural note contains the term. The note text is mirrored backend-side in `backend/src/marketplace/marketplace-cultural-notes.ts` (Prisma can't query the frontend's TS constant directly) — a manual mirror of `marketplace-categories.ts`'s `culturalNote` fields, acceptable since that taxonomy is static reference content that rarely changes. Also fixed an adjacent dead param found in the same code: `subcategory` was already being sent by the frontend but silently dropped by the backend too (the subcategory dropdown did nothing). 4 new unit tests in `marketplace.service.spec.ts`.
  - [x] Search result ranking that factors in authenticity tier — **shipped**: `MarketplaceService.VERIFIED_TIER_RANK`, a plain rank map (`COUNCIL_APPROVED` → `ARTISAN_DIRECT` → `COMMUNITY_LISTED`, ties broken by newest-first), applied in-application after the Prisma fetch. Fully rule-based and unit-tested (4 new tests covering ranking, tie-breaking, filtering, and a defensive fallback for missing fields).
- **Dependencies**: VND-017 (Cultural Authenticity Certification — substantially built, see above), VND-018 (Yoruba Language Product Listings)
- **Notes**: "Ask an Elder" discovery is intentionally not duplicated here — see COMMUNITY_BACKLOG.md's FOR-Q3. **Also found and fixed while implementing this**: `MarketplaceController` was still using the raw `AuthGuard('jwt')` (the same broken pattern Academy had, fixed earlier this session) instead of `JwtAuthGuard`+`@Public()`, meaning every marketplace browse/detail/review-read endpoint 401'd for anonymous visitors. Fixed for `findAllProducts`, `findProductById`, `findProductReviews`, and the new `upcoming-events` endpoint (see MSP-008). **Deliberately left un-public**: `GET /marketplace/vendors` — it returns raw `Vendor` scalar fields including `taxId`, `businessLicense`, and `rejectionReason` with no field-level scoping; making it fully public would leak vendor PII. That's a separate, real gap worth its own ticket (add a `select` and/or a public-safe DTO), not fixed here since it's outside what MSP-001 needed.

### MSP-002: Cross-Vendor Product Bundling & Ritual Kits
- **Priority**: P0
- **Status**: 🟢 BACKEND + CUSTOMER-FACING UI DONE (July 24, 2026) — genuinely greenfield when picked up, no bundle/kit model existed anywhere in the schema before this
- **Owner**: Marketplace Team
- **Story Points**: 6 *(revised down from 8 — two acceptance criteria turned out to already be solved by existing infrastructure once investigated, see below)*
- **Description**: Allow creation of ceremonial bundles combining items from multiple vendors (e.g., an Ifá divination kit with tools from different specialists).
- **What shipped**: new `ProductBundle`/`ProductBundleItem` models (migration `20260724122827_add_product_bundles`). A vendor proposes a bundle (`POST /marketplace/bundles`) referencing any ACTIVE products, including other vendors' — it lands as `PENDING_REVIEW`. Admins approve/reject through a new pair of routes (`GET /admin/marketplace/bundles/pending`, `POST /admin/marketplace/bundles/:id/review`) that exactly mirror the existing `reviewVendorApplication` pattern — no parallel approval system. Once `APPROVED`, `GET /marketplace/bundles` (public) and `GET /marketplace/bundles/:id` (public) surface it; `GET /marketplace/bundles/mine` (vendor-only) shows a vendor's own bundles at any status.
- **Acceptance Criteria**:
  - [x] Multi-vendor bundle creation with shared revenue splits — **turned out to need no new revenue-split logic at all**: `Order` is already scoped per-vendor (one `Order` row per `vendorId`), and the frontend checkout (`checkout-view.tsx`) already groups cart items by vendor and fires one `createOrder` call per vendor group. A bundle is purely a curation/discovery layer on top of `Product` — each vendor is paid exactly as if the sale happened outside a bundle, because it structurally does.
  - [x] Bundle approval by cultural elders before listing — shipped, reusing the `ReviewVendorDto`-style approve/reject shape (new `ReviewBundleDto`) and the same admin-review pattern as vendor applications
  - [x] Shopping cart handling for multi-vendor bundles (single checkout, multiple shipments) — **already worked with zero new code**: since a bundle's components keep their own `vendorId`, adding all of a bundle's products to the existing cart (`cart-context.tsx`'s `addItem`, called once per component) and checking out already produces one order per vendor, each with its own shipping. Verified live (see below).
  - [x] Bundle inventory management (available when all components available) — computed live on every read (`totalPrice`/`available` derived from current component product price/status/stock), never stored, so a bundle can't drift stale when a vendor updates their own product
  - [ ] Cross-sell recommendations based on ritual completeness — not built; genuinely new discovery/ranking work, reasonable to defer to a follow-up pass
- **Verified live end-to-end**: registered two real vendors + one product each → Vendor A proposed a bundle spanning both vendors' products → confirmed `PENDING_REVIEW` and invisible to `GET /marketplace/bundles`/`GET /marketplace/bundles/:id` → confirmed visible in Vendor A's `bundles/mine` and the admin pending queue → admin approved → confirmed now public with correctly computed `totalPrice` (₦31,000 = ₦15,000×1 + ₦8,000×2) and `available: true` → simulated the cart/checkout flow by creating one order per vendor for the bundle's components → confirmed each vendor received a separate `Order` at their own correct price (₦16,125 and ₦17,200 respectively, tax included), proving revenue is naturally split with no new payment code. All test data deleted afterward.
- **Also added**: 10 new unit tests in `marketplace.service.spec.ts` covering vendor/approval/stock-availability guard rails for `createBundle`/`findAllBundles`/`findMyBundles`/`findBundleById`.
- **Customer-facing UI shipped** (same day): a "Ritual Kits & Bundles" horizontal-scroll section in `marketplace-view.tsx`, showing each approved bundle's name, item/vendor count, computed total price, and availability. "Add Kit to Cart" adds every component product to the existing cart (`cart-context.tsx`'s `addItem`, called once per item) — no new cart code needed, since checkout already groups by vendor. Verified live in a real browser: registered two vendors + products, created and approved a bundle via the API, loaded `/marketplace`, confirmed the section rendered with the correct ₦31,000 total and "2 items from 2 vendors," clicked "Add Kit to Cart," and confirmed the cart badge went from 0 → 3 (matching the bundle's total quantity). Screenshots taken before/after the click. All test data deleted afterward.
- **Vendor + admin management UI shipped** (July 24, 2026, same day): a "Bundles" tab in the real vendor dashboard (`vendor-dashboard/bundle-management.tsx`) lets a vendor search the full public product catalog (any vendor, not just their own), select 2+ items with quantities, name/describe the bundle, and submit — then see their own bundles listed with live status (`PENDING REVIEW`/`APPROVED`/`REJECTED`, with the rejection reason shown if rejected). A matching "Bundles" sub-tab in the admin Marketplace tab (`admin-marketplace-tab.tsx`) lists everything pending with an itemized breakdown and one-click Approve or Reject-with-reason.
- **Bug found and fixed during this verification pass**: the admin Marketplace tab's existing `ProductsTab`/`OrdersTab` (code nobody had touched, unrelated to bundles) referenced field names that never matched what `AdminMarketplaceService` actually returns — `title` instead of `name`, `vendor.name` instead of `vendor.businessName`, `_count.reviews` instead of `reviewCount` — so the tab crashed on every single mount, for every admin, every time. This was undiscovered until this pass because the tab needed a real live-browser visit to surface it (unit tests don't exercise the on-mount render against real API response shapes). Fixed by correcting the interfaces and render calls to match the real backend response.
- **Verified live in a real browser, full loop**: registered two vendors + products → as Vendor A, opened `/vendor/dashboard` → Bundles tab → searched and selected both vendors' products → submitted → confirmed "Bundle submitted for elder review" toast and a `PENDING REVIEW` badge on the new bundle card with the correct itemized total (₦18,000). Then as admin, opened the dashboard → Temples & Marketplace → Marketplace → Bundles sub-tab → confirmed the same bundle appeared with proposer name and itemized breakdown → clicked Approve → confirmed "Bundle approved" toast, the queue emptied, and the bundle was now live via the public `GET /marketplace/bundles` endpoint. Screenshots taken at each step. All test data deleted afterward.
- **Remaining gap**: none for the core loop — create → approve/reject → browse → cart → checkout is fully built and UI-usable end to end for vendors, admins, and customers. Cross-sell recommendations (the one still-open acceptance criterion) remain future work.
- **Dependencies**: VND-011 (Shipping Management) — not actually required for the backend loop above; only relevant once real shipping-cost splitting per vendor-order matters, which the existing per-vendor `Order.shippingCost` field already supports today
- **Notes**: The original draft cited a "VND-015 (Bundle Builder)" dependency — that item doesn't exist in VENDOR_BACKLOG.md (VND-015 is Seasonal & Festival Planning). The biggest surprise here was how much of the *hard* part (multi-vendor checkout, revenue splitting) was already solved by the existing per-vendor `Order` model and cart grouping — the actual new work was narrowly the bundle curation/approval layer itself.

### MSP-003: Cultural Appropriation Prevention — Extend the Existing Vetting Pipeline
- **Priority**: P0
- **Status**: 🟡 PARTIALLY BUILT
- **Owner**: Compliance Team
- **Story Points**: 3 *(revised down from 8 — product-level flagging/review queue now shipped via MSP-015; remaining scope is the blacklist doc and a dedicated education module, both content tasks)*
- **Description**: The vendor cultural-vetting pipeline (heritage proof, authenticity notes, admin approve/reject) already exists and runs at vendor signup. What's missing is the same rigor applied per-listing rather than only per-vendor, and a documented topic blacklist.
- **Acceptance Criteria**:
  - [x] ~~AI-powered content analysis~~ — removed; the existing admin review flow is the mechanism (Cultural Integrity Principle #2)
  - [x] Vendor-level cultural vetting — exists (`artisanHeritageProof`, `culturalAuthenticityNotes`, admin approve/reject)
  - [x] Community reporting system for cultural concerns *at the product level* — **shipped July 25, 2026 as part of MSP-015**: `POST /marketplace/products/:id/flag`, any authenticated user, one open flag per listing at a time. See MSP-015 for full detail.
  - [x] Elder review queue for flagged *items* specifically — **shipped July 25, 2026 as part of MSP-015**: `GET /admin/marketplace/products/flagged` + `PATCH .../:id/clear-flag`, "Flagged" sub-tab in `admin-marketplace-tab.tsx`. Built with `heldForReview`/`reviewReason`/`reviewedBy`/`reviewedAt` directly on `Product` rather than the originally-proposed `ProductReview.flaggedCount`/`status` — those fields live on individual reviews, not the listing itself, and don't cleanly express "this whole listing is under review." Same `heldForReview` pattern as ADM-018's `ForumPost` queue.
  - [ ] Documented blacklist of prohibited items/categories (Akose, counterfeits, misappropriated sacred items) — a content/policy task, not new schema
  - [x] Vendor education on cultural boundaries — partially covered by the existing certification application flow; a dedicated education module is the remaining piece
- **Dependencies**: VND-017 (substantially built, see above)
- **Notes**: The "Forum Crisis Detection" dependency in the original draft now maps to COMMUNITY_BACKLOG.md's FOR-002 (Crisis Escalation Protocol) — cross-reference that item rather than re-specifying escalation here.

---

## 🟡 SIGNIFICANT — Marketplace Dynamics & Growth

### MSP-004: Marketplace-Wide Recommendation Rules
- **Priority**: P1
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Marketplace Team
- **Story Points**: 2 *(revised down from 8 — all criteria shipped or already covered)*
- **Description**: The original draft proposed a data-science recommendation engine. Reframed as rule-based recommendations against existing data (purchase history, `SacredCalendarEvent` dates, category taxonomy) rather than a personalization/ML system — consistent with this document's own transparency principle ("no algorithmic black-box decisions").
- **Acceptance Criteria**:
  - [x] Rule-based recommendations from a user's purchase history within the existing category taxonomy — **shipped July 25, 2026**: `GET /marketplace/products/recommendations` (auth required, keyed off the caller's own order history) looks at the categories a user has actually purchased from (via `OrderItem`→`Product.category`), recommends other `ACTIVE` products in those categories they don't already own. "Because you bought in [Category]" section on the marketplace homepage — the plain-language "why" is right in the section title. Live-verified: empty before any purchase, correctly excludes the already-purchased item and includes same-category items from other vendors after a real order.
  - [x] Seasonal/ceremonial recommendations tied to `SacredCalendarEvent` entries — **already built via MSP-008** (`getUpcomingEventsWithFeaturedItems`), and honestly documented there as "what's coming up" alongside "what's currently featured" rather than a precision event→product match the schema doesn't support (no field links a product to a specific ceremony). Not rebuilt here; that gap (a real product↔event tag) would be new schema, out of scope for this pass.
  - [x] Cross-cultural practice recommendations — **shipped July 25, 2026**: "Explore Cross-Cultural Practice Bridges" link on the marketplace homepage, pointing to the Circle built for `COMMUNITY_BACKLOG.md`'s FOR-005 — coordinated as instructed, not a second implementation.
  - [x] Vendor collaboration surfacing (vendors serving similar communities/categories) — **shipped July 25, 2026**: `GET /marketplace/products/:id/similar-vendors` (public), "More vendors in [Category]" section on the product detail page, excludes the product's own vendor. Live-verified: two vendors in the same category, each correctly sees only the other.
  - [x] Cultural education recommendations linking to Academy — **shipped July 25, 2026**: "Learn the cultural context in the Academy" link on the marketplace homepage. Kept as a single general link rather than per-category course matching, since Academy is deliberately single-course for now (see `MSP-016`'s notes) — a fake per-category match with only one course to match against would misrepresent what exists.
- **Dependencies**: `SacredCalendarEvent` (exists), Academy (live)
- **Notes**: Explicitly rule-based, not an ML recommendation engine — "why am I seeing this" should always have a plain-language answer, and every recommendation shipped here has one (a category name, a fellow vendor, a linked Circle). 4 new backend unit tests added to `marketplace.service.spec.ts` (49/49 passing in that file). Full sweep clean (backend `tsc`, 514 backend tests, frontend `tsc`).

### MSP-005: Vendor Collaboration Spaces
- **Priority**: P1
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Community Team
- **Story Points**: 2 *(revised down from 10 — full loop shipped by reusing four already-live systems rather than building a parallel stack)*
- **Description**: Enable vendors to collaborate on cultural initiatives, joint offerings, and community support. `VendorPartnership` (new, migration `20260725163208_add_vendor_partnership`) is a declared, self-service vendor group — no admin review needed, unlike `ProductBundle`'s listing-review flow, since forming a group has no direct financial/marketplace-listing implication.
- **Acceptance Criteria**:
  - [x] Vendor partnership profiles and collaboration tools — **shipped July 25, 2026**: `VendorPartnership` model (name, description, `memberVendorIds` array — same pattern as `OralHistoryEntry.relatedProductIds`, not a join table, since membership carries no extra per-member data). `POST /marketplace/partnerships` (approved vendors only, can pre-invite other approved vendors), `GET /marketplace/partnerships` (public list — visible to buyers too, not just vendors, since transparency about who's collaborating builds trust), `GET .../:id`, `POST/DELETE .../:id/join` (self-service join/leave). New public pages: `/marketplace/partnerships` and `/marketplace/partnerships/:id`, plus a "Vendor Partnerships" card in the vendor dashboard's Community tab.
  - [x] Joint event planning tied to `SacredCalendarEvent` — a partnership can optionally set `plannedEventId` at creation (picked from the same live upcoming-events data MSP-008 already surfaces), shown on the partnership's detail page as "Preparing For [event]."
  - [ ] Shared inventory for large-scale ceremonies — genuinely deferred: real stock-pooling across vendors needs VND-025 (Wholesale & B2B Sales, still unbuilt). A partnership can coordinate a joint listing today via `MSP-002`'s cross-vendor `ProductBundle` (already supports products from any vendor), but that's coordination via an existing mechanism, not literal shared-inventory tracking — noted honestly rather than claimed done.
  - [x] Collaborative cultural education content creation — **shipped July 25, 2026**: reuses `MSP-022`'s tag-based collection browsing rather than a new content model. Each partnership gets an auto-derived tag (`partnership-<id>`, returned as `teachingsTag`); members tag their `OralHistoryEntry` submissions with it, and the partnership's detail page links straight to `/marketplace/stories?tag=partnership-<id>` (added `?tag=` URL-param support to the Stories browse view for this). Live-verified: a tagged story correctly appears via that deep link.
  - [x] Vendor-to-vendor communication and resource sharing — **shipped July 25, 2026**: reuses the Vendor Circle forum (`VENDOR_BACKLOG.md` VND-019) rather than a parallel messaging system (Messaging itself is paused platform-wide, see `CLAUDE.md`). A coordination `ForumThread` is auto-created the moment a partnership forms, authored as the founding vendor, linked from the partnership's detail page. Live-verified: thread correctly created in the Vendor Circle category with the right title/author.
- **Dependencies**: VND-019 (Vendor Community & Knowledge Sharing — built July 25, 2026, see `VENDOR_BACKLOG.md`), VND-025 (Wholesale & B2B Sales — still unbuilt; only blocks the one deferred criterion above, not the rest of this item)
- **Notes**: Strengthens vendor ecosystem and cultural authenticity. Live-verified end-to-end: partnership created (with auto-thread) → second vendor joins → duplicate join correctly rejected → vendor leaves → non-member leave correctly rejected → re-join → tagged teaching correctly surfaces via the partnership's deep link. 5 new backend unit tests (59/59 passing in `marketplace.service.spec.ts`; 524/524 full backend suite). Found and fixed a `ForumCategory.threadCount` drift on `vendor-circle` left over from this session's own test cleanups (same class of cosmetic drift noted earlier for `seeker-questions`) — not a bug in the new code, just a byproduct of raw-SQL test-data deletes not decrementing the counter the way the real service does.

### MSP-006: Marketplace Reputation & Trust System
- **Priority**: P1
- **Status**: 🟢 MOSTLY BUILT (July 27, 2026) — transparency reports + trust-restoration connective tissue shipped
- **Owner**: Trust & Safety Team
- **Story Points**: 1 *(revised down from 4 — the two remaining criteria both shipped in one pass, reusing entirely existing data)*
- **Description**: `ProductReview` already carries rating, moderation status, and flag counts. `COMMUNITY_BACKLOG.md`'s FOR-025 (done July 24, 2026) resolved the vendor-level rollup question. **Shipped July 27, 2026**: the two remaining criteria ("transparency reports" and "conflict resolution and trust restoration") turned out to need no new schema at all — just surfacing signals that already existed.
- **Acceptance Criteria**:
  - [x] Per-product reviews with moderation — exists (`ProductReview`)
  - [x] Vendor-level aggregate reputation — **done via FOR-025**: `recomputeTrustScore()` in `backend/src/users/users.service.ts` now includes a vendor-signal block, gated on the user having a `vendorProfile`. See `COMMUNITY_BACKLOG.md`'s FOR-025 for the full implementation notes and test coverage.
  - [x] Community trust indicators (elder endorsements) — surfaced via the existing `ElderEndorsement` model, no parallel system built
  - [x] Transparency reports on vendor practices and sourcing — **shipped July 27, 2026**: new `GET /marketplace/vendors/:id/transparency-report` (`marketplace.service.ts`'s `getVendorTransparencyReport`) aggregates 30-day fulfillment rate, return rate, review average, VND-017 cultural-certification sourcing statement, dispute resolution history (counts only — never raw dispute content/reasons, a deliberate privacy choice), and elder endorsement count. Rendered as a collapsible "Transparency Report" card on `VendorStorefrontPage.tsx`. This directly answers the "nothing in the marketplace UI surfaces this score to buyers yet" gap flagged in this doc's own Success Metrics section below.
  - [x] Conflict resolution and trust restoration mechanisms — **shipped July 27, 2026**: the real gap wasn't a missing dispute/restoration system (`Dispute` + `AdminTrustScoreService.applyOverride` already existed and were already generic across roles) — it was that the admin trust-score **review tool** couldn't meaningfully be used for a vendor account, because its breakdown was hardcoded to babalawo-shaped signals (appointments, consultations) and showed all-zero/irrelevant data for a vendor. Fixed with a vendor-detection branch (`getVendorBreakdown()`) reusing Dispute/ReturnRequest/ProductReview/ElderEndorsement data — that's the missing connective tissue between "a conflict was resolved" and "trust can be restored."
  - [ ] Vendor accountability measures and improvement pathways — shipping-reliability data isn't tracked anywhere yet; would need a new signal, not just wiring an existing one
- **Dependencies**: VND-026 (Vendor Performance Tiers), VND-022 (Review & Reputation Management), `UserBadge` system (exists, see COMMUNITY_BACKLOG.md)
- **Notes**: Builds marketplace-wide trust beyond individual transactions. Live-verified end-to-end (real fixture vendor with orders/review/dispute/certification/endorsement): transparency report showed 75% fulfillment, 0% return rate, 1/1 disputes resolved, correct sourcing statement; admin trust-score audit showed the same vendor's real breakdown (5.0 avg rating, 4 orders, 1 elder endorsement, 42pt computed total) instead of the old all-zero display. Remaining scope (shipping reliability) is a genuinely new signal, not more plumbing on existing data.

---

## 🟡 MINOR — Marketplace Enhancement Features

### MSP-007: Cultural Education Integration
- **Priority**: P2
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Education Team
- **Story Points**: 1 *(revised down from 5 — most criteria were already covered by MSP-020/MSP-022's story infrastructure; only the purchase-based recommendation was genuinely new)*
- **Description**: `Product.usageProtocol` already gives every item a home for "how to use this respectfully." The gap is surfacing it richly and connecting it outward to Academy.
- **Acceptance Criteria**:
  - [x] A field for per-item usage guidance — exists (`Product.usageProtocol`), **confirmed already richly rendered** on the product page under its own "Usage Protocol" heading — the "not yet" in the original note was stale.
  - [x] Educational content recommendations based on purchased items — **shipped July 25, 2026**: `GET /cultural/oral-histories/my-purchases`, "Stories About Items You Own" section at the top of the Stories browse page. Deliberately matches on the *literal products the user bought* (via `OrderItem`), not a category guess — `Product.category` ("Sacred & Ritual Items") and `OralHistoryEntry.category` ("History", "Elder Teaching"...) don't share a taxonomy, so a fuzzy match would misrepresent "why am I seeing this." Live-verified: empty before purchase, correctly populated with the right story after buying the linked product.
  - [x] Video tutorials on proper use and care of items — served by the existing `OralHistoryEntry.sourceUrl` mechanism (see MSP-020/MSP-022), already rendered as "Listen / view source" wherever a story appears. No new field needed — an elder/admin can already attach a video link to any story, including ones framed as care instructions.
  - [x] Connection to relevant Academy courses — **shipped July 25, 2026**: "Learn the cultural context in the Academy →" link on the product page, right under Usage Protocol. Kept as one honest general link rather than fake per-item course matching, since Academy is deliberately single-course for now (same call made in `MSP-004`/`MSP-016`).
  - [x] Elders' teachings linked to specific products — already served by `relatedStories` (MSP-020's "Related Story" section), which shows `babalawoName` attribution wherever a story is linked via `relatedProductIds`. Not a separate mechanism.
- **Dependencies**: Academy (live), VND-018 (Yoruba Language Product Listings — not built, not required for what shipped here)
- **Notes**: Enhances cultural learning and proper use of sacred items. Turned out four of five criteria were already satisfied by infrastructure built earlier this same day (MSP-020/MSP-022's story system) — only the purchase-based recommendation needed real engineering. Refactored `AdminCulturalContentService`'s product-name-resolution logic (`resolveRelatedProducts()`) into a shared private helper used by both `getPublishedOralHistories()` and the new `getStoriesForUserPurchases()`, rather than duplicating that batched lookup a third time.

### MSP-008: Seasonal & Ceremonial Marketplace Events (merged with MSP-014)
- **Priority**: P2 → P0, inheriting MSP-014's priority since they're now one item
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Events Team
- **Story Points**: 1 *(revised down from 3 — full loop shipped)*
- **Description**: **Merged with MSP-014 on July 24, 2026** — discovered while starting Shop implementation that MSP-008 ("Seasonal & Ceremonial Marketplace Events") and the since-removed MSP-014 ("Cultural Celebration Calendar Integration") described the identical feature from two angles. `SacredCalendarEvent` and `Product.isFeatured`/`featuredUntil` already existed independently; this item connects them.
- **Acceptance Criteria**:
  - [x] Cultural calendar data — exists (`SacredCalendarEvent`)
  - [x] Product featuring mechanism — exists (`isFeatured`/`featuredUntil`)
  - [x] Automatic connection between the two, on the marketplace homepage — shipped July 24, 2026. `GET /marketplace/products/upcoming-events`, "Coming Up" banner on the marketplace homepage. **Upgraded July 25, 2026**: now prefers real event-tagged approved products for the nearest event (see the new `EventProductFeature` model below) over the generic `isFeatured` fallback it always had — the banner now honestly labels which case it's in ("Prepared for this event" vs. "Featured items"), never overclaiming precision the data doesn't have.
  - [x] Vendor notifications for upcoming seasons ("Prepare your Osun items now") — **shipped July 25, 2026**: `AdminCulturalContentService.createSacredEvent()` notifies every approved vendor the moment an admin creates a new active event, rather than waiting on a countdown — events are typically created well ahead of the date anyway, and there's no event↔vendor-category relation precise enough to target a subset. Live-verified: creating an event immediately notified the test vendor.
  - [x] Client reminders tied to calendar entries — **shipped July 25, 2026**: new `SeasonalEventReminderService` (`marketplace/seasonal-event-reminder.service.ts`, weekly `@Cron`, same dedupe-by-notification pattern as `RebookingNudgeService`) notifies clients who RSVP'd (`RitualParticipation`, FOR-013) to an event landing within the next 7 days.
  - [x] Early access for ceremonial preparation items — **shipped July 25, 2026, scoped honestly**: interpreted as promotional early visibility (an approved item is featured on the homepage ahead of/through the event) rather than a literal purchase-gating mechanism, which this data model has no concept of and wasn't asked to build. Approval sets `featuredUntil` to the event's end (or start) date.
  - [x] Vendor request flow for seasonal item promotions, routed through existing admin review — **shipped July 25, 2026**: new `EventProductFeature` model (also the real event↔product relation this item's own notes previously flagged as missing), `POST /marketplace/events/:eventId/feature-request` (vendor, own products only), `GET /admin/marketplace/events/feature-requests` + `PATCH .../:id/review` (admin), new "Events" tab in the vendor dashboard and "Event Requests" sub-tab in the admin marketplace panel. Live-verified full loop: vendor requests → duplicate correctly rejected → admin approves → product becomes event-tagged-featured → vendor notified → homepage banner updates to "Prepared for this event."
  - [x] Post-ceremony/post-season community reflection tied to Forum (live) — **shipped July 25, 2026**: same `SeasonalEventReminderService` cron also auto-creates one reflection thread per event (in `Temple Connections & Events`) once its date has passed, mirroring MSP-019's bundle support/reflection auto-thread pattern — one thread, not a parallel comment system.
- **Dependencies**: `SacredCalendarEvent` (exists), Forum (live, for the reflection thread)
- **Notes**: Capitalizes on seasonal demand. The "no direct schema relation tying an event to specific products" limitation noted in the original pass is now resolved by `EventProductFeature` — built specifically to serve the vendor-request criterion, and it happened to close the precision gap for the featured-items banner too. 5 new backend unit tests added (`marketplace.service.spec.ts`, 65/65 passing in that file; 537/537 full backend suite) plus a genuine regression caught and fixed mid-pass (the new event-tagged lookup path wasn't mocked in the pre-existing banner tests — fixed, not just silenced). If you're looking for "MSP-014," it's here now.

### MSP-009: International Shipping & Customs Support
- **Priority**: P2
- **Status**: 🟡 PARTIALLY BUILT (July 25, 2026)
- **Owner**: Logistics Team
- **Story Points**: 6 *(revised down from 10 — 3 of 5 criteria closed; the remaining 2 are genuinely blocked on unbuilt infra + real external integrations, not more plumbing)*
- **Description**: Enhanced support for international vendors and customers with customs and cultural considerations. **Investigated July 25, 2026**: `VND-011` (Shipping Management) confirmed genuinely unbuilt — no `ShippingZone`/`ShippingRate` model exists, `Order` only has a single flat `shippingCost` number with no per-destination logic. This is the real, hard blocker for the two criteria below that depend on knowing shipment origin/destination.
- **Acceptance Criteria**:
  - [x] Cultural sensitivity guidelines for international shipping — **shipped July 25, 2026**: a pinned resource thread in the Vendor Circle forum (`VENDOR_BACKLOG.md` VND-019), "Shipping Sacred Items Internationally — Cultural Sensitivity & Customs Basics" (`seed-forum-starter-threads.ts`). Covers respectful customs-form language (describe the object, not its sacred function), organic/restricted-material warnings, and honest disclosure — explicitly framed as guidance, not legal advice. Reuses `ForumThread.isPinned` rather than a new content model, matching VND-019's own original design note ("pinned resources: platform policies, cultural guidelines, best practice guides").
  - [ ] Customs documentation assistance for sacred items — **genuinely deferred**: real customs paperwork (HS codes, duty calculation, per-country forms) needs both `VND-011`'s destination/origin data and actual customs-law expertise this team doesn't have — fabricating either would risk giving vendors wrong legal guidance. The pinned guidance thread above covers general principles instead; auto-generated documentation is a distinct, larger piece of work gated on VND-011.
  - [x] Multi-language support for international vendors — **confirmed already built**: `LanguageContext`/`useLanguage()`'s EN/Yorùbá `t()` translation system (`shared/contexts/language-context.tsx`) is platform-wide, not gated to any role — vendors already see the same `EN (Yorùbá)` toggle as every other user, confirmed present in the header across every vendor-dashboard screenshot taken this session. Scoped honestly: this is EN/Yorùbá only, not an expansion to other diaspora languages (Spanish/Portuguese for Santería/Candomblé-adjacent communities, say) — that would be a real, separate scoping decision, not something to invent unilaterally here.
  - [x] Cultural authenticity verification for diaspora vendors — **confirmed already built**: the existing vendor vetting pipeline (`artisanHeritageProof`, `culturalAuthenticityNotes`, `yorubaProficiencyLevel`, admin approve/reject) has zero geographic gating anywhere in `createVendor()`/`reviewVendorApplication()` — verified by reading the code. A diaspora vendor goes through exactly the same pipeline as a Nigeria-based one; there was never a second, parallel process to avoid building.
  - [ ] International shipping insurance for sacred items — **genuinely deferred**: a real insurance product needs an actual insurance-provider integration (a financial commitment this team can't make unilaterally) plus `VND-011`'s shipping data to price against. The pinned guidance thread points vendors to their shipping carrier's own insurance in the meantime, rather than the platform silently offering nothing where insurance was promised.
- **Dependencies**: VND-011 (Shipping Management — confirmed unbuilt, blocks the 2 deferred criteria only), VND-017 (substantially built, see above)
- **Notes**: Supports the global Yoruba diaspora while maintaining cultural integrity. 3 of 5 criteria closed — 2 turned out to already be fully covered by existing platform-wide infrastructure (i18n, vendor vetting) once actually checked, 1 shipped as genuine new content. The 2 remaining criteria are correctly left undone rather than faked: both need real infrastructure (VND-011) and real external commitments (customs expertise, an insurance provider) that don't exist yet and shouldn't be invented to make a checkbox green.

---

## 🟢 FUTURE — Advanced Marketplace Features

### MSP-010: AR/VR Product Visualization
- **Priority**: P3
- **Status**: ⬜ NOT STARTED
- **Owner**: Innovation Team
- **Story Points**: 21
- **Description**: Augmented reality for viewing items in cultural context or virtual reality marketplace experiences.
- **Acceptance Criteria**:
  - [ ] AR preview of items in traditional settings
  - [ ] VR marketplace walkthrough for cultural immersion
  - [ ] Virtual consultation with vendors about items
  - [ ] Cultural context visualization for ritual items
  - [ ] Accessibility features for all users
- **Dependencies**: Future AR/VR Infrastructure, Mobile App Integration
- **Notes**: Genuinely greenfield, no dependency conflicts with anything shipped. Long-term only.

### MSP-011: Blockchain Provenance Tracking
- **Priority**: P3
- **Status**: ⬜ NOT STARTED
- **Owner**: Innovation Team
- **Story Points**: 18
- **Description**: Blockchain-based tracking of item provenance and cultural authenticity.
- **Acceptance Criteria**:
  - [ ] Immutable record of item origin and cultural significance
  - [ ] Smart contracts for authentic cultural exchanges
  - [ ] Verification system for traditional crafting methods
  - [ ] Transparency in vendor sourcing practices
  - [ ] Community governance of blockchain authenticity records
- **Dependencies**: Future Blockchain Infrastructure, Cultural Authority Integration
- **Notes**: `Product.provenance` (see "Already Live") already gives a conventional database home for origin data — treat this item as "add blockchain verification on top of that field," not a replacement for it.

~~### MSP-012: AI-Powered Cultural Matching~~ — **REMOVED**
This item proposed AI assistance for matching users with cultural items. It's removed for two reasons: (1) it conflicts directly with this document's own Cultural Integrity Principle #2 ("AI/technology is a tool, not a replacement for human spiritual leadership") and Principle #9 (no algorithmic black-box decisions about authenticity), and (2) the actual vetting work it would have assisted (checking whether an item/vendor is culturally authentic) already has a real human-reviewed pipeline — see VND-017 and the "Already Live" section above. If discovery ever becomes a real bottleneck, the fix is the plain-taxonomy filter work in MSP-001, not AI matching.

---

## **Ìlú Àṣẹ — SHOP_BACKLOG ADDENDUM — Deeper Marketplace Layers**

> **Added**: July 5, 2026 (post-audit review) · **Reality-checked**: July 24, 2026
> **Rationale**: The initial SHOP_BACKLOG covers discovery, bundling, and events – but misses the *relational, cyclical, and community-building* dimensions that make a sacred marketplace distinct from a conventional e-commerce platform.

---

## 🔴 CRITICAL — Missing Community & Relational Layers

### MSP-013: Vendor-to-Client Relationship Cultivation
- **Priority**: P0
- **Status**: ⬜ NOT STARTED
- **Owner**: Community + Marketplace Teams
- **Story Points**: 8
- **Description**: Clients should develop ongoing relationships with trusted vendors, not just one-off purchases. No vendor-loyalty or recurring-relationship tracking exists today — the adjacent `Referral` model (client acquisition) is a different concern and shouldn't be conflated with this.
- **Acceptance Criteria**:
  - [ ] Vendor loyalty tracking (repeat clients, long-term relationships)
  - [ ] "Your Recommended Vendors" based on past purchases and category history (rule-based, per MSP-004's framing — not a separate ML system)
  - [ ] Vendor-client messaging with cultural etiquette — coordinate with whatever messaging surface exists platform-wide at the time this is built (Messaging is currently paused per `MVP_PIVOT_BACKLOG.md`; this item should wait for that relaunch)
  - [ ] Relationship milestones (1 year of supply, completed rituals together)
  - [ ] Client profiles that reveal spiritual needs (privacy-respecting) so vendors can anticipate needs
  - [ ] Vendor-initiated seasonal suggestions tied to `SacredCalendarEvent` (exists)
- **Dependencies**: VND-019 (Vendor Community), VND-022 (Review Management), Messaging relaunch (currently paused)
- **Notes**: The marketplace should feel like a village marketplace, not an anonymous checkout flow — but the messaging channel this depends on is currently paused platform-wide, so sequence this after that relaunch.

~~### MSP-014: Cultural Celebration Calendar Integration~~ — **MERGED into MSP-008**
Discovered while starting Shop implementation (July 24, 2026) that this was describing the exact same feature as MSP-008 ("Seasonal & Ceremonial Marketplace Events") — same `SacredCalendarEvent` + `isFeatured` connection, same vendor-notification/client-reminder/post-event-reflection criteria, just phrased from a slightly different angle. Merged rather than built twice; see MSP-008 above for the current (merged) scope and status.

### MSP-015: Community-Supported Authenticity (Crowd-Curation)
- **Priority**: P0
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Compliance + Community Teams
- **Story Points**: 3 *(revised down from 8 — badge/story/flag criteria all now shipped; remaining scope is content-authoring, not engineering)*
- **Description**: Beyond the existing elder/admin review (see "Already Live"), empower the wider community to annotate and endorse items. `Product.provenance` gives a starting field for origin stories; this item is about opening a *community-contributed* layer on top.
- **Acceptance Criteria**:
  - [x] Community-endorsed authenticity badge — **shipped July 25, 2026**: new `ProductEndorsement` model (`@@unique([productId, userId])`, one endorsement per user per product), `POST/DELETE /marketplace/products/:id/endorse`, `findProductById()` computes `endorsementCount` + a threshold-based `communityEndorsed` boolean (3+ endorsements) live on every read — same computed-on-read pattern as the `UserBadge` system rather than a second stored-badge table. "Community Endorsed" badge + "Endorse as Authentic (N)" button shipped on `product-detail-view.tsx`.
  - [x] Collaborative item annotations/stories attached to products — shipped July 24, 2026, see below (unchanged from the prior note)
  - [ ] Item-level cultural wiki content (how to use, what it represents, prayers) — builds on the existing but currently-thin `usageProtocol` field. Not started.
  - [ ] Vendor education on cultural nuances, community-contributed — content-authoring task, not started.
  - [x] Flagging with gentle education — **shipped July 25, 2026**, but built differently than originally scoped: rather than reusing `ProductReview.flaggedCount`/`status` (a per-review field, not well-suited to flagging the *listing* itself), added `heldForReview`/`reviewReason`/`reviewedBy`/`reviewedAt` directly on `Product`, mirroring ADM-018's existing pattern on `ForumPost`. `POST /marketplace/products/:id/flag` (any authenticated user, one open flag at a time — a second flag attempt 400s with "already awaiting review"), admin queue at `GET /admin/marketplace/products/flagged` + `PATCH .../:id/clear-flag` (new "Flagged" sub-tab in `admin-marketplace-tab.tsx`). Deliberately "gentle, not punitive": flagging never changes `status` — the listing stays `ACTIVE` and visible throughout review; removal (if ever warranted) stays a separate, deliberate admin action via the pre-existing `removeProduct()`. Frontend copy on the flag form reads: *"If something about this listing concerns you culturally, let an elder know — this isn't a punishment, just a gentle check."* Live-verified: full endorse/duplicate-no-op/threshold-cross loop, full flag/double-flag-rejected/admin-clear/re-flag loop, real browser screenshots of both states.
  - [ ] "This item speaks to me" storytelling — coordinate with COMMUNITY_BACKLOG.md's FOR-019 (Oral Tradition Platform) rather than building a parallel storytelling feature. Not started.
- **Dependencies**: VND-017 (substantially built), Forum (live), `UserBadge` system (exists), **`COMMUNITY_BACKLOG.md`'s FOR-026 (done) and FOR-024 (backend done)**
- **Notes**: Transforms the marketplace into a cultural archive, not just a storefront — genuinely new on the community-contribution side, even though the review/badge infrastructure it plugs into already exists. **FOR-026 is resolved** (July 24, 2026): build the "collaborative item annotations/stories" criterion as a submission into the existing `OralHistoryEntry` queue with `relatedProductIds` set to this product, per FOR-026's decided design — not a new per-item comment model. **The "collaborative item annotations/stories" criterion is now fully shipped** (July 24, 2026): `POST /cultural/oral-histories/submit` (see FOR-024) plus a live "Share a Story" form on `product-detail-view.tsx` that posts to it with `relatedProductIds: [productId]` pre-set — verified end-to-end in a real browser. **Discovered while building the flagging criterion (July 25, 2026)**: the `heldForReview` quad-field pattern this item copies from `ForumPost` (ADM-018) is defined on `ForumPost`'s schema but is *never actually set to `true` by any community-facing action anywhere in the codebase* — there is no "flag a forum post" endpoint, only the admin-side queue that reads the field. `ContentFlagRule` (KEYWORD/CATEGORY type admin rules) is similarly unwired to auto-flag anything. Product flagging as built here is fully wired end-to-end and does not inherit this gap — but the `ForumPost` side of the same pattern remains a real, pre-existing hole, worth a follow-up story in `COMMUNITY_BACKLOG.md` rather than silently living with it. Remaining scope on this item (item-level wiki content, vendor education, "speaks to me" storytelling) is content-authoring, not engineering — no further backend/frontend blockers.

---

## 🟡 SIGNIFICANT — Missing Vendor Ecology & Support

### MSP-016: Apprenticeship-to-Vendor Pathway
- **Priority**: P1
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Marketplace + Academy Teams
- **Story Points**: 2 *(revised down from 8 — full loop shipped; only "graduation ceremony" stayed intentionally minimal, see notes)*
- **Description**: A clear pathway for new vendors to learn and earn their place, mentored by established practitioners. `Vendor.status` (`PENDING`/`APPROVED`/`SUSPENDED`/`REJECTED`) gives a basic onboarding gate today; the tiered apprenticeship/mentorship layer on top is entirely new.
- **Acceptance Criteria**:
  - [x] Mandatory cultural training via Academy before tier advancement — **shipped July 25, 2026**: reuses the Academy's one live flagship course (`ori-the-metaphysics-of-consciousness` — Academy is deliberately single-course for now per `seed-academy-courses.ts`'s own note, so this doesn't gate on a not-yet-built dedicated vendor course). Admin's tier-advancement endpoint checks `Enrollment.completedAt` on that course and 400s if incomplete.
  - [x] Apprenticeship period with elder mentorship — reuses `VND-019`'s `VendorMentorship` (see `VENDOR_BACKLOG.md`), not a second mentorship system.
  - [x] Graduation ceremony / recognition on reaching full vendor status — implemented as a `Notification` congratulating the vendor by name on their new tier ("You've been recognized as Recognized Artisan!"), not a literal ceremony feature — same scoping call made elsewhere on this platform for "celebration" criteria (e.g. `EXP-018`).
  - [x] Vendor tiers: Apprentice → Recognized Artisan → Master Practitioner → Elder-Approved — `Vendor.apprenticeshipTier` (migration `20260725133721_add_vendor_mentorship_wellbeing_tiers`), admin/elder-only advancement via `PATCH /admin/marketplace/vendors/:id/tier` (never automatic, per this doc's own "no algorithmic black-box decisions" principle), surfaced in `admin-marketplace-tab.tsx`'s Vendor Health tab. Also computed into a live badge (`getUserBadges()`) once a vendor advances past Apprentice.
  - [x] Mentorship tracking and credit for mentors — `mentorshipsAsMentor`/`mentorshipsAsMentee` counts, surfaced in `GET /vendor-community/apprenticeship-progress` and the "Community Mentor" badge.
  - [x] Vendor progress dashboard — `GET /vendor-community/apprenticeship-progress` + new "Community" tab in `vendor-dashboard-view.tsx` (tier, training status, mentorship history).
- **Dependencies**: Academy (live), ~~VND-026 (Vendor Performance Tiers)~~
- **Notes**: Ensures new vendors are culturally trained and supported — the approval gate exists; the pathway through it doesn't. **Investigated VND-026 (Vendor Performance Tiers) and dropped it as a hard dependency**: that item is about metrics-based performance tiers, a genuinely different concept from this item's cultural-apprenticeship tiers (the original note itself flagged this: "distinct from, but could reuse the pattern of"). Built `apprenticeshipTier` directly on `Vendor` rather than waiting on VND-026, which remains unbuilt and unrelated. Built together with VND-019 and MSP-018 in one pass since all three share the same mentorship mechanism.

### MSP-017: Vendor Cooperative Spaces
- **Priority**: P1
- **Status**: ⬜ NOT STARTED
- **Owner**: Community + Marketplace Teams
- **Story Points**: 9
- **Description**: Vendors forming collectives for larger ceremonies, shared logistics, and cultural preservation. No cooperative/group data model exists today.
- **Acceptance Criteria**:
  - [ ] Vendor cooperative formation
  - [ ] Shared ceremonial resources / cooperative inventory
  - [ ] Collaborative product development between vendors
  - [ ] Collective cultural education (vendors teaching each other)
  - [ ] Cooperative discovery: "Find vendors serving your community"
  - [ ] Shared shipping/warehousing for cooperative members
- **Dependencies**: VND-025 (Wholesale & B2B Sales — also not started), VND-019 (Vendor Community)
- **Notes**: Reduces barriers for smaller vendors. Genuinely new, and itself depends on another not-yet-built item (VND-025) — sequence accordingly.

### MSP-018: Vendor Wellbeing & Ritual Support
- **Priority**: P1
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Vendor Success Team
- **Story Points**: 2 *(revised down from 7 — wellness check-ins were already fully covered by existing infrastructure; only spiritual leave was genuinely new)*
- **Description**: Vendors are often practitioners who need support for their own spiritual and personal wellbeing, not just business metrics.
- **Acceptance Criteria**:
  - [x] Vendor wellness check-ins (opt-in, consent-based) — **discovered already fully built**: `COMMUNITY_BACKLOG.md`'s FOR-017 (`WellbeingCheckIn`, `/wellbeing/check-in`) is open to any authenticated user with zero role restriction — a vendor can already request one today. Building a parallel `VendorWellnessCheckIn` model was drafted, then reverted once this was confirmed (see the "already exists" pattern this whole session has been checking for before writing new schema). The vendor dashboard's new Community tab links directly to `/wellbeing` instead of duplicating the flow.
  - [x] Spiritual leave for vendors during important ceremonies — **shipped July 25, 2026**: new `VendorSpiritualLeave` model, `POST/GET /vendor-community/spiritual-leave`. Self-declared, no approval workflow — logging it is the whole point (so it's on record, doesn't need explaining after the fact), not a request that can be denied. Doesn't touch any fulfilment-rate metric elsewhere on the platform.
  - [ ] Community support for vendors during personal challenges — the Vendor Circle forum (`VND-019`) is the venue for this; no dedicated "support request" flow beyond that and the wellness check-in above. Not separately built.
  - [x] Marketplace recognition for vendors who serve the community well — reuses `UserBadge`-pattern computed badges exactly as specified: "Community Mentor" (from `VND-019`) and the apprenticeship tier badges (from `MSP-016`) both live in the same `getUserBadges()` used platform-wide.
  - [ ] Vendor mental health and spiritual support resource links — the vendor dashboard's Wellbeing card reuses the exact crisis-support copy already live on `wellbeing-view.tsx` (local emergency services / crisis hotline / `hello@iluase.com`) rather than inventing a new resource list. A fuller resource directory is a content task, not started.
  - [x] Marketplace policies respecting vendor cultural practices and timing — this *is* the spiritual leave feature: it exists specifically so ceremony timing doesn't collide with fulfilment-rate expectations elsewhere on the platform.
- **Dependencies**: Vendor Community (VND-019 — built alongside this item, see `VENDOR_BACKLOG.md`), `UserBadge` system (exists)
- **Notes**: A healthy vendor community creates a healthy marketplace. Kept opt-in/consent-based throughout, consistent with the same principle applied in COMMUNITY_BACKLOG.md's FOR-017 — in fact, that item's system is reused directly rather than duplicated, which is the single biggest scope reduction on this item.

---

## 🟡 MINOR — Missing Client Experience Layers

### MSP-019: Ritual Readiness Kits
- **Priority**: P2
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Marketplace + Education Teams
- **Story Points**: 1 *(revised down from 6 — full loop shipped)*
- **Description**: A complete kit with instructions, prayers, and community support for clients new to a ritual. MSP-002's `ProductBundle` model (shipped July 24, 2026) is exactly the bundling infrastructure this needs.
- **Acceptance Criteria**:
  - [x] Pre-built ritual kits for common ceremonies — bundle model exists (MSP-002); creating specific kits is a content task
  - [x] Step-by-step ritual guides — **shipped July 25, 2026**: `ProductBundle.ritualGuide` (own field, not an extension of `Product.usageProtocol` — a kit's guide spans several products at once, so it belongs on the kit, not any one item), editable by the bundle's own vendor via `PATCH /marketplace/bundles/:id/guide` without re-triggering admin review (additive guidance, not a pricing/item change).
  - [x] Audio/video guidance from elders — `ProductBundle.guideSourceUrl`, same external-link pattern as `OralHistoryEntry.sourceUrl` (MSP-020/MSP-022) rather than a new upload pipeline.
  - [x] Community support thread per ritual — **shipped July 25, 2026**: a new "Ritual Kits & Ceremonies" Forum category, with a support thread auto-created (authored as the vendor) the moment an admin approves the bundle — `AdminMarketplaceService.reviewBundle()`. Reuses Forum, not a parallel comment system.
  - [x] Post-ritual reflection thread — same auto-creation, a second thread per approved bundle.
  - [x] Kit customization ("I have X, I need Y") — **shipped July 25, 2026**: new `BundleCustomizationRequest` model, `POST /marketplace/bundles/:id/customization-request` (buyer), `GET .../customization-requests` (vendor, own kits only), `PATCH .../customization-requests/:id/respond` (vendor). Notification-based request/response loop, not live chat (Messaging is paused platform-wide, see `CLAUDE.md`).
- **Dependencies**: MSP-002 (backend + customer-facing UI done), Academy (live), Forum (live)
- **Notes**: New customer-facing bundle detail page at `/marketplace/bundles/:id` (`bundle-detail-view.tsx`) shows the guide, both thread links, and the customization form — the homepage's compact bundle cards now link there instead of only offering "Add to Cart". Vendor dashboard's Bundles tab gained an expandable "Ritual guide & customization requests" panel per approved kit. Live-verified end-to-end: bundle created → approved (both Forum threads auto-created, correctly authored as the vendor) → guide set → a different vendor correctly blocked from editing it → a client requests customization → vendor notified, views the request, responds → client notified of the response. Caught and fixed a real bug during verification: `reviewBundle()` was returning the pre-thread-creation snapshot instead of the updated record (threads were created correctly in the DB, just not reflected in that one response). 5 new backend unit tests added (54/54 passing in that file; 519/519 full backend suite).

### MSP-020: Marketplace Storytelling (Item Origins)
- **Priority**: P2
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Content + Marketplace Teams
- **Story Points**: 1 *(revised down from 4 — everything but the browse view was already built; that was the one real gap)*
- **Description**: Every item should tell a story — `Product.provenance` already exists as the field for this; it's just not richly surfaced or open to community contribution yet.
- **Acceptance Criteria**:
  - [x] A field for item origin/provenance — exists (`Product.provenance`)
  - [x] Vendor storytelling UI that surfaces `provenance` prominently on the product page — **discovered already built**: `product-detail-view.tsx` has dedicated "Provenance" and "Usage Protocol" sections right in the main details card, not buried.
  - [x] Item cultural significance content, extending `usageProtocol` — same discovery, already rendered on the product page.
  - [x] Community stories attached to items — shipped July 24, 2026 (see FOR-024/MSP-015's notes): "Share a Story" form posts into `OralHistoryEntry` with `relatedProductIds` pre-set.
  - [x] User-submitted stories about items and their impact — same as above; any authenticated user, not vendor-only.
  - [x] Elder commentary on traditional crafting methods — served by the existing `babalawoName` attribution field on `OralHistoryEntry`, shown as "As told by [name]" wherever a story renders (product page and the new browse view below). Not a separate elder-only submission path — any submission can credit a babalawo as its source, and only admin/elder-published entries ever go public either way.
  - [x] Browse-by-story view, distinct from the existing category browse — **shipped July 25, 2026, the one genuinely missing piece**: `GET /cultural/oral-histories` (new public endpoint, published-only, optional `category`/`productId` filters, batches related product names in one query), `frontend/src/features/marketplace/stories-browse-view.tsx` at `/marketplace/stories`, linked from the marketplace catalog header ("Browse item stories & origins"). Category filter chips reuse the same list as the admin authoring tab. Live-verified: public unauthenticated access, category filtering, unpublished drafts correctly excluded, and clicking a related-product link from a story navigates to the real product page.
- **Dependencies**: VND-018 (Yoruba Language Product Listings), Forum (live), MSP-015 (don't duplicate the community-story work), **`COMMUNITY_BACKLOG.md`'s FOR-026 (done) and FOR-024 (backend done)**
- **Notes**: Builds connection and meaning around items. Turned out most of this item was already done by the time it was picked up — the only real gap, once investigated, was a public read surface for browsing stories independent of any one product page. Not built: VND-018 (Yoruba-language listings) integration specifically, since that item itself remains unbuilt — noted rather than scoped in.

### MSP-021: Marketplace as Spiritual Journey Companion
- **Priority**: P2
- **Status**: ⬜ NOT STARTED
- **Owner**: Spiritual Journey + Marketplace Teams
- **Story Points**: 9
- **Description**: Marketplace recommendations based on where a user is in their spiritual path.
- **Acceptance Criteria**:
  - [ ] Integration with the Spiritual Journey module (exists and is routed at `/client/spiritual-journey`, but deprioritized for the current launch — see "Already Live")
  - [ ] Marketplace suggestions based on journey phase (seeker → initiate → practitioner → elder)
  - [ ] "What you might need next" recommendations
  - [ ] Items flagged by spiritual-development stage
  - [ ] Community recommendations ("When I was at your stage...") — coordinate with Forum (live)
  - [ ] Marketplace-as-guide framing tied to journey milestones
- **Dependencies**: Spiritual Journey feature (exists, low current priority — confirm it's back in active scope before starting this)
- **Notes**: Check with the Spiritual Journey feature's owners on its current priority before scheduling this — building against a deprioritized dependency risks the same fate MSP-003/FOR-003 avoided by explicitly sequencing after their blockers.

---

## 🟢 FUTURE — Advanced Community & Ecosystem Layers

### MSP-022: Marketplace as Cultural Preservation Archive
- **Priority**: P3
- **Status**: 🟢 MOSTLY BUILT (July 25, 2026)
- **Owner**: Cultural Preservation + Marketplace Teams
- **Story Points**: 3 *(revised down from 10 — most criteria turned out to already be served by existing fields once actually surfaced; only the interactive map is genuinely unbuilt)*
- **Description**: A living museum preserving items, stories, and traditions. `OralHistoryEntry` (shared with the Forum, see COMMUNITY_BACKLOG.md) already gives elder-curated cultural content a home — this item connects that to marketplace items specifically.
- **Acceptance Criteria**:
  - [x] Elder-curated cultural content storage — exists (`OralHistoryEntry`, admin CRUD)
  - [x] Digital preservation of rare items and their significance, linked to specific `Product` records — served by `MSP-020`'s story system: `relatedProductIds` links a story to a product, and admin's `removeProduct()` only ever sets `status: 'REMOVED'`, never deletes the row — so a story (and its "View [item] →" link) survives even after the physical listing is taken down. No new schema needed; this is an architectural property of what already exists, not a new feature.
  - [x] Audio/video interviews with elders about items and their meaning — **discovered already possible, wasn't rendered**: `OralHistoryEntry.sourceUrl` is exactly this (an external audio/video link), already shown on the product page as "Listen / view source →" but was missing from `MSP-020`'s new browse view. Fixed July 25, 2026 — now renders in both places.
  - [x] Community-curated collections (e.g., "Osun Grove items through the years") — **shipped July 25, 2026**: `OralHistoryEntry.tags` already exists and is already editable in the admin authoring form; the only missing piece was making tags browsable. Added `tag` filter to `GET /cultural/oral-histories` and clickable tag pills to the stories browse view — tagging several stories the same way (already possible today) *is* creating a collection. Live-verified: two stories sharing a tag correctly group together, a third with a different tag correctly excluded.
  - [ ] Interactive map of item origins (regional variations) — genuinely new, not attempted. Needs regional/geographic data collection on `OralHistoryEntry` (doesn't exist today) plus a mapping library — a proportionally bigger, separate piece of work, not a quick extension of what's already there. Left as the one real remaining gap.
  - [x] Educational content embedded in item listings, extending `usageProtocol` — already rendered on the product page (`product-detail-view.tsx`'s "Usage Protocol" section); making the actual content richer per item is a content-authoring task, not an engineering one.
- **Dependencies**: `OralHistoryEntry` (exists), Forum (live), **`COMMUNITY_BACKLOG.md`'s FOR-026 (done) and FOR-024 (backend done)**, `MSP-020` (built alongside this — same browse view, same endpoint)
- **Notes**: Ensures the marketplace contributes to cultural preservation. Built directly on top of `MSP-020`'s browse view rather than a separate archive UI — same endpoint (`GET /cultural/oral-histories`), extended with a `tag` filter. The interactive origin map remains the one criterion here that's genuinely new engineering (geographic data model + map UI); everything else turned out to be either already-existing fields that just needed rendering, or a small extension of infrastructure built this same day for MSP-020.

### MSP-023: Vendor-to-Client Mentorship Marketplace
- **Priority**: P3
- **Status**: ⬜ NOT STARTED
- **Owner**: Community + Marketplace Teams
- **Story Points**: 12
- **Description**: Vendors offering mentorship, guidance, and spiritual support beyond item sales.
- **Acceptance Criteria**:
  - [ ] Vendor mentorship profiles (experience, expertise, cultural guidance)
  - [ ] Client mentorship requests
  - [ ] Marketplace-side mentor matching based on client needs
  - [ ] Mentor-client relationship tracking and feedback
  - [ ] Cultural training for mentors on healthy boundaries
  - [ ] Community recognition for impactful mentors — reuse `UserBadge`
- **Dependencies**: Babalawo-client features (exist in the app, e.g. `personal-awo-dashboard.tsx`), Forum (live)
- **Notes**: Extends vendor role beyond seller to cultural guide. Genuinely new, though the existing Babalawo-client relationship pattern (`personal-awo-dashboard.tsx`, "Personal Awo" request flow) is a close structural precedent worth reusing rather than designing from scratch. **Monetization candidate**: this is a strong fit for the existing `Devoted` subscription tier (`isDevoted`/`subscriptionStatus`) — mentor access/matching could reasonably be a paid perk rather than free-for-everyone; flag to Product before scoping.

### MSP-024: Marketplace for Cultural Gifts & Offerings
- **Priority**: P3
- **Status**: 🟢 CORE LOOP DONE (July 25, 2026)
- **Owner**: Marketplace + Community Teams
- **Story Points**: 4 *(revised down from 6 — the whole "hard part" turned out to be four nullable Order columns, since checkout/payment infrastructure needed zero changes)*
- **Description**: Enables community members to gift items to each other, especially for ceremonies, initiations, and offerings. `Order` now carries gift fields directly — no new payment path, no Wallet/Escrow changes, because a gift purchase is charged to the buyer exactly like any other order; only who it notifies and what it says changes.
- **What shipped**: `isGift`, `giftRecipientId`, `giftMessage`, `dedicatedTo` added to `Order` (migration `20260725102505_add_order_gifting`). `CreateOrderDto` accepts `giftRecipientEmail`, resolved server-side to a `giftRecipientId` at order-creation time — an unregistered or typo'd email never blocks the purchase, it just means no in-app notification goes out (the buyer is still charged regardless of whether the recipient has an account). If resolved, the recipient gets an in-app notification with the gift message. Checkout UI (`checkout-view.tsx`) gained a "Send this as a gift" section on the shipping step — recipient email + optional message when checked — plus an always-available "Dedicate This Purchase" field, independent of gifting, for the "dedicate this purchase to my ancestors" use case.
- **Acceptance Criteria**:
  - [x] "Gift this item" flow, using the existing Wallet/Escrow rails rather than a new payment path — turned out to need **no** Wallet/Escrow involvement at all; gifting is purely a recipient/notification concern layered on the existing checkout, verified live
  - [ ] Group gifting for significant ceremonies (crowdsourced) — genuinely new scope (pooled payment across multiple buyers), not attempted
  - [x] Virtual offering flow ("dedicate this purchase to my ancestors") — `dedicatedTo` field, independent of the gift-to-a-person flow, shipped and verified
  - [ ] Community gifting recognition threads — reuse Forum, not attempted (content/ops task)
  - [ ] Cultural-appropriateness guidance per occasion — content task, not attempted
  - [ ] Gifting history and recognition for generous members — reuse `UserBadge`, not attempted; a reasonable small follow-up once real gifting volume exists to recognize
- **Verified live end-to-end**: registered a buyer, a recipient, and a vendor with a product → placed a real order with `isGift: true` + a real recipient email + a message + a dedication → confirmed `giftRecipientId` correctly resolved and all fields persisted → confirmed the recipient received an in-app notification with the exact gift message → separately confirmed an order gifted to a non-existent email still succeeds normally with `giftRecipientId: null` and no notification (never blocks the purchase) → confirmed the full checkout UI live in a real browser (added a product to cart, checked "Send this as a gift," filled recipient email/message/dedication, screenshot confirms correct rendering). All test data deleted afterward.
- **Also added**: 2 new unit tests in `marketplace.service.spec.ts` covering the resolved- and unresolved-recipient paths.
- **Dependencies**: `Wallet`/`Escrow` (exist, ultimately unused), Forum (live), `UserBadge` system (exists)
- **Notes**: Supports community generosity. The biggest surprise here, same shape as MSP-002 earlier: the acceptance criteria assumed Wallet/Escrow work would be needed, but the existing per-vendor `Order` model already handled payment correctly with zero changes — the actual new work was narrowly "who does this order notify and what does it say," not a payment feature.

---

## Sprint Metrics

### Phase 0 — Resolve These in Community First (Days, Not Sprints)
- ✅ `COMMUNITY_BACKLOG.md`'s FOR-025 (Unify Trust & Reputation) — **done July 24, 2026**; MSP-006's vendor-level rollup is unblocked and already implemented
- ✅ `COMMUNITY_BACKLOG.md`'s FOR-026 (Consolidate Oral History Effort) — **done July 24, 2026**; design decided (submit into `OralHistoryEntry` via `relatedProductIds`, no second story model)
- ✅ `COMMUNITY_BACKLOG.md`'s FOR-024 (community submission path) — **backend done July 24, 2026**: `POST /cultural/oral-histories/submit` lets any authenticated user submit a story (optionally with `relatedProductIds` pointing at a product), landing as a draft in the same admin review queue. MSP-015/MSP-020/MSP-022 can now build their "collaborative item annotations/stories" UI directly against this endpoint — **no backend blocker remains**, only the frontend submission form (not yet built, tracked under FOR-024).
- None of the three above are marketplace-owned engineering — all are coordination/backend decisions that make everything in Phase 2/3 below cheaper and less likely to need rework.

### Phase 1 — Foundation (Months 1-2)
- MSP-001: Authenticity-Aware Product Discovery *(mostly a filter-UI task now)*
- MSP-002: Cross-Vendor Product Bundling & Ritual Kits
- MSP-003: Cultural Appropriation Prevention *(extends existing vetting pipeline)*
- MSP-008: Seasonal & Ceremonial Marketplace Events *(moved up from Phase 3 — inherited MSP-014's P0 priority when merged)*

### Phase 2 — Dynamics (Months 3-4)
- MSP-004: Marketplace-Wide Recommendation Rules
- MSP-005: Vendor Collaboration Spaces
- MSP-006: Marketplace Reputation & Trust System *(done — vendor rollup, transparency report, and trust restoration all shipped)*

### Phase 3 — Enhancement (Months 5-6)
- MSP-007: Cultural Education Integration *(UI/content on an existing field)*
- MSP-009: International Shipping & Customs Support

### Phase 4 — Innovation (Months 7+)
- MSP-010: AR/VR Product Visualization
- MSP-011: Blockchain Provenance Tracking

---

## Sprint Metrics (Extended)

### Phase 1 — Community Foundation (Months 1-2)
- MSP-013: Vendor-to-Client Relationship Cultivation *(wait for Messaging relaunch)*
- ~~MSP-014~~ *(merged into MSP-008, see Phase 1 of the main Sprint Metrics above)*
- MSP-015: Community-Supported Authenticity *(FOR-026 resolved, unblocked)*

### Phase 2 — Vendor Ecology (Months 3-4)
- MSP-016: Apprenticeship-to-Vendor Pathway
- MSP-017: Vendor Cooperative Spaces *(depends on not-yet-built VND-025)*
- MSP-018: Vendor Wellbeing & Ritual Support

### Phase 3 — Client Experience (Months 5-6)
- MSP-019: Ritual Readiness Kits *(sequence after MSP-002)*
- MSP-020: Marketplace Storytelling *(surfacing an existing field)*
- MSP-021: Marketplace as Spiritual Journey Companion *(confirm feature priority first)*

### Phase 4 — Advanced Ecosystem (Months 7+)
- MSP-022: Marketplace as Cultural Preservation Archive *(connect to existing OralHistoryEntry)*
- MSP-023: Vendor-to-Client Mentorship Marketplace
- MSP-024: Marketplace for Cultural Gifts & Offerings *(build on existing Wallet/Escrow)*

---

## Success Metrics — How We'll Know Something Worked

Priority and story points say what to build; neither says whether it worked. Nothing below is a hard target — they're the concrete question each phase should be able to answer at its next review.

- **MSP-001 (discovery)**: Once the authenticity-tier filter ships, what share of purchases go to `COUNCIL_APPROVED`/`ARTISAN_DIRECT` items versus `COMMUNITY_LISTED`? If the filter doesn't shift the mix at all, it isn't being used.
- **MSP-003/MSP-015 (vetting & crowd-curation)**: Same reviewer-capacity question as `COMMUNITY_BACKLOG.md` — is time-to-decision on flagged listings/vendors shrinking or growing as the catalog grows?
- **MSP-006 (trust)**: Now that FOR-025's unified scoring is live *and* the July 27, 2026 Transparency Report actually surfaces it to buyers on the storefront page, does it change buyer behavior (do higher-trust vendors see more repeat purchases)? That's now answerable — check it at the next review.
- **MSP-008/MSP-014 (seasonal/calendar)**: Do featured items tied to a `SacredCalendarEvent` date actually sell better in the run-up to that date than an equivalent non-featured item? This is the cheapest way to confirm the calendar-connection work was worth it.
- **MSP-016 (apprenticeship pathway)**: Of vendors who start the pathway, how many reach full vendor status versus drop out mid-way? A pathway with a high drop-off rate needs redesign, not just more marketing.
- **MSP-019/MSP-024 (kits & gifting)**: Repeat-purchase rate on kit/gift transactions versus single-item purchases — these features only earn their complexity if they measurably drive the "ongoing relationship" behavior MSP-013 is separately trying to build.

---

## Cultural Authenticity Assurance

All marketplace features must:
- Respect Yoruba spiritual traditions and practices
- Maintain cultural integrity over commercial gain
- Support authentic practitioners and vendors
- Protect sacred knowledge and items from misappropriation
- Preserve the human-centered spiritual guidance model
- Ensure ethical commerce within cultural context

---

## Cultural Integrity Principles for All Marketplace Features

Every feature in this backlog must:

1. **Respect Yoruba Spiritual Authority** – no feature should bypass or diminish the role of elders, priests, and community wisdom
2. **Maintain Human-Centered Guidance** – technology is a tool, not a replacement for human spiritual leadership
3. **Prioritize Community Over Commerce** – features that strengthen community bonds come before pure revenue optimization
4. **Preserve Sacred Knowledge** – features that educate and preserve cultural knowledge are prioritized over purely transactional features
5. **Support Authentic Practitioners** – features that empower genuine practitioners come before features that dilute the practice
6. **Enable Generous Giving** – features that support community gifting and collective care are encouraged
7. **Honor Cyclical Time** – features that align with seasonal and ceremonial rhythms are prioritized over constant-growth expectations
8. **Build Intergenerational Connection** – features that connect elders, practitioners, and youth are prioritized
9. **Maintain Transparency in Cultural Matters** – no algorithmic black-box decisions about what is "authentic"
10. **Support Spiritual Wellbeing** – features that support wellbeing (of vendors, clients, and community) are prioritized

*(Principles 2 and 9 are why MSP-012 was removed outright, and why MSP-001/MSP-003/MSP-004's discovery and recommendation ideas were reframed as rule-based against the existing taxonomy rather than left as AI/ML concepts.)*

---

*"Àṣẹ lọwọ àwọn alábí, kí dàgbà sí oúnjẹ òkè"*
"The authority belongs to the owners of the house, may it grow into a mountain of abundance"

---

*"Ọjà ni ìlú, ìlú ni ọjà"*
*"The marketplace is the community, and the community is the marketplace."* 🕊️
