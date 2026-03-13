# 🔐 Security Advisory: Leaked Test API Keys

**Date:** March 5, 2026  
**Severity:** ⚠️ **MEDIUM** (Test keys, not production)  
**Status:** ✅ **FIXED** - Secrets replaced with placeholders

---

## Summary

Test API keys for payment gateways were accidentally committed to git history in:
- **File:** `scripts/staging-env-template.sh`  
- **Commit:** `62a4c9b` (V4-PROD: Production readiness infrastructure)
- **Detection:** GitHub Security Scanning detected the leak 14 hours ago

### Leaked Secrets (NOW REPLACED):

| Service | Leaked Key | Status |
|---------|-----------|--------|
| **Flutterwave** | `FLWSECK_TEST-11bd1fa3353a67e40db1f378b0a3f988-X` | ❌ Exposed in git |
| **Flutterwave** | `FLWPUBK_TEST-99bcb1a9fb478925d01e4890bf4ce62b-X` | ❌ Exposed in git |
| **Paystack** | `sk_test_c91b0866567596588f6b952d491ba10a86b6833a` | ❌ Exposed in git |
| **Flutterwave** | `FLWSECK_TEST5f1659c16c15` (hash) | ❌ Exposed in git |

---

## Actions Taken ✅

1. **Replaced secrets with placeholders**
   - Commit: `6ec1827` on 2026-03-05
   - File: `scripts/staging-env-template.sh` now uses placeholder values only
   - Placeholders: `your-flutterwave-secret-key`, `your-paystack-secret-key`, etc.

2. **Updated git history**
   - Current commit pushed to `origin/ifaapp`
   - Staging template now safe for sharing

---

## Actions Required - DO THIS NOW ⚠️

### 1. **Rotate Test API Keys** (HIGH PRIORITY)

**Flutterwave:**
- Login to: https://dashboard.flutterwave.com
- Navigate: **Settings** → **API Keys**
- Rotate/regenerate both **Test Public Key** and **Test Secret Key**
- Update backend `.env` with new keys

**Paystack:**
- Login to: https://dashboard.paystack.com
- Navigate: **Settings** → **API Keys & Webhooks**
- Rotate **Test Secret Key**
- Update backend `.env` with new key

### 2. **Update Local Environment Files**

```bash
# backend/.env
FLUTTERWAVE_PUBLIC_KEY=<NEW_TEST_PUBLIC_KEY>
FLUTTERWAVE_SECRET_KEY=<NEW_TEST_SECRET_KEY>
PAYSTACK_SECRET_KEY=<NEW_TEST_SECRET_KEY>
```

### 3. **Invalidate Old Keys (If Not Already Rotated)**

If the payment processors show these keys are still active:
- Flutterwave: Disable old test keys from dashboard
- Paystack: Disable old test keys from dashboard

### 4. **Clean Git History (OPTIONAL - If Needed)**

If you need to completely remove secrets from git history:

```bash
# Option A: Use git filter-repo (recommended)
git clone --mirror https://github.com/MoyoOni/ifaapp.git
cd ifaapp.git
git filter-repo --path scripts/staging-env-template.sh
cd ..
git push --mirror https://github.com/MoyoOni/ifaapp.git

# Option B: Contact GitHub support
# GitHub can help invalidate cached secrets
```

---

## Best Practices to Prevent This

1. **Never commit `.env` files or templates with real secrets**
   - Use `.env.example` with placeholder values only
   - Gitignore all `.env*` files except `.env.example`

2. **Use environment variables for secrets**
   ```bash
   # ✅ GOOD
   PAYSTACK_KEY=${PAYSTACK_SECRET_KEY}
   
   # ❌ BAD
   PAYSTACK_KEY=sk_test_123abc...
   ```

3. **Pre-commit hooks to catch secrets**
   ```bash
   npm install --save-dev pretty-quick
   npm install --save-dev git-secrets
   git secrets --install
   git secrets --register-aws
   ```

4. **Code review checklist**
   - Never review `.env` files with real secrets
   - Require `.env.example` for documentation
   - Use vault/secret management tools

---

## Summary

| Item | Status |
|------|--------|
| **Leaks Found** | ✅ Replaced with placeholders |
| **Current Risk** | ✅ Low (placeholders now in repo) |
| **Git History** | ⚠️ Still contains old secrets (can be cleaned) |
| **Keys Rotated** | 🔴 **ACTION REQUIRED** |
| **Documentation** | ✅ Created (this file) |

---

## References

- GitHub Secret Scanning: https://github.com/settings/security-analysis
- Payment Provider Security:
  - Flutterwave: https://developer.flutterwave.com/docs/security/
  - Paystack: https://paystack.com/docs/security/
- Git Security: https://git-scm.com/docs/gitignore

**Questions?** Check `.env.example` files for the correct format to use for environment variables.
