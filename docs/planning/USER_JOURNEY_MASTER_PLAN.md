# User Journey Master Plan: "The Living Digital Village"

> **"The Client seeks. The Babalawo guides. The Admin protects. Together, they build a living digital village rooted in Isese wisdom."**

This document serves as the master blueprint for the User Experience (UX) and User Flows within the application. It translates the narrative vision into concrete technical requirements and actionable steps.

---

## 🧍‍♀️ 1. The Client (Seeker) – e.g., Amina
> *“I’m searching for meaning, connection, and guidance.”*

### Narrative Flow
1.  **Enters the app** → Sees welcoming home screen.
2.  **Explores** → Reads forum posts, joins circles, views events.
3.  **Takes Action** → Books consultations, buys products, starts a journal.
4.  **Receives** → Confirmations, welcome notes, friendly replies.
5.  **Feels** → Seen, guided, and part of something real.

### Technical Implementation Steps

#### A. Dashboard & Onboarding (`HomeView`)
- [ ] **Welcome Experience**: Ensure the Home Screen clearly categorizes the four pillars: Learn (Academy), Connect (Community), Find Help (Practitioners/Temples), Shop (Marketplace).
    -   *Current Status*: `HomeView` exists. Needs review to match these 4 exact pillars.
- [ ] **Onboarding Flow**: Trigger a "Welcome Note" from an Admin upon first login (Simulated or automated).

#### B. Exploration Features
- [ ] **Forum Integration**:
    -   Link Author avatars to public profiles (Clicking a Babalawo's face in a post goes to their profile).
- [ ] **Circles (Communities)**:
    -   *New Feature Required*: Separate "Circles" from general Forums.
    -   Verify "Join Circle" functionality works and updates the user's "My Circles" list.
    -   Display "Upcoming Events" specifically relevant to the user's joined circles on their dashboard.

#### C. Action Features
- [ ] **Booking Flow**:
    -   Ensure `PractitionerProfile` -> `Book Consultation` flow is seamless.
- [ ] **Marketplace**:
    -   "Buy Sacred Beads" -> Add to Cart -> Checkout Flow.
- [ ] **Academy Journaling** (New Feature):
    -   *Requirement*: "Starts a journal in the Academy".
    -   *Action*: Create a simple "My Learning Journal" or "Notes" section within `LearningView` where users can save reflections on lessons.

#### D. Feedback Loops (Notifications)
- [ ] **Notifications System**:
    -   "Confirmation message from Babalawo" (Booking Status Update).
    -   "Welcome note from Admin" (System Message).
    -   "Reply in Circle" (Comment Notification).

---

## 👳‍♂️ 2. The Babalawo (Practitioner) – e.g., Baba Femi
> *“I’m here to teach, serve, and uphold sacred tradition.”*

### Narrative Flow
1.  **Logs in** → Sees **Practitioner Dashboard**.
2.  **Manages** → Accepts bookings, replies to messages.
3.  **Shares** → Creates events, lists products, links to lessons.
4.  **Is Verified** → Profile displays badges (Lineage, Temple, Elder/Admin verified).

### Technical Implementation Steps

#### A. Practitioner Dashboard (`PractitionerDashboard`)
- [ ] **Widgets**:
    -   "Upcoming Consultations" (Calendar/List).
    -   "New Messages" (Inbox Preview).
    -   "My Temple" (Quick Edit link).
    -   "My Services & Products" (Inventory Management).

#### B. Engagement Tools
- [ ] **Content Creation**:
    -   Allow Practitioners to post "Official Answers" in Forums (highlighted as Expert/Elder).
    -   Allow Practitioners to Create Events linked to their Temple.
- [ ] **Product Listing**:
    -   *New Feature*: Simple "Add Product" form in the dashboard that posts to the Marketplace.

#### C. Verification & Authority
- [ ] **Profile Badges**:
    -   Visual indicators for "Verified Practitioner", "Lineage Checked", "Temple Head".
    -   Ensure these badges appear everywhere their name is shown (Forum, Marketplace, Messages).

---

## 👴 3. The Admin (Community Elder) – e.g., Chief Adeyemi
> *“I protect the space, uphold standards, and welcome newcomers.”*

### Narrative Flow
1.  **Logs in** → Sees **Admin Panel**.
2.  **Oversees** → Approves users, sends announcements, welcomes newcomers.
3.  **Maintains Integrity** → Moderates content, verifies marketplace items.
4.  **Supports Growth** → Invites teachers, reviews content.

### Technical Implementation Steps

#### A. Admin Panel (`AdminView`)
- [ ] **Dashboard Widgets**:
    -   "New User Signups" (Pending Approval if applicable).
    -   "Reported Content" (Flagged posts/products).
    -   "Verification Requests" (Practitioners submitting credentials).

#### B. Community Management tools
- [ ] **Verification Workflow**:
    -   UI to review and "Approve" a Practitioner (adding the Verified badge).
- [ ] **Marketplace Moderation**:
    -   *New Feature*: Queue for "New Product Listings" requiring "Ethical Sourcing" check before going live (or a "Verified Item" badge).
- [ ] **Broadcast System**:
    -   Ability to send "Announcements" (System Notifications) to all users (e.g., "Osun Festival begins...").

---

## 🔁 Connected Ecosystem Flows

### 1. The "Trust" Loop
> *Client -> Message -> Babalawo -> Admin Oversight*
- **Action**: Ensure the messaging system has a "Report to Admin" feature for safety.

### 2. The "Community" Loop
> *Client -> Join Circle -> Babalawo Events -> Admin Promotion*
- **Action**:
    -   Circles need an "Events" tab.
    -   Admins need a "Featured Event" toggle to promote specific gatherings to the global dashboard.

### 3. The "Ethical Commerce" Loop
> *Babalawo Product -> Client Buy -> Admin Verify*
- **Action**:
    -   Implement a "Verification Status" field for Products (Pending, Verified, Rejected).
    -   Only "Verified" items get the "Ethically Sourced" badge visible to Seekers.

---


---

## 🌿 4. Onboarding Narrative: "Welcome to the Digital Village"

*This section outlines the in-app onboarding experience, welcome emails, and guide.*

> *“Ẹ kú àárọ̀. You are seen. You are welcome.”*
>
> This is not just an app—it’s a **digital village** rooted in **Isese wisdom**, where seekers, elders, and practitioners walk together with respect.

### 👣 Step 1: Who Are You Here? (Account Type Selection)

When a user joins, they choose their path:

#### 🧍‍♀️ **You Are a Seeker (Client)**
*“I’m here to learn, heal, and reconnect.”*
*   **The Goal**: Learn in the **Sacred Intelligence Academy**, join **Circles**, ask in **Forums**, book verified **Babalawos**, shop ethically.
*   **The Vibe**: No prior knowledge needed. Come as you are.

#### 👳‍♂️ **You Are a Practitioner (Babalawo / Iyalorisa)**
*“I carry lineage, training, and Àṣẹ.”*
*   **The Goal**: Serve, teach, uphold tradition. Offer consultations, host events, share wisdom, list sacred tools.
*   **The Promise**: Your authority is honored. Your knowledge is protected.

#### 👴 **You Are a Guardian (Admin / Elder)**
*“I hold the container for this space.”*
*   **The Goal**: Welcome seekers, verify lineages, moderate content, protect sacred knowledge.
*   **The Role**: The quiet strength that keeps the village whole.

### 🧭 Step 2: Your First Journey (The Seeker's Path)

Most newcomers start here. The "First Run" experience guides them to:
1.  **Explore the Academy** → Prompt: *Try the free course: “Listening to Your Inner Voice”*.
2.  **Read a Forum Thread** → Prompt: *Read “What does it mean when my grandmother appears in dreams?”*.
3.  **Join a Circle** → Choice: *Diaspora Reconnection*, *Plant Allies*, or *Yoruba Language*.
4.  **Meet a Babalawo** → Action: *View profiles, read lineage*.
5.  **Journal Your Insights** → Action: *Save reflections in your private journal*.

> 🕊️ **Remember**: There’s no rush. Sit with one lesson. Breathe. Return when ready.

### 🛡️ Step 3: How We Keep This Space Sacred (Community Guidelines)

The onboarding slides must emphasize these core values:
*   🔒 **Sacred Privacy**: No public likes/comments on spiritual shares—only private Circles/DMs.
*   ✅ **Verified Elders**: All Babalawos are verified (no self-proclaimed “gurus”).
*   🌱 **Ethical Context**: Marketplace items include cultural notes (e.g., “For Osun devotion only”).
*   🙏 **Honoring Silence**: No spam, no pushy sales.
*   📜 **Guided Knowledge**: Sacred wisdom is shared with readiness, not just paywalls.

### 💬 Step 4: You’re Not Alone

*   **Support**: Direct access to **Chief Adeyemi** (Community Elder) for questions.
*   **Guidance**: "New Seeker Path" in the Academy.
*   **Connection**: Free live sessions in Events.

> *“Ọjọ́ kan kò le mu ẹni mọ ọ̀run.”*
> *(One day doesn’t teach heaven.)*

### 📲 Actionable Next Steps (Onboarding End)
*   **CTA Primary**: “Begin Your Path” (Routes to Academy).
*   **CTA Secondary**: “Explore the Village” (Routes to Circles).

---

## 📝 Immediate Next Steps (Planning Phase)
1.  **Expand `demo-data.ts`** to include these specific scenarios (Amina, Baba Femi, Chief Adeyemi).
2.  **Review the `LearningView`** to scope the "Journaling" feature.
3.  **Review `PractitionerDashboard`** to ensure "Add Product" and "Create Event" are accessible.
4.  **Review `AdminView`** to ensure "Verification" flows exist.
