# Sentry Error Tracking - Setup & Usage Guide

## Overview

Sentry is **already fully integrated** into both the frontend and backend of the Ilé Àṣẹ application. This document explains how to activate and use it.

---

## Quick Start (5 minutes)

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for free account
3. Create organization (e.g., "ile-ase")

### 2. Create Projects

Create two projects:

**Frontend Project:**
- Platform: React
- Name: `ile-ase-frontend`
- Copy the DSN (looks like: `https://abc123@o456.ingest.sentry.io/789`)

**Backend Project:**
- Platform: Node.js
- Name: `ile-ase-backend`
- Copy the DSN

### 3. Configure Environment Variables

**Frontend** (`.env.production` or `.env.local`):
```env
VITE_SENTRY_DSN=https://YOUR_FRONTEND_KEY@oXXXXXX.ingest.sentry.io/XXXXXXX
```

**Backend** (`.env` or deployment config):
```env
SENTRY_DSN=https://YOUR_BACKEND_KEY@oXXXXXX.ingest.sentry.io/XXXXXXX
NODE_ENV=production
```

### 4. Test It Works

**Frontend:**
1. Start dev server: `npm run dev`
2. Navigate to `/test-sentry`
3. Click "Throw Uncaught Error"
4. Check Sentry dashboard for the error

**Backend:**
1. Start server: `npm run dev`
2. Call: `GET http://localhost:3000/api/test/sentry/error`
3. Check Sentry dashboard for the error

---

## What's Already Configured

### Frontend (`@sentry/react` v10.38.0)

✅ **Installed & Configured**
- Browser tracing integration
- Session replay (privacy-safe: masks text, blocks media)
- Error sampling: 10% in production, 100% in development
- Replay on error: 100% capture rate
- Ignores common non-critical errors (ResizeObserver, ChunkLoadError)

**Files:**
- `frontend/src/shared/config/sentry.ts` - Configuration
- `frontend/src/main.tsx` - Initialization

### Backend (`@sentry/node` v10.38.0)

✅ **Installed & Configured**
- Global exception filter
- Request context tracking (requestId, path, method, statusCode)
- User context tracking (userId)
- Trace sampling: 10% in production, 100% in development
- Ignores ValidationError (400 errors)

**Files:**
- `backend/src/sentry.ts` - Configuration
- `backend/src/filters/sentry-exception.filter.ts` - Exception filter
- `backend/src/main.ts` - Initialization

---

## Test Endpoints

### Frontend Test Page

**URL:** `/test-sentry`

**Tests Available:**
1. **Uncaught Error** - Tests global error handler
2. **Manual Capture** - Tests manual error reporting with context
3. **Async Error** - Tests promise rejection handling
4. **Network Error** - Tests API error capture

### Backend Test Endpoints

**Base URL:** `http://localhost:3000/api/test`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sentry/error` | GET | Throws uncaught error |
| `/sentry/http-exception` | GET | Throws HTTP 500 exception |
| `/sentry/manual-capture` | POST | Manually captures error with context |
| `/sentry/validation-error` | GET | Throws validation error (should be ignored) |
| `/health` | GET | Check if Sentry is configured |

**Example:**
```bash
# Test uncaught error
curl http://localhost:3000/api/test/sentry/error

# Check Sentry configuration
curl http://localhost:3000/api/test/health
```

---

## Using Sentry in Your Code

### Frontend

**Automatic Error Capture:**
```typescript
// Errors thrown anywhere are automatically captured
throw new Error('Something went wrong');
```

**Manual Error Capture:**
```typescript
import { captureException } from '@/shared/config/sentry';

try {
  // risky operation
} catch (error) {
  captureException(error, {
    userId: user.id,
    action: 'checkout',
    cartTotal: 15000,
  });
}
```

### Backend

**Automatic Error Capture:**
```typescript
// All unhandled exceptions are automatically captured
throw new Error('Database connection failed');
```

**Manual Error Capture:**
```typescript
import { captureException } from '../sentry';

try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    userId: req.user?.id,
    operation: 'payment-processing',
    amount: 10000,
  });
  throw error; // Re-throw if needed
}
```

---

## Viewing Errors in Sentry

### Dashboard Navigation

1. **Issues Tab** - See all errors
2. **Performance Tab** - See slow transactions (if enabled)
3. **Releases Tab** - Track errors by version

### Error Details

Each error shows:
- **Stack Trace** - Where the error occurred
- **Breadcrumbs** - User actions leading to error
- **Context** - Custom data you attached
- **User Info** - Who experienced the error
- **Environment** - production/development
- **Session Replay** - Video of what user did (frontend only)

---

## Configuring Alerts

### Recommended Alerts

1. **New Issue Alert**
   - Trigger: First time an error occurs
   - Action: Email/Slack notification
   - Why: Catch new bugs immediately

2. **High Error Rate Alert**
   - Trigger: >10 errors/minute
   - Action: Email/Slack notification
   - Why: Detect systemic issues

3. **Critical Error Alert**
   - Trigger: 500 errors
   - Action: Email/Slack/PagerDuty
   - Why: Production outages

### Setup Steps

1. Go to **Alerts** → **Create Alert Rule**
2. Choose trigger condition
3. Set notification channel
4. Test the alert
5. Activate

---

## Best Practices

### DO ✅

- **Add context to errors**
  ```typescript
  captureException(error, {
    userId: user.id,
    action: 'payment',
    amount: 5000,
  });
  ```

- **Use descriptive error messages**
  ```typescript
  throw new Error(`Payment failed for order ${orderId}: ${reason}`);
  ```

- **Capture handled errors when important**
  ```typescript
  try {
    await criticalOperation();
  } catch (error) {
    captureException(error);
    showUserFriendlyMessage();
  }
  ```

### DON'T ❌

- **Don't capture expected errors**
  ```typescript
  // BAD: Don't capture validation errors
  if (!email) {
    captureException(new Error('Email required')); // ❌
  }
  ```

- **Don't include sensitive data**
  ```typescript
  // BAD: Don't send passwords, tokens, etc.
  captureException(error, {
    password: user.password, // ❌
    creditCard: card.number, // ❌
  });
  ```

- **Don't capture too frequently**
  - Sentry has rate limits
  - Use sampling in production (already configured)

---

## Troubleshooting

### Errors Not Appearing in Sentry

**Check:**
1. Is `SENTRY_DSN` / `VITE_SENTRY_DSN` set?
   - Frontend: Check browser console for Sentry init message
   - Backend: Call `/api/test/health` endpoint

2. Is the error being thrown?
   - Check browser/server console

3. Is the error being ignored?
   - Check `ignoreErrors` in sentry config

4. Network issues?
   - Check browser network tab for requests to `sentry.io`

### Too Many Errors

**Solutions:**
1. **Increase sampling rate** - Reduce `tracesSampleRate`
2. **Ignore specific errors** - Add to `ignoreErrors` array
3. **Fix the bugs** - That's the point! 😄

### Session Replays Not Working

**Check:**
1. Is `replaysOnErrorSampleRate` > 0?
2. Is user on HTTPS? (required for replay)
3. Check Sentry quota (free tier: 50 replays/month)

---

## Cost & Quotas

### Free Tier
- **5,000 errors/month**
- **50 session replays/month**
- **1 user**
- **30 days data retention**
- **Cost:** $0/month

### Team Plan
- **50,000 errors/month**
- **500 session replays/month**
- **Unlimited users**
- **90 days data retention**
- **Cost:** $26/month

**Recommendation:** Start with free tier, upgrade if you hit limits.

---

## Advanced Features (Optional)

### Release Tracking

Track which version has errors:

**Frontend** (`vite.config.ts`):
```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    sentryVitePlugin({
      org: 'your-org',
      project: 'ile-ase-frontend',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true,
  },
});
```

**Backend** (`sentry.ts`):
```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.GIT_SHA || 'development',
});
```

### Performance Monitoring

Track slow endpoints:

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1, // Already configured
  // Add performance monitoring
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
```

---

## Support

- **Sentry Docs:** https://docs.sentry.io
- **Sentry Support:** support@sentry.io
- **Internal:** Check `frontend/src/shared/config/sentry.ts` and `backend/src/sentry.ts`

---

## Summary

✅ **Sentry is ready to use** - just add DSN  
✅ **Test endpoints created** - verify it works  
✅ **Free tier sufficient** - 5,000 errors/month  
✅ **30 minutes to activate** - fastest launch blocker!

**Next Steps:**
1. Create Sentry account (5 min)
2. Add DSN to `.env` (2 min)
3. Test with `/test-sentry` (5 min)
4. Configure alerts (5 min)
5. Deploy to production ✅
