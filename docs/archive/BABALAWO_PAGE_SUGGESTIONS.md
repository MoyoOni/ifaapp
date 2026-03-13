# Babalawo Profile Page - Detailed Suggestions

## Overview
This document provides detailed suggestions for what should be displayed on an individual Babalawo's profile page, considering the new temple affiliation feature.

---

## Page Structure & Sections

### 1. Hero/Header Section
**Purpose:** First impression and key information at a glance

**Content:**
- Large avatar (circular, 120-150px)
- Full name (English)
- Yoruba name (with proper diacritics)
- Verification badge (prominent, top-right)
- **Temple affiliation** (NEW - prominent badge/link)
  - Temple name
  - Temple logo (small)
  - "View Temple" link
- Location (city, state, country)
- Cultural level badge
- Quick action buttons:
  - "Book Consultation"
  - "Send Message"
  - "View Documents" (if client)

**Design:**
- Gradient background or temple-themed colors
- Responsive layout (stacked on mobile)
- Professional, respectful aesthetic

---

### 2. About Section
**Purpose:** Personal and professional background

**Content:**
- **Bio** (short, 2-3 sentences)
- **About Me** (detailed, expandable)
  - Personal journey in Ifá/Isese
  - Training and lineage
  - Years of practice
  - Philosophy and approach
- **Temple Information** (NEW)
  - Temple name (link to temple page)
  - Role in temple (if applicable):
    - Founder
    - Head/Chief Priest
    - Senior Member
    - Member
  - Years with temple
  - Temple lineage/tradition
- **Cultural Background**
  - Cultural level progression
  - Rank/XP (if gamified)
  - Achievements/milestones

---

### 3. Verification & Credentials Section
**Purpose:** Establish trust and authenticity

**Content:**
- **Verification Tier**
  - Junior / Senior / Master badge
  - Verification status
  - Verification date
- **Certificates**
  - List of certificates with:
    - Title
    - Issuer
    - Date
    - Tier
  - Expandable/collapsible list
- **Verification Application Status**
  - Current stage (if in progress)
  - Application history
- **Specializations**
  - Tags/chips showing areas of expertise:
    - Divination (Ifá)
    - Ebo (Sacrifice)
    - Herbal Medicine
    - Spiritual Counseling
    - Initiation Ceremonies
    - Cultural Education
    - etc.
- **Languages Spoken**
  - Yoruba (with proficiency level)
  - English
  - Other languages

---

### 4. Temple Affiliation Section (NEW - Prominent)
**Purpose:** Show connection to temple community

**Content:**
- **Temple Card**
  - Temple logo
  - Temple name (Yoruba name if available)
  - Temple location
  - Verification status
  - "View Temple Page" button
- **Role in Temple**
  - Position/title
  - Responsibilities
  - Years of membership
- **Temple Lineage**
  - Ifá lineage
  - Tradition
  - Special practices
- **Temple Statistics** (if public)
  - Total babalawos in temple
  - Temple's years of operation

---

### 5. Services & Offerings Section
**Purpose:** What the babalawo offers

**Content:**
- **Consultation Types**
  - Ifá Divination
  - Spiritual Counseling
  - Life Guidance
  - Problem Solving
  - etc.
- **Pricing** (if applicable)
  - Consultation fees
  - Payment methods accepted
- **Availability**
  - Days/times available
  - Timezone
  - Response time
- **Service Areas**
  - In-person (location)
  - Virtual/Online
  - Travel availability

---

### 6. Experience & Practice Section
**Purpose:** Demonstrate expertise

**Content:**
- **Years of Practice**
  - Total years
  - Years verified
  - Years with current temple
- **Client Statistics** (if public/optional)
  - Total consultations
  - Active clients
  - Completed appointments
- **Practice Areas**
  - Detailed list of services
  - Special techniques
  - Unique approaches

---

### 7. Reviews & Testimonials Section (Future)
**Purpose:** Social proof

**Content:**
- Client testimonials (with permission)
- Ratings (if implemented)
- Acknowledgment count
- Review highlights

---

### 8. Contact & Booking Section
**Purpose:** Enable client interaction

**Content:**
- **Contact Information**
  - Email (if public)
  - Phone (if public)
  - Social media links
- **Booking Options**
  - "Book Appointment" button (primary CTA)
  - Calendar view (if available)
  - Consultation types dropdown
- **Communication**
  - "Send Message" button
  - Response time expectation
  - Preferred communication method

---

### 9. Documents & Resources Section
**Purpose:** Share knowledge and resources

**Content:**
- **Public Documents** (if any)
  - Articles written
  - Educational materials
  - Cultural resources
- **Shared Documents** (for clients only)
  - Personal prescriptions
  - Consultation notes
  - Recommendations

---

### 10. Social Proof & Activity Section
**Purpose:** Show engagement and community presence

**Content:**
- **Forum Activity** (if applicable)
  - Recent posts
  - Topics engaged
  - Community contributions
- **Academy** (if applicable)
  - Courses taught
  - Lessons created
- **Marketplace** (if applicable)
  - Products/services offered

---

## Layout Suggestions

### Desktop Layout
```
┌─────────────────────────────────────────┐
│  Hero Section (Full Width)             │
├──────────────┬──────────────────────────┤
│              │                          │
│  Sidebar     │  Main Content            │
│  (Sticky)    │                          │
│              │  - About                 │
│  - Quick     │  - Temple Affiliation    │
│    Actions   │  - Credentials            │
│  - Contact   │  - Services              │
│  - Stats     │  - Experience            │
│              │  - Reviews                │
│              │  - Documents              │
└──────────────┴──────────────────────────┘
```

### Mobile Layout
```
┌─────────────────┐
│  Hero Section   │
├─────────────────┤
│  Quick Actions  │
├─────────────────┤
│  About          │
├─────────────────┤
│  Temple Info    │
├─────────────────┤
│  Credentials    │
├─────────────────┤
│  Services       │
├─────────────────┤
│  Contact        │
└─────────────────┘
```

---

## Key Design Principles

### 1. Temple Affiliation Prominence
- Temple information should be visible early (top 1/3 of page)
- Temple badge should be clickable and lead to temple page
- Temple logo should be displayed if available

### 2. Verification Trust Signals
- Verification badges should be prominent
- Credentials should be easily accessible
- Verification status should be clear

### 3. Cultural Respect
- Proper Yoruba diacritics throughout
- Respectful terminology
- Cultural context in descriptions

### 4. Action-Oriented
- Primary CTAs (Book, Message) should be prominent
- Multiple entry points for booking
- Clear next steps for clients

### 5. Information Hierarchy
- Most important info first (name, verification, temple)
- Detailed info expandable/collapsible
- Progressive disclosure for long content

---

## Interactive Elements

### Expandable Sections
- About Me (expand for full text)
- Certificates list
- Service details
- Reviews/testimonials

### Tabs (Alternative Layout)
- Overview
- Services
- Credentials
- Temple
- Reviews
- Contact

### Quick Actions (Sticky/Floating)
- Book Appointment
- Send Message
- Share Profile

---

## Data Requirements

### From User Model
- Basic profile (name, avatar, bio, etc.)
- Verification data
- Certificates
- Cultural level

### From Temple Model (NEW)
- Temple name, logo
- Temple location
- Temple verification status
- Temple lineage/tradition

### From Relationships
- Babalawo-Client relationships
- Appointments (stats)
- Messages (if applicable)

### Computed/Display
- Years of practice
- Client count (if public)
- Response rate
- Availability status

---

## Responsive Considerations

### Mobile
- Stack all sections vertically
- Sticky header with key info
- Floating action button for booking
- Collapsible sections

### Tablet
- Two-column layout possible
- Sidebar can be collapsible
- Maintain readability

### Desktop
- Full sidebar + main content
- Sticky sidebar for quick actions
- Rich media display

---

## Accessibility

- Proper heading hierarchy
- Alt text for images
- Keyboard navigation
- Screen reader friendly
- Color contrast compliance
- Focus indicators

---

## Performance

- Lazy load images
- Progressive image loading
- Code splitting for sections
- Optimize API calls
- Cache temple data

---

## Future Enhancements

1. **Video Introduction**
   - Short video from babalawo
   - Temple tour video

2. **Live Availability**
   - Real-time availability status
   - "Available Now" indicator

3. **Client Portal Link**
   - Direct link for existing clients
   - Personalized dashboard

4. **Temple Events**
   - Upcoming temple events
   - Babalawo's participation

5. **Achievement Badges**
   - Community contributions
   - Milestones
   - Special recognitions

---

## Implementation Priority

### Phase 1 (Essential)
1. Hero section with temple affiliation
2. About section
3. Verification & credentials
4. Temple affiliation section
5. Contact & booking

### Phase 2 (Important)
6. Services & offerings
7. Experience & practice
8. Documents section

### Phase 3 (Enhancements)
9. Reviews & testimonials
10. Social proof
11. Interactive elements
12. Advanced features

---

This structure ensures the babalawo profile page is comprehensive, culturally respectful, and highlights the important temple affiliation while maintaining all existing functionality.
