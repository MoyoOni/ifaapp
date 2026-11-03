# Ìlú Àṣẹ — Safeguarding Implementation Requirements and Status

**INTERNAL — Platform Owner checklist.** Part C of the Safeguarding and Community Protection Policy.

A policy must not promise protections the platform cannot deliver. Each requirement below was checked against the code on 3 November 2026. Part A is not published until every P0 item is **Exists**, or until its wording is changed to describe what actually exists.

## 25. Required platform capabilities

| ID | Requirement | Priority | Status today | Evidence / what's missing |
|---|---|---|---|---|
| SAFE-01 | Raise a concern from every profile | P0 | **Exists** (3 Nov 2026) | A Babalawo's profile files a concern (`complaints`); every other profile files a report (`user-reports`) — so anyone can be reported. Both forms now carry sexual misconduct / unwanted contact, harassment or intimidation, controlling behaviour, fear-based manipulation, financial exploitation and breach of confidentiality. *(Corrects the first version of this table, which said only Babalawos could be reported.)* |
| SAFE-02 | Secure safeguarding case register | P0 | **Partial** | Complaints have status, resolution notes, resolver and keyword flags; crisis flags have claim/resolve history. **Missing:** one register across complaints, crisis flags and email reports; priority level; assigned handler; interim measures and communications log per case. |
| SAFE-03 | Restricted access to safeguarding reports | P0 | **Exists** (3 Nov 2026) | New **Safeguarding** admin sub-role. Practitioner concerns, the crisis queue and safeguarding-category user reports are readable and actionable only by Safeguarding and Super admins (guards + service filter; `test/safeguarding-access.integration.spec.ts`); moderators keep spam/impersonation reports; notifications go only to those who may read them. **Owner to do:** give the Safeguarding Lead this sub-role (admin → Users). |
| SAFE-04 | Escalate urgent reports | P0 | **Partial** | Sexual-misconduct reports and keyword matches are marked **Urgent**, sorted first and send an urgent in-app alert to Safeguarding/Super admins; crisis language notifies admins. **Missing:** an out-of-app alert (email/SMS) to the Safeguarding Lead — email depends on SES leaving the sandbox. |
| SAFE-05 | Temporarily restrict practitioner accounts | P0 | **Partial** | Whole-account suspension exists (admin Users, and "Suspend bookings" when resolving a complaint). **Missing:** narrower measures — stop new bookings / hide profile only; block contact between two named people. |
| SAFE-06 | Evidence preservation and case history | P0 | **Partial** | Complaint evidence links, bookings, payments, escrow, audit log and soft-deletion of most member content. **Missing:** a "legal hold" so nothing linked to an open case can be erased (GDPR erasure currently could). |
| SAFE-07 | Secure communication with reporting members | P0 | **Partial** | Members see their complaint status in their account and get a notification on resolution. **Missing:** a two-way, private case conversation (messaging is paused platform-wide). Until then: email from the safeguarding address. |
| SAFE-08 | Conflict-of-interest declarations | P1 | **Missing** | Manual (recorded on the case) until built. |
| SAFE-09 | Case status and follow-up tracking | P1 | **Partial** | OPEN / UNDER_REVIEW / RESOLVED / DISMISSED on complaints; crisis follow-up history. No follow-up reminders. |
| SAFE-10 | Anonymous reporting | P1 | **Missing** | Every complaint is tied to the reporter's account. |
| SAFE-11 | Safeguarding dashboard with anonymised metrics | P1 | **Missing** | The admin overview shows open crisis-flag counts only. |
| SAFE-12 | Practitioners accept the safeguarding standards | P0 | **Missing** | Not part of Babalawo/vendor onboarding. Needs an acceptance step recording version and time (the same pattern as the oral-history licence). |
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
6. Is account suspension acceptable as the only interim restriction until SAFE-05 is built?
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
2. **SAFE-12** — practitioner acceptance of the standards at onboarding (needs Part A approved, so the accepted text is final).
3. **SAFE-02** — a single case view across complaints, user reports, crisis flags and email-logged reports, with priority, handler, measures and communications.
4. **SAFE-04 + SAFE-06** — Priority-1 escalation to the Safeguarding Lead; a legal hold that blocks erasure while a case is open.
5. **SAFE-05** — booking-only / profile-hidden restrictions.
6. **SAFE-13** — retention schedule (after decision 11).
7. P1 items: SAFE-10, SAFE-08, SAFE-11, SAFE-14, SAFE-09.
