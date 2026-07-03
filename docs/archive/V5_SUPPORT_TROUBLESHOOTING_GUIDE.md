# 📞 Support & Troubleshooting Guide

**Phase 1 Task:** Track C-3 (Support Lead)  
**Deadline:** Mar 8, 2026  
**Purpose:** Equip support team with troubleshooting procedures for common issues

---

## 🎯 Support Team Structure

### On-Call Rotation
```
Support On-Call Primary (24/7 during launch)
├─ Communication: Slack channel #ilu-ase-incidents
├─ Escalation: CTO on standby
└─ SLA: Respond within 15 minutes

Level 1: First-line support (user-facing issues)
Level 2: Backend/database troubleshooting (infrastructure)
Level 3: CTO escalation (critical production issues)
```

### Slack Channels
- `#ilu-ase-support` — User support coordination
- `#ilu-ase-incidents` — Critical production issues
- `#ilu-ase-monitoring` — Automated alerts (Sentry, CloudWatch)

---

## 🔍 Troubleshooting Framework

**When a user reports an issue:**

1. **Gather information:**
   - What were they doing? (step-by-step)
   - What did they see? (error message, behavior)
   - When did it happen? (exact time, timezone)
   - Does it still happen? (reproducible?)
   - What device/browser? (environment)

2. **Check monitoring:**
   - Sentry: Any errors around that timestamp?
   - CloudWatch: Any spikes in error rate?
   - Status page: Is anything down?

3. **Follow specific troubleshooting guide** (see below)

4. **If you can't resolve:**
   - Escalate to Level 2 (backend team)
   - Include: User info, error message, timestamp, reproduction steps

---

## 📋 Troubleshooting Issues

### 1. "Server is down" / No response from app

**Symptoms:**
- Page won't load
- All users affected
- Timeout errors (>30s)

**Quick checks (1-2 min):**
1. Check status page: https://status.ilu-ase.com
2. Check AWS console: Are EC2 instances running?
   - Go to **EC2 > Instances**
   - Should see 3+ instances in "Running" state
3. Check load balancer health: **EC2 > Load Balancers > Target Groups**
   - Should see all targets "Healthy"

**If instances are down:**
- Likely cause: Auto-scaling triggered during high load, or crash
- **Action:** SSH into a running instance and check logs:
  ```bash
  pm2 logs ilu-ase-backend --lines 100
  pm2 logs ilu-ase-frontend --lines 100
  ```

**If load balancer targets failing health checks:**
- Likely cause: App crashed or health endpoint broken
- **Action:** 
  ```bash
  # Test health endpoint directly
  curl -v http://<instance-ip>:3000/health
  
  # Check application logs
  pm2 logs ilu-ase-backend --lines 50
  ```

**If database is down:**
- Check AWS RDS console: **RDS > Databases > ilu-ase-prod**
- Status should be "Available"
- If "Failed": An automated failover might be in progress (5 min wait)
- If still failing: **ESCALATE TO LEVEL 2**

**Expected resolution time:** 5-10 minutes

**Escalation:** If servers are down after 5 min and you can't identify the issue → Level 2 (DevOps/CTO)

---

### 2. "I can't log in" / Authentication errors

**Symptoms:**
- Login page works
- Submit email/password → "Invalid credentials"
- Or: "Rate limited. Try again in 60 seconds"

**Quick checks (1-2 min):**
1. Check Sentry **Errors** tab: Any authentication errors?
   - Go to https://sentry.io → project → Errors
   - Filter by "auth", "login", "credentials"
   - Look for error pattern

2. Check if password reset works:
   - "Forgot password?" → Enter email
   - User should receive reset email
   - If no email: Email service might be down

**If rate limit error:**
- User has tried wrong password 5+ times
- Is intentional — security measure
- **Action:** User must wait 60 seconds, or admin can reset password:
  ```bash
  # SSH into backend server
  npm run prisma:studio
  # Find user, set passwordResetToken, send email
  ```

**If invalid credentials (but password is correct):**
- Likely causes:
  1. User hasn't verified email (check email_verified = false)
  2. Password hashing algorithm mismatch (upgrade path issue)
  3. Database query issue (user exists but password not found)
- **Action:**
  ```bash
  # Check user in database
  npm run prisma:studio
  # Find user by email
  # Check email_verified = true
  # Check passwordHash is not NULL
  ```

**If password reset email not received:**
- Email service down (SendGrid, AWS SES)
- Check Sentry for email errors
- **Action:** Manually reset password (admin):
  ```bash
  npm run prisma:studio
  # Find user
  # Delete passwordResetToken (so they don't have stale token)
  # Re-send reset email via admin panel
  ```

**Expected resolution time:** 5-15 minutes

**Self-service:** User can always use "Forgot password?" to reset. Takes 3-5 minutes.

**Escalation:** If password reset email not working → Level 2 (email service)

---

### 3. "Payment failed" / Checkout errors

**Symptoms:**
- Marketplace/wallet checkout works
- Click "Pay" → "Payment failed. Your bank declined this transaction."
- Or: "Invalid card" / "Network error"

**Quick checks (1-2 min):**
1. Check Sentry for Stripe errors:
   - Filter by "stripe", "payment", "charge"
   - Look for error details

2. Check Stripe dashboard:
   - https://dashboard.stripe.com → Payments
   - Find customer's payment attempt
   - Check status: succeeded, failed, requires_action

3. Common reasons:
   - Card declined by issuer (insufficient funds, fraud detection)
   - Expired card
   - Incorrect CVV
   - Card doesn't support international payments
   - 3D Secure required but not completed

**If card declined:**
- This is normal — user's bank rejected it
- User should:
  1. Try different card
  2. Contact their bank to ask why
  3. Use different payment method

**If "Network error":**
- Might be temporary Stripe API issue
- **Action:**
  - Wait 30 seconds
  - Try payment again
  - If persistent: Check Stripe status page

**If Sentry shows "Invalid API Key":**
- Stripe keys misconfigured
- Check backend `.env`:
  ```bash
  echo $STRIPE_API_KEY_LIVE  # Should start with sk_live_
  ```
- If wrong: Update `.env` + restart backend

**If Sentry shows "Webhook signature invalid":**
- Stripe webhook not registered correctly
- Check webhook signing secret in `.env` matches Stripe dashboard
- **Action:** Restart backend:
  ```bash
  pm2 restart ilu-ase-backend
  ```

**Expected resolution time:** 2-5 minutes (usually user action)

**Escalation:** If payment processor is down (Stripe API) → Level 3 (CTO + Stripe support)

---

### 4. "Wallet balance is wrong" / Transaction not showing

**Symptoms:**
- Deposit completed but balance didn't update
- Transaction missing from history
- Negative balance

**Quick checks (1-2 min):**
1. Refresh page (caching issue)
2. Check Sentry for wallet errors:
   - Filter by "wallet", "balance", "transaction"
3. Check database:
   ```bash
   npm run prisma:studio
   # Find user > wallet > check balance
   # Check transactions table > filter by user
   ```

**If balance didn't update after payment:**
- Likely cause: Stripe webhook not received (or processed late)
- Stripe webhooks are async — might take 30-60 seconds
- **Action:**
  1. Wait 2 minutes
  2. Refresh page
  3. If still missing: Check Sentry for webhook errors

**If transaction is missing:**
- Was it processed? Check Sentry for charge.completed event
- Check Stripe dashboard: Does the charge exist?
- If Stripe shows charged but wallet shows nothing:
  - Webhook wasn't processed
  - **Action:** Manually trigger webhook (admin):
    ```bash
    npm run trigger-webhook -- <payment-intent-id>
    ```

**If balance is negative:**
- Database corruption or logic error
- **ESCALATE TO LEVEL 2 immediately**
- Do NOT let user withdraw

**Expected resolution time:** 2-5 minutes

**Escalation:** If webhook not received or database corrupted → Level 2 (backend engineer)

---

### 5. "I can't access a feature" / 403 Forbidden

**Symptoms:**
- Feature works for some users, not others
- Click button → "Access denied"
- Redirected to home page

**Quick checks (1-2 min):**
1. Check user role:
   - Client, Babalawo, Vendor, Admin, Advisory
   - User dashboard shows role
2. Check feature permissions:
   - Example: Admin panel only for role="admin"
   - Example: Vendor dashboard only for role="vendor"

**If user should have access:**
- Role might not be set correctly
- Check database:
  ```bash
  npm run prisma:studio
  # Find user > check role field
  # Should be one of: CLIENT, BABALAWO, VENDOR, ADMIN, ADVISORY_BOARD
  ```

**If role is wrong:**
- Update via Prisma Studio:
  ```bash
  npm run prisma:studio
  # Find user
  # Change role to correct value
  # Save
  ```

**If user shouldn't have access:**
- Explain why: "This feature is only for Babalawos. If you're a Babalawo, contact support."

**Expected resolution time:** 2-5 minutes

**Escalation:** If permissions are configured wrong → Level 2 (backend engineer)

---

### 6. "Upload failed" / "File too large"

**Symptoms:**
- User tries to upload image (profile, product)
- Gets error: "File exceeds 5MB limit" or "Invalid file type"

**Quick checks (1-2 min):**
1. Check file size: Is it actually > 5MB?
2. Check file type: Only JPG, PNG, WebP supported

**If file is too large:**
- User needs to compress image
- Recommend: 2-3 MB max for good UX
- Suggest tool: TinyPNG.com or Squoosh.app

**If file type is wrong:**
- User uploaded PDF, ZIP, or other format
- Only image formats allowed: JPG, PNG, WebP
- Ask user to convert

**If error persists:**
- Check Sentry for S3 errors
- S3 bucket might be full or permissions broken
- **Action:**
  ```bash
  aws s3 ls s3://ilu-ase-uploads/  # Check bucket exists
  aws s3api head-bucket --bucket ilu-ase-uploads  # Check our access
  ```

**Expected resolution time:** 2-3 minutes

**Escalation:** If S3 bucket down or permissions wrong → Level 2 (infrastructure)

---

### 7. "WebSocket disconnect" / Real-time features offline

**Symptoms:**
- Chat messages not appearing in real-time
- Others see user as offline even though they're online
- "Connection lost" message appears

**Quick checks (1-2 min):**
1. Check network: User's internet connection good?
2. Check browser console: Any WebSocket errors?
3. Check Sentry: Any connection errors?

**Common causes:**
- User's network unstable (WiFi dropouts)
- Proxy/firewall blocking WebSocket (corporate network)
- Server WebSocket handler crashed

**If user's network:**
- Advise: Move closer to WiFi, restart router, use mobile data
- Not a support issue — user's connectivity problem

**If server WebSocket issue:**
- Check backend logs:
  ```bash
  pm2 logs ilu-ase-backend | grep -i websocket
  ```
- Look for: "Gateway error", "Connection refused"
- Restart gateway:
  ```bash
  pm2 restart ilu-ase-backend
  ```

**If firewall blocking:**
- Happens on corporate/school networks
- Not something user can easily fix
- Advise: Use VPN or 4G connection

**Expected resolution time:** 2-10 minutes

**Escalation:** If server WebSocket consistently failing → Level 2 (backend engineer)

---

### 8. "Database connection error" / "Timed out"

**Symptoms:**
- User does action (booking, checkout, profile update)
- Getting error: "Database timed out" or "Connection refused"
- All users or specific user?

**Quick checks (1-2 min):**
1. Is it all users or one user?
   - All users: **Server issue**
   - One user: Might be their network
2. Check AWS RDS console:
   - Status should be "Available"
   - Check "Connections" metric — is it at max (100)?

**If RDS shows failed:**
- Failover might be in progress
- **Action:** Wait 5 minutes, application will reconnect
- Monitor CloudWatch alarm notifications

**If connections at max:**
- All connection slots filled (100 max)
- Likely cause: Unclosed connections (connection leak)
- **Action:** Restart backend:
  ```bash
  pm2 restart ilu-ase-backend
  # This closes all stale connections
  ```

**If RDS is fine but connection still timing out:**
- Network/firewall issue
- Check security group: Does EC2 have access to RDS?
- **Action:**
  ```bash
  # From EC2 instance, test connection
  psql -h ilu-ase-prod.xxx.rds.amazonaws.com -U postgres_admin -d ilu_ase -c "SELECT 1;"
  ```

**Expected resolution time:** 5-15 minutes

**Escalation:** If RDS down after 5 min → Level 2/3 (database team)

---

### 9. "Email not received" / Notifications missing

**Symptoms:**
- User registered but didn't get verification email
- Password reset email didn't arrive
- No notification emails (booking confirmation, payment receipt)

**Quick checks (1-2 min):**
1. Check spam folder (very common)
2. Check Sentry for email errors:
   - Filter by "email", "sendgrid", "ses"
3. Check Mailgun/SendGrid dashboard:
   - Was email sent? Check delivery status

**If email shows as delivered:**
- Gmail/Outlook might be filtering it
- Check spam
- Add no-reply@ilu-ase.com to contacts

**If email shows failed:**
- Check error: Domain not verified? Bounce? Rate limited?
- **Action:**
  ```bash
  # Check email configuration in backend
  echo $EMAIL_SERVICE  # Should be SendGrid or AWS SES
  echo $EMAIL_API_KEY  # Should start with SG or be AWS credentials
  ```

**If configuration is wrong:**
- Update `.env` + restart:
  ```bash
  pm2 restart ilu-ase-backend
  ```

**If email service is down:**
- Check SendGrid/AWS SES status page
- Wait for service to recover
- Resend email manually once recovered

**Expected resolution time:** 2-5 minutes

**Escalation:** If email service down → Level 3 (CTO + vendor support)

---

### 10. "Booking/consultation not saved" / Data loss

**Symptoms:**
- User completed booking but it's not showing in consultations list
- Guidance plan was created but disappeared
- Data inconsistency

**Quick checks (1-2 min):**
1. Check Sentry for database/transaction errors
2. Check user dashboard: Does data show up for OTHER users?
3. Check database directly:
   ```bash
   npm run prisma:studio
   # Find user
   # Check consultations/appointments table
   ```

**If data exists in database:**
- UI query issue (filter, pagination bug)
- Check Sentry for query errors
- Clear browser cache + refresh
- Try incognito window

**If data missing from database:**
- Transaction failed midway (no atomic operation)
- Check Sentry: Was there a commit error?
- **Action:** Check database transactions:
  ```bash
  npm run prisma:studio
  # Look for partial records (status=NULL, etc)
  # These indicate failed transaction
  # Contact Level 2 to fix
  ```

**If data inconsistency (different in different places):**
- Cache vs database mismatch
- Clear cache + restart:
  ```bash
  npm run cache:clear  # Clear Redis
  pm2 restart ilu-ase-backend
  ```

**Expected resolution time:** 5-15 minutes

**Escalation:** If transaction logic broken → Level 2 (backend engineer)

---

## 🆘 Escalation Guide

### When to escalate to Level 2 (Backend Team)

- [ ] Database connection issues (after restart)
- [ ] Application crashes (pm2 status shows 0 instances)
- [ ] Webhook not being received (Stripe, email)
- [ ] Data corruption (negative balance, missing records)
- [ ] Performance issues (timeouts on normal operations)
- [ ] Logic errors (payments charged twice, etc)

**How to escalate:**
1. Post in `#ilu-ase-incidents` with:
   - What: Describe the issue
   - When: Exact timestamp
   - Who: User ID or email
   - Error: Any error message from Sentry
   - Steps: How to reproduce

2. Tag `@backend-oncall` and wait for response (SLA: 15 min)

### When to escalate to Level 3 (CTO)

- [ ] Multiple system failures
- [ ] Data loss or corruption
- [ ] Security incident
- [ ] Major outage (>15% users affected)
- [ ] Cannot be resolved by Level 2 in 30 min
- [ ] Production deployment issue

**How to escalate:**
1. Post in `#ilu-ase-incidents` with full context (as above)
2. Tag `@cto` + call phone (emergency number)
3. Provide:
   - Impact: How many users affected?
   - Severity: Revenue impact? Data loss? Security?
   - Duration: How long has it been down?
   - Attempts: What have you tried?

---

## 📱 Monitoring & Alerts

### Dashboards to Watch

**CloudWatch Dashboard** (AWS)
- https://console.aws.amazon.com/cloudwatch
- Watch: CPU, memory, disk, network
- Alert thresholds:
  - CPU > 80% → needs scaling
  - Disk > 85% → cleanup or expand
  - Memory > 90% → might crash

**Sentry Dashboard** (Error Tracking)
- https://sentry.io/organizations/ilu-ase/
- Watch: Error rate, new issues, regression
- Alert threshold:
  - Errors > 10/min → check severity
  - New critical error → investigate immediately

**Status Page** (User-facing)
- https://status.ilu-ase.com
- Update here if any service down
- Users check this first before contacting support

---

## 🔐 Security Incidents

If you suspect a security issue:

1. **Do NOT share user credentials or data publicly**
2. **Immediately:** Post in `#ilu-ase-incidents` (private to team)
3. **Escalate to CTO** immediately
4. Describe what you found (no details in Slack, use DM)
5. Preserve evidence (logs, emails, screenshots)

Example security issues:
- User able to see another user's data
- Payment went to wrong account
- Password reset token leaked
- SQL injection or XSS vulnerability

---

## 📞 Contact Reference

| Role | Name | Email | Phone | Slack | Escalation |
|------|------|-------|-------|-------|---|
| CTO | [Name] | [Email] | [Phone] | @cto | 🔴 Critical |
| Backend Lead | [Name] | [Email] | [Phone] | @backend-oncall | 🟠 Backend |
| DevOps Lead | [Name] | [Email] | [Phone] | @devops | 🟡 Infrastructure |
| Design Lead | [Name] | [Email] | [Phone] | @design | 🟢 UI/UX |
| Product | [Name] | [Email] | [Phone] | @product | 🔵 Product |

---

## 🎯 Support Goals

| Metric | Target | Owner |
|--------|--------|-------|
| First response time | 15 minutes | On-call |
| Issue resolution time (P1) | 1 hour | Team |
| Issue resolution time (P2) | 4 hours | Team |
| Customer satisfaction | > 90% CSAT | Support Lead |
| No data loss | 100% | Backend |

---

**Document Version:** 1.0  
**Created:** February 27, 2026  
**Status:** ⬜ TEAM ASSIGNMENTS PENDING  
**Owner:** [Support Lead]  
**Last Updated:** February 27, 2026
