# Ìlú Àṣẹ — Safeguarding Implementation Requirements and Status

**INTERNAL — Platform Owner checklist.** Part C of the Safeguarding and Community Protection Policy.

A policy must not promise protections the platform cannot deliver. Each requirement below was checked against the code on 3 November 2026. Part A is not published until every P0 item is **Exists**, or until its wording is changed to describe what actually exists.

## 25. Required platform capabilities

| ID | Requirement | Priority | Status today | Evidence / what's missing |
|---|---|---|---|---|
| SAFE-01 | Raise a concern from every profile | P0 | **Exists** (3 Nov 2026) | A Babalawo's profile files a concern (`complaints`); every other profile files a report (`user-reports`) — so anyone can be reported. Both forms now carry sexual misconduct / unwanted contact, harassment or intimidation, controlling behaviour, fear-based manipulation, financial exploitation and breach of confidentiality. *(Corrects the first version of this table, which said only Babalawos could be reported.)* |
| SAFE-02 | Secure safeguarding case register | P0 | **Exists** (3 Nov 2026) | Admin → **Safeguarding Cases**: every concern about a practitioner and every safeguarding report opens a case automatically (reference SG-0001…, priority, status, handler, running log of contacts, measures and decisions); concerns that arrive by email are logged by hand; resolving the original report records the decision and closes the case. Crisis flags keep their own claim/resolve queue, and the register shows how many are waiting. |
| SAFE-03 | Restricted access to safeguarding reports | P0 | **Exists** (3 Nov 2026) | New **Safeguarding** admin sub-role. Practitioner concerns, the crisis queue and safeguarding-category user reports are readable and actionable only by Safeguarding and Super admins (guards + service filter; `test/safeguarding-access.integration.spec.ts`); moderators keep spam/impersonation reports; notifications go only to those who may read them. **Owner to do:** give the Safeguarding Lead this sub-role (admin → Users). |
| SAFE-04 | Escalate urgent reports | P0 | **Exists — needs setup** (3 Nov 2026) | Sexual-misconduct reports, keyword matches and any case raised to P1 alert Safeguarding/Super admins in-app, and also by **Telegram** once the bot is set up (README; `scripts/set-prod-safeguarding-telegram.sh`). The message carries only the case reference. Email joins when SES leaves the sandbox. |
| SAFE-05 | Temporarily restrict practitioner accounts | P0 | **Exists** (3 Nov 2026) | From a case: **pause new bookings** (no new mentorship bookings, offerings hidden), **pause selling** (products hidden, no new orders), **hide profile** (out of search, directory and guide finder; name and photo only), **pause posting** (forum, circles, comments, remembrance wall), **no contact with the reporter** (no bookings or orders between them, each sees only the other's name and photo). Each has a reason, optional end date and is logged on the case; whole-account suspension remains in Users. |
| SAFE-06 | Evidence preservation and case history | P0 | **Exists, live** (6 Nov 2026) | Case log, complaint evidence links, bookings, payments, escrow, audit log and soft-deletion of most content — plus a **legal hold**: while a case is open, neither the person reported nor the reporter can have their data erased (self-service or admin). The member is told only to get in touch; an admin sees which case holds it; each held request is logged on the case. |
| SAFE-07 | Secure communication with reporting members | P0 | **Partial** | Members see their complaint status in their account and get a notification on resolution. **Missing:** a two-way, private case conversation (messaging is paused platform-wide). Until then: email from the safeguarding address. |
| SAFE-08 | Conflict-of-interest declarations | P1 | **Missing** | Manual (recorded on the case) until built. |
| SAFE-09 | Case status and follow-up tracking | P1 | **Partial** | OPEN / UNDER_REVIEW / RESOLVED / DISMISSED on complaints; crisis follow-up history. No follow-up reminders. |
| SAFE-10 | Anonymous reporting | P1 | **Missing** | Every complaint is tied to the reporter's account. |
| SAFE-11 | Safeguarding dashboard with anonymised metrics | P1 | **Missing** | The admin overview shows open crisis-flag counts only. |
| SAFE-12 | Practitioners accept the safeguarding standards | P0 | **Exists — draft wording** (3 Nov 2026) | Babalawos and vendors are asked on sign-in to accept the Practitioner and Vendor Standards (`backend/src/safeguarding/standards.ts`, drawn from Part A); version and time are recorded; offerings and products can't be created, and mentorship isn't listed or bookable, until they accept. **When Part A is approved,** replace the text and change `version` — everyone is asked again. |
| SAFE-13 | Retention and deletion controls for safeguarding records | P0 | **Missing** | No retention schedule; depends on decision 11. |
| SAFE-14 | Independent appeal and review process | P1 | **Missing** | Manual by email until built. |
| SAFE-15 | Documented external referral procedure | P0 | **Partial** | Part B §20 documents it; the admin-managed **Support directory** (Crisis Alerts → Support directory) holds the organisations members see. **Missing:** real organisations entered (it is empty), and a referral record on the case. |

Already in place and relied on by Part A: held payments (escrow, released on confirmation or 14 days after delivery, frozen on dispute), the Healing & Reconciliation space, wellbeing check-ins with Community Care carers, crisis detection on forum posts, circle posts and comments and the remembrance wall, the 18+ age rule in the Terms, and the private-profile setting.

**Priorities:** P0 — required before Part A makes the matching commitment. P1 — part of the safeguarding programme.

## 26. Decisions required before publication

1. Who is the designated Safeguarding Lead? (Until then, the Platform Owner.)
2. Who decides when a report concerns the Platform Owner or the Safeguarding Lead?
3. Which elders are authorised to give cultural advice on cases?
4. Who may access confidential safeguarding records?
5. ~~Concern categories (SAFE-01)~~ — added as recommended, 3 November 2026; change them if the elders prefer other wording.
6. ~~Interim restrictions~~ — built (SAFE-05).
7. Payment protection as described in Part A §3 matches the platform (escrow) — but payments are switched off until a live Paystack key is in place; confirm wording at publication.
8. The approved emergency escalation route (SAFE-04): who is called, how, out of hours?
9. Minimum age is 18 (Terms). How are reports that may involve a minor handled?
10. Which data protection law(s) apply — e.g. Nigeria's Data Protection Act 2023, UK GDPR?
11. How long are safeguarding records kept, and when are they deleted (SAFE-13)?
12. Can a two-working-day acknowledgement be met with current staffing? If not, do not advertise a response time.
13. Is there a dedicated safeguarding email address (e.g. safeguarding@iluase.com), and who reads it?

## 27. Publication conditions

Publish Part A only when:
- the Platform Owner has approved it;
- an elder or cultural advisory representative has reviewed its cultural framing;
- the Safeguarding Lead and reporting route are named and watched;
- the reporting mechanism covers what Part A says it covers (SAFE-01);
- confidential case handling is in place (SAFE-02, SAFE-03);
- interim restriction procedures are available (SAFE-05, or decision 6);
- payment arrangements are confirmed (decision 7); and
- legal and data protection review is complete (decision 10).

If a feature is not yet available, change the Part A wording to describe what exists.

## Recommended build order

1. ~~SAFE-01~~ and ~~SAFE-03~~ — done 3 November 2026.
2. ~~SAFE-12~~, ~~SAFE-02~~, ~~SAFE-05~~ — done 3 November 2026 (SAFE-12 with draft wording; SAFE-04 alerts need the Telegram setup).
4. **SAFE-04 + SAFE-06** — Priority-1 escalation to the Safeguarding Lead; a legal hold that blocks erasure while a case is open.
5. **SAFE-05** — booking-only / profile-hidden restrictions.
6. **SAFE-13** — retention schedule (after decision 11).
7. P1 items: SAFE-10, SAFE-08, SAFE-11, SAFE-14, SAFE-09.
