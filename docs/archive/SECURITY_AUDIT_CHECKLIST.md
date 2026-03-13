# 🔒 OWASP Top 10 Security Audit Checklist

**Phase 1 Task:** Track D-1 (Security Lead)  
**Deadline:** Mar 8, 2026  
**Purpose:** Verify Ilu Àṣẹ platform meets OWASP Top 10 security standards before launch

---

## How to Use This Checklist

1. **Read each OWASP item** (A01-A10)
2. **Run the verification steps** (code review, tests, commands)
3. **Document findings:**
   - ✅ = PASS (no issues)
   - ⚠️ = WARNING (minor issue, document workaround)
   - ❌ = FAIL (critical issue, must fix before launch)
4. **Sign off** when all items are ✅ or ⚠️ (with mitigations)

---

## Results Summary

| # | OWASP Top 10 | Status | Owner | Verified Date |
|---|--------------|--------|-------|---|
| A01 | Broken Access Control | ⬜ TODO | [Security Lead] | [DATE] |
| A02 | Cryptographic Failures | ⬜ TODO | [Security Lead] | [DATE] |
| A03 | Injection | ⬜ TODO | [Security Lead] | [DATE] |
| A04 | Insecure Design | ⬜ TODO | [Security Lead] | [DATE] |
| A05 | Security Misconfiguration | ⬜ TODO | [Security Lead] | [DATE] |
| A06 | Vulnerable & Outdated Components | ⬜ TODO | [Security Lead] | [DATE] |
| A07 | Authentication & Session Management | ⬜ TODO | [Security Lead] | [DATE] |
| A08 | Software & Data Integrity | ⬜ TODO | [Security Lead] | [DATE] |
| A09 | Logging & Monitoring | ⬜ TODO | [Security Lead] | [DATE] |
| A10 | SSRF/Unvalidated Redirects | ⬜ TODO | [Security Lead] | [DATE] |

---

---

## **A01: Broken Access Control**

> **Risk:** Users access resources they shouldn't (unauthorized data access, privilege escalation)

### A01-1: Verify all protected routes require authentication

**Check:** Every POST/PUT/DELETE endpoint checks for valid JWT token

**Steps:**
1. Open `backend/src/main.ts` (middleware setup)
2. Verify `JwtGuard` is applied to protected routes
3. Check `@UseGuards(JwtGuard)` on all API endpoints that modify data

**Test:**
```bash
# Try accessing protected endpoint WITHOUT auth header
curl -X GET https://staging.ilu-ase.com/api/users/me
# Expected: 401 Unauthorized

# Try WITH auth header
curl -X GET \
  -H "Authorization: Bearer VALID_TOKEN" \
  https://staging.ilu-ase.com/api/users/me
# Expected: 200 OK + user data
```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

### A01-2: Verify role-based access control (RBAC)

**Check:** Users can only access resources for their role (client, babalawo, vendor, admin)

**Steps:**
1. Open `backend/src/auth/roles.guard.ts`
2. Verify `@Roles(UserRole.CLIENT)` guards client-only endpoints
3. Check admin endpoints require `UserRole.ADMIN`

**Test:**
```bash
# Try accessing admin endpoint as client
curl -X POST \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  https://staging.ilu-ase.com/api/admin/users/verify
# Expected: 403 Forbidden

# Try as admin
curl -X POST \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  https://staging.ilu-ase.com/api/admin/users/verify
# Expected: 200 OK
```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

### A01-3: Verify no user can access another user's data

**Check:** User A cannot view/modify User B's profile, wallet, or orders

**Test:**
```typescript
// Example: User A tries to view User B's profile
GET /api/users/user-b-id
Authorization: Bearer token-from-user-a
// Expected: 403 Forbidden or different user's public profile only
```

**Steps:**
1. Open `backend/src/users/users.controller.ts`
2. Verify profile endpoint checks `req.user.id === params.userId`
3. Check wallet endpoint only returns own wallet

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

## **A02: Cryptographic Failures**

> **Risk:** Sensitive data exposed in transit or storage (passwords, tokens, API keys)

### A02-1: Verify passwords hashed with bcrypt 12+ rounds

**Check:** Passwords are never stored in plaintext

**Steps:**
1. Open `backend/src/auth/auth.service.ts`
2. Find password hashing code
3. Verify bcrypt is used with `rounds >= 12`

**Code should look like:**
```typescript
const hashedPassword = await bcrypt.hash(password, 12);
// 12 = number of rounds (higher = more secure, slower)
```

**Test:**
```bash
# Check bcrypt package is installed
cd backend && npm list bcrypt
# Should show: bcrypt@^5.x.x or similar

# Check package.json
cat package.json | grep bcrypt
```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Bcrypt rounds: [12+? YES/NO]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

### A02-2: Verify JWT_SECRET is 32+ characters and not leaked

**Check:** JWT secret is stored securely, not hardcoded

**Steps:**
1. Search codebase for hardcoded JWT_SECRET:
   ```bash
   grep -r "JWT_SECRET" backend/src --include="*.ts"
   ```
2. Verify it only appears in `.env.example` and middleware (as env var reference)
3. Check git history for accidental commits:
   ```bash
   git log -p | grep -i "secret"
   ```

**Expected:**
- ✅ JWT_SECRET only in `.env` files (not committed)
- ✅ In code, referenced as `process.env.JWT_SECRET`
- ✅ Length check: `JWT_SECRET.length >= 32`

**Test:**
```bash
# Check JWT_SECRET in production would be enforced
# Look for validation in main.ts:
grep -A5 "JWT_SECRET" backend/src/main.ts
# Should show: if(!process.env.JWT_SECRET) throw Error
```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- JWT_SECRET hardcoded? [NO]
- JWT_SECRET length: [32+ chars? YES/NO]
- In git history? [NO = GOOD]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

### A02-3: Verify all API communication uses HTTPS

**Check:** No sensitive data transmitted over HTTP

**Steps:**
1. Check Nginx config:
   ```bash
   grep -n "listen" backend/nginx.conf
   # Should show: listen 443 ssl
   ```
2. Check redirect HTTP → HTTPS:
   ```bash
   curl -I http://staging.ilu-ase.com
   # Should see: 301 or 307 redirect to https://
   ```

**Test:**
```bash
# HTTPS should work
curl https://staging.ilu-ase.com/api/health
# Expected: 200 OK

# HTTP should redirect
curl -I http://staging.ilu-ase.com
# Expected: 301 Moved Permanently → https://
```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- HTTPS working? [YES/NO]
- HTTP → HTTPS redirect? [YES/NO]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

## **A03: Injection**

> **Risk:** SQL injection, NoSQL injection, command injection

### A03-1: Verify Prisma ORM used (prevents SQL injection)

**Check:** No raw SQL queries, only Prisma client calls

**Steps:**
1. Search for raw SQL:
   ```bash
   grep -r "query(" backend/src --include="*.ts"
   grep -r "raw\|execute" backend/src --include="*.ts"
   grep -r "sql\`" backend/src --include="*.ts"
   ```
2. Verify all database calls use Prisma:
   ```bash
   grep -r "prisma\." backend/src --include="*.ts" | head -20
   ```

**Expected:**
- ❌ NO raw SQL queries
- ✅ ALL queries use `this.prisma.tableName.method()`

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Raw SQL found? [NO = GOOD]
- Using Prisma? [YES]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

### A03-2: Run dependency vulnerability scan

**Check:** No known vulnerabilities in npm packages

**Steps:**
```bash
cd backend && npm audit --audit-level=moderate
cd ../frontend && npm audit --audit-level=moderate
```

**Expected output:**
```
0 vulnerabilities
```

**If vulnerabilities found:**
- Critical = ❌ FAIL (must fix)
- High = ⚠️ WARNING (prioritize, plan fix)
- Moderate/Low = note it

**To fix:**
```bash
npm audit fix
npm audit fix --force  # if needed
```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Vulnerabilities found: [0 / COUNT]
- Critical? [NO]
- High? [NO / [LIST]]
- Fixed? [YES/NO]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

## **A04: Insecure Design**

> **Risk:** Missing business logic controls (e.g., double-charging, invalid state transitions)

### A04-1: Verify idempotency keys prevent double-charging

**Check:** Payment API uses idempotency keys to prevent duplicate charges

**Steps:**
1. Open `backend/src/wallet/wallet.service.ts`
2. Verify `depositFunds()` checks for existing transaction by idempotencyKey:
   ```typescript
   const existing = await this.db.transaction.findUnique({
     where: { idempotencyKey: idempotencyKey }
   });
   if (existing) return existing; // Don't charge twice
   ```
3. Check schema: `Transaction.idempotencyKey` has `@unique` constraint

**Test:** (Already done in V4-802, but re-verify)
```bash
cd backend && npm run test:integration -- --testPathPattern="wallet"
# Should show: 9/9 tests passing
# Including: AC-2, AC-4 (idempotency key deduplication)
```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Idempotency keys implemented? [YES/NO]
- Tests passing? [9/9]
- Unique index on idempotencyKey? [YES/NO]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

### A04-2: Verify wallet transactions are atomic

**Check:** Deposits/withdrawals use database transactions (all-or-nothing)

**Steps:**
1. Open `backend/src/wallet/wallet.service.ts`
2. Verify `$transaction()` wraps deposit logic:
   ```typescript
   await this.prisma.$transaction(async (tx) => {
     // Create transaction
     const txn = await tx.transaction.create({...});
     // Update wallet balance
     await tx.wallet.update({...});
     // If anything fails, ENTIRE transaction rolls back
   });
   ```

**Test:**
```bash
# Already tested in V4-801 integration tests
npm run test:integration -- --testPathPattern="wallet"
# Should include: "AC-1: Atomic wallet deposit creation"
```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Using prisma.$transaction? [YES/NO]
- Tests pass? [YES/NO]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

## **A05: Security Misconfiguration**

> **Risk:** Default configs, unnecessary features enabled, hardcoded secrets

### A05-1: Verify no hardcoded secrets in .env files

**Check:** Secrets stored in vault, not committed to git

**Steps:**
```bash
# Check if .env files are in git
git log --full-history -- ".env" | head -20
git log --full-history -- ".env.local" | head -20

# Check if .env is in .gitignore
cat .gitignore | grep "\.env"
# Should show: .env, .env.local, .env.*.local

# Check what secrets are in vault vs git
cat backend/.env.example
# Should list all required vars, but NO values should be committed
```

**Expected:**
- ✅ `.env` files in `.gitignore`
- ✅ No `.env` files committed to git
- ✅ `.env.example` has placeholders only
- ✅ All secrets in vault (AWS Secrets Manager, HashiCorp, etc.)

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- .env in .gitignore? [YES/NO]
- .env files committed? [NO = GOOD]
- Secrets in git history? [grep results]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

### A05-2: Verify security headers enabled (Helmet.js)

**Check:** Response headers protect against common attacks

**Steps:**
1. Check if Helmet is installed:
   ```bash
   npm list @nestjs/helmet
   ```
2. Check if Helmet is used in `main.ts`:
   ```bash
   grep -n "helmet" backend/src/main.ts
   # Should show: app.use(helmet());
   ```
3. Test the headers:
   ```bash
   curl -I https://staging.ilu-ase.com
   # Should show headers like:
   #   Strict-Transport-Security: max-age=31536000
   #   X-Content-Type-Options: nosniff
   #   X-Frame-Options: DENY
   #   Content-Security-Policy: ...
   ```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Helmet installed? [YES/NO]
- Helmet enabled in main.ts? [YES/NO]
- Security headers present? [YES/NO]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

## **A06: Vulnerable & Outdated Components**

> **Risk:** Using old versions of dependencies with known security bugs

### A06-1: Update all dependencies

**Steps:**
```bash
# Check for outdated packages
cd backend && npm outdated
cd ../frontend && npm outdated

# Update minor + patch versions (safe)
npm update

# For major versions, review changes first
npm list [package-name]
# Then: npm install [package-name]@latest
```

**Expected:**
- All packages up-to-date (or with documented exceptions)
- Node.js 20.18.0 or later

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Outdated packages found? [NONE / LIST]
- Node.js version: [20.18.0+?]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

### A06-2: Verify no deprecated packages

**Check:** No packages with known security issues

**Steps:**
```bash
# npm audit already checks this
npm audit

# Also check deprecation warnings during install
npm install 2>&1 | grep deprecat
```

**Expected:**
- ✅ 0 vulnerabilities
- ✅ 0 deprecated packages (or documented and acceptable)

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Vulnerabilities: [0]
- Deprecated packages: [LIST]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

## **A07: Authentication & Session Management**

> **Risk:** Weak passwords, session hijacking, credential stuffing

### A07-1: Verify JWT validation on all protected endpoints

**Check:** Every request to protected endpoint validates JWT signature and expiration

**Steps:**
1. Open `backend/src/auth/jwt.strategy.ts`
2. Verify:
   ```typescript
   const payload = this.jwtService.verify(token);
   // Throws if:
   //   - Signature invalid
   //   - Token expired
   //   - Token malformed
   ```
3. Test with invalid token:
   ```bash
   curl -X GET \
     -H "Authorization: Bearer INVALID_TOKEN" \
     https://staging.ilu-ase.com/api/users/me
   # Expected: 401 Unauthorized
   ```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- JWT validation implemented? [YES/NO]
- Test with invalid token? [401 = GOOD]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

### A07-2: Verify rate limiting on auth endpoints

**Check:** Brute force attacks throttled

**Steps:**
1. Check if rate limiting middleware installed:
   ```bash
   npm list @nestjs/throttler
   ```
2. Verify rate limits configured in `auth.controller.ts`:
   ```typescript
   @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 per minute
   async login(@Body() credentials) { ... }
   ```
3. Test rate limiting:
   ```bash
   # Try 6 login attempts in 60 seconds
   for i in {1..6}; do
     curl -X POST https://staging.ilu-ase.com/api/auth/login \
       -d '{"email":"test@example.com","password":"wrong"}'
     sleep 5
   done
   # Expected: 6th request gets 429 Too Many Requests
   ```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Rate limiting installed? [YES/NO]
- Limits configured? [5 attempts/min]
- Test passes (429 on 6th attempt)? [YES/NO]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

## **A08: Software & Data Integrity**

> **Risk:** Unauthorized code changes, tampered dependencies

### A08-1: Verify CI/CD pipeline requires signed commits

**Check:** Only authorized code can be deployed

**Steps:**
```bash
# Check if commit signing required
git log --pretty=format:"%G? %s" | head -10
# Should show 'G' (good signature) for recent commits

# Check GitPub signing enabled
git config commit.gpgsign
# Should output: true
```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Commit signing enabled? [YES/NO]
- Recent commits signed? [YES/NO]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

## **A09: Logging & Monitoring**

> **Risk:** Security incidents not detected, no audit trail

### A09-1: Verify Sentry error tracking configured

**Check:** All errors captured and logged

**Steps:**
1. Check Sentry initialized in `main.ts`:
   ```bash
   grep -n "Sentry\|initSentry" backend/src/main.ts
   # Should show: initSentry() or similar
   ```
2. Test Sentry integration:
   ```bash
   # Trigger intentional error in production code
   curl -X GET https://staging.ilu-ase.com/api/test-error
   
   # Check Sentry dashboard
   # Should see error appear within 30 seconds
   ```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Sentry initialized? [YES/NO]
- Test error captured? [YES/NO]
- DSN configured? [YES/NO]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

### A09-2: Verify structured logging with trace IDs

**Check:** All logs include trace ID for debugging

**Steps:**
1. Check logging middleware in `main.ts`:
   ```bash
   grep -n "TraceId\|trace\|logger" backend/src/main.ts
   ```
2. Check logs format:
   ```bash
   # Logs should be JSON with trace ID
   tail -20 backend/logs/app.log | jq '.traceId'
   ```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Logging middleware installed? [YES/NO]
- Trace IDs in logs? [YES/NO]
- JSON format? [YES/NO]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

## **A10: SSRF & Unvalidated Redirects**

> **Risk:** Attacker tricks app into accessing internal resources or redirecting to malicious site

### A10-1: Verify no open redirects

**Check:** Redirect endpoints validate target URL

**Steps:**
1. Search for redirect logic:
   ```bash
   grep -r "redirect\|window.location" backend/src frontend/src --include="*.ts"
   ```
2. Check validation:
   ```typescript
   // Good: whitelist allowed redirect targets
   const allowedHosts = ['ilu-ase.com', 'localhost'];
   if (!allowedHosts.includes(new URL(redirectTo).hostname)) {
     throw new BadRequestException('Invalid redirect');
   }
   res.redirect(redirectTo);
   ```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- Open redirects found? [NO = GOOD]
- Redirects validated? [YES/NO]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

### A10-2: Verify CORS restricts outbound requests

**Check:** App can't be tricked into accessing internal resources

**Steps:**
1. Check CORS config:
   ```bash
   grep -A5 "cors\|CorsOptions" backend/src/main.ts
   ```
2. Verify:
   ```typescript
   cors({
     origin: process.env.FRONTEND_URL, // NOT '*'
     credentials: true
   })
   ```

**Result:** ⬜ TODO
- Status: [✅ PASS / ⚠️ WARNING / ❌ FAIL]
- CORS restricted? [NOT '*']
- FRONTEND_URL only? [YES/NO]
- Notes: [ADD FINDINGS]
- Date verified: [DATE]

---

---

## 📊 FINAL SECURITY AUDIT SIGN-OFF

### Summary Table

| OWASP Item | Status | Verified By | Date | Notes |
|------------|--------|-------------|------|-------|
| A01: Broken Access Control | [✅/⚠️/❌] | [NAME] | [DATE] | [NOTES] |
| A02: Cryptographic Failures | [✅/⚠️/❌] | [NAME] | [DATE] | [NOTES] |
| A03: Injection | [✅/⚠️/❌] | [NAME] | [DATE] | [NOTES] |
| A04: Insecure Design | [✅/⚠️/❌] | [NAME] | [DATE] | [NOTES] |
| A05: Security Misconfiguration | [✅/⚠️/❌] | [NAME] | [DATE] | [NOTES] |
| A06: Vulnerable Components | [✅/⚠️/❌] | [NAME] | [DATE] | [NOTES] |
| A07: Authentication | [✅/⚠️/❌] | [NAME] | [DATE] | [NOTES] |
| A08: Data Integrity | [✅/⚠️/❌] | [NAME] | [DATE] | [NOTES] |
| A09: Logging & Monitoring | [✅/⚠️/❌] | [NAME] | [DATE] | [NOTES] |
| A10: SSRF & Redirects | [✅/⚠️/❌] | [NAME] | [DATE] | [NOTES] |

### Critical Issues Found

```
[LIST ANY ❌ FAILURES HERE]
[FOR EACH: description + action plan + owner + deadline]
```

### Warnings / Exceptions

```
[LIST ANY ⚠️ WARNINGS HERE]
[FOR EACH: description + mitigation + accepted by: [NAME]]
```

### Overall Assessment

- **Total Checks:** 20
- **Passing (✅):** [##]
- **Warnings (⚠️):** [##] (with mitigations)
- **Failures (❌):** [##] (MUST FIX before launch)

### Sign-Off

**This security audit is:** [ ] COMPLETE AND APPROVED [ ] IN PROGRESS [ ] BLOCKED

**Audited by:** [NAME] (Security Lead)  
**Date:** [DATE]

**Approval signatures:**
- [ ] Security Lead: ________________________ Date: _______
- [ ] CTO: ________________________ Date: _______
- [ ] Backend Lead: ________________________ Date: _______

---

**Document Version:** 1.0  
**Created:** February 27, 2026  
**Status:** ⬜ READY TO EXECUTE  
**Deadline:** March 8, 2026
