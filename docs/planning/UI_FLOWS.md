# Ilé Àṣẹ - Updated UI Flows

## Overview
This document outlines the updated user interface flows incorporating all refinements from ACTORS_AND_USER_FLOWS.md, with emphasis on Temple-first discovery and clear Personal Awo vs One-off Consultation distinction.

**Last Updated:** Based on refinements and strategic recommendations  
**Key Changes:**
- Temple-first discovery approach
- Personal Awo vs One-off Consultation distinction
- Guidance Plan (renamed from Prescription)
- Privacy controls
- Cultural onboarding

---

## Navigation Structure (Updated)

### Top-Level Navigation
```
┌─────────────────────────────────────────────────────────┐
│  Ilé Àṣẹ Logo                    [Search]  [Profile] [⚙️] │
├─────────────────────────────────────────────────────────┤
│  Home  |  Temples  |  Babalawos  |  Marketplace  |     │
│        |  (NEW)    |             |                |     │
│  Forum |  Academy  |  Wallet     |  Messages     |     │
└─────────────────────────────────────────────────────────┘
```

**Key Change:** "Temples" is now a top-level navigation item (not buried in filters)

---

## Flow 1: Temple-First Discovery (NEW - Primary Flow)

### 1.1 Homepage → Temple Discovery

```
┌─────────────────────────────────────────────────────────┐
│  Welcome, [Name]                                        │
│  Àṣẹ! Your journey begins here.                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Featured Temples                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │  │
│  │  │ Ilé Ọ̀ṣunlá│  │ Ilé Ifá  │  │ Ilé Ọ̀yọ́  │     │  │
│  │  │ 12 Babala│  │ 8 Babala │  │ 15 Babala│     │  │
│  │  │ 200+ yrs │  │ 150+ yrs │  │ 300+ yrs │     │  │
│  │  │ [View]   │  │ [View]   │  │ [View]   │     │  │
│  │  └──────────┘  └──────────┘  └──────────┘     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [Browse All Temples] → /temples                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Temple Directory Page

```
┌─────────────────────────────────────────────────────────┐
│  Temples                                                │
│  Discover verified Ilé Ifá and connect with tradition  │
├─────────────────────────────────────────────────────────┤
│  [Search: "Ilé..."]  [Filter: Location ▼] [Filter: Type▼]│
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Temple Card                                     │  │
│  │  ┌────┐  Ilé Ọ̀ṣunlá                              │  │
│  │  │Logo│  Verified ✓                              │  │
│  │  └────┘  📍 Lagos, Nigeria                       │  │
│  │          12 Babalawos | Founded 1824             │  │
│  │          [View Temple] [Follow]                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [More temples...]                                      │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Temple Detail Page

```
┌─────────────────────────────────────────────────────────┐
│  [Banner Image]                                         │
│  ┌────┐  Ilé Ọ̀ṣunlá                                     │
│  │Logo│  Verified Temple ✓                             │
│  └────┘  📍 Lagos, Nigeria | Founded 1824              │
│          [Follow Temple]                                │
├─────────────────────────────────────────────────────────┤
│  About | Babalawos | Contact | Gallery                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  About Ilé Ọ̀ṣunlá                                       │
│  [Description, History, Mission, Lineage]               │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Babalawos (12)                                         │
│  [Filter: Tier ▼] [Search]                              │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ [Avatar] │  │ [Avatar] │  │ [Avatar] │             │
│  │ Name     │  │ Name     │  │ Name     │             │
│  │ Master ✓ │  │ Senior ✓ │  │ Junior ✓ │             │
│  │ [View]   │  │ [View]   │  │ [View]   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Flow 2: Finding a Babalawo (Updated)

### 2.1 Babalawo Directory (with Temple Filter)

```
┌─────────────────────────────────────────────────────────┐
│  Babalawos                                              │
│  Find your guide                                        │
├─────────────────────────────────────────────────────────┤
│  [Search]  [Filter: Temple ▼] [Filter: Tier ▼]         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Babalawo Card                                   │  │
│  │  ┌────┐  Babatunde Adeyemi                       │  │
│  │  │Avt │  Master ✓                                │  │
│  │  └────┘  ┌─────────────┐                         │  │
│  │          │ Ilé Ọ̀ṣunlá  │  ← Temple Badge        │  │
│  │          └─────────────┘                         │  │
│  │          📍 Lagos, Nigeria                       │  │
│  │          [Book Session] [Request Personal Awo]   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Change:** Two distinct CTAs - "Book Session" vs "Request Personal Awo"

### 2.2 Babalawo Profile Page (Updated)

```
┌─────────────────────────────────────────────────────────┐
│  [Hero Section]                                         │
│  ┌────┐  Babatunde Adeyemi                              │
│  │Avt │  Master ✓                                       │
│  └────┘  ┌─────────────────────────────┐               │
│          │ Ilé Ọ̀ṣunlá                  │               │
│          │ [View Temple]               │  ← Prominent  │
│          └─────────────────────────────┘               │
│          📍 Lagos, Nigeria                             │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ Book a Session   │  │ Request Personal │           │
│  │ (One-time)       │  │ Awo (Long-term)  │           │
│  └──────────────────┘  └──────────────────┘           │
├─────────────────────────────────────────────────────────┤
│  About | Services | Credentials | Temple | Reviews      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  About                                                 │
│  [Bio, About Me, Years of practice]                     │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Temple Affiliation                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Ilé Ọ̀ṣunlá                                      │  │
│  │  [Temple Logo]                                   │  │
│  │  Member since 2015                               │  │
│  │  [View Temple Page]                              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Flow 3: Personal Awo Request (NEW - Detailed Flow)

### 3.1 Request Personal Awo Form

```
┌─────────────────────────────────────────────────────────┐
│  Request Personal Awo                                   │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  You are requesting a long-term spiritual relationship │
│  with Babatunde Adeyemi.                                │
│                                                          │
│  Relationship Duration:                                 │
│  ○ 3 months  ○ 6 months  ● 12 months                    │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Spiritual Covenant                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  By requesting this relationship, you agree to: │  │
│  │                                                  │  │
│  │  • Honor the sacredness of this bond            │  │
│  │  • Maintain exclusivity (one Personal Awo)     │  │
│  │  • Communicate respectfully                     │  │
│  │  • Follow guidance with intention               │  │
│  │                                                  │  │
│  │  [✓] I understand and agree to these terms     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  ⚠️  You currently have [Name] as your Personal Awo.   │
│      A 14-day grace period will begin if you proceed.   │
│                                                          │
│  [Cancel]  [Request Personal Awo]                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Grace Period Screen

```
┌─────────────────────────────────────────────────────────┐
│  Grace Period - Reflection Time                        │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  You've requested to change your Personal Awo.          │
│  A 14-day grace period has begun.                       │
│                                                          │
│  Days remaining: 12                                     │
│                                                          │
│  During this time:                                      │
│  • You can still communicate with [Current Awo]        │
│  • Your relationship is marked as "Transitioning"      │
│  • You cannot start a new relationship yet             │
│  • Take time to reflect on this decision              │
│                                                          │
│  [Reflection Resources]                                 │
│  • Understanding the Personal Awo relationship          │
│  • Cultural significance                                │
│  • When to change your Personal Awo                    │
│                                                          │
│  After the grace period, you can confirm your new      │
│  Personal Awo request.                                  │
│                                                          │
│  [View Current Relationship]                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Flow 4: One-off Consultation Booking (Updated)

### 4.1 Book Session Form

```
┌─────────────────────────────────────────────────────────┐
│  Book a Session with Babatunde Adeyemi                  │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  This is a one-time consultation. No long-term          │
│  relationship commitment required.                       │
│                                                          │
│  Select Date & Time:                                    │
│  [Calendar Widget]                                      │
│                                                          │
│  Consultation Type:                                     │
│  ○ Ifá Divination                                       │
│  ○ Spiritual Counseling                                 │
│  ○ Life Guidance                                        │
│                                                          │
│  Notes (Optional):                                      │
│  [Text area]                                            │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Pricing:                                               │
│  Consultation: ₦10,000                                 │
│  ────────────────────────────────────────────────────   │
│  Total: ₦10,000                                         │
│                                                          │
│  [Cancel]  [Book & Pay]                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Flow 5: Guidance Plan Creation (Updated - Renamed from Prescription)

### 5.1 Guidance Plan Form (Babalawo Side)

```
┌─────────────────────────────────────────────────────────┐
│  Create Guidance Plan                                   │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  ⚠️  Guidance Plans can only be created after a         │
│      completed divination session.                      │
│                                                          │
│  Related Appointment:                                   │
│  [Select from completed appointments ▼]                 │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Guidance Type:                                         │
│  ○ Akose  ○ Ebo  ● Both                                │
│                                                          │
│  Items:                                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Item 1: [Name]                                  │  │
│  │  Quantity: [2]  Cost: ₦5,000                    │  │
│  │  Description: [Text]                             │  │
│  │  [Remove]                                         │  │
│  └──────────────────────────────────────────────────┘  │
│  [+ Add Item]                                           │
│                                                          │
│  Instructions:                                         │
│  [Text area]                                           │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Pricing:                                               │
│  Items Total: ₦15,000                                   │
│  Platform Service Fee: ₦100                            │
│  ────────────────────────────────────────────────────   │
│  Total: ₦15,100                                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ⚠️  Cultural Note                               │  │
│  │  Akose/Ebo are sacred guidance—not products.    │  │
│  │  The platform service fee supports operations,  │  │
│  │  not a commission on spiritual practices.        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [Cancel]  [Create Guidance Plan]                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Guidance Plan Approval (Client Side)

```
┌─────────────────────────────────────────────────────────┐
│  Guidance Plan from Babatunde Adeyemi                  │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Following your divination session on [Date], your      │
│  Babalawo has prepared a Guidance Plan.                 │
│                                                          │
│  Items:                                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • Item 1 (x2) - ₦5,000                         │  │
│  │  • Item 2 (x1) - ₦10,000                        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Instructions:                                          │
│  [Guidance instructions displayed]                     │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Pricing Breakdown:                                     │
│  Items: ₦15,000                                         │
│  Platform Service Fee: ₦100                            │
│  ────────────────────────────────────────────────────   │
│  Total: ₦15,100                                         │
│                                                          │
│  [Decline]  [Approve & Pay]                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Flow 6: Cultural Onboarding (NEW)

### 6.1 Signup Flow with Cultural Path

```
┌─────────────────────────────────────────────────────────┐
│  Welcome to Ilé Àṣẹ                                    │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Are you reconnecting with your heritage?               │
│                                                          │
│  [Yes, I'm reconnecting]  [No, I'm already connected]  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Cultural Onboarding Path (If Yes)

```
┌─────────────────────────────────────────────────────────┐
│  Welcome! Let's get you started.                       │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Step 1: Key Terms                                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Àṣẹ (Ah-shay)                                   │  │
│  │  The spiritual power and authority that flows    │  │
│  │  through all things.                             │  │
│  │  [Next Term →]                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Step 2: What to Expect                                 │
│  [Video: "What to Expect in a Divination"]             │
│                                                          │
│  Step 3: Get Started                                    │
│  [Link to: "Introduction to Ifá/Isese" course]          │
│                                                          │
│  [Skip]  [Continue]                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Flow 7: Privacy Controls (NEW)

### 7.1 Message Privacy Settings

```
┌─────────────────────────────────────────────────────────┐
│  Message Settings                                       │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Privacy Level:                                         │
│  ○ Public (visible to community)                        │
│  ○ Community (visible to verified members)             │
│  ○ Private (only you and Babalawo)                     │
│  ● Confidential (encrypted, auto-delete)               │
│                                                          │
│  Auto-Delete Messages:                                  │
│  ○ Never                                                │
│  ○ After 7 days                                        │
│  ○ After 30 days                                        │
│  ● After 90 days                                        │
│                                                          │
│  Confidential Session:                                  │
│  [✓] Hide from activity feed                            │
│  [✓] Encrypt messages                                   │
│  [✓] No screenshots (mobile app)                       │
│                                                          │
│  [Save Settings]                                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Flow 8: Forum with Àṣẹ Acknowledgment (Updated)

### 8.1 Forum Thread View

```
┌─────────────────────────────────────────────────────────┐
│  [Thread Title]                                         │
│  By [Author] | [Category] | 2 hours ago                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Thread Content]                                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [Àṣẹ] 3 elders acknowledged this teaching       │  │
│  │  Acknowledged by: [Name1], [Name2], [Name3]     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  Replies (5)                                            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [Avatar] [Author Name]                          │  │
│  │  [Reply content]                                 │  │
│  │  [Àṣẹ] 1 elder acknowledged                      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [Reply to Thread]                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Change:** "Like" button replaced with "Àṣẹ" button

---

## Flow 9: Marketplace with Temple Verification (Updated)

### 9.1 Product Card with Temple Badge

```
┌─────────────────────────────────────────────────────────┐
│  ┌──────────┐                                           │
│  │[Product] │  Opele (Divination Chain)                 │
│  │  Image   │  ₦25,000                                  │
│  └──────────┘                                           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Temple Verified ✓                                │  │
│  │  Blessed by Ilé Ọ̀ṣunlá                           │  │
│  │  [View Temple]                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Vendor: [Name]                                         │
│  [View Product]                                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Flow 10: Admin - Temple Management (NEW)

### 10.1 Admin Temple Management

```
┌─────────────────────────────────────────────────────────┐
│  Admin Dashboard                                        │
│  ────────────────────────────────────────────────────   │
├─────────────────────────────────────────────────────────┤
│  Overview | Verifications | Temples | Disputes | ...    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Temples                                                │
│  [Search] [Filter: Status ▼] [Filter: Type ▼]           │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Ilé Ọ̀ṣunlá                                       │  │
│  │  Status: Pending Verification                     │  │
│  │  Type: Ilé Ifá                                     │  │
│  │  12 Babalawos | Founded 1824                      │  │
│  │  [Review] [View Details]                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [More temples...]                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Mobile-Specific Flows

### Mobile: Screenshot Prevention

```
┌─────────────────────────────────────────────────────────┐
│  Confidential Session                                   │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  [Message Content]                                      │
│                                                          │
│  ⚠️  Screenshots are disabled in confidential sessions  │
│                                                          │
│  [Type message...]                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Key UI Patterns

### 1. Temple Badge Pattern
- Small badge on Babalawo cards
- Prominent section on Babalawo profiles
- Link to temple page
- Temple logo when available

### 2. Two-CTA Pattern
- "Book a Session" (one-off)
- "Request Personal Awo" (long-term)
- Clear distinction in styling and messaging

### 3. Grace Period Indicator
- Countdown timer
- Reflection resources
- Clear messaging about exclusivity

### 4. Cultural Disclaimers
- Guidance Plans: "Sacred guidance—not products"
- Platform fee: "Supports operations, not commission"
- Personal Awo: "Sacred relationship"

### 5. Privacy Indicators
- Confidential session badge
- Auto-delete countdown
- Privacy level badges

---

## Responsive Considerations

### Desktop
- Sidebar navigation
- Multi-column layouts
- Rich media display

### Tablet
- Collapsible sidebar
- Two-column layouts
- Touch-optimized buttons

### Mobile
- Bottom navigation
- Single column
- Large touch targets
- Screenshot prevention

---

## Accessibility

- Proper heading hierarchy
- Alt text for images
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- Focus indicators
- Yoruba diacritic support

---

This document provides visual representations of all updated UI flows. Use it alongside ACTORS_AND_USER_FLOWS.md for complete implementation guidance.
