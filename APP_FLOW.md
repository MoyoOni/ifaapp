# Ìlú Àṣẹ — Complete Application Flow Document

> **Platform:** Ìlú Àṣẹ — Digital Heritage Sanctuary for Ifá Spiritual Community
> **Last Updated:** February 26, 2026
> **Stack:** React + TypeScript (frontend) · NestJS (backend) · Prisma + PostgreSQL (database)

---

## Table of Contents

1. [Application Architecture Overview](#1-application-architecture-overview)
2. [Authentication & Entry Flows](#2-authentication--entry-flows)
3. [Onboarding Flow](#3-onboarding-flow)
4. [Role-Based Navigation & Dashboards](#4-role-based-navigation--dashboards)
5. [Actor Flows](#5-actor-flows)
   - 5.1 [Client (Seeker) Flows](#51-client-seeker-flows)
   - 5.2 [Babalawo (Practitioner) Flows](#52-babalawo-practitioner-flows)
   - 5.3 [Vendor (Merchant) Flows](#53-vendor-merchant-flows)
   - 5.4 [Admin (Steward) Flows](#54-admin-steward-flows)
6. [Feature Flows](#6-feature-flows)
   - 6.1 [Temple Discovery & Detail](#61-temple-discovery--detail)
   - 6.2 [Babalawo Discovery & Booking](#62-babalawo-discovery--booking)
   - 6.3 [Consultation & Guidance Plans](#63-consultation--guidance-plans)
   - 6.4 [Community Circles](#64-community-circles)
   - 6.5 [Forum & Discussions](#65-forum--discussions)
   - 6.6 [Academy & Learning](#66-academy--learning)
   - 6.7 [Marketplace & Commerce](#67-marketplace--commerce)
   - 6.8 [Messaging](#68-messaging)
   - 6.9 [Wallet & Payments](#69-wallet--payments)
   - 6.10 [Events](#610-events)
   - 6.11 [Profile](#611-profile)
   - 6.12 [Notifications](#612-notifications)
7. [Shared Components & Global Flows](#7-shared-components--global-flows)
8. [Complete Route Map](#8-complete-route-map)

---

## 1. Application Architecture Overview

### App Shell

```
┌──────────────────────────────────────────────────────────┐
│                    QueryClientProvider                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │                   ErrorBoundary                     │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │                ToastProvider                   │  │  │
│  │  │  ┌────────────────────────────────────────┐  │  │  │
│  │  │  │            ModalProvider                │  │  │  │
│  │  │  │  ┌──────────────────────────────────┐  │  │  │  │
│  │  │  │  │          BrowserRouter            │  │  │  │  │
│  │  │  │  │  ┌────────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │     React.Suspense         │  │  │  │  │  │
│  │  │  │  │  │  ┌──────────────────────┐  │  │  │  │  │  │
│  │  │  │  │  │  │     <Routes>         │  │  │  │  │  │  │
│  │  │  │  │  │  │  /login  (no shell)  │  │  │  │  │  │  │
│  │  │  │  │  │  │  /signup (no shell)  │  │  │  │  │  │  │
│  │  │  │  │  │  │  /onboarding (no sh) │  │  │  │  │  │  │
│  │  │  │  │  │  │  /* → LayoutWrapper  │  │  │  │  │  │  │
│  │  │  │  │  │  │    ┌──────────────┐  │  │  │  │  │  │  │
│  │  │  │  │  │  │    │SidebarLayout │  │  │  │  │  │  │  │
│  │  │  │  │  │  │    │ + <Outlet /> │  │  │  │  │  │  │  │
│  │  │  │  │  │  │    └──────────────┘  │  │  │  │  │  │  │
│  │  │  │  │  │  └──────────────────────┘  │  │  │  │  │  │
│  │  │  │  │  └────────────────────────────┘  │  │  │  │  │
│  │  │  │  └──────────────────────────────────┘  │  │  │  │
│  │  │  └────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                 SidebarLayout (Desktop)                   │
│ ┌──────────┐ ┌──────────────────────────────────────────┐│
│ │ Sidebar  │ │           Main Content Area               ││
│ │ (w-72 or │ │ ┌──────────────────────────────────────┐ ││
│ │  w-20    │ │ │  Desktop Header                      │ ││
│ │ collapse)│ │ │  [Page Title] [Daily Odù] [Actions]  │ ││
│ │          │ │ ├──────────────────────────────────────┤ ││
│ │ ┌──────┐ │ │ │                                      │ ││
│ │ │ Logo │ │ │ │  <Outlet /> (Page Content)           │ ││
│ │ │ IA   │ │ │ │                                      │ ││
│ │ └──────┘ │ │ │  Wrapped in <PageTransition>         │ ││
│ │          │ │ │                                      │ ││
│ │ Nav      │ │ │                                      │ ││
│ │ Items    │ │ │                                      │ ││
│ │ (role-   │ │ │                                      │ ││
│ │  based)  │ │ │                                      │ ││
│ │          │ │ │                                      │ ││
│ │ ┌──────┐ │ │ │                                      │ ││
│ │ │User  │ │ │ │                                      │ ││
│ │ │Panel │ │ │ └──────────────────────────────────────┘ ││
│ │ └──────┘ │ └──────────────────────────────────────────┘│
│ └──────────┘                                             │
└─────────────────────────────────────────────────────────┘
```

**Desktop Header Actions:** Notifications bell, Language switcher, Dark/Light mode toggle, Orisha theme selector

**Mobile Layout:** Burger menu → slide-in drawer with same nav items + quick actions (Profile, Messages, Wallet, Settings, Help, Logout)

---

## 2. Authentication & Entry Flows

### Entry Point Decision Tree

```
User visits / (root)
       │
       ▼
  ┌──────────┐
  │ isLoading?│──Yes──▶ Show LoadingSpinner
  └────┬─────┘
       │ No
       ▼
  ┌──────────┐
  │ user     │──No───▶ Show Landing Page
  │ exists?  │         [Sign In] [Create Account]
  └────┬─────┘
       │ Yes
       ▼
  ┌──────────────┐
  │ hasOnboarded?│──No──▶ Redirect → /onboarding
  └──────┬───────┘
         │ Yes
         ▼
  ┌────────────┐
  │ user.role  │──CLIENT────▶ /client/dashboard
  │            │──BABALAWO──▶ /practitioner/dashboard
  │            │──VENDOR────▶ /vendor/dashboard
  │            │──ADMIN─────▶ /admin
  └────────────┘
```

### Login Flow (`/login`)

```
┌─────────────────────────────────┐
│          Login Page              │
│                                  │
│  ┌───────────────────────────┐  │
│  │  Email: [____________]    │  │
│  │  Password: [__________]   │  │
│  │                           │  │
│  │  [Sign In Button]         │  │
│  │                           │  │
│  │  "Don't have an account?" │  │
│  │  [Create Account link]    │  │
│  │                           │  │
│  │  [Quick Access link]      │  │
│  └───────────────────────────┘  │
│                                  │
│  On Success:                     │
│    → POST /auth/login            │
│    → Store JWT token             │
│    → Redirect to role dashboard  │
└─────────────────────────────────┘
```

### Registration Flow (`/signup`)

```
┌─────────────────────────────────┐
│        Registration Page         │
│                                  │
│  ┌───────────────────────────┐  │
│  │  Name: [______________]   │  │
│  │  Email: [_____________]   │  │
│  │  Password: [__________]   │  │
│  │  Role: [Dropdown ▼]      │  │
│  │    - Seeker (Client)      │  │
│  │    - Babalawo             │  │
│  │    - Vendor               │  │
│  │                           │  │
│  │  [Create Account Button]  │  │
│  │                           │  │
│  │  "Already have account?"  │  │
│  │  [Sign In link]           │  │
│  └───────────────────────────┘  │
│                                  │
│  On Success:                     │
│    → POST /auth/register         │
│    → Auto-login                  │
│    → Redirect → /onboarding      │
└─────────────────────────────────┘
```

### Gateway View (Role Selection + Auth)

The Gateway View (`gateway-view.tsx`) provides an alternative entry path with cultural theming:

```
Step 1: Role Selection
┌──────────────────────────────────────────┐
│           Ìlú Àṣẹ                        │
│    Digital Heritage Sanctuary             │
│                                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  🌿     │ │  📿     │ │  🏺     │   │
│  │ Seeker  │ │Babalawo │ │Merchant │   │
│  │(Awon    │ │(Baba-   │ │(Oloja)  │   │
│  │ Oluea)  │ │ aláwo)  │ │         │   │
│  │         │ │         │ │         │   │
│  │ Enter → │ │ Enter → │ │ Enter → │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                           │
│          [Admin Access] (subtle)          │
└──────────────────────────────────────────┘

Step 2: After role selection → Show Login/Register form
         → "Choose a different path" button to go back
```

### Quick Access (`/quick-access`)

Demo/shortcut page for development — allows bypassing auth for testing different roles.

---

## 3. Onboarding Flow

Route: `/onboarding` (no sidebar shell — full-screen experience)

```
┌─────────────────────────────────────────────┐
│               ONBOARDING FLOW                │
│                                              │
│  Step 1: WELCOME SLIDES (3 slides)           │
│  ┌────────────────────────────────────────┐  │
│  │ Slide 1: "Welcome, [Role]"            │  │
│  │   "You have found your way to Ìlú Àṣẹ"│  │
│  │   [Continue →]                         │  │
│  │                                        │  │
│  │ Slide 2: "Digital Village"             │  │
│  │   "More than just an app."             │  │
│  │   [Continue →]                         │  │
│  │                                        │  │
│  │ Slide 3: "Your Heritage Path"          │  │
│  │   [Let's Begin →]                      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Step 2: HERITAGE QUESTION                   │
│  ┌────────────────────────────────────────┐  │
│  │ "Are you reconnecting with heritage?"  │  │
│  │   [Yes] → Cultural Onboarding Path     │  │
│  │   [No]  → Skip to Profile Form         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Step 3: PROFILE FORM                        │
│  ┌────────────────────────────────────────┐  │
│  │ Yoruba Name: [___________]             │  │
│  │   (with YorubaInputHelper for          │  │
│  │    diacritics: è, ẹ, ọ, ṣ)            │  │
│  │ Location: [___________]                │  │
│  │                                        │  │
│  │ [Complete Setup →]                     │  │
│  │   → PATCH /users/onboard              │  │
│  │   → Sets hasOnboarded = true           │  │
│  │   → Redirect to role dashboard         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [Log Out] button available at each step     │
└─────────────────────────────────────────────┘
```

---

## 4. Role-Based Navigation & Dashboards

### Sidebar Navigation Per Role

#### Client (Seeker) — 9 items
| Icon | Label | Route |
|------|-------|-------|
| User | Home | `/client/dashboard` |
| MessageSquare | Messages | `/messages` |
| Search | Find My Guide | `/babalawo` |
| Calendar | My Consultations | `/client/consultations` |
| GraduationCap | Academy | `/academy` |
| Users | Community Circles | `/circles` |
| Wallet | Sacred Wallet | `/client/wallet` |
| ShoppingBag | Marketplace | `/marketplace` |
| User | My Profile | `/profile` |

#### Babalawo (Practitioner) — 9 items
| Icon | Label | Route |
|------|-------|-------|
| LayoutDashboard | Practice Center | `/practitioner/dashboard` |
| MessageSquare | Messages | `/messages` |
| Users | My Seekers | `/practitioner/seekers` |
| Calendar | Calendar | `/practitioner/consultations` |
| BookOpen | Service Offerings | `/practitioner/services` |
| Building2 | Temple Connection | `/practitioner/temple` |
| DollarSign | Practice Earnings | `/practitioner/earnings` |
| TrendingUp | Professional Growth | `/academy` |
| User | My Profile | `/profile` |

#### Vendor (Merchant) — 8 items
| Icon | Label | Route |
|------|-------|-------|
| LayoutDashboard | My Sacred Shop | `/vendor/dashboard` |
| MessageSquare | Messages | `/messages` |
| Package | Inventory | `/vendor/workshop` |
| Users | Customer Care | `/vendor/support` |
| ShoppingBag | Community Market | `/marketplace` |
| BarChart3 | Revenue/Analytics | `/vendor/insights` |
| TrendingUp | Academy | `/academy` |
| User | My Profile | `/profile` |

#### Admin (Steward) — 10 items (sub-role filtered)
| Icon | Label | Route | Required Sub-Roles |
|------|-------|-------|--------------------|
| Shield | Community Stewardship | `/admin` | All |
| MessageSquare | Messages | `/messages` | All |
| CheckCircle | Member Verification | `/admin/verification` | COMPLIANCE, SUPER |
| BarChart3 | Quality Assurance | `/admin/quality` | MODERATOR, SUPER |
| AlertTriangle | Content Moderation | `/admin/content` | MODERATOR, SUPER |
| Activity | Platform Health | `/admin/health` | COMPLIANCE, SUPER |
| BookOpen | Tradition Preservation | `/admin/content` | MODERATOR, SUPER |
| Wallet | Sacred Finance | `/admin/withdrawals` | FINANCE, SUPER |
| AlertTriangle | Fraud Monitoring | `/admin/fraud` | COMPLIANCE, SUPER |
| User | My Profile | `/profile` | All |

**Admin Sub-Roles:** `SUPER` (sees everything), `COMPLIANCE`, `MODERATOR`, `FINANCE`

---

## 5. Actor Flows

### 5.1 Client (Seeker) Flows

```
┌─────────────────────────────────────────────────────────┐
│                 CLIENT JOURNEY MAP                        │
│                                                          │
│  ┌──────────┐                                            │
│  │ Register │──▶ Onboarding ──▶ Client Dashboard        │
│  └──────────┘                       │                    │
│                                     ▼                    │
│              ┌──────────────────────────────────┐        │
│              │      Personal Dashboard           │        │
│              │  ┌──────┐ ┌──────┐ ┌──────────┐  │        │
│              │  │Stats │ │Quick │ │Upcoming  │  │        │
│              │  │Cards │ │Acts  │ │Sessions  │  │        │
│              │  └──┬───┘ └──┬───┘ └──────────┘  │        │
│              └─────┼────────┼────────────────────┘        │
│                    │        │                              │
│     ┌──────────────┼────────┼──────────────────┐          │
│     ▼              ▼        ▼                  ▼          │
│  ┌────────┐ ┌──────────┐ ┌────────┐  ┌──────────────┐   │
│  │Consult-│ │Find My   │ │Messages│  │ Marketplace  │   │
│  │ations  │ │Guide     │ │        │  │              │   │
│  │List    │ │(Babalawo │ │Inbox → │  │Browse →      │   │
│  │        │ │Discovery)│ │Thread  │  │Detail →      │   │
│  │View → │ │          │ │        │  │Cart →        │   │
│  │Details │ │Filter → │ │        │  │Checkout      │   │
│  └────────┘ │Profile →│ └────────┘  └──────────────┘   │
│             │Book →   │                                  │
│             │Confirm  │                                  │
│             └─────────┘                                  │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Academy  │ │ Circles  │ │ Temples  │ │ Wallet   │   │
│  │          │ │          │ │          │ │          │   │
│  │Catalog → │ │Directory │ │Directory │ │Balance   │   │
│  │Course  → │ │→ Detail  │ │→ Detail  │ │→ Tx Hist │   │
│  │Enroll  → │ │→ Join    │ │→ Explore │ │→ Fund    │   │
│  │Learn     │ │→ Discuss │ │→ Book    │ │→ Send    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Client Dashboard Stats Cards
| Stat | Navigates To |
|------|-------------|
| Consultations count | `/client/consultations` |
| Guidance Plans count | `/guidance-plans` |
| Unread Messages | `/messages` |
| Wallet Balance | `/client/wallet` |
| Temples count | `/temples` |
| Circles count | `/circles` |

#### Client Key Flows

**Discovery Flow (Temple → Babalawo → Booking):**
1. Client navigates to `/temples` (Temple Directory)
2. Browses/filters temples by location, tradition
3. Clicks temple → `/temples/:slug` (Temple Detail)
4. Views temple's resident Babalawos
5. Clicks "Book" on a Babalawo → `/booking/:babalawoId`
6. Selects date/time, topic, confirms → `/booking-confirmation/:bookingId`

**Consultation Flow:**
1. Client goes to `/client/consultations`
2. Views past and upcoming consultations
3. Can view details of each consultation
4. After consultation, may receive guidance plans at `/guidance-plans`

**Marketplace Purchase Flow:**
1. Browse `/marketplace` → filter by category
2. Click product → `/product/:productId` (detail page)
3. Add to cart → `/cart` (review items)
4. Proceed to `/checkout` → payment → confirmation

---

### 5.2 Babalawo (Practitioner) Flows

```
┌─────────────────────────────────────────────────────────┐
│              BABALAWO JOURNEY MAP                         │
│                                                          │
│  ┌──────────┐                                            │
│  │ Register │──▶ Onboarding ──▶ Practitioner Dashboard  │
│  └──────────┘                       │                    │
│                                     ▼                    │
│              ┌──────────────────────────────────┐        │
│              │    Practitioner Dashboard          │        │
│              │  ┌──────────┐ ┌────────────────┐  │        │
│              │  │ Stats    │ │ Upcoming       │  │        │
│              │  │ -Clients │ │ Appointments   │  │        │
│              │  │ -Sessions│ │ (from API)     │  │        │
│              │  │ -Pending │ │                │  │        │
│              │  │ -Earnings│ │                │  │        │
│              │  └──────────┘ └────────────────┘  │        │
│              │                                    │        │
│              │  Tabs: Overview | Seekers |         │        │
│              │        Services | Temple            │        │
│              └──────────────────────────────────┘        │
│                    │                                      │
│     ┌──────────────┼──────────────────────────┐          │
│     ▼              ▼              ▼            ▼          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Calendar  │ │My Seekers│ │Service   │ │Temple    │   │
│  │          │ │          │ │Offerings │ │Connection│   │
│  │View/     │ │Client    │ │          │ │          │   │
│  │manage    │ │list →    │ │Create/   │ │Link to   │   │
│  │schedule  │ │profile → │ │edit      │ │temple    │   │
│  │Set avail │ │consult   │ │offerings │ │profile   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │Invite    │ │Earnings  │ │Guidance  │                │
│  │Client    │ │Report    │ │Plans     │                │
│  │          │ │          │ │          │                │
│  │Send      │ │View      │ │Create →  │                │
│  │email     │ │monthly   │ │Prescribe │                │
│  │invite    │ │earnings  │ │→ Client  │                │
│  └──────────┘ └──────────┘ │approves  │                │
│                             └──────────┘                │
└─────────────────────────────────────────────────────────┘
```

#### Babalawo Key Routes
| Route | Purpose |
|-------|---------|
| `/practitioner/dashboard` | Main hub — stats, appointments, tabs |
| `/practitioner/calendar` | Calendar view of appointments |
| `/practitioner/set-availability` | Set available time slots |
| `/practitioner/my-seekers` | List of active clients |
| `/practitioner/invite-client` | Invite new clients via email |
| `/practitioner/service-offering` | Manage service types and pricing |
| `/practitioner/temple-connection` | Link practice to a temple |
| `/practitioner/earnings-report` | Revenue and earnings breakdown |
| `/practitioner/consultations` | Manage consultation requests |
| `/prescription-creation` | Create guidance plans for clients |

#### Babalawo Key Flows

**Consultation Delivery Flow:**
1. Client books → appears on Babalawo's calendar
2. Babalawo conducts consultation (online/in-person)
3. Creates guidance plan at `/prescription-creation`
4. Client receives plan at `/guidance-plans`
5. Client approves at `/prescription-approval`
6. Track in `/prescription-history`

**Client Management Flow:**
1. View all seekers at `/practitioner/my-seekers`
2. Click seeker → view profile at `/profile/:userId`
3. Invite new clients at `/practitioner/invite-client`
4. Send email invitation with link

---

### 5.3 Vendor (Merchant) Flows

```
┌─────────────────────────────────────────────────────────┐
│               VENDOR JOURNEY MAP                         │
│                                                          │
│  ┌──────────┐                                            │
│  │ Register │──▶ Onboarding ──▶ Vendor Dashboard        │
│  └──────────┘                       │                    │
│                                     ▼                    │
│              ┌──────────────────────────────────┐        │
│              │      Vendor Dashboard             │        │
│              │                                    │        │
│              │  Tabs: Products | Orders |          │        │
│              │        Analytics                    │        │
│              │                                    │        │
│              │  Stats:                             │        │
│              │  - Total Products                   │        │
│              │  - Pending Orders                   │        │
│              │  - Revenue                          │        │
│              │  - Avg Rating                       │        │
│              └──────────────────────────────────┘        │
│                    │                                      │
│     ┌──────────────┼──────────────────────────┐          │
│     ▼              ▼              ▼            ▼          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Products  │ │Orders    │ │Analytics │ │Customer  │   │
│  │          │ │          │ │          │ │Support   │   │
│  │List all  │ │Pending   │ │Revenue   │ │          │   │
│  │Add new   │ │Process   │ │graphs    │ │Tickets   │   │
│  │Edit      │ │Ship      │ │Trends    │ │Respond   │   │
│  │Delete    │ │Complete  │ │Top items │ │Resolve   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  ┌──────────┐                                            │
│  │Customers │                                            │
│  │Insights  │                                            │
│  │          │                                            │
│  │Top buyers│                                            │
│  │Segments  │                                            │
│  └──────────┘                                            │
└─────────────────────────────────────────────────────────┘
```

#### Vendor Key Routes
| Route | Purpose |
|-------|---------|
| `/vendor/dashboard` | Main hub — tabs for products, orders, analytics |
| `/vendor/products` | Product list management |
| `/vendor/orders` | Order management and fulfillment |
| `/vendor/analytics` | Sales analytics and revenue tracking |
| `/vendor/customers` | Customer insights and segments |
| `/vendor/support` | Support ticket management |

#### Vendor Key Flows

**Product Management Flow:**
1. Navigate to Products tab on dashboard
2. Click "Add Product" → fill form (name, price, description, images, category)
3. Product appears in inventory list
4. Edit/delete products inline
5. Products visible to all users at `/marketplace`

**Order Fulfillment Flow:**
1. New orders appear in Orders tab
2. View order details (items, buyer, address)
3. Mark as "Processing" → "Shipped" → "Delivered"
4. Revenue updates in Analytics tab

---

### 5.4 Admin (Steward) Flows

```
┌─────────────────────────────────────────────────────────┐
│                ADMIN JOURNEY MAP                         │
│                                                          │
│  ┌──────────┐                                            │
│  │  Login   │──▶ Admin Dashboard                        │
│  └──────────┘        │                                   │
│                      ▼                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Admin Dashboard (13 tabs)               │   │
│  │                                                    │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │ Tab Bar:                                      │ │   │
│  │  │ Overview | Verification | Temples | Vendors | │ │   │
│  │  │ Disputes | Withdrawals | Analytics | Fraud  | │ │   │
│  │  │ Content | Users | Circles | Quality | Health│ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │                                                    │   │
│  │  Each tab renders a dedicated sub-view component   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Sub-views:                                              │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Overview     │  │ Verification │  │ Temples      │   │
│  │              │  │              │  │              │   │
│  │ Platform     │  │ Queue of     │  │ Manage all   │   │
│  │ stats,       │  │ pending      │  │ temples      │   │
│  │ user counts, │  │ babalawo     │  │ Approve/     │   │
│  │ recent       │  │ verifications│  │ reject       │   │
│  │ activity     │  │ Approve/     │  │ Flag/suspend │   │
│  │              │  │ Reject       │  │              │   │
│  └─────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Vendors     │  │ Disputes     │  │ Withdrawals  │   │
│  │              │  │              │  │              │   │
│  │ Vendor app  │  │ User-filed   │  │ Payout       │   │
│  │ review      │  │ disputes     │  │ requests     │   │
│  │ Approve/    │  │ Investigate  │  │ Approve/     │   │
│  │ Reject/     │  │ Resolve/     │  │ Reject       │   │
│  │ Suspend     │  │ Escalate     │  │              │   │
│  └─────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Analytics   │  │ Fraud        │  │ Content      │   │
│  │              │  │              │  │              │   │
│  │ Platform    │  │ Suspicious   │  │ Reported     │   │
│  │ metrics,    │  │ activity     │  │ posts,       │   │
│  │ growth,     │  │ alerts       │  │ reviews      │   │
│  │ engagement  │  │ Investigate  │  │ Moderate     │   │
│  └─────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Users       │  │ Circles      │  │ Quality      │   │
│  │              │  │              │  │              │   │
│  │ All users   │  │ Manage       │  │ Content      │   │
│  │ Search/     │  │ community    │  │ quality      │   │
│  │ filter      │  │ circles      │  │ checks       │   │
│  │ Impersonate │  │ Approve/     │  │              │   │
│  │ Suspend     │  │ Archive      │  │              │   │
│  └─────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  ┌──────────────┐                                        │
│  │ Health       │  + Standalone:                         │
│  │              │  /admin/advisory-board-voting           │
│  │ System       │  /admin/vendor-review                  │
│  │ health       │                                        │
│  │ metrics      │                                        │
│  └──────────────┘                                        │
└─────────────────────────────────────────────────────────┘
```

#### Admin Key Flows

**Babalawo Verification Flow:**
1. Babalawo registers → appears in verification queue
2. Admin reviews application (credentials, lineage, temple affiliation)
3. Admin approves → Babalawo gains full platform access
4. Or rejects with reason → Babalawo notified

**Vendor Review Flow:**
1. Vendor registers → appears in vendor review queue
2. Admin reviews business details, product samples
3. Approve → Vendor can list products
4. Reject → Reason sent to vendor

**Dispute Resolution Flow:**
1. User files dispute (order issue, consultation complaint)
2. Appears in dispute center
3. Admin investigates — views both parties' data
4. Resolves (refund, warning, suspension)

**User Impersonation Flow:**
1. Admin finds user in Users tab
2. Clicks "Impersonate" → views platform as that user
3. Used for debugging/support

---

## 6. Feature Flows

### 6.1 Temple Discovery & Detail

```
/temples                              /temples/:slug
┌────────────────────────┐           ┌────────────────────────────┐
│    Temple Directory     │   Click   │       Temple Detail         │
│                         │ ────────▶ │                             │
│ [Search: ________]      │           │ ┌───────────────────────┐  │
│ [Filter: Location ▼]    │           │ │ Hero Image / Banner   │  │
│ [Filter: Tradition ▼]   │           │ └───────────────────────┘  │
│                         │           │                             │
│ ┌─────┐ ┌─────┐ ┌────┐│           │ Temple Name                │
│ │ 🏛️  │ │ 🏛️  │ │ 🏛️ ││           │ Location · Tradition       │
│ │Name │ │Name │ │Name││           │ Description                 │
│ │Loc. │ │Loc. │ │Loc.││           │                             │
│ │Memb.│ │Memb.│ │Mem.││           │ ┌─────────────────────────┐│
│ └─────┘ └─────┘ └────┘│           │ │ Resident Babalawos      ││
│                         │           │ │  ┌────┐ ┌────┐ ┌────┐  ││
│                         │           │ │  │Awo │ │Awo │ │Awo │  ││
│                         │           │ │  │Book→│ │Book→│ │Book→│  ││
│                         │           │ │  └────┘ └────┘ └────┘  ││
│                         │           │ └─────────────────────────┘│
│                         │           │                             │
│                         │           │ ┌─────────────────────────┐│
│                         │           │ │ Upcoming Events          ││
│                         │           │ │  Event 1 → /events/:slug ││
│                         │           │ │  Event 2 → /events/:slug ││
│                         │           │ └─────────────────────────┘│
│                         │           │                             │
│                         │           │ [← Back to Temples]         │
└────────────────────────┘           └────────────────────────────┘

Navigation from Temple Detail:
  - "Book" on Babalawo → /booking/:babalawoId
  - "View Profile" on Babalawo → /profile/:userId
  - Click event → /events/:eventSlug
  - Back → /temples
```

### 6.2 Babalawo Discovery & Booking

```
/babalawo                             /booking/:babalawoId
┌────────────────────────┐           ┌────────────────────────────┐
│  Babalawo Discovery     │   Click   │      Booking Page          │
│                         │ ────────▶ │                             │
│ [Search by name/spec]   │           │ Babalawo: Chief Adeyemi    │
│ [Filter: Specialty ▼]   │           │ Specialty: Ifá Divination  │
│ [Filter: Temple ▼]      │           │                             │
│ [Sort: Rating/Price]    │           │ Select Date:               │
│                         │           │ ┌─────────────────────────┐│
│ ┌───────────────────┐   │           │ │   Calendar Picker       ││
│ │ 📿 Chief Adeyemi  │   │           │ │   Available slots shown ││
│ │ ⭐ 4.8 · Ifá Div. │   │           │ └─────────────────────────┘│
│ │ 🏛️ Temple of Ọ̀ṣun │   │           │                             │
│ │ ₦15,000/session    │   │           │ Select Time: [_____]       │
│ │ [View] [Book →]    │   │           │ Topic: [______________]    │
│ └───────────────────┘   │           │ Notes: [______________]    │
│ ┌───────────────────┐   │           │                             │
│ │ 📿 Baba Ogunlesi  │   │           │ Price: ₦15,000             │
│ │ ⭐ 4.5 · Herbal   │   │           │                             │
│ │ 🏛️ Temple of Ògún │   │           │ [Confirm Booking]          │
│ │ ₦12,000/session    │   │           │                             │
│ └───────────────────┘   │           │ On Success:                │
│                         │           │  → POST /appointments       │
│                         │           │  → Redirect to confirmation │
└────────────────────────┘           └────────────────────────────┘

                                      /booking-confirmation/:bookingId
                                     ┌────────────────────────────┐
                                     │   Booking Confirmation      │
                                     │                             │
                                     │  ✅ Booking Confirmed!      │
                                     │                             │
                                     │  Babalawo: Chief Adeyemi   │
                                     │  Date: March 5, 2026       │
                                     │  Time: 2:00 PM             │
                                     │  Amount: ₦15,000           │
                                     │                             │
                                     │  [View My Consultations]    │
                                     │  [Return Home]              │
                                     └────────────────────────────┘
```

### 6.3 Consultation & Guidance Plans

```
Client Side:                          Babalawo Side:
/client/consultations                 /practitioner/consultations
┌────────────────────────┐           ┌────────────────────────────┐
│  My Consultations       │           │  Appointments Calendar     │
│                         │           │                             │
│  Upcoming:              │           │  ┌─────────────────────┐   │
│  ┌──────────────────┐   │           │  │ Calendar Grid View  │   │
│  │ Mar 5 · 2:00 PM  │   │           │  │ (day/week/month)    │   │
│  │ Chief Adeyemi     │   │           │  │                     │   │
│  │ Ifá Divination    │   │           │  │ Color-coded by type │   │
│  │ [View Details]    │   │           │  └─────────────────────┘   │
│  └──────────────────┘   │           │                             │
│                         │           │  Click appointment →        │
│  Past:                  │           │  View details / notes       │
│  ┌──────────────────┐   │           └────────────────────────────┘
│  │ Feb 20 · Completed│   │
│  │ Guidance Plan: ✅  │   │
│  └──────────────────┘   │
└────────────────────────┘

Guidance Plan Flow:
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│/prescription-      │     │/prescription-      │     │/prescription-      │
│ creation           │     │ approval           │     │ history            │
│                    │     │                    │     │                    │
│ Babalawo creates:  │────▶│ Client reviews:    │────▶│ View all plans:    │
│ - Divination result│     │ - View details     │     │ - Active           │
│ - Prescribed items │     │ - Accept plan      │     │ - Completed        │
│ - Ritual steps     │     │ - Request changes  │     │ - Archived         │
│ - Sacred materials │     │                    │     │                    │
│ [Submit Plan]      │     │ [Approve] [Modify] │     │ [View Plan Detail] │
└────────────────────┘     └────────────────────┘     └────────────────────┘

Also accessible at /guidance-plans (overview page)
```

### 6.4 Community Circles

```
/circles                              /circles/:slug
┌────────────────────────┐           ┌────────────────────────────┐
│   Circle Directory      │   Click   │      Circle Detail          │
│                         │ ────────▶ │                             │
│ [Search circles]        │           │ Circle Name                │
│ [Filter: Category ▼]    │           │ Category · Members: 45     │
│                         │           │ Description                 │
│ ┌──────────────────┐    │           │                             │
│ │ 🔵 Herbal Circle │    │           │ ┌─────────────────────────┐│
│ │ 45 members        │    │           │ │ Discussion Feed          ││
│ │ Active · Herbal   │    │           │ │  Post 1: "Question..."   ││
│ └──────────────────┘    │           │ │  Post 2: "Sharing..."    ││
│ ┌──────────────────┐    │           │ │  [Write a post...]       ││
│ │ 🟢 Divination    │    │           │ └─────────────────────────┘│
│ │   Study Group     │    │           │                             │
│ │ 28 members        │    │           │ ┌─────────────────────────┐│
│ └──────────────────┘    │           │ │ Members List             ││
│                         │           │ │  👤 Member 1 → /profile  ││
│ [Create Circle]         │           │ │  👤 Member 2 → /profile  ││
│                         │           │ └─────────────────────────┘│
│                         │           │                             │
│                         │           │ [Join Circle] / [Leave]     │
│                         │           │ [← Back to Circles]         │
└────────────────────────┘           └────────────────────────────┘

Admin manages circles at Admin Dashboard → Circles tab
  - Approve/reject circle creation requests
  - Archive/suspend circles
  - View membership stats
```

### 6.5 Forum & Discussions

```
/forum                                /forum/:threadId
┌────────────────────────┐           ┌────────────────────────────┐
│   Forum Home            │   Click   │      Thread View            │
│                         │ ────────▶ │                             │
│ [Search threads]        │           │ Thread Title               │
│ [Category filters]      │           │ by Author · 2 hours ago    │
│                         │           │                             │
│ ┌──────────────────┐    │           │ Original post content...    │
│ │ 💬 "Best herbs   │    │           │                             │
│ │   for cleansing?"│    │           │ ─────────────────────────  │
│ │ 12 replies · 2h  │    │           │                             │
│ └──────────────────┘    │           │ Reply 1:                    │
│ ┌──────────────────┐    │           │ "I recommend..."            │
│ │ 💬 "Ifá verse    │    │           │   by User2 · 1h ago        │
│ │   interpretation"│    │           │                             │
│ │ 8 replies · 1d   │    │           │ Reply 2:                    │
│ └──────────────────┘    │           │ "In my experience..."       │
│                         │           │   by User3 · 30m ago        │
│ [Create New Thread]     │           │                             │
│   → inline form         │           │ ┌─────────────────────────┐│
│                         │           │ │ [Write a reply...]       ││
│                         │           │ │ [Submit]                 ││
│                         │           │ └─────────────────────────┘│
│                         │           │                             │
│                         │           │ [← Back to Forum]           │
└────────────────────────┘           └────────────────────────────┘
```

### 6.6 Academy & Learning

```
/academy                          /academy/course/:courseId
┌──────────────────────┐         ┌──────────────────────────────┐
│  Academy Catalog      │  Click  │     Course Detail             │
│                       │ ──────▶ │                               │
│ [Search courses]      │         │ Course Title                  │
│ [Filter: Level ▼]     │         │ Instructor · Level · Duration │
│ [Filter: Category ▼]  │         │                               │
│                       │         │ Description                    │
│ ┌─────┐ ┌─────┐ ┌──┐│         │                               │
│ │ 📚  │ │ 📚  │ │📚││         │ Curriculum:                    │
│ │Intro│ │Herb │ │Di││         │  Module 1: Introduction        │
│ │to   │ │Medi │ │vi││         │  Module 2: Foundations          │
│ │Ifá  │ │cine │ │na││         │  Module 3: Practice             │
│ │     │ │     │ │ti││         │                               │
│ │Free │ │₦5K  │ │on││         │ [Enroll Now - ₦5,000]          │
│ └─────┘ └─────┘ └──┘│         │ or [Free Enrollment]           │
│                       │         │                               │
│ [My Courses →]        │         │ [← Back to Academy]            │
└──────────────────────┘         └──────────────────────────────┘

/academy/my-courses               /academy/learn/:enrollmentId
┌──────────────────────┐         ┌──────────────────────────────┐
│  My Courses           │  Click  │     Lesson Player             │
│                       │ ──────▶ │                               │
│ ┌──────────────────┐  │         │ Course: Intro to Ifá          │
│ │ Intro to Ifá      │  │         │ Module 2 / Lesson 3           │
│ │ Progress: 60%     │  │         │                               │
│ │ ████████░░ 3/5    │  │         │ ┌───────────────────────────┐│
│ │ [Continue →]      │  │         │ │                           ││
│ └──────────────────┘  │         │ │  Video / Text Content     ││
│ ┌──────────────────┐  │         │ │                           ││
│ │ Herbal Medicine   │  │         │ │                           ││
│ │ Progress: 20%     │  │         │ └───────────────────────────┘│
│ │ ██░░░░░░░░ 1/5    │  │         │                               │
│ │ [Continue →]      │  │         │ Lesson content text...        │
│ └──────────────────┘  │         │                               │
│                       │         │ [← Previous] [Mark Complete]   │
│                       │         │              [Next →]          │
│                       │         │                               │
│                       │         │ [← Back to My Courses]         │
└──────────────────────┘         └──────────────────────────────┘
```

### 6.7 Marketplace & Commerce

```
/marketplace                      /product/:productId
┌──────────────────────┐         ┌──────────────────────────────┐
│  Sacred Marketplace   │  Click  │     Product Detail            │
│                       │ ──────▶ │                               │
│ [Search products]     │         │ ┌───────────────────────────┐│
│ [Category: All ▼]     │         │ │  Product Image Gallery    ││
│ [Sort: Popular ▼]     │         │ └───────────────────────────┘│
│                       │         │                               │
│ ┌─────┐ ┌─────┐ ┌──┐│         │ Sacred Incense Bundle        │
│ │ 🏺  │ │ 📿  │ │🕯││         │ by: Vendor Name               │
│ │Ince-│ │Bead │ │Ca││         │ ₦8,500                        │
│ │nse  │ │Set  │ │nd││         │ ⭐ 4.7 (23 reviews)           │
│ │₦8.5K│ │₦12K │ │le││         │                               │
│ │     │ │     │ │s ││         │ Description...                │
│ │[Add]│ │[Add]│ │  ││         │                               │
│ └─────┘ └─────┘ └──┘│         │ [Add to Cart]                 │
│                       │         │ [Buy Now →]                   │
│ [🛒 Cart (3)]         │         │                               │
└──────────────────────┘         └──────────────────────────────┘

/cart                             /checkout
┌──────────────────────┐         ┌──────────────────────────────┐
│   Shopping Cart       │  Click  │      Checkout                 │
│                       │ ──────▶ │                               │
│ ┌──────────────────┐  │         │ Shipping Address:             │
│ │ Sacred Incense x1│  │         │ [______________________]      │
│ │ ₦8,500  [-] [+]  │  │         │ [______________________]      │
│ │ [Remove]          │  │         │                               │
│ └──────────────────┘  │         │ Payment Method:               │
│ ┌──────────────────┐  │         │ ○ Wallet Balance              │
│ │ Bead Set      x1 │  │         │ ○ Card Payment                │
│ │ ₦12,000 [-] [+]  │  │         │ ○ Bank Transfer               │
│ │ [Remove]          │  │         │                               │
│ └──────────────────┘  │         │ ─────────────────────────     │
│                       │         │ Subtotal:  ₦20,500            │
│ Subtotal: ₦20,500    │         │ Delivery:  ₦1,500             │
│                       │         │ Total:     ₦22,000            │
│ [Continue to Checkout]│         │                               │
│                       │         │ [Place Order]                  │
│ [Continue Shopping]   │         │   → POST /orders               │
└──────────────────────┘         │   → Payment modal              │
                                  │   → Order confirmation         │
                                  └──────────────────────────────┘

Also: /vendor-directory — Browse all verified vendors
```

### 6.8 Messaging

```
/messages
┌─────────────────────────────────────────────────────────┐
│                    Message Inbox                         │
│                                                          │
│ [Search conversations]                                   │
│                                                          │
│ ┌────────────────────────────┐ ┌────────────────────────┐│
│ │  Conversation List         │ │  Active Thread          ││
│ │                            │ │                          ││
│ │ ┌──────────────────────┐   │ │ Chief Adeyemi            ││
│ │ │ 📿 Chief Adeyemi     │   │ │ Online · Babalawo        ││
│ │ │ "Thank you for the..."│   │ │                          ││
│ │ │ 2h ago · ●            │   │ │ ┌──────────────────┐    ││
│ │ └──────────────────────┘   │ │ │ "I've prepared    │    ││
│ │ ┌──────────────────────┐   │ │ │  your guidance    │    ││
│ │ │ 👤 Adunni Okafor     │   │ │ │  plan."           │    ││
│ │ │ "When is the next..." │   │ │ └──────────────────┘    ││
│ │ │ 1d ago                │   │ │                          ││
│ │ └──────────────────────┘   │ │ ┌──────────────────┐    ││
│ │ ┌──────────────────────┐   │ │ │ "Thank you for   │    ││
│ │ │ 🏺 Sacred Arts Shop  │   │ │ │  the consultation │    ││
│ │ │ "Your order has..."  │   │ │ │  yesterday."      │    ││
│ │ │ 3d ago                │   │ │ └──────────────────┘    ││
│ │ └──────────────────────┘   │ │                          ││
│ │                            │ │ ┌────────────────────┐   ││
│ │                            │ │ │ [Type message...]   │   ││
│ │                            │ │ │ [Send]              │   ││
│ │                            │ │ └────────────────────┘   ││
│ └────────────────────────────┘ └────────────────────────┘│
└─────────────────────────────────────────────────────────┘

Mobile: Inbox list → tap → Thread view (full screen)
Desktop: Split view (list left, thread right)
```

### 6.9 Wallet & Payments

```
/wallet                               /wallet/transactions
┌────────────────────────┐           ┌────────────────────────────┐
│   Wallet Dashboard      │   Click   │   Transaction History       │
│                         │ ────────▶ │                             │
│ ┌───────────────────┐   │           │ [Filter: All Types ▼]       │
│ │ Balance: ₦45,000  │   │           │ [Date range picker]         │
│ │                   │   │           │                             │
│ │ [Fund Wallet]     │   │           │ ┌─────────────────────────┐│
│ │ [Send Money]      │   │           │ │ Feb 25 · Consultation   ││
│ │ [Withdraw]        │   │           │ │ -₦15,000 · To Adeyemi  ││
│ └───────────────────┘   │           │ ├─────────────────────────┤│
│                         │           │ │ Feb 24 · Marketplace    ││
│ Recent Transactions:    │           │ │ -₦8,500 · Sacred Incense││
│ ┌──────────────────┐    │           │ ├─────────────────────────┤│
│ │ -₦15,000 Consult │    │           │ │ Feb 23 · Wallet Fund    ││
│ │ -₦8,500 Purchase │    │           │ │ +₦50,000 · Bank deposit ││
│ │ +₦50,000 Funded  │    │           │ └─────────────────────────┘│
│ └──────────────────┘    │           │                             │
│                         │           │ [← Back to Wallet]          │
│ [View All Transactions]  │           └────────────────────────────┘
└────────────────────────┘

Client Wallet: /client/wallet (simplified view for seekers)
Main Wallet:   /wallet (full wallet dashboard)
```

### 6.10 Events

```
/events                               /events/:eventSlug
┌────────────────────────┐           ┌────────────────────────────┐
│   Events Directory      │   Click   │      Event Detail           │
│                         │ ────────▶ │                             │
│ [Search events]         │           │ ┌───────────────────────┐  │
│ [Filter: Upcoming ▼]    │           │ │  Event Banner Image   │  │
│                         │           │ └───────────────────────┘  │
│ ┌──────────────────┐    │           │                             │
│ │ 🎉 Annual Ifá    │    │           │ Annual Ifá Festival         │
│ │   Festival        │    │           │ 📅 March 15, 2026          │
│ │ Mar 15 · Lagos    │    │           │ 📍 Temple of Ọ̀ṣun, Lagos  │
│ │ 150 attending     │    │           │ 🎫 ₦5,000 / Free for members│
│ └──────────────────┘    │           │                             │
│ ┌──────────────────┐    │           │ Description...              │
│ │ 🎓 Herbal        │    │           │                             │
│ │   Workshop        │    │           │ Schedule:                   │
│ │ Mar 22 · Online   │    │           │  9:00 AM - Opening ceremony│
│ │ 30 spots left     │    │           │  10:30 AM - Workshops       │
│ └──────────────────┘    │           │  2:00 PM - Community feast  │
│                         │           │                             │
│ [Create Event]          │           │ [Register for Event]        │
│  → /event-create        │           │ or "Registration Closed"    │
│                         │           │                             │
│                         │           │ [← Back to Events]          │
└────────────────────────┘           └────────────────────────────┘

/event-create — Event creation form (for organizers/admins)
  → Title, description, date/time, location, capacity, price
  → On success → redirect to /events
```

### 6.11 Profile

```
/profile/:userId
┌─────────────────────────────────────────────────────────┐
│                   Public Profile                         │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │                   Cover / Banner                      ││
│ │     ┌─────┐                                           ││
│ │     │ 👤  │  User Name                                ││
│ │     │Photo│  Role · Location                          ││
│ │     └─────┘  "Bio text here..."                       ││
│ │              ⭐ 4.8 rating (if Babalawo)              ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Tab: About | Services | Products | Reviews          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ About:                                                   │
│   Yoruba name, location, lineage, temple affiliation     │
│                                                          │
│ Services (Babalawo only):                                │
│   - Ifá Divination · ₦15,000 → [Book Now]               │
│   - Herbal Consultation · ₦10,000 → [Book Now]          │
│                                                          │
│ Products (Vendor only):                                  │
│   ┌─────┐ ┌─────┐ ┌─────┐                              │
│   │Prod │ │Prod │ │Prod │  → /product/:productId        │
│   └─────┘ └─────┘ └─────┘                              │
│                                                          │
│ Community:                                               │
│   Temple: Temple of Ọ̀ṣun → /temples/:slug              │
│   Circles: Herbal Circle → /circles/:slug               │
│                                                          │
│ [Message] [Book Consultation] (contextual actions)       │
└─────────────────────────────────────────────────────────┘

Own profile: /profile (no userId) → shows edit capabilities
```

### 6.12 Notifications

```
Desktop: Bell icon in header → Dropdown
┌─────────────────────────────┐
│  Notifications               │
│                              │
│  ● New booking confirmed     │
│    Chief Adeyemi · 2h ago    │
│                              │
│  ● Order shipped             │
│    Sacred Arts · 1d ago      │
│                              │
│  ○ Circle invitation         │
│    Herbal Circle · 2d ago    │
│                              │
│  [View All Notifications]    │
│    → /notifications           │
└─────────────────────────────┘

/notifications — Full notifications page
  - All notification types
  - Mark as read/unread
  - Filter by type
  - Auto-refresh every 30 seconds
```

---

## 7. Shared Components & Global Flows

### Global Providers (wrapping entire app)

| Provider | Purpose |
|----------|---------|
| `QueryClientProvider` | React Query data fetching cache |
| `ErrorBoundary` | Catches unhandled React errors |
| `ToastProvider` | `showToast(message, 'success'|'error'|'info')` — bottom-right notifications |
| `ModalProvider` | `showModal({ title, message, onConfirm })` — confirmation dialogs |

### Shared UI Components

| Component | Usage |
|-----------|-------|
| `SidebarLayout` | App shell with sidebar + header |
| `PageTransition` | Framer Motion page enter/exit animations |
| `LoadingSpinner` | Used as Suspense fallback + loading states |
| `ProtectedRoute` | Role-based route guard — redirects unauthorized users |
| `AdminRoute` | Admin-only route guard |
| `ProfileMenuDropdown` | User profile popup in sidebar |
| `NotificationDropdown` | Bell icon notification popup |
| `LanguageSwitcher` | English/Yoruba language toggle |
| `ModeToggle` | Light/Dark theme toggle |
| `OrishaThemeSelector` | Orisha-based color theme picker |
| `NarratorControl` | Audio narration for cultural content |
| `YorubaInputHelper` | Helper for typing Yoruba diacritics |

### Cart Context

`CartContext` (available globally) manages:
- Cart items array
- Add/remove/update quantity
- Cart total calculation
- Persisted in localStorage

### Theme System

```
Theme Modes: Light | Dark (via ModeToggle)
Orisha Themes: Each Orisha deity has unique color palette
  → Ọ̀ṣun (gold/amber)
  → Ògún (green/earth)
  → Ṣàngó (red/fire)
  → Yemọja (blue/water)
  → Obàtálá (white/silver)
  → etc.

CSS Variables: --primary, --secondary, --accent, --highlight, etc.
Applied via: className="bg-primary text-foreground"
```

### Demo Mode

When `VITE_DEMO_MODE=true`:
- All API calls fall back to demo data from `demo-ecosystem.ts`
- Demo users: Client (Adunni), Babalawo (Chief Adeyemi), Vendor (Sacred Arts), Admin
- Demo temples, circles, products, consultations pre-loaded
- No real backend required for UI testing

---

## 8. Complete Route Map

### Authentication Routes (No Sidebar)
| Route | Component | Protection |
|-------|-----------|------------|
| `/login` | LoginPage | Public |
| `/signup` | SignupPage | Public |
| `/quick-access` | QuickAccessPage | Public (dev) |
| `/test-sentry` | SentryTestPage | Public (dev) |
| `/onboarding` | OnboardingView | Public |

### Client Routes (Protected: CLIENT, ADMIN)
| Route | Component | Description |
|-------|-----------|-------------|
| `/client/dashboard` | PersonalDashboardView | Main client dashboard |
| `/personal-dashboard` | PersonalDashboardView | Alias for client dashboard |
| `/client/consultations` | ClientConsultationsView | Client consultation hub |
| `/client/wallet` | ClientWalletView | Client wallet view |
| `/client/spiritual-journey` | SpiritualJourneyView | Spiritual journey tracker |

### Babalawo Routes (Protected: BABALAWO, ADMIN)
| Route | Component | Description |
|-------|-----------|-------------|
| `/practitioner/dashboard` | PractitionerDashboard | Practice center |
| `/practitioner/invite-client` | InviteClientView | Invite clients via email |
| `/practitioner/calendar` | PractitionerCalendarView | Schedule management |
| `/practitioner/set-availability` | SetAvailabilityView | Available time slots |
| `/practitioner/earnings-report` | EarningsReportView | Revenue tracking |
| `/practitioner/my-seekers` | MySeekersView | Client list |
| `/practitioner/service-offering` | ServiceOfferingView | Service management |
| `/practitioner/temple-connection` | TempleConnectionView | Temple affiliation |
| `/practitioner/consultations` | PractitionerConsultationsPage | Calendar view |

### Vendor Routes (Protected: VENDOR, ADMIN)
| Route | Component | Description |
|-------|-----------|-------------|
| `/vendor/dashboard` | VendorDashboardView | Shop management hub |
| `/vendor/products` | VendorProductListView | Product inventory |
| `/vendor/orders` | VendorOrderListView | Order fulfillment |
| `/vendor/analytics` | VendorAnalyticsView | Sales analytics |
| `/vendor/customers` | VendorCustomerInsightsView | Customer data |
| `/vendor/support` | VendorSupportCenterView | Support tickets |

### Admin Routes (Protected: ADMIN only)
| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/dashboard` | AdminDashboardView | Governance hub (13 tabs) |
| `/admin/advisory-board-voting` | AdvisoryBoardVotingView | Board votes |
| `/admin/vendor-review` | VendorReviewView | Vendor applications |

### Public Feature Routes (Inside Sidebar Layout)
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePage | Landing / role redirect |
| `/temples` | TempleDirectory | Browse temples |
| `/temples/:slug` | TempleDetailView | Temple details |
| `/circles` | CircleDirectory | Browse circles |
| `/circles/:slug` | CircleDetailView | Circle details |
| `/forum` | ForumHomeView | Forum threads |
| `/forum/:threadId` | ThreadView | Thread discussion |
| `/academy` | AcademyView | Course catalog |
| `/academy/course/:courseId` | CourseDetailView | Course details |
| `/academy/my-courses` | MyCoursesView | Enrolled courses |
| `/academy/learn/:enrollmentId` | LessonPlayerView | Lesson content |
| `/marketplace` | MarketplacePage | Product browsing |
| `/product/:productId` | ProductDetailPage | Product details |
| `/cart` | CartPage | Shopping cart |
| `/checkout` | CheckoutPage | Order checkout |
| `/events` | EventsPage | Event directory |
| `/events/:eventSlug` | EventDetailPage | Event details |
| `/event-create` | EventCreatePage | Create new event |
| `/messages` | MessagesPage | Message inbox |
| `/wallet` | WalletDashboardView | Wallet hub |
| `/wallet/transactions` | TransactionHistoryView | Transaction history |
| `/guidance-plans` | GuidancePlansPage | Guidance plan overview |
| `/prescription-creation` | PrescriptionCreationPage | Create guidance plan |
| `/prescription-approval` | PrescriptionApprovalPage | Approve guidance plan |
| `/prescription-history` | PrescriptionHistoryPage | Plan history |
| `/consultations` | ConsultationList | Consultations list |
| `/booking/:babalawoId` | BookingPage | Book consultation |
| `/booking-confirmation/:bookingId` | BookingConfirmation | Booking receipt |
| `/profile/:userId` | ProfilePage | User profile |
| `/vendor-directory` | VendorDirectoryPage | Browse vendors |
| `/notifications` | NotificationsPage | All notifications |
| `/settings` | SettingsPage | App settings |
| `/help` | HelpPage | Help & support |
| `/yoruba-word/:wordId` | YorubaWordDetailView | Yoruba word details |
| `*` | NotFound | 404 catch-all |

---

## End-to-End Flow Summary

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌─────────────────┐
│  Visit   │───▶│  Login/  │───▶│ Onboarding│───▶│ Role Dashboard  │
│  App     │    │  Signup  │    │ (if new)  │    │                 │
└─────────┘    └──────────┘    └───────────┘    └────────┬────────┘
                                                          │
              ┌───────────────────────────────────────────┤
              ▼                   ▼                       ▼
        ┌───────────┐    ┌──────────────┐    ┌──────────────────┐
        │ Discovery  │    │ Communication │    │ Commerce          │
        │            │    │              │    │                  │
        │ Temples    │    │ Messages     │    │ Marketplace      │
        │ Babalawos  │    │ Forum        │    │ Cart + Checkout  │
        │ Circles    │    │ Notifications│    │ Wallet           │
        │ Events     │    │              │    │ Guidance Plans   │
        │ Academy    │    │              │    │ Consultations    │
        └───────────┘    └──────────────┘    └──────────────────┘
              │                   │                       │
              └───────────────────┼───────────────────────┘
                                  ▼
                          ┌──────────────┐
                          │   Profile     │
                          │   Settings    │
                          │   Help        │
                          └──────────────┘
```

---

*This document covers all features, actors, flows, routes, and navigation in the Ìlú Àṣẹ platform as of February 2026.*
