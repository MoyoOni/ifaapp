# Email Configuration Guide

## Overview

Ilé Àṣẹ uses SendGrid for email delivery. This guide explains how to configure and test the email system.

---

## SendGrid Setup

### 1. Create SendGrid Account

1. Go to [SendGrid.com](https://sendgrid.com)
2. Sign up for a free account (100 emails/day)
3. Verify your email address

### 2. Create API Key

1. Log in to SendGrid dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name: `ilease-production` (or `ilease-development`)
5. Permissions: **Full Access** (or **Mail Send** only)
6. Click **Create & View**
7. **Copy the API key** (you won't see it again!)

### 3. Verify Sender Identity

**For Development/Testing**:
1. Navigate to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your details:
   - From Name: `Ilé Àṣẹ`
   - From Email: `noreply@ilease.ng` (or your test email)
   - Reply To: `support@ilease.ng`
4. Verify your email

**For Production**:
1. Navigate to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow DNS setup instructions
4. Add CNAME records to your domain
5. Wait for verification (can take up to 48 hours)

---

## Environment Configuration

### Backend (.env)

Add these variables to `backend/.env`:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@ilease.ng

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

### Production (.env.production)

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@ilease.ng

# Frontend URL (for email links)
FRONTEND_URL=https://ilease.ng
```

---

## Testing Email Delivery

### Development Mode (No SendGrid)

If `SENDGRID_API_KEY` is not set, emails will be logged to console:

```
[EmailService] SendGrid not configured. Email notifications will be logged only.
[EmailService] [EMAIL] To: user@example.com
[EmailService] [EMAIL] Subject: Appointment Confirmed - Ilé Àṣẹ
[EmailService] [EMAIL] Body: Your appointment has been confirmed...
```

### Test with SendGrid

1. Set `SENDGRID_API_KEY` in `.env`
2. Restart backend: `npm run dev`
3. Trigger an email (e.g., create appointment)
4. Check your inbox
5. Check SendGrid dashboard for delivery stats

### Manual Test Script

Create `backend/scripts/test-email.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/notifications/email.service';

async function testEmail() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const emailService = app.get(EmailService);

  // Test password reset email
  await emailService.sendPasswordResetEmail(
    'your-email@example.com',
    'test-token-123',
    'Test User'
  );

  console.log('Test email sent!');
  await app.close();
}

testEmail();
```

Run:
```bash
cd backend
npx ts-node scripts/test-email.ts
```

---

## Email Types

### 1. Appointment Notifications
- **Trigger**: Appointment created/confirmed/cancelled
- **Recipients**: Client + Babalawo
- **Template**: `APPOINTMENT`

### 2. Payment Confirmations
- **Trigger**: Payment successful
- **Recipients**: User
- **Template**: `PAYMENT`

### 3. Guidance Plan Updates
- **Trigger**: Plan created/approved/completed
- **Recipients**: Client or Babalawo
- **Template**: `GUIDANCE_PLAN`

### 4. Order Updates
- **Trigger**: Order placed/paid/shipped
- **Recipients**: Customer + Vendor
- **Template**: `ORDER`

### 5. Password Reset
- **Trigger**: User requests password reset
- **Recipients**: User
- **Template**: Custom (password reset template)

---

## Email Template Structure

All emails follow this structure:

```
┌─────────────────────────────────────┐
│  Ilé Àṣẹ Header (Gradient)          │
│  Digital Nexus for Isese/Ifá        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Àṣẹ [User Name],                   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [Notification Title]          │ │
│  │ [Notification Message]        │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Footer]                           │
│  © 2026 Ilé Àṣẹ                     │
└─────────────────────────────────────┘
```

**Features**:
- Amber/brown gradient header
- Cultural greeting ("Àṣẹ")
- Personalized with Yoruba name (if available)
- Responsive design
- Professional styling

---

## Troubleshooting

### Emails Not Sending

**Check**:
1. Is `SENDGRID_API_KEY` set correctly?
2. Is the API key valid? (check SendGrid dashboard)
3. Is sender email verified?
4. Check backend logs for errors

**Solution**:
```bash
# Check if SendGrid is configured
cd backend
npm run dev
# Look for: "SendGrid email service configured"
```

### Emails Going to Spam

**Causes**:
- Sender domain not authenticated
- High spam score
- No SPF/DKIM records

**Solution**:
1. Authenticate your domain in SendGrid
2. Add SPF/DKIM DNS records
3. Use professional email content
4. Avoid spam trigger words

### Rate Limiting

**SendGrid Free Tier Limits**:
- 100 emails/day
- 40,000 emails/month (first month)
- 100 emails/day after first month

**Solution**:
- Upgrade to paid plan
- Implement email queue (see V3 backlog)
- Batch non-critical emails

### Template Not Rendering

**Check**:
1. Is HTML valid?
2. Are variables populated correctly?
3. Test in different email clients

**Solution**:
- Use [Litmus](https://litmus.com) or [Email on Acid](https://www.emailonacid.com) for testing
- Test in Gmail, Outlook, Apple Mail

---

## Monitoring

### SendGrid Dashboard

Monitor email delivery:
1. Log in to SendGrid
2. Navigate to **Activity**
3. View:
   - Delivered emails
   - Bounces
   - Spam reports
   - Opens (if tracking enabled)
   - Clicks (if tracking enabled)

### Backend Logs

Check backend logs for email sending:

```bash
cd backend
npm run dev
# Look for:
# [EmailService] Email sent to user@example.com for notification abc-123
# [EmailService] Password reset email sent to user@example.com
```

### Database Tracking

Check `emailSent` flag in notifications:

```sql
SELECT id, type, title, "emailSent", "createdAt"
FROM "Notification"
WHERE "emailSent" = true
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## Best Practices

### 1. Use Environment Variables

Never hardcode API keys:
```typescript
// ❌ Bad
const apiKey = 'SG.xxxxx';

// ✅ Good
const apiKey = this.configService.get('SENDGRID_API_KEY');
```

### 2. Handle Errors Gracefully

```typescript
try {
  await emailService.sendNotificationEmail(userId, notification);
} catch (error) {
  // Log error but don't fail the request
  this.logger.error(`Email failed: ${error.message}`);
}
```

### 3. Test Before Deploying

Always test emails in staging before production:
1. Send test emails
2. Check spam score
3. Verify links work
4. Test in multiple email clients

### 4. Monitor Delivery

Set up alerts for:
- High bounce rate (>5%)
- High spam complaint rate (>0.1%)
- Low delivery rate (<95%)

---

## Production Checklist

Before launching:

- [ ] SendGrid account created
- [ ] API key generated
- [ ] Sender domain authenticated
- [ ] SPF/DKIM records added
- [ ] Environment variables set
- [ ] Test emails sent successfully
- [ ] Templates tested in multiple clients
- [ ] Spam score checked (<5)
- [ ] Monitoring set up
- [ ] Rate limits understood

---

## Support

**SendGrid Support**:
- Documentation: https://docs.sendgrid.com
- Support: https://support.sendgrid.com

**Ilé Àṣẹ Email Issues**:
- Check backend logs
- Review SendGrid activity
- Contact development team

---

**Last Updated**: February 11, 2026
