# 🧪 Quick Smoke Test Guide — Ìlú Àṣẹ Platform

**Purpose:** Manual verification that key user flows work end-to-end before launch
**Environment:** Staging — http://100.52.200.113:4040
**Time Required:** 20-30 minutes
**Last Updated:** March 13, 2026

---

## 🚀 Quick Start

### Staging URLs
```
Frontend:  http://100.52.200.113:4040
Backend:   http://100.52.200.113:8080/api/health
Swagger:   http://100.52.200.113:8080/api/docs
```

### Test Account
```
Email: test@example.com
Password: TestPassword123!
```

> **Note:** The staging database starts empty. You will need to register a new account in Test 1 before running subsequent tests. There is no pre-seeded demo data on staging.

---

## 🧪 8 Critical Smoke Tests

### ✅ Test 1: User Registration & Onboarding (5 min)

**Goal:** Verify users can sign up and complete cultural onboarding

1. [ ] Open http://100.52.200.113:4040
2. [ ] Click **"Sign Up"** or **"Register"**
3. [ ] Enter:
   - Email: `smoke-test-${Date.now()}@example.com`
   - Password: `TestPass123!`
   - Name: `Test User`
4. [ ] Select role: **CLIENT**
5. [ ] Click **"Register"**
6. [ ] Should see **onboarding wizard** (3 steps)
7. [ ] Complete cultural level selection
8. [ ] Should see **dashboard** with:
   - ✅ User name displayed
   - ✅ Role badge (Client)
   - ✅ Quick action cards visible
9. [ ] Log out and log back in with same credentials
   - Confirm **session persists** ✅

**Expected Result:** User created, cultured onboarded, dashboard accessible ✅

---

### ✅ Test 2: Babalawo Discovery & Booking (6 min)

**Goal:** Verify users can find babalawo and book consultations

1. [ ] From dashboard, click **"Find a Babalawo"** or navigate to `/babalawo`
2. [ ] Should see **temple directory** with list of temples
3. [ ] Click a temple (e.g., "Main Temple")
4. [ ] Should see **babalawo list** filtered by temple
5. [ ] Click **"View Profile"** on a babalawo
6. [ ] Profile should show:
   - ✅ Name, avatar, bio
   - ✅ Availability calendar
   - ✅ Reviews/ratings
   - ✅ **"Book Consultation"** button
7. [ ] Click **"Book Consultation"**
8. [ ] Should see **booking form** with:
   - ✅ Date/time picker
   - ✅ Issue description field
   - ✅ **"Confirm Booking"** button
9. [ ] Fill form and click **"Confirm"**
10. [ ] Should see **confirmation page** showing:
    - ✅ Booking ID
    - ✅ Babalawo name
    - ✅ Date/time
    - ✅ **"View My Consultations"** CTA

**Expected Result:** Booking created, confirmation displayed ✅

---

### ✅ Test 3: Wallet & Payment Flow (5 min)

**Goal:** Verify wallet operations and payment safety

1. [ ] From dashboard, click **"Wallet"** or navigate to `/wallet`
2. [ ] Should see:
   - ✅ Current balance (demo balance = 50,000 NGN)
   - ✅ Transaction history (if any)
   - ✅ **"Add Funds"** button
3. [ ] Click **"Add Funds"**
4. [ ] Enter amount: `10000` NGN
5. [ ] Click **"Deposit"**
6. [ ] Should see:
   - ✅ Success toast/notification
   - ✅ Balance updated to 60,000 NGN
   - ✅ New transaction in history with "DEPOSIT" type
7. [ ] **Idempotency test:** Retry with same amount
   - Open browser DevTools → Network tab
   - Note the `Idempotency-Key` request header
   - Manually resend same request
   - Should receive **SAME transaction ID** (not charged twice)
8. [ ] Check balance hasn't doubled (should still be ~60,000)

**Expected Result:** Deposit successful, balance correct, no double-charge ✅

---

### ✅ Test 4: Real-Time Messaging (5 min)

**Goal:** Verify messaging and WebSocket connectivity

1. [ ] From dashboard, click **"Messages"** or navigate to `/messages`
2. [ ] Should see:
   - ✅ Inbox with message list
   - ✅ Message threads (or empty if first time)
3. [ ] Create a new message:
   - Start a message with a babalawo
   - Type: "Hello, I'd like to book a session"
   - Click **"Send"**
4. [ ] Should see:
   - ✅ Message appears immediately in chat
   - ✅ Message marked as "SENT"
5. [ ] **WebSocket test (if logged in as 2 users):**
   - Open second browser window, log in as babalawo
   - Navigate to `/messages`
   - Check client's message appears in **real-time** (no page refresh needed)
   - Babalawo sends reply
   - Check client receives **real-time notification**

**Expected Result:** Messages sent/received, real-time updates working ✅

---

### ✅ Test 5: Admin Functions (4 min)

**Goal:** Verify admin panel is accessible and functional

1. [ ] Create/log in as **ADMIN** user
   - Email: `admin@example.com`
   - Password: `AdminPass123!`
   - Role: `ADMIN`
2. [ ] Navigate to `/admin` or click **"Admin Panel"** from dashboard
3. [ ] Should see dashboard with tabs:
   - ✅ **Verification Queue** (users pending verification)
   - ✅ **Disputes** (open disputes)
   - ✅ **Analytics** (overview stats)
4. [ ] Click **"Verification Queue"**
5. [ ] Should see list of users and action buttons:
   - ✅ "Approve" button
   - ✅ "Request Additional Info" button
   - ✅ "Reject" button
6. [ ] Click **"Approve"** on one user
7. [ ] Should see success toast and user's status change to "APPROVED"
8. [ ] Check audit log (if accessible):
   - Should show **action in audit trail** with timestamp, admin ID, action taken

**Expected Result:** Admin functions accessible, approval works, audit logged ✅

---

### ✅ Test 6: Mobile Responsiveness (4 min)

**Goal:** Verify touch interactions and layout on mobile devices

1. [ ] Open DevTools (F12 → Toggle Device Toolbar)
2. [ ] Select **iPhone 12 (390px)** or **iPhone 6 (375px)**
3. [ ] Navigate dashboard:
   - ✅ All buttons clickable (tap-friendly)
   - ✅ No horizontal scroll
   - ✅ Text readable
   - ✅ Images load
4. [ ] Test booking flow on mobile:
   - Browse babalawo (temple list, babalawo cards)
   - Book consultation (form fills screen width)
   - Submit (button active)
5. [ ] Test messaging on mobile:
   - Send/receive messages
   - Keyboard appears and doesn't hide send button
6. [ ] Test wallet on mobile:
   - Balance displays clearly
   - Transaction history scrolls vertically only

**Expected Result:** All interactions work on mobile, no horizontal scroll ✅

---

### ✅ Test 7: Error Handling (3 min)

**Goal:** Verify errors are handled gracefully 

1. [ ] Trigger a 404 error:
   - Navigate to `/non-existent-page`
   - Should see **friendly error page** (not white screen)
   - Should have **"Back to Home"** CTA
2. [ ] Check Sentry captures the error:
   - Open Sentry dashboard (or check in console if Sentry DSN configured)
   - Should see **404 error** logged
   - Should show **page and user context**
3. [ ] Trigger API error:
   - Manually set invalid Bearer token in localStorage
   - Try to load protected page (e.g., `/admin`)
   - Should be **redirected to login** (not show error)
4. [ ] Check network error handling:
   - Open DevTools → Network tab → Throttle on Slow 3G
   - Booking page should show **skeleton loaders** while loading
   - Should eventually load content
   - No red X errors in network tab

**Expected Result:** Errors handled gracefully, Sentry logging works ✅

---

### ✅ Test 8: Performance Checks (2 min)

**Goal:** Verify app loads quickly and feels responsive

1. [ ] Clear browser cache:
   - DevTools → Application → Storage → Clear Site Data
2. [ ] Reload homepage (http://100.52.200.113:4040):
   - Should load in **< 3 seconds**
   - DevTools → Network tab → check load times
3. [ ] Navigate to booking page:
   - Should load in **< 3 seconds**
   - Skeleton loaders visible during load
4. [ ] Check console (F12 → Console):
   - ✅ No red errors
   - ✅ No warnings about missing dependencies
   - ✅ No `console.log` spam (use `logger` instead)
5. [ ] Interact with UI:
   - Click buttons, type in forms
   - Should feel responsive (no lag > 100ms)

**Expected Result:** Fast load times, responsive UI, clean console ✅

---

## 📊 Results Summary

| Test # | Name | Status | Notes |
|--------|------|--------|-------|
| 1 | Registration & Onboarding | ✅ / ❌ | |
| 2 | Babalawo Discovery & Booking | ✅ / ❌ | |
| 3 | Wallet & Payment | ✅ / ❌ | |
| 4 | Messaging | ✅ / ❌ | |
| 5 | Admin Functions | ✅ / ❌ | |
| 6 | Mobile Responsiveness | ✅ / ❌ | |
| 7 | Error Handling | ✅ / ❌ | |
| 8 | Performance | ✅ / ❌ | |
| **TOTAL** | | **✅ 8/8** | **All tests pass** |

---

## 🚨 If Something Fails

### Check Container Status (SSH into staging)
```bash
ssh -i "~\ile-ase-key.pem" ubuntu@100.52.200.113
cd ifaapp
docker ps                                          # All 4 containers should show "healthy"
docker logs ilu-ase-staging-backend --tail 50     # Backend errors
docker logs ilu-ase-staging-nginx --tail 20       # Nginx errors
```

### Restart Containers
```bash
docker-compose -f docker-compose.staging.yml restart
# Or restart a specific container:
docker-compose -f docker-compose.staging.yml restart backend
```

### Network/API Issues
```bash
# Test API health directly
curl -s http://100.52.200.113:8080/api/health

# Check CORS headers
curl -v http://100.52.200.113:8080/api/auth/register 2>&1 | grep "Access-Control"
```

### If SSH Times Out (Your IP Changed)
```powershell
# From your local PowerShell:
$MY_IP = (Invoke-WebRequest -Uri "https://checkip.amazonaws.com" -UseBasicParsing).Content.Trim()
aws ec2 authorize-security-group-ingress --group-id sg-07d1b138ef04d0632 --protocol tcp --port 22 --cidr "$MY_IP/32"
```

---

## ✅ Sign-Off

After all 8 tests pass, sign off:

- **Tested By:** _________________ 
- **Date:** _________________
- **Result:** ✅ All tests passed / ❌ Issues found (list below)

**Issues Found (if any):**
1. 
2. 
3. 

---

**Duration:** ~20-30 minutes
**Effort:** Low (manual clicking, visual verification)
**Blocker?** Yes — All 8 tests must pass before production deployment (V6-203)

**Next Step:** If all pass → sign off and proceed to V6-204 (production infrastructure)
**If issues:** Fix on staging and re-run before proceeding
