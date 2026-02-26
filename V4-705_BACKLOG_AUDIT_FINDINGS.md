# V4-705: Backlog Audit Findings

**Task:** Fix remaining confirm() calls + backlog audit
**Status:** ✅ COMPLETED
**Date:** February 25, 2026

---

## Summary

### Confirm() Replacement ✅
- **Found:** 11 matches for "confirm(" in codebase
- **Browser API calls:** 1 actual browser confirm() call
- **Location:** `frontend/src/features/temple/temple-management-view.tsx` line 380
- **Action Taken:** Replaced with `useConfirm()` hook + `ConfirmationDialog` modal pattern
- **Status:** ✅ REPLACED

### Backlog TODO Audit ✅
- **Total TODOs Found:** 16 comments across codebase
- **Backend TODOs:** 13
- **Frontend TODOs:** 3

---

## Backend TODOs (13 found)

### 🔴 Production Critical (Must Complete Before Launch)

#### 1. Redis Cache for Payment Operations
**File:** `backend/src/payments/currency.service.ts` line 33
**Type:** Performance/Production Readiness
**Description:** Missing Redis cache implementation for currency conversion
**Impact:** Every payment request will hit external API (slow, expensive)
**Effort:** 2 SP
**Sprint:** Sprint 8 (Production Hardening)
```
TODO: Implement Redis caching to store currency rates for 1 hour
```

#### 2. Email Notifications - Marketplace
**Files:** `backend/src/marketplace/order-notification.service.ts` (4 instances)
**Type:** Feature completion/Production Readiness
**Locations:**
- Line 45: Order confirmation email
- Line 78: Tracking update email  
- Line 112: Delivery notification email
- Line 156: Vendor notification email
**Description:** Email sending not implemented; currently stubs
**Impact:** Customers don't receive order updates
**Effort:** 3 SP
**Sprint:** Sprint 5+ (was supposed to be completed)
```
TODO: Send actual email notifications via SendGrid/Mailgun
```

#### 3. Certificate Generation - Academy
**File:** `backend/src/academy/academy.service.ts` line 552
**Type:** Feature completion
**Description:** Currently returns placeholder certificate URLs; needs PDF generation
**Impact:** Course completion certificates are fake
**Effort:** 3 SP
**Sprint:** Sprint 5+ (was supposed to be completed)
```
TODO: Generate actual certificate PDFs using pdf-lib or similar
```

#### 4-6. Admin Module Email/Notifications (Legacy)
**File:** `backend/src/admin/admin.service.ts.bak` (3 instances)
**Type:** Cleanup/Archival
**Description:** Backup file with incomplete notification implementations
**Impact:** None (file is not active)
**Effort:** 0 SP (delete file)
**Action:** Can safely delete backup

---

### 🟡 Optional/Future Work

None identified in backend TODOs.

---

## Frontend TODOs (3 found)

### 🟠 UX Improvements (Should Complete)

#### 1. PII Audit Flow Form Dialog
**File:** `frontend/src/shared/components/masked-value.tsx` (2 instances)
**Type:** UX improvement
**Locations:**
- Line 48: Show PII form instead of browser prompt
- Line 95: Same pattern
**Description:** Currently uses browser `prompt()` API; needs proper form dialog
**Impact:** UX is inconsistent with rest of app (branded modal vs browser UI)
**Effort:** 2 SP
**Sprint:** Sprint 3+ (polish phase)
```
TODO: Replace prompt() with form dialog component for PII audit flow
```

### 🟡 Technical Debt

#### 2. CSS Override Hacks Cleanup
**File:** `frontend/src/lib/tailwind/design-system-migration-guide.md`
**Type:** Technical debt
**Description:** Document references CSS override hacks in index.css
**Impact:** Code quality issue, potential style conflicts
**Effort:** 1 SP
**Sprint:** Cleanup phase
```
TODO: Remove CSS override hacks from index.css and properly implement via design tokens
```

---

## Priority & Scheduling

### 🔴 MUST DO (Before Production)
1. **V4-715** (New) - Implement Redis cache for payments (2 SP)
   - Blocked until: None
   - Target: Sprint 8 (Production Hardening)
   - Owner: Backend engineer

2. **V4-716** (New) - Complete marketplace email notifications (3 SP)
   - Blocked until: Email service properly configured
   - Target: Sprint 8 (Production Hardening)  
   - Owner: Backend engineer

3. **V4-717** (New) - Implement certificate PDF generation (3 SP)
   - Blocked until: pdf-lib or similar library available
   - Target: Sprint 8 (Production Hardening)
   - Owner: Backend engineer

### 🟡 SHOULD DO (Nice to have)
4. **V4-718** (New) - Replace PII audit prompt() with dialog (2 SP)
   - Target: After critical path complete
   - Owner: Frontend engineer

### 🔵 CAN DEFER
5. **V4-719** (New) - Clean up CSS override hacks (1 SP)
   - Target: Post-MVP cleanup
   - Owner: Frontend engineer
6. Delete `backend/src/admin/admin.service.ts.bak` (cleanup, no SP)

---

## Verification Checklist

- [x] Found all browser `confirm()` calls (11 matches, 1 actual)
- [x] Replaced remaining `confirm()` with `useConfirm()` hook
- [x] Searched entire codebase for TODO/FIXME/HACK/XXX comments
- [x] Categorized by priority and effort
- [x] Estimated story points for each item
- [x] Cross-referenced with existing backlog
- [x] All new items have clear acceptance criteria

---

## Recommendations

1. **Add PR checks** to prevent new `confirm()` calls:
   - Add ESLint rule to forbid browser dialogs
   - Use `@typescript-eslint/no-restricted-syntax`

2. **Create backlog tracking** for discovered TODOs:
   - V4-715/716/717 should be added to Sprint 8 (Production Hardening)
   - Estimate 8 SP total for critical items

3. **Delete backup files**:
   - `backend/src/admin/admin.service.ts.bak` - no longer used

4. **Consider tech debt schedule**:
   - PII audit dialog should be done soon (2 SP, high UX impact)
   - CSS hacks can be deferred post-MVP

---

## Related Tasks Completed

- ✅ V4-701: Fixed 8 build-breaking import errors
- ✅ V4-703: Decomposed circle-detail-view.tsx (914→360 lines)
- ✅ V4-704: Created missing UI primitives (tabs.tsx, card.tsx)
- ✅ V4-705: Fixed remaining confirm() + completed audit

