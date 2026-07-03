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

---

### VND-002 · Payout Management & Tracking (8 SP)
**Full visibility into withdrawal requests and their status.**

**What's missing today:** Vendors can *create* a withdrawal request but have no way to track what happens to it. It disappears into the void.

**Payout dashboard shows:**
- Available balance (ready to withdraw)
- Pending withdrawal (submitted, awaiting admin approval)
- Processed payouts history (date, amount, bank, status)
- Minimum payout threshold clearly displayed (currently platform-configured)

**Withdrawal flow improvements:**
- Bank account management (save up to 3 bank accounts, set default)
- Withdrawal request with pre-filled saved bank details
- Status tracker: Submitted → Under Review → Approved → Paid → Confirmed
- Push/email notification when status changes at each stage
- Estimated processing time shown ("Usually 2-3 business days")

**Why:** Right now a vendor submits a withdrawal and has no idea what's happening. This creates anxiety and support requests. Transparency = trust.

**Files:** `vendor-payouts-view.tsx`, `BankAccount` model (save vendor bank details), extend wallet controller.

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

---

### VND-004 · Real-Time Sales Notifications (6 SP)
**Know the moment a sale happens.**

**Notification triggers:**
- New order placed → push notification + in-app + WhatsApp (WhatsApp already exists — ensure it works)
- Order payment confirmed → push notification
- Order dispute raised → urgent push + email
- Low stock alert (stock < configurable threshold) → daily digest or immediate
- Review received → in-app notification
- Withdrawal approved → push + email

**Notification settings page:**
- Vendor can toggle each notification type on/off
- Choose: push only / email only / both
- Set low stock threshold per product or globally

**Why:** A vendor who misses an order because they didn't check the app loses a customer. Real-time awareness is the difference between a hobbyist and a professional seller.

**Files:** Extend existing notification service, `vendor-notification-settings.tsx`.

---

## 🟡 Sprint 2 — Inventory & Product Management (28 SP)

### VND-005 · Inventory Management Centre (8 SP)
**See and manage all stock in one place.**

**Inventory view:**
- All products with: name, category, price, stock level, status (Active/Draft/Out of Stock), last updated, total sold
- Status badges: 🟢 In Stock / 🟡 Low Stock (< threshold) / 🔴 Out of Stock
- Sort by: stock level, sales, price, date added
- Filter by: category, status, low stock flag

**Stock management:**
- Edit stock level directly from inventory list (inline edit)
- Bulk restock: select multiple products, add quantity
- Set per-product low stock threshold (e.g. alert when < 5)
- Mark as "Made to Order" (infinite stock, longer processing time shown to customer)

**Inventory history:**
- Log of stock changes: who changed it, when, from what to what
- Useful for reconciling physical stock against platform records

**Why:** Right now vendors edit stock one product at a time, inside the product form. For a vendor with 20+ products this is not workable.

**Files:** New `admin-inventory-tab.tsx` within vendor dashboard, extend product service.

---

### VND-006 · Bulk Product Operations (6 SP)
**Manage multiple products at once.**

**Bulk actions:**
- Select multiple products → set status (Active/Draft)
- Select multiple → update price (% increase/decrease or fixed new price)
- Select multiple → update category
- Select multiple → delete (with confirmation)
- **CSV import:** Upload a CSV to create/update multiple products at once (template provided)
- **CSV export:** Download all products as CSV for offline editing

**Why:** A vendor with a full catalogue cannot manage products one by one. A market vendor who sells 50 types of beads needs to be able to upload them all at once. This is a barrier to onboarding serious vendors.

**Files:** Extend `VendorProductListView`, add CSV parse/generate utility, extend product controller with bulk endpoints.

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

---

### VND-008 · Draft & Scheduling (6 SP)
**Prepare products before they go live.**

**Draft mode:**
- Save a product as Draft (not visible to customers)
- Edit, preview exactly as customers would see it
- Publish when ready (single click)

**Scheduled listing:**
- Set a "Goes live" date/time for a product
- Useful for: limited edition releases, festival-specific items, coordinated launches
- Product shows as "Coming Soon" on marketplace if vendor enables it

**Pre-order mode:**
- Enable pre-orders (product shown as "Pre-Order" with expected delivery date)
- Stock treated as pre-order slots (e.g. 20 pre-orders accepted)
- Auto-notifies customers when ready to ship

**Why:** A vendor launching a new line of consecrated items for Osun Grove Festival wants to build anticipation, not just suddenly appear. Scheduling and pre-orders are standard e-commerce tools that signal professional operations.

**Files:** Add `status: DRAFT | ACTIVE | SCHEDULED | ARCHIVED`, `scheduledAt` field to Product. Cron job to activate scheduled products.

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

---

### VND-011 · Shipping Management (6 SP)
**Give vendors tools to handle physical delivery professionally.**

**Shipping settings (per vendor):**
- Countries shipped to (select list)
- Shipping rates: Free / Flat rate / Weight-based / By region
- Processing time (1-2 days / 3-5 days / 1-2 weeks / Made to Order)
- Combined shipping discount (order 2+ items, save X%)

**Per-order shipping:**
- Auto-calculate shipping cost at checkout based on vendor settings + customer location
- Vendor updates tracking: carrier (DHL / Royal Mail / FedEx / UPS / Local / Other), tracking number, tracking URL
- Customer receives auto-notification with tracking details

**Shipping presets:**
- Save common shipping configurations as presets
- Apply preset to multiple products quickly

**Why:** Right now there is no shipping configuration. The platform has no way to calculate or display shipping costs to customers. This is a critical gap for physical goods vendors (which is most of them).

**Files:** New `ShippingZone` and `ShippingRate` models, extend product and checkout flow.

---

### VND-012 · Customer Communication Hub (4 SP)
**See all customer conversations in one place, not scattered through messages.**

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

---

### VND-016 · Vendor Storefront Customisation (3 SP)
**Give each vendor their own identity on the platform.**

**Storefront controls (within platform design language):**
- Vendor bio / about section (extended from current `description`)
- Featured products (pin up to 3 at top of storefront)
- Storefront banner image
- "About my practice" section (for practitioners who are also vendors — connect their Babalawo profile to their shop)
- Social proof: show total sales count, review count, member since date, response time

**Why:** Right now all vendor storefronts look identical. A vendor who has been on the platform for a year and has 200 sales should look visibly more established than a brand new vendor. Trust signals sell.

**Files:** Extend Vendor model, `VendorStorefrontPage.tsx`.

---

## 🟢 Sprint 5 — Cultural Integrity & Certification (16 SP)

### VND-017 · Cultural Authenticity Certification (8 SP)
**Give buyers confidence that what they're buying is genuine.**

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

**Per product:**
- Yoruba name (optional) — shown prominently if provided
- Yoruba description (optional) — shown as a second tab alongside English
- Pronunciation guide (text field)
- Traditional use context (separate from commercial description)
- Region of origin (e.g. Ọṣun State / Ogun State / Eko / Diaspora-made)

**Marketplace display:**
- Yoruba name shown first if present, English in brackets
- "Traditional Use" section on product detail (styled differently from commercial description)
- Region of origin badge on product card

**Why:** A vendor selling authentic Yoruba beads should be able to name them in Yoruba. This is part of the platform's cultural identity and helps distinguish authentic vendors from generic sellers.

**Files:** Extend Product model with Yoruba fields, update product form and product detail page.

---

### VND-019 · Vendor Community & Knowledge Sharing (4 SP)
**Help vendors learn from each other.**

**Vendor-only community space:**
- Dedicated forum category: "Vendor Circle" (visible only to approved vendors)
- Topics: sourcing advice, shipping tips, packaging sacred items, pricing guidance, cultural questions
- Pinned resources: platform policies, cultural guidelines, best practice guides

**Mentorship matching:**
- New vendors matched with an experienced vendor for a 30-day welcome period
- Experienced vendor gets "Community Mentor" badge
- Simple: one message introducing them, open channel

**Why:** A new vendor from the diaspora who is selling Yoruba items may not know the protocols around certain items (what requires elder blessing, what cannot be sold at all, etc.). A peer community prevents mistakes before they happen.

**Files:** New forum category (seeded), `vendor-community-tab.tsx`.

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

---

### VND-022 · Review & Reputation Management (4 SP)
**Actively manage your reputation on the platform.**

**Review dashboard:**
- All reviews across all products in one view
- Average rating per product
- Rating breakdown: 5★ / 4★ / 3★ / 2★ / 1★ count
- Trend: is my average rating going up or down over time?

**Review responses:**
- Vendor can publicly respond to any review (one response per review)
- Response shown below the review in the marketplace
- Admin can remove inappropriate reviews

**Review requests:**
- 7 days after order delivered → auto-send "Please leave a review" notification to customer
- Vendor can trigger manual review request per order (once only)

**Why:** Reviews are the most powerful sales tool a vendor has. But right now there's no way to respond to reviews, see them all in one place, or understand trends.

**Files:** Extend Review model with `vendorResponse` field, `vendor-reviews-tab.tsx`, extend notification service.

---

### VND-023 · Marketplace SEO & Discovery (3 SP)
**Help customers find vendor products more easily.**

**Per product:**
- Custom SEO title and meta description (for when product links are shared externally)
- Tags (up to 10, searchable within platform)
- "Related products" suggestions (admin-curated or auto-suggested)

**Vendor storefront:**
- Custom storefront URL slug (e.g. `iluase.com/shop/oshun-beads-by-adunola`)
- Storefront description optimised for platform search

**Discovery boosts:**
- Products with complete listings (image, description, Yoruba name, provenance) ranked higher in search
- "Completeness score" shown to vendor with tips: "Add a Yoruba name to improve visibility"

**Why:** On a platform growing organically through community and social sharing, discoverability matters. A product with a full, culturally rich listing will perform better than a sparse one.

**Files:** Add `seoTitle`, `seoDescription`, `tags` to Product, update search ranking algorithm.

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

---

## Implementation Order

| Sprint | Focus | SP | Impact |
|--------|-------|----|--------|
| Sprint 1 | Earnings & Money Clarity (VND-001 to 004) | 32 | 🔴 Immediate |
| Sprint 2 | Inventory & Products (VND-005 to 008) | 28 | 🟡 Week 2 |
| Sprint 3 | Orders & Fulfilment (VND-009 to 012) | 24 | 🟡 Week 3 |
| Sprint 4 | Analytics & Growth (VND-013 to 016) | 20 | 🟡 Month 2 |
| Sprint 5 | Cultural Integrity (VND-017 to 019) | 16 | 🟡 Month 2 |
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
