# Temple Feature Implementation Plan

## Overview
This document outlines the implementation plan for adding Temple functionality to the IFA app, where every Babalawo belongs to a Temple, and each Temple has its own dedicated page.

---

## 1. Database Schema Changes

### New Temple Model
Add to `backend/prisma/schema.prisma`:

```prisma
// Temple Model - Represents an Ifá/Isese temple (Ilé)
model Temple {
  id          String   @id @default(uuid())
  name        String   // Temple name (e.g., "Ilé Ifá Ìjẹ̀bú")
  yorubaName  String?  // Yoruba name with diacritics
  slug        String   @unique // URL-friendly identifier
  
  // Temple Information
  description String?  // About the temple
  history     String?  // Temple history and lineage
  mission     String?  // Temple mission statement
  
  // Location & Contact
  address     String?
  city        String?
  state       String?
  country     String   @default("Nigeria")
  location    String?  // Full location string
  coordinates Json?    // { lat, lng } for map display
  phone       String?
  email       String?
  website     String?
  
  // Visual Identity
  logo        String?  // Temple logo URL
  bannerImage String?  // Temple banner/header image
  images      String[] // Array of temple images
  
  // Temple Leadership & Structure
  founderId   String?  // User ID of temple founder/head
  foundedYear Int?     // Year temple was founded
  
  // Status & Verification
  status      String   @default("ACTIVE") // ACTIVE, INACTIVE, PENDING_VERIFICATION
  verified    Boolean  @default(false)    // Council-verified temple
  verifiedAt  DateTime?
  verifiedBy  String?  // Admin/Council member who verified
  
  // Cultural Information
  lineage     String?  // Ifá lineage (e.g., "Ọ̀yọ́", "Ìjẹ̀bú")
  tradition   String?  // Specific tradition (e.g., "Isese", "Ifá")
  specialties String[] // Special practices/services
  
  // Social Links
  socialLinks Json?    // { facebook, instagram, twitter, youtube }
  
  // Statistics (cached)
  babalawoCount Int     @default(0) // Number of babalawos in temple
  clientCount   Int     @default(0) // Total clients served
  
  // Relationships
  babalawos     User[]  // Babalawos belonging to this temple
  founder       User?   @relation("TempleFounder", fields: [founderId], references: [id], onDelete: SetNull)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([slug])
  @@index([status])
  @@index([verified])
  @@index([city, state])
  @@index([founderId])
}
```

### Update User Model
Add temple relationship to existing `User` model:

```prisma
model User {
  // ... existing fields ...
  
  // Add this field
  templeId     String?
  temple       Temple?  @relation(fields: [templeId], references: [id], onDelete: SetNull)
  foundedTemple Temple? @relation("TempleFounder")
  
  // ... rest of existing fields ...
}
```

---

## 2. Migration Strategy

### Phase 1: Database Migration (Non-Breaking)
1. Create migration that adds Temple model
2. Add `templeId` to User as **nullable** (existing babalawos won't break)
3. Run migration
4. Create default/placeholder temples if needed for existing babalawos

### Phase 2: Backend Implementation
1. Create Temple module (controller, service, DTOs)
2. Add temple endpoints
3. Update User service to include temple in queries
4. Add validation: Babalawos must belong to a temple (enforce on registration/update)

### Phase 3: Frontend Implementation
1. Create Temple directory/listing page
2. Create Temple detail page
3. Update Babalawo profile cards to show temple
4. Update Babalawo directory to filter by temple
5. Add temple selection during babalawo registration/onboarding

---

## 3. Backend API Structure

### Temple Controller Endpoints

```typescript
// GET /temples - List all temples (with filters)
// GET /temples/:id - Get temple details
// GET /temples/:id/babalawos - Get all babalawos in temple
// POST /temples - Create new temple (admin/babalawo)
// PATCH /temples/:id - Update temple (founder/admin)
// GET /temples/search?q=... - Search temples

// User-Temple Management
// PATCH /users/:id/temple - Assign babalawo to temple
// GET /users/:id/temple - Get user's temple
```

### Temple Service Methods

```typescript
class TempleService {
  findAll(filters: { search?, city?, state?, verified?, status? })
  findOne(id: string)
  findBySlug(slug: string)
  findBabalawos(templeId: string)
  create(dto: CreateTempleDto, founderId: string)
  update(id: string, dto: UpdateTempleDto, userId: string)
  assignBabalawoToTemple(babalawoId: string, templeId: string)
  removeBabalawoFromTemple(babalawoId: string)
  verifyTemple(id: string, adminId: string)
}
```

---

## 4. Frontend Pages & Components

### 4.1 Temple Directory Page (`/temples`)
**Location:** `frontend/src/features/temple/temple-directory.tsx`

**Features:**
- Grid/list view of all temples
- Search by name, city, state
- Filter by:
  - Verified status
  - Location (city/state)
  - Lineage/tradition
- Sort by:
  - Name
  - Number of babalawos
  - Founded year
- Display temple cards with:
  - Logo
  - Name (Yoruba name if available)
  - Location
  - Number of babalawos
  - Verification badge
  - Brief description

### 4.2 Temple Detail Page (`/temples/:slug`)
**Location:** `frontend/src/features/temple/temple-detail-view.tsx`

**Sections to Include:**

#### Header Section
- Temple banner image
- Logo
- Name (English & Yoruba)
- Verification badge
- Location with map (if coordinates available)
- Quick stats (babalawo count, founded year)

#### About Section
- Description
- History
- Mission statement
- Lineage information
- Tradition/specialties

#### Babalawos Section
- Grid/list of all babalawos in temple
- Filter by verification tier
- Search babalawos
- Link to individual babalawo profiles
- Display:
  - Avatar
  - Name & Yoruba name
  - Verification tier
  - Bio preview
  - Specializations

#### Contact & Information
- Address
- Phone
- Email
- Website
- Social media links
- Map embed (if coordinates available)

#### Temple Gallery
- Image gallery
- Temple events photos
- Ceremony photos (if public)

#### Statistics (if available)
- Total babalawos
- Total clients served
- Years active
- Notable achievements

### 4.3 Updated Babalawo Profile Card
**Location:** `frontend/src/features/babalawo/profile/babalawo-profile-card.tsx`

**Add:**
- Temple badge/name below name
- Link to temple page
- Temple logo (small)

### 4.4 Updated Babalawo Directory
**Location:** `frontend/src/features/babalawo/directory/babalawo-directory.tsx`

**Add:**
- Filter by temple
- Show temple name in cards
- Link to temple from babalawo card

### 4.5 Babalawo Profile Page Suggestions
**Location:** `frontend/src/features/babalawo/profile/babalawo-profile-view.tsx` (may need to create)

**Sections to Include:**

#### Header
- Avatar
- Name & Yoruba name
- Verification badge
- Temple affiliation (prominent)
- Location

#### About
- Bio
- About Me (detailed)
- Cultural level
- Years of practice

#### Temple Affiliation
- Temple name (link to temple page)
- Role in temple (if applicable)
- Joined date

#### Verification & Credentials
- Verification tier
- Certificates
- Specializations
- Languages spoken

#### Services Offered
- Consultation types
- Pricing (if applicable)
- Availability

#### Reviews/Testimonials (if implemented)
- Client testimonials
- Ratings

#### Contact & Booking
- Book appointment button
- Message button
- Contact information

---

## 5. Data Flow & Relationships

### Creating a Temple
1. Admin or verified Babalawo creates temple
2. Creator becomes founder
3. Temple status: PENDING_VERIFICATION
4. Admin/Council can verify temple

### Assigning Babalawo to Temple
1. During registration: Babalawo selects temple (or creates new)
2. Existing babalawo: Admin or temple founder can assign
3. Babalawo can request temple change (requires approval)
4. Update `templeId` in User model

### Querying Babalawos by Temple
```typescript
// Get all babalawos in a temple
const babalawos = await prisma.user.findMany({
  where: {
    role: 'BABALAWO',
    templeId: templeId,
    verified: true
  },
  include: {
    certificates: true,
    verificationApps: true,
    temple: true
  }
});
```

---

## 6. Validation Rules

### Temple Creation
- Name is required
- Slug must be unique
- Founder must be verified Babalawo or Admin
- Location (at least city) recommended

### Babalawo-Temple Assignment
- Babalawo must have role = 'BABALAWO'
- Temple must exist and be ACTIVE
- Can only belong to one temple at a time
- Temple founder can assign/remove babalawos
- Admin can assign/remove any babalawo

### Temple Updates
- Only founder or admin can update
- Verification status can only be changed by admin
- Slug cannot be changed after creation (or with special permission)

---

## 7. UI/UX Suggestions

### Temple Directory
- Use card-based layout
- Show temple logo prominently
- Include "View Temple" CTA
- Show verification badge
- Display babalawo count badge

### Temple Detail Page
- Hero section with banner
- Sticky navigation for sections
- Responsive grid for babalawo cards
- Map integration for location
- Social sharing buttons

### Babalawo Profile
- Prominent temple badge at top
- "View Temple" link next to temple name
- Temple section in sidebar or dedicated section

### Search & Discovery
- Global search includes temples
- "Browse by Temple" option in directory
- Temple filter in babalawo directory
- Related temples suggestions

---

## 8. Implementation Checklist

### Database
- [ ] Create Temple model in schema.prisma
- [ ] Add templeId to User model
- [ ] Create migration file
- [ ] Run migration
- [ ] Create seed data for temples (optional)

### Backend
- [ ] Create temple module (controller, service, module)
- [ ] Create DTOs (CreateTempleDto, UpdateTempleDto)
- [ ] Implement temple CRUD operations
- [ ] Add temple endpoints
- [ ] Update User service to include temple
- [ ] Add validation logic
- [ ] Add authorization guards

### Common (Schemas)
- [ ] Create temple.schema.ts in common/src/schemas
- [ ] Export temple types

### Frontend
- [ ] Create temple feature folder structure
- [ ] Create TempleDirectory component
- [ ] Create TempleDetailView component
- [ ] Create TempleCard component
- [ ] Update BabalawoProfileCard to show temple
- [ ] Update BabalawoDirectory to filter by temple
- [ ] Add temple routes in App.tsx
- [ ] Create temple API service functions
- [ ] Add temple selection in babalawo onboarding

### Testing
- [ ] Test temple creation
- [ ] Test babalawo assignment
- [ ] Test temple detail page
- [ ] Test temple directory
- [ ] Test filtering and search
- [ ] Test authorization (who can create/update)

---

## 9. Cultural Considerations

### Terminology
- Use "Ilé" for temple (Yoruba term)
- Respect temple lineages and traditions
- Proper diacritics in Yoruba names

### Verification
- Temples should be verified by Council
- Only verified temples show verification badge
- Unverified temples can exist but marked clearly

### Privacy
- Temple information is generally public
- Individual babalawo privacy settings still apply
- Temple founder can manage temple visibility

---

## 10. Future Enhancements

### Potential Features
- Temple events calendar
- Temple announcements/news
- Temple membership requests
- Temple hierarchy/roles (Head, Senior, Junior)
- Temple statistics dashboard
- Temple reviews/ratings
- Temple comparison tool
- Temple map view (all temples on map)

---

## 11. Breaking Changes Prevention

### Backward Compatibility
1. `templeId` is nullable - existing babalawos won't break
2. Temple assignment is optional initially (can enforce later)
3. All existing queries still work (just add optional temple include)
4. Frontend gracefully handles missing temple data

### Migration Path
1. Deploy schema changes (templeId nullable)
2. Allow babalawos to be assigned to temples gradually
3. After all assigned, make templeId required for new babalawos
4. Add UI prompts for unassigned babalawos

---

## 12. File Structure

```
backend/src/
  temples/
    temples.controller.ts
    temples.service.ts
    temples.module.ts
    dto/
      create-temple.dto.ts
      update-temple.dto.ts

common/src/schemas/
  temple.schema.ts

frontend/src/features/
  temple/
    temple-directory.tsx
    temple-detail-view.tsx
    temple-card.tsx
    temple-babalawos-list.tsx
```

---

## Next Steps

1. Review and approve this plan
2. Create database migration
3. Implement backend temple module
4. Create frontend components
5. Test thoroughly
6. Deploy incrementally

---

**Questions or concerns?** This plan ensures we don't break existing functionality while adding the temple feature comprehensively.
