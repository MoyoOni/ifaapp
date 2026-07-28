> ⚠️ **SUPERSEDED as of July 28, 2026** — see [`ILUASE_V1_BACKLOG.md`](ILUASE_V1_BACKLOG.md) for the current single source of truth on remaining work. This file is kept for its detailed per-story write-ups only; don't use it to decide what to work on next.

# Vendor Operations Backlog — Ìlú Àṣẹ
## "The Sacred Shop" — Running a Spiritual Business on the Platform

**Goal:** Give every vendor the tools to run a real, growing sacred goods business — from first listing to consistent income — without needing to leave the platform.
**Total:** 7 Sprints · ~175 Story Points
**Label format:** `VND-XXX`
**Audience:** Solo artisans and practitioners selling sacred goods. Cultural vetting is non-negotiable at every step.

---

## Strategic Philosophy

> *"Ọjà kì í gbẹ fún ẹni tó ń tà ohun tó dára"*
> — The market never runs dry for the one who sells good things.

A vendor on Ìlú Àṣẹ is not a generic seller. They are a custodian of sacred goods — beads consecrated by lineage, herbs sourced from specific forests, handcrafted items tied to tradition. The platform they sell on must reflect that. Every feature built here should ask: **does this help a sacred goods vendor operate with integrity and grow with confidence?**

---

## The Day-to-Day Reality of a Vendor on Ìlú Àṣẹ

### Morning
- Did any orders come in overnight?
- Any messages from customers?
- Any items running low on stock?

### Weekly
- What sold? What didn't?
- Am I ready to withdraw this week's earnings?
- Any reviews I should respond to?
- Any new products to list?

### Monthly
- What were my total sales and earnings?
- How much did the platform take?
- What is my best product and my worst?
- Do I need to restock anything?
- Am I eligible for a payout?

---

## Current State — What Exists

| Capability | Status |
|-----------|--------|
| Vendor registration + approval workflow | ✅ Built |
| Product creation (name, price, stock, category, images) | ✅ Built |
| Product editing and deletion | ✅ Built |
| Cultural restrictions enforced (no Akose/Ebo/counterfeit) | ✅ Built |
| Order viewing and status updates | ✅ Built |
| Order tracking (number, carrier, URL) | ✅ Built |
| Refund issuance (full or partial) | ✅ Built |
| Dashboard summary (revenue, top products, recent orders) | ✅ Built |
| Basic analytics (total revenue, count, avg order, growth %) | ✅ Built |
| Wallet balance and transaction history | ✅ Built |
| Withdrawal request creation | ✅ Built |
| Escrow viewing and release | ✅ Built |
| WhatsApp notification on new orders | ✅ Built |
| Email notification on order status changes | ✅ Built |
| Multi-currency wallet (NGN, USD, GBP, CAD, EUR) | ✅ Built |
| Product reviews from customers | ✅ Built |
| Cultural authenticity notes on vendor profile | ✅ Built |

---

## What Is Missing — Prioritised

---

## 🔴 Sprint 1 — Earnings & Money Clarity (32 SP)
*A vendor cannot grow without understanding their money.*

### VND-001 · Earnings Report View (10 SP)
**A dedicated earnings screen — the equivalent of what Babalawos have at `/practitioner/earnings`.**

**What it shows:**
- Total earnings this month / last month / all time
- Platform commission deducted (shown clearly — trust through transparency)
- Net earnings after commission
- Earnings by product (which product made the most money?)
- Earnings by week chart (12-week rolling)
- Pending (in escrow) vs. Available (withdrawable) vs. Paid Out breakdown
- Next payout eligibility date

**Design principle:** Show gross, deduct commission line-by-line, show net. Vendors should never wonder what the platform is taking.

**Files:** New `vendor-earnings-view.tsx`, route `/vendor/earnings`, extend dashboard service.

**Status: ✅ DONE (2026-07-26)**

**What's shown, honestly:**
- [x] Total earnings this month / last month / all time — from COMPLETED/DELIVERED orders
- [x] Platform commission — **the spec's "deduct commission line-by-line, show net" can't be honestly built as written**: `PlatformSettings.marketplaceCommissionPct` (10% default) is never actually deducted anywhere in the real money-movement code — confirmed while building VND-010's escrow fix (order escrow holds and pays out the *full* order amount, nothing is skimmed). Rather than fabricate a "net after commission" number that wouldn't match what a vendor actually receives, the view shows the configured rate plus an explicit note: *"Not yet deducted from marketplace order payouts — you currently receive the full order amount."* Net === gross today, and the view says so instead of pretending otherwise.
- [x] Earnings by product — top 10 by revenue, from completed order line items
- [x] Earnings by week — 12-week rolling line chart (Recharts, matches the pattern already used in `practitioner-analytics-view.tsx`)
- [x] Pending (escrow) vs. Available (wallet balance) vs. Paid Out (processed withdrawals) breakdown — a `PARTIALLY_RELEASED` escrow counts only its un-released remainder as "pending," not its already-paid-out tier
- [x] Next payout eligibility — compares available balance against `PlatformSettings.minPayoutThresholdNgn`, plus the earliest `autoReleaseAt` among pending escrows as an estimated next-funds-available date

**New:** `GET /marketplace/vendors/:id/earnings`, linked from the Payouts tab ("View Earnings Report →").

**Note on the spec's "/practitioner/earnings" reference:** that Babalawo route currently redirects to a paused-feature page (it depended on Consultations, paused platform-wide per `MVP_PIVOT_BACKLOG.md`) — this marketplace earnings view is unaffected by that and fully live, since Marketplace itself isn't paused.

**Tests:** 5 new backend unit tests (gross sums, per-product revenue, escrow pending-amount math including the partial-release case, payout eligibility, ownership guard) — full backend suite now at 803 passing. Frontend: `tsc --noEmit` and `npm run build` both clean.

---

### VND-002 · Payout Management & Tracking (8 SP)
**Full visibility into withdrawal requests and their status.**

**Status: ✅ DONE (July 26, 2026)**

**What was missing before:** Vendors could *create* a withdrawal request but had no way to track what happens to it, no way to save bank details (re-typed every time), and the platform's own minimum-payout-threshold setting was a dead field nothing ever read.

**Payout dashboard shows:**
- [x] Available balance (ready to withdraw) — already built
- [x] Pending withdrawal (submitted, awaiting admin approval) — already built
- [x] Processed payouts history (date, amount, bank, status) — already built
- [x] Minimum payout threshold clearly displayed — **genuine gap, now fixed**: `PlatformSettings.minPayoutThresholdNgn` existed in the schema but had zero references anywhere in the codebase, so nothing ever enforced or displayed it. New `WalletService.getPayoutSettings()` / `GET /wallet/payout-settings` returns the vendor-safe subset; `createWithdrawalRequest` now actually rejects amounts below it; the payout form shows the real threshold instead of a hardcoded ₦1,000.

**Withdrawal flow improvements:**
- [x] Bank account management (save up to 3 bank accounts, set default) — new `BankAccount` model + migration, `getBankAccounts`/`createBankAccount`/`setDefaultBankAccount`/`deleteBankAccount` service methods and matching `/wallet/:userId/bank-accounts` endpoints. First saved account auto-defaults; saving a new default demotes the old one; capped at 3 with a clear rejection message.
- [x] Withdrawal request with pre-filled saved bank details — `CreateWithdrawalRequestDto.bankAccountId` resolves a saved account's bank details server-side; the raw `bankAccount`/`bankName`/`bankCode`/`accountName` fields are now optional and only required when no `bankAccountId` is given (mutually exclusive, validated in the service). The payout form defaults to the vendor's default saved account and offers "Enter new bank details…" as a fallback, with an option to save that new account for next time.
- [x] Status tracker: Submitted → Under Review → Approved → Paid → Confirmed — **built as a 3-stage tracker (Submitted → Reviewed by Admin → Paid Out), not literally 5**: the backend's `WithdrawalStatus` enum only has PENDING/APPROVED/REJECTED/PROCESSED, and PROCESSED is set optimistically the moment an admin approves (Paystack transfer initiated), with the `transfer.success` webhook only *confirming* the same status rather than moving to a distinct one. A 5-node UI on top of a 3-state backend would show stages the system can't actually distinguish, so the tracker reflects what's really known instead of inventing granularity.
- [x] Push/email notification when status changes at each stage — the admin-approve/reject step already notified; **newly added** the async confirmation stage: `PaymentsService`'s `transfer.success` handler now sends a "Payout confirmed" notification (previously silent), and `transfer.failed`/`transfer.reversed` sends "Payout could not be completed" after auto-refunding the held amount. Both guarded by an idempotency check against the withdrawal's current status so a repeated webhook delivery doesn't double-notify.
- [x] Estimated processing time shown ("Usually 2-3 business days") — already built, retained.

**Why:** Right now a vendor submits a withdrawal and has no idea what's happening. This creates anxiety and support requests. Transparency = trust.

**Files:** `backend/prisma/schema.prisma` (`BankAccount` model, migration `20260726151312_add_bank_account`), `backend/src/wallet/dto/bank-account.dto.ts` (new), `backend/src/wallet/dto/create-withdrawal-request.dto.ts` (`bankAccountId` added, raw bank fields made optional), `backend/src/wallet/wallet.service.ts` (threshold enforcement + bank-details resolution in `createWithdrawalRequest`, new bank-account CRUD + `getPayoutSettings`), `backend/src/wallet/wallet.controller.ts` (new endpoints), `backend/src/payments/payments.service.ts` (webhook notifications), `frontend/src/features/marketplace/vendor-dashboard/payout-management.tsx` (saved-account management UI, account picker, threshold display, status tracker). 18 new backend unit tests across `wallet.service.spec.ts` and `payments.service.spec.ts`.

---

### VND-003 · Financial Summary & Invoicing (8 SP)
**Give vendors what they need for their own bookkeeping.**

**Monthly statement:**
- Auto-generated PDF statement per calendar month
- Shows: all orders, amounts, commission deducted, refunds issued, net earnings, payouts received
- Downloadable from the earnings tab
- Statement reference number for accounting purposes

**Invoice generation:**
- Per-order invoice downloadable as PDF
- Includes: vendor business name, customer name (or "Customer"), item, quantity, unit price, total, currency, date, order ID
- Vendor's business details pulled from vendor profile

**Tax summary:**
- Annual tax summary: total gross sales, total commission, total refunds, net revenue
- For UK vendors: VAT flag (is vendor VAT registered?)
- CSV export option for accountants

**Why:** Vendors selling internationally need records. A vendor in the UK selling ₦50,000 of goods needs documentation. This is a professional feature that signals "we are a real platform."

**Files:** PDF generation service (using existing PDF infrastructure if available, or pdfmake), `vendor-statements-tab.tsx`.

**Status: ✅ DONE (2026-07-26)**

- [x] Monthly statement — `GET /marketplace/vendors/:id/statements/:year/:month`, pdfkit PDF (same infra as VND-009's packing slips), lists every order in the month + gross sales/refunds/net earnings, statement reference number `STMT-{vendorId}-{YYYYMM}`
- [x] Per-order invoice — `GET /marketplace/orders/:id/invoice`, downloadable by the owning vendor, admin, **or the customer** (all three have a legitimate reason to want their own copy); business name from the vendor profile, customer name (or "Customer"), items/qty/unit price/total/currency/date/order ID
- [x] Annual tax summary — `GET /marketplace/vendors/:id/tax-summary/:year` (JSON) and `.../csv` (CSV export) — gross sales, refunds, net revenue, computed from real order data
- [x] VAT flag — new `Vendor.vatRegistered`/`vatNumber` fields + migration `20260726190000_add_vendor_vat`, self-reported (same trust model as the existing `taxId` field), editable from the new Statements tab

**"Commission deducted" — reported honestly, not fabricated:** same finding as VND-001 (confirmed while building VND-010's escrow fix): `PlatformSettings.marketplaceCommissionPct` is never actually deducted from any real vendor payout. The statement PDF and tax summary both show the configured rate with an explicit "not yet deducted from payouts" note instead of presenting a fabricated commission line that doesn't match the vendor's real net revenue.

**Files:** `dto/return-request.dto.ts` pattern reused for none of this (kept in existing DTOs); `Vendor.vatRegistered`/`vatNumber` on `UpdateVendorDto`; 3 new `marketplace.service.ts` methods (`generateMonthlyStatement`, `generateOrderInvoice`, `getTaxSummary`/`getTaxSummaryCsv`) + 5 controller endpoints; new `vendor-statements-tab.tsx` (Statements tab in the vendor dashboard); invoice download buttons added to `vendor-order-detail-panel.tsx` and the new `my-orders-view.tsx` (VND-010).

**Tests:** 7 new backend unit tests (statement PDF generation + ownership guard, invoice access for vendor/customer/stranger, tax summary math, CSV output) — full backend suite now at 810 passing. Frontend: `tsc --noEmit` and `npm run build` both clean.

---

### VND-004 · Real-Time Sales Notifications (6 SP)
**Know the moment a sale happens.**

**Status: ✅ DONE, including the severe pre-existing payment bug discovered while auditing this item (July 26, 2026) — flagged to the user before fixing, given its severity and that it touched the core payment webhook; see `HUMAN_BACKLOG.md`'s matching entry for the full writeup.**

**Notification triggers:**
- [x] New order placed → push notification + in-app + WhatsApp (WhatsApp already exists — ensure it works) — **genuine gap, now fixed**: WhatsApp and email already fired on order creation, but no in-app/push `Notification` row ever did. The helper for it (`NotificationService.notifyVendorNewOrder`) already existed and was correctly wired to the payment-confirmation code path below, but that path was unreachable until the 🔴 fix — so it's also now called directly from `createOrder` itself, which every order (regardless of payment method) always reaches, as a second, independent trigger.
- [x] 🔴 Order payment confirmed → push notification — **the notification code was already correct; the payment confirmation itself was badly broken, and that turned out to be a much bigger, separate bug than this item's scope — fixed anyway, with explicit user sign-off first (see `HUMAN_BACKLOG.md`).** `handlePaystackWebhook`'s `charge.success` handler treated **every** successful charge as a wallet top-up unconditionally, never checking `metadata.purpose` — a customer paying for a `MARKETPLACE_ORDER` via real Paystack card checkout had that money credited to their **wallet** instead of the order being marked paid; the order stayed `PENDING` forever and the vendor was never notified. Root cause: no `Payment` row was ever created for a real gateway-initiated payment, so the already-correct purpose-aware completion logic (`processSuccessfulPayment`'s `MARKETPLACE_ORDER` case, including escrow creation and both-side notifications) was only reachable via the admin-only manual-verify action. Fixed: `initializePayment` now creates a `Payment` row for `MARKETPLACE_ORDER` purpose; the webhook now checks for a matching row first and routes to the existing completion logic (idempotent), falling through to the untouched legacy wallet-deposit path for everything else. Also relaxed `InitializePaymentDto.relatedId` from `@IsUUID()` to `@IsString()`, since multi-vendor checkout needs a comma-joined list of order ids, which the stricter validator would have rejected outright.
- [x] Order dispute raised → urgent push + email — **genuine gap, now fixed**: `DisputesService` never notified anyone at all. `createDispute` now notifies `dto.respondentId` with `sendEmail: true, sendPush: true`, and is deliberately **not** gated by any notification preference (a due-process matter, not something a vendor should be able to silence).
- [x] Low stock alert (stock < configurable threshold) → daily digest or immediate — **genuine gap, now fixed**: no cron existed for this at all (VND-005 added the `lowStockThreshold` field itself but nothing read it for alerting). New `LowStockAlertService`, daily digest, one notification per vendor summarizing all their low/out-of-stock products, deduped per day the same way `seasonal-event-reminder.service.ts` dedupes.
- [x] Review received → in-app notification — **genuine gap, now fixed**: `createProductReview` never notified the vendor at all.
- [x] Withdrawal approved → push + email — **already fully built** in VND-002; confirmed still correct, no change needed.

**Notification settings page:**
- [x] Vendor can toggle each notification type on/off — 3 new toggleable categories (`order`, `reviewReceived`, `lowStock`) added to the existing platform-wide `NotificationPreferences` model/`/notifications/preferences` endpoint (which had zero frontend consumer before this — also newly built here), plus a new distinct `NotificationType.REVIEW_RECEIVED`/`LOW_STOCK` (rather than reusing the generic `SYSTEM` type, which would've made the toggle gate unrelated platform notifications too).
- [x] Choose: push only / email only / both — per-category email/push checkboxes in the new "Notifications" vendor dashboard tab.
- [x] Set low stock threshold per product or globally — per-product only (`Product.lowStockThreshold`, from VND-005); no separate global default was added since a per-product default of 5 already covers the "didn't bother setting one" case.

**Why:** A vendor who misses an order because they didn't check the app loses a customer. Real-time awareness is the difference between a hobbyist and a professional seller.

**Files:** `backend/prisma/schema.prisma` (6 new `NotificationPreferences` columns, migration `20260726170500_add_vendor_notification_preferences`), `backend/src/notifications/notification.service.ts` (`REVIEW_RECEIVED`/`LOW_STOCK` types, `shouldSendNotification` mapping), `backend/src/notifications/notification-preferences.service.ts`/`notification-preferences.controller.ts`, `backend/src/marketplace/marketplace.service.ts` (`createOrder` vendor notification), `backend/src/marketplace/low-stock-alert.service.ts` (new cron), `backend/src/marketplace/marketplace.module.ts`, `backend/src/reviews/reviews.service.ts` (review-received notification), `backend/src/disputes/disputes.service.ts`/`disputes.module.ts` (dispute notification), `frontend/src/features/marketplace/vendor-dashboard/notification-settings.tsx` (new "Notifications" tab), `backend/src/payments/payments.service.ts` (`initializePayment` creates a `Payment` row for `MARKETPLACE_ORDER`, `handlePaystackWebhook` routes `charge.success` by purpose), `backend/src/payments/dto/initialize-payment.dto.ts` (`relatedId` relaxed to `@IsString()`). 13 new backend unit tests.

---

## 🟡 Sprint 2 — Inventory & Product Management (28 SP)

### VND-005 · Inventory Management Centre (8 SP)
**See and manage all stock in one place.**

**Status: ✅ DONE (July 26, 2026)**

**Inventory view:**
- [x] All products with: name, category, price, stock level, status (Active/Draft/Out of Stock), last updated, total sold — new `GET /marketplace/vendors/:vendorId/inventory` (`getInventorySummary`), joins each product with its total-sold count (summed from `OrderItem` for COMPLETED/DELIVERED orders) and a computed stock-level tag.
- [x] Status badges: 🟢 In Stock / 🟡 Low Stock (< threshold) / 🔴 Out of Stock — rule-based against each product's own `lowStockThreshold`, same "no black-box" framing as VND-023's completeness ranking; a 4th tag, "Made to Order," covers `isMadeToOrder`/null-stock products rather than forcing them into one of the three numeric buckets.
- [x] Sort by: stock level, sales, price, date added — client-side sort controls on the Inventory tab.
- [x] Filter by: category, status, low stock flag — same tab, client-side (the vendor's own catalogue is a small enough dataset that this doesn't need a server round-trip).

**Stock management:**
- [x] Edit stock level directly from inventory list (inline edit) — click-to-edit stock number on each card, `PATCH /marketplace/products/:id`.
- [x] Bulk restock: select multiple products, add quantity — extends VND-006's bulk-update endpoint with `stockAdjustment: { mode: ADD | SET, value }`, computed per-product against each item's own current stock (not a flat set-for-all, except when `SET` mode is explicitly chosen). Made-to-order (null-stock) products are skipped rather than guessed at — adding to "infinite" is a no-op and setting an exact number would silently turn made-to-order off underneath the vendor.
- [x] Set per-product low stock threshold (e.g. alert when < 5) — `Product.lowStockThreshold` (default 5), editable in the product form.
- [x] Mark as "Made to Order" (infinite stock, longer processing time shown to customer) — `Product.isMadeToOrder`/`madeToOrderProcessingTime`. Not a new stock-tracking mode: a null `stock` has always meant "infinite" everywhere stock is checked (`createOrder`'s decrement, the product detail page's Add to Cart gating), so this is a clearer, explicit label over that existing behavior rather than a second mechanism — the product form sends `stock: null` when the toggle is on.

**Inventory history:**
- [x] Log of stock changes: who changed it, when, from what to what — new `StockChangeLog` model, written from every place stock actually changes: a vendor's manual edit, bulk restock, a sale (`createOrder`'s atomic decrement, logged inside the same transaction), and CSV import. Sale-driven entries have no human `changedBy` (a customer isn't a stock manager) — only the source is recorded as `ORDER_SALE`.
- [x] Useful for reconciling physical stock against platform records — `GET /marketplace/products/:id/stock-history`, shown as a per-product history modal from the Inventory tab.

**Why:** Right now vendors edit stock one product at a time, inside the product form. For a vendor with 20+ products this is not workable.

**Files:** `backend/prisma/schema.prisma` (`Product.lowStockThreshold`/`isMadeToOrder`/`madeToOrderProcessingTime`, new `StockChangeLog` model, migration `20260726164000_add_inventory_management`), `backend/src/marketplace/dto/create-product.dto.ts`/`update-product.dto.ts`/`bulk-update-products.dto.ts` (`stockAdjustment`), `backend/src/marketplace/marketplace.service.ts` (`logStockChange`, `getInventorySummary`, `getStockHistory`, stock-change logging wired into `updateProduct`/`bulkUpdateProducts`/`createOrder`/`importProductsCsv`), `backend/src/marketplace/marketplace.controller.ts`, `frontend/src/features/marketplace/vendor-dashboard/product-management.tsx` (stock-level badges, sort/filter, inline stock edit, bulk restock, stock history modal), `frontend/src/features/marketplace/vendor-product-form.tsx` (low-stock threshold + Made to Order fields), `frontend/src/features/marketplace/product-detail-view.tsx` (Made to Order display). 15 new backend unit tests.

---

### VND-006 · Bulk Product Operations (6 SP)
**Manage multiple products at once.**

**Status: ✅ DONE (July 26, 2026)** — also uncovered another real, separate pre-existing gap while building this: there was no single-product delete endpoint at all (see "Also discovered" below), needed as the foundation for bulk delete.

**Bulk actions:**
- [x] Select multiple products → set status (Active/Draft) — checkbox selection + bulk status dropdown in the Inventory tab, `PATCH /marketplace/vendors/:vendorId/products/bulk`. Bulk-setting SUSPENDED is rejected (admin-only, one product at a time, per VND-008's same vendor-self-service boundary) — draft/active/archived are the only bulk-selectable states.
- [x] Select multiple → update price (% increase/decrease or fixed new price) — `priceAdjustment: { mode: PERCENT | FIXED_AMOUNT | SET_PRICE, value }`; percent/fixed amount computed per-product against each item's own current price, `SET_PRICE` applies one exact price to every selected product regardless of its current price; result is never allowed below ₦0.
- [x] Select multiple → update category — same bulk endpoint.
- [x] Select multiple → delete (with confirmation) — confirmation dialog in the UI, `POST /marketplace/vendors/:vendorId/products/bulk-delete`. Any selected product with real order history is archived instead of deleted (see below) — the response reports how many were actually deleted vs. archived instead, so the vendor isn't left guessing.
- [x] **CSV import:** Upload a CSV to create/update multiple products at once (template provided) — `POST /marketplace/vendors/:vendorId/products/import`; a row with a blank `id` creates a new product (as DRAFT, so a vendor reviews before it goes live — not specified either way by the backlog, chosen as the safer default over instantly publishing an untested bulk upload), a row whose `id` matches one of the vendor's own existing products updates it. A row whose `id` belongs to a *different* vendor is rejected as a per-row error, not silently allowed to edit someone else's listing. Per-row errors are collected and returned, not one failure aborting the whole file.
- [x] **CSV export:** Download all products as CSV for offline editing — `GET /marketplace/vendors/:vendorId/products/export`, downloads as a real CSV file client-side.

**Also discovered and fixed while building this:** there was no `DELETE /marketplace/products/:id` route at all -- both frontend product-list implementations had always been calling a delete endpoint that 404'd, so deleting a single product had never actually worked, for any vendor. Fixed with the same order-history-aware guard as bulk delete: `OrderItem.product` and `ProductReview.product` both cascade-delete in the schema, so a plain hard delete of a product that had ever been ordered would have silently destroyed real order history and reviews. A product with order history is archived instead; only order-history-free products are truly deleted.

**Why:** A vendor with a full catalogue cannot manage products one by one. A market vendor who sells 50 types of beads needs to be able to upload them all at once. This is a barrier to onboarding serious vendors.

**Files:** `backend/src/marketplace/product-csv.util.ts` (new, dependency-free CSV read/write for the fixed product column set), `backend/src/marketplace/dto/bulk-update-products.dto.ts`/`import-products-csv.dto.ts` (new), `backend/src/marketplace/marketplace.service.ts` (`deleteProduct`, `bulkUpdateProducts`, `bulkDeleteProducts`, `exportProductsCsv`, `importProductsCsv`), `backend/src/marketplace/marketplace.controller.ts`, `frontend/src/features/marketplace/vendor-dashboard/product-management.tsx` (selection checkboxes, bulk action bar, import/export buttons). 19 new backend unit tests.

---

### VND-007 · Product Variants (8 SP)
**Sell products that come in multiple options.**

**Common use cases:**
- Beads: different colours of the same type (Oshun yellow, Yemoja blue, Ogun green)
- Cloth: different sizes of Àṣọ-Òkè
- Herb bundles: different quantities (small / medium / large)
- Incense: different scents

**How it works:**
- When creating/editing a product, add "Variants" (up to 3 variant types: e.g. Colour, Size, Quantity)
- Each variant has its own: price override (optional), stock level, SKU/reference
- Customer selects variant on product page before adding to cart
- Order records which variant was purchased
- Inventory tracks per-variant

**Why:** Right now a vendor selling the same bracelet in 5 colours has to create 5 separate listings. This clutters the marketplace and makes inventory a nightmare.

**Files:** New `ProductVariant` model, extend product form and order flow.

**Status: ✅ DONE (2026-07-26)**

**How it works — matches the spec:**
- [x] Up to 3 variant types per product — `Product.variantAttributeNames` tracks the union of attribute names across a product's variants (auto-maintained on create), enforced server-side at 3
- [x] Each variant: price override (optional, falls back to the base product price), stock level (optional, `null` = unlimited like the base product's own `stock` convention), SKU/reference
- [x] Customer selects a variant on the product page before adding to cart — a dropdown of every combination (e.g. "Yellow / Medium"), required before Add to Cart is enabled once any variant exists; price and stock shown update to the selected variant's
- [x] Order records which variant was purchased — new `OrderItem.variantId`
- [x] Inventory tracks per-variant — a product with variants delegates stock tracking entirely to its variants (the atomic conditional-decrement pattern from `createOrder`'s existing stock-safety guard is reused, scoped to the variant row instead of the product row); a product with no variants behaves exactly as before this item

**Also fixed while building this — a real bug in the existing cart:** `CartContext` identified a cart line by `productId` alone. Two different variants of the same product (e.g. Yellow beads and Blue beads) would have silently merged into one cart line, combining their quantities and losing which variant was which. Cart lines are now identified by `(productId, variantId)`; `cart-view.tsx` and `checkout-view.tsx` updated to pass `variantId` through everywhere a line is referenced.

**Deletion guard:** a variant with order history can't be deleted (same "preserve order history" posture as `deleteProduct`'s archive-instead-of-delete from VND-006) — the error message tells the vendor to zero out stock instead.

**Files:** `ProductVariant` model + migration `20260726200000_add_product_variants` (+ `OrderItem.variantId`, `Product.variantAttributeNames`), `dto/product-variant.dto.ts`, 5 new `marketplace.service.ts` methods + `createOrder` extended to be variant-aware, 4 new controller endpoints, `cart-context.tsx` (composite line identity), `product-detail-view.tsx` (variant selector), `vendor-product-form.tsx` (new `ProductVariantsEditor`, shown once editing an existing product).

**Tests:** 11 new backend unit tests (variant CRUD + ownership + the 3-attribute-type cap, `createOrder` pricing/stock/validation with a selected variant) — full backend suite now at 830 passing. Frontend: `tsc --noEmit`, `npm run build`, and the existing cart/checkout Vitest suites all clean/passing.

---

### VND-008 · Draft & Scheduling (6 SP)
**Prepare products before they go live.**

**Status: ✅ DONE (July 26, 2026)** — also uncovered and fixed a real, separate pre-existing bug: the vendor dashboard's Inventory tab and the standalone `/vendor/products` page were both silently broken (see "Also discovered" below), which would have made this entire feature invisible to vendors if left as-is.

**Draft mode:**
- [x] Save a product as Draft (not visible to customers) — **genuine gap, now fixed**: `ProductStatus.DRAFT` already existed in the enum, but `createProduct` hardcoded `status: ACTIVE` always (no vendor could ever create a draft), and `updateProduct` forbade *any* non-admin from changing status at all (a vendor couldn't even self-archive their own listing). Both fixed: `createProduct` accepts `DRAFT`/`ACTIVE` at creation, `updateProduct` lets the owning vendor move freely between DRAFT/ACTIVE/ARCHIVED/OUT_OF_STOCK themselves. `SUSPENDED` stays admin-only in both directions (a vendor can neither self-suspend nor self-unsuspend) since that's a moderation outcome, not a lifecycle one.
- [x] Edit, preview exactly as customers would see it — no separate preview mode built; a draft is edited via the same product form and, once published, renders on the same product detail page every other listing uses, so there's nothing that would render differently to "preview."
- [x] Publish when ready (single click) — unchecking "Save as Draft" in the product form and saving.

**Scheduled listing:**
- [x] Set a "Goes live" date/time for a product — `Product.scheduledAt`, new `ScheduledListingActivationService` (hourly cron) flips DRAFT → ACTIVE once it passes.
- [x] Useful for: limited edition releases, festival-specific items, coordinated launches — supported as described; no festival-specific logic needed beyond the date field itself.
- [x] Product shows as "Coming Soon" on marketplace if vendor enables it — `Product.showComingSoon`; `findAllProducts`'s default (no explicit status filter) visibility now includes ACTIVE products plus DRAFT+showComingSoon+future-scheduledAt ones, so a vendor opting in surfaces the listing early without making it purchasable (checkout already only allows ACTIVE products, unchanged).

**Pre-order mode:**
- [x] Enable pre-orders (product shown as "Pre-Order" with expected delivery date) — `Product.isPreOrder`/`expectedDeliveryDate`, badge + expected-delivery text on the product detail page and marketplace grid card.
- [x] Stock treated as pre-order slots (e.g. 20 pre-orders accepted) — no second counter added; reuses the existing `stock` field exactly as the backlog itself frames it.
- [x] Auto-notifies customers when ready to ship — fires in `updateProduct` when a vendor turns `isPreOrder` off: every customer with a still-open (`PENDING`/`PAID`) order containing that product gets one notification each (deduplicated per customer, not per order-item).

**Also discovered and fixed while building this:** the vendor dashboard's "Inventory" tab (`product-management.tsx`) called `GET /vendors/:vendorId/products` and `DELETE /products/:id` — neither route exists (should be under `/marketplace/...`), so the tab silently 404'd; its "Edit" button also didn't actually open the clicked product, just navigated to the generic product list. Separately, the standalone `/vendor/products` page (`vendor-product-list-view.tsx`) queried `vendorId: user.id`, but `Product.vendorId` references the *Vendor* record's id, not the *User*'s — so a real vendor's own product list always rendered empty. Both fixed: new authenticated `GET /marketplace/vendors/:vendorId/products` (ownership-checked, returns every status — needed anyway so a vendor can see their own drafts/coming-soon/archived listings, which the public-facing `findAllProducts` visibility rules deliberately hide), wired into both places with the correct vendor id, and Inventory's Edit button now opens a real edit modal.

**Why:** A vendor launching a new line of consecrated items for Osun Grove Festival wants to build anticipation, not just suddenly appear. Scheduling and pre-orders are standard e-commerce tools that signal professional operations.

**Files:** `backend/prisma/schema.prisma` (`Product.scheduledAt`/`showComingSoon`/`isPreOrder`/`expectedDeliveryDate`, migration `20260726162000_add_product_draft_scheduling_preorder`), `backend/src/marketplace/dto/create-product.dto.ts`/`update-product.dto.ts`, `backend/src/marketplace/marketplace.service.ts` (`createProduct` status/scheduling fields, `updateProduct` self-service status + pre-order-ready notification, `findAllProducts` Coming-Soon visibility, new `getVendorProducts`), `backend/src/marketplace/marketplace.controller.ts`, `backend/src/marketplace/scheduled-listing-activation.service.ts` (new cron), `backend/src/marketplace/marketplace.module.ts`, `frontend/src/features/marketplace/vendor-product-form.tsx` (Publishing section), `frontend/src/features/marketplace/vendor-dashboard/product-management.tsx` (fixed + edit modal + status badges), `frontend/src/features/marketplace/vendor-product-list-view.tsx` (fixed vendorId bug), `frontend/src/features/marketplace/product-detail-view.tsx`/`marketplace-view.tsx` (Coming Soon/Pre-Order display). 20 new backend unit tests.

---

## 🟡 Sprint 3 — Order Management & Fulfilment (24 SP)

### VND-009 · Advanced Order Management (8 SP)
**Handle orders with the professionalism customers expect.**

**Order list improvements:**
- Filter by: status / date range / product / payment method
- Search by: customer name, order ID, product name
- Sort by: date, amount, status
- Bulk actions: mark multiple as shipped (with tracking), bulk print packing slips

**Order detail improvements:**
- Full customer shipping address (formatted)
- Customer's order history with this vendor (returning customer badge)
- Internal notes field (vendor-only, not shown to customer)
- Communication log (all messages with this customer about this order)
- One-click: generate packing slip PDF
- One-click: copy tracking info to clipboard

**Order timeline:**
- Visual timeline: Placed → Paid → Processing → Shipped → Delivered → Completed
- Admin can see the same timeline when reviewing orders

**Why:** Right now the order management view is functional but sparse. As orders grow, vendors need to filter, search, and act on orders efficiently.

**Files:** Extend `VendorOrderListView`, `VendorOrderDetailPanel`.

**Status: ✅ DONE (2026-07-26)**

**Discovered while building this — the vendor dashboard's actual "Orders" tab was completely non-functional:** `orders-management.tsx` (rendered as the Orders tab inside the main `VendorDashboardView`, separate from the standalone `/vendor/orders` route) had `const ordersData: Order[] = []` and `const ordersLoading = false` hardcoded, with a comment claiming "PRODUCTION: Fetching real orders from backend API" — nothing was ever fetched. Every vendor saw "No orders yet" regardless of real order volume. This was the primary reachable Orders surface and is now fully wired to real data, matching the same "found a silently-broken primary surface" pattern as VND-006/008's Inventory tab.

**Also discovered and fixed:**
- `vendor-order-list-view.tsx` (the standalone `/vendor/orders` route) rendered `order.buyer?.name ?? order.customer ?? 'Customer'` — `order.buyer` never existed on the API response and `order.customer` is an object (`{id, name, email}`), not a string, so this printed `[object Object]` for every row. Fixed to `order.customer?.name`. Its search box and Filter button were also purely decorative (rendered, but nothing consumed their state) — now wired to the real filter/search/sort query.
- **Privacy leak:** `findOrderById` (backing `GET /marketplace/orders/:id`, used by `VendorOrderDetailPanel`) returned the full `Order` row including `vendorNotes` to *any* viewer with access — including the customer who owns the order. Since `vendorNotes` is explicitly "vendor-only, never shown to the customer," a customer calling their own order endpoint (trivial, since they already have access) could read the vendor's internal notes about them. Fixed by stripping `vendorNotes` from the response unless the requester is the owning vendor or an admin.

**Backend (all in `marketplace.service.ts` / `marketplace.controller.ts`):**
- `Order.vendorNotes` field + migration `20260726173000_add_order_vendor_notes`; `UpdateOrderDto.vendorNotes`, guarded so only the vendor/admin can set it, never the customer.
- `getVendorOrders(vendorId, user, filters)` — status/date range/product/payment method/search filters, sort by date/amount/status, plus a computed `isReturningCustomer` flag per order (batched `groupBy` on prior COMPLETED/DELIVERED orders for the same customer+vendor). `GET /marketplace/vendors/:vendorId/orders`.
- `bulkUpdateOrderStatus(vendorId, orderIds, dto, user)` — ownership-checks every id, then loops the existing single-order `updateOrder` (not a raw `updateMany`) so each order still gets its escrow release and status-change/tracking-added emails. `PATCH /marketplace/vendors/:vendorId/orders/bulk`.
- `generatePackingSlips(vendorId, orderIds, user)` — pdfkit PDF, one page per order for bulk requests, single page for the per-order download. `POST /marketplace/vendors/:vendorId/orders/packing-slips`.

**Frontend:**
- `orders-management.tsx` rebuilt from the ground up: real `useQuery` against `getVendorOrders`, search box, status filter + sort dropdowns, checkbox multi-select, bulk "Mark N as Shipped" (only counts/acts on PAID orders) and "Download Packing Slips" actions, returning-customer badge per row.
- `vendor-order-list-view.tsx`: customer-name bug fixed, search/filter/sort wired to the same endpoint, returning-customer badge added.
- `vendor-order-detail-panel.tsx`: visual order timeline (Placed → Paid → Shipped → Delivered → Completed, hidden for Cancelled/Refunded), one-click packing-slip download, one-click copy-tracking-to-clipboard, and an internal-notes textarea (vendor/admin only, saved via the existing `updateOrder` PATCH).

**Not built — scoped out, not silently dropped:** the "communication log (all messages with this customer about this order)" bullet requires 1:1 Messaging, which is paused platform-wide per `MVP_PIVOT_BACKLOG.md` (same dependency block as VND-012). "Full customer shipping address (formatted)" was already present in the existing detail panel — no work needed.

**Tests:** 14 new backend unit tests (`getVendorOrders` filters/sort/returning-customer, `bulkUpdateOrderStatus` ownership + per-order looping + partial-failure collection, `generatePackingSlips` single/bulk, `vendorNotes` write-guard, `findOrderById` vendorNotes visibility by role) — marketplace spec now at 163 tests, full backend suite at 774, all passing. Frontend: `tsc --noEmit` and `npm run build` both clean.

---

### VND-010 · Returns & Dispute Management (6 SP)
**Handle returns and dissatisfied customers professionally.**

**Return flow:**
1. Customer initiates return request (reason + photos if physical item)
2. Vendor sees return request in "Returns" tab
3. Vendor responds: Accept / Reject / Offer partial refund
4. If accepted: vendor provides return address (if physical) or revokes access (if digital)
5. Once customer confirms return: refund processed

**Dispute escalation:**
- If vendor and customer can't agree → escalate to admin
- Admin sees full history: order, messages, return request, vendor response
- Admin ruling is final (and logged)

**Return analytics:**
- Return rate per product (high return rate = product description issue or quality issue)
- Most common return reasons

**Why:** Currently vendors can issue refunds but there's no structured returns process. When a customer says "this is not what was described," there's no clear path. This creates disputes that land in admin without context.

**Files:** New `ReturnRequest` model, `vendor-returns-tab.tsx`, extend dispute centre for marketplace context.

**Status: ✅ DONE (2026-07-26)**

**Found while building this — a severe, pre-existing money-movement bug, fixed first (with the user's explicit go-ahead) before any of the return flow was built on top of it:** `refundOrder` only ever flipped the `Order` row's `status`/`refundAmount` fields — **no money ever actually moved on a refund, for any order, ever.** Tracing why led further back to `processMarketplaceOrderPayment`'s vendor escrow creation, which required the *customer's own internal wallet balance* to already hold the order amount (wrong — that money came from an external Paystack charge, never the customer's wallet) and so silently failed to create an escrow on essentially every real order, meaning vendors were never actually paid. Both fixed; full writeup in `HUMAN_BACKLOG.md`'s two 2026-07-26 entries. This item's own refund step (`confirmReturnRequest`) would have been building "successfully" on top of a no-op refund and a non-existent escrow if this hadn't been caught here.

**Return flow — all built:**
- [x] Customer initiates return request (`POST /marketplace/orders/:orderId/return`) — `reasonCategory` (fixed rule-based enum: NOT_AS_DESCRIBED / DAMAGED_DEFECTIVE / WRONG_ITEM / QUALITY_ISSUE / CHANGED_MIND / OTHER, not freeform-text clustering) + `reason` + optional `photos` (URLs). One return request per order (`ReturnRequest.orderId` is `@unique`) — deliberately not a re-openable/repeatable flow in this pass.
- [x] Vendor sees return requests in a "Returns" tab — new `vendor-returns-tab.tsx`, added to the vendor dashboard's tab bar
- [x] Vendor responds: Accept / Reject / Offer partial refund (`PATCH /marketplace/returns/:id/respond`)
- [x] If accepted: vendor provides a return address, **required only when the order contains a `PHYSICAL` product** (checked against `OrderItem.product.type`) — a digital-only order's accept doesn't need one. "Revokes access" for digital-only accepts isn't built (no digital-delivery/access-revocation mechanism exists yet — see VND-024, unbuilt, still pending in this sweep)
- [x] Once customer confirms return (`POST /marketplace/returns/:id/confirm`): refund processed for real — cancels the order's escrow hold (if still `HOLD`) and credits the customer's wallet with the confirmed amount (full, or the vendor's partial-refund offer)

**Dispute escalation — built via the existing Dispute system, not a parallel one:**
- [x] Either party can escalate (`POST /marketplace/returns/:id/escalate`) — creates a real `Dispute` row via a new `DisputesService.createFromReturnRequest()`, reusing the exact same "on behalf of" pattern already established for `PractitionerComplaint` escalation (`createFromComplaint`), routed ORDER/PRODUCT_QUALITY → Admin
- [x] Admin sees the order + return request + vendor response via the existing dispute detail view (`Dispute.orderId`, `evidence` = the return's photos) — no new admin UI needed, the dispute centre already shows this
- [x] Admin ruling is final and logged — existing `resolveDispute` behavior, unchanged
- **Not built:** "messages" in the admin's full-history view — there's no 1:1 Messaging to show (paused platform-wide per `MVP_PIVOT_BACKLOG.md`, same dependency as VND-012)

**Return analytics — rule-based, not a black-box score:**
- [x] `GET /marketplace/vendors/:vendorId/returns/analytics` — return rate per product (returns / total orders containing that product, both counted from real order data) and most-common-reasons (counted by the fixed `reasonCategory` enum, an honest count rather than fuzzy text clustering)

**Also discovered and fixed while building this — no customer-facing order history existed anywhere in the app:** every "Orders" surface in the codebase (`vendor-order-list-view.tsx`, `orders-management.tsx`) was vendor-only. A customer had no way to see their own past marketplace orders at all, which meant the return flow above would have had nowhere to attach a "Request Return" button even once built. New `my-orders-view.tsx` at `/my-orders` (linked from a new "My Orders" button next to the Cart button on the marketplace page) — lists the customer's own orders (reusing the existing customer-scoped `GET /marketplace/orders`), shows each order's return status inline, and hosts the request/confirm/escalate actions from the customer side.

**Files:** `ReturnRequest` model + migration `20260726180000_add_return_request`, `dto/return-request.dto.ts`, `marketplace.service.ts`/`marketplace.controller.ts` (7 new methods/endpoints), `disputes.service.ts` (`createFromReturnRequest`), `wallet.service.ts` (`createExternallyFundedEscrow`, `refundMarketplaceOrder` — see `HUMAN_BACKLOG.md`), `vendor-returns-tab.tsx` (new), `my-orders-view.tsx` (new), `marketplace-view.tsx` + `MarketplacePage.tsx` (My Orders entry point), `vendor-dashboard-view.tsx` (Returns tab wiring).

**Tests:** 24 new backend unit tests (`createReturnRequest`, `respondToReturnRequest`, `confirmReturnRequest`, `escalateReturnRequest`, `getReturnAnalytics`, `createFromReturnRequest`, plus the underlying `refundOrder`/escrow money-movement fixes) — full backend suite now at 798 passing (up from 774 before this item). Frontend: `tsc --noEmit` and `npm run build` both clean, existing marketplace/checkout Vitest suites still green.

---

### VND-011 · Shipping Management (6 SP)
**Give vendors tools to handle physical delivery professionally.**

**Status: ✅ DONE (July 26, 2026)** — this was the explicit unblocking dependency for `SHOP_BACKLOG.md`'s MSP-009 and MSP-017, so it was tackled first.

**Shipping settings (per vendor):**
- [x] Countries shipped to (select list) — `ShippingZone.countries: String[]`, matched case-insensitively at checkout
- [x] Shipping rates: Free / Flat rate / Weight-based — **"By region" achieved via multiple zones**, not a fourth rate type (a vendor creates a "Nigeria" zone and an "International" zone with different rates, rather than one "by region" rate type trying to express that on its own)
- [x] Processing time — free-text per zone (e.g. "3-5 business days"), shown to the vendor and returned in the shipping quote
- [x] Combined shipping discount (order 2+ items, save X%) — `combinedShippingDiscountPct`, applied when total quantity across the order is 2+

**Per-order shipping:**
- [x] Auto-calculate shipping cost at checkout based on vendor settings + customer location — **this was a genuine, complete gap**: `createOrder` previously trusted `dto.shippingCost` directly from the client with zero server-side rate structure behind it, and the frontend hardcoded `shippingCost: 0` ("Free shipping for now") unconditionally. Now: `MarketplaceService.calculateShippingCost()` matches the order's `shippingCountry` against the vendor's zones (falling back to an `isDefault` zone, then to 0 if neither exists), computes FLAT/WEIGHT_BASED cost server-side, and `createOrder` uses that authoritative value — a vendor who hasn't configured any zones yet keeps today's client-supplied/0 behavior, so this isn't a breaking change mid-rollout. New public `POST /marketplace/vendors/:vendorId/shipping-quote` lets the checkout UI show the cost before payment.
- [x] Vendor updates tracking: carrier, tracking number, tracking URL — **discovered already fully built** (`Order.carrier`/`trackingNumber`/`trackingUrl`, `UpdateOrderDto`, `marketplace.service.ts`'s `updateOrder`) before this item was even started; nothing to do here.
- [x] Customer receives auto-notification with tracking details — **discovered already fully built** (`OrderNotificationService.notifyTrackingAdded`, fired when tracking is first set).

**Shipping presets:**
- [ ] Save common shipping configurations as presets, apply to multiple products quickly — **not built**. Zones are vendor-wide for this pass (every one of a vendor's products uses the same zone structure), which already gets most of the practical value a "preset" would ("apply to multiple products" is moot when the configuration is already vendor-wide, not per-product). A genuine per-product preset system, if still wanted once vendors are using this, is a small follow-up, not core to the item's "why."

**Also fixed while building this, found in the same code path:** checkout never included the 7.5% VAT that `createOrder` has always added server-side to `order.totalAmount` — the displayed/charged total was the bare item subtotal only, even before shipping was real. `checkout-view.tsx` now shows a transparent Subtotal → Shipping → VAT (7.5%) → Total breakdown, and charges the real total via `PaymentModal`.

**Why:** Right now there is no shipping configuration. The platform has no way to calculate or display shipping costs to customers. This is a critical gap for physical goods vendors (which is most of them).

**Files:** `backend/prisma/schema.prisma` (`ShippingZone` model, `Product.weight`, `Order.shippingCountry`), `backend/src/marketplace/marketplace.service.ts`/`marketplace.controller.ts` (zone CRUD + `calculateShippingCost`/`getShippingQuote`), `backend/src/marketplace/dto/shipping-zone.dto.ts`, `frontend/src/features/marketplace/vendor-dashboard/shipping-management.tsx` (new "Shipping" tab), `frontend/src/features/marketplace/checkout-view.tsx` (country field, real quote fetching, VAT-inclusive total). 13 new backend unit tests.

---

### VND-012 · Customer Communication Hub (4 SP)
**See all customer conversations in one place, not scattered through messages.**

**Status: 🚫 BLOCKED (checked July 26, 2026)** — this entire item is a filtering/organization layer *on top of* 1:1 Messaging, which is paused platform-wide per `MVP_PIVOT_BACKLOG.md` (see `CLAUDE.md`'s "Paused / Deprioritized Platform Dependencies" section). Building vendor-specific message filters, templates, and an order-context sidebar for an inbox that's currently in a "Coming Soon" paused state would be dead code with nothing to filter. Deferred until Messaging is reactivated — no schema/service/frontend work done here.

**Vendor message centre:**
- Filter messages by: order-related / general / unread
- Quick context: when a customer messages, show their active orders with this vendor alongside the message
- Message templates: pre-written responses for common scenarios ("Thank you for your order — it will ship in 2-3 days")
- Flag a conversation for follow-up

**Why:** Right now vendor messages go into the general messages inbox with no order context. A vendor trying to handle 20 orders and 30 messages needs to see the order next to the message.

**Files:** Extend messaging view with vendor-specific filters and order context sidebar.

---

## 🟡 Sprint 4 — Analytics & Growth (20 SP)

### VND-013 · Advanced Sales Analytics (8 SP)
**Understand what's working and what's not.**

**Charts and metrics:**
- Revenue trend (daily / weekly / monthly) — line chart
- Orders by status breakdown — pie chart
- Top 5 products by revenue — bar chart
- Top 5 products by units sold — separate from revenue (a ₦500 item sold 100x vs a ₦50,000 item sold once)
- Average order value trend
- Repeat customer rate (% of orders from returning customers)
- Geographic breakdown (where are my customers from?)

**Product performance table:**
- Per product: views (if we track), add-to-carts (if we track), orders, revenue, return rate, avg rating
- Sort by any column
- Export as CSV

**Time period selector:** Today / This week / This month / Last 3 months / Custom range

**Why:** The current analytics dashboard shows 4 summary numbers. That's not enough to make business decisions. A vendor needs to know: "My brass Esu staff is my best seller — I should make more. My herb bundles have a high return rate — the description needs improving."

**Files:** New `vendor-analytics-view.tsx`, extend dashboard service with detailed queries.

**Status: ✅ DONE (2026-07-26)**

**All charts/metrics built, from real data:**
- [x] Revenue trend — line chart, bucket granularity scales with the range (daily ≤31 days, weekly ≤180, monthly beyond) so a year-long custom range doesn't return 365 single-order points
- [x] Orders by status — pie chart
- [x] Top 5 products by revenue **and** top 5 by units sold, computed separately (a ₦500 item sold 100x and a ₦50,000 item sold once look identical in an order-count table but very different in these two)
- [x] Average order value trend — same bucketing as revenue trend
- [x] Repeat customer rate — same "returning customer" definition as VND-009's `getVendorOrders`, aggregated to a rate
- [x] Geographic breakdown — grouped by `Order.shippingCountry` (the real field added in VND-011), missing values bucketed as "Unknown" rather than dropped
- [x] Time period selector — Today / This Week / This Month / Last 3 Months / Custom range

**Product performance table:**
- [x] Per product: orders, revenue, return rate (reuses VND-010's `getReturnAnalytics` rate definition), avg rating (from `ProductReview`)
- [x] Sort by any column (client-side, click a header)
- [x] Export as CSV (client-side, from the already-fetched table — no extra round trip)
- **Not built — honestly, not fabricated:** "views" and "add-to-carts" columns. The spec itself says "if we track" — nothing in this codebase tracks product views or add-to-cart events (no such field/model exists anywhere). Rather than show a fake `0` that looks like real tracked data, the table omits these columns entirely and says so in a footnote.

**New:** `GET /marketplace/vendors/:id/sales-analytics?from=&to=`, linked from the existing simple Analytics tab ("View Detailed Analytics →").

**Files:** `marketplace.service.ts` (`getVendorSalesAnalytics`), 1 new controller endpoint, new `vendor-analytics-view.tsx` at `/vendor/analytics`, link added to `analytics-dashboard.tsx`.

**Tests:** 4 new backend unit tests (top-products-by-revenue-vs-units separation, geographic grouping incl. the Unknown-country case, repeat-rate math, ownership guard) — full backend suite now at 814 passing. Frontend: `tsc --noEmit` and `npm run build` both clean.

---

### VND-014 · Product Performance & Optimisation Tips (5 SP)
**Tell vendors what to do to sell more.**

**Per-product insights:**
- "This product has no reviews — consider asking your first buyers to leave feedback"
- "This product's stock is 2 — you sold 8 last month. Consider restocking."
- "This product hasn't sold in 30 days — consider reducing the price or updating the description"
- "Your top product has 4.8 stars — consider creating a bundle with your second-best product"

**Vendor score card (monthly):**
- Fulfilment rate (% of orders shipped within stated processing time)
- Response rate (% of messages replied to within 24 hours)
- Rating average
- Return rate
- Overall: 🌟 Top Vendor / ✅ Good Standing / ⚠️ Needs Attention / 🔴 At Risk

**Why:** Most vendors don't know why their products aren't selling. Simple, data-driven nudges — shown in plain language — are more valuable than a raw analytics table.

**Files:** New `vendor-insights-panel.tsx`, extend analytics service.

**Status: ✅ DONE (2026-07-26)**

**Per-product insights — all four rule-based nudges built:**
- [x] No reviews yet, but has sold — "consider asking your first buyers to leave feedback"
- [x] Low stock vs. last-30-day sales — "stock is X, you sold Y last month, consider restocking" (skipped entirely for made-to-order products, which have no real stock ceiling to be low against)
- [x] Hasn't sold in 30+ days — "consider reducing the price or updating the description" (only fires for listings older than 30 days, so a brand-new product isn't nagged before it's had a chance)
- [x] Top product bundle suggestion — best-seller by units, if its rating is 4.5+, suggested to bundle with the runner-up

**Vendor scorecard (monthly):**
- [x] Rating average — across all of the vendor's products
- [x] Return rate — reuses VND-010's return-rate definition
- [x] Overall tier — 🌟 Top Vendor / ✅ Good Standing / ⚠️ Needs Attention / 🔴 At Risk, via explainable fixed thresholds (not a fitted/black-box score); a vendor with no reviews yet defaults to Good Standing rather than being penalized for insufficient data
- [x] "Fulfilment rate (% shipped within stated processing time)" — **can't be honestly built as specified**: `ShippingZone.processingTime` (VND-011) is freeform text ("3-5 business days", "Same day", etc.), not a structured day count, and parsing arbitrary prose into a number to grade against would be exactly the fragile-guess pattern this project avoids elsewhere. Reported instead as **"average days to ship"** — a real, directly-computed number (`shippedAt − paidAt`), honestly labeled as what it is.
- **Not built:** "Response rate (% of messages replied to within 24h)" — 1:1 Messaging is paused platform-wide per `MVP_PIVOT_BACKLOG.md` (same dependency block as VND-012), so there's nothing to measure a response rate against.

**New:** `GET /marketplace/vendors/:id/insights`, new "Insights" tab in the vendor dashboard.

**Tests:** 7 new backend unit tests (each of the 4 insight rules incl. the made-to-order/brand-new exclusions, scorecard math, insufficient-data default, ownership guard) — full backend suite now at 821 passing. Frontend: `tsc --noEmit` and `npm run build` both clean.

---

### VND-015 · Seasonal & Festival Planning (4 SP)
**Help vendors sell more around Yoruba festivals and seasons.**

**Cultural calendar integration:**
- Show upcoming Yoruba festivals in vendor dashboard (Isese Day, Osun Grove, etc.)
- "Isese Day is in 3 weeks — vendors selling white cloth, Ifa tools, and offerings typically see 3x sales. Consider increasing stock and creating a featured listing."
- Link to "Create a Festival Bundle" (bundle builder)

**Bundle builder:**
- Create a product bundle (e.g. "Oshun Initiation Bundle" = specific beads + specific cloth + specific herb)
- Bundle has its own listing page
- Discount relative to buying items individually (optional)
- Auto-reduces stock of each component when bundle sells

**Why:** Sacred goods are seasonal. Vendors who understand the cultural calendar sell more. This also differentiates Ìlú Àṣẹ — no other marketplace does this.

**Files:** New `ProductBundle` model, `vendor-bundles-tab.tsx`, cultural calendar data.

**Status: ✅ DONE (2026-07-26)**

**Bundle builder — already existed, not rebuilt:** `ProductBundle`/`ProductBundleItem` were fully built for `SHOP_BACKLOG.md`'s MSP-002/MSP-019 ("Ritual Readiness Kits") — a bundle has its own listing page, cross-vendor items, an elder-review queue, a ritual guide, and a customization-request inbox. Two of this item's sub-bullets are deliberate, already-documented architectural choices from that build, not gaps:
- "Discount relative to buying items individually (optional)" — **not built, on purpose**. The schema comment explains why: a stored bundle price would go stale the moment any component vendor changes their own product's price, so bundle price/availability is always computed live from the components instead. Adding a discount field now would contradict that already-considered decision.
- "Auto-reduces stock of each component when bundle sells" — **already true, no bundle-specific code needed**. Checkout for a bundle creates ordinary per-vendor `Order`s for the component products through the same `createOrder` path every other purchase uses, so the existing atomic stock-decrement guard already covers it.

**Cultural calendar integration — the genuinely new part of this item:**
- [x] Upcoming Yoruba festivals shown in the vendor dashboard — reuses the existing `SacredCalendarEvent` model (`ADM-015`) rather than a second calendar; new panel at the top of the existing Bundles tab, next 60 days
- [x] Link to "Create a Festival Bundle" — the panel sits directly above "Propose a Bundle" on the same tab (no separate page to link to)
- [x] Sales-lift context — **"vendors selling white cloth typically see 3x sales" from the spec would have to be fabricated**: nothing anywhere tracks a category-to-festival sales correlation platform-wide, and inventing a multiplier would be exactly the kind of unverifiable claim this project avoids elsewhere. Built instead as a **real, vendor-specific comparison**: if this vendor has actual order data both in a ±3-day window around the same calendar date last year *and* across that whole year (to have a baseline), the panel shows their own real revenue lift/drop for that window. If there isn't enough historical data (most vendors, on a platform this young), the event is still shown but with no fabricated percentage attached — never a misleading "0%."

**Files:** `marketplace.service.ts` (`getVendorSeasonalInsights`), 1 new controller endpoint, `bundle-management.tsx` (new `SeasonalInsightsPanel`, `vendorId` prop threaded through from `vendor-dashboard-view.tsx`).

**Tests:** 4 new backend unit tests (historical-lift computed when real data exists, omitted when it doesn't, 60-day window boundary, ownership guard) — full backend suite now at 834 passing. Frontend: `tsc --noEmit` and `npm run build` both clean.

---

### VND-016 · Vendor Storefront Customisation (3 SP)
**Give each vendor their own identity on the platform.**

**Status: ✅ DONE (July 26, 2026)** — also a genuine, complete gap: there was previously no public vendor-facing page at all (only the vendor's own private dashboard and a fully mock-data `VendorDirectoryPage.tsx` that links to a generic `/profile/:userId`, not a storefront). This item builds the storefront page from scratch.

**Storefront controls (within platform design language):**
- [x] Vendor bio / about section (extended from current `description`) — no second field added, exactly as scoped; editable from the new vendor dashboard "Storefront" tab.
- [x] Featured products (pin up to 3 at top of storefront) — `Vendor.featuredProductIds String[]`, capped at 3 and ownership-validated server-side in `updateVendor` (rejects pinning a product that isn't the vendor's own).
- [x] Storefront banner image — `Vendor.bannerImageUrl`, `@IsUrl()`-validated.
- [x] "About my practice" section — there's no separate `BabalawoProfile` model, practitioner info (bio, slug) lives directly on `User`, so `findVendorByUserId` now also selects `user.role`/`user.bio`/`user.slug`; the storefront page shows a link to the practitioner's existing shareable profile URL (`/:slug`) when `user.role === 'BABALAWO'`.
- [x] Social proof: total sales count, review count, member since date — computed live: `totalSales` from completed (`COMPLETED`/`DELIVERED`) order count, `reviewCount`/`averageRating` from a `ProductReview` aggregate across the vendor's products, `memberSince` from `Vendor.createdAt`.
- [ ] Response time — **deliberately not built**: there's no real data source for it (Messaging is paused platform-wide per `MVP_PIVOT_BACKLOG.md`, and no other channel logs vendor response latency), so it would have to be either fabricated or omitted. The seed/demo ecosystem has always shown a made-up `responseTime` string for demo vendors, but shipping that as a "real" stat on live storefronts would be a fake trust signal — the opposite of this item's own stated goal.

**Why:** Right now all vendor storefronts look identical. A vendor who has been on the platform for a year and has 200 sales should look visibly more established than a brand new vendor. Trust signals sell.

**Also discovered while building this:** `VendorDirectoryPage.tsx` (the `/vendors` listing) is still 100% hardcoded mock data — its "View Profile" button doesn't go anywhere real. Wiring that page to `GET /marketplace/vendors` and linking to the new `/vendors/:userId` storefront is real, cheap follow-up work, but it's a directory/discovery gap distinct from this item's "give a vendor their own page" scope — flagged for `VND-023 · Marketplace SEO & Discovery`, up next.

**Files:** `backend/prisma/schema.prisma` (`Vendor.bannerImageUrl`/`featuredProductIds`, migration `20260726153048_add_vendor_storefront_customisation`), `backend/src/marketplace/dto/update-vendor.dto.ts`, `backend/src/marketplace/marketplace.service.ts` (`findVendorByUserId` social-proof aggregation, `updateVendor` featured-product ownership check), `frontend/src/pages/VendorStorefrontPage.tsx` (new public page, routed at `/vendors/:vendorId`), `frontend/src/features/marketplace/vendor-dashboard/storefront-management.tsx` (new "Storefront" dashboard tab), `frontend/src/features/marketplace/product-detail-view.tsx` (vendor name now links to the storefront). 8 new backend unit tests.

---

## 🟢 Sprint 5 — Cultural Integrity & Certification (16 SP)

### VND-017 · Cultural Authenticity Certification (8 SP)
**Give buyers confidence that what they're buying is genuine.**

**Status: ✅ DONE (July 26–27, 2026)** — `Vendor.culturalCertificationTier` (`COMMUNITY_LISTED` default / `COMMUNITY_VERIFIED` / `ELDER_ENDORSED`) plus a `VendorCertificationApplication` model tracking each application's requested tier, documentation, status, and admin review. `getCulturalCertificationStatus()`/`applyCulturalCertification()` in `marketplace.service.ts` — a vendor can't apply for a tier at or below their current one, and can't have two pending applications at once. Admin review flow approves/declines with a reason. Buyer-facing: `ELDER_ENDORSED` marketplace filter and tier badges on product cards/detail pages. Live-verified with Playwright end-to-end. This is also the sourcing signal the July 27, 2026 MSP-006 Transparency Report reuses (see `SHOP_BACKLOG.md`) rather than inventing a second one.

**Three certification tiers:**

1. **Community Listed** (default) — Listed on the platform, no additional vetting. Vendor self-declares cultural authenticity.

2. **Community Verified** — Vendor has provided documentation of sourcing/provenance. Admin has reviewed. Products carry "Community Verified" badge.

3. **Elder Endorsed** — A verified Babalawo or Iyanifa has explicitly endorsed this vendor's products as culturally appropriate and correctly made. Products carry "Elder Endorsed" badge — the highest trust marker on the platform.

**Certification process (admin-facilitated):**
- Vendor applies for higher tier from their dashboard
- Uploads supporting documentation (provenance statements, artisan lineage, sourcing details)
- Admin or designated Elder reviews
- Approved = tier upgraded, badge appears on all products
- Declined = reason provided, vendor can reapply

**Buyer-facing:**
- Marketplace filter: "Show only Elder Endorsed"
- Badge on product cards and product detail pages

**Why:** The biggest risk for a sacred goods marketplace is counterfeit or inappropriate items. The certification system creates a trust hierarchy that protects buyers and rewards serious vendors.

**Files:** Extend Vendor model with certification tier + history, `vendor-certification-tab.tsx`, admin review flow.

---

### VND-018 · Yoruba Language Product Listings (4 SP)
**Allow vendors to add Yoruba names and descriptions.**

**Status: ✅ DONE (July 26, 2026)**

**Per product:**
- [x] Yoruba name (optional) — shown prominently if provided — `Product.yorubaName`
- [x] Yoruba description (optional) — shown as a second tab alongside English — `Product.yorubaDescription`, English/Yorùbá toggle on the product detail page (only rendered when a Yoruba description exists)
- [x] Pronunciation guide (text field) — `Product.pronunciationGuide`, shown under the title as "Pronounced: …"
- [x] Traditional use context (separate from commercial description) — `Product.traditionalUseContext`, its own visually distinct (highlight-tinted) block, separate from both `description` and the existing `usageProtocol` field
- [x] Region of origin (e.g. Ọṣun State / Ogun State / Eko / Diaspora-made) — `Product.regionOfOrigin`, free text (not an enum — the example list is illustrative, not exhaustive, and a diaspora vendor's real answer won't fit a fixed Nigerian-states list)

**Marketplace display:**
- [x] Yoruba name shown first if present, English in brackets — product detail page title and the marketplace grid card title
- [x] "Traditional Use" section on product detail (styled differently from commercial description) — highlight-tinted callout box, distinct from the plain-text description/provenance/usage-protocol blocks above it
- [x] Region of origin badge on product card — added to both the product detail page's badge row and the marketplace grid card (`marketplace-view.tsx`)

**Why:** A vendor selling authentic Yoruba beads should be able to name them in Yoruba. This is part of the platform's cultural identity and helps distinguish authentic vendors from generic sellers.

**Files:** `backend/prisma/schema.prisma` (5 new `Product` fields, migration `20260726153913_add_product_yoruba_fields`), `backend/src/marketplace/dto/create-product.dto.ts`/`update-product.dto.ts`, `backend/src/marketplace/marketplace.service.ts` (`createProduct`'s data block — `updateProduct` already spreads its DTO generically and needed no change), `frontend/src/features/marketplace/vendor-product-form.tsx` ("Yoruba Language Details" form section), `frontend/src/features/marketplace/product-detail-view.tsx`, `frontend/src/features/marketplace/marketplace-view.tsx`. 1 new backend unit test.

---

### VND-019 · Vendor Community & Knowledge Sharing (4 SP) — 🟢 BUILT (July 25, 2026)
**Help vendors learn from each other.**

**Vendor-only community space:**
- [x] Dedicated forum category: "Vendor Circle" — added to `seed-forum-categories.ts` (upsert-by-slug, safe re-run), slug `vendor-circle`. Frontend hides it from non-vendors in `forum-home-view.tsx` (same pattern as Practitioners' Inner Circle). **Backend now also enforces it** — thread/post creation in this category 403s for non-VENDOR/non-ADMIN roles (`forum.service.ts`'s `createThread`/`createPost`), which Inner Circle itself has never had (found and left as a separate, pre-existing gap — see below).
- [x] Topics: sourcing advice, shipping tips, packaging sacred items, pricing guidance, cultural questions — category description covers this; actual discussion content is organic, not pre-seeded.
- [x] Pinned resources — no new mechanism needed; `ForumThread.isPinned` already exists, vendors/admins can pin threads directly.

**Mentorship matching:**
- [x] New vendors matched with an experienced vendor for a 30-day welcome period — `VendorMentorship` model (migration `20260725133721_add_vendor_mentorship_wellbeing_tiers`), `vendor-community` module: `GET /vendor-community/mentors/available` (status APPROVED, 60+ days tenure, <3 active mentees), `POST /vendor-community/mentorship/request`, `GET /vendor-community/mentorship/mine`, `PATCH /vendor-community/mentorship/:id/complete`.
- [x] Experienced vendor gets "Community Mentor" badge — computed live in `getUserBadges()` (🧑‍🏫, `mentorshipsAsMentor.length > 0`), same pattern as every other badge on the platform.
- [x] "One message introducing them, open channel" — Messaging is paused platform-wide (see `CLAUDE.md`), so this is a `Notification` to both parties instead (mentor notified on request, mentee notified on completion), not a live chat channel. Vendors coordinate further via the Vendor Circle forum, linked directly from the mentorship panel.

**Why:** A new vendor from the diaspora who is selling Yoruba items may not know the protocols around certain items (what requires elder blessing, what cannot be sold at all, etc.). A peer community prevents mistakes before they happen.

**Files:** `backend/prisma/seed-forum-categories.ts` (Vendor Circle entry), `backend/src/vendor-community/*` (service/controller/module/dto), `frontend/src/features/marketplace/vendor-dashboard/vendor-community-panel.tsx` (new "Community" tab in the vendor dashboard), `frontend/src/features/forum/forum-home-view.tsx` (category visibility filter).

**Built as an enabler for `SHOP_BACKLOG.md`'s MSP-018 (which explicitly depends on this) and MSP-016 (shares the mentorship-credit mechanism)** — all three were built together in one pass since MSP-018 was genuinely blocked without this.

**Discovered while building this**: the "visible only to approved vendors" framing this item shares with Practitioners' Inner Circle turned out to only be half-true for Inner Circle — that category is frontend-hidden but has **no backend enforcement at all** (any authenticated user can post there via a direct API call; `restrictedCategories` in `forum.service.ts` only gates a cultural-orientation check, not role). Vendor Circle, built here, does not inherit that gap — it has a real role check. Inner Circle's gap is pre-existing and out of scope for this item, but worth a follow-up.

---

## 🟢 Sprint 6 — Marketing & Visibility (20 SP)

### VND-020 · Discount & Promotion System (8 SP)
**Run promotions without admin involvement.**

**Promotion types:**
- **Discount code** — Percentage or fixed amount off. Set: code string, discount type, value, max uses, expiry, eligible products (all or specific)
- **Flash sale** — Set a discounted price on a product for a fixed duration. Auto-reverts after.
- **Volume discount** — Buy 2+ get X% off
- **Bundle deal** — Buy product A + B = X% off
- **Welcome discount** — Automatically apply a discount for first-time buyers from this vendor

**Promotion dashboard:**
- Active promotions and their performance (uses, revenue impact)
- Expired promotions history
- Create / pause / end promotions

**Why:** Vendors need to be able to run their own promotions for festivals, personal milestones, or slow periods. Right now there's no mechanism at all.

**Files:** New `VendorPromoCode` model (separate from admin promos), extend checkout flow, `vendor-promotions-tab.tsx`.

**Status: ✅ DONE (2026-07-26)**

**All 5 promotion types built** on one flexible `VendorPromotion` model (typed discriminator + nullable type-specific fields — same pattern already used for `Dispute`/`SacredCalendarEvent` in this schema, not 5 separate tables):
- [x] Discount code — percentage or fixed off, max uses, expiry, eligible products (empty = all)
- [x] Flash sale — a time-boxed discount on one product, auto-reverts because it's a live eligibility check (`startsAt`/`expiresAt`) against the promotion row, not a cron job that has to remember to undo a real price change
- [x] Volume discount — buy N+ (of one product, or vendor-wide) get X% off
- [x] Bundle deal — buy product A + B, get X% off both — distinct from `ProductBundle` (VND-015): this is a same-vendor discount *rule* triggered by cart contents, not a curated cross-vendor kit with its own listing page
- [x] Welcome discount — auto-applied when the customer has zero prior PAID/SHIPPED/DELIVERED/COMPLETED orders with this vendor, no code needed

**Deliberate scoping decision — at most one promotion per order, not a stacking-rules engine.** If a customer supplies an explicit code, it's used exclusively (an invalid/expired/exhausted code fails the order rather than silently charging full price). Otherwise the best-value automatically-eligible promotion (flash sale / volume / bundle / welcome) is applied. This keeps the calculation single-pass and avoids the combinatorial edge cases (and vendor confusion) of "which promotions combine with which."

**Checkout integration (not just a dashboard toy):**
- [x] `createOrder` applies the discount to the item subtotal before shipping/VAT, atomically increments `usedCount` inside the same transaction as the stock decrements (same EMG-06 conditional-atomic pattern — two concurrent orders can't both claim the last use of a capped promotion), and records a `VendorPromotionRedemption` row
- [x] `previewPromotion` — a preview endpoint the checkout UI calls before payment, built by calling the *exact same* `calculateBestPromotion()` the real order uses, so the "-₦X" shown at checkout can never diverge from what's actually charged
- [x] `checkout-view.tsx` — per-vendor promo code input + live discount preview + a "Discount" line in the order summary, total math updated to match the backend's order of operations (subtotal → minus discount → plus shipping → VAT)

**Promotion dashboard:**
- [x] Active/expired/all filter, per-promotion uses (`X/maxUses`) and total discount given (summed from real `VendorPromotionRedemption` rows, not an estimate)
- [x] Create / pause (`isActive` toggle, resumable) / end (permanent — also stamps `expiresAt` so a forgotten paused-then-resumed promo can't silently outlive its intended end date)
- Promotions are never deleted, only ended — redemption history must stay attributable to a real row (same posture as every other "preserve history" decision this session)

**Files:** `VendorPromotion` + `VendorPromotionRedemption` models + migration `20260727010000_add_vendor_promotions`, `dto/vendor-promotion.dto.ts`, 8 new `marketplace.service.ts` methods (create/list/update/end/preview + the private `calculateBestPromotion` + `createOrder` extended), 6 new controller endpoints, new `vendor-promotions-tab.tsx`, `checkout-view.tsx` extended.

**Tests:** 18 new backend unit tests (creation validation per type incl. the duplicate-code and BUNDLE_DEAL-same-product-twice guards, explicit-code application/rejection, WELCOME_DISCOUNT first-time-vs-returning, best-of-multiple-automatic-promotions selection, the race-condition usage-cap rejection) — full backend suite now at 846 passing. Frontend: `tsc --noEmit`, `npm run build`, and the existing cart/checkout Vitest suites all clean/passing.

---

### VND-021 · Social Sharing & Marketing Tools (5 SP)
**Help vendors bring their audience to the platform.**

**Shareable links:**
- Each product has a clean shareable URL: `iluase.com/marketplace/[product-slug]`
- Each vendor storefront has: `iluase.com/shop/[vendor-slug]`
- Copy link button on all product pages

**Social media assets:**
- One-click "Create social post" — generates a formatted image of the product (name, price, vendor name, platform logo) sized for Instagram / WhatsApp / Twitter
- Share directly or download

**Referral tracking:**
- Vendor gets a referral code: any purchase made using their referral link gives them a small % credit
- Useful for vendors who promote the platform on social media and bring customers

**Why:** Most of your vendors will have existing social media followings. Making it easy to share their Ìlú Àṣẹ products on Instagram or WhatsApp drives traffic and sign-ups.

**Files:** Product slug field, vendor slug, social card generator (canvas-based), `vendor-marketing-tab.tsx`.

**Status: ✅ DONE (2026-07-26)**

**Shareable links:**
- [x] **Found a real, silent gap while building this**: `Vendor.slug` has existed since VND-023, and `findVendorByUserId` (backing the storefront page) already resolved it correctly — but the *shared* `/public/resolve/:slug` endpoint (what the generic `iluase.com/[slug]` catch-all route calls to figure out what kind of profile it's looking at) only ever checked `User` and `Temple`, never `Vendor`. A vendor's own shareable slug link either 404'd or silently mis-rendered depending on the slug's collision state, despite the slug itself working fine everywhere else. Fixed: `resolveSlug` now also checks `Vendor`, and the frontend dispatcher (`BabalawoLandingPage.tsx` — the generic resolver despite its name) redirects `type: 'vendor'` to the storefront.
- [x] Product page: already had a clean, permanent URL (`/marketplace/:productId`) — no separate slug field added for products; a slug would only add a second identifier to keep in sync for no discoverability benefit product IDs don't already have as a share target.
- [x] Copy Link button — added to product detail pages and the vendor storefront page (using the vendor's own slug-or-userId, matching how `findVendorByUserId` actually resolves — not `Vendor.id`, which that lookup never checks).

**Social media assets:**
- [x] One-click "Create Social Post" — canvas-based (`social-share-card.ts`), no server round trip or image-generation service to run. Renders product name, price, vendor name, and platform branding into a 1080×1080 image (works across Instagram/WhatsApp/Twitter without needing three separate crops). Share via the native Web Share API when the device supports sharing image files (hands off straight to the platform's own share sheet), falling back to direct download on desktop.

**Referral tracking — reused, not duplicated:**
- [x] Every vendor already has a referral code and link via the existing generic `Referral` model + `/users/referral-stats` endpoint (built for EXP-027, works for any `User`, vendors included) — surfaced in a new "Marketing" vendor dashboard tab by reusing `ReferralPanel` as-is.
- **Not built — a real scope gap, documented rather than silently skipped**: the spec's "any purchase made using their link gives them a small % credit" is a fundamentally different reward model than what `Referral` implements. The existing model grants a single flat one-time reward (₦500) on the referred user's first action; an ongoing percentage-of-every-marketplace-purchase commission would need new attribution tracking (which purchases, indefinitely, trace back to which referral) and new money-movement code — comparable in scope to VND-020's promotion system, and disproportionate to add as a sub-bullet here. Vendors get the same referral tool every other user has today; a genuine "referral commission on marketplace sales" would be its own backlog item.

**Files:** `resolveSlug` (`public-profile.controller.ts`), `BabalawoLandingPage.tsx` (vendor redirect branch), `social-share-card.ts` (canvas generator), `social-share-button.tsx` (new, used on `product-detail-view.tsx`), `VendorStorefrontPage.tsx` (copy-link button), new `vendor-marketing-tab.tsx` (reuses `ReferralPanel`).

**Also fixed while touching the vendor dashboard's tab bar:** `sm:grid-cols-13` through `sm:grid-cols-17` aren't in Tailwind's default scale (generated only up to 12) and were silently producing no CSS as more tabs were added across this session's items — the tab bar had been falling back to the 2-column mobile grid on desktop too. Switched to the arbitrary-value syntax (`grid-cols-[repeat(17,minmax(0,1fr))]`) so it actually renders as one row.

**Tests:** 4 new backend unit tests for the `resolveSlug` vendor branch (plus the pre-existing user/temple/not-found cases, now covered too since no spec file existed for this controller before). Full backend suite now at 850 passing. Frontend: `tsc --noEmit` and `npm run build` both clean.

---

### VND-022 · Review & Reputation Management (4 SP)
**Actively manage your reputation on the platform.**

**Status: ✅ DONE (July 26, 2026)**

**Review dashboard:**
- [x] All reviews across all products in one view — new "Reviews" vendor dashboard tab, `GET /reviews/vendors/:vendorId`
- [x] Average rating per product — already existed at the single-product level (`getProductRatingStats`) but there was no vendor-wide, all-products-at-once view; this is the genuinely new part
- [x] Rating breakdown: 5★ / 4★ / 3★ / 2★ / 1★ count — same distribution logic `getProductRatingStats` already used per-product, now also aggregated across the whole vendor
- [x] Trend: is my average rating going up or down over time? — rule-based, not a fabricated/ML score: last-30-days average vs. the 30 days before that, labeled up/down/flat/insufficient_data. Same "no black-box" principle as VND-023's completeness ranking.

**Review responses:**
- [x] Vendor can publicly respond to any review (one response per review) — `ProductReview.vendorResponse`/`vendorRespondedAt`, `PATCH /reviews/products/:reviewId/respond`. "One response" is enforced as immutable once set (a second call is rejected, not a silent overwrite) — matches the backlog's literal framing, not "latest response wins."
- [x] Response shown below the review in the marketplace — added to the reviews section of the product detail page.
- [x] Admin can remove inappropriate reviews — **already fully built** (`moderateProductReview`, admin-only); nothing to do here.

**Review requests:**
- [x] 7 days after order delivered → auto-send "Please leave a review" notification to customer — new `ReviewRequestNudgeService`, daily cron, same dedupe-via-cron pattern as `appointments/rebooking-nudge.service.ts` and `marketplace/seasonal-event-reminder.service.ts`, except the guard is a dedicated `Order.reviewRequestSentAt` column (shared with the manual trigger below) rather than scanning notification history.
- [x] Vendor can trigger manual review request per order (once only) — `POST /reviews/orders/:orderId/request`, "Request a Review" button on delivered orders in the vendor order detail panel. Shares `reviewRequestSentAt` with the automatic path, so triggering one manually also prevents the automatic nudge from re-sending later for the same order, and vice versa.

**Why:** Reviews are the most powerful sales tool a vendor has. But right now there's no way to respond to reviews, see them all in one place, or understand trends.

**Files:** `backend/prisma/schema.prisma` (`ProductReview.vendorResponse`/`vendorRespondedAt`, `Order.reviewRequestSentAt`, migration `20260726160500_add_review_response_and_order_review_request`), `backend/src/reviews/dto/respond-to-review.dto.ts` (new), `backend/src/reviews/reviews.service.ts` (`respondToReview`/`getVendorReviews`/`requestReviewForOrder`), `backend/src/reviews/reviews.controller.ts`, `backend/src/reviews/review-request-nudge.service.ts` (new cron), `backend/src/reviews/reviews.module.ts`, `frontend/src/features/marketplace/vendor-dashboard/reviews-management.tsx` (new "Reviews" tab), `frontend/src/features/marketplace/vendor-order-detail-panel.tsx` (manual request button), `frontend/src/features/marketplace/product-detail-view.tsx` (vendor response display). 21 new backend unit tests.

---

### VND-023 · Marketplace SEO & Discovery (3 SP)
**Help customers find vendor products more easily.**

**Status: ✅ DONE (July 26, 2026)**

**Per product:**
- [x] Custom SEO title and meta description (for when product links are shared externally) — `Product.seoTitle`/`seoDescription`, editable in the vendor product form's new "SEO & Discovery" section. Not yet rendered into actual `<meta>`/OpenGraph tags on the product detail page (this app doesn't server-render product pages, so there's no request-time HTML to inject them into) — stored and editable now, wiring into real meta tags is follow-up work once/if SSR or per-route meta injection exists.
- [x] Tags (up to 10, searchable within platform) — `Product.tags String[]`, capped at 10 client- and server-side (`@ArrayMaxSize(10)`), matched as an additional `OR` clause in `findAllProducts`'s search (exact tag match, not substring — Prisma has no ILIKE-on-array-element support without raw SQL, and tags are short exact keywords by design).
- [x] "Related products" suggestions (admin-curated or auto-suggested) — **already covered by existing functionality, not rebuilt**: `getSimilarCategoryVendors` (SHOP_BACKLOG.md MSP-004) already renders a "More vendors in {category}" section on every product detail page, auto-suggested from the same category. A second, near-duplicate "related products" grid would be redundant.

**Vendor storefront:**
- [x] Custom storefront URL slug (e.g. `iluase.com/vendors/oshun-beads-by-adunola`) — `Vendor.slug` (unique, nullable), editable from the Storefront dashboard tab. `MarketplaceService.findVendorByUserId` (the storefront page's data source) now tries a userId match first, then falls back to a slug match, so the same `/vendors/:identifier` route works for both a vendor who has set a slug and one who hasn't — no route or existing-link changes needed.
- [x] Storefront description optimised for platform search — no new field; the existing `description` (VND-016) is the vendor's storefront-search-facing text already.

**Discovery boosts:**
- [x] Products with complete listings (image, description, Yoruba name, provenance) ranked higher in search — completeness is a rule-based tiebreaker inserted *within* the existing authenticity-tier ranking (`VERIFIED_TIER_RANK`), not above it — a sparser but culturally-vetted listing still outranks a fuller but unverified one. Same "no black-box ranking" principle already established for tier ranking.
- [x] "Completeness score" shown to vendor with tips: "Add a Yoruba name to improve visibility" — `GET /marketplace/vendors/:id/completeness`, surfaced as a "Listing Completeness" card on the Storefront dashboard tab, one row per product with its missing-field tips.

**Also discovered and fixed while building this:** `VendorDirectoryPage.tsx` (flagged as a gap during VND-016) was 100% hardcoded mock data with a "View Profile" button pointing at a fake userId. Now wired to real `GET /marketplace/vendors?status=APPROVED` data and links to the real storefront page built in VND-016.

**Why:** On a platform growing organically through community and social sharing, discoverability matters. A product with a full, culturally rich listing will perform better than a sparse one.

**Files:** `backend/prisma/schema.prisma` (`Product.seoTitle`/`seoDescription`/`tags`, `Vendor.slug`, migration `20260726154500_add_product_seo_tags_vendor_slug`), `backend/src/marketplace/dto/create-product.dto.ts`/`update-product.dto.ts`/`update-vendor.dto.ts`, `backend/src/marketplace/marketplace.service.ts` (`findAllProducts` tag search + completeness tiebreaker, `computeCompletenessScore`/`getProductCompletenessScores`, `findVendorByUserId` slug fallback, `updateVendor` slug conflict handling), `backend/src/marketplace/marketplace.controller.ts` (`GET /marketplace/vendors/:id/completeness`), `frontend/src/features/marketplace/vendor-product-form.tsx` (tags/SEO fields), `frontend/src/features/marketplace/vendor-dashboard/storefront-management.tsx` (slug editor, completeness tips card), `frontend/src/pages/VendorDirectoryPage.tsx` (rewired to real data). 9 new backend unit tests.

---

## 🟢 Sprint 7 — Advanced & Compliance (16 SP)

### VND-024 · Digital Product Delivery (6 SP)
**Sell digital sacred goods — guides, audio, PDFs.**

**Product type: DIGITAL**
- Upload digital file (PDF, MP3, MP4, ZIP — up to 500MB)
- Or link to external hosted file (Google Drive, Dropbox)
- After purchase → customer gets download link (valid 30 days, max 5 downloads)
- No shipping required — instant delivery

**Digital product types on the platform:**
- Odu study guides (PDF)
- Recorded elder teachings (MP3/MP4)
- Prayer and ritual guides (PDF)
- Digital altar setups (printable PDF)
- Certification course materials (PDF bundle)

**Why:** Digital products have no inventory, no shipping, and near-100% margin. They are the highest-leverage product type for a solo artisan or practitioner-vendor. This removes a significant barrier to entry.

**Files:** Extend Product with digital delivery fields, file storage (S3/CDN), secure download link generation.

**Status: ✅ DONE (2026-07-26)**

**Discovered while building this -- a complete, silent gap: `type: DIGITAL` was purely a label with nothing behind it.** `Product.type` has supported `'DIGITAL'` since early in the platform's life (used to skip stock checks in `createOrder`), but there was no file, no download link, no delivery mechanism of any kind -- and, worse, **the vendor product form never let a vendor pick a product type at all**, so every listing silently defaulted to `PHYSICAL` server-side regardless of intent. A vendor could not have created a sellable digital product through the UI before this item, no matter how this backlog item was scoped.

**Fixed, reusing existing platform infrastructure rather than building a second file pipeline:**
- [x] Product Type selector added to `vendor-product-form.tsx` (previously entirely absent) -- Physical/Digital, hides stock/Made-to-Order fields for Digital
- [x] Upload digital file (PDF/MP3/MP4/ZIP, up to 500MB) -- reuses the existing `S3Service`, `VirusScanService`, and `FileUploadSecurityService` (all already built for the Documents module, just newly wired into Marketplace) rather than standing up separate storage/scanning infrastructure
- [x] Or link to an externally hosted file (Google Drive/Dropbox) -- no upload pipeline needed for this path, per the spec's own explicit allowance
- [x] Customer gets a download link, valid 30 days, max 5 downloads -- `DigitalProductDownload` grants one per (order, product) pair; every "download" mints a **fresh** time-limited S3 signed URL on demand rather than emailing/storing a raw one, so a leaked link expires on its own regardless of the grant's 30-day/5-download budget
- [x] No shipping required — instant delivery -- download grants are created the moment an order is marked PAID (in `PaymentsService.processMarketplaceOrderPayment`), not gated on any vendor action

**Also fixed -- a second latent bug this uncovered:** the existing escrow-release machinery (VND-010's investigation) is entirely keyed to SHIPPED/DELIVERED status transitions, meant for physical fulfillment. A pure-digital order would have sat in `PAID` with its escrow stuck in `HOLD` forever -- nothing would ever call the status-transition path that releases it, since "mark as shipped" makes no sense for a PDF. Fixed: an order where every item is DIGITAL is now marked `DELIVERED` and has its escrow released in full immediately at payment time, matching "instant delivery." A mixed physical+digital order is left on the normal shipping-gated path (the digital items still get their download grants immediately; the order overall isn't force-completed while a physical item still needs to ship).

**New customer-facing surface:** `/my-downloads` (linked from `/my-orders`) — nothing surfaced a customer's digital purchases anywhere before this either.

**Files:** `Product` digital fields + `DigitalProductDownload` model + migration `20260727020000_add_digital_delivery`, `marketplace.service.ts` (5 new methods), `payments.service.ts` (`processMarketplaceOrderPayment` extended), 4 new controller endpoints, `vendor-product-form.tsx` (Product Type selector + new `ProductDigitalFileEditor`), new `my-downloads-view.tsx`.

**Tests:** 15 new backend unit tests (upload validation/virus-scan/ownership, signed-URL minting for both S3 and external-link products, expiry/usage-limit/ownership rejections, the all-digital-vs-mixed-order escrow/delivery fast-track distinction) — full backend suite now at 861 passing. Frontend: `tsc --noEmit` and `npm run build` both clean.

---

### VND-025 · Wholesale & B2B Sales (5 SP)
**Sell in bulk to temples, circles, and practitioners.**

**Wholesale mode:**
- Vendor enables wholesale for specific products
- Sets minimum order quantity (e.g. 10 units minimum)
- Sets wholesale price (shown only to verified BABALAWO or ADMIN accounts)
- Bulk order form (different from standard checkout)

**Temple purchasing:**
- Temples can make purchases on behalf of their community
- Temple admin places order, payment from temple wallet
- Delivery to temple address

**Why:** A Babalawo preparing for a community Itefa ceremony needs to buy 20 sets of initiation beads. Right now they'd have to place 20 separate orders or contact the vendor outside the platform. Wholesale keeps the transaction on-platform and earns the platform its commission.

**Files:** Extend Product and Order models with wholesale fields, new wholesale checkout flow.

**Status: 🟡 PARTIALLY DONE (2026-07-26) — wholesale mode built, temple purchasing scoped out**

**Wholesale mode — built:**
- [x] Vendor enables wholesale for specific products — `Product.wholesaleEnabled`/`wholesaleMinQuantity`/`wholesalePrice`, editable from `vendor-product-form.tsx`
- [x] Minimum order quantity — enforced both client-side (bulk order form) and server-side (`createOrder` only applies wholesale pricing at or above the threshold)
- [x] Wholesale price shown only to verified BABALAWO or ADMIN accounts — the public product endpoints (`findProductById`, `findAllProducts`) strip `wholesalePrice` from every response unconditionally (they're `@Public()` routes with no `currentUser` to gate on); a separate authenticated `getWholesalePrice()` lookup is the only path that ever returns the real number, and it 403s for anyone who isn't BABALAWO/ADMIN
- [x] Bulk order form (different from standard checkout) — new single-product `/bulk-order/:productId` page (quantity + shipping address, no cart/multi-vendor grouping), linked from the product page for eligible viewers. Pricing is enforced by the same `createOrder` path every other purchase uses — quantity ≥ minimum + buyer role automatically triggers the wholesale price, no separate order-creation code to keep in sync

**Temple purchasing — not built, confirmed genuinely unbuildable as specified, not deferred:** "payment from temple wallet" requires a temple-level financial primitive that does not exist anywhere in this schema — `Temple` has no `wallet`/`balance` field, and no such concept exists in any form (checked while scoping this item). Building it would mean designing a new shared-custody wallet model (who can spend it, how it's funded, audit trail for community funds) — a project of its own, not a sub-bullet of this one. `Temple` administration/membership already exists; only the money-holding piece is missing. If this is wanted, it should be scoped as its own backlog item once there's a design for who controls a temple's shared funds.

**Files:** `Product` wholesale fields (same migration as VND-024's digital fields — `20260727030000_add_wholesale_fields`), `dto/update-product.dto.ts`, `marketplace.service.ts` (`getWholesalePrice`, `createOrder` extended, public-response stripping in `findProductById`/`findAllProducts`), 1 new controller endpoint, `vendor-product-form.tsx` (wholesale fields), `product-detail-view.tsx` (eligibility banner), new `bulk-order-view.tsx`.

**Tests:** 8 new backend unit tests (public-response stripping for both single and list endpoints, `getWholesalePrice` role-gating, `createOrder` wholesale pricing applied/not-applied across quantity and role combinations) — full backend suite now at 869 passing. Frontend: `tsc --noEmit` and `npm run build` both clean.

---

### VND-026 · Vendor Performance Tiers (5 SP)
**Create a visible achievement system that rewards quality vendors.**

**Tiers:**
| Tier | Requirements | Benefits |
|------|-------------|----------|
| 🌱 New Vendor | Just approved | Standard listing |
| ⭐ Established | 10+ sales, 4.0+ rating, 3+ months | "Established" badge, priority in search |
| 🌟 Trusted Vendor | 50+ sales, 4.5+ rating, 6+ months, <2% return rate | "Trusted" badge, featured section eligibility |
| 🔮 Sacred Artisan | 100+ sales, 4.8+ rating, Elder Endorsed | "Sacred Artisan" badge, homepage feature eligibility, reduced commission |

**Tier benefits (admin-managed):**
- Commission reduction for top tier (e.g. Sacred Artisans pay 8% instead of 12%)
- Reduced/waived withdrawal fees
- Priority customer support
- Eligibility for homepage features and platform marketing

**Vendor dashboard shows:**
- Current tier + badge
- Progress to next tier (e.g. "You need 12 more sales and 6 more weeks to reach Trusted Vendor")

**Why:** Gamification that rewards genuine quality creates a self-reinforcing loop: better vendors get more visibility → more sales → higher tier → even more visibility. It also gives you leverage — vendors strive to reach Sacred Artisan because the commission reduction matters.

**Files:** Add `vendorTier` field to Vendor, tier calculation service (runs nightly), extend dashboard display.

**Status: 🟡 PARTIALLY DONE (2026-07-26) — tiers built and real; commission/fee benefits scoped out**

**Tiers — all four built, rule-based against real metrics (not a fabricated score):**
- [x] 🌱 New Vendor / ⭐ Established (10+ sales, 4.0+ rating, 3+ months) / 🌟 Trusted Vendor (50+ sales, 4.5+ rating, 6+ months, <2% return rate) / 🔮 Sacred Artisan (100+ sales, 4.8+ rating, Elder Endorsed) — exactly the spec's table, evaluated top-down against `Vendor.performanceTier`, recomputed nightly by a new `VendorPerformanceTierService` cron (same recurring-job shape as `low-stock-alert.service.ts`)
- [x] "Elder Endorsed" for Sacred Artisan — reuses the existing `Vendor.apprenticeshipTier === 'ELDER_APPROVED'` value rather than inventing a second endorsement flag; that field is already admin/elder-advanced only and never automatic, matching the spiritual weight "Elder Endorsed" implies
- [x] "Established" badge + priority in search — added as a new tiebreaker in `findAllProducts`'s existing rule-based sort, explicitly ranked *below* cultural authenticity tier and listing completeness (a vendor's commercial track record breaks ties among equally-verified, equally-complete listings; it never outranks cultural verification itself)
- [x] "Trusted Vendor" featured-section eligibility / "Sacred Artisan" homepage eligibility — both tiers are exposed via the same `performanceTier` field the existing `isFeatured`/`featuredOrder` admin-managed featuring mechanism (ADM-007) already reads from; no new featuring pipeline needed, admins can use tier as a qualifying signal with the tools already in place

**Tier benefits (admin-managed) — commission/fee reduction not built, confirmed genuinely unbuildable as specified:** "Sacred Artisans pay 8% instead of 12%" and "reduced/waived withdrawal fees" both require a real commission-deduction mechanism to reduce. None exists: `PlatformSettings.marketplaceCommissionPct` is configured in the admin settings UI (ADM-014) but is never actually deducted from any real order/escrow/payout flow anywhere in the money-movement code (confirmed while investigating VND-001's and VND-010's escrow fixes this session — vendors currently receive the full order amount, always). A tier-based commission *reduction* on top of a commission that isn't charged in the first place isn't a smaller version of this feature, it's a precondition for it — implementing real commission deduction (and then a tiered discount on it) is its own project, not a sub-bullet here. "Priority customer support" and "eligibility for homepage features/platform marketing" are operational/admin-process benefits, not code — the tier data admins would use for those decisions is now real and available (`GET /marketplace/vendors/:id/performance-tier`).

**Vendor dashboard shows:**
- [x] Current tier + badge — new `VendorPerformanceTierPanel`, added to the existing Insights tab (co-located with VND-014's scorecard, both being "how is my vendor account doing" panels)
- [x] Progress to next tier — computed from the real gap between current metrics and the next tier's actual requirements (e.g. "12 more sales", "about 6 more weeks as a verified vendor"), not an estimate
- [x] Public badge — shown on the product detail page and the vendor storefront page for any tier above New Vendor

**Files:** `Vendor.performanceTier`/`performanceTierUpdatedAt` + migration `20260727040000_add_vendor_performance_tier`, `marketplace.service.ts` (5 new methods/constants), new `vendor-performance-tier.service.ts` (nightly cron), 1 new controller endpoint, new `vendor-performance-tier-panel.tsx`, `product-detail-view.tsx` + `VendorStorefrontPage.tsx` (public badges), `findAllProducts` sort extended.

**Tests:** 7 new backend unit tests (tier computation across all four tiers including the Elder-Endorsement gate and the age-vs-sales-vs-rating interaction, next-tier-progress gap messages, persisted recalculation) — full backend suite now at 876 passing. Frontend: `tsc --noEmit` and `npm run build` both clean.

---

## Implementation Order

| Sprint | Focus | SP | Impact |
|--------|-------|----|--------|
| Sprint 1 | Earnings & Money Clarity (VND-001 to 004) | 32 | 🔴 Immediate |
| Sprint 2 | Inventory & Products (VND-005 to 008) | 28 | 🟡 Week 2 |
| Sprint 3 | Orders & Fulfilment (VND-009 to 012) | 24 | 🟡 Week 3 |
| Sprint 4 | Analytics & Growth (VND-013 to 016) | 20 | 🟡 Month 2 |
| Sprint 5 | Cultural Integrity (VND-017 to 019) | 16 | ✅ DONE (all 3 stories built) |
| Sprint 6 | Marketing & Visibility (VND-020 to 023) | 20 | 🟢 Month 3 |
| Sprint 7 | Advanced & Compliance (VND-024 to 026) | 16 | 🟢 Month 4 |

**Total: 156 SP across 26 stories**

---

## What Makes a Vendor Choose Ìlú Àṣẹ Over Etsy or Instagram

This is the strategic question. Right now a sacred goods vendor can sell on:
- **Etsy** — large audience, no cultural context, no community, high fees
- **Instagram** — free, large reach, no commerce infrastructure, no trust
- **WhatsApp** — direct to community, no discovery, payment is informal

**Ìlú Àṣẹ's unique value proposition for vendors:**

1. **The community is pre-qualified** — customers are already seekers of authentic Isese goods. No explaining what Oya beads are.

2. **Cultural certification** — the Elder Endorsed badge means something here. It means nothing on Etsy.

3. **Integrated ecosystem** — a vendor's products appear in their profile, in consultations a Babalawo recommends them, in circles where community members discuss them. The goods are embedded in the practice, not separate from it.

4. **Festival-aware commerce** — only Ìlú Àṣẹ knows that demand for white cloth spikes before Isese Day.

5. **Sacred goods, sacred handling** — we don't allow counterfeit items, Akose for sale, or culturally inappropriate listings. Buyers trust this. Serious vendors want this.

**The pitch to vendors:**
> "Your customers are already here. Your products belong here. Sell in the marketplace where the community lives."

---

*"Ohun tó dára kì í tètè wọ ojà kó wọ màlúù"*
*Good things do not enter the market and go unnoticed.*

Build the vendor tools that make serious sacred artisans choose this platform and stay.
