# Ilé Àṣẹ - Phase 1 MVP Testing Guide

## 🎯 What You're Testing: Phase 1 MVP - Babalawo-Client Hub

This is a **Babalawo-centric MVP** that focuses on connecting verified practitioners with seekers. You're testing the core relationship management, communication, and appointment booking features.

## ✅ Features Ready for Testing

### 1. **Authentication & Authorization** ✅
- Quick Access login (Dev/Demo mode)
- Role-based access (Client, Babalawo, Admin)
- JWT token management
- Onboarding flow

### 2. **Babalawo Verification Workflow** ✅
- 4-stage verification process
- Certificate uploads
- Verification application submission
- Admin review process

### 3. **Babalawo-Client Relationship ("Personal Awo")** ✅
- Client can select a Babalawo as their "Personal Awo"
- Babalawo can see their assigned clients
- One-to-one sacred relationship model

### 4. **Secure Messaging** ✅
- End-to-end encrypted messages between Babalawo and Client
- Message inbox and thread views
- Read receipts

### 5. **Appointment Scheduling** ✅
- WAT (West Africa Time) timezone default
- Client can book appointments with their Personal Awo
- Babalawo can manage appointments

### 6. **Profile Management** ✅
- MySpace-style profile customization
- Cultural information (Yoruba name, cultural level)
- Profile visibility controls

### 7. **Babalawo Directory** ✅
- Search and filter verified Babalawos
- Profile cards with verification status
- Client can browse and select a Personal Awo

---

## 🧪 Testing Checklist

### **Test User #1: Client Flow**

#### Step 1: Quick Access Login
- [ ] Click Quick Access → **Client**
- [ ] Should log in as `client@ilease.ng`
- [ ] Should see onboarding screen (if `hasOnboarded` is false)

#### Step 2: Onboarding
- [ ] Complete onboarding form
- [ ] Set Yoruba name, cultural level
- [ ] Submit onboarding
- [ ] Should redirect to home dashboard

#### Step 3: Browse Babalawo Directory
- [ ] Navigate to **Directory** in nav
- [ ] Should see list of verified Babalawos
- [ ] Test search functionality
- [ ] Test filters (verification tier, location, etc.)
- [ ] Click on a Babalawo profile card

#### Step 4: Select Personal Awo
- [ ] From directory, select a Babalawo as "Personal Awo"
- [ ] Should see confirmation
- [ ] Should redirect to Personal Awo Dashboard

#### Step 5: Personal Awo Dashboard
- [ ] View assigned Babalawo information
- [ ] See quick actions: Message, Book Appointment, View Documents
- [ ] Test "Change Awo" functionality

#### Step 6: Messaging
- [ ] Click **Messages** in nav or dashboard
- [ ] Should see inbox with conversations
- [ ] Click on a conversation (or start new one with Personal Awo)
- [ ] Send a test message
- [ ] Verify message appears in thread
- [ ] Test read receipts

#### Step 7: Book Appointment
- [ ] Click **Appointments** in nav or dashboard
- [ ] Click "Book Appointment" with Personal Awo
- [ ] Select date/time (should use WAT timezone)
- [ ] Add notes/description
- [ ] Submit appointment
- [ ] Verify appointment appears in calendar

#### Step 8: Profile Customization
- [ ] Navigate to **Profile** in nav
- [ ] Test MySpace-style customization
- [ ] Update bio, location, cultural information
- [ ] Test profile visibility settings
- [ ] Save changes

---

### **Test User #2: Babalawo Flow**

#### Step 1: Quick Access Login
- [ ] Click Quick Access → **Babalawo**
- [ ] Should log in as `babalawo@ilease.ng`
- [ ] Complete onboarding if needed

#### Step 2: Verification Application (if not verified)
- [ ] Should see "Verify" button in nav (if `verified: false`)
- [ ] Click **Verify** button
- [ ] Fill out verification application form
- [ ] Upload certificates/documents (Stage 1: Documentation)
- [ ] Submit application
- [ ] Should see application status

#### Step 3: Client List Dashboard
- [ ] Home should show **Practitioner Dashboard**
- [ ] Should see list of assigned clients
- [ ] Click on a client to view details

#### Step 4: Messaging with Clients
- [ ] Click **Messages** in nav
- [ ] Should see conversations with clients
- [ ] Open a conversation thread
- [ ] Send/receive messages
- [ ] Test encrypted messaging

#### Step 5: Manage Appointments
- [ ] Click **Appointments** in nav
- [ ] Should see all booked appointments
- [ ] View appointments by client
- [ ] Update appointment status (Accept/Decline/Reschedule)
- [ ] Verify WAT timezone is used

#### Step 6: Documents Portal
- [ ] Click **Documents** in nav
- [ ] Should see documents dashboard
- [ ] Upload client consultation documents
- [ ] View shared documents
- [ ] (Note: S3 integration may be pending - test file upload functionality)

#### Step 7: Profile Management
- [ ] Navigate to **Profile**
- [ ] Update professional bio
- [ ] Add/update Yoruba name, cultural credentials
- [ ] Set availability/preferences

---

### **Test User #3: Admin Flow**

#### Step 1: Quick Access Login
- [ ] Click Quick Access → **Admin**
- [ ] Should log in as `admin@ilease.ng`
- [ ] Complete onboarding if needed

#### Step 2: Admin Dashboard
- [ ] Should see admin dashboard with stats
- [ ] View user management
- [ ] View verification applications queue

#### Step 3: Review Verification Applications
- [ ] Navigate to verification applications
- [ ] View pending applications
- [ ] Review submitted documents
- [ ] Approve/Reject applications
- [ ] Update verification stage/tier

#### Step 4: User Management
- [ ] View all users
- [ ] Search/filter users
- [ ] View user profiles
- [ ] (Note: Full admin controls may be limited in MVP)

---

## 🔍 Key Things to Verify

### ✅ **Cultural Integrity**
- [ ] Yoruba diacritics preserved (Àṣẹ, Babaláwo)
- [ ] Terminology: "acknowledge" not "like", "Personal Awo" not "friend"
- [ ] Dark mode default for nighttime reflection
- [ ] WAT timezone in appointments

### ✅ **Security & Privacy**
- [ ] JWT tokens stored securely
- [ ] Messages are encrypted (check network tab)
- [ ] Only authenticated users can access protected routes
- [ ] Role-based access control works (Client can't access Admin features)

### ✅ **User Experience**
- [ ] Navigation works smoothly
- [ ] Loading states show during API calls
- [ ] Error messages are user-friendly
- [ ] Form validations work correctly
- [ ] Mobile responsiveness (test on small screen)

### ✅ **Data Flow**
- [ ] Frontend communicates with backend correctly
- [ ] API calls return expected data
- [ ] React Query caching works
- [ ] State updates correctly after mutations

---

## 🐛 Common Issues to Watch For

1. **Port Conflicts** - Use `.\scripts\start-backend.ps1` to auto-handle
2. **Missing `hasOnboarded`** - Should be fixed permanently (see FIXES.md)
3. **CORS Errors** - Backend CORS should allow `http://localhost:5173`
4. **Database Connection** - Ensure PostgreSQL is running via Docker
5. **Token Expiration** - Refresh token should auto-renew

---

## 📊 Test Scenarios

### Scenario 1: New Client Journey
1. Client logs in → Completes onboarding
2. Browses directory → Selects Personal Awo
3. Sends message to Babalawo
4. Books first appointment
5. Receives consultation documents

### Scenario 2: Babalawo Verification Journey
1. Babalawo logs in → Submits verification application
2. Uploads certificates (Stage 1)
3. Admin reviews → Approves
4. Babalawo becomes verified → Appears in directory
5. Receives client assignments

### Scenario 3: Ongoing Relationship
1. Client messages Babalawo with question
2. Babalawo responds with guidance
3. Client books follow-up appointment
4. Babalawo uploads consultation notes
5. Client views documents in portal

---

## 🚀 Next Phase (Not Yet Implemented)

**Phase 2: Forum** - Community discussions, moderated teachings
**Phase 3: Marketplace + Academy** - Vendor verification, course catalog

---

## 📝 Reporting Issues

When you find issues, note:
1. **What you were testing** (feature/flow)
2. **What happened** (actual behavior)
3. **What should happen** (expected behavior)
4. **Steps to reproduce**
5. **Browser console errors** (if any)
6. **Network tab** (check API calls)

---

## 🎯 Success Criteria

The MVP is working if:
- ✅ Clients can find and select a Personal Awo
- ✅ Babalawo and Client can message securely
- ✅ Appointments can be booked and managed
- ✅ Babalawo verification workflow works end-to-end
- ✅ All three roles (Client, Babalawo, Admin) function correctly
- ✅ No critical errors or broken flows

---

**Happy Testing! 🧪✨**
