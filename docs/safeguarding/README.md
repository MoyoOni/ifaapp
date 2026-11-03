# Ìlú Àṣẹ Safeguarding and Community Protection Policy

Draft v1.0, 3 November 2026 — **not approved, not published.** Built from the platform owner's policy outline and checked against what the platform actually does.

| Part | File | Audience | Publish? |
|---|---|---|---|
| A — Member policy | [part-a-member-policy-DRAFT.md](part-a-member-policy-DRAFT.md) | Members | Yes, as a website page, once the conditions in Part C §27 are met |
| B — Internal procedure | [part-b-internal-procedure.md](part-b-internal-procedure.md) | Safeguarding Lead, admins, moderators, carers, advising elders | No |
| C — Requirements and status | [part-c-implementation-status.md](part-c-implementation-status.md) | Platform Owner | No |

Keep Part A separate from the cultural orientation: members must be able to find their rights and how to report without going through religious or cultural education first.

Supersedes `docs/content/healthy-boundaries-DRAFT.md` (COMMUNITY_BACKLOG.md FOR-016).

## Telegram alerts for urgent cases (about 5 minutes)

Urgent cases (sexual misconduct reports, or any case raised to P1) alert Safeguarding and Super admins inside Ìlú Àṣẹ. To be told on your phone as well:

1. In Telegram, open a chat with **@BotFather**, send `/newbot`, and follow the prompts (any name, e.g. "Ìlú Àṣẹ Safeguarding"). It gives you a **bot token**.
2. Open a chat with your new bot and send it any message (e.g. "hello").
3. In a browser, visit `https://api.telegram.org/bot<your token>/getUpdates` and find `"chat":{"id":` — that number is the **chat id**.
4. In Terminal, run `cd ~/Documents/iluase && AWS_CLI=/Users/a40/Library/Python/3.9/bin/aws scripts/set-prod-safeguarding-telegram.sh` and paste the token and the chat id when asked.
5. In admin → Safeguarding Cases, press **send a test alert**.

The alert says only "Urgent safeguarding case SG-0007" and a link — never names or what was reported. Keep the bot token private, like a password.
