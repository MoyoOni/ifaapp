# ⚠️ OBSOLETE — Superseded by V2_PRODUCT_BACKLOG.md

**Do not use this document.** See **V2_PRODUCT_BACKLOG.md** for the current production-ready backlog with clear status tracking.

**Current Status:** ✅ PLATFORM IS PRODUCTION READY

- All V2 critical items completed
- All high-priority items completed
- ✅ Complete Navigation System Overhaul completed
- ✅ Mobile/Desktop Consistency achieved
- ✅ Zero Duplicates in routing system
- ✅ All Missing Links resolved
- Remaining enhancements moved to V3 backlog
- Platform ready for launch

---

# Ilé Àṣẹ: Reorganized Product Backlog
## Digital Sanctuary for Ancient Wisdom - Complete Product Roadmap

**Last Updated:** February 2, 2026  
**Demo Deadline:** February 12, 2026  
**Launch Deadline:** February 29, 2026  
**Product Vision:** A vertical operating system for the Ifá spiritual economy, combining trust architecture, cultural integrity, and verified community with Shopify + LinkedIn + Headspace capabilities.

---

## Executive Summary

This reorganized product backlog represents the complete roadmap for the Ilé Àṣẹ platform from current state (90% MVP complete) through launch (Feb 29) and into post-MVP expansion. The backlog is organized by strategic priority, technical dependencies, and business impact using the INVEST framework for maximum clarity and developer autonomy.

### Key Strategic Decisions
- **Spiritual Journey Feature**: DEFERRED to post-MVP (feature-complete but low strategic value)
- **Core Flow Priority**: Discover Temple → Find Babalawo → Book Consultation → Receive Guidance → Pay
- **MVP Scope**: P0 (demo-critical) + P1 (launch-required) only; P2-P3 deferred to post-launch
- **Team Capacity:** ~80-100 story points available before Feb 12; ~120-150 before Feb 29

### Success Metrics
- ✅ Feb 12: All P0 items complete; 3+ end-to-end demo scenarios work flawlessly
- ✅ Feb 29: All P1 items complete; zero broken features in critical paths
- ✅ Launch: Clear role experiences (Client, Babalawo, Vendor) with distinct workflows
- ✅ Demo Data: Single source of truth; all demo scenarios use consolidated ecosystem
- ✅ User Feedback: 90%+ task completion on critical paths in UAT
- ✅ **Production Ready**: All critical items completed; platform ready for launch
- ✅ **Enhanced UX**: Messaging system with back button navigation and private communication features
- ✅ **Role Differentiation**: Distinct dashboard views for Client, Babalawo, Vendor, and Admin roles

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

## 1a: Role-Based Dashboard System (COMPLETED)
**Business Value:** Foundational user experience; enables all other features  
**Team:** Frontend Lead + 1 Frontend Dev  
**Timeline:** 5 days  
**Story Points:** 21  
**Dependencies:** Auth system working; User.role field populated

### Context
Previously, users landed on a generic homepage regardless of role. A Babalawo saw the same content as a Client. This confusion prevented demos from showing role-specific workflows. Now we have distinct dashboard experiences for Client, Babalawo, Vendor, and Admin that guide users toward their core tasks.

### User Story: 1a-1: Role-Based Dashboard Implementation (COMPLETED)
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

## 1b: Unified Demo Data Ecosystem (COMPLETED)
**Business Value:** Enables consistent, repeatable demos across all features  
**Team:** Full-stack developer  
**Timeline:** 3 days  
**Story Points:** 8  
**Dependencies:** Complete user base (1a)  

### Context
The platform requires a cohesive set of demo data that demonstrates realistic relationships between users, temples, babalawos, and clients. Previously, demo data was scattered across multiple files without clear connections, making it difficult to demonstrate end-to-end user journeys consistently. This epic creates a canonical source of truth for all demo data relationships.

### User Story: 1b-1: Unified Demo Data Implementation (COMPLETED)
**As a** product team member  
**I want** a unified demo data ecosystem with explicit relationships  
**So that** I can demonstrate consistent end-to-end user journeys across all features  

**Priority:** P0 (Critical for demo)  
**Story Points:** 8  
**Dependencies:** Complete user base (1a)

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

## 1c: Consultation Booking Flow
**Business Value:** Core platform functionality; enables primary revenue stream  
**Team:** Full-stack developer + UI/UX  
**Timeline:** 5 days  
**Story Points:** 18  
**Dependencies:** User profiles complete (1a), Payment system ready

### Context
Users need to seamlessly book consultations with babalawos, with proper scheduling, payment processing, and confirmation flows. This is the core transaction of the platform - connecting clients with spiritual guidance providers. The flow must handle scheduling conflicts, payment processing, and clear communication between parties.

### User Story: 1c-1: Complete Consultation Booking Implementation
**As a** client  
**I want** to book consultations with babalawos seamlessly  
**So that** I can receive spiritual guidance when I need it  

**Priority:** P0 (Critical for demo)  
**Story Points:** 18  
**Dependencies:** User profiles complete (1a), Payment system ready

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
- [x] **Enhanced Feb 14:** Detailed appointment view with related data
- [x] **Enhanced Feb 14:** Availability checking endpoint for specific time slots
- [x] **Enhanced Feb 14:** Upcoming appointments filtering for clients and babalawos
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
- [x] **Enhanced Feb 14:** Added 4 new API endpoints (GET /appointments/:id, POST /appointments/check-availability, etc.)
- [x] **Enhanced Feb 14:** Implemented comprehensive validation and error handling
- [x] **Enhanced Feb 14:** Added upcoming appointments filtering capabilities
- [ ] Complete end-to-end integration testing
- [ ] Polish UI/UX for seamless booking experience
- [ ] Add comprehensive error handling and edge cases

---

## 2a: Complete User Profile System
**Business Value:** Enables discovery, trust-building, and messaging  
**Team:** Full Stack (1 BE + 1 FE)  
**Timeline:** 4 days  
**Story Points:** 16  
**Dependencies:** 1a (role dashboards), 1b (demo data)

### Context
Currently, clicking on a user's name or profile picture does nothing. Profiles don't show role-specific information (babalawo credentials, specialties, reviews; client activity; vendor products). Without working profiles, users can't build trust or understand who they're interacting with.

### User Story: 2a-1: Complete Profile Viewing System
**As a** user  
**I want** to view other users' profiles with all relevant information  
**So that** I can understand their credentials, experience, and community activity  

**Priority:** P0  
**Story Points:** 13  
**Dependencies:** 1a, 1b

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
- [ ] Create `backend/src/users/users.service.ts`:
- [ ] Add caching decorator to profile endpoint
- [ ] Add rate limiting

**Frontend:**
- [ ] Create `frontend/src/pages/UserProfile.tsx`
- [ ] Create `frontend/src/components/UserProfile/BabalawoProfileSection.tsx`
- [ ] Create `frontend/src/components/UserProfile/ClientProfileSection.tsx`
- [ ] Create `frontend/src/components/UserProfile/VendorProfileSection.tsx`
- [ ] Update routing in `App.tsx` to include user profile route
- [ ] Make all user name/avatar clickable

**Testing Checklist:**
- [ ] Manual test: Click babalawo name on Discover page → profile opens with all babalawo fields
- [ ] Manual test: Profile shows correct temple affiliation and link
- [ ] Manual test: Profile shows 5 most recent reviews
- [ ] Manual test: Profile responsive on mobile (iPhone SE)
- [ ] Manual test: Click "Book Consultation" → booking form opens (1c-1)
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

## 2b: Direct Messaging System
**Business Value:** Enables private communication between users  
**Team:** Full Stack (1 BE + 1 FE)  
**Timeline:** 3 days  
**Story Points:** 12  
**Dependencies:** 2a (user profiles)

### User Story: 2b-1: Direct Messaging MVP
**As a** user  
**I want** to send and receive direct messages with other users  
**So that** I can communicate privately about consultations, products, or community matters  

**Priority:** P0  
**Story Points:** 12  
**Dependencies:** 2a

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
- [ ] Create `backend/src/messaging/message.entity.ts` Prisma model
- [ ] Create `backend/src/messaging/messaging.service.ts`
- [ ] Create `backend/src/messaging/messaging.controller.ts`
- [ ] Add WebSocket support for real-time messages

**Frontend:**
- [ ] Create `frontend/src/context/MessagingContext.tsx`
- [ ] Create `frontend/src/components/Messaging/MessageThread.tsx`
- [ ] Create `frontend/src/components/Messaging/MessagesList.tsx`
- [ ] Add "Send Message" button to user profile
- [ ] Add Messages page: `frontend/src/pages/MessagesPage.tsx`

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

## 2c: Event Management System
**Business Value:** Shows temple events; enables community engagement  
**Team:** 1 Frontend Dev  
**Timeline:** 2 days  
**Story Points:** 8  
**Dependencies:** 1b (demo data)

### User Story: 2c-1: Professional Event Pages
**As a** user  
**I want** to view detailed event pages when clicking event listings  
**So that** I can understand event details and decide whether to attend  

**Priority:** P0  
**Story Points:** 8  
**Dependencies:** 1b

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
- [ ] Create `frontend/src/features/events/EventDetail.tsx`
- [ ] Create `frontend/src/components/Events/EventCard.tsx`
- [ ] Update `frontend/src/App.tsx` routing to include event detail route
- [ ] Fix event click handlers throughout the app
- [ ] Backend: Ensure `/api/events/:id` endpoint works
- [ ] Backend: Add event registration endpoints
- [ ] Style event page with CSS/Tailwind

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

## 3a: Marketplace & Payment Flow Completion
**Business Value:** Core revenue stream; enables vendors and clients to transact  
**Team:** Full Stack (1 BE + 1 FE)  
**Timeline:** 5 days  
**Story Points:** 20  
**Dependencies:** 1b (demo data), 1c (booking flow)

### User Story: 3a-1: Complete Marketplace Product Flow
**As a** client  
**I want** to browse products, add to cart, and checkout  
**So that** I can purchase sacred artifacts from verified vendors  

**Priority:** P1  
**Story Points:** 13  
**Dependencies:** 1b

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

## 3b: Guidance Plan UI & Delivery System
**Business Value:** Critical for consultation flow; enables clients to receive spiritual guidance  
**Team:** 1 Frontend Dev + 1 Backend Dev  
**Timeline:** 4 days  
**Story Points:** 18  
**Dependencies:** 1c (booking), 1a (dashboards)

### User Story: 3b-1: Guidance Plan Display & Tracking
**As a** client who received a consultation  
**I want** to view my guidance plan and track completion of recommended actions  
**So that** I can follow through on the babalawo's spiritual guidance  

**Priority:** P1  
**Story Points:** 13  
**Dependencies:** 1c

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

## 3c: UI/UX Light Theme & Design Polish
**Business Value:** Professional presentation for launch; accessibility  
**Team:** 1 Frontend Dev + Designer  
**Timeline:** 3 days  
**Story Points:** 10  
**Dependencies:** None (can parallelize)

### User Story: 3c-1: Consistent Light Theme Implementation
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

## 4a: Advanced Search & Discovery
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

## 4b: Ancestral Tree / Spiritual Lineage
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

## 4c: Academy Course Enrollment & Curriculum
**Business Value:** Passive income; knowledge preservation; community building; thought leadership  
**Team:** 2 Devs (1 BE + 1 FE) + Curriculum Designer  
**Timeline:** TBD (post-MVP, ~6-8 weeks)  
**Story Points:** 45  
**Dependencies:** 1a (dashboards), User authentication

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

### User Story: 4c-1: Academy Course Catalog & Enrollment
**As a** user interested in spiritual knowledge  
**I want** to browse and enroll in Academy courses  
**So that** I can deepen my understanding of Ifá wisdom and spiritual principles  

**Priority:** P2  
**Story Points:** 18  
**Dependencies:** 1a

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
- [ ] Create `backend/src/academy/course.entity.ts` Prisma models
- [ ] Create `backend/src/academy/academy.service.ts`
- [ ] Create `backend/src/academy/academy.controller.ts`
- [ ] Create seed data with all 12 courses in `backend/src/seeding/academy-courses.ts`

**Frontend:**
- [ ] Create `frontend/src/pages/Academy/AcademyHome.tsx`
- [ ] Create `frontend/src/pages/Academy/CourseDetail.tsx`
- [ ] Create `frontend/src/pages/Academy/MyCourses.tsx`
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

### User Story: 4c-2: Course Learning Experience & Progress Tracking
**As a** student enrolled in an Academy course  
**I want** to access course materials, track my progress, and complete modules  
**So that** I can learn at my own pace and earn a completion certificate  

**Priority:** P2  
**Story Points:** 15  
**Dependencies:** 4c-1

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
- [ ] Create `frontend/src/components/ModuleContent.tsx`
- [ ] Create `frontend/src/components/AssignmentSubmission.tsx`
- [ ] Create `frontend/src/components/CompletionCertificate.tsx`
- [ ] Backend: Add progress tracking endpoints

---

### User Story: 4c-3: Instructor Dashboard & Course Management
**As an** instructor or course creator  
**I want** to manage my course content, view student progress, and grade assignments  
**So that** I can deliver high-quality education and support my students  

**Priority:** P2  
**Story Points:** 12  
**Dependencies:** 4c-1, 4c-2

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

## 4d: Tutor Marketplace
**Business Value:** Expands beyond babalawos; reaches students and teachers  
**Story Points:** 14  
**Timeline:** TBD (post-MVP)

---

## 4e: Admin Verification & Trust Dashboard
**Business Value:** Operational tool for managing platform integrity  
**Story Points:** 10  
**Timeline:** TBD (post-MVP)

---

## 4f: Notification System (Complete)
**Business Value:** Keeps users engaged with timely updates  
**Story Points:** 8  
**Timeline:** TBD (post-MVP)

---

# PART 4: TECHNICAL DEBT & BUGS REGISTER

| ID | Title | Impact | Priority | Est. Hours | Status |
|----|-------|--------|----------|-----------|--------|
| 1a-P0-001 | Duplicate demo data files conflict | High (cascading failures) | P0 | 3 | Not Started |
| 1a-P0-002 | Role-based permissions showing unauthorized buttons | High (security & UX) | P0 | 2 | Not Started |
| 2c-P0-003 | Event routing returns 404 | High (demo blocker) | P0 | 2 | Not Started |
| 1c-P0-004 | Circles ID/slug mismatch | High (feature broken) | P0 | 1 | Not Started |
| 2c-P0-005 | Forum thread detail "not found" | Medium (demo scenario) | P0 | 2 | Not Started |
| 3b-P1-001 | Guidance Plan UI incomplete | High (payment flow) | P1 | 6 | Not Started |
| 3c-P1-002 | Homepage layout inconsistent spacing | Medium (design) | P1 | 3 | Not Started |
| TECH-DEBT-001 | Unused imports in journey-timeline-view.tsx | Low | P2 | 0.5 | Not Started |
| TECH-DEBT-002 | Missing error boundaries on feature pages | Medium | P2 | 4 | Not Started |
| TECH-DEBT-003 | API response inconsistency (some endpoints return arrays, some objects) | Medium | P2 | 5 | Not Started |

---

# PART 5: DEPENDENCIES & CRITICAL PATH

## Dependency Map

```
Auth System (stable)
├── Role Context (1a-1) [2 days]
│   ├── Role-Based Dashboards (1a-1) [3 days] ← CRITICAL PATH
│   ├── User Profiles (2a-1) [3 days] ← CRITICAL PATH
│   ├── Navigation Filtering (1a-1) [1 day]
│   └── Messaging (2b-1) [2 days]
│
├── Demo Data (1b-1) [2 days] ← CRITICAL PATH
│   ├── Booking Flow (1c-1) [3 days] ← CRITICAL PATH
│   ├── Event Pages (2c-1) [2 days]
│   └── Marketplace (3a-1) [4 days]
│
├── Payment System (stable)
│   └── Marketplace Payment (3a-1) [2 days]
│       └── Guidance Plans (3b-1) [3 days]
│
└── Profile System (2a-1) [3 days]
    └── Messaging (2b-1) [2 days]
```

## Critical Path to Feb 12 Demo

1. **Days 1-2:** 1b-1 (Demo Data)
2. **Days 1-3:** 1a-1 (Role Dashboards) - parallelize with #1
3. **Days 2-4:** 1c-1 (Booking Flow) - depends on #1, #2
4. **Days 3-5:** 2a-1 (User Profiles) - depends on #2
5. **Days 4-5:** 2c-1 (Event Pages) - depends on #1
6. **Days 5-6:** 2b-1 (Messaging) - depends on #4
7. **Days 6-7:** 3c-1 (Light Theme) - parallelize throughout
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

**End of Master Product Backlog**  
**Last Updated:** February 2, 2026  
**Next Review:** February 6, 2026 (mid-way to demo deadline)  
**Product Owner:** [Name]  
**Tech Lead:** [Name]
