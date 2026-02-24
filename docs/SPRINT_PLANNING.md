# Ilé Àṣẹ - Sprint Planning & Product Team Review
## MVT (Minimum Viable Trust) Sprint Plan

**Version:** 1.0  
**Date:** January 22, 2026  
**Status:** Ready for Sprint Planning  
**Sprint Duration:** 2 weeks per sprint  
**Team Size:** 2-3 developers + 1 designer + 1 QA

---

## 📊 **Product Team Review Summary**

### **Current Status Assessment**

| Category | Status | Completion | Notes |
|----------|--------|------------|-------|
| **MVT Core (P0)** | ⚠️ Partial | ~60% | Wallet/Escrow complete, enhancements + Prescription UI pending |
| **High Priority (P1)** | ⚠️ Partial | ~40% | Vendor onboarding done, Tutor separation + Disputes pending |
| **Medium Priority (P2)** | ❌ Not Started | ~10% | Notification system partial, others deferred |
| **Low Priority (P3)** | ❌ Not Started | ~5% | Post-MVP features |

### **Critical Blockers for Launch**

1. ❌ **Prescription Module UI** (BLG-003) - Blocks complete client journey
2. ⚠️ **Wallet/Escrow Enhancements** (BLG-001) - Multi-tier, auto-expiry, dispute freeze
3. ⚠️ **Payment Gateway Enhancements** (BLG-002) - Geo-routing, currency conversion
4. ⚠️ **Admin Dashboard Enhancements** (BLG-004) - Trust & Safety Hub

### **Launch Readiness Score**

**MVT Completion: 60%**  
**Target for Launch: 100%**  
**Gap: 40% (4-6 weeks of work)**

---

## 🎯 **Sprint Planning - MVT Focus**

### **Sprint 1: Wallet & Escrow Enhancements (Week 1-2)**
**Goal:** Complete enhanced escrow system with multi-tier release, auto-expiry, and dispute freeze

#### **Sprint Backlog**

**Story 1.1: Multi-Tier Escrow Release**
- **As a** platform administrator  
- **I want** escrow to release in tiers (50% after session, 50% after prescription)  
- **So that** Babalawos are incentivized to complete full service

**Acceptance Criteria:**
- [ ] Escrow model supports `releaseTiers` JSON field
- [ ] Backend service can release partial amounts (50%)
- [ ] First tier releases automatically after session completion
- [ ] Second tier releases after prescription fulfillment
- [ ] Frontend shows tier breakdown in escrow details

**Technical Tasks:**
- [ ] Update Prisma schema: Add `releaseTiers` Json field to Escrow
- [ ] Backend: Implement `releaseEscrowTier()` method
- [ ] Backend: Auto-trigger tier 1 release on session completion
- [ ] Backend: Auto-trigger tier 2 release on prescription completion
- [ ] Frontend: Display tier breakdown in escrow card
- [ ] Tests: Unit tests for tier release logic

**Story Points:** 8  
**Owner:** Backend Developer  
**Dependencies:** None

---

**Story 1.2: Auto-Expiry & Auto-Refund**
- **As a** client  
- **I want** unconfirmed payments to auto-refund after 14 days  
- **So that** I'm not stuck with held funds indefinitely

**Acceptance Criteria:**
- [ ] Escrow model has `expiryDate` field (default: createdAt + 14 days)
- [ ] Scheduled job runs daily to check expired escrows
- [ ] Expired escrows auto-refund to sender
- [ ] Notification sent to both parties on expiry
- [ ] Transaction record created for refund

**Technical Tasks:**
- [ ] Update Prisma schema: Add `expiryDate` DateTime field
- [ ] Backend: Create scheduled job (cron) for expiry check
- [ ] Backend: Implement `expireEscrow()` method
- [ ] Backend: Auto-refund logic
- [ ] Backend: Notification service integration
- [ ] Tests: Integration tests for expiry flow

**Story Points:** 5  
**Owner:** Backend Developer  
**Dependencies:** Notification system (can use basic email for now)

---

**Story 1.3: Dispute Freeze**
- **As an** admin  
- **I want** escrow funds frozen when dispute is filed  
- **So that** funds are protected during resolution

**Acceptance Criteria:**
- [ ] Escrow status changes to `DISPUTED` when dispute created
- [ ] Disputed escrows cannot be released until resolved
- [ ] Admin can unfreeze after resolution
- [ ] Frontend shows "Frozen" status clearly

**Technical Tasks:**
- [ ] Backend: Add `DISPUTED` status to EscrowStatus enum
- [ ] Backend: Block release when status is DISPUTED
- [ ] Backend: Integrate with dispute creation endpoint
- [ ] Frontend: Show frozen status in escrow UI
- [ ] Tests: Dispute freeze flow

**Story Points:** 5  
**Owner:** Backend Developer  
**Dependencies:** Dispute system (BLG-010) - can stub for now

---

**Sprint 1 Total Story Points:** 18  
**Sprint 1 Capacity:** 20 points (2 developers × 2 weeks)  
**Risk:** Low - well-defined scope

---

### **Sprint 2: Payment Gateway Enhancements (Week 3-4)**
**Goal:** Complete geo-aware routing, currency conversion, and webhook redundancy

#### **Sprint Backlog**

**Story 2.1: Geo-Aware Payment Gateway Routing**
- **As a** diaspora user in the UK  
- **I want** to be routed to Flutterwave automatically  
- **So that** I can pay in my local currency

**Acceptance Criteria:**
- [ ] Payment service detects user location (IP or user preference)
- [ ] Nigeria → Paystack
- [ ] Africa (ex-Nigeria) → Flutterwave
- [ ] User can override selection
- [ ] Frontend shows selected gateway

**Technical Tasks:**
- [ ] Backend: Add location detection (IP geolocation or user country)
- [ ] Backend: Update `determineProvider()` with geo-logic
- [ ] Backend: Add user preference override
- [ ] Frontend: Show gateway selection in payment modal
- [ ] Frontend: Allow user to change gateway
- [ ] Tests: Geo-routing logic

**Story Points:** 8  
**Owner:** Backend Developer  
**Dependencies:** IP geolocation service (free tier available)

---

**Story 2.2: Currency Conversion at Checkout**
- **As a** client paying in USD  
- **I want** to see the NGN equivalent  
- **So that** I understand the cost in my currency

**Acceptance Criteria:**
- [ ] Currency conversion API integrated (ExchangeRate-API or similar)
- [ ] Conversion shown at checkout
- [ ] User can pay in original or converted currency
- [ ] Exchange rate cached (refresh daily)
- [ ] Conversion fees displayed if applicable

**Technical Tasks:**
- [ ] Backend: Integrate currency conversion API
- [ ] Backend: Add rate caching (Redis or DB)
- [ ] Backend: Calculate conversion with fees
- [ ] Frontend: Show conversion in payment modal
- [ ] Frontend: Allow currency selection
- [ ] Tests: Conversion accuracy

**Story Points:** 8  
**Owner:** Backend Developer  
**Dependencies:** Currency API key (free tier available)

---

**Story 2.3: Webhook Redundancy & Verification**
- **As an** admin  
- **I want** dual verification of payments (gateway + manual check)  
- **So that** we catch any missed webhooks

**Acceptance Criteria:**
- [ ] Admin dashboard shows unverified payments
- [ ] Admin can manually verify payment
- [ ] System flags payments without webhook confirmation
- [ ] Alert sent if webhook missing after 24 hours

**Technical Tasks:**
- [ ] Backend: Track webhook receipt status
- [ ] Backend: Create admin verification endpoint
- [ ] Frontend: Admin dashboard - unverified payments tab
- [ ] Backend: Scheduled job to flag missing webhooks
- [ ] Backend: Alert system integration
- [ ] Tests: Webhook verification flow

**Story Points:** 5  
**Owner:** Full-stack Developer  
**Dependencies:** Admin dashboard (BLG-004)

---

**Story 2.4: Refund Policy Enforcement**
- **As a** client  
- **I want** clear refund policies enforced  
- **So that** I know my rights

**Acceptance Criteria:**
- [ ] 100% refund if Babalawo cancels
- [ ] 50% refund if user cancels post-booking
- [ ] Refund policy displayed at checkout
- [ ] Automated refund processing

**Technical Tasks:**
- [ ] Backend: Refund policy logic
- [ ] Backend: Calculate refund amount based on policy
- [ ] Frontend: Show refund policy at checkout
- [ ] Backend: Auto-process refunds based on cancellation reason
- [ ] Tests: Refund policy scenarios

**Story Points:** 5  
**Owner:** Backend Developer  
**Dependencies:** None

---

**Sprint 2 Total Story Points:** 26  
**Sprint 2 Capacity:** 20 points  
**Risk:** Medium - currency API dependency, may need to split Story 2.2

---

### **Sprint 3: Prescription Module UI (Week 5-6)**
**Goal:** Complete culturally compliant prescription workflow

#### **Sprint Backlog**

**Story 3.1: Prescription Creation Form (Babalawo)**
- **As a** Babalawo  
- **I want** to create prescriptions only after divination completion  
- **So that** I honor Ifá tradition

**Acceptance Criteria:**
- [ ] Prescription form disabled until divination status = COMPLETED
- [ ] Error message shown if attempted before completion
- [ ] Form includes: Akose items, Ebo instructions, cost, timeline
- [ ] Cultural disclaimer displayed
- [ ] Form validates required fields

**Technical Tasks:**
- [ ] Frontend: Prescription creation form component
- [ ] Frontend: Check divination status before enabling form
- [ ] Frontend: Show error message if blocked
- [ ] Frontend: Cultural disclaimer component
- [ ] Backend: Validate divination completion in API
- [ ] Backend: Block prescription creation if not completed
- [ ] Tests: Prescription creation flow

**Story Points:** 8  
**Owner:** Full-stack Developer  
**Dependencies:** Appointment/Booking system

---

**Story 3.2: Prescription Approval Flow (Client)**
- **As a** client  
- **I want** to review and approve prescriptions  
- **So that** I understand what I'm paying for

**Acceptance Criteria:**
- [ ] Client receives notification when prescription created
- [ ] Prescription detail view with all items
- [ ] Client can approve or request changes
- [ ] Approval triggers escrow hold
- [ ] Payment flow integrated

**Technical Tasks:**
- [ ] Frontend: Prescription detail view
- [ ] Frontend: Approval/rejection buttons
- [ ] Frontend: Request changes modal
- [ ] Backend: Prescription approval endpoint
- [ ] Backend: Escrow creation on approval
- [ ] Backend: Notification on prescription creation
- [ ] Tests: Approval flow

**Story Points:** 8  
**Owner:** Full-stack Developer  
**Dependencies:** Escrow system (BLG-001), Notification system

---

**Story 3.3: Prescription History & Tracking**
- **As a** client or Babalawo  
- **I want** to see prescription history and status  
- **So that** I can track progress

**Acceptance Criteria:**
- [ ] Prescription list view (client and Babalawo)
- [ ] Status tracking: Pending, Approved, In Progress, Completed
- [ ] Prescription detail view with timeline
- [ ] Completion tracking

**Technical Tasks:**
- [ ] Frontend: Prescription list component
- [ ] Frontend: Prescription detail view
- [ ] Frontend: Status badges and timeline
- [ ] Backend: Prescription status update endpoint
- [ ] Backend: Prescription history endpoint
- [ ] Tests: History and tracking

**Story Points:** 5  
**Owner:** Frontend Developer  
**Dependencies:** None

---

**Sprint 3 Total Story Points:** 21  
**Sprint 3 Capacity:** 20 points  
**Risk:** Low - well-defined scope

---

### **Sprint 4: Admin Dashboard - Trust & Safety Hub (Week 7-8)**
**Goal:** Complete admin dashboard with fraud alerts, payout approvals, and dispute center

#### **Sprint Backlog**

**Story 4.1: Fraud Alerts Dashboard**
- **As an** admin  
- **I want** to see auto-flagged suspicious content  
- **So that** I can prevent fraud

**Acceptance Criteria:**
- [ ] Auto-flag posts selling Akose (should be prescriptions)
- [ ] Auto-flag fake verification claims
- [ ] Admin dashboard tab for fraud alerts
- [ ] Admin can review and take action
- [ ] Alert severity levels

**Technical Tasks:**
- [ ] Backend: Auto-flagging logic (keyword detection)
- [ ] Backend: Fraud alert model
- [ ] Frontend: Fraud alerts tab in admin dashboard
- [ ] Frontend: Alert detail view
- [ ] Frontend: Action buttons (dismiss, ban, etc.)
- [ ] Tests: Auto-flagging scenarios

**Story Points:** 8  
**Owner:** Full-stack Developer  
**Dependencies:** Admin dashboard base

---

**Story 4.2: Payout Approvals Interface**
- **As an** admin  
- **I want** to review withdrawals > $500  
- **So that** I prevent fraud and money laundering

**Acceptance Criteria:**
- [ ] Withdrawal requests > $500 flagged for review
- [ ] Admin dashboard tab for payout approvals
- [ ] Admin can approve, reject, or request more info
- [ ] Notification sent to user on decision
- [ ] Audit log of approvals

**Technical Tasks:**
- [ ] Backend: Flag withdrawals > $500
- [ ] Backend: Payout approval endpoints
- [ ] Frontend: Payout approvals tab
- [ ] Frontend: Withdrawal detail view
- [ ] Frontend: Approval/rejection interface
- [ ] Backend: Audit logging
- [ ] Tests: Payout approval flow

**Story Points:** 8  
**Owner:** Full-stack Developer  
**Dependencies:** Wallet system (BLG-001)

---

**Story 4.3: Dispute Resolution Center**
- **As an** admin  
- **I want** to resolve disputes within 48 hours  
- **So that** platform trust is maintained

**Acceptance Criteria:**
- [ ] Dispute center tab in admin dashboard
- [ ] SLA timer (48 hours) displayed
- [ ] Evidence viewer (screenshots, messages, receipts)
- [ ] Admin can freeze escrow, issue refund, or close dispute
- [ ] Notification to both parties on resolution

**Technical Tasks:**
- [ ] Frontend: Dispute center tab
- [ ] Frontend: SLA timer component
- [ ] Frontend: Evidence viewer
- [ ] Frontend: Resolution interface
- [ ] Backend: Dispute resolution endpoints
- [ ] Backend: SLA tracking
- [ ] Tests: Dispute resolution flow

**Story Points:** 8  
**Owner:** Full-stack Developer  
**Dependencies:** Dispute system (BLG-010)

---

**Story 4.4: Cultural Advisory Board Integration**
- **As an** admin  
- **I want** to escalate spiritual disputes to Advisory Board  
- **So that** cultural integrity is maintained

**Acceptance Criteria:**
- [ ] Escalation button for spiritual disputes
- [ ] Advisory Board review interface (separate access)
- [ ] Advisory Board can provide recommendation
- [ ] Admin makes final decision based on recommendation

**Technical Tasks:**
- [ ] Backend: Advisory Board user role
- [ ] Backend: Escalation endpoint
- [ ] Frontend: Escalation UI
- [ ] Frontend: Advisory Board dashboard
- [ ] Backend: Recommendation workflow
- [ ] Tests: Escalation flow

**Story Points:** 5  
**Owner:** Full-stack Developer  
**Dependencies:** User roles system

---

**Sprint 4 Total Story Points:** 29  
**Sprint 4 Capacity:** 20 points  
**Risk:** High - may need to split into 2 sprints

---

## 📅 **Revised Sprint Timeline**

### **Phase 1: MVT Core (Sprints 1-4)**
- **Sprint 1** (Week 1-2): Wallet/Escrow Enhancements - 18 points
- **Sprint 2** (Week 3-4): Payment Gateway Enhancements - 26 points (may split)
- **Sprint 3** (Week 5-6): Prescription Module UI - 21 points
- **Sprint 4** (Week 7-8): Admin Dashboard Enhancements - 29 points (may split)

**Total MVT Time:** 8 weeks (2 months)

### **Phase 2: High Priority (Sprints 5-6)**
- **Sprint 5** (Week 9-10): Dispute Resolution System - 20 points
- **Sprint 6** (Week 11-12): Tutor Separation + Home Screen - 20 points

**Total Phase 2 Time:** 4 weeks (1 month)

### **Phase 3: Polish & Launch Prep (Sprint 7)**
- **Sprint 7** (Week 13-14): Testing, Bug fixes, Documentation

**Total Time to Launch:** 14 weeks (3.5 months)

---

## 🎯 **Sprint Planning Recommendations**

### **1. Sprint 2 Split Recommendation**
**Issue:** 26 story points exceeds 20-point capacity  
**Solution:** Split into Sprint 2A and 2B
- **Sprint 2A:** Geo-routing + Refund policy (13 points)
- **Sprint 2B:** Currency conversion + Webhook redundancy (13 points)

### **2. Sprint 4 Split Recommendation**
**Issue:** 29 story points exceeds 20-point capacity  
**Solution:** Split into Sprint 4A and 4B
- **Sprint 4A:** Fraud Alerts + Payout Approvals (16 points)
- **Sprint 4B:** Dispute Center + Advisory Board (13 points)

### **3. Resource Allocation**
- **Backend Developer 1:** Wallet/Escrow, Payment Gateway
- **Backend Developer 2:** Prescription, Admin Dashboard
- **Full-stack Developer:** Prescription UI, Admin Dashboard UI
- **Frontend Developer:** Prescription UI, Admin Dashboard UI
- **Designer:** Prescription UI mockups, Admin Dashboard mockups
- **QA:** Testing all features end-to-end

### **4. Dependencies Management**
- **Sprint 1:** No blockers
- **Sprint 2:** Requires IP geolocation API, Currency API (free tiers available)
- **Sprint 3:** Requires Appointment system (already exists)
- **Sprint 4:** Requires Dispute system (can stub for Sprint 4A, implement in Sprint 5)

---

## 🚨 **Risks & Mitigation**

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Currency API rate limits | Medium | Medium | Use free tier, implement caching, have backup API |
| Payment gateway webhook delays | High | Low | Implement webhook redundancy (Story 2.3) |
| Dispute system not ready for Sprint 4 | Medium | Medium | Stub dispute creation, implement in Sprint 5 |
| Prescription UI complexity | Medium | Low | Break into smaller stories, use existing patterns |
| Admin dashboard scope creep | High | Medium | Strictly limit to MVT features, defer extras |

---

## ✅ **Definition of Done**

For each story to be considered "Done":
- [ ] Code written and reviewed
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests written and passing
- [ ] Frontend UI matches design mockups
- [ ] Backend API documented
- [ ] Manual QA testing passed
- [ ] No critical bugs
- [ ] Deployed to staging
- [ ] Product owner acceptance

---

## 📊 **Sprint Metrics to Track**

- **Velocity:** Story points completed per sprint
- **Burndown:** Story points remaining vs. time
- **Blockers:** Number and duration of blockers
- **Bug Rate:** Bugs found per story point
- **Code Review Time:** Average time for PR review
- **Deployment Frequency:** Deployments to staging per sprint

---

## 🎯 **Success Criteria for MVT Launch**

- ✅ All P0 items (BLG-001, 002, 003, 004) complete
- ✅ End-to-end user journey tested (Client → Babalawo → Prescription → Payment)
- ✅ Payment success rate >95% in staging
- ✅ Zero critical bugs
- ✅ Admin dashboard fully functional
- ✅ Documentation complete

---

**Next Steps:**
1. **This Week:** Sprint 1 kickoff meeting
2. **Week 2:** Sprint 1 review, Sprint 2 planning
3. **Ongoing:** Daily standups, weekly reviews

---

**Prepared by:** Product Team  
**Date:** January 22, 2026  
**Next Review:** After Sprint 1 completion
