# Design Overhaul: "The Connected Path" (Ilé Àṣẹ 2.0)

## 1. Core Philosophy
**"Structured, Vibrant, yet Sacred."**
We are moving away from the "office dashboard" look to a **Side-Navigation** based layout that feels like a robust application. The focus is on **Ease of Access** and **Visual Engagement**.

**Key Changes:**
- **Side Navigation:** A persistent vertical sidebar on the left (desktop) / slide-out drawer (mobile).
- **Consolidated Profile Hub:** Personal tools like **Messages** and **Wallet** are moved into the User Profile area to declutter the main workspace.
- **Vibrant Palette:** Moving from "dark/muted" to "rich/vibrant" earth tones.

---

## 2. Visual Identity "Igbo & Iye" (Forest & Life)

### A. New Color Palette
*Brighter, livelier, connected to nature.*

| Color Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Iye Brown** (Primary) | `#8B4513` (Saddle Brown) | Brighter, richer earth tone. Used for active states and primary headers. |
| **Ewe Green** (Secondary) | `#228B22` (Forest Green) | Fresh, living green. Used for success states, "Go" actions, and growth indicators. |
| **Ola Gold** (Accent) | `#F59E0B` (Amber 500) | The "Hint of Gold". Used for premium items, notifications, and special highlights. |
| **Background** | `#F5F5F4` (Stone 100) | **Light Mode** by default? Or a softer Dark Mode (`#1C1917` Stone 900) but with colorful accents. *Assumption: We will support a rich dark mode but use these brighter colors to pop against it.* |

### B. Typography
- **Headings:** `Fraunces` (Serif) - Kept for that "Sacred/Premium" feel.
- **UI Text:** `Outfit` (Sans) - Clean, geometric, legible.

---

## 3. Navigation Structure: The Side Bar

The Side Bar is the "Tree Trunk" of the application. It anchors the user.

### A. Main Navigation (Top Section)
*Direct access to the core pillars of the platform.*

1.  **Home** (Dashboard)
2.  **Marketplace** (Oja)
3.  **Academy** (Koka)
4.  **Temples** (Ile)
5.  **Practitioners** (Babalawos)
6.  **Circles** (Egbe)
7.  **Events** (Odun)
8.  **Forum** (Apero)

### B. The Profile Hub (Bottom Section)
*Instead of cluttering the top/main nav, personal utility links live here.*

The bottom of the sidebar features the **User Avatar & Name**. Clicking this expands a "Personal Menu" (or takes you to a Profile Dashboard) containing:
1.  **Messages** (Secure Inbox)
2.  **Wallet** (Cowries/Credit)
3.  **Appointments** (If Client) / **Schedule** (If Babalawo)
4.  **Settings & Verification**

---

## 4. Layout Blueprints

### Desktop Layout
```text
+----------------+------------------------------------------------+
|  LOGO & BRAND  |                                                |
|                |  [Header: Page Title]       [Notifs] [Search]  |
|  [Home]        |                                                |
|  [Marketplace] |  +------------------------------------------+  |
|  [Academy]     |  |                                          |  |
|  [Temples]     |  |   MAIN CONTENT AREA                      |  |
|  [Events]      |  |   (Cards, Feeds, Lists)                  |  |
|  [Circles]     |  |                                          |  |
|  [Forum]       |  |                                          |  |
|                |  +------------------------------------------+  |
|                |                                                |
|  [Lines Separator]|                                             |
|                |                                                |
|  (AVATAR)      |                                                |
|  [My Profile] >|                                                |
|    - Messages  |                                                |
|    - Wallet    |                                                |
+----------------+------------------------------------------------+
```

### Mobile Layout
- **Top Bar:** Hamburger Menu (Left), Logo (Center), Notifications (Right).
- **Drawer (Sidebar):** Slides out from the left containing the full menu above.

---

## 5. Execution Steps

1.  **Update Tailwind Config:** Define the new `iye-brown`, `ewe-green`, and adjust `ase-gold`.
2.  **Create `SidebarLayout`:** A new component that replaces the current ad-hoc navigation.
    - It must handle the "Active State" (highlighting the current page).
    - It must handle the "Profile Hub" dropdown logic for Messages/Wallet.
3.  **Refactor `App.tsx`:**
    - Wrap the entire application in `<SidebarLayout>`.
    - Modify the routing logic to ensure clicking "Messages" opens the message view (which might now be a modal or a main view—User asked for it to be "inside profile page". *Interpretation: Messages is accessible VIA the profile, but likely still needs a full screen for reading.*)
