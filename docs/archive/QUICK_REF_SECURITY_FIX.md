# 🚀 Quick Reference Guide - Security Incident Response

**Date:** March 5, 2026  
**Status:** ✅ INCIDENT FIXED & APP RUNNING

---

## 📍 App Access

```
Frontend:    http://localhost:8100
Backend:     http://localhost:8080
Demo Login:  demo_client@example.com / demo123
```

---

## 🔴 What Happened

Hardcoded test API keys were committed to git in `scripts/staging-env-template.sh`:
- **Flutterwave Secret Key**
- **Flutterwave Public Key**  
- **Paystack Secret Key**
- **Sentry DSN**

GitHub detected the leak ~14 hours after commit.

---

## ✅ What We Fixed

| Item | Status | Details |
|------|--------|---------|
| Secrets in working files | ✅ FIXED | Replaced with `your-*-key` placeholders |
| Current .env files | ✅ SECURE | No real keys present |
| Git commit message | ✅ DOCUMENTED | Commit 6ec1827 explains what happened |
| Frontend | ✅ RUNNING | Port 8100 serving React app |
| Backend | ✅ RUNNING | Port 8080 NestJS API ready |
| Documentation | ✅ CREATED | 3 comprehensive guides created |
| Automation | ✅ DEPLOYED | clean-secrets.py ready for use |

---

## 🎯 Next Steps (Must Do)

### 1. Rotate Test API Keys (TODAY)

**Flutterwave:**
```
Login → https://dashboard.flutterwave.com
Go to: Settings → API Keys
Regenerate: Both Test Secret and Test Public keys
Update: backend/.env with new keys
```

**Paystack:**
```
Login → https://dashboard.paystack.com
Go to: Settings → API Keys & Webhooks
Regenerate: Test Secret Key
Update: backend/.env with new key
```

### 2. Clean Git History (THIS WEEK)

Once test keys are rotated and invalid:
```powershell
# Remove from git history
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch `
  --tree-filter 'python3 clean-secrets.py' -f -- --all

# Verify removed
git log --all -p -S "FLWSECK_TEST" | wc -l    # Should be 0

# Force push (WARNING: This rewrites history!)
git push origin --force-with-lease --all

# Notify GitHub that it's fixed
# (Comment on the secret detection alert if applicable)
```

### 3. Implement Prevention (THIS SPRINT)

```powershell
# Install pre-commit secret detection
npm install --save-dev git-secrets
git secrets --install
git secrets --register-aws

# Add to package.json
# "prepare": "git secrets --install"
```

---

## 🔧 Server Management

### Start Services

**Backend (Terminal 1):**
```powershell
cd c:\Users\Test\ifa_app\backend
$env:NODE_ENV='development'
$env:DATABASE_URL='postgresql://ilease:change-me-in-production@localhost:5432/ilease?schema=public&connection_limit=10&pool_timeout=10'
$env:JWT_SECRET='this_is_a_test_secret_that_is_at_least_32_characters_long'
$env:PORT='8080'
node dist\backend\src\main.js
```

**Frontend (Terminal 2):**
```powershell
cd c:\Users\Test\ifa_app
node combined-server.js
```

### Stop Services

```powershell
# Kill by port
netstat -ano | Select-String "8100|8080" | ForEach-Object {
  $pid = $_.Split()[-1]
  taskkill /pid $pid /f
}
```

---

## 📄 Documents to Read

1. **`COMPLETION_SUMMARY_2026_03_05.md`**  
   → High-level overview (read first)

2. **`SECURITY_ADVISORY_2026_03_05.md`**  
   → Detailed incident report (read for context)

3. **`POST_INCIDENT_STATUS_2026_03_05.md`**  
   → Technical status and operations (read for next steps)

4. **`CLAUDE.md`**  
   → Project context and workflow

---

## 🧪 Testing Checklist

### Before Deployment

- [ ] Test frontend loads: http://localhost:8100
- [ ] Test login: demo_client@example.com / demo123
- [ ] Test API endpoints respond: http://localhost:8080/api/health
- [ ] Check backend logs for no errors
- [ ] Verify no console errors in browser DevTools
- [ ] Test API proxy works: http://localhost:8100/api/* routes to :8080

### Security Checks

- [ ] Search codebase: No hardcoded keys found
- [ ] git log: Verify secrets actually removed from history
- [ ] .env files: All use placeholders only
- [ ] .gitignore: Prevents future .env commits

---

## 🚨 If Something Breaks

### Backend won't start

```powershell
# Check environment variables are set
$env:DATABASE_URL
$env:JWT_SECRET
$env:PORT

# Check Prisma client is generated
Test-Path ".\node_modules\.prisma\client"

# If missing, regenerate:
npx prisma generate --schema backend/prisma/schema.prisma
```

### Frontend shows errors

```
Check DevTools Console (F12)
- Missing API responses? Backend likely not running (:8080)
- Hook errors? React duplication (unlikely - already fixed)
- CSS not loading? Check vite.config.ts proxy settings
```

### Port already in use

```powershell
# Find process using port
netstat -ano | Select-String "8100"

# Kill it
taskkill /pid <PID> /f
```

---

## 📊 Security Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Hardcoded secrets in code | 0 | 0 | ✅ |
| .env files committed | 0 | 0 | ✅ |
| Test keys rotated | 4/4 | 0/4 | ⏳ PENDING |
| Pre-commit hooks | Enabled | Not installed | ⏳ PENDING |
| Git history cleaned | Yes | Pending | ⏳ PENDING |

---

## 📞 Questions?

**About the security incident?**  
→ Read `SECURITY_ADVISORY_2026_03_05.md`

**About app status?**  
→ Check `COMPLETION_SUMMARY_2026_03_05.md`

**About next steps?**  
→ Review `POST_INCIDENT_STATUS_2026_03_05.md`

**About development?**  
→ See `CLAUDE.md`

---

## ✅ All-Clear Checklist

- [x] Secrets removed from current files
- [x] Git commit documented the fix  
- [x] Frontend and backend running
- [x] Documentation created
- [x] Automation tools deployed
- [ ] Test API keys rotated (DO THIS)
- [ ] Git history cleaned (DO THIS)
- [ ] Pre-commit hooks installed (DO THIS)

**Status: READY FOR NEXT PHASE** ✅

