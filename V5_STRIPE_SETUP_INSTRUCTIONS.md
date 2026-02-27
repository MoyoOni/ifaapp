# 💳 Stripe Setup Instructions

**Phase 1 Task:** Track E-1 (Payment Lead)  
**Deadline:** Mar 8, 2026 (test setup), Mar 20, 2026 (live keys)  
**Purpose:** Configure Stripe test and production accounts for payment processing

---

## 📋 What You'll Set Up

```
FEB 27-MAR 8:     Stripe TEST account
                  ├─ Create test project
                  ├─ Get test API keys
                  ├─ Register webhook endpoint
                  ├─ Create test payment method
                  └─ Verify webhook works

MAR 20-22:        Stripe LIVE account (production)
                  ├─ Get live API keys
                  ├─ Register production webhook
                  ├─ Configure fraud rules
                  ├─ Set up payout schedule
                  └─ Final verification
```

---

## Phase 1: Stripe TEST Setup (Feb 27 - Mar 8)

### Step 1: Create Stripe Account

1. Go to **https://dashboard.stripe.com/register**
2. Sign up with company email (recommend: finance@ilu-ase.com)
3. Create account as "ilu-ase-test" (for test keys)

**Screenshot checklist:**
- [ ] Account created
- [ ] Email verified
- [ ] Payment method added

---

### Step 2: Enable Test Mode

1. Log in to **https://dashboard.stripe.com**
2. Look for toggle in top-right: **"View test data"**
3. Click toggle → should show **Test Mode** (blue background)

**Screenshot checklist:**
- [ ] Test Mode enabled (blue toggle visible)
- [ ] Dashboard shows "Test Publishable Key" and "Test Secret Key"

---

### Step 3: Get Test API Keys

1. In Stripe dashboard, click **Developers** (left sidebar)
2. Click **API keys**
3. You should see:
   - **Publishable key:** `pk_test_...`
   - **Secret key:** `sk_test_...`

**❌ CRITICAL:** Do NOT share secret key publicly!

**Actions:**
- [ ] Copy test publishable key → add to `frontend/.env.local`
- [ ] Copy test secret key → add to `backend/.env.local`
- [ ] ✅ Verify NOT committed to git

**File locations:**
```
backend/.env.local:
STRIPE_API_KEY_TEST=sk_test_...

frontend/.env.local:
VITE_STRIPE_PUBLIC_KEY_TEST=pk_test_...
```

---

### Step 4: Create Webhook Endpoint

**What is a webhook?** Stripe sends your app events (charge.completed, charge.failed, etc). Your app needs to listen for these.

**Steps:**

1. In Stripe dashboard, click **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Fill in:
   - **Endpoint URL:** `https://staging.ilu-ase.com/webhooks/stripe`
   - **Events to send:**
     - [ ] charge.completed
     - [ ] charge.failed
     - [ ] charge.refunded
     - [ ] customer.created
     - [ ] payment_intent.succeeded
     - [ ] payment_intent.payment_failed

4. Click **Add endpoint**
5. You'll get a **Webhook signing secret:** `whsec_...`

**Actions:**
- [ ] Copy webhook signing secret → add to `backend/.env.local`
  ```
  STRIPE_WEBHOOK_SECRET_TEST=whsec_...
  ```

**Backend setup (should already exist):**

Check `backend/src/payments/stripe.webhooks.ts`:
```typescript
@Post('/webhooks/stripe')
async handleStripeWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Body() body: any
) {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.rawBody,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET_TEST
  );
  
  switch (event.type) {
    case 'charge.completed':
      // Handle charge completion
      break;
    case 'charge.failed':
      // Handle charge failure
      break;
    // ... other events
  }
  return { received: true };
}
```

---

### Step 5: Test with Stripe Test Card

**Stripe provides test payment methods:**

| Card Number | CVC | Exp Date | Result |
|---|---|---|---|
| `4242 4242 4242 4242` | Any 3 digits | Any future date | ✅ Success |
| `4000 0000 0000 0002` | Any 3 digits | Any future date | ❌ Decline |
| `4000 0025 0000 3155` | Any 3 digits | Any future date | ⚠️ Require auth |

**Test payment flow:**

1. Go to staging app: https://staging.ilu-ase.com
2. Browse to marketplace (or wallet deposit)
3. Try to make a payment with `4242 4242 4242 4242`
4. **Expected:** Payment succeeds, Sentry shows no errors
5. Check Stripe dashboard → Payments → should see transaction

**Screenshot checklist:**
- [ ] Test payment succeeded in app
- [ ] Payment appears in Stripe dashboard
- [ ] Webhook received (check Events in Stripe)

---

### Step 6: Verify Webhook Delivery

1. In **Stripe dashboard → Webhooks**
2. Click on your webhook endpoint
3. Scroll to **Recent events**
4. You should see:
   - `charge.completed` event
   - `charge.succeeded` event
   - Status: **Delivered**

**If NOT delivered:**
- Check backend logs: `docker logs backend` or `pm2 logs`
- Verify endpoint URL is correct and accessible
- Check webhook signing secret matches `.env`

**Actions:**
- [ ] Webhook received by backend
- [ ] Status shows "Delivered"
- [ ] Retry failed deliveries if needed

---

### Step 7: Test Refund Flow

1. In **Stripe dashboard → Payments**
2. Find the test payment you made
3. Click the payment
4. Scroll down → click **Refund** button
5. Refund the full amount

**Expected:**
- Refund processed in Stripe
- Backend receives `charge.refunded` webhook
- Customer's wallet balance restored

**Test:**
```bash
# Check if refund webhook was received
curl https://staging.ilu-ase.com/api/wallet/balance
# Should show refunded amount restored
```

**Actions:**
- [ ] Refund processed
- [ ] Webhook received
- [ ] Wallet balance restored

---

## 📝 Test Setup Summary

**By Mar 8, your `.env` files should have:**

### `backend/.env.local`
```
STRIPE_API_KEY_TEST=sk_test_...
STRIPE_WEBHOOK_SECRET_TEST=whsec_...
```

### `frontend/.env.local`
```
VITE_STRIPE_PUBLIC_KEY_TEST=pk_test_...
```

**Verification:** Run all payment tests
```bash
cd backend
npm run test:integration -- --testPathPattern="payment"
# Should pass all payment scenarios
```

---

---

## Phase 3: Stripe LIVE Setup (Mar 20-22)

### ⚠️ IMPORTANT: Live Setup

**Timeline:** Start Mar 20, COMPLETE before Mar 28 (not before — might not be needed until production actually deploys)

**Considerations:**
- Live keys process REAL money
- PCI DSS compliance required
- Cannot be reversed easily

**Only do this if:**
- ✅ All staging tests passed
- ✅ Security audit complete
- ✅ CTO approved
- ✅ Finance team ready

---

### Step 1: Enable Live Mode

In **Stripe dashboard top-right:**
1. Toggle from **"View test data"** → **"View live data"**
2. Dashboard will ask: "Ready to accept live payments?"
3. Click **"Activate your account"**

**Note:** You'll be prompted to:
- [ ] Verify business information
- [ ] Add payment method for Stripe fees
- [ ] Agree to Stripe terms

---

### Step 2: Get Live API Keys

1. Click **Developers** → **API keys**
2. You should now see:
   - **Live Publishable key:** `pk_live_...`
   - **Live Secret key:** `sk_live_...`

**Actions:**
- [ ] Copy to `backend/.env.production`
- [ ] Copy to `frontend/.env.production`
- [ ] ✅ Verify NOT in git

**File locations:**
```
backend/.env.production:
STRIPE_API_KEY_LIVE=sk_live_...

frontend/.env.production:
VITE_STRIPE_PUBLIC_KEY_LIVE=pk_live_...
```

---

### Step 3: Register Production Webhook

1. **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Fill in:
   - **Endpoint URL:** `https://ilu-ase.com/webhooks/stripe` (LIVEproduction domain)
   - **Events:** Same as test (charge.completed, charge.failed, charge.refunded, etc.)
4. Get signing secret → add to `.env.production`
   ```
   STRIPE_WEBHOOK_SECRET_LIVE=whsec_...
   ```

---

### Step 4: Configure Fraud Detection

1. **Radar** (left sidebar) → **Rules**
2. Create rule: **"Block charges > $5,000"**
   - Condition: `charge.amount > 500000` (in cents)
   - Action: Block
3. Create rule: **"Multiple charges same card in 30 seconds"**
   - Condition: `charge.card.fingerprint` appears 2+ times in 30s
   - Action: Require review

**Actions:**
- [ ] Rule 1 created
- [ ] Rule 2 created
- [ ] Tested with test payment

---

### Step 5: Configure Payout Schedule

1. **Settings** (gear icon) → **Connect settings**
2. Look for **Payout schedule**
3. Set to:
   - **Frequency:** Manual (so you control when money is sent)
   - **Timing:** Available balance when you request

**Why manual?** Gives you control in case of disputes or chargebacks.

---

### Step 6: Enable 3D Secure (if needed)

If you expect international payments:

1. **Settings** → **Payment methods**
2. Enable **3D Secure 2**

This requires customers to verify with their bank for high-value charges.

---

### Step 7: Final Live Test

⚠️ **WARNING:** This uses REAL money. Test with small amount ($1 or ₦500).

1. Make test payment in production app
2. Use TEST card (still works with live keys):
   - `4242 4242 4242 4242` for success
3. Charge should appear in **Stripe dashboard** under "Live"
4. Verify webhook received
5. **IMMEDIATELY REFUND** the test charge

**Actions:**
- [ ] Live payment processed
- [ ] Webhook received
- [ ] Charge refunded (test money back)

---

## 🔐 Security Checklist

Before going live, verify:

- [ ] Secret keys NOT in git history
- [ ] Secret keys NOT in logs
- [ ] Webhook signature validation enabled
- [ ] 3D Secure enabled (for fraud prevention)
- [ ] Fraud detection rules configured
- [ ] PCI DSS compliance: no card data stored locally (Stripe token only)
- [ ] Refund flow works end-to-end
- [ ] Dispute handling documented

---

## 📞 Support & Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not received | Check endpoint URL is public HTTPS, check firewall, test with curl |
| "Invalid API key" error | Verify key matches environment (test vs live), check for typos |
| Payment declined for no reason | Check Stripe fraud rules, 3D Secure settings, card issuer limits |
| Webhook signature invalid | Verify signing secret matches, check for request body mutations |
| Refund takes 3-5 days | Normal — funds go back to card issuer, they process it |

**Stripe support:** https://support.stripe.com (email support 24/7 for business accounts)

---

## 📊 Stripe Setup Checklist

### TEST SETUP (by Mar 8):
- [ ] Account created
- [ ] Test mode enabled
- [ ] Test API keys obtained
- [ ] Webhook endpoint created + signing secret saved
- [ ] Test payment processed successfully
- [ ] Webhook received (charge.completed event)
- [ ] Refund flow tested
- [ ] All env vars in `.env.local` files (NOT git)

### LIVE SETUP (by Mar 22):
- [ ] Live mode enabled
- [ ] Live API keys obtained
- [ ] Production webhook registered
- [ ] Fraud detection rules configured
- [ ] Payout schedule set to manual
- [ ] 3D Secure enabled
- [ ] Small test payment + immediate refund
- [ ] All env vars in `.env.production` files (NOT git)

---

## 🚀 Next Steps

1. **By Feb 27:** Create Stripe test account + get test keys
2. **By Mar 1:** Register test webhook + get signing secret
3. **By Mar 5:** Run test payment + verify webhook
4. **By Mar 8:** All test setup complete, included in staging deployment
5. **By Mar 20:** Create Stripe live account + get live keys (IF approved by CTO)
6. **By Mar 22:** Register live webhook + configure fraud rules
7. **By Mar 28:** Final live test + sign-off

---

**Document Version:** 1.0  
**Created:** February 27, 2026  
**Status:** ⬜ READY TO EXECUTE  
**Owner:** [Payment Lead]  
**Last Updated:** February 27, 2026
