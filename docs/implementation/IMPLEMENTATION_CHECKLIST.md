# Ilé Àṣẹ - Implementation Checklist

## Overview
This checklist tracks all implementation tasks organized by priority and phase. Use this to track progress and ensure nothing is missed.

**Last Updated:** Based on ACTORS_AND_USER_FLOWS.md refinements  
**Status Legend:**
- ⬜ Not Started
- 🟡 In Progress
- ✅ Complete
- ⚠️ Blocked

---

## Phase 1: Critical Infrastructure (P0 - Launch Blockers)

### BLG-000: Temple System Implementation

#### Database & Backend
- [ ] ⬜ Create `Temple` model in Prisma schema
  - [ ] Fields: id, name, yorubaName, slug, description, history, mission
  - [ ] Location fields: address, city, state, country, coordinates
  - [ ] Visual: logo, bannerImage, images[]
  - [ ] Leadership: founderId, foundedYear
  - [ ] Status: status, verified, verifiedAt, verifiedBy
  - [ ] Cultural: lineage, tradition, specialties[]
  - [ ] Social: socialLinks (Json)
  - [ ] Stats: babalawoCount, clientCount
  - [ ] Relationships: babalawos (User[]), founder (User?)
- [ ] ⬜ Add `templeId` to User model (nullable)
- [ ] ⬜ Add `foundedTemple` relation to User model
- [ ] ⬜ Create migration file
- [ ] ⬜ Run migration
- [ ] ⬜ Backend: Create Temple module (controller, service, DTOs)
- [ ] ⬜ Backend: Temple CRUD operations
- [ ] ⬜ Backend: Temple verification workflow
  - [ ] Ilé Ifá: Advisory Board approval required
  - [ ] Branch: Admin + Master endorsement
  - [ ] Study Circle: Admin review
- [ ] ⬜ Backend: Babalawo-temple assignment logic
- [ ] ⬜ Backend: Temple creation restrictions (Master-tier only)
- [ ] ⬜ Backend: Temple endpoints
  - [ ] GET /temples (list with filters)
  - [ ] GET /temples/:id (detail)
  - [ ] GET /temples/:slug (by slug)
  - [ ] GET /temples/:id/babalawos
  - [ ] POST /temples (create - restricted)
  - [ ] PATCH /temples/:id (update - founder/admin)
  - [ ] PATCH /temples/:id/verify (admin/advisory board)
  - [ ] PATCH /users/:id/temple (assign babalawo)

#### Frontend
- [ ] ⬜ Create temple feature folder structure
- [ ] ⬜ Frontend: Temple directory page (`/temples`)
  - [ ] Search bar
  - [ ] Filters (location, lineage, tradition, verification, type)
  - [ ] Temple grid with cards
  - [ ] Sort options
  - [ ] Map view (optional)
- [ ] ⬜ Frontend: Temple detail page (`/temples/:slug`)
  - [ ] Hero section (banner, logo, name, verification)
  - [ ] About section
  - [ ] Babalawos section (grid/list with filters)
  - [ ] Contact section
  - [ ] Gallery
  - [ ] Statistics
- [ ] ⬜ Frontend: Temple card component
- [ ] ⬜ Frontend: Temple management page (founder/admin)
  - [ ] Edit temple info
  - [ ] Manage babalawos
  - [ ] Upload logo/banner
- [ ] ⬜ Frontend: Update Babalawo profile card to show temple
- [ ] ⬜ Frontend: Update Babalawo directory to filter by temple
- [ ] ⬜ Frontend: Add temple to main navigation (top-level)
- [ ] ⬜ Frontend: Temple following feature
- [ ] ⬜ Frontend: Featured temples on homepage

#### Common/Schemas
- [ ] ⬜ Create temple.schema.ts in common/src/schemas
- [ ] ⬜ Export temple types

---

### BLG-001: Wallet & Escrow System (Enhancements)

#### Backend Enhancements
- [ ] ⬜ Enhance Escrow model with:
  - [ ] releaseTiers (Json) for multi-tier release
  - [ ] expiryDate (DateTime) for auto-refund
- [ ] ⬜ Implement multi-tier release logic
  - [ ] Tier 1: 50% after session completion
  - [ ] Tier 2: 50% after guidance plan fulfillment
- [ ] ⬜ Implement auto-expiry job (cron/scheduled task)
  - [ ] Auto-refund after 14 days if unconfirmed
- [ ] ⬜ Implement dispute freeze logic
  - [ ] Lock funds during dispute resolution

#### Frontend Enhancements
- [ ] ⬜ Display multi-tier escrow status
- [ ] ⬜ Show expiry countdown
- [ ] ⬜ Dispute freeze indicator

---

### BLG-002: Payment Gateway Integration (Enhancements)

#### Backend Enhancements
- [ ] ⬜ Implement geo-location detection (IP-based or user preference)
- [ ] ⬜ Integrate currency conversion API
- [ ] ⬜ Implement dual webhook verification
- [ ] ⬜ Implement refund policy logic
  - [ ] 100% refund if Babalawo cancels
  - [ ] 50% if user cancels post-booking

#### Frontend Enhancements
- [ ] ⬜ Show currency conversion at checkout
- [ ] ⬜ Display selected payment gateway
- [ ] ⬜ Show refund policy

---

### BLG-003: Guidance Plan Module (Renamed from Prescription)

#### Backend
- [ ] ⬜ Rename "Prescription" to "Guidance Plan" in all code
- [ ] ⬜ Remove commission logic
- [ ] ⬜ Add fixed platform service fee (₦100 or $0.50)
- [ ] ⬜ Enforce "divination required" validation
- [ ] ⬜ Block guidance plan creation if divination status ≠ COMPLETED

#### Frontend
- [ ] ⬜ Guidance Plan creation form (Babalawo dashboard)
  - [ ] Disabled until divination complete
  - [ ] Error message if attempted early
- [ ] ⬜ Guidance Plan approval view (Client)
  - [ ] Show items and costs
  - [ ] Show platform service fee (clearly labeled)
  - [ ] Approval button
- [ ] ⬜ Guidance Plan history/status tracking
- [ ] ⬜ Cultural disclaimer component
- [ ] ⬜ Update all UI labels from "Prescription" to "Guidance Plan"

---

### BLG-003.5: Personal Awo vs One-off Consultation

#### Backend
- [ ] ⬜ Relationship duration logic (3/6/12 months)
- [ ] ⬜ Spiritual covenant agreement storage
- [ ] ⬜ Exclusivity enforcement (one active Personal Awo)
- [ ] ⬜ Grace period logic (14 days before switching)
- [ ] ⬜ Renewal prompts (30 days before expiration)

#### Frontend
- [ ] ⬜ Update Babalawo profile with two CTAs:
  - [ ] "Book a Session" (one-off)
  - [ ] "Request Personal Awo" (long-term)
- [ ] ⬜ Personal Awo request form
  - [ ] Duration selector
  - [ ] Covenant agreement display
  - [ ] Terms acknowledgment
  - [ ] Exclusivity acknowledgment
- [ ] ⬜ Grace period UI
  - [ ] Warning message
  - [ ] Countdown timer
  - [ ] Reflection resources
- [ ] ⬜ One-off consultation flow (simple booking)

---

### BLG-003.6: Privacy Controls for Sensitive Topics

#### Backend
- [ ] ⬜ Confidential session flag in database
- [ ] ⬜ Auto-delete job for messages (7/30/90 days)
- [ ] ⬜ End-to-end encryption for confidential messages
- [ ] ⬜ Privacy level enum (Public, Community, Private, Confidential)

#### Frontend
- [ ] ⬜ "Confidential session" toggle
- [ ] ⬜ Auto-delete settings (7/30/90 days selector)
- [ ] ⬜ Privacy level selector
- [ ] ⬜ Mobile app: Screenshot prevention

---

### BLG-003.7: Cultural Onboarding for Diaspora Users

#### Content
- [ ] ⬜ Create glossary of key terms
- [ ] ⬜ Record/create video: "What to Expect in a Divination"
- [ ] ⬜ Create beginner Academy course: "Introduction to Ifá/Isese"
- [ ] ⬜ Write cultural context guide

#### Frontend
- [ ] ⬜ Add "Are you reconnecting with your heritage?" question in signup
- [ ] ⬜ Cultural onboarding path (if Yes)
  - [ ] Glossary component with tooltips
  - [ ] Video player
  - [ ] Course link
  - [ ] Context guide
- [ ] ⬜ Yoruba diacritic input guidance
- [ ] ⬜ Diacritic keyboard helper

#### Backend
- [ ] ⬜ Yoruba diacritic validation (Unicode NFC normalization)
- [ ] ⬜ Input validation for Yoruba names

---

### BLG-003.8: Replace "Likes" with "Àṣẹ" Acknowledgment

#### Backend
- [ ] ⬜ Rename "likes" to "acknowledgments" in database (if needed)
- [ ] ⬜ Update acknowledgment logic
- [ ] ⬜ Add acknowledgment count aggregation

#### Frontend
- [ ] ⬜ Replace all "like" buttons with "Àṣẹ" button
- [ ] ⬜ Update acknowledgment count display: "X elders acknowledged"
- [ ] ⬜ List of acknowledgers (if public)
- [ ] ⬜ Update terminology throughout app

---

### BLG-004: Admin Dashboard (Enhanced with Temple Management)

#### Backend
- [ ] ⬜ Temple Management endpoints
- [ ] ⬜ Temple verification workflow integration
- [ ] ⬜ Cultural Advisory Board workflow integration
- [ ] ⬜ Auto-flagging logic for fraud detection

#### Frontend
- [ ] ⬜ Temple Management tab in admin dashboard
  - [ ] Temple list
  - [ ] Verification workflow
  - [ ] Manage temple-babalawo relationships
- [ ] ⬜ Fraud Alerts dashboard
- [ ] ⬜ Payout Approvals interface
- [ ] ⬜ Dispute resolution UI with SLA timer
- [ ] ⬜ Content moderation queue

---

### BLG-004.5: Offline Mode & Low-Bandwidth Support

#### Frontend
- [ ] ⬜ Service Worker implementation
- [ ] ⬜ Local storage for offline queue
- [ ] ⬜ Cache appointment details
- [ ] ⬜ Draft messages/documents saved locally
- [ ] ⬜ Progressive image loading
- [ ] ⬜ "Low Data Mode" toggle
- [ ] ⬜ Offline indicator

#### Backend
- [ ] ⬜ Sync endpoint for queued actions

---

### BLG-004.6: Multi-Currency Wallet Display

#### Backend
- [ ] ⬜ Currency conversion API integration
- [ ] ⬜ Exchange rate caching

#### Frontend
- [ ] ⬜ Multi-currency display component
- [ ] ⬜ Show balance in local currency + NGN equivalent
- [ ] ⬜ Exchange rate display
- [ ] ⬜ "Convert to [Currency]" option

---

## Phase 2: High Priority Features (P1)

### BLG-005: Vendor Onboarding (Cultural Vetting)
- [ ] ⬜ Add cultural authenticity fields to vendor application
- [ ] ⬜ Admin review interface for cultural authenticity

### BLG-006: Tutor Marketplace Separation
- [ ] ⬜ Frontend: Tutor profile view (separate from vendor)
- [ ] ⬜ Frontend: Tutor booking flow
- [ ] ⬜ Frontend: Tutor session management
- [ ] ⬜ Frontend: Separate tutor marketplace section

### BLG-007: Documents Portal - S3 Integration
- [ ] ⬜ AWS S3 bucket setup
- [ ] ⬜ Backend: File upload service with S3
- [ ] ⬜ Backend: Signed URL generation
- [ ] ⬜ Backend: Virus scanning integration

### BLG-008: Order Management & Tracking
- [ ] ⬜ Frontend: Shipping tracking input
- [ ] ⬜ Backend: Order notification system

### BLG-009: Home Screen Personalization
- [ ] ⬜ Frontend: Home screen redesign
- [ ] ⬜ Backend: Recommendation engine (rule-based)
- [ ] ⬜ Backend: Daily Yoruba word API
- [ ] ⬜ Frontend: Personalized content components

### BLG-010: Dispute Resolution System
- [ ] ⬜ Create `Dispute` model in Prisma
- [ ] ⬜ Backend: Dispute creation service
- [ ] ⬜ Backend: Automated dispute resolution logic
- [ ] ⬜ Backend: Tiered routing logic
- [ ] ⬜ Frontend: Dispute filing UI
- [ ] ⬜ Frontend: Admin dispute resolution interface
- [ ] ⬜ Frontend: Cultural Advisory Board escalation UI

---

## Phase 3: Medium Priority (P2)

### BLG-011: Video Call Integration
- [ ] ⬜ Agora.io or Twilio setup
- [ ] ⬜ Backend: Video room creation service
- [ ] ⬜ Frontend: Video call UI component
- [ ] ⬜ Backend: Recording storage and access

### BLG-012: Notification System
- [ ] ⬜ Email service setup (SendGrid/Mailgun)
- [ ] ⬜ Push notification service (FCM/APNS)
- [ ] ⬜ Backend: Notification service
- [ ] ⬜ Backend: Cultural template library
- [ ] ⬜ Frontend: Notification center/Inbox

### BLG-013: Community Circles
- [ ] ⬜ Create `Circle` model in Prisma
- [ ] ⬜ Backend: Circle CRUD operations
- [ ] ⬜ Frontend: Circle creation UI
- [ ] ⬜ Frontend: Circle directory/browse

### BLG-014: Events System
- [ ] ⬜ Create `Event` model in Prisma
- [ ] ⬜ Backend: Event CRUD operations
- [ ] ⬜ Frontend: Event creation UI
- [ ] ⬜ Frontend: Event listing/browse

### BLG-015: Review & Rating System Enhancement
- [ ] ⬜ Frontend: Review submission form
- [ ] ⬜ Frontend: Review display component
- [ ] ⬜ Backend: Review moderation logic
- [ ] ⬜ Backend: Review aggregation service

---

## Phase 4: Low Priority (P3)

### BLG-016: Daily Yoruba Word Feature
- [ ] ⬜ Daily word selection algorithm
- [ ] ⬜ Word display widget
- [ ] ⬜ Word detail view
- [ ] ⬜ Word history

### BLG-017: Spiritual Journey Tracking
- [ ] ⬜ Spiritual journey timeline view
- [ ] ⬜ Add milestones
- [ ] ⬜ Reflection/journal entries
- [ ] ⬜ Progress visualization

### BLG-018: Advanced Search & Filtering
- [ ] ⬜ Multi-facet filtering
- [ ] ⬜ Search suggestions/autocomplete
- [ ] ⬜ Yoruba diacritics search support
- [ ] ⬜ Saved searches

### BLG-019: Profile Customization Enhancement
- [ ] ⬜ Profile theme selection
- [ ] ⬜ Customizable profile sections
- [ ] ⬜ Cultural level badges display
- [ ] ⬜ Profile preview

### BLG-020: Analytics Dashboard (User-facing)
- [ ] ⬜ Babalawo: Booking stats, earnings, client retention
- [ ] ⬜ Vendor: Sales stats, popular products, revenue
- [ ] ⬜ Charts and visualizations
- [ ] ⬜ Export data capability

---

## Testing Checklist

### Unit Tests
- [ ] ⬜ Temple service tests
- [ ] ⬜ Guidance Plan service tests
- [ ] ⬜ Personal Awo relationship tests
- [ ] ⬜ Privacy controls tests
- [ ] ⬜ Currency conversion tests

### Integration Tests
- [ ] ⬜ Temple creation flow
- [ ] ⬜ Babalawo-temple assignment
- [ ] ⬜ Guidance Plan creation after divination
- [ ] ⬜ Personal Awo request flow
- [ ] ⬜ Payment flows with escrow

### E2E Tests
- [ ] ⬜ Complete client-babalawo journey
- [ ] ⬜ Temple discovery and following
- [ ] ⬜ Marketplace purchase flow
- [ ] ⬜ Academy enrollment flow

---

## Documentation Checklist

- [ ] ⬜ Update API documentation
- [ ] ⬜ Update user guides
- [ ] ⬜ Create temple management guide
- [ ] ⬜ Update onboarding documentation
- [ ] ⬜ Document privacy controls
- [ ] ⬜ Document guidance plan flow

---

## Deployment Checklist

- [ ] ⬜ Database migration scripts
- [ ] ⬜ Environment variables setup
- [ ] ⬜ S3 bucket configuration
- [ ] ⬜ Payment gateway configuration
- [ ] ⬜ Staging environment setup
- [ ] ⬜ Production deployment plan
- [ ] ⬜ Rollback plan

---

## Notes

- Temple system is the highest priority as it's the key differentiator
- All refinements from ACTORS_AND_USER_FLOWS.md are included
- Cultural integrity features are prioritized
- Offline support is critical for Nigeria/diaspora users
