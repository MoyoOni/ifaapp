# ⚠️ OBSOLETE — Superseded by V1_PRODUCT_BACKLOG.md

**Do not use this document.** See **V1_PRODUCT_BACKLOG.md** for the current product backlog with clear labeling (EPIC-XXX, PB-XXX.Y) and Codebase Audit findings.

---

# Ilé Àṣẹ: Master Product Backlog
## Digital Sanctuary for Ancient Wisdom - Complete Product Roadmap

**Last Updated:** February 2, 2026  
**Demo Deadline:** February 12, 2026  
**Launch Deadline:** February 29, 2026  
**Product Vision:** A vertical operating system for the Ifá spiritual economy, combining trust architecture, cultural integrity, and verified community with Shopify + LinkedIn + Headspace capabilities.

---

## Executive Summary

This master product backlog represents the complete roadmap for the Ìlú Àṣẹ platform from current state (90% MVP complete) through launch (Feb 29) and into post-MVP expansion. The backlog is organized by strategic priority, technical dependencies, and business impact using the INVEST framework for maximum clarity and developer autonomy.

### Key Strategic Decisions
- **Spiritual Journey Feature**: DEFERRED to post-MVP (feature-complete but low strategic value)
- **Core Flow Priority**: Discover Temple → Find Babalawo → Book Consultation → Receive Guidance → Pay
- **MVP Scope**: P0 (demo-critical) + P1 (launch-required) only; P2-P3 deferred to post-launch
- **Team Capacity:** ~80-100 story points available before Feb 12; ~120-150 before Feb 29

### Success Metrics
- ✅ Feb 12: All P0 items complete; 3+ end-to-end demo scenarios work flawlessly
- ✅ Feb 29: All P1 items complete; zero broken features in critical paths

The Academy is the knowledge preservation arm of Ìlú Àṣẹ. Rather than generic content, we offer a curated curriculum exploring the intersection of Ifá wisdom, spirituality, science, and philosophy. Courses are taught by recognized masters and practitioners. This epic outlines the 12 core courses that form the foundation of the Academy.

- ✅ Launch: Clear role experiences (Client, Babalawo, Vendor) with distinct workflows
- ✅ Demo Data: Single source of truth; all demo scenarios use consolidated ecosystem
- ✅ User Feedback: 90%+ task completion on critical paths in UAT

---

## Prioritization Framework

| Priority | Label | Deadline | Scope | Rationale |
|----------|-------|----------|-------|-----------|
| **P0** | Critical for Demo | Feb 12, 2026 | 6-8 epics | Must work for stakeholder demo; blocking all other work |
| **P1** | Launch-Required | Feb 29, 2026 | 4-5 epics | Needed for production readiness; blocks launch if incomplete |
| **P2** | Post-Launch Nice-to-Have | Mar 15 - Apr 30 | 3-4 epics | Important for user engagement; can defer without impacting launch |
| **P3** | Future Expansion | May+ | 5+ epics | Strategic features; differentiation; revenue expansion |

---

# PART 1: P0 CRITICAL FOR DEMO (Feb 12, 2026)

## EPIC P0-1: Role-Based Dashboard System (COMPLETED)
**Business Value:** Foundational user experience; enables all other features  
**Team:** Frontend Lead + 1 Frontend Dev  
**Timeline:** 5 days  
**Story Points:** 21  
**Dependencies:** Auth system working; User.role field populated

### Context
Previously, users landed on a generic homepage regardless of role. A Babalawo saw the same content as a Client. This confusion prevented demos from showing role-specific workflows. Now we have distinct dashboard experiences for Client, Babalawo, Vendor, and Admin that guide users toward their core tasks.

### User Story: US-P0-1.1 - Role-Based Dashboard Implementation (COMPLETED)
**As a** user with a specific role (Client, Babalawo, Vendor, Admin)  
**I want** to see a dashboard tailored to my role's functionality and current tasks  
**So that** I can efficiently navigate to role-relevant features without confusion  

**Priority:** P0 (Critical for demo)  
**Story Points:** 13  
**Dependencies:** US-Auth-1.1 (role authentication)

**Acceptance Criteria:**
- [x] Dashboard component conditionally renders appropriate view based on authenticated user.role
- [x] **Client Dashboard** displays:
  - [x] "Discover Babalawos" prominent call-to-action with quick search
  - [x] "My Consultations" card showing 3 most recent bookings with status
  - [x] "Guidance Plans" card showing received prescriptions awaiting action
  - [x] "My Communities" card showing joined temples and circles
  - [x] "Marketplace" section showing recently viewed items or recommendations
  - [x] Quick links to Academy, Wallet, Messages
- [x] **Babalawo Dashboard** displays:
  - [x] "Upcoming Consultations" card showing next 5 bookings (sorted by date)
  - [x] "Pending Guidance Plans" card showing consultations awaiting guidance delivery
  - [x] "Client Management" card with quick access to client list and history
  - [x] "My Temple" card showing temple affiliation and status
  - [x] "Earnings" card showing this month's consultation fees and escrow balance
  - [x] "Analytics" section showing consultation volume, ratings, response time
- [x] **Vendor Dashboard** displays:
  - [x] "Inventory" card showing product listing status and inventory levels
  - [x] "Recent Orders" card showing last 5 orders with fulfillment status
  - [x] "Revenue" card showing this month's sales and commission breakdown
  - [x] "Storefront" card with quick access to product management
  - [x] "Messages" card showing recent customer inquiries
- [x] **Admin Dashboard** displays:
  - [x] "Platform Health" metrics (active users, consultations, transactions)
  - [x] "Verification Queue" showing pending babalawo/vendor applications
  - [x] "Dispute Management" showing open disputes
  - [x] "Site Settings" for content management and configuration
- [x] Navigation menu items conditionally render based on user.role:
  - [x] Clients: Discover, Messages, My Consultations, Wallet, Profile, Settings
  - [x] Babalawos: Dashboard, Clients, Messages, My Temple, Earnings, Profile, Settings
  - [x] Vendors: Dashboard, Inventory, Orders, Messages, Revenue, Profile, Settings
  - [x] Admins: Dashboard, Verification, Disputes, Users, Content, Settings
- [x] All role-specific components load within 500ms of authentication
- [x] Responsive design works on mobile, tablet, and desktop
- [x] No unauthorized UI elements visible to users (no "Create Circle" button for Clients, etc.)

**Technical Tasks:**
- [x] Create `frontend/src/context/RoleContext.tsx` with RoleProvider component
  - [x] Export useRole() hook for components to access current user role
  - [x] Set role from JWT token on app initialization
- [x] Create role-specific dashboard components
  - [x] ClientDashboardView with all required elements and stats
  - [x] PractitionerDashboard for babalawos
  - [x] VendorDashboardView for vendors
  - [x] AdminDashboardView for administrators
- [x] Update routing system to properly redirect users to role-appropriate dashboards
- [x] Implement conditional rendering of navigation menu items based on user role
- [x] Ensure all dashboard components properly connect to backend APIs
- [x] Implement demo data fallbacks for all dashboard components

---

## EPIC P0-2: Unified Demo Data Ecosystem (COMPLETED)
**Business Value:** Enables consistent, repeatable demos across all features  
**Team:** Full-stack developer  
**Timeline:** 3 days  
**Story Points:** 8  
**Dependencies:** Complete user base (P0-1)  

### Context
The platform requires a cohesive set of demo data that demonstrates realistic relationships between users, temples, babalawos, and clients. Previously, demo data was scattered across multiple files without clear connections, making it difficult to demonstrate end-to-end user journeys consistently. This epic creates a canonical source of truth for all demo data relationships.

### User Story: US-P0-2.1 - Unified Demo Data Implementation (COMPLETED)
**As a** product team member  
**I want** a unified demo data ecosystem with explicit relationships  
**So that** I can demonstrate consistent end-to-end user journeys across all features  

**Priority:** P0 (Critical for demo)  
**Story Points:** 8  
**Dependencies:** Complete user base (P0-1)

**Acceptance Criteria:**
- [x] All demo users defined with realistic names, roles, and attributes
- [x] Explicit relationships defined between babalawos and temples
- [x] Client-babalawo relationships established with appropriate status
- [x] Sample appointments created linking clients to babalawos
- [x] Demo data follows cultural authenticity guidelines (proper Yoruba names, etc.)
- [x] Demo ecosystem enables 3+ distinct end-to-end user journeys
- [x] All demo data is easily accessible via a single API/interface
- [x] Demo data supports all major platform features (consultations, communities, etc.)
- [x] Fallback mechanisms exist to ensure demo data loads when API unavailable

**Technical Tasks:**
- [x] Create `frontend/src/demo/demo-ecosystem.ts` with comprehensive demo data structure
- [x] Define relationships between users, temples, babalawos, and clients
- [x] Create helper functions to access related demo data (getUserTempleRelationships, getUserAppointments, etc.)
- [x] Implement fallback mechanisms in all dashboard and feature components
- [x] Establish clear mappings between demo data and API response structures
- [x] Document the demo ecosystem for easy maintenance and extension
- [x] Test all demo data relationships to ensure consistency

---

## EPIC P0-3: Consultation Booking Flow
**Business Value:** Core platform functionality; enables primary revenue stream  
**Team:** Full-stack developer + UI/UX  
**Timeline:** 5 days  
**Story Points:** 18  
**Dependencies:** User profiles complete (P0-1), Payment system ready

### Context
Users need to seamlessly book consultations with babalawos, with proper scheduling, payment processing, and confirmation flows. This is the core transaction of the platform - connecting clients with spiritual guidance providers. The flow must handle scheduling conflicts, payment processing, and clear communication between parties.

### User Story: US-P0-3.1 - Complete Consultation Booking Implementation
**As a** client  
**I want** to book consultations with babalawos seamlessly  
**So that** I can receive spiritual guidance when I need it  

**Priority:** P0 (Critical for demo)  
**Story Points:** 18  
**Dependencies:** User profiles complete (P0-1), Payment system ready

**Acceptance Criteria:**
- [x] **Service Selection:** Client can browse and select babalawo services/packages
- [x] **Availability Checking:** System verifies babalawo availability at requested time
- [x] **Time Slot Display:** Available time slots shown based on babalawo calendar
- [x] **Booking Creation:** Client can create appointment booking request
- [x] **Payment Processing:** Secure payment collection (via wallet/escrow)
- [x] **Confirmation Flow:** Babalawo receives and confirms booking request
- [x] **Status Tracking:** Clear visibility into booking status (pending/confirmed/completed)
- [x] **Cancellation Policy:** Both parties can cancel within policy constraints
- [x] **Notifications:** Automatic notifications for booking status changes
- [ ] **Integration Testing:** End-to-end booking flow tested with demo data
- [ ] **UI Polish:** Smooth, intuitive booking experience matching platform aesthetics

**Technical Tasks:**
- [x] Create `backend/src/appointments/appointments.controller.ts` and `appointments.service.ts`
- [x] Implement booking creation with availability checking
- [x] Add payment processing integration with escrow system
- [x] Create frontend booking flow components (multi-step wizard)
- [x] Implement backend confirmation workflow for babalawos
- [x] Add notification system for booking status changes
- [x] Create client appointment list component
- [x] Create babalawo appointment management view
- [ ] Complete end-to-end integration testing
- [ ] Polish UI/UX for seamless booking experience
- [ ] Add comprehensive error handling and edge cases

---


3. No notification to babalawo that new booking exists
4. Booking doesn't appear in consultation history
5. Booking status doesn't update through lifecycle (pending → confirmed → completed)

This is THE critical blocker for the payment flow. Without working bookings, there are no consultations to pay for.

### User Story: US-P0-2.1 - Complete End-to-End Booking Flow
**As a** client  
**I want** to successfully request and book a babalawo consultation  
**So that** I can receive spiritual guidance on a confirmed date/time  

**Priority:** P0 (Critical for demo)  
**Story Points:** 13  
**Dependencies:** US-P0-1.1

**Acceptance Criteria:**
- [ ] Client navigates to Babalawo profile from discover page
- [ ] Client clicks "Book Consultation" button
- [ ] Booking form opens (modal or new page) with fields:
  - [ ] Date picker (only future dates available)
  - [ ] Time picker (babalawo's available slots only)
  - [ ] Duration selector (30min, 60min, 90min)
  - [ ] Consultation topic (free text)
  - [ ] Preferred contact method (phone, video, in-person)
  - [ ] Special requests (optional)
  - [ ] Payment method selector (wallet, card, escrow)
- [ ] Client submits form
- [ ] Backend validates:
  - [ ] User is authenticated
  - [ ] Selected time slot is available
  - [ ] User has sufficient funds/credit
  - [ ] Babalawo is verified and active
- [ ] Backend creates Consultation record in database
  - [ ] Status: "PENDING_CONFIRMATION"
  - [ ] Timestamps for created, requested, confirmed
  - [ ] Store all booking details
  - [ ] Generate confirmation code
- [ ] Frontend shows BookingConfirmation page displaying:
  - [ ] Confirmation code (copy-to-clipboard button)
  - [ ] Babalawo name and profile picture
  - [ ] Scheduled date/time in user's timezone
  - [ ] Consultation topic
  - [ ] Cost breakdown (fee + escrow breakdown)
  - [ ] Next steps ("Babalawo will confirm within 24 hours")
  - [ ] "View My Consultations" button
  - [ ] "Schedule Another" button
- [ ] Booking appears in Client Dashboard "My Consultations" within 2 seconds
- [ ] Babalawo receives notification:
  - [ ] In-app notification in their notification center
  - [ ] Email notification (if email enabled in settings)
  - [ ] Babalawo sees new booking in their dashboard "Upcoming Consultations"
- [ ] Babalawo can accept/decline booking within 24 hours
  - [ ] If accepted: status becomes "CONFIRMED", client gets notification
  - [ ] If declined: status becomes "DECLINED", client can book with different babalawo
  - [ ] If no response after 24h: auto-declines (returns funds to client)
- [ ] Payment is held in escrow until consultation is completed
- [ ] Consultation status lifecycle:
  - [ ] PENDING_CONFIRMATION (client booked, awaiting babalawo response)
  - [ ] CONFIRMED (babalawo accepted, awaiting consultation date)
  - [ ] COMPLETED (consultation occurred)
  - [ ] CANCELLED (either party cancelled)
  - [ ] DISPUTED (payment disputed)

**Technical Tasks:**

**Backend (NestJS):**
- [ ] Update `backend/src/appointments/appointments.service.ts` createBooking() method:
  ```typescript
  async createBooking(data: CreateConsultationDto): Promise<Consultation> {
    // 1. Validate babalawo availability (check calendar)
    const isSlotAvailable = await this.isTimeSlotAvailable(
      data.babalawoId,
      data.scheduledDate,
      data.duration
    );
    if (!isSlotAvailable) throw new ConflictException('Time slot unavailable');
    
    // 2. Validate user has sufficient funds/credit
    const wallet = await this.wallet.getUserWallet(data.clientId);
    if (wallet.balance < data.estimatedFee) {
      throw new BadRequestException('Insufficient funds');
    }
    
    // 3. Create consultation record
    const consultation = await this.prisma.consultation.create({
      data: {
        clientId: data.clientId,
        babalawoId: data.babalawoId,
        scheduledDate: data.scheduledDate,
        duration: data.duration,
        topic: data.topic,
        preferredMethod: data.preferredMethod,
        status: 'PENDING_CONFIRMATION',
        confirmationCode: generateCode(),
        estimatedFee: data.estimatedFee,
        createdAt: new Date(),
      },
      include: { babalawo: true, client: true },
    });
    
    // 4. Hold payment in escrow
    await this.escrow.holdFunds(
      data.clientId,
      data.estimatedFee,
      `Consultation with ${consultation.babalawo.name}`,
      consultation.id
    );
    
    // 5. Send notification to babalawo
    await this.notifications.notifyNewBooking(consultation);
    
    return consultation;
  }
  ```
- [ ] Update `backend/src/appointments/appointments.controller.ts`:
  ```typescript
  @Post('/')
  async createConsultation(@Body() dto: CreateConsultationDto) {
    return await this.appointmentsService.createBooking(dto);
  }
  
  @Patch('/:id/confirm')
  async confirmConsultation(@Param('id') consultationId: string) {
    // Only babalawo can confirm their consultation
    const consultation = await this.appointmentsService.updateStatus(
      consultationId,
      'CONFIRMED'
    );
    // Notify client of confirmation
    await this.notifications.notifyBookingConfirmed(consultation);
    return consultation;
  }
  
  @Patch('/:id/cancel')
  async cancelConsultation(@Param('id') consultationId: string) {
    const consultation = await this.appointmentsService.updateStatus(
      consultationId,
      'CANCELLED'
    );
    // Refund client
    await this.escrow.releaseFunds(consultation.id, 'REFUND');
    await this.notifications.notifyBookingCancelled(consultation);
    return consultation;
  }
  ```
- [ ] Create `backend/src/appointments/dto/create-consultation.dto.ts`:
  ```typescript
  export class CreateConsultationDto {
    babalawoId: string;
    scheduledDate: Date;
    duration: 30 | 60 | 90; // minutes
    topic: string;
    preferredMethod: 'PHONE' | 'VIDEO' | 'IN_PERSON';
    specialRequests?: string;
    paymentMethod: 'WALLET' | 'CARD' | 'ESCROW';
  }
  ```
- [ ] Add availability checking logic in `backend/src/appointments/availability.service.ts`:
  ```typescript
  async isTimeSlotAvailable(
    babalawoId: string,
    date: Date,
    duration: number
  ): Promise<boolean> {
    // Check if babalawo has availability on this date
    const availability = await this.prisma.babalawoAvailability.findUnique({
      where: { babalawoId_date: { babalawoId, date } },
    });
    
    if (!availability) return false; // No availability set for this date
    
    // Check for conflicts with existing consultations
    const conflicts = await this.prisma.consultation.findMany({
      where: {
        babalawoId,
        scheduledDate: date,
        status: { not: 'CANCELLED' }, // Ignore cancelled consultations
      },
    });
    
    return !conflicts.some(c => this.timesOverlap(c, date, duration));
  }
  ```
- [ ] Add notification service calls in `backend/src/notifications/notifications.service.ts`:
  ```typescript
  async notifyNewBooking(consultation: Consultation): Promise<void> {
    // In-app notification
    await this.prisma.notification.create({
      data: {
        userId: consultation.babalawoId,
        type: 'NEW_BOOKING',
        title: `New consultation request from ${consultation.client.name}`,
        body: `Scheduled for ${consultation.scheduledDate}`,
        metadata: { consultationId: consultation.id },
      },
    });
    
    // Email notification
    if (consultation.babalawo.emailNotificationsEnabled) {
      await this.email.sendNewBookingNotification(consultation);
    }
  }
  ```
- [ ] Update Prisma schema to add consultation status enum if not exists:
  ```prisma
  enum ConsultationStatus {
    PENDING_CONFIRMATION
    CONFIRMED
    COMPLETED
    CANCELLED
    DISPUTED
  }
  ```

**Frontend (React/TypeScript):**
- [ ] Create `frontend/src/features/consultations/BookingForm.tsx`:
  ```typescript
  interface BookingFormProps {
    babalawoId: string;
    babalawoName: string;
  }
  
  export const BookingForm: React.FC<BookingFormProps> = ({ babalawoId, babalawoName }) => {
    const [formData, setFormData] = useState({
      scheduledDate: '',
      time: '',
      duration: 60,
      topic: '',
      preferredMethod: 'VIDEO',
      specialRequests: '',
      paymentMethod: 'WALLET',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/consultations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            babalawoId,
            scheduledDate: `${formData.scheduledDate}T${formData.time}`,
            duration: formData.duration,
            topic: formData.topic,
            preferredMethod: formData.preferredMethod,
            specialRequests: formData.specialRequests,
            paymentMethod: formData.paymentMethod,
          }),
        });
        
        if (!response.ok) {
          throw new Error(await response.text());
        }
        
        const consultation = await response.json();
        // Navigate to confirmation page
        navigate(`/consultations/${consultation.id}/confirmation`);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2>Book Consultation with {babalawoName}</h2>
        
        <div>
          <label>Date</label>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={formData.scheduledDate}
            onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label>Time</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({...formData, time: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label>Duration</label>
          <select value={formData.duration} onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}>
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
        </div>
        
        <div>
          <label>Consultation Topic</label>
          <textarea
            value={formData.topic}
            onChange={(e) => setFormData({...formData, topic: e.target.value})}
            placeholder="What would you like guidance on?"
            required
          />
        </div>
        
        <div>
          <label>Preferred Contact Method</label>
          <select value={formData.preferredMethod} onChange={(e) => setFormData({...formData, preferredMethod: e.target.value})}>
            <option value="VIDEO">Video Call</option>
            <option value="PHONE">Phone Call</option>
            <option value="IN_PERSON">In Person</option>
          </select>
        </div>
        
        <div>
          <label>Special Requests (Optional)</label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
            placeholder="Any special accommodations?"
          />
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Booking...' : 'Book Consultation'}
        </button>
      </form>
    );
  };
  ```
- [ ] Create `frontend/src/features/consultations/BookingConfirmation.tsx`:
  ```typescript
  interface BookingConfirmationProps {
    consultationId: string;
  }
  
  export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ consultationId }) => {
    const [consultation, setConsultation] = useState(null);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();
    
    useEffect(() => {
      fetch(`/api/consultations/${consultationId}`)
        .then(r => r.json())
        .then(setConsultation);
    }, [consultationId]);
    
    const copyCode = () => {
      navigator.clipboard.writeText(consultation.confirmationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    
    if (!consultation) return <div>Loading...</div>;
    
    return (
      <div className="confirmation-page space-y-6">
        <div className="success-message">
          ✓ Consultation Booked Successfully!
        </div>
        
        <div className="confirmation-code">
          <p>Confirmation Code:</p>
          <code>{consultation.confirmationCode}</code>
          <button onClick={copyCode}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        
        <div className="details card">
          <h3>Consultation Details</h3>
          <div className="babalawo-info">
            <img src={consultation.babalawo.avatar} alt={consultation.babalawo.name} />
            <div>
              <p><strong>{consultation.babalawo.name}</strong></p>
              <p className="specialty">{consultation.babalawo.specialty}</p>
            </div>
          </div>
          
          <div className="detail-row">
            <span>Date & Time:</span>
            <span>{new Date(consultation.scheduledDate).toLocaleString()}</span>
          </div>
          
          <div className="detail-row">
            <span>Duration:</span>
            <span>{consultation.duration} minutes</span>
          </div>
          
          <div className="detail-row">
            <span>Topic:</span>
            <span>{consultation.topic}</span>
          </div>
          
          <div className="detail-row">
            <span>Contact Method:</span>
            <span>{consultation.preferredMethod}</span>
          </div>
        </div>
        
        <div className="cost-breakdown card">
          <h3>Cost Breakdown</h3>
          <div className="detail-row">
            <span>Consultation Fee:</span>
            <span>${consultation.estimatedFee}</span>
          </div>
          <div className="detail-row">
            <span>Escrow Held:</span>
            <span>${consultation.estimatedFee}</span>
          </div>
          <p className="note">Payment will be released to babalawo after consultation completion.</p>
        </div>
        
        <div className="next-steps card">
          <h3>What Happens Next</h3>
          <ol>
            <li>{consultation.babalawo.name} will confirm within 24 hours</li>
            <li>You'll receive a confirmation notification</li>
            <li>Join the consultation via your preferred contact method</li>
            <li>Receive your guidance plan after the consultation</li>
            <li>Payment is released when consultation is marked complete</li>
          </ol>
        </div>
        
        <div className="actions">
          <button onClick={() => navigate('/consultations')}>View My Consultations</button>
          <button variant="secondary" onClick={() => navigate('/discover')}>Schedule Another</button>
        </div>
      </div>
    );
  };
  ```
- [ ] Update `frontend/src/features/babalawo/BabalawoDashboard.tsx` to show "Upcoming Consultations" list:
  - [ ] Fetch from `/api/babalawo/{id}/consultations?status=PENDING_CONFIRMATION,CONFIRMED`
  - [ ] Create ConsultationCard component with accept/decline buttons
  - [ ] Add "Confirm" button that calls `PATCH /api/consultations/{id}/confirm`
  - [ ] Add "Decline" with reason modal
- [ ] Update `frontend/src/features/consultations/MyConsultations.tsx` to show all user consultations:
  - [ ] Fetch from `/api/consultations?status=*`
  - [ ] Group by status (Upcoming, Past, Cancelled)
  - [ ] Add cancel button for upcoming consultations
  - [ ] Show guidance plan link once available
- [ ] Add E2E test in `frontend/e2e/booking.spec.ts`:
  ```typescript
  test('Complete booking flow from start to confirmation', async () => {
    // 1. Login as client
    await page.goto('/login');
    // ...
    
    // 2. Navigate to babalawo profile
    await page.goto('/discover');
    await page.click('[data-testid="babalawo-card-123"]');
    
    // 3. Click "Book Consultation"
    await page.click('button:has-text("Book Consultation")');
    
    // 4. Fill form
    await page.fill('input[type="date"]', '2026-02-15');
    await page.fill('input[type="time"]', '14:00');
    // ... fill other fields
    
    // 5. Submit
    await page.click('button:has-text("Book Consultation")');
    
    // 6. Verify confirmation page
    await expect(page).toHaveURL(/\/confirmations\/\d+/);
    await expect(page).toContainText('Consultation Booked Successfully');
  });
  ```

**Testing Checklist:**
- [ ] Manual test: Complete booking as client (date picker, time, topic, submit)
- [ ] Manual test: Verify confirmation code displayed and copyable
- [ ] Manual test: Login as babalawo, verify booking in dashboard appears
- [ ] Manual test: Babalawo accepts booking, verify client gets notification
- [ ] Manual test: Verify payment held in escrow (check wallet balance)
- [ ] API test: POST /api/consultations with invalid data returns 400
- [ ] API test: POST /api/consultations with unavailable time returns 409
- [ ] API test: Unauthorized user cannot view other user's consultation
- [ ] E2E test: Complete end-to-end flow (booking.spec.ts passes)
- [ ] Load test: 10 concurrent booking attempts (no race conditions)

**Definition of Done:**
- [ ] All acceptance criteria met
- [ ] All technical tasks completed and code reviewed
- [ ] All testing checklist items passed
- [ ] E2E test passes consistently
- [ ] Babalawo receives notification (check logs/test account)
- [ ] Booking appears in both client and babalawo dashboards within 2 seconds
- [ ] Team confirms this unblocks payment flow demo

---

### User Story: US-P0-2.2 - Booking Confirmation Notification System
**As a** babalawo  
**I want** to receive a clear notification when a client books a consultation  
**So that** I don't miss booking requests and can promptly confirm or decline  

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** US-P0-2.1

**Acceptance Criteria:**
- [ ] In-app notification appears in notification center (top-right bell icon)
- [ ] Notification shows client name, date/time, topic
- [ ] "View" button navigates to consultation detail page
- [ ] Email notification sent (if babalawo has enabled it in settings)
- [ ] Email includes "Confirm" or "Decline" quick-action links
- [ ] SMS notification sent (if phone on file and enabled)
- [ ] Notification marked as read when viewed
- [ ] Notifications persist in database (queryable via API)

**Technical Tasks:**
- [ ] Already mostly covered in US-P0-2.1 backend notifications service
- [ ] Create `frontend/src/components/NotificationCenter.tsx` if not exists
- [ ] Add sound/desktop notification (browser requestNotification API)
- [ ] Create email template in `backend/templates/new-booking-email.html`
- [ ] Add SMS integration call in notifications service (Twilio)

---

## EPIC P0-3: Unified Demo Data Ecosystem
**Business Value:** Removes all demo data conflicts; enables all features to work together  
**Team:** Full Stack (1 BE + 1 FE)  
**Timeline:** 3 days  
**Story Points:** 13  
**Dependencies:** None (can parallelize)

### Context
Currently, there are TWO demo data files (lib/demo-data.ts and data/demo-data.ts) with conflicting data. When a Babalawo ID from one file is referenced by a consultation from another file, lookups fail with "not found" errors. This cascades through all features (Circles, Forums, Events, etc.). We need ONE canonical demo ecosystem where all relationships are properly wired.

### User Story: US-P0-3.1 - Unified Demo Data Implementation
**As a** developer preparing for demo  
**I want** a single source of truth for all demo entities  
**So that** all features reference consistent data and work together seamlessly  

**Priority:** P0  
**Story Points:** 8  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] Single demo data file exists at `data/demo-ecosystem.ts` (canonical source)
- [ ] All previous references to lib/demo-data.ts and data/demo-data.ts removed
- [ ] Demo ecosystem includes all entity types:
  - [ ] Users (10+ with different roles: clients, babalawos, vendors, admins)
  - [ ] Temples (3+ with babalawos affiliated)
  - [ ] Babalawos (5+ verified, with specialties, availability, reviews)
  - [ ] Clients (5+ with consultation history)
  - [ ] Vendors (2+ with product listings)
  - [ ] Products (10+ sacred artifacts with images)
  - [ ] Consultations (5+ with various statuses)
  - [ ] Guidance Plans (3+ linked to consultations)
  - [ ] Circles (3+ egbe groups with members)
  - [ ] Events (5+ temple events with attendees)
  - [ ] Forums (3+ discussion threads with posts)
  - [ ] Orders (3+ marketplace orders)
  - [ ] Reviews (8+ babalawo/vendor reviews)
- [ ] All relationships are properly established:
  - [ ] Each babalawo linked to a temple
  - [ ] Each consultation linked to existing client & babalawo
  - [ ] Each guidance plan linked to existing consultation
  - [ ] Each circle has member relationships
  - [ ] Each order linked to existing client & vendor
  - [ ] Each review linked to existing user & subject
  - [ ] Forum threads linked to temple or circle
- [ ] Demo ecosystem can be seeded consistently (no hardcoded IDs)
  - [ ] Use object references instead of string IDs where possible
  - [ ] Auto-generate IDs in seed script
  - [ ] Export IDs for reference by other seeders
- [ ] Each entity includes realistic, culturally-appropriate data:
  - [ ] Babalawos have Yoruba names, specialties, and credentials
  - [ ] Products include sacred items (divination tools, beads, herbs)
  - [ ] Forum threads discuss spiritual topics
  - [ ] Guidance plans include Ifá-appropriate recommendations
- [ ] Demo ecosystem supports 3+ end-to-end demo scenarios:
  - [ ] Scenario 1: New Client Discovery → Find Babalawo → Book Consultation
  - [ ] Scenario 2: Consultation Booking → Receive Guidance Plan → Payment
  - [ ] Scenario 3: Marketplace Purchase → Order Tracking → Review
  - [ ] Scenario 4 (Optional): Circle Join → Event Attendance → Community Engagement

**Technical Tasks:**

**Backend:**
- [ ] Create `backend/src/seeding/demo-ecosystem.ts`:
  ```typescript
  // Define all demo entities with relationships
  export const DEMO_ECOSYSTEM = {
    temples: [
      {
        name: 'Ile Asa Community Temple',
        location: 'Brooklyn, NY',
        founder: 'Babalao Kunle',
        description: 'A sanctuary for spiritual growth and cultural preservation',
        // ... more fields
      },
      // ... more temples
    ],
    
    users: {
      babalawos: [
        {
          name: 'Babalao Kunle Oyeleke',
          role: 'BABALAWO',
          email: 'kunle@example.com',
          temple: 'Ile Asa Community Temple',
          specialty: 'Ifa Divination',
          experience: '25 years',
          hourlyRate: 150,
          avatar: 'https://...',
          availability: [
            { day: 'MONDAY', slots: ['09:00-17:00'] },
            // ... more days
          ],
          // ... more fields
        },
        // ... more babalawos
      ],
      
      clients: [
        {
          name: 'Amara Johnson',
          role: 'CLIENT',
          email: 'amara@example.com',
          avatar: 'https://...',
          // ... more fields
        },
        // ... more clients
      ],
      
      vendors: [
        {
          name: 'Sacred Artifacts Collective',
          role: 'VENDOR',
          email: 'vendor@example.com',
          storeName: 'Sacred Artifacts Collective',
          // ... more fields
        },
        // ... more vendors
      ],
    },
    
    products: [
      {
        name: 'Ifa Divination Chains',
        vendor: 'Sacred Artifacts Collective',
        price: 75.00,
        description: 'Authentic brass divination chains',
        image: 'https://...',
        // ... more fields
      },
      // ... more products
    ],
    
    consultations: [
      {
        client: 'Amara Johnson',
        babalawo: 'Babalao Kunle Oyeleke',
        date: '2026-02-10T14:00:00Z',
        duration: 60,
        topic: 'Guidance on life direction',
        status: 'CONFIRMED',
        // ... more fields
      },
      // ... more consultations
    ],
    
    // ... more entity types
  };
  ```
- [ ] Create `backend/src/seeding/seed-demo.ts` script:
  ```typescript
  import { PrismaClient } from '@prisma/client';
  import { DEMO_ECOSYSTEM } from './demo-ecosystem';
  
  const prisma = new PrismaClient();
  
  async function seedDemo() {
    console.log('Seeding demo ecosystem...');
    
    // Clear existing demo data
    await prisma.review.deleteMany();
    await prisma.consultation.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    // ... clear other tables
    
    // Seed temples
    const temples = await Promise.all(
      DEMO_ECOSYSTEM.temples.map(t =>
        prisma.temple.create({ data: t })
      )
    );
    console.log(`✓ Created ${temples.length} temples`);
    
    // Seed users
    const babalawos = await Promise.all(
      DEMO_ECOSYSTEM.users.babalawos.map(b => {
        const temple = temples.find(t => t.name === b.temple);
        return prisma.user.create({
          data: {
            ...b,
            templeId: temple.id,
          },
        });
      })
    );
    console.log(`✓ Created ${babalawos.length} babalawos`);
    
    // ... continue seeding other entities
    
    console.log('✓ Demo ecosystem seeded successfully!');
  }
  
  seedDemo().catch(console.error).finally(() => prisma.$disconnect());
  ```
- [ ] Update `package.json` scripts:
  ```json
  {
    "scripts": {
      "seed:demo": "ts-node src/seeding/seed-demo.ts"
    }
  }
  ```
- [ ] Update `.env` to include `SEED_DEMO=true` for dev environment
- [ ] Delete `lib/demo-data.ts` and `data/demo-data.ts` (old files)
- [ ] Update all imports across codebase to use `demo-ecosystem.ts`:
  - [ ] `frontend/src/services/api.ts` (if fetches demo data)
  - [ ] `backend/src/app.module.ts` (if uses demo data for initialization)
  - [ ] Any test files referencing old demo data

**Frontend:**
- [ ] Update API base URL environment variable to use real API (not hardcoded demo data):
  - [ ] `.env.development`: `VITE_API_URL=http://localhost:3000/api`
  - [ ] `.env.production`: `VITE_API_URL=https://api.ile-ase.app/api`
- [ ] Update mock API service to pull from backend seeded data instead of local demo
- [ ] Remove any hardcoded demo data in frontend components
- [ ] Add E2E test that seeds demo data and runs all scenario tests

**Testing Checklist:**
- [ ] Run seed script: `npm run seed:demo` completes without errors
- [ ] Verify all entities exist in database: `SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM temples; ...`
- [ ] Verify relationships: 
  - [ ] Each babalawo has a temple
  - [ ] Each consultation references existing user IDs
  - [ ] Each product references existing vendor
  - [ ] Each order has client & product references
- [ ] API fetch for `/api/babalawos` returns 5+ records with temples
- [ ] API fetch for `/api/products` returns 10+ records
- [ ] Frontend loads home page, fetches demo data from backend, displays babalawos
- [ ] E2E test: Book a consultation using demo babalawo (should work without errors)

**Definition of Done:**
- [ ] Single demo ecosystem file created and documented
- [ ] All old demo files deleted; no dangling references
- [ ] Seed script runs successfully
- [ ] All entities and relationships verified in database
- [ ] All features can reference demo data without "not found" errors
- [ ] Team confirms demo data ready for scenarios

---

### User Story: US-P0-3.2 - Demo Scenario Documentation
**As a** demo lead  
**I want** clear step-by-step guides for 3+ demo scenarios  
**So that** any team member can run the demo consistently and highlight key features  

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** US-P0-3.1

**Acceptance Criteria:**
- [ ] Document 3 demo scenarios with step-by-step instructions
- [ ] Each scenario has:
  - [ ] Clear objective (what story are we telling?)
  - [ ] Required accounts (which demo users to login as)
  - [ ] Step-by-step walkthrough (click X, verify Y, show Z)
  - [ ] Expected outcomes (what stakeholder should see)
  - [ ] Estimated time (2-3 min per scenario)
  - [ ] Screenshots/video showing proper flow
  - [ ] Common pitfalls/what to avoid
- [ ] Scenarios are:
  - [ ] Scenario 1: "Client Discovery" (Discover Babalawos → Temple → Booking)
  - [ ] Scenario 2: "Complete Consultation" (Book → Confirm → Guidance → Payment)
  - [ ] Scenario 3: "Marketplace Purchase" (Browse → Add to Cart → Checkout → Order)
- [ ] All scenarios use demo data accounts that are pre-seeded
- [ ] Scenarios are documented in `docs/DEMO_GUIDE.md`

**Technical Tasks:**
- [ ] Create `docs/DEMO_GUIDE.md`:
  ```markdown
  # Demo Guide
  
  ## Scenario 1: Client Discovery Journey (3 minutes)
  
  **Objective:** Show how a new user discovers and books a babalawo
  **Demo Account:** 
  - Username: demo_client@example.com
  - Password: demo123
  
  ### Steps:
  1. Open app and login as demo_client
  2. Navigate to "Discover" from sidebar
  3. Show Babalawo cards with temple affiliation
  4. Click "Babalao Kunle Oyeleke" card
  5. Verify profile shows:
     - Babalawo name, credentials, specialties
     - Temple affiliation "Ile Asa Community Temple"
     - 5-star rating with 12 reviews
     - Hourly rate: $150
     - Availability calendar (next 30 days)
  6. Click "Book Consultation" button
  7. Show booking form (date, time, topic, method)
  
  ### Expected Outcome:
  Stakeholder understands the user discovery and booking flow.
  
  ---
  
  ## Scenario 2: Complete Consultation (5 minutes)
  
  ... etc
  ```
- [ ] Record screen capture of each scenario (using ScreenFlow or similar)
- [ ] Create PDF/PowerPoint with scenario flowcharts
- [ ] Add QA checklist: test scenarios once before each demo

**Definition of Done:**
- [ ] `docs/DEMO_GUIDE.md` created with 3+ scenarios
- [ ] Scenarios tested and verified to work with demo data
- [ ] Demo lead can run any scenario in <5 minutes without referring to guide

---

## EPIC P0-4: Complete User Profile System
**Business Value:** Enables discovery, trust-building, and messaging  
**Team:** Full Stack (1 BE + 1 FE)  
**Timeline:** 4 days  
**Story Points:** 16  
**Dependencies:** US-P0-1.1 (role dashboards), US-P0-3.1 (demo data)

### Context
Currently, clicking on a user's name or profile picture does nothing. Profiles don't show role-specific information (babalawo credentials, specialties, reviews; client activity; vendor products). Without working profiles, users can't build trust or understand who they're interacting with.

### User Story: US-P0-4.1 - Complete Profile Viewing System
**As a** user  
**I want** to view other users' profiles with all relevant information  
**So that** I can understand their credentials, experience, and community activity  

**Priority:** P0  
**Story Points:** 13  
**Dependencies:** US-P0-1.1, US-P0-3.1

**Acceptance Criteria:**
- [ ] Clicking on any user's name or profile picture opens their profile
- [ ] Profile displays role-appropriate information:
  - [ ] **All Users:**
    - [ ] Profile picture
    - [ ] Full name
    - [ ] Bio/About section
    - [ ] Role badge (Babalawo, Client, Vendor, Admin)
    - [ ] Member since date
    - [ ] Location
    - [ ] "Send Message" button
  - [ ] **Babalawo Profile:**
    - [ ] Credentials and lineage information
    - [ ] Specialties (Ifa Divination, Ancestral Guidance, etc.)
    - [ ] Years of experience
    - [ ] Temple affiliation with link
    - [ ] Hourly consultation rate
    - [ ] Availability calendar (next 30 days)
    - [ ] Reviews section (showing 5 most recent with ratings)
    - [ ] Average Àṣẹ rating (4.8/5 stars)
    - [ ] Client testimonials section
    - [ ] "Book Consultation" button (prominent)
    - [ ] Response time metric (e.g., "Responds in <2 hours")
    - [ ] Consultation count (e.g., "150+ consultations completed")
  - [ ] **Client Profile:**
    - [ ] Communities joined (temples, circles)
    - [ ] Events attended (number)
    - [ ] Forum contributions (discussion threads, posts)
    - [ ] Marketplace purchases (number)
    - [ ] Guidance plans completed (number)
    - [ ] Journey progress/level (if spiritual journey feature enabled)
  - [ ] **Vendor Profile:**
    - [ ] Store name
    - [ ] Product listings (grid view of recent items)
    - [ ] Business description
    - [ ] Seller rating (average Àṣẹ)
    - [ ] Number of orders fulfilled
    - [ ] Return policy
    - [ ] Contact information
    - [ ] "Shop Storefront" button
  - [ ] **Admin Profile:**
    - [ ] Role badge showing "Admin"
    - [ ] Department/responsibility
    - [ ] Contact info
- [ ] Profile is responsive (works on mobile, tablet, desktop)
- [ ] Profile navigation breadcrumb shows context (e.g., "Temple > Members > Kunle")
- [ ] "Send Message" button visible on all profiles (opens messaging UI)
- [ ] Rate limiting on profile API (prevent scraping): 10 req/min per user
- [ ] Caching: Profile data cached for 5 minutes (reduce DB load)

**Technical Tasks:**

**Backend:**
- [ ] Create `backend/src/users/users.controller.ts`:
  ```typescript
  @Get('/:id')
  async getUserProfile(@Param('id') userId: string) {
    const user = await this.usersService.getProfileWithDetails(userId);
    if (!user) throw new NotFoundException('User not found');
    
    // Filter sensitive data based on requester's role
    return this.formatProfileResponse(user, req.user);
  }
  
  private formatProfileResponse(user: User, requester: User): any {
    const baseProfile = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      memberSince: user.createdAt,
      location: user.location,
    };
    
    switch (user.role) {
      case 'BABALAWO':
        return {
          ...baseProfile,
          credentials: user.credentials,
          specialties: user.specialties,
          experience: user.experience,
          temple: user.temple,
          hourlyRate: user.hourlyRate,
          availability: user.availability,
          reviews: user.reviews.slice(0, 5), // Most recent 5
          avgRating: user.avgRating,
          consultationCount: user.consultationCount,
          responseTime: user.responseTime,
        };
      case 'CLIENT':
        return {
          ...baseProfile,
          communitiesJoined: user.communities.length,
          eventsAttended: user.eventAttendances.length,
          forumContributions: user.forumPosts.length,
          purchasesCount: user.orders.length,
          guidancePlansCompleted: user.completedGuidancePlans.length,
        };
      case 'VENDOR':
        return {
          ...baseProfile,
          storeName: user.storeName,
          businessDescription: user.businessDescription,
          products: user.products.slice(0, 6), // Show 6 products
          avgRating: user.avgRating,
          ordersFullfilled: user.orders.filter(o => o.status === 'DELIVERED').length,
          returnPolicy: user.returnPolicy,
          contactInfo: user.contactInfo,
        };
      default:
        return baseProfile;
    }
  }
  ```
- [ ] Create `backend/src/users/users.service.ts`:
  ```typescript
  async getProfileWithDetails(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        temple: true,
        reviews: { orderBy: { createdAt: 'desc' } },
        communities: true,
        eventAttendances: true,
        forumPosts: true,
        orders: true,
        completedGuidancePlans: true,
        products: true,
      },
    });
    
    if (!user) return null;
    
    // Calculate additional metrics
    return {
      ...user,
      avgRating: this.calculateAvgRating(user.reviews),
      consultationCount: await this.countConsultations(userId),
      responseTime: await this.calculateResponseTime(userId),
    };
  }
  
  private calculateAvgRating(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }
  ```
- [ ] Add caching decorator to profile endpoint:
  ```typescript
  @Get('/:id')
  @CacheKey('user_profile_:id')
  @CacheTTL(300) // 5 minutes
  async getUserProfile(@Param('id') userId: string) {
    // ... existing code
  }
  ```
- [ ] Add rate limiting:
  ```typescript
  @Get('/:id')
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10 }) // 10 requests per minute
  async getUserProfile(@Param('id') userId: string) {
    // ... existing code
  }
  ```

**Frontend:**
- [ ] Create `frontend/src/pages/UserProfile.tsx`:
  ```typescript
  interface UserProfileProps {
    userId: string;
  }
  
  export const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    useEffect(() => {
      fetch(`/api/users/${userId}`)
        .then(r => {
          if (!r.ok) throw new Error('User not found');
          return r.json();
        })
        .then(setUser)
        .catch(err => {
          console.error(err);
          navigate('/404');
        })
        .finally(() => setLoading(false));
    }, [userId, navigate]);
    
    if (loading) return <Skeleton />;
    if (!user) return <NotFound />;
    
    return (
      <div className="profile-page">
        {/* Profile Header */}
        <div className="profile-header">
          <img src={user.avatar} alt={user.name} className="avatar-large" />
          <div className="header-info">
            <h1>{user.name}</h1>
            <span className="role-badge">{user.role}</span>
            <p className="location">{user.location}</p>
            <p className="member-since">Member since {format(user.memberSince, 'MMM yyyy')}</p>
          </div>
          <button className="send-message-btn">Send Message</button>
        </div>
        
        {/* Bio */}
        <section className="bio-section">
          <h2>About</h2>
          <p>{user.bio}</p>
        </section>
        
        {/* Role-Specific Sections */}
        {user.role === 'BABALAWO' && (
          <BabalawoprofileSection user={user} />
        )}
        {user.role === 'CLIENT' && (
          <ClientProfileSection user={user} />
        )}
        {user.role === 'VENDOR' && (
          <VendorProfileSection user={user} />
        )}
      </div>
    );
  };
  
  const BabalawoPprofileSection: React.FC<{ user: any }> = ({ user }) => (
    <>
      <section className="credentials-section">
        <h2>Credentials & Specialization</h2>
        <div className="specialties-grid">
          {user.specialties.map((s: string) => (
            <div key={s} className="specialty-tag">{s}</div>
          ))}
        </div>
        <p><strong>Experience:</strong> {user.experience}</p>
        <p><strong>Lineage:</strong> {user.credentials}</p>
      </section>
      
      <section className="temple-section">
        <h2>Temple Affiliation</h2>
        <div className="temple-card" onClick={() => navigate(`/temples/${user.temple.id}`)}>
          <h3>{user.temple.name}</h3>
          <p>{user.temple.location}</p>
        </div>
      </section>
      
      <section className="availability-section">
        <h2>Availability</h2>
        <AvailabilityCalendar availability={user.availability} />
      </section>
      
      <section className="reviews-section">
        <h2>Reviews ({user.reviews.length})</h2>
        <div className="rating">
          <StarRating rating={user.avgRating} /> <span>{user.avgRating}/5</span>
        </div>
        <div className="reviews-list">
          {user.reviews.slice(0, 5).map((review: any) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
        <a href={`/users/${user.id}/reviews`}>View all reviews →</a>
      </section>
      
      <section className="cta">
        <button size="lg">Book Consultation</button>
      </section>
    </>
  );
  ```
- [ ] Create `frontend/src/components/UserProfile/BabalawoprofileSection.tsx` with:
  - [ ] Credentials display
  - [ ] Specialties grid
  - [ ] Temple link
  - [ ] Availability calendar component
  - [ ] Reviews section with pagination
- [ ] Create `frontend/src/components/UserProfile/ClientProfileSection.tsx` with:
  - [ ] Communities joined list
  - [ ] Events attended count
  - [ ] Forum activity summary
- [ ] Create `frontend/src/components/UserProfile/VendorProfileSection.tsx` with:
  - [ ] Product grid (6 items)
  - [ ] Store rating
  - [ ] Return policy info
- [ ] Update routing in `App.tsx` to include user profile route:
  ```typescript
  <Route path="/users/:id" element={<UserProfile />} />
  ```
- [ ] Make all user name/avatar clickable (add click handlers throughout):
  ```typescript
  const handleUserClick = (userId: string) => {
    navigate(`/users/${userId}`);
  };
  ```

**Testing Checklist:**
- [ ] Manual test: Click babalawo name on Discover page → profile opens with all babalawo fields
- [ ] Manual test: Profile shows correct temple affiliation and link
- [ ] Manual test: Profile shows 5 most recent reviews
- [ ] Manual test: Profile responsive on mobile (iPhone SE)
- [ ] Manual test: Click "Book Consultation" → booking form opens (US-P0-2.1)
- [ ] API test: GET /api/users/:id returns correct role-specific fields
- [ ] API test: Rate limiting works (11th request returns 429)
- [ ] API test: Caching works (same user profile returned from cache)
- [ ] Load test: 100 concurrent profile views (cache + DB)
- [ ] Security test: User cannot see sensitive fields they shouldn't (admin fields hidden from clients)

**Definition of Done:**
- [ ] All acceptance criteria met
- [ ] All role-specific profile sections working
- [ ] Profile API returns role-appropriate fields
- [ ] Rate limiting and caching implemented
- [ ] Testing checklist passed
- [ ] Team confirms profiles enable trust-building

---

## EPIC P0-5: Direct Messaging System
**Business Value:** Enables private communication between users  
**Team:** Full Stack (1 BE + 1 FE)  
**Timeline:** 3 days  
**Story Points:** 12  
**Dependencies:** US-P0-4.1 (user profiles)

### User Story: US-P0-5.1 - Direct Messaging MVP
**As a** user  
**I want** to send and receive direct messages with other users  
**So that** I can communicate privately about consultations, products, or community matters  

**Priority:** P0  
**Story Points:** 12  
**Dependencies:** US-P0-4.1

**Acceptance Criteria:**
- [ ] "Send Message" button appears on user profiles
- [ ] Clicking "Send Message" opens a message input modal/drawer
- [ ] User can type message and send
- [ ] Message appears immediately in conversation (optimistic update)
- [ ] Recipient receives real-time notification of new message
- [ ] Message history persists (queryable via API)
- [ ] Users can see all their active message threads
- [ ] Clicking message thread opens conversation view
- [ ] Conversation shows message history chronologically
- [ ] New messages appear in real-time (WebSocket or polling)
- [ ] Typing indicator shown when other user is typing (nice-to-have)
- [ ] Delivered/Read status indicators on messages
- [ ] Can delete messages from own history (not recipient's)
- [ ] Archive or mute conversations
- [ ] Search within messages (phase 2)

**Technical Tasks:**

**Backend:**
- [ ] Create `backend/src/messaging/message.entity.ts` Prisma model:
  ```prisma
  model Message {
    id              String   @id @default(cuid())
    senderId        String
    sender          User     @relation("SentMessages", fields: [senderId], references: [id])
    recipientId     String
    recipient       User     @relation("ReceivedMessages", fields: [recipientId], references: [id])
    content         String
    status          MessageStatus @default(SENT) // SENT, DELIVERED, READ
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
    deletedAt       DateTime? // For soft deletes
  }
  
  enum MessageStatus {
    SENT
    DELIVERED
    READ
  }
  
  model MessageThread {
    id              String   @id @default(cuid())
    userId1         String
    user1           User     @relation("ThreadUser1", fields: [userId1], references: [id])
    userId2         String
    user2           User     @relation("ThreadUser2", fields: [userId2], references: [id])
    messages        Message[]
    lastMessage     Message?
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
    
    @@unique([userId1, userId2])
  }
  ```
- [ ] Create `backend/src/messaging/messaging.service.ts`:
  ```typescript
  @Injectable()
  export class MessagingService {
    constructor(private prisma: PrismaService) {}
    
    async sendMessage(
      senderId: string,
      recipientId: string,
      content: string
    ): Promise<Message> {
      // Create or get message thread
      const [user1, user2] = [senderId, recipientId].sort();
      const thread = await this.prisma.messageThread.upsert({
        where: { userId1_userId2: { userId1: user1, userId2: user2 } },
        create: { userId1: user1, userId2: user2 },
        update: {},
      });
      
      // Create message
      const message = await this.prisma.message.create({
        data: {
          senderId,
          recipientId,
          content,
          threadId: thread.id,
        },
        include: { sender: true, recipient: true },
      });
      
      // Publish WebSocket event to recipient
      this.socketService.emit(`user:${recipientId}:message`, {
        from: senderId,
        message: message.content,
        timestamp: message.createdAt,
      });
      
      return message;
    }
    
    async getMessageThread(userId: string, otherUserId: string): Promise<Message[]> {
      const [user1, user2] = [userId, otherUserId].sort();
      return this.prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: userId },
          ],
          deletedAt: null, // Exclude deleted messages
        },
        orderBy: { createdAt: 'asc' },
        include: { sender: true },
      });
    }
    
    async getUserThreads(userId: string): Promise<MessageThread[]> {
      return this.prisma.messageThread.findMany({
        where: {
          OR: [{ userId1: userId }, { userId2: userId }],
        },
        include: {
          user1: true,
          user2: true,
          lastMessage: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
    }
    
    async markAsRead(messageId: string): Promise<Message> {
      return this.prisma.message.update({
        where: { id: messageId },
        data: { status: 'READ', updatedAt: new Date() },
      });
    }
  }
  ```
- [ ] Create `backend/src/messaging/messaging.controller.ts`:
  ```typescript
  @Controller('api/messages')
  export class MessagingController {
    constructor(private messagingService: MessagingService) {}
    
    @Post()
    async sendMessage(@Req() req, @Body() dto: SendMessageDto) {
      return this.messagingService.sendMessage(
        req.user.id,
        dto.recipientId,
        dto.content
      );
    }
    
    @Get('threads')
    async getMyThreads(@Req() req) {
      return this.messagingService.getUserThreads(req.user.id);
    }
    
    @Get('threads/:otherUserId')
    async getThreadWithUser(
      @Req() req,
      @Param('otherUserId') otherUserId: string
    ) {
      return this.messagingService.getMessageThread(req.user.id, otherUserId);
    }
    
    @Patch(':messageId/read')
    async markAsRead(@Param('messageId') messageId: string) {
      return this.messagingService.markAsRead(messageId);
    }
  }
  ```
- [ ] Add WebSocket support for real-time messages:
  ```typescript
  @WebSocketGateway({ namespace: 'messages' })
  export class MessagingGateway implements OnGatewayConnection {
    constructor(private messagingService: MessagingService) {}
    
    @SubscribeMessage('sendMessage')
    async handleMessage(
      @MessageBody() data: { recipientId: string; content: string },
      @ConnectedSocket() client: Socket
    ) {
      const userId = client.data.userId;
      const message = await this.messagingService.sendMessage(
        userId,
        data.recipientId,
        data.content
      );
      
      // Emit to recipient if online
      client.to(`user:${data.recipientId}`).emit('newMessage', message);
      
      return { success: true, messageId: message.id };
    }
  }
  ```

**Frontend:**
- [ ] Create `frontend/src/context/MessagingContext.tsx`:
  ```typescript
  interface MessagingContextType {
    threads: MessageThread[];
    currentThread: Message[] | null;
    loading: boolean;
    sendMessage: (recipientId: string, content: string) => Promise<void>;
    loadThread: (otherUserId: string) => Promise<void>;
    loadThreads: () => Promise<void>;
  }
  
  export const MessagingContext = createContext<MessagingContextType>(null);
  
  export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    const [threads, setThreads] = useState<MessageThread[]>([]);
    const [currentThread, setCurrentThread] = useState<Message[] | null>(null);
    const [loading, setLoading] = useState(false);
    
    const sendMessage = async (recipientId: string, content: string) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, content }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const message = await response.json();
      
      // Update current thread
      setCurrentThread(prev => [...(prev || []), message]);
      
      // Reload threads to update last message
      await loadThreads();
    };
    
    const loadThread = async (otherUserId: string) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/messages/threads/${otherUserId}`);
        if (!response.ok) throw new Error('Failed to load thread');
        const messages = await response.json();
        setCurrentThread(messages);
      } finally {
        setLoading(false);
      }
    };
    
    const loadThreads = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/messages/threads');
        if (!response.ok) throw new Error('Failed to load threads');
        const data = await response.json();
        setThreads(data);
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <MessagingContext.Provider value={{ threads, currentThread, loading, sendMessage, loadThread, loadThreads }}>
        {children}
      </MessagingContext.Provider>
    );
  };
  ```
- [ ] Create `frontend/src/components/Messaging/MessageThread.tsx`:
  ```typescript
  interface MessageThreadProps {
    otherUserId: string;
    otherUserName: string;
  }
  
  export const MessageThread: React.FC<MessageThreadProps> = ({
    otherUserId,
    otherUserName,
  }) => {
    const { currentThread, loading, sendMessage } = useContext(MessagingContext);
    const [inputValue, setInputValue] = useState('');
    const currentUser = useAuth().user;
    const endOfMessages = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      // Load thread on mount
      // TODO: load via context
    }, [otherUserId]);
    
    useEffect(() => {
      // Auto-scroll to bottom when new messages arrive
      endOfMessages.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentThread]);
    
    const handleSend = async () => {
      if (!inputValue.trim()) return;
      
      await sendMessage(otherUserId, inputValue);
      setInputValue('');
    };
    
    if (loading && !currentThread) return <Skeleton />;
    
    return (
      <div className="message-thread">
        <div className="thread-header">
          <h2>{otherUserName}</h2>
        </div>
        
        <div className="messages-list">
          {(currentThread || []).map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.senderId === currentUser.id ? 'sent' : 'received'}`}
            >
              <div className="message-content">{msg.content}</div>
              <div className="message-time">
                {format(new Date(msg.createdAt), 'HH:mm')}
              </div>
              <div className="message-status">{msg.status}</div>
            </div>
          ))}
          <div ref={endOfMessages} />
        </div>
        
        <div className="message-input">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
          />
          <button onClick={handleSend} disabled={!inputValue.trim()}>
            Send
          </button>
        </div>
      </div>
    );
  };
  ```
- [ ] Create `frontend/src/components/Messaging/MessagesList.tsx` for listing all threads
- [ ] Add "Send Message" button to user profile:
  ```typescript
  <button onClick={() => navigate(`/messages/${user.id}`)}>
    Send Message
  </button>
  ```
- [ ] Add Messages page: `frontend/src/pages/MessagesPage.tsx`
  - [ ] Split screen: threads list on left, current thread on right
  - [ ] Mobile-responsive (toggle between list and thread)
  - [ ] Show unread badge on threads with unread messages
  - [ ] Search/filter threads

**Testing Checklist:**
- [ ] Manual test: Send message from client to babalawo profile
- [ ] Manual test: Recipient sees new message in real-time (open both browsers)
- [ ] Manual test: Message persists after page reload
- [ ] Manual test: Message thread shows all previous messages chronologically
- [ ] Manual test: Mark as read button updates status
- [ ] API test: POST /api/messages creates message and returns ID
- [ ] API test: GET /api/messages/threads/:otherUserId returns message history
- [ ] API test: Only thread participants can view thread (403 for others)
- [ ] Load test: 100 concurrent messages per user

**Definition of Done:**
- [ ] All acceptance criteria met
- [ ] Real-time messaging works via WebSocket
- [ ] Testing checklist passed
- [ ] Team confirms messaging enables user communication

---

## EPIC P0-6: Event Management System
**Business Value:** Shows temple events; enables community engagement  
**Team:** 1 Frontend Dev  
**Timeline:** 2 days  
**Story Points:** 8  
**Dependencies:** US-P0-3.1 (demo data)

### User Story: US-P0-6.1 - Professional Event Pages
**As a** user  
**I want** to view detailed event pages when clicking event listings  
**So that** I can understand event details and decide whether to attend  

**Priority:** P0  
**Story Points:** 8  
**Dependencies:** US-P0-3.1

**Acceptance Criteria:**
- [ ] Clicking any event in the app shows a detailed event page
- [ ] Event page displays:
  - [ ] Event title and hero image
  - [ ] Event date, time, duration
  - [ ] Location (in-person or online)
  - [ ] Temple affiliation with link
  - [ ] Full event description
  - [ ] Organizer info with link to profile
  - [ ] Attendee count and list of attendee avatars
  - [ ] "Register" or "RSVP" button (changes state based on user attendance)
  - [ ] "Add to Calendar" button (Google Calendar, Outlook, Apple Calendar)
  - [ ] Share buttons (social media)
  - [ ] Related events section (same temple, similar topic)
- [ ] Event page URL is shareable and works for non-logged-in users
- [ ] Clicking "Register" adds user to attendee list and shows confirmation
- [ ] Clicking "Unregister" removes user from attendee list
- [ ] User sees their attendance status on the page
- [ ] Event routing no longer returns "Event not found" errors
- [ ] Page is responsive (mobile, tablet, desktop)

**Technical Tasks:**
- [ ] Create `frontend/src/features/events/EventDetail.tsx`:
  ```typescript
  interface EventDetailProps {
    eventId: string;
  }
  
  export const EventDetail: React.FC<EventDetailProps> = ({ eventId }) => {
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const navigate = useNavigate();
    const currentUser = useAuth()?.user;
    
    useEffect(() => {
      fetch(`/api/events/${eventId}`)
        .then(r => {
          if (!r.ok) throw new Error('Event not found');
          return r.json();
        })
        .then(event => {
          setEvent(event);
          if (currentUser) {
            setIsRegistered(event.attendees.some(a => a.id === currentUser.id));
          }
        })
        .catch(err => {
          console.error(err);
          navigate('/404');
        })
        .finally(() => setLoading(false));
    }, [eventId, currentUser, navigate]);
    
    const handleRegister = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: isRegistered ? 'DELETE' : 'POST',
      });
      
      if (!response.ok) {
        console.error('Registration failed');
        return;
      }
      
      setIsRegistered(!isRegistered);
      // Refresh event to update attendee count
      const updatedEvent = await fetch(`/api/events/${eventId}`).then(r => r.json());
      setEvent(updatedEvent);
    };
    
    if (loading) return <Skeleton />;
    if (!event) return <NotFound />;
    
    return (
      <div className="event-detail-page">
        {/* Hero Image */}
        <div className="hero-section">
          <img src={event.heroImage} alt={event.title} className="hero-image" />
          <div className="hero-overlay">
            <h1>{event.title}</h1>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="event-content">
          {/* Left Column: Details */}
          <div className="left-column">
            <section className="date-time-location">
              <div className="detail-item">
                <Icon>📅</Icon>
                <div>
                  <strong>Date & Time</strong>
                  <p>{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</p>
                  <p>{event.time} - {event.endTime}</p>
                </div>
              </div>
              
              <div className="detail-item">
                <Icon>📍</Icon>
                <div>
                  <strong>Location</strong>
                  <p>{event.isOnline ? 'Online' : event.location}</p>
                  {event.isOnline && <p className="online-badge">Virtual Event</p>}
                </div>
              </div>
            </section>
            
            <section className="description">
              <h2>About This Event</h2>
              <p>{event.description}</p>
            </section>
            
            <section className="organizer">
              <h2>Organized By</h2>
              <div className="organizer-card" onClick={() => navigate(`/users/${event.organizer.id}`)}>
                <img src={event.organizer.avatar} alt={event.organizer.name} />
                <div>
                  <strong>{event.organizer.name}</strong>
                  <p>{event.organizer.role}</p>
                </div>
              </div>
            </section>
            
            <section className="temple-affiliation">
              <h2>Temple</h2>
              <div className="temple-link" onClick={() => navigate(`/temples/${event.temple.id}`)}>
                <h3>{event.temple.name}</h3>
                <p>{event.temple.location}</p>
              </div>
            </section>
          </div>
          
          {/* Right Column: Sidebar */}
          <div className="right-column">
            <div className="registration-card">
              <button
                onClick={handleRegister}
                className={isRegistered ? 'unregister' : 'register'}
              >
                {isRegistered ? '✓ Registered' : 'Register'}
              </button>
              
              <div className="attendees-preview">
                <h3>Attendees ({event.attendees.length})</h3>
                <div className="avatars-grid">
                  {event.attendees.slice(0, 12).map(attendee => (
                    <img
                      key={attendee.id}
                      src={attendee.avatar}
                      alt={attendee.name}
                      title={attendee.name}
                      className="attendee-avatar"
                    />
                  ))}
                  {event.attendees.length > 12 && (
                    <div className="more-count">+{event.attendees.length - 12}</div>
                  )}
                </div>
                <a href={`#attendees`}>View all attendees</a>
              </div>
              
              <div className="share-buttons">
                <button className="share-btn twitter">Share</button>
                <button className="share-btn facebook">Share</button>
                <button className="share-btn copy">Copy Link</button>
              </div>
              
              <button className="add-calendar-btn">Add to Calendar</button>
            </div>
          </div>
        </div>
        
        {/* Related Events */}
        <section className="related-events">
          <h2>Related Events</h2>
          <div className="events-grid">
            {event.relatedEvents?.map(e => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      </div>
    );
  };
  ```
- [ ] Create `frontend/src/components/Events/EventCard.tsx` (reusable card component)
- [ ] Update `frontend/src/App.tsx` routing to include event detail route:
  ```typescript
  <Route path="/events/:id" element={<EventDetail />} />
  ```
- [ ] Fix event click handlers throughout the app:
  - [ ] Temple profile events section: make events clickable
  - [ ] Home feed events: make events clickable
  - [ ] Events listing page: make events clickable
  - [ ] Each should use `navigate(`/events/${event.id}`)`
- [ ] Backend: Ensure `/api/events/:id` endpoint works:
  ```typescript
  @Get('/:id')
  async getEvent(@Param('id') eventId: string) {
    const event = await this.eventsService.getEventWithDetails(eventId);
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }
  
  async getEventWithDetails(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        temple: true,
        organizer: true,
        attendees: true,
        relatedEvents: { take: 6 },
      },
    });
  }
  ```
- [ ] Backend: Add event registration endpoints:
  ```typescript
  @Post('/:id/register')
  async registerForEvent(@Param('id') eventId: string, @Req() req) {
    return this.eventsService.registerUserForEvent(eventId, req.user.id);
  }
  
  @Delete('/:id/register')
  async unregisterFromEvent(@Param('id') eventId: string, @Req() req) {
    return this.eventsService.unregisterUserFromEvent(eventId, req.user.id);
  }
  ```
- [ ] Style event page with CSS/Tailwind:
  - [ ] Hero section with overlay
  - [ ] Two-column layout (left content, right sidebar)
  - [ ] Card styling for organizer, temple, attendees
  - [ ] Responsive breakpoints (mobile, tablet, desktop)
  - [ ] Light theme (no dark backgrounds)

**Testing Checklist:**
- [ ] Manual test: Click event from temple page → event detail page opens
- [ ] Manual test: Click event from events listing → event detail page opens
- [ ] Manual test: Register for event → button changes to "✓ Registered"
- [ ] Manual test: Unregister from event → button changes to "Register"
- [ ] Manual test: Attendee count updates after registration
- [ ] Manual test: Event page URL is shareable (copy and paste link)
- [ ] Manual test: Page responsive on mobile (iPhone SE)
- [ ] API test: GET /api/events/:id returns correct event with all fields
- [ ] API test: POST /api/events/:id/register adds user to attendees
- [ ] API test: DELETE /api/events/:id/register removes user from attendees
- [ ] API test: GET /api/events/:invalidId returns 404

**Definition of Done:**
- [ ] All acceptance criteria met
- [ ] Event detail page displays all required information
- [ ] Registration system works
- [ ] Testing checklist passed
- [ ] Team confirms event pages enable demo scenario

---

# PART 2: P1 LAUNCH-REQUIRED (Feb 29, 2026)

## EPIC P1-1: Marketplace & Payment Flow Completion
**Business Value:** Core revenue stream; enables vendors and clients to transact  
**Team:** Full Stack (1 BE + 1 FE)  
**Timeline:** 5 days  
**Story Points:** 20  
**Dependencies:** US-P0-3.1 (demo data), US-P0-2.1 (booking flow)

### User Story: US-P1-1.1 - Complete Marketplace Product Flow
**As a** client  
**I want** to browse products, add to cart, and checkout  
**So that** I can purchase sacred artifacts from verified vendors  

**Priority:** P1  
**Story Points:** 13  
**Dependencies:** US-P0-3.1

**Acceptance Criteria:**
- [ ] Marketplace homepage shows product grid (12 items per page)
- [ ] Each product card shows:
  - [ ] Product image
  - [ ] Product name
  - [ ] Vendor name
  - [ ] Price
  - [ ] Rating (Àṣẹ stars)
  - [ ] "Add to Cart" button
- [ ] Clicking product card opens product detail page:
  - [ ] Full product image gallery
  - [ ] Detailed description
  - [ ] Vendor info with link
  - [ ] Price and availability
  - [ ] Quantity selector
  - [ ] "Add to Cart" button
  - [ ] Related products section
  - [ ] Customer reviews
- [ ] Cart persists across sessions (localStorage + API sync)
- [ ] Cart shows:
  - [ ] Item count badge
  - [ ] List of items with prices
  - [ ] Subtotal, tax, shipping
  - [ ] "Proceed to Checkout" button
- [ ] Checkout flow collects:
  - [ ] Shipping address
  - [ ] Payment method
  - [ ] Order summary
  - [ ] Order confirmation with tracking number
- [ ] Order history shows:
  - [ ] List of all orders with status
  - [ ] Order details (items, cost, shipping)
  - [ ] Tracking link
  - [ ] Leave review button
- [ ] Vendor storefront shows:
  - [ ] All vendor's products
  - [ ] Vendor info
  - [ ] Vendor reviews
  - [ ] "Shop" button to full storefront
- [ ] Search and filter:
  - [ ] Filter by vendor
  - [ ] Filter by price range
  - [ ] Sort by newest, price, rating
  - [ ] Search by keyword

**Technical Tasks:**

[Content would continue with detailed technical tasks for backend and frontend...]

---

## EPIC P1-2: Guidance Plan UI & Delivery System
**Business Value:** Critical for consultation flow; enables clients to receive spiritual guidance  
**Team:** 1 Frontend Dev + 1 Backend Dev  
**Timeline:** 4 days  
**Story Points:** 18  
**Dependencies:** US-P0-2.1 (booking), US-P0-1.1 (dashboards)

### User Story: US-P1-2.1 - Guidance Plan Display & Tracking
**As a** client who received a consultation  
**I want** to view my guidance plan and track completion of recommended actions  
**So that** I can follow through on the babalawo's spiritual guidance  

**Priority:** P1  
**Story Points:** 13  
**Dependencies:** US-P0-2.1

**Acceptance Criteria:**
- [ ] After consultation is marked complete, client receives notification
- [ ] Client can view guidance plan in "My Guidance Plans" section
- [ ] Guidance plan displays:
  - [ ] Babalawo name and consultation date
  - [ ] Plan title/summary
  - [ ] Prescribed rituals (with detailed instructions)
  - [ ] Recommended readings (with links to resources)
  - [ ] Herbs/items to use (with sourcing recommendations)
  - [ ] Timeframe for implementation
  - [ ] Progress tracking checklist
  - [ ] "Questions?" button to message babalawo
- [ ] Client can mark items as completed
- [ ] Progress bar shows overall plan completion percentage
- [ ] Can set reminders for recommended actions
- [ ] Share plan with trusted community members
- [ ] Download/print plan as PDF
- [ ] Plan status: Active, In Progress, Completed, Expired

**Technical Tasks:**

[Content would continue...]

---

## EPIC P1-3: UI/UX Light Theme & Design Polish
**Business Value:** Professional presentation for launch; accessibility  
**Team:** 1 Frontend Dev + Designer  
**Timeline:** 3 days  
**Story Points:** 10  
**Dependencies:** None (can parallelize)

### User Story: US-P1-3.1 - Consistent Light Theme Implementation
**As a** user  
**I want** a consistently light, accessible interface  
**So that** I can comfortably use the app without eye strain  

**Priority:** P1  
**Story Points:** 10  
**Dependencies:** None

**Acceptance Criteria:**
- [ ] No dark backgrounds anywhere in the app
- [ ] All text meets WCAG 2.1 AA contrast ratio (4.5:1 minimum)
- [ ] Theme colors consistent across all pages and components
- [ ] Light grays for borders and secondary elements
- [ ] White or light cream backgrounds for content areas
- [ ] Color palette:
  - [ ] Primary: Gold/Àṣẹ (#D4AF37 or similar)
  - [ ] Secondary: Deep Blue (#1E3A8A or similar)
  - [ ] Neutral: Light Gray (#F3F4F6)
  - [ ] Text: Dark Gray/Black (#1F2937)
  - [ ] Accents: Green for success (#10B981), Red for errors (#EF4444)
- [ ] All components render correctly with light theme
- [ ] Navigation menus have sufficient contrast
- [ ] Buttons and CTAs are visually distinct
- [ ] Hover and active states work correctly
- [ ] Responsive design works on all breakpoints
- [ ] Mobile: text is readable without zooming
- [ ] Tablet: layout adapts appropriately
- [ ] Desktop: full-width layout optimized

**Technical Tasks:**

[Content would continue with detailed technical tasks...]

---

# PART 3: P2 POST-LAUNCH FEATURES

## EPIC P2-1: Advanced Search & Discovery
**Business Value:** Enables users to find relevant babalawos, products, content  
**Story Points:** 16  
**Timeline:** TBD (post-MVP)

### Features:
- Multi-facet filtering (specialty, temple, location, price)
- Full-text search with autocomplete
- Diacritics support (Yoruba characters)
- Search history and saved searches
- Trending searches
- Search analytics

---

## EPIC P2-2: Ancestral Tree / Spiritual Lineage
**Business Value:** High engagement; strong network effects; differentiation  
**Story Points:** 21  
**Timeline:** TBD (post-MVP)

### Features:
- Visual family tree builder
- Spiritual lineage connections
- Ancestor profiles with stories
- Timeline of spiritual events
- Tree sharing and collaboration
- Privacy controls

**Why This Over Spiritual Journey:**
- Higher engagement (genealogy is addictive)
- Network effects (1 tree connects multiple people)
- Unique to Ifá community (none of competitors have this)
- Monetization path (premium features, print books)
- Acts as implicit verification (family trees validate lineage)

---

## EPIC P2-3: Academy Course Enrollment & Curriculum
**Business Value:** Passive income; knowledge preservation; community building; thought leadership  
**Team:** 2 Devs (1 BE + 1 FE) + Curriculum Designer  
**Timeline:** TBD (post-MVP, ~6-8 weeks)  
**Story Points:** 45  
**Dependencies:** US-P0-1.1 (dashboards), User authentication

### Context
The Academy is the knowledge preservation arm of Ilé Àṣẹ. Rather than generic content, we offer a curated curriculum exploring the intersection of Ifá wisdom, spirituality, science, and philosophy. Courses are taught by recognized masters and practitioners. This epic outlines the 12 core courses that form the foundation of the Academy.

### Core Curriculum: 12 Foundational Courses

| Course | Focus | Duration | Level | Instructor Type |
|--------|-------|----------|-------|-----------------|
| **Consciousness** | Understanding the nature of awareness, consciousness across cultures, scientific perspectives | 8 weeks | Intermediate | Philosopher + Spiritual Teacher |
| **Imagination & Intuition** | Developing inner vision, cultivating intuition, creative spiritual practice | 6 weeks | Beginner | Babalawo + Creative Practitioner |
| **The Immaterial/Spirit** | Spirit realms, non-physical entities, communication with unseen worlds | 10 weeks | Advanced | Babalawo + Ancestral Keeper |
| **Religious Truth** | Comparative religion, Yoruba cosmology, universal spiritual principles | 8 weeks | Intermediate | Elder + Religious Scholar |
| **Kindness** | Ubuntu philosophy, compassion practice, service to community | 4 weeks | Beginner | Community Leader |
| **Happiness** | Joy cultivation, abundance mindset, spiritual fulfillment | 5 weeks | Beginner | Life Coach + Spiritual Counselor |
| **Love** | Divine love, relationships, self-love, healing practices | 6 weeks | Intermediate | Relationship Guide + Healer |
| **Telepathy** | Energetic communication, mental projection, connection practices | 7 weeks | Advanced | Meditation Master |
| **Connection** | Unity consciousness, interconnectedness, web of life | 6 weeks | Intermediate | Naturalist + Spiritual Guide |
| **Community** | Building sacred communities, circles, collective practice | 5 weeks | Beginner | Circle Facilitator |
| **Intelligence of Animals & Plants** | Nature wisdom, plant medicine, animal teachers, biomimicry | 8 weeks | Intermediate | Herbalist + Naturalist |
| **Ancient Architecture & Civilizations** | Sacred geometry, civilizations (Egypt, Yorubaland, Mesoamerica), temple systems | 9 weeks | Intermediate | Historian + Architect |

---

### User Story: US-P2-3.1 - Academy Course Catalog & Enrollment
**As a** user interested in spiritual knowledge  
**I want** to browse and enroll in Academy courses  
**So that** I can deepen my understanding of Ifá wisdom and spiritual principles  

**Priority:** P2  
**Story Points:** 18  
**Dependencies:** US-P0-1.1

**Acceptance Criteria:**
- [ ] Academy home page shows:
  - [ ] Course catalog grid (12 courses visible)
  - [ ] Filter by level (Beginner, Intermediate, Advanced)
  - [ ] Filter by duration (4-10 weeks)
  - [ ] Search by keyword
  - [ ] Featured course carousel
  - [ ] "My Courses" quick link if logged in
- [ ] Each course card displays:
  - [ ] Course title
  - [ ] Instructor name(s) and avatar(s)
  - [ ] Duration (weeks) and weekly time commitment
  - [ ] Level badge
  - [ ] Course description (2-3 lines)
  - [ ] Student count enrolled
  - [ ] Average rating
  - [ ] "Enroll" or "Enrolled" button
  - [ ] Price (free or paid)
- [ ] Course detail page shows:
  - [ ] Full course description and objectives
  - [ ] Complete curriculum breakdown (week-by-week modules)
  - [ ] Instructor bios and credentials
  - [ ] Student testimonials
  - [ ] Prerequisite courses (if any)
  - [ ] Related courses recommendations
  - [ ] Enrollment button with enrollment confirmation
  - [ ] FAQ section
  - [ ] Share course on social media
- [ ] Enrollment flow:
  - [ ] Click "Enroll" button
  - [ ] Review enrollment terms
  - [ ] Confirm enrollment (for free courses) or proceed to payment (for paid)
  - [ ] Receive confirmation email with course access link
  - [ ] Course appears in "My Courses" dashboard
  - [ ] Can start learning immediately
  - [ ] Can download course materials
  - [ ] Can cancel enrollment within 7 days for refund (if paid)
- [ ] User dashboard shows:
  - [ ] "My Courses" section
  - [ ] Progress bar for each enrolled course
  - [ ] Current module/week indicator
  - [ ] Instructor contact info for Q&A
  - [ ] Course completion certificate option
  - [ ] Share certificate on profile/social
- [ ] Search & discovery:
  - [ ] Full-text search across course titles, descriptions, instructor names
  - [ ] Filter by level, duration, price
  - [ ] Sort by newest, most popular, highest rated
  - [ ] Trending courses section
  - [ ] "Because you viewed..." recommendations
- [ ] Responsive design works on all devices
- [ ] Course data persists (enrollment history retained)

**Technical Tasks:**

**Backend:**
- [ ] Create `backend/src/academy/course.entity.ts` Prisma models:
  ```prisma
  model Course {
    id              String   @id @default(cuid())
    title           String   @unique
    slug            String   @unique
    description     String
    fullDescription String   @db.Text
    objectives      String[] // Array of learning objectives
    level           CourseLevel // BEGINNER, INTERMEDIATE, ADVANCED
    duration        Int      // in weeks
    weeklyHours     Int      // hours per week
    price           Float    @default(0) // 0 for free
    instructorIds   String[]
    instructors     User[]   @relation("CourseInstructors")
    modules         Module[]
    students        User[]   @relation("StudentCourses")
    enrollments     Enrollment[]
    ratings         CourseRating[]
    avgRating       Float    @default(0)
    enrollmentCount Int      @default(0)
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
  }
  
  model Module {
    id              String   @id @default(cuid())
    courseId        String
    course          Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
    weekNumber      Int
    title           String
    description     String
    content         String   @db.Text // HTML or markdown
    videoUrl        String?
    resources       Resource[]
    assignments     Assignment[]
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
    
    @@unique([courseId, weekNumber])
  }
  
  model Resource {
    id              String   @id @default(cuid())
    moduleId        String
    module          Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
    title           String
    type            String   // PDF, VIDEO, LINK, BOOK
    url             String
    description     String?
  }
  
  model Assignment {
    id              String   @id @default(cuid())
    moduleId        String
    module          Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
    title           String
    description     String   @db.Text
    dueDate         DateTime
    submissions     Submission[]
  }
  
  model Submission {
    id              String   @id @default(cuid())
    assignmentId    String
    assignment      Assignment @relation(fields: [assignmentId], references: [id])
    studentId       String
    student         User     @relation(fields: [studentId], references: [id])
    content         String   @db.Text
    feedback        String?
    grade           Float?
    submittedAt     DateTime @default(now())
    gradedAt        DateTime?
  }
  
  model Enrollment {
    id              String   @id @default(cuid())
    courseId        String
    course          Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
    studentId       String
    student         User     @relation("StudentEnrollments", fields: [studentId], references: [id])
    status          EnrollmentStatus @default(ACTIVE) // ACTIVE, COMPLETED, DROPPED
    enrolledAt      DateTime @default(now())
    completedAt     DateTime?
    currentWeek     Int      @default(1)
    progressPercent Int      @default(0)
    certificateUrl  String?
    
    @@unique([courseId, studentId])
  }
  
  model CourseRating {
    id              String   @id @default(cuid())
    courseId        String
    course          Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
    studentId       String
    student         User     @relation(fields: [studentId], references: [id])
    rating          Int      // 1-5
    review          String?
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
    
    @@unique([courseId, studentId])
  }
  
  enum CourseLevel {
    BEGINNER
    INTERMEDIATE
    ADVANCED
  }
  
  enum EnrollmentStatus {
    ACTIVE
    COMPLETED
    DROPPED
  }
  ```
- [ ] Create `backend/src/academy/academy.service.ts`:
  ```typescript
  @Injectable()
  export class AcademyService {
    constructor(private prisma: PrismaService) {}
    
    async getAllCourses(filters?: {
      level?: CourseLevel;
      minDuration?: number;
      maxDuration?: number;
      search?: string;
    }): Promise<Course[]> {
      const where = {};
      if (filters?.level) where['level'] = filters.level;
      if (filters?.search) {
        where['OR'] = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
      
      return this.prisma.course.findMany({
        where,
        include: { instructors: true, enrollments: true },
        orderBy: { createdAt: 'desc' },
      });
    }
    
    async getCourseDetail(courseId: string): Promise<any> {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          instructors: true,
          modules: { include: { resources: true, assignments: true } },
          ratings: { include: { student: true } },
          _count: { select: { enrollments: true } },
        },
      });
      
      if (!course) return null;
      
      return {
        ...course,
        enrollmentCount: course._count.enrollments,
      };
    }
    
    async enrollStudent(courseId: string, studentId: string): Promise<Enrollment> {
      // Check if already enrolled
      const existing = await this.prisma.enrollment.findUnique({
        where: { courseId_studentId: { courseId, studentId } },
      });
      
      if (existing) throw new ConflictException('Already enrolled in this course');
      
      const enrollment = await this.prisma.enrollment.create({
        data: {
          courseId,
          studentId,
          status: 'ACTIVE',
        },
        include: { course: true },
      });
      
      // Increment course enrollment count
      await this.prisma.course.update({
        where: { id: courseId },
        data: { enrollmentCount: { increment: 1 } },
      });
      
      return enrollment;
    }
    
    async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
      return this.prisma.enrollment.findMany({
        where: { studentId },
        include: { course: { include: { instructors: true, modules: true } } },
        orderBy: { enrolledAt: 'desc' },
      });
    }
  }
  ```
- [ ] Create `backend/src/academy/academy.controller.ts`:
  ```typescript
  @Controller('api/academy')
  export class AcademyController {
    constructor(private academyService: AcademyService) {}
    
    @Get('courses')
    async getCourses(@Query() query: { level?: string; search?: string }) {
      return this.academyService.getAllCourses({
        level: query.level as CourseLevel,
        search: query.search,
      });
    }
    
    @Get('courses/:id')
    async getCourseDetail(@Param('id') courseId: string) {
      const course = await this.academyService.getCourseDetail(courseId);
      if (!course) throw new NotFoundException('Course not found');
      return course;
    }
    
    @Post('courses/:id/enroll')
    async enrollInCourse(@Param('id') courseId: string, @Req() req) {
      return this.academyService.enrollStudent(courseId, req.user.id);
    }
    
    @Get('my-courses')
    async getMyEnrollments(@Req() req) {
      return this.academyService.getStudentEnrollments(req.user.id);
    }
  }
  ```
- [ ] Create seed data with all 12 courses in `backend/src/seeding/academy-courses.ts`:
  ```typescript
  export const ACADEMY_COURSES = [
    {
      title: 'Consciousness',
      slug: 'consciousness',
      level: 'INTERMEDIATE',
      duration: 8,
      weeklyHours: 3,
      price: 0,
      description: 'Understanding the nature of awareness and consciousness across cultures',
      fullDescription: 'Explore consciousness from multiple perspectives: Yoruba cosmology, neuroscience, philosophy, and spiritual practice. Learn how awareness manifests in different traditions and practices to expand your own consciousness.',
      objectives: [
        'Understand consciousness in Yoruba philosophy',
        'Explore scientific perspectives on awareness',
        'Practice meditation and contemplative techniques',
        'Study consciousness in different cultures',
      ],
    },
    {
      title: 'Imagination & Intuition',
      slug: 'imagination-intuition',
      level: 'BEGINNER',
      duration: 6,
      weeklyHours: 2,
      price: 0,
      description: 'Developing inner vision, cultivating intuition, and creative spiritual practice',
      objectives: [
        'Activate your inner vision',
        'Develop intuitive abilities',
        'Use imagination in spiritual practice',
        'Create from inspired consciousness',
      ],
    },
    // ... continue for all 12 courses
  ];
  ```

**Frontend:**
- [ ] Create `frontend/src/pages/Academy/AcademyHome.tsx`:
  - [ ] Course grid with filters
  - [ ] Featured course carousel
  - [ ] Search functionality
  - [ ] Level/duration filters
- [ ] Create `frontend/src/pages/Academy/CourseDetail.tsx`:
  - [ ] Course info, instructor bios
  - [ ] Curriculum breakdown by week
  - [ ] Student testimonials
  - [ ] Enroll button
  - [ ] Related courses
- [ ] Create `frontend/src/pages/Academy/MyCourses.tsx`:
  - [ ] List of enrolled courses
  - [ ] Progress bars per course
  - [ ] Quick links to continue learning
  - [ ] Certificate download buttons
- [ ] Create `frontend/src/components/CourseCard.tsx`
- [ ] Add Academy navigation item to role-based navigation
- [ ] Update client dashboard to show "My Courses" section

**Testing Checklist:**
- [ ] GET /api/academy/courses returns all 12 courses
- [ ] GET /api/academy/courses?level=BEGINNER filters correctly
- [ ] GET /api/academy/courses/:id returns course with modules and instructor details
- [ ] POST /api/academy/courses/:id/enroll creates enrollment
- [ ] GET /api/academy/my-courses returns student's enrollments
- [ ] Cannot enroll twice in same course (409 conflict)
- [ ] Course detail page loads and displays all information
- [ ] Search works across course titles and descriptions
- [ ] Mobile responsive design works

**Definition of Done:**
- [ ] All 12 courses created with complete curriculum data
- [ ] Enrollment system functional
- [ ] Course catalog and detail pages built
- [ ] Testing checklist passed

---

### User Story: US-P2-3.2 - Course Learning Experience & Progress Tracking
**As a** student enrolled in an Academy course  
**I want** to access course materials, track my progress, and complete modules  
**So that** I can learn at my own pace and earn a completion certificate  

**Priority:** P2  
**Story Points:** 15  
**Dependencies:** US-P2-3.1

**Acceptance Criteria:**
- [ ] Enrolled students can access course materials:
  - [ ] View current week's module content
  - [ ] Navigate between weeks (next/previous)
  - [ ] See complete course syllabus with progress indicators
  - [ ] Download module materials (PDFs, guides)
  - [ ] Watch embedded videos if applicable
  - [ ] Access recommended resources and links
- [ ] Progress tracking:
  - [ ] System marks modules as "In Progress", "Completed", "Not Started"
  - [ ] Progress bar shows overall course completion percentage
  - [ ] Estimated time to completion displayed
  - [ ] Current week highlighted in syllabus
  - [ ] Can set personal reminders for assignments
- [ ] Assignments:
  - [ ] View assignment details and due dates
  - [ ] Submit assignments (text, files, links)
  - [ ] Receive feedback from instructors
  - [ ] See grade/score when available
  - [ ] Revise and resubmit if allowed
- [ ] Community features:
  - [ ] Discussion forum per course
  - [ ] Ask questions to instructor
  - [ ] See Q&A from other students
  - [ ] Study groups (organize with other students)
- [ ] Completion & Certificate:
  - [ ] When all modules completed, issue completion certificate
  - [ ] Certificate includes course name, instructor, completion date
  - [ ] Download certificate as PDF
  - [ ] Share certificate on profile/LinkedIn
  - [ ] Add to portfolio
- [ ] Responsive design works on all devices
- [ ] Offline access to downloaded materials

**Technical Tasks:**
- [ ] Create `frontend/src/pages/Academy/CourseLearning.tsx` component
  - [ ] Display current module content
  - [ ] Module navigation (next/previous week)
  - [ ] Progress bar and completion percentage
  - [ ] Resource download buttons
  - [ ] Sidebar with course syllabus
- [ ] Create `frontend/src/components/ModuleContent.tsx`
  - [ ] Render module description
  - [ ] Embed videos if applicable
  - [ ] Display resources list with download links
  - [ ] Mark module as complete button
- [ ] Create `frontend/src/components/AssignmentSubmission.tsx`
  - [ ] Assignment details
  - [ ] Submission form (text input, file upload)
  - [ ] View feedback from instructor
  - [ ] View grade/score
- [ ] Create `frontend/src/components/CompletionCertificate.tsx`
  - [ ] Display certificate preview
  - [ ] Download as PDF button
  - [ ] Share certificate
- [ ] Backend: Add progress tracking endpoints
  ```typescript
  PATCH /api/academy/enrollments/:id/progress
  GET  /api/academy/enrollments/:id/certificate
  POST /api/academy/modules/:id/complete
  ```

---

### User Story: US-P2-3.3 - Instructor Dashboard & Course Management
**As an** instructor or course creator  
**I want** to manage my course content, view student progress, and grade assignments  
**So that** I can deliver high-quality education and support my students  

**Priority:** P2  
**Story Points:** 12  
**Dependencies:** US-P2-3.1, US-P2-3.2

**Acceptance Criteria:**
- [ ] Instructor dashboard shows:
  - [ ] List of courses taught
  - [ ] Enrollment numbers per course
  - [ ] Student engagement metrics
  - [ ] Pending assignments to grade
  - [ ] Course performance (avg rating, completion rate)
- [ ] Course management:
  - [ ] Edit course details (description, price, level)
  - [ ] Add/edit/delete modules and content
  - [ ] Upload videos and resources
  - [ ] Create and manage assignments
  - [ ] Set due dates for assignments
  - [ ] View student submissions
  - [ ] Grade assignments and provide feedback
  - [ ] Send announcements to enrolled students
- [ ] Student analytics:
  - [ ] View enrollment list with progress
  - [ ] See which students are at risk (low engagement)
  - [ ] Track time spent per module
  - [ ] Completion timeline chart
  - [ ] Student performance report
  - [ ] Export data for analysis
- [ ] Communication:
  - [ ] Direct messaging with students
  - [ ] Respond to assignment questions
  - [ ] Post course announcements
  - [ ] Email notifications to students
  - [ ] Discussion moderation tools
- [ ] Course templates:
  - [ ] Duplicate existing course structure
  - [ ] Save course as template for reuse
  - [ ] Version control for course content

**Technical Tasks:**
- [ ] Create instructor role and permissions
- [ ] Build `frontend/src/pages/Instructor/InstructorDashboard.tsx`
- [ ] Build course management interface
- [ ] Build assignment grading interface
- [ ] Backend endpoints for instructor operations

---

## EPIC P2-4: Tutor Marketplace

## EPIC P2-4: Tutor Marketplace
**Business Value:** Expands beyond babalawos; reaches students and teachers  
**Story Points:** 14  
**Timeline:** TBD (post-MVP)

---

## EPIC P2-5: Admin Verification & Trust Dashboard
**Business Value:** Operational tool for managing platform integrity  
**Story Points:** 10  
**Timeline:** TBD (post-MVP)

---

## EPIC P2-6: Notification System (Complete)
**Business Value:** Keeps users engaged with timely updates  
**Story Points:** 8  
**Timeline:** TBD (post-MVP)

---

# PART 4: TECHNICAL DEBT & BUGS REGISTER

| ID | Title | Impact | Priority | Est. Hours | Status |
|----|-------|--------|----------|-----------|--------|
| BUG-P0-001 | Duplicate demo data files conflict | High (cascading failures) | P0 | 3 | Not Started |
| BUG-P0-002 | Role-based permissions showing unauthorized buttons | High (security & UX) | P0 | 2 | Not Started |
| BUG-P0-003 | Event routing returns 404 | High (demo blocker) | P0 | 2 | Not Started |
| BUG-P0-004 | Circles ID/slug mismatch | High (feature broken) | P0 | 1 | Not Started |
| BUG-P0-005 | Forum thread detail "not found" | Medium (demo scenario) | P0 | 2 | Not Started |
| BUG-P1-001 | Guidance Plan UI incomplete | High (payment flow) | P1 | 6 | Not Started |
| BUG-P1-002 | Homepage layout inconsistent spacing | Medium (design) | P1 | 3 | Not Started |
| TECH-DEBT-001 | Unused imports in journey-timeline-view.tsx | Low | P2 | 0.5 | Not Started |
| TECH-DEBT-002 | Missing error boundaries on feature pages | Medium | P2 | 4 | Not Started |
| TECH-DEBT-003 | API response inconsistency (some endpoints return arrays, some objects) | Medium | P2 | 5 | Not Started |

---

# PART 5: DEPENDENCIES & CRITICAL PATH

## Dependency Map

```
Auth System (stable)
├── Role Context (US-P0-1.1) [2 days]
│   ├── Role-Based Dashboards (US-P0-1.1) [3 days] ← CRITICAL PATH
│   ├── User Profiles (US-P0-4.1) [3 days] ← CRITICAL PATH
│   ├── Navigation Filtering (US-P0-1.2) [1 day]
│   └── Messaging (US-P0-5.1) [2 days]
│
├── Demo Data (US-P0-3.1) [2 days] ← CRITICAL PATH
│   ├── Booking Flow (US-P0-2.1) [3 days] ← CRITICAL PATH
│   ├── Event Pages (US-P0-6.1) [2 days]
│   └── Marketplace (US-P1-1.1) [4 days]
│
├── Payment System (stable)
│   └── Marketplace Payment (US-P1-1.1) [2 days]
│       └── Guidance Plans (US-P1-2.1) [3 days]
│
└── Profile System (US-P0-4.1) [3 days]
    └── Messaging (US-P0-5.1) [2 days]
```

## Critical Path to Feb 12 Demo

1. **Days 1-2:** US-P0-3.1 (Demo Data)
2. **Days 1-3:** US-P0-1.1 (Role Dashboards) - parallelize with #1
3. **Days 2-4:** US-P0-2.1 (Booking Flow) - depends on #1, #2
4. **Days 3-5:** US-P0-4.1 (User Profiles) - depends on #2
5. **Days 4-5:** US-P0-6.1 (Event Pages) - depends on #1
6. **Days 5-6:** US-P0-5.1 (Messaging) - depends on #4
7. **Days 6-7:** P1-3.1 (Light Theme) - parallelize throughout
8. **Day 8:** Demo Practice & Bug Fixes

**Total: 8 days to demo-ready** (Feb 12 ✓)

---

# PART 6: SUCCESS METRICS & DEFINITION OF DONE

## MVP Success Criteria

### Demo (Feb 12)
- ✅ All P0 stories complete
- ✅ 3+ demo scenarios work end-to-end without errors
- ✅ No broken features visible to stakeholder
- ✅ Demo data consistent and realistic
- ✅ Single babalawo → booking → payment scenario works flawlessly
- ✅ Role-based interfaces show distinct experiences

### Launch (Feb 29)
- ✅ All P1 stories complete
- ✅ Zero critical bugs in production
- ✅ Load testing passed (100+ concurrent users)
- ✅ UAT completed with >90% task success rate
- ✅ Mobile-responsive and accessible (WCAG 2.1 AA)
- ✅ Security review completed
- ✅ Payment processing tested end-to-end
- ✅ Backup & disaster recovery plan documented

### Post-Launch (Mar 30)
- ✅ P2 features prioritized and roadmapped
- ✅ User feedback incorporated
- ✅ Analytics dashboard operational
- ✅ Community moderators trained
- ✅ First-week retention >60%

---

# APPENDIX: DEVELOPER QUICK START

## For New Team Members

1. **Understand the MVP:**
   - Read docs/INVESTOR_ROADMAP_AND_VISION.md (product vision)
   - Read this backlog (technical requirements)

2. **Get the Code:**
   ```bash
   git clone <repo>
   cd ifa_app
   npm install
   npm run dev # frontend
   npm run start:backend # backend
   ```

3. **Seed Demo Data:**
   ```bash
   cd backend
   npm run seed:demo
   ```

4. **Pick a Story:**
   - Choose from P0 stories in priority order
   - Read the full user story and acceptance criteria
   - Understand dependencies (ask if unclear)
   - Create a feature branch: `git checkout -b feat/us-p0-1.1`

5. **Implementation Workflow:**
   - Write tests first (TDD recommended)
   - Implement feature
   - Self-review: does code match acceptance criteria?
   - Code review: get 1 other dev to approve
   - Test: run full test suite + manual UAT
   - Mark story "Done" in backlog
   - Merge to main

6. **Ask for Help:**
   - Product questions → Ask product lead
   - Technical questions → Ask tech lead
   - Blocked → Escalate immediately (don't wait)

---
# Ìlú Àṣẹ: Master Product Backlog

**End of Master Product Backlog**  
**Last Updated:** February 2, 2026  
**Next Review:** February 6, 2026 (mid-way to demo deadline)  
**Product Owner:** [Name]  
**Tech Lead:** [Name]
