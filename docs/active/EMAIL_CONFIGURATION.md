# Email Configuration Guide

**Corrected September 18, 2026:** this doc previously described SendGrid end-to-end — wrong. Ilé Àṣẹ sends transactional email via **AWS SES** (`backend/src/shared/services/ses-email.service.ts`), not SendGrid. There is no `SENDGRID_API_KEY` anywhere in the codebase. Rewritten below to match the real implementation.

## Overview

`SesEmailService` is a thin wrapper around `@aws-sdk/client-ses`'s `SendEmailCommand`. It authenticates using whatever AWS credentials are available in the environment (currently: `AWS_REGION` env var + ambient AWS credentials — this was originally written assuming an ECS task role; on the current single-EC2 production box, worth confirming what credential source is actually in effect, e.g. an instance profile or explicit `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` in the docker-compose env). No SES-specific API key exists or is needed — it's the same AWS credential model S3 uses.

**Dev/non-production behavior:** `SesEmailService` checks `NODE_ENV === 'production'`. Outside production, it never calls SES at all — it just logs `[EMAIL-DEV] To: ... | Subject: ...` and returns. This is a hard gate in the service itself, not an opt-in flag.

---

## AWS SES Setup

### 1. Verify a sending identity

SES requires the "from" address (or its domain) to be verified before it will send:

1. AWS Console → SES → **Verified identities** → **Create identity**
2. For production, verify the domain (`iluase.com`) via DNS (adds SPF/DKIM records) rather than a single address — this also gets you domain-wide sending and avoids per-address verification.
3. If the account is still in the SES **sandbox**, every recipient address also needs to be individually verified, and daily send volume is capped low — request production access (AWS Console → SES → **Account dashboard** → **Request production access**) before relying on this for real users.

### 2. IAM permissions

Whatever credentials the app runs with need `ses:SendEmail` (and `ses:SendRawEmail` if that's ever used) on the verified identity's ARN. Check the current production credential source and confirm this permission is actually attached — not verified as part of this doc correction.

---

## Environment Configuration

Real env vars, per `backend/.env.example` and `ses-email.service.ts`:

```env
# AWS SES
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@iluase.com   # falls back to this if unset — override per environment if needed

# Frontend URL (used to build links inside email bodies, e.g. verification/reset links)
FRONTEND_URL=https://iluase.com
```

There is no `SENDGRID_API_KEY`, no `EMAIL_SERVICE_PROVIDER` variable, and no separate email-specific API key — sending is authorized via the same AWS credentials as everything else (S3, etc.).

---

## Testing Email Delivery

### Local/non-production

Nothing to configure — `NODE_ENV` won't be `production` locally, so every call to `sesEmailService.sendEmail()` just logs and returns:

```
[SesEmailService] [EMAIL-DEV] To: user@example.com | Subject: Verify your email — Ilé Àṣẹ
```

### Against real SES

1. Set `NODE_ENV=production` and valid AWS credentials with SES send permission on the verified identity.
2. Trigger a flow that sends email — e.g. register a new account (`auth.service.ts` sends a verification email), or check `notifications/email.service.ts` for the full list of templated sends.
3. Check the recipient inbox, and the SES sending statistics in the AWS Console (SES → **Reputation and health** / **Sending statistics**) for bounces/complaints.

---

## Where emails actually get sent from

`backend/src/notifications/email.service.ts` wraps `SesEmailService` with the app's actual templates — password reset (`sendPasswordResetEmail`), and generic notification emails driven by `NotificationService`'s `sendEmail?: boolean` flag on individual notification-creation calls (used across appointments, marketplace orders, admin actions, disputes, refunds, wallet events, subscriptions, and more — grep `sendEmail: true` in `backend/src` for the full call-site list). `auth.service.ts` and `subscriptions.service.ts` also call `sesEmailService.sendEmail()` directly for verification and Devoted-tier welcome emails respectively, bypassing the notification-flag pattern.

---

## Troubleshooting

### Emails not sending

**Check:**
1. Is `NODE_ENV` actually `production`? (Outside production, sending is a no-op by design — this is usually not a bug.)
2. Is the "from" identity/domain verified in SES?
3. If the SES account is still in sandbox mode, is the recipient address also verified?
4. Do the running credentials have `ses:SendEmail` permission?
5. Check backend logs — `SesEmailService` logs `Email sent via SES to <address>` on success, and AWS SDK errors will surface as thrown exceptions from `sendEmail()` (callers generally catch-and-log rather than fail the request — check the specific caller).

### Emails going to spam

- Domain not verified / no SPF-DKIM (see setup above — this is exactly what domain verification in SES sets up for you).
- Cold sending domain/IP reputation — SES's shared IP pool reputation applies unless using a dedicated IP.

### Rate limiting

SES enforces a sending rate (requests/second) and a daily quota, both visible in the SES console and scaling automatically with account reputation and history — check current limits there rather than assuming a fixed number.

---

## Monitoring

- **AWS Console → SES → Reputation and health / Sending statistics** — bounces, complaints, delivery.
- **Backend logs** — `SesEmailService` logs each send attempt.
- **Database:** `Notification.emailSent` flag tracks whether the app believes it sent an email for a given notification:
  ```sql
  SELECT id, type, title, "emailSent", "createdAt"
  FROM "Notification"
  WHERE "emailSent" = true
  ORDER BY "createdAt" DESC
  LIMIT 10;
  ```

---

## Best Practices

1. **Never hardcode credentials or the from-address** — read from `ConfigService`, as `SesEmailService` already does.
2. **Handle errors gracefully** — most call sites already catch-and-log rather than fail the parent request; keep that pattern for any new email trigger.
3. **Test in non-production first** — the dev no-op logging makes this safe by default; only flip `NODE_ENV=production` locally with real AWS creds if you specifically need to test real delivery.
4. **Monitor bounce/complaint rate** in the SES console — AWS can throttle or suspend sending ability if these get too high, independent of anything in this app's own code.

---

**Last corrected:** September 18, 2026
