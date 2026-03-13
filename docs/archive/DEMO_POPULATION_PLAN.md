# Digital Village Population Plan (Demo Mode)

## Objective
To create a fully immersive, populated "Digital Village" experience within the application, enabling end-to-end testing of user flows including Forums, Circles, Events, Temples, Marketplace, and Messaging. This involves creating rich demo data and wiring it into the frontend components, while simultaneously ensuring the "Digital Sanctuary" light aesthetic is applied globally.

## Phase 1: Master Data Expansion (`demo-data.ts`)
We will transform `demo-data.ts` into a comprehensive mock database tailored for a believable community simulation.

### 1. Expanded Users
-   **Clients**: Add ~5-8 diverse profiles (Diaspora seekers, local students, curious novices) with distinct interests and "Friend" connections.
-   **Babalawos/Iyalorisas**: Add ~3-5 distinct practitioners (Diviners, Herbalists, Historians) linked to specific Temples.
-   **Admins**: 1-2 Community Elders.

### 2. Community & Content
-   **Forums**:
    -   Categories: *General, Ifá Philosophy, Ancestral Veneation, Diaspora Connections*.
    -   Threads: High-engagement topics (e.g., "Meaning of recurring dreams", "Connecting with Ori").
    -   Replies: Linked to the demo users.
-   **Circles**:
    -   "London Ifá Study Group" (Student focus).
    -   "Children of Osun" (Devotee focus).
    -   "Yoruba Language Learners" (Skill focus).
-   **Events**:
    -   "Weekly Dafa Practice" (Recurring, linked to Circle).
    -   "Osun Festival 2025" (Major event, linked to Temple).
    -   "Intro to Obi Divination" (Workshop, linked to Babalawo).
-   **Temples**:
    -   Link Babalawos as "Head Priest" or "Resident Awo".
    -   Link events to Temples.

### 3. Commerce & Services
-   **Marketplace**:
    -   Products: "Red Parrot Feathers", "Divination Trays (Opon Ifa)", "Sacred Beads".
    -   Link products to Vendor profiles.
-   **Services**:
    -   "Online Consultation", "Naming Ceremony", "Ebo Execution".

### 4. Communication
-   **Inbox**: Pre-populate the current user's inbox with:
    -   A welcome message from an Admin.
    -   A response from a Babalawo regarding a booking.
    -   A casual message from a "Friend".

## Phase 2: Theme Consistency & Layout
Identify and refactor remaining dark-mode components to the **Digital Sanctuary** (Light/Stone/Gold) theme.

-   **Target Areas**:
    -   `ForumView` (often text-heavy, needs good contrast).
    -   `CircleView` & `EventsView` (likely placeholders currently).
    -   `MessageInbox` (needs a clean, chat-like interface).
    -   Ensuring `SidebarLayout` background (`bg-stone-50`) flows through all child pages.

## Phase 3: Feature Integration (Wiring the Data)
Update feature components to preferentially load data from `demo-data.ts`.

1.  **Forum Module**:
    -   Update `ForumHomeView` to render demo categories and hot threads.
    -   Update `ThreadView` to show demo replies with clickable User Avatars (routing to `PublicProfile`).
2.  **Circles & Events**:
    -   Implement/Update `CircleDirectory` to list demo circles.
    -   Implement/Update `EventsDirectory` to show the calendar/list of demo events.
    -   Ensure "Join" or "RSVP" buttons provide feedback (even if mock).
3.  **Marketplace**:
    -   Ensure `MarketplaceView` pulls the full range of demo products.
    -   Link "Sold By" to Vendor Profiles.
4.  **Temples**:
    -   Enhance `TempleDetailView` to list the specific "Resident Priests" (demo Babalawos).

## Execution Order
1.  **Generate Data**: Write the massive `demo-data.ts` update.
2.  **Apply Theme**: Fix global background/styling issues in checking `App.tsx` and main views.
3.  **Wire Forums**: High interaction potential.
4.  **Wire Circles/Events**: Community feel.
5.  **Wire Messaging**: Personal connection.

## User Flow Tests (To Validate)
-   *User -> Forum Post -> Click Author -> View Profile -> Click Message -> View Inbox.*
-   *User -> Temple Directory -> Click Temple -> View Priests -> Click Priest -> Book Service.*
-   *User -> Circle Directory -> Join Circle -> View Circle Events.*
