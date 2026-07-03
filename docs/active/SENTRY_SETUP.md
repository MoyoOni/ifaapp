# Sentry Setup Guide

## Overview

Sentry is configured for both backend (NestJS) and frontend (React) to capture errors and performance data in production.

---

## Quick Start

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for free account
3. Create organization: `ile-ase`

### 2. Create Projects

**Backend Project**:
- Platform: Node.js
- Name: `ile-ase-backend`
- Copy DSN

**Frontend Project**:
- Platform: React
- Name: `ile-ase-frontend`
- Copy DSN

### 3. Configure Environment Variables

**Backend** (`backend/.env`):
```env
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```env
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VITE_ENVIRONMENT=development
```

### 4. Test

**Backend**:
```bash
cd backend
npm run dev
# Sentry will log: "Sentry disabled (no DSN or development mode)"
```

**Frontend**:
```bash
cd frontend
npm run dev
# Sentry will log: "Sentry disabled (no DSN or development mode)"
```

---

## How It Works

### Backend

**Automatic Error Capture**:
- All unhandled exceptions captured
- 5xx errors sent to Sentry
- User context included (if authenticated)
- Request context included (URL, method, body)

**Files**:
- `backend/src/sentry/sentry.service.ts` - Core service
- `backend/src/common/filters/sentry-exception.filter.ts` - Exception filter
- `backend/src/common/middleware/sentry.middleware.ts` - User tracking

**Usage**:
```typescript
// Inject SentryService
constructor(private sentryService: SentryService) {}

// Capture exception
this.sentryService.captureException(error, { context: 'data' });

// Capture message
this.sentryService.captureMessage('Something happened', 'warning');
```

### Frontend

**Automatic Error Capture**:
- All unhandled errors captured
- React component errors captured
- User context included (if logged in)
- Session replay on errors

**Files**:
- `frontend/src/lib/sentry.ts` - Initialization
- `frontend/src/components/common/ErrorBoundary.tsx` - Error boundary

**Usage**:
```typescript
import { captureException, setUser, clearUser } from './lib/sentry';

// Capture error
try {
  // code
} catch (error) {
  captureException(error, { context: 'data' });
}

// Set user (on login)
setUser({ id: user.id, email: user.email, role: user.role });

// Clear user (on logout)
clearUser();
```

---

## Production Setup

### 1. Get Production DSNs

Create separate projects for production:
- `ile-ase-backend-prod`
- `ile-ase-frontend-prod`

### 2. Configure Production Environment

**Backend** (`.env.production`):
```env
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NODE_ENV=production
```

**Frontend** (`.env.production`):
```env
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VITE_ENVIRONMENT=production
```

### 3. Deploy

Sentry will automatically start capturing errors in production.

---

## Monitoring

### Sentry Dashboard

1. Log in to [sentry.io](https://sentry.io)
2. Select project
3. View:
   - **Issues** - All errors
   - **Performance** - Slow endpoints
   - **Releases** - Track deployments
   - **Alerts** - Configure notifications

### Key Metrics

- **Error Rate** - Errors per minute
- **Affected Users** - Users experiencing errors
- **Crash-Free Sessions** - % of sessions without errors
- **Response Time** - p50, p95, p99

---

## Alerts

### Configure Slack/Email Alerts

1. Go to **Settings** → **Integrations**
2. Add Slack or Email
3. Configure alert rules:
   - New error types
   - Error spike (>10/min)
   - Performance degradation

---

## Troubleshooting

### Errors Not Appearing

**Check**:
1. Is `SENTRY_DSN` set?
2. Is environment not `development`?
3. Check backend/frontend logs for "Sentry initialized"

**Solution**:
```bash
# Backend
cd backend
cat .env | grep SENTRY_DSN
npm run dev
# Look for: "Sentry initialized for production"

# Frontend
cd frontend
cat .env | grep VITE_SENTRY_DSN
npm run dev
# Look for: "Sentry initialized for production"
```

### Too Many Errors

**Cause**: Error budget exceeded (5,000/month on free tier)

**Solution**:
- Upgrade to paid plan
- Increase sample rate filtering
- Fix high-frequency errors

### Sensitive Data in Errors

**Check**: Sentry dashboard for passwords, tokens

**Solution**: Already filtered in `beforeSend` hook
- Cookies removed
- Authorization headers removed
- Passwords never logged

---

## Best Practices

### 1. Don't Log Sensitive Data

```typescript
// ❌ Bad
this.sentryService.captureException(error, {
  password: user.password,
  token: user.token,
});

// ✅ Good
this.sentryService.captureException(error, {
  userId: user.id,
  email: user.email,
});
```

### 2. Add Context

```typescript
// ❌ Bad
this.sentryService.captureException(error);

// ✅ Good
this.sentryService.captureException(error, {
  appointmentId,
  userId,
  action: 'booking_creation',
});
```

### 3. Use Breadcrumbs

```typescript
this.sentryService.addBreadcrumb({
  category: 'payment',
  message: 'Payment initiated',
  level: 'info',
  data: { amount, currency },
});
```

---

## Free Tier Limits

- **5,000 errors/month**
- **10,000 performance transactions/month**
- **1 GB attachments**
- **30 days data retention**

**Sufficient for launch!**

---

## Support

**Sentry Documentation**: https://docs.sentry.io  
**Ilé Àṣẹ Team**: Check backend/frontend logs

---

**Last Updated**: February 11, 2026
