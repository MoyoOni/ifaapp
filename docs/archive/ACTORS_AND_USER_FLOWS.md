# Ilé Àṣẹ - Complete Actors, User Flows, and Page Specifications

## Document Overview
This document provides comprehensive details about all actors (user roles and entities) in the Ilé Àṣẹ platform, their end-to-end user flows, UX specifications, page contents, and recommendations.

**Legend:**
- ** = Recommendations (should implement)
- *** = Suggestions (nice to have)

---

## Table of Contents
1. [Client](#1-client)
2. [Babalawo (Awo)](#2-babalawo-awo)
3. [Vendor](#3-vendor)
4. [Tutor](#4-tutor)
5. [Admin](#5-admin)
6. [Temple](#6-temple)
7. [Marketplace](#7-marketplace)
8. [Forum](#8-forum)
9. [Academy](#9-academy)
10. [Wallet & Payments](#10-wallet--payments)
11. [Refinements and Strategic Recommendations](#11-refinements-and-strategic-recommendations)

---

## 1. Client

### 1.1 Overview
**Role:** CLIENT  
**Purpose:** Seekers of wisdom, guidance, and cultural connection  
**Primary Goals:**
- Find and connect with verified Babalawos
- Book consultations
- Access cultural resources
- Participate in community
- Purchase authentic artifacts
- Learn through Academy

### 1.2 End-to-End User Flows

#### Flow 1: Registration & Onboarding
1. **Gateway** → Select "Client" role
2. **Registration** → Email, password, name
3. **Cultural Onboarding Path:**
   - **"Are you reconnecting with your heritage?"** → Yes/No
   - **If Yes:**
     - Glossary of key terms (Àṣẹ, Babaláwo, Odù, Ilé, etc.)
     - Video: "What to Expect in a Divination"
     - Link to beginner Academy course: "Introduction to Ifá/Isese"
     - Cultural context guide
     - Common questions FAQ
   - **If No:** Standard onboarding
4. **Onboarding** → 
   - Profile setup (Yoruba name optional, with diacritic guidance)
   - Cultural level selection (Omo Ilé, Akeko, etc.) with explanations
   - Interests selection
   - Privacy preferences
   - Profile visibility (public/private/community)
   - Language preference (English default, Yoruba toggle)
5. **Home Dashboard** → Welcome screen with feature overview

#### Flow 2: Finding a Babalawo
1. **Babalawo Directory** → Browse/search verified Babalawos
2. **Filter Options:**
   - Verification tier (Junior/Senior/Master)
   - Location
   - Temple affiliation **
   - Specializations
   - Languages
3. **Babalawo Profile** → View details
4. **Select Action:**
   - **"Book a Session"** (One-off consultation, transactional)
   - **"Request as my Personal Awo"** (Long-term relationship, requires covenant agreement)
5. **Confirmation** → Relationship established or appointment booked

**Note:** Personal Awo requests require:
- Spiritual covenant agreement (both parties)
- Relationship duration selection (3/6/12 months)
- Exclusivity acknowledgment (only one active Personal Awo)
- 14-day grace period if switching from existing Personal Awo

#### Flow 3: Booking Consultation
1. **Babalawo Profile** → Click "Book Consultation"
2. **Appointment Form:**
   - Select date/time
   - Choose consultation type
   - Add notes/concerns
   - Review pricing
3. **Payment** → Pay via wallet or payment gateway
4. **Escrow Created** → Funds held until consultation
5. **Confirmation** → Appointment scheduled
6. **Reminders** → Email/SMS notifications
7. **Consultation** → Virtual or in-person
8. **Post-Consultation:**
   - Guidance Plan (formerly "Prescription") if applicable
     - No commission on spiritual guidance
     - Small fixed platform service fee (₦100 or $0.50)
     - Clearly labeled as "Platform support fee"
   - Documents shared
   - Escrow released

#### Flow 4: Personal Awo Relationship
1. **Select Personal Awo** → From directory or recommendation
2. **Request Form:**
   - Relationship duration (3/6/12 months)
   - Spiritual covenant review and agreement
   - Terms acknowledgment (communication frequency, session cadence, response times)
   - Exclusivity acknowledgment (only one active Personal Awo)
3. **Grace Period Check:**
   - If switching from existing Personal Awo: 14-day grace period begins
   - Current relationship marked as "Transitioning"
   - Reflection resources provided
4. **Request Sent** → Babalawo receives notification
5. **Babalawo Review:**
   - Reviews covenant terms
   - Accepts or declines
   - Can propose modifications
6. **Approval** → Relationship established
7. **Dashboard Access** → Personal Awo dashboard
8. **Features:**
   - Direct messaging
   - Document sharing
   - Appointment booking
   - Guidance Plan tracking (formerly "Prescription")
   - Relationship history
   - Renewal prompts (30 days before expiration)

#### Flow 5: Marketplace Purchase
1. **Marketplace** → Browse products
2. **Product Detail** → View details, reviews, provenance
3. **Add to Cart** → Select quantity
4. **Checkout:**
   - Review cart
   - Shipping address
   - Payment method
   - Tax calculation
5. **Payment** → Paystack/Flutterwave
6. **Order Confirmation** → Order tracking
7. **Delivery** → Receive product
8. **Review** → Leave review/rating

#### Flow 6: Academy Enrollment
1. **Academy** → Browse courses
2. **Course Detail** → View curriculum, instructor, pricing
3. **Enroll** → Payment if paid course
4. **Learning Dashboard:**
   - Course progress
   - Lessons
   - Quizzes/assessments
   - Certificates
5. **Completion** → Certificate issued

#### Flow 7: Forum Participation
1. **Forum** → Browse categories
2. **Thread View** → Read discussions
3. **Participate:**
   - Create thread
   - Reply to posts
   - Acknowledge posts (not "like")
4. **Moderation** → Posts may require approval

### 1.3 Pages & Components

#### Home Dashboard (`/home`)
**Purpose:** Central hub for client activities

**Sections:**
- **Welcome Header**
  - Greeting with Yoruba name
  - Cultural level badge
  - Quick stats (appointments, courses, etc.)
- **Personal Awo Card** (if assigned)
  - Babalawo name, avatar
  - Quick actions (Message, Book, View)
  - Recent activity
- **Upcoming Appointments**
  - Next appointment card
  - Calendar view
  - Quick booking
- **Recent Activity**
  - Messages
  - Documents
  - Prescriptions
- **Quick Actions**
  - Find Babalawo
  - Browse Marketplace
  - Explore Academy
  - Join Forum
- **Cultural Progress**
  - XP/Level display
  - Achievements
  - Learning streak

**Recommendations:**
- ** Add "Temple Directory" quick link **
- ** Show temple-affiliated babalawos prominently **
- ** Display temple events/announcements **

**Suggestions:**
- *** Personalized cultural insights feed
- *** Recommended courses based on interests
- *** Community highlights

#### Babalawo Directory (`/babalawo` or `/babalawo/directory`)
**Purpose:** Search and discover verified Babalawos

**Sections:**
- **Search Bar**
  - Name, Yoruba name, bio, location
  - Advanced filters
- **Filter Sidebar:**
  - Verification tier
  - Location (city, state, country)
  - Temple **
  - Specializations
  - Languages
  - Availability
- **Results Grid:**
  - Babalawo cards
  - Temple badge **
  - Verification badge
  - Quick view button
- **Sort Options:**
  - Newest
  - Highest tier
  - Most clients
  - Alphabetical

**Recommendations:**
- ** Add temple filter prominently **
- ** Show temple name on cards **
- ** Link to temple page from cards **

**Suggestions:**
- *** Map view of babalawos
- *** Comparison tool
- *** Save favorites

#### Babalawo Profile (`/babalawo/:id`)
**Purpose:** Detailed view of individual Babalawo

**Sections:**
- **Hero Section:**
  - Avatar (large)
  - Name & Yoruba name
  - Verification badge
  - **Temple affiliation (prominent)**
  - Location
  - Quick actions (Book, Message, View Temple)
- **About:**
  - Bio
  - About Me (detailed)
  - Years of practice
  - **Temple information**
  - Cultural level
- **Verification & Credentials:**
  - Tier badge
  - Certificates
  - Specializations
  - Languages
- **Services:**
  - Consultation types
  - Pricing
  - Availability
- **Reviews/Testimonials** (if implemented)
- **Contact & Booking:**
  - Book appointment button
  - Message button
  - Contact info (if public)

**Recommendations:**
- ** Prominent temple section with link to temple page **
- ** Show temple logo and name **
- ** Display temple lineage/tradition **

**Suggestions:**
- *** Video introduction
- *** Live availability indicator
- *** Client testimonials

#### Personal Awo Dashboard (`/personal-awo`)
**Purpose:** Manage relationship with assigned Babalawo

**Sections:**
- **Babalawo Profile Card:**
  - Avatar, name, Yoruba name
  - Verification badge
  - **Temple affiliation**
  - Relationship info (assigned date)
- **Quick Actions:**
  - Send Message
  - Book Appointment
  - View Documents
  - View Prescriptions
- **Recent Activity:**
  - Messages
  - Appointments
  - Documents shared
- **Appointment History:**
  - Past consultations
  - Upcoming appointments
- **Prescriptions:**
  - Active prescriptions
  - History

**Recommendations:**
- ** Show temple information **
- ** Link to temple page **

#### Appointments (`/appointments`)
**Purpose:** Manage consultations

**Sections:**
- **Calendar View:**
  - Monthly/weekly view
  - Upcoming appointments
  - Past appointments
- **Appointment Cards:**
  - Date/time
  - Babalawo info
  - Status (Upcoming, Completed, Cancelled)
  - Actions (Reschedule, Cancel, View Details)
- **Booking Form:**
  - Select Babalawo
  - Choose date/time
  - Consultation type
  - Notes
  - Payment

**Recommendations:**
- ** Filter by temple **
- ** Show temple on appointment cards **

#### Messages (`/messages`)
**Purpose:** Secure communication with Babalawo

**Sections:**
- **Conversation List:**
  - Active conversations
  - Unread indicators
  - Last message preview
  - Confidential session indicator
- **Message Thread:**
  - Encrypted messages
  - Attachments
  - Timestamps
  - Read receipts
  - **Privacy controls:**
    - "Confidential session" toggle
    - Auto-delete settings (7/30/90 days)
    - No screenshots allowed (mobile app)
- **Compose:**
  - Select recipient (if multiple babalawos)
  - Message input
  - Attach files
  - Privacy level selector

#### Documents (`/documents`)
**Purpose:** Access shared documents

**Sections:**
- **Document List:**
  - Shared by Babalawo
  - Uploaded by client
  - Categories (Prescriptions, Notes, etc.)
- **Document Viewer:**
  - Preview
  - Download
  - Metadata
- **Upload:**
  - Share with Babalawo

#### Marketplace (`/marketplace`)
**Purpose:** Browse and purchase cultural artifacts

**Sections:**
- **Product Grid:**
  - Product cards
  - Images
  - Price
  - Vendor info
  - Verification tier
- **Filters:**
  - Category
  - Price range
  - Vendor
  - Verification tier
  - Location
- **Product Detail:**
  - Images gallery
  - Description
  - Provenance
  - Usage protocol
  - Reviews
  - Vendor info
  - Add to cart
- **Cart:**
  - Items
  - Quantity
  - Subtotal
  - Tax
  - Shipping
  - Checkout
- **Order History:**
  - Past orders
  - Tracking
  - Reviews

**Recommendations:**
- ** Filter by temple-affiliated vendors **
- ** Show temple verification on vendor profiles **

#### Academy (`/academy`)
**Purpose:** Structured learning

**Sections:**
- **Course Catalog:**
  - Course cards
  - Categories (Linguistics, Ethics, Science, etc.)
  - Filters (level, category, instructor)
- **Course Detail:**
  - Overview
  - Curriculum
  - Instructor info
  - Pricing
  - Enroll button
- **My Courses:**
  - Enrolled courses
  - Progress
  - Certificates
- **Learning Player:**
  - Video/audio lessons
  - Transcripts
  - Resources
  - Quizzes
  - Progress tracking

**Recommendations:**
- ** Show temple-affiliated instructors **
- ** Filter courses by temple **

#### Forum (`/forum`)
**Purpose:** Community discussions

**Sections:**
- **Category List:**
  - Announcements
  - Rules & Guidelines
  - Introductions
  - General Discussion
  - Isese/Ifa Teachings
  - Support Groups
- **Thread List:**
  - Thread cards
  - Author info
  - Reply count
  - Last post
  - Pinned threads
- **Thread View:**
  - Original post
  - Replies
  - Acknowledge button
  - Reply form
- **Create Thread:**
  - Category selection
  - Title
  - Content
  - Submit (may require approval)

#### Wallet (`/wallet`)
**Purpose:** Financial management

**Sections:**
- **Balance Display:**
  - Current balance
  - Currency
  - Locked status
- **Transaction History:**
  - Deposits
  - Payments
  - Refunds
  - Escrow transactions
  - Withdrawals
- **Deposit:**
  - Amount
  - Payment gateway
  - Currency conversion
- **Withdrawal** (if applicable):
  - Bank details
  - Amount
  - Request

#### Profile (`/profile`)
**Purpose:** Manage personal information

**Sections:**
- **Profile Info:**
  - Name, Yoruba name
  - Avatar
  - Bio
  - Location
  - Cultural level
  - Interests
- **Privacy Settings:**
  - Profile visibility
  - Age/gender visibility
- **Social Links:**
  - Add/edit social media
- **Account Settings:**
  - Email
  - Password
  - Notifications
- **Cultural Progress:**
  - XP
  - Level
  - Achievements

---

## 2. Babalawo (Awo)

### 2.1 Overview
**Role:** BABALAWO  
**Purpose:** Verified practitioners offering guidance and services  
**Primary Goals:**
- Manage client relationships
- Conduct consultations
- Share knowledge
- Maintain verification status
- **Belong to and represent a temple**

### 2.2 End-to-End User Flows

#### Flow 1: Registration & Verification
1. **Gateway** → Select "Babalawo" role
2. **Registration** → Email, password, name
3. **Verification Application:**
   - Lineage documentation
   - Mentor endorsements
   - Years of service
   - Specializations
   - Languages
   - Documentation uploads
4. **Temple Selection** **:
   - Select existing temple
   - Or create new temple (if qualified)
5. **Submit Application** → Status: APPLICATION
6. **Council Review** → Status: COUNCIL_REVIEW
7. **Certification** → Status: CERTIFICATION (tier assigned)
8. **Ethics Agreement** → Status: ETHICS_AGREEMENT
9. **Verified** → Can accept clients

#### Flow 2: Client Management
1. **Client List** → View all clients
2. **Client Profile** → View details
3. **Actions:**
   - Send message
   - Share document
   - View appointments
   - View prescriptions
   - Add notes
4. **Assign Client** → Accept client request
5. **Client Dashboard** → Manage relationship

#### Flow 3: Consultation Management
1. **Appointments Calendar** → View schedule
2. **New Appointment** → Client books
3. **Accept/Decline** → Confirm appointment
4. **Pre-Consultation:**
   - Review client history
   - Prepare notes
5. **Consultation:**
   - Conduct session
   - Take notes
   - Mark as completed
6. **Post-Consultation:**
   - Create prescription (if needed)
   - Share documents
   - Release escrow
   - Follow-up message

#### Flow 4: Prescription Creation
1. **Post-Appointment** → Create prescription
2. **Prescription Form:**
   - Type (Akose/Ebo)
   - Items list
   - Instructions
   - Total cost
3. **Submit** → Client receives notification
4. **Client Approval** → Escrow created
5. **Fulfillment** → Items prepared/provided
6. **Completion** → Escrow released

#### Flow 5: Document Sharing
1. **Documents Portal** → View all documents
2. **Upload Document:**
   - Select file
   - Choose client
   - Add description
   - Upload (encrypted)
3. **Share** → Client notified
4. **Access Control** → Only shared client can view

#### Flow 6: Academy Course Creation
1. **Academy** → "Create Course"
2. **Course Form:**
   - Title, description
   - Category, level
   - Curriculum (lessons)
   - Pricing
   - Thumbnail
3. **Submit** → Status: DRAFT
4. **Council Review** → Status: PENDING_APPROVAL
5. **Approval** → Status: APPROVED
6. **Publish** → Available for enrollment

### 2.3 Pages & Components

#### Dashboard (`/babalawo/dashboard`)
**Purpose:** Central hub for babalawo activities

**Sections:**
- **Stats Overview:**
  - Total clients
  - Active appointments
  - Pending prescriptions
  - Messages unread
  - Earnings (if applicable)
- **Temple Information** **:
  - Temple name, logo
  - Role in temple
  - Link to temple page
  - Temple announcements
- **Recent Activity:**
  - New client requests
  - Upcoming appointments
  - Pending prescriptions
  - Recent messages
- **Quick Actions:**
  - View Clients
  - Calendar
  - Messages
  - Documents
  - Create Course
- **Verification Status:**
  - Current tier
  - Verification badge
  - Renewal info

**Recommendations:**
- ** Prominent temple section **
- ** Temple activity feed **
- ** Link to temple management (if founder) **

#### Client List (`/babalawo/clients`)
**Purpose:** Manage all client relationships

**Sections:**
- **Client Grid:**
  - Client cards
  - Name, avatar
  - Status (Active, Inactive, Changed)
  - Last contact
  - Quick actions
- **Filters:**
  - Status
  - Search
- **Client Detail View:**
  - Profile
  - Relationship history
  - Appointments
  - Messages
  - Documents
  - Prescriptions
  - Notes (private)

**Recommendations:**
- ** Show client's cultural level **
- ** Filter by temple (if client has temple preference) **

#### Appointments Calendar (`/babalawo/appointments`)
**Purpose:** Manage consultation schedule

**Sections:**
- **Calendar View:**
  - Monthly/weekly/daily
  - Color-coded by status
  - Time slots
- **Appointment Cards:**
  - Client info
  - Date/time
  - Type
  - Status
  - Actions (Complete, Cancel, Reschedule)
- **Availability Settings:**
  - Set available hours
  - Block dates
  - Timezone

#### Messages (`/babalawo/messages`)
**Purpose:** Communicate with clients

**Sections:**
- **Conversation List:**
  - All client conversations
  - Unread indicators
- **Message Thread:**
  - Encrypted messages
  - Attachments
  - Send message
- **Templates** (suggestions):
  - Common responses
  - Prescription follow-ups

#### Documents Portal (`/babalawo/documents`)
**Purpose:** Manage and share documents

**Sections:**
- **Document Library:**
  - All uploaded documents
  - Organized by client
  - Categories
- **Upload:**
  - Select file
  - Choose client(s)
  - Description
  - Encrypt option
- **Shared Documents:**
  - Documents shared with clients
  - Access logs

#### Guidance Plans (`/babalawo/guidance-plans`) (formerly "Prescriptions")
**Purpose:** Manage Akose/Ebo guidance plans

**Sections:**
- **Guidance Plan List:**
  - All guidance plans
  - Status (Pending, Approved, In Progress, Completed)
  - Client
  - Amount (items cost + platform service fee)
- **Create Guidance Plan:**
  - Select appointment
  - Type (Akose/Ebo)
  - Items list (materials, ingredients)
  - Instructions
  - Item pricing (Babalawo sets)
  - Platform service fee (fixed: ₦100 or $0.50) - clearly labeled
  - **No commission** - transparent messaging
- **Guidance Plan Detail:**
  - Full details
  - Client approval status
  - Escrow status
  - Fulfillment tracking
  - Platform fee breakdown

**Note:** Never use "commission" terminology. Use "Platform support fee" or "Service fee".

#### Verification (`/babalawo/verification`)
**Purpose:** Manage verification status

**Sections:**
- **Current Status:**
  - Tier
  - Stage
  - Badge display
- **Application History:**
  - All stages
  - Reviewer notes
  - Timestamps
- **Renewal:**
  - Update documentation
  - Request tier upgrade
- **Temple Affiliation** **:
  - Current temple
  - Change temple (if allowed)
  - Temple verification status

**Recommendations:**
- ** Show temple verification status **
- ** Link to temple page **

#### Profile (`/babalawo/profile`)
**Purpose:** Public profile management

**Sections:**
- **Profile Info:**
  - Name, Yoruba name
  - Avatar
  - Bio, About Me
  - Location
  - **Temple affiliation (prominent)**
  - Cultural level
- **Verification:**
  - Tier badge
  - Certificates
  - Specializations
  - Languages
- **Services:**
  - Consultation types
  - Pricing
  - Availability
- **Social Links:**
  - Add/edit
- **Privacy:**
  - Profile visibility
  - Contact info visibility

**Recommendations:**
- ** Prominent temple section **
- ** Temple logo and name **
- ** Link to temple page **

#### Academy - My Courses (`/babalawo/courses`)
**Purpose:** Manage created courses

**Sections:**
- **Course List:**
  - All created courses
  - Status (Draft, Pending, Approved, Rejected)
  - Enrollment count
- **Create Course:**
  - Full course form
  - Lesson builder
  - Media uploads
- **Course Analytics:**
  - Enrollments
  - Completion rates
  - Revenue (if paid)

---

## 3. Vendor

### 3.1 Overview
**Role:** VENDOR  
**Purpose:** Sell authentic cultural artifacts and services  
**Primary Goals:**
- Get verified
- List products
- Manage orders
- Maintain authenticity
- Serve customers

### 3.2 End-to-End User Flows

#### Flow 1: Vendor Registration
1. **Gateway** → Select "Vendor" role
2. **Registration** → Email, password, name
3. **Vendor Application:**
   - Business name
   - Business license
   - Tax ID
   - Description
   - Artisan heritage proof (if applicable)
   - Yoruba proficiency proof (if language vendor)
   - Endorsement (Babalawo/elder)
4. **Submit** → Status: PENDING
5. **Admin Review** → Verification process
6. **Approval** → Status: APPROVED
7. **Vendor Dashboard** → Can list products

#### Flow 2: Product Listing
1. **Vendor Dashboard** → "Add Product"
2. **Product Form:**
   - Name, description
   - Category
   - Type (Physical/Digital/Service)
   - Price
   - Images
   - Provenance
   - Usage protocol
   - Stock (if physical)
3. **Submit** → Status: ACTIVE (or pending approval)
4. **Admin Review** (if needed) → Approved
5. **Live** → Product visible in marketplace

#### Flow 3: Order Management
1. **Orders List** → View all orders
2. **Order Detail:**
   - Customer info
   - Items
   - Shipping address
   - Payment status
3. **Process Order:**
   - Confirm payment
   - Prepare items
   - Update status (Shipped)
   - Add tracking
4. **Delivery** → Mark as delivered
5. **Payment** → Funds released to wallet

### 3.3 Pages & Components

#### Vendor Dashboard (`/vendor/dashboard`)
**Purpose:** Central hub for vendor activities

**Sections:**
- **Stats:**
  - Total products
  - Active orders
  - Revenue
  - Pending reviews
- **Quick Actions:**
  - Add Product
  - View Orders
  - Manage Inventory
- **Recent Activity:**
  - New orders
  - Product reviews
  - Messages

#### Products (`/vendor/products`)
**Purpose:** Manage product listings

**Sections:**
- **Product List:**
  - All products
  - Status (Active, Inactive, Pending)
  - Stock levels
  - Sales count
- **Add/Edit Product:**
  - Full product form
  - Image upload
  - Category selection
  - Pricing
  - Stock management
- **Product Analytics:**
  - Views
  - Sales
  - Reviews

#### Orders (`/vendor/orders`)
**Purpose:** Manage customer orders

**Sections:**
- **Order List:**
  - All orders
  - Status (Pending, Paid, Shipped, Delivered, Cancelled)
  - Customer info
  - Total amount
- **Order Detail:**
  - Full order info
  - Shipping address
  - Payment status
  - Tracking
  - Actions (Ship, Cancel, Refund)

#### Vendor Profile (`/vendor/profile`)
**Purpose:** Public vendor profile

**Sections:**
- **Business Info:**
  - Business name
  - Description
  - Logo
  - Verification badge
- **Products:**
  - Featured products
  - All products link
- **Reviews:**
  - Customer reviews
  - Ratings
- **Contact:**
  - Email
  - Social links

**Recommendations:**
- ** Show temple affiliation if vendor is temple-affiliated **
- ** Temple verification badge **

---

## 4. Tutor

### 4.1 Overview
**Role:** TUTOR (can be VENDOR role or separate)  
**Purpose:** Provide educational services (Yoruba language, cultural teachings)  
**Primary Goals:**
- Get verified
- Offer tutoring sessions
- Manage bookings
- Track student progress

### 4.2 End-to-End User Flows

#### Flow 1: Tutor Registration
1. **Registration** → Select tutor option
2. **Tutor Application:**
   - Teaching style
   - Languages
   - Experience
   - Hourly rate
   - Specialization
   - Availability
   - Endorsement
3. **Submit** → Status: PENDING
4. **Approval** → Status: APPROVED
5. **Tutor Dashboard** → Can accept bookings

#### Flow 2: Session Management
1. **Sessions Calendar** → View bookings
2. **New Booking** → Student books session
3. **Accept/Decline** → Confirm session
4. **Session:**
   - Conduct lesson
   - Track progress
   - Mark completed
5. **Payment** → Funds released

### 4.3 Pages & Components

#### Tutor Dashboard (`/tutor/dashboard`)
**Purpose:** Manage tutoring activities

**Sections:**
- **Stats:**
  - Total students
  - Upcoming sessions
  - Earnings
  - Completion rate
- **Sessions Calendar:**
  - Bookings
  - Availability
- **Students:**
  - Student list
  - Progress tracking

---

## 5. Admin

### 5.1 Overview
**Role:** ADMIN  
**Purpose:** Platform governance and oversight  
**Primary Goals:**
- Verify users (Babalawos, Vendors)
- Moderate content
- Manage disputes
- Platform analytics
- System configuration

### 5.2 End-to-End User Flows

#### Flow 1: Verification Review
1. **Admin Dashboard** → View pending verifications
2. **Application Detail:**
   - User info
   - Documentation
   - Endorsements
   - History
3. **Review:**
   - Check documentation
   - Verify endorsements
   - Add notes
4. **Decision:**
   - Approve → Move to next stage
   - Reject → Notify user with reason
   - Request more info

#### Flow 2: Content Moderation
1. **Moderation Queue** → View flagged content
2. **Review:**
   - Forum posts
   - Product listings
   - Reviews
   - Messages (if reported)
3. **Actions:**
   - Approve
   - Reject
   - Edit
   - Delete
   - Warn user

#### Flow 3: Dispute Resolution
1. **Disputes List** → View all disputes
2. **Dispute Detail:**
   - Parties involved
   - Issue description
   - Evidence
   - Escrow status
3. **Resolution:**
   - Review evidence
   - Communicate with parties
   - Make decision
   - Release/refund escrow

#### Flow 4: Temple Management **
1. **Temples List** → View all temples
2. **Temple Detail:**
   - Temple info
   - Babalawos
   - Verification status
3. **Actions:**
   - Verify temple
   - Edit temple info
   - Manage babalawos
   - Deactivate temple

### 5.3 Pages & Components

#### Admin Dashboard (`/admin/dashboard`)
**Purpose:** Central admin hub

**Sections:**
- **Overview Stats:**
  - Total users
  - Pending verifications
  - Active disputes
  - Platform revenue
  - Temple count **
- **Quick Actions:**
  - Review Verifications
  - Moderate Content
  - Resolve Disputes
  - Manage Temples **
- **Recent Activity:**
  - New registrations
  - Verification submissions
  - Reported content
  - Disputes

#### Verification Management (`/admin/verifications`)
**Purpose:** Review and approve verifications

**Sections:**
- **Application List:**
  - All applications
  - Status filter
  - Stage filter
  - Search
- **Application Detail:**
  - User profile
  - Application data
  - Documentation
  - Endorsements
  - History
  - **Temple affiliation** **
  - Actions (Approve, Reject, Request Info)

**Recommendations:**
- ** Show temple verification status **
- ** Verify temple before approving babalawo **

#### Content Moderation (`/admin/moderation`)
**Purpose:** Moderate platform content

**Sections:**
- **Queue:**
  - Flagged content
  - Pending approvals
  - Reported items
- **Content Detail:**
  - Full content
  - Author info
  - Context
  - Actions (Approve, Reject, Edit, Delete)

#### Dispute Resolution (`/admin/disputes`)
**Purpose:** Resolve user disputes

**Sections:**
- **Dispute List:**
  - All disputes
  - Status filter
  - Type filter
- **Dispute Detail:**
  - Parties
  - Issue
  - Evidence
  - Escrow info
  - Communication log
  - Resolution form

#### Temple Management (`/admin/temples`) **
**Purpose:** Manage temples

**Sections:**
- **Temple List:**
  - All temples
  - Status filter
  - Verification filter
- **Temple Detail:**
  - Full temple info
  - Babalawos list
  - Verification status
  - Actions (Verify, Edit, Deactivate)

**Recommendations:**
- ** Temple verification workflow **
- ** Manage temple-babalawo relationships **

#### Analytics (`/admin/analytics`)
**Purpose:** Platform insights

**Sections:**
- **User Analytics:**
  - Growth
  - Role distribution
  - Verification rates
- **Temple Analytics** **:
  - Temple count
  - Babalawo distribution
  - Temple activity
- **Financial:**
  - Revenue
  - Transactions
  - Escrow
- **Content:**
  - Forum activity
  - Course enrollments
  - Product sales

---

## 6. Temple

### 6.1 Overview
**Entity:** TEMPLE (not a user role, but an entity)  
**Purpose:** Represent Ifá/Isese temples (Ilé)  
**Primary Goals:**
- Organize babalawos
- Represent temple lineage
- Showcase temple information
- Build community

### 6.2 End-to-End User Flows

#### Flow 1: Temple Creation **
1. **Eligibility Check:**
   - Must be Master-tier Babalawo, OR
   - Must have Advisory Board approval + proof of lineage as Oluwo
2. **Temple Type Selection:**
   - **Ilé Ifá** (full house) - Only Master-tier
   - **Branch** - Senior-tier with Master endorsement
   - **Study Circle** - Any verified Babalawo
3. **Temple Form:**
   - Name (English & Yoruba)
   - Description
   - History
   - Mission
   - Location
   - Founder info
   - **Lineage documentation** (required for Ilé Ifá)
   - **"Who initiated you as Oluwo?"** (required for Ilé Ifá)
   - Tradition
4. **Submit** → Status: PENDING_VERIFICATION
5. **Review Process:**
   - **Ilé Ifá:** Advisory Board review required
   - **Branch:** Admin review + Master endorsement
   - **Study Circle:** Admin review
6. **Verification** → Temple page live
7. **Founder Status:**
   - Only verified founders can display "Founder of [Temple]"
   - Others display "Affiliated with [Temple]" or "Member of [Temple]"

#### Flow 2: Babalawo Assignment **
1. **Temple Page** → "Manage Babalawos" (founder/admin)
2. **Assign Babalawo:**
   - Search babalawo
   - Select
   - Assign role (if applicable)
3. **Babalawo Notification** → Accept/decline
4. **Confirmed** → Babalawo appears on temple page

#### Flow 3: Temple Discovery
1. **Temple Directory** → Browse temples
2. **Filter:**
   - Location
   - Lineage
   - Tradition
   - Verification status
3. **Temple Page** → View details
4. **View Babalawos** → See all temple members
5. **Contact Temple** → Reach out

### 6.3 Pages & Components

#### Temple Directory (`/temples`) **TOP-LEVEL NAVIGATION**
**Purpose:** Browse all temples (primary discovery method)

**Sections:**
- **Featured Temples:**
  - Carousel of verified temples
  - "Join Ilé Ọ̀ṣunlá — 12 Babalawos, 200+ years of wisdom"
  - Temple spotlight section
- **Search Bar:**
  - Name, location, lineage
- **Filters:**
  - Location (city, state, country)
  - Lineage
  - Tradition
  - Verification status
  - Temple type (Ilé Ifá, Branch, Study Circle)
- **Temple Grid:**
  - Temple cards
  - Logo
  - Name (Yoruba name)
  - Location
  - Babalawo count
  - Verification badge (prominent)
  - "Follow Temple" button
- **Sort:**
  - Name
  - Babalawo count
  - Founded year
  - Newest
  - Most followed

**Recommendations:**
- ** Make Temple Directory top-level navigation (not buried) **
- ** Feature temples on homepage **
- ** Add temple following feature **
- ** Map view of temples **
- ** Featured temples section **

**Suggestions:**
- *** Temple comparison tool
- *** Save favorite temples
- *** Temple activity feed

#### Temple Detail Page (`/temples/:slug`)
**Purpose:** Comprehensive temple information

**Sections:**
- **Hero:**
  - Banner image
  - Logo
  - Name (English & Yoruba)
  - Verification badge
  - Location with map
  - Quick stats (babalawo count, founded year)
- **About:**
  - Description
  - History
  - Mission
  - Lineage
  - Tradition
  - Specialties
- **Babalawos:**
  - Grid/list of all babalawos
  - Filter by tier
  - Search
  - Link to babalawo profiles
- **Contact:**
  - Address
  - Phone
  - Email
  - Website
  - Social links
- **Gallery:**
  - Temple images
  - Events photos
- **Statistics:**
  - Total babalawos
  - Clients served
  - Years active
  - Notable achievements

**Recommendations:**
- ** Prominent babalawos section **
- ** Easy navigation to babalawo profiles **
- ** Temple events calendar ** (future)

**Suggestions:**
- *** Temple blog/news
- *** Virtual tour
- *** Temple events listing

#### Temple Management (`/temples/:slug/manage`) **
**Purpose:** Manage temple (founder/admin only)

**Sections:**
- **Temple Info:**
  - Edit temple details
  - Upload logo/banner
  - Manage images
- **Babalawos:**
  - Add/remove babalawos
  - Assign roles
  - Manage permissions
- **Settings:**
  - Visibility
  - Contact info
  - Social links

**Recommendations:**
- ** Role management (Head, Senior, Member) **
- ** Temple announcements **

---

## 7. Marketplace

### 7.1 Overview
**Feature:** MARKETPLACE  
**Purpose:** Buy and sell authentic cultural artifacts  
**Actors:** Clients (buyers), Vendors (sellers), Admins (moderators)

### 7.2 Key Features

#### Product Categories
- Institutional Tools
- Textiles
- Books & Media
- Art & Crafts
- Herbs & Ingredients
- Yoruba Tutors
- Digital Mastery

#### Verification Tiers
- **COUNCIL_APPROVED:** Highest authenticity
- **ARTISAN_DIRECT:** Direct from artisan
- **COMMUNITY_LISTED:** Community verified

### 7.3 Pages & Components

#### Marketplace Home (`/marketplace`)
**Sections:**
- **Featured Products**
- **Categories Grid**
- **Search Bar**
- **Filters:**
  - Category
  - Price range
  - Vendor
  - Verification tier
  - Location
- **Product Grid:**
  - Product cards
  - Image
  - Name
  - Price
  - Vendor
  - Verification badge
  - Quick view

#### Product Detail (`/marketplace/products/:id`)
**Sections:**
- **Image Gallery**
- **Product Info:**
  - Name
  - Description
  - Long description
  - Category
  - Type
- **Pricing:**
  - Price
  - Currency
  - Tax info
- **Provenance:**
  - Origin
  - Authenticity info
- **Usage Protocol:**
  - Instructions
  - Cultural context
- **Vendor Info:**
  - Vendor card
  - Verification
  - **Temple affiliation** **
  - Reviews
- **Reviews:**
  - Customer reviews
  - Ratings
  - Acknowledge helpful
- **Add to Cart**

#### Cart (`/marketplace/cart`)
**Sections:**
- **Cart Items:**
  - Product
  - Quantity
  - Price
  - Remove
- **Summary:**
  - Subtotal
  - Tax
  - Shipping
  - Total
- **Checkout Button**

#### Checkout (`/marketplace/checkout`)
**Sections:**
- **Order Review:**
  - Items
  - Quantities
  - Prices
- **Shipping:**
  - Address form
  - Shipping method
- **Payment:**
  - Payment method
  - Wallet balance
  - Payment gateway
- **Place Order**

#### Order History (`/marketplace/orders`)
**Sections:**
- **Order List:**
  - Order cards
  - Date
  - Status
  - Total
  - Items count
- **Order Detail:**
  - Full order info
  - Tracking
  - Items
  - Shipping
  - Payment
  - Actions (Cancel, Review)

**Recommendations:**
- ** Filter products by temple-affiliated vendors **
- ** Show temple verification on vendor profiles **
- ** Temple marketplace section **

---

## 8. Forum

### 8.1 Overview
**Feature:** FORUM  
**Purpose:** Community discussions and cultural teachings  
**Actors:** All users (with moderation)

### 8.2 Key Features

#### Categories
- **Announcements:** Official updates (admin only)
- **Rules & Guidelines:** Platform rules (admin only)
- **Introductions:** Welcome new members
- **General Discussion:** Cultural conversations
- **Isese/Ifa Teachings:** Philosophical study
- **Support Groups:** Solidarity and advice

#### Moderation
- Posts may require approval
- Community Advisory Council can moderate
- Threads can be locked/pinned/deleted

### 8.3 Pages & Components

#### Forum Home (`/forum`)
**Sections:**
- **Category List:**
  - All categories
  - Thread count
  - Last post
  - Icon
- **Recent Threads:**
  - Latest threads across categories
  - Author info
  - Reply count
  - Last post

#### Category View (`/forum/categories/:slug`)
**Sections:**
- **Category Header:**
  - Name
  - Description
  - Thread count
- **Thread List:**
  - Thread cards
  - Title
  - Author
  - Reply count
  - Last post
  - Pinned indicator
- **Create Thread Button**

#### Thread View (`/forum/threads/:id`)
**Sections:**
- **Thread Header:**
  - Title
  - Author info
  - Category
  - Created date
  - View count
- **Original Post:**
  - Content
  - Author card
  - **Àṣẹ button** (not "like") - "Acknowledge wisdom"
  - Acknowledgment count: "X elders acknowledged this teaching"
  - List of acknowledgers (if public)
  - Actions (if author/mod)
- **Replies:**
  - Reply cards
  - Author info
  - Content
  - **Àṣẹ button** - "Acknowledge wisdom"
  - Acknowledgment count
  - Timestamp
- **Reply Form:**
  - Content input
  - Submit (may require approval)

**Note:** All "like" buttons replaced with "Àṣẹ/Acknowledge" to prevent gamification and encourage reflection.

#### Create Thread (`/forum/threads/create`)
**Sections:**
- **Category Selection**
- **Title Input**
- **Content Editor:**
  - Rich text
  - Formatting
  - Attachments (if allowed)
- **Submit** (may require approval)

**Recommendations:**
- ** Temple-specific discussion categories **
- ** Temple announcements section **
- ** Filter threads by temple affiliation **

**Suggestions:**
- *** Thread subscriptions
- *** Email notifications
- *** Advanced search

---

## 9. Academy

### 9.1 Overview
**Feature:** ACADEMY  
**Purpose:** Structured learning and certification  
**Actors:** Clients (students), Babalawos (instructors), Admins (approvers)

### 9.2 Key Features

#### Course Categories (Pillars)
- **Linguistics (Èdè):** Yoruba language
- **Ethics (Ìwà):** Moral teachings
- **Science (Ewé):** Herbal knowledge
- **Philosophy (Ìjìnlẹ̀):** Deep wisdom
- **Governance (Ìlú):** Community leadership
- **Art & Sound (Oṣùn):** Cultural arts

#### Course Levels
- **BEGINNER:** Introductory
- **INTERMEDIATE:** Advanced concepts
- **ADVANCED:** Expert level

### 9.3 Pages & Components

#### Academy Home (`/academy`)
**Sections:**
- **Featured Courses**
- **Categories:**
  - Pillar cards
  - Course count
- **Search Bar**
- **Filters:**
  - Category
  - Level
  - Instructor
  - Price (Free/Paid)
- **Course Grid:**
  - Course cards
  - Thumbnail
  - Title
  - Instructor
  - Level
  - Price
  - Enrollment count
  - Rating

#### Course Detail (`/academy/courses/:slug`)
**Sections:**
- **Hero:**
  - Thumbnail
  - Title
  - Instructor info
  - **Temple affiliation** **
  - Rating
  - Enrollment count
- **Overview:**
  - Description
  - What you'll learn
  - Requirements
- **Curriculum:**
  - Lesson list
  - Duration
  - Lesson types
- **Instructor:**
  - Profile card
  - Bio
  - Other courses
  - **Temple info** **
- **Pricing:**
  - Price
  - Currency
  - Enroll button
- **Reviews:**
  - Student reviews
  - Ratings

#### Learning Player (`/academy/courses/:slug/learn`)
**Sections:**
- **Video/Audio Player:**
  - Lesson content
  - Controls
  - Transcript
- **Sidebar:**
  - Course curriculum
  - Lesson list
  - Progress
  - Resources
- **Navigation:**
  - Previous/Next lesson
  - Complete lesson
- **Progress:**
  - Completion percentage
  - Time spent

#### My Courses (`/academy/my-courses`)
**Sections:**
- **Enrolled Courses:**
  - Course cards
  - Progress
  - Last accessed
  - Continue button
- **Completed Courses:**
  - Certificates
  - Download option
- **Wishlist:**
  - Saved courses

**Recommendations:**
- ** Filter courses by temple-affiliated instructors **
- ** Show temple on instructor profiles **
- ** Temple course collections **

---

## 10. Wallet & Payments

### 10.1 Overview
**Feature:** WALLET & PAYMENTS  
**Purpose:** Financial transactions and escrow  
**Actors:** All users (with different capabilities)

### 10.2 Key Features

#### Payment Gateways
- **Paystack:** Nigeria
- **Flutterwave:** African diaspora (USD, GBP, CAD, EUR)

#### Transaction Types
- **DEPOSIT:** Add funds
- **WITHDRAWAL:** Remove funds
- **PAYMENT:** Purchase/service
- **REFUND:** Return funds
- **ESCROW_HOLD:** Hold for service
- **ESCROW_RELEASE:** Release after completion

### 10.3 Pages & Components

#### Wallet Dashboard (`/wallet`)
**Sections:**
- **Balance Display:**
  - Current balance
  - Currency
  - Locked status
  - Available balance
- **Quick Actions:**
  - Deposit
  - Withdraw (if applicable)
  - Transfer (if applicable)
- **Recent Transactions:**
  - Last 10 transactions
  - Type
  - Amount
  - Status
  - Date

#### Transaction History (`/wallet/transactions`)
**Sections:**
- **Transaction List:**
  - All transactions
  - Filters (type, status, date)
  - Search
- **Transaction Detail:**
  - Full details
  - Reference
  - Status
  - Metadata
- **Export:**
  - Download CSV
  - Print statement

#### Deposit (`/wallet/deposit`)
**Sections:**
- **Amount Input:**
  - Currency selection
  - Amount
  - Conversion display (if different currency)
- **Payment Method:**
  - Payment gateway selection
  - Card/bank options
- **Review:**
  - Amount
  - Fees
  - Total
- **Pay Button**

#### Withdrawal (`/wallet/withdraw`) (Babalawo/Vendor)
**Sections:**
- **Balance Display**
- **Withdrawal Form:**
  - Amount
  - Bank details
  - Account info
- **Submit Request**
- **Request History:**
  - Pending
  - Approved
  - Processed
  - Rejected

**Recommendations:**
- ** Multi-currency support **
- ** Automatic currency conversion **
- ** Escrow management UI **

---

## Cross-Cutting Recommendations

### Temple Integration **
1. ** Add temple filter to all relevant pages **
2. ** Show temple affiliation prominently on profiles **
3. ** Temple verification badges **
4. ** Temple directory accessible from main navigation **
5. ** Temple pages linked from babalawo profiles **

### Cultural Respect
1. ** Proper Yoruba diacritics throughout **
2. ** Culturally appropriate terminology **
3. ** Respectful engagement (acknowledge vs like) **
4. ** Privacy controls for sensitive info **

### User Experience
1. ** Consistent navigation **
2. ** Mobile-responsive design **
3. ** Accessibility compliance **
4. ** Performance optimization **
5. ** Clear error messages **

### Security & Privacy
1. ** Encrypted messaging **
2. ** Secure document storage **
3. ** Privacy controls **
4. ** Audit logs **
5. ** Two-factor authentication **

---

## Future Enhancements (Suggestions)

### Advanced Features
- *** Video consultations
- *** Group consultations
- *** Temple events calendar
- *** Cultural calendar (festivals, ceremonies)
- *** AI-powered recommendations
- *** Mobile apps (iOS/Android)
- *** Offline mode
- *** Multi-language support (beyond Yoruba/English)

### Social Features
- *** User connections/following
- *** Activity feeds
- *** Notifications center
- *** Social sharing
- *** Community challenges

### Analytics & Insights
- *** Personal cultural journey tracking
- *** Learning analytics
- *** Spending insights
- *** Community engagement metrics

---

## Implementation Priority

### Phase 1 (Critical)
1. Temple model and relationships
2. Temple directory and detail pages
3. Temple integration in babalawo profiles
4. Temple filter in babalawo directory

### Phase 2 (Important)
5. Temple management (founder/admin)
6. Temple verification workflow
7. Temple integration in marketplace
8. Temple integration in academy

### Phase 3 (Enhancements)
9. Temple events
10. Temple analytics
11. Advanced temple features

---

## 11. Refinements and Strategic Recommendations

### 11.1 Critical Refinements

#### 1. Clarify "Personal Awo" vs "One-off Consultation"

**Problem:** UI must clearly distinguish between transactional consultations and long-term relationships.

**Solution:**
- **Two distinct CTAs on Babalawo profile:**
  - "Book a Session" (transactional, one-time consultation)
  - "Request as my Personal Awo" (relational, long-term commitment)
- **Personal Awo Request Flow:**
  - Clear explanation of relationship commitment
  - Spiritual covenant agreement (both parties agree to terms)
  - Relationship duration options (3/6/12 months) with renewal prompts
  - Exclusivity: Only one active Personal Awo at a time
  - Grace period: 14-day waiting period before switching (to discourage impulsive changes)
  - Review cycle: Quarterly relationship check-ins
- **One-off Consultation Flow:**
  - Simple booking form
  - No relationship commitment
  - Transactional payment
  - No exclusivity requirements

**UI Implementation:**
```
┌─────────────────────────────────────┐
│  [Book a Session]  [Request Personal Awo] │
│  (Transactional)   (Long-term)           │
└─────────────────────────────────────┘
```

**Recommendations:**
- ** Add relationship duration selector **
- ** Add spiritual covenant step with terms agreement **
- ** Show grace period warning before switching **
- ** Add relationship review prompts **

**Note on Free Will:** While we honor free will, the grace period and covenant help users make thoughtful decisions about this sacred relationship. Users can still switch, but with intentionality.

---

#### 2. Temple Creation Permissions

**Problem:** Current plan allows any Babalawo to create a temple, but in tradition, only Oluwo or Iyanifa can found an Ilé.

**Solution:**
- **Restrict Temple Creation to:**
  - Master-tier Babalawos (verified via 4-stage process), OR
  - Advisory Board approval + proof of lineage as Oluwo
- **Temple Type Field:**
  - Ilé Ifá (full house) - Only Master-tier
  - Branch - Senior-tier with Master endorsement
  - Study Circle - Any verified Babalawo
- **Verification Requirements:**
  - Proof of lineage documentation
  - "Who initiated you as Oluwo?" field
  - Advisory Board review for Ilé Ifá type
- **Babalawo Profile Display:**
  - "Affiliated with [Temple Name]" (default)
  - "Founder of [Temple Name]" (only if verified as founder)
  - "Member of [Temple Name]" (standard)

**Recommendations:**
- ** Implement tier-based temple creation restrictions **
- ** Add temple type classification **
- ** Require Advisory Board approval for Ilé Ifá **
- ** Verify founder status before displaying "Founder of" **

---

#### 3. Offline & Low-Bandwidth Considerations

**Problem:** Many users (in Nigeria or rural diaspora) have spotty internet.

**Solution:**
- **Offline-First Features:**
  - Cache appointment details locally
  - Allow draft messages/documents to sync later
  - Optimize image/media loading (progressive loading, thumbnails)
  - Service Worker for offline support
- **Low-Bandwidth Optimizations:**
  - Lazy load images
  - Compress media before upload
  - Show text-first, images second
  - Offer "Low Data Mode" toggle
- **Sync Strategy:**
  - Queue actions when offline
  - Auto-sync when connection restored
  - Show sync status indicator
  - Manual sync button

**Recommendations:**
- ** Implement Service Worker for offline support **
- ** Add offline queue for actions **
- ** Optimize all media loading **
- ** Add "Low Data Mode" setting **

---

#### 4. Dispute Resolution Nuance

**Problem:** Spiritual disputes are not like marketplace returns.

**Solution:**
- **Advisory Board Authority:**
  - Advisory Board (not just Admin) has binding authority on spiritual ethics cases
  - Separate dispute types:
    - Marketplace disputes (Admin handles)
    - Spiritual ethics disputes (Advisory Board handles)
- **Mediation Process:**
  - Mediation logs (all communications recorded)
  - Cultural restitution (not just refunds)
  - Resolution may include:
    - Refund (if applicable)
    - Apology/acknowledgment
    - Educational component
    - Community service
- **Dispute Categories:**
  - Payment/Service disputes (standard)
  - Spiritual guidance disputes (Advisory Board)
  - Ethics violations (Advisory Board)
  - Marketplace issues (Admin)

**Recommendations:**
- ** Separate spiritual disputes from marketplace disputes **
- ** Require Advisory Board for spiritual ethics cases **
- ** Add cultural restitution options **
- ** Create mediation log system **

---

#### 5. Privacy for Sensitive Topics

**Problem:** Users may discuss illness, family conflict, or ancestral issues.

**Solution:**
- **Enhanced Privacy Controls:**
  - "Confidential session" toggle (hides from activity feed)
  - Auto-delete messages after X days (user configurable: 7/30/90 days)
  - No screenshots allowed in consultation UI (via mobile app)
  - End-to-end encryption for sensitive messages
- **Privacy Levels:**
  - Public: Visible to community
  - Community: Visible to verified members
  - Private: Only visible to you and Babalawo
  - Confidential: Encrypted, auto-delete, no activity logs
- **Session Privacy:**
  - Mark consultation as "Confidential"
  - Hide from activity feed
  - Encrypt session notes
  - Auto-delete after completion (optional)

**Recommendations:**
- ** Add "Confidential Session" toggle **
- ** Implement auto-delete for messages **
- ** Add screenshot prevention in mobile app **
- ** Add privacy level selector **

---

#### 6. Strengthen "Personal Awo" Relationship Model

**Problem:** Need to balance free will with sacredness of the relationship.

**Solution:**
- **Relationship Duration:**
  - Options: 3/6/12 months
  - Renewal prompts 30 days before expiration
  - Auto-renewal option (user can disable)
- **Spiritual Covenant:**
  - Both parties agree to terms:
    - Communication frequency expectations
    - Session cadence
    - Response time expectations
    - Confidentiality agreement
  - Display covenant on both profiles
- **Exclusivity:**
  - Only one active Personal Awo at a time
  - Clear messaging: "You currently have [Name] as your Personal Awo"
  - Must end current relationship before starting new one
- **Grace Period:**
  - 14-day waiting period before switching
  - During grace period:
    - Relationship marked as "Transitioning"
    - Can still communicate with current Awo
    - Cannot start new relationship
  - Purpose: Discourage impulsive changes, encourage reflection
- **Switching Process:**
  1. Request to end relationship
  2. 14-day grace period begins
  3. Reflection period (optional resources provided)
  4. After grace period, can request new Personal Awo
  5. Previous relationship archived (not deleted)

**Recommendations:**
- ** Implement relationship duration system **
- ** Add spiritual covenant agreement step **
- ** Enforce one active Personal Awo rule **
- ** Add 14-day grace period before switching **

**Note on Free Will:** The grace period doesn't prevent switching—it encourages intentionality. Users can still change their Personal Awo, but with time for reflection on this sacred relationship.

---

#### 7. Fix Monetization Conflict in Prescription Flow

**Problem:** Conflict between "Never take commission on Akose/Ebo" and commission models.

**Solution:**
- **Remove Commission Model:**
  - No percentage commission on Akose/Ebo prescriptions
  - No commission on spiritual guidance
- **Platform Service Fee:**
  - Small fixed platform service fee (e.g., ₦100 or $0.50) per prescription
  - Fixed amount, not percentage
  - Clearly labeled: "Platform support fee" (not "commission")
  - Transparent in UI: "This small fee supports platform operations"
- **Prescription Pricing:**
  - Babalawo sets item costs (materials, ingredients)
  - Platform fee added separately
  - Total shown clearly: "Items: ₦X, Platform fee: ₦100, Total: ₦Y"
- **UI Labels:**
  - Never use "commission" in prescription context
  - Use "Platform support fee" or "Service fee"
  - Explain purpose: "Supports platform operations and maintenance"

**Recommendations:**
- ** Remove commission from prescription flow **
- ** Add fixed platform service fee **
- ** Update all UI labels to "Platform support fee" **
- ** Add transparency messaging **

---

#### 8. Optimize Onboarding for Diaspora Users

**Problem:** Diaspora users may lack Yoruba literacy or cultural context.

**Solution:**
- **Cultural Onboarding Path:**
  - During signup: "Are you reconnecting with your heritage?" → Yes/No
  - If Yes → Offer:
    - Glossary of key terms (Àṣẹ, Babaláwo, Odù, Ilé, etc.)
    - Video: "What to Expect in a Divination"
    - Link to beginner Academy course: "Introduction to Ifá/Isese"
    - Cultural context guide
    - Common questions FAQ
  - If No → Standard onboarding
- **Language Preferences:**
  - Default language: English
  - Yoruba toggle in profile (can switch anytime)
  - Bilingual support throughout app
- **Cultural Level Guidance:**
  - Explain each level (Omo Ilé, Akeko, Oye, Aremo, Omo Awo)
  - Help users select appropriate starting level
  - Link to Academy courses for each level
- **Terminology Helper:**
  - Tooltips on key terms
  - "Learn more" links to glossary
  - Contextual help throughout app

**Recommendations:**
- ** Add "Reconnecting with heritage" onboarding path **
- ** Create glossary and cultural guides **
- ** Add beginner Academy course link **
- ** Implement bilingual support **

---

### 11.2 Strategic Suggestions for Differentiation

#### 9. Launch "Temple Verified" Marketplace Badge

**Solution:**
- **Temple Endorsement System:**
  - Vendors endorsed by a verified Temple get special badge
  - Babalawos can vouch for artisans
  - Example: "This Opele was blessed by Ilé Ọ̀ṣunlá"
- **Badge Display:**
  - "Temple Verified" badge on product cards
  - Temple name and logo on product detail
  - Link to temple page
- **Trust Layer:**
  - Creates trust beyond individual reviews
  - Shows community endorsement
  - Validates authenticity

**Recommendations:**
- ** Add temple endorsement system for vendors **
- ** Create "Temple Verified" badge **
- ** Allow Babalawos to vouch for artisans **

---

#### 10. Introduce "Community Acknowledgment" (Not Likes)

**Solution:**
- **Replace "Likes" with "Àṣẹ" Button:**
  - Tap to affirm wisdom
  - Shows: "3 elders acknowledged this teaching"
  - Prevents gamification
  - Encourages reflection
- **Acknowledgment Display:**
  - Show count: "X acknowledgments"
  - List acknowledgers (if public): "Acknowledged by [Names]"
  - Different from "likes" - more respectful, culturally appropriate
- **Implementation:**
  - Forum posts: "Acknowledge" button
  - Academy lessons: "Acknowledge wisdom" button
  - Marketplace reviews: "Acknowledge helpful" (already implemented)

**Recommendations:**
- ** Replace all "like" buttons with "Àṣẹ/Acknowledge" **
- ** Update terminology throughout app **
- ** Add acknowledgment count display **

---

#### 11. Add "Lineage Tree" Visualization (Future)

**Solution:**
- **Interactive Lineage Display:**
  - On Babalawo profile, show lineage tree
  - Example: You ← Mentor ← Oluwo ← Ilé Ifá
  - Click to expand each level
  - Shows spiritual genealogy
- **Benefits:**
  - Builds trust
  - Educational (shows tradition)
  - Validates authenticity
  - Connects to larger community
- **Privacy:**
  - Only show if Babalawo opts in
  - Can show partial lineage (e.g., "Mentor: [Name], Ilé: [Name]")

**Suggestions:**
- *** Implement lineage tree visualization
- *** Add interactive expand/collapse
- *** Link to mentor and temple profiles

---

### 11.3 Critical Gaps to Address Before Launch

#### Gap 1: No Offline Mode
**Risk:** Poor UX in low-bandwidth areas (Nigeria/diaspora)

**Fix:**
- Cache profiles, messages, prescriptions locally
- Service Worker for offline support
- Queue actions when offline, sync when online
- Show offline indicator

**Priority:** High

---

#### Gap 2: No Yoruba Diacritic Validation
**Risk:** Names like "Ọlọ́run" become "Olurun"

**Fix:**
- Enforce Unicode NFC normalization
- Input guidance (show diacritic keyboard)
- Validation on submit
- Auto-correction suggestions
- Display helper: "Type 'o' then select 'ọ' from suggestions"

**Priority:** High

---

#### Gap 3: Wallet Lacks Multi-Currency Display
**Risk:** Confusion for diaspora users

**Fix:**
- Show balances in local currency + NGN equivalent
- Currency conversion display
- Multi-currency wallet support
- Exchange rate display
- "Convert to [Currency]" option

**Priority:** Medium

---

#### Gap 4: Prescription = Product?
**Risk:** Commodifying sacred acts

**Fix:**
- Rename "Prescription" → "Guidance Plan" in UI
- Or "Spiritual Guidance" or "Divination Results"
- Never use marketplace terminology
- Separate from product listings
- Clear messaging: "This is spiritual guidance, not a product"

**Priority:** High

---

### 11.4 Final Strategic Recommendation: Lead with Temple, Not Individual

**Insight:** Your strongest differentiator isn't just verified Babalawos—it's verified Temples.

**Reframe Your Pitch:**
> "Ilé Àṣẹ connects you not just to a Babalawo, but to a living Ilé—a lineage, a community, a tradition."

**Actions:**

1. **Make Temple Directory a Top-Level Tab**
   - Not buried in filters
   - Prominent in main navigation
   - "Temples" tab alongside "Babalawos", "Marketplace", etc.

2. **Feature Temples on Homepage**
   - "Join Ilé Ọ̀ṣunlá — 12 Babalawos, 200+ years of wisdom"
   - Featured temples carousel
   - Temple spotlight section

3. **Let Users Follow Temples**
   - Not just individuals
   - Temple activity feed
   - Temple announcements
   - Temple events

4. **Temple-First Discovery**
   - Default view: Browse temples first
   - Then discover Babalawos within temples
   - "Find a Temple" as primary CTA

5. **Temple Verification Badge**
   - Prominent on all temple pages
   - "Verified Temple" badge
   - Shows verification date and authority

**This positions Ilé Àṣẹ as a digital Ilé Ifá—not just another gig platform.**

**Recommendations:**
- ** Make Temple Directory top-level navigation **
- ** Feature temples on homepage **
- ** Add temple following feature **
- ** Temple-first discovery flow **
- ** Prominent temple verification badges **

---

## Updated Implementation Priority

### Phase 1 (Critical - Launch Blockers)
1. Temple model and relationships
2. Temple creation permissions (Master-tier only)
3. Temple directory (top-level navigation)
4. Temple integration in babalawo profiles
5. Personal Awo vs One-off Consultation distinction
6. Prescription monetization fix (remove commission, add service fee)
7. Privacy controls for sensitive topics
8. Yoruba diacritic validation
9. Prescription renaming ("Guidance Plan")

### Phase 2 (Important - Core Features)
10. Personal Awo relationship model (duration, covenant, grace period)
11. Temple verification workflow
12. Offline mode (Service Worker, caching)
13. Multi-currency wallet display
14. Cultural onboarding for diaspora users
15. Dispute resolution (Advisory Board for spiritual cases)
16. Temple following feature

### Phase 3 (Enhancements)
17. Temple Verified marketplace badge
18. Àṣẹ acknowledgment system (replace likes)
19. Lineage tree visualization
20. Temple events calendar
21. Temple analytics
22. Advanced temple features

---

This document provides a comprehensive overview of all actors, their flows, page specifications, and critical refinements. Use it as a reference for implementation and UX design decisions.
