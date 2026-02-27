# ✅ V5_PERSONAL_TODO.md

**You:** Solo founder + AI agent  
**Updates:** Daily (update as you go)  
**Format:** Simple checkbox list

---

## 🚨 BLOCKERS (What's in Your Way Right Now)

- [ ] AWS account not created
- [ ] AWS IAM user not set up
- [ ] EC2 instance not deployed
- [ ] RDS database not created
- [ ] Redis cache not created
- [ ] Code not deployed to staging
- [ ] Stripe test account not created

**FIX THESE FIRST.** Everything else comes after.

---

## WEEK 1 (Feb 27 - Mar 3): GET SOMETHING RUNNING

### Thursday Feb 27 (Today - 2 hours)
- [ ] Review V5_SOLO_DEPLOYMENT_PLAN.md (30 min)
- [ ] Create AWS account at aws.amazon.com (30 min)
- [ ] Enable billing alerts (15 min)
- [ ] Set up IAM user for yourself (45 min)
- [ ] Save access key + secret key to password manager

**Done when:** You have AWS credentials saved and working locally

**AI helps:** Answer "how do I do X in AWS?"

---

### Friday Feb 28 (1 day - 4 hours)
- [ ] Create VPC for staging (30 min)
- [ ] Create security groups (allow port 5432, 6379, 3000, 22, 80, 443) (45 min)
- [ ] Create RDS PostgreSQL instance db.t3.small (1 hour)
  - Database name: `ilu_ase_staging`
  - Master username: `postgres_admin`
  - Master password: [generate random 32-char]
  - Save password to password manager
- [ ] Wait for RDS to be ready (10 min reading time)

**Done when:** RDS shows "Available" status in AWS console

**AI helps:** AWS CLI commands, troubleshooting

---

### Saturday Mar 1 (1 day - 4 hours)
- [ ] Create ElastiCache Redis cache.t3.small (1 hour)
  - Name: `ilu-ase-staging`
  - Save endpoint to password manager
- [ ] Create EC2 instance Ubuntu 24.04 LTS t3.small (1 hour)
  - Create key pair, save .pem file
  - Assign to same VPC as RDS
  - Attach security group
- [ ] Wait for EC2 to be running (5 min)
- [ ] SSH into EC2, verify it works (15 min)
  - `ssh -i your-key.pem ubuntu@<public-ip>`
  - You should see Ubuntu prompt

**Done when:** You're logged into EC2 and can type commands

**AI helps:** SSH commands, EC2 setup

---

### Sunday Mar 2 (1 day - 3 hours)
- [ ] SSH into EC2
- [ ] Install Node.js 20 (30 min)
  ```
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  node --version
  ```
- [ ] Clone your GitHub repo (15 min)
  ```
  git clone https://github.com/MoyoOni/ifa_app.git
  cd ifa_app
  ```
- [ ] Install dependencies (15 min)
  ```
  npm install
  cd backend && npm install && cd ..
  cd frontend && npm install && cd ..
  ```
- [ ] Create backend .env file (30 min)
  - DATABASE_URL with RDS endpoint
  - REDIS_URL with Redis endpoint
  - JWT_SECRET (generate random)
- [ ] Run database migrations (30 min)
  ```
  cd backend
  npm run prisma:migrate:deploy
  npm run prisma:seed  # Load demo data
  ```

**Done when:** `npm run build` works in both backend and frontend (0 errors)

**AI helps:** Troubleshooting build errors

---

### Monday Mar 3 (1 day - 2 hours)
- [ ] Start backend with PM2 (30 min)
  ```
  npm install -g pm2
  pm2 start backend/dist/main.js --name "backend"
  pm2 save
  pm2 startup
  ```
- [ ] Start frontend with `npm run preview` (30 min)
- [ ] Test health endpoint (15 min)
  ```
  curl http://localhost:3000/health
  ```
- [ ] Set up basic domain/DNS (1 hour - or skip for now, use IP)
  - Or just access via IP: `http://<ec2-public-ip>:3000`

**Done when:** You can open a browser and see the app loading at `http://<ec2-public-ip>:3000`

**AI helps:** Apps won't start? Killing processes? Debugging startup errors?

---

**WEEK 1 TOTAL: ~16 hours spread over 5 days**

**By end of Week 1:** Staging app is RUNNING. It works. Demo data loads. You can log in. ✅

---

## WEEK 2 (Mar 4-10): TEST & FIX BUGS

### Test What You Have (2 hours)
- [ ] Create test user account (15 min)
- [ ] Try to log in (5 min)
- [ ] Browse dashboard (10 min)
- [ ] Try a booking (10 min)
- [ ] Try marketplace (10 min)
- [ ] Check logs for errors (10 min)

**Find bugs?** Document them in V5_BUGS.md (see template below)

---

### Fix Critical Bugs (Variable - 0-4 hours)
- [ ] Follow V5_BUGS.md process
- [ ] Use AI to help debug
- [ ] Test fix
- [ ] Deploy fix to staging

---

### Security Audit - Abbreviated (4 hours)
Do these 3 critical checks ONLY (not all 20):
- [ ] V5_SECURITY_AUDIT_CHECKLIST.md → A01 (Broken Access Control)
  - Can you access admin panel without being admin? NO = pass
  - Can you see other users' data? NO = pass
- [ ] A02 (Cryptographic Failures)
  - Is password hashed? YES = pass
  - Are secrets in environment? YES = pass
- [ ] A07 (Authentication)
  - Login works? YES = pass
  - Rate limiting on password? YES = pass

**Skip the other 17 for now.** Do them after launch.

---

**WEEK 2 TOTAL: ~6 hours**

**By end of Week 2:** Staging is tested, critical bugs fixed, basic security checked. ✅

---

## WEEK 3 (Mar 11-17): STRIPE + FINAL TEST

### Stripe Test Account (2 hours)
See V5_STRIPE_SETUP_INSTRUCTIONS.md:
- [ ] Create Stripe account (30 min)
- [ ] Get test API keys (15 min)
- [ ] Add to backend .env (15 min)
- [ ] Register webhook endpoint (30 min)
- [ ] Test payment with card 4242 4242 4242 4242 (15 min)

**Done when:** Payment goes through in staging app, webhook is received

---

### Full End-to-End Test (3 hours)
- [ ] User registration → login → dashboard → booking → payment → confirmation
- [ ] Test refund flow (money comes back)
- [ ] Test error scenarios (invalid card, timeout, etc.)

**Find bugs?** Fix them (1-4 hours)

---

### Monitoring Setup - Minimal (2 hours)
- [ ] Create Sentry account (30 min)
- [ ] Add Sentry to backend + frontend (1 hour)
- [ ] Test: Cause an error, verify it hits Sentry (30 min)

**That's it for monitoring. Advanced dashboards later.**

---

**WEEK 3 TOTAL: ~7 hours**

**By end of Week 3:** Payments work, monitoring is live, everything tested in staging. ✅

---

## WEEK 4 (Mar 18-24): PRODUCTION PREP

### Production Infrastructure (3 hours)
- [ ] Create production RDS (db.r5.large) (1 hour)
- [ ] Create production Redis cluster (1 hour)
- [ ] Create production EC2 instances (2-3) (1 hour)
- [ ] Set up SSH access to production

**Tip:** Use same commands as staging, just change instance sizes

---

### Production Stripe Account (2 hours)
See V5_STRIPE_SETUP_INSTRUCTIONS.md Phase 3:
- [ ] Create Stripe LIVE account (1 hour)
- [ ] Get LIVE API keys (15 min)
- [ ] Register production webhook (15 min)

**Don't test with real money yet.** Keys just need to be ready.

---

### Pre-Launch Checklist (2 hours)
Check V5_PHASE_1_EXECUTION_STATUS.md → see final sign-off section:
- [ ] Backend builds with 0 errors
- [ ] Frontend builds with 0 errors
- [ ] Tests pass (9/9 wallet tests minimum)
- [ ] No secrets in git
- [ ] Environment variables documented
- [ ] Database backups configured
- [ ] Monitoring + Sentry working
- [ ] Support guide (V5_SUPPORT_TROUBLESHOOTING_GUIDE.md) reviewed

---

**WEEK 4 TOTAL: ~7 hours**

**By end of Week 4:** Production infrastructure ready, Stripe live account created. ✅

---

## WEEK 5 (Mar 25-31): LAUNCH PREP + LAUNCH

### Production Deployment (2 hours)
- [ ] Deploy code to production servers
- [ ] Run database migrations
- [ ] Start PM2 on all servers
- [ ] Verify health checks

**AI helps:** Scripting, troubleshooting deployment issues

---

### Final Testing (2 hours)
- [ ] Test user registration (staging → production)
- [ ] Test login
- [ ] Test payment with small amount ($1 or ₦500)
- [ ] Verify Sentry is logging errors
- [ ] Check all pages load

**Find issues?** Fix them before going live

---

### Launch Day (Apr 1 - 2 hours)
- [ ] Send launch announcement email
- [ ] Monitor error rate (should be <1%)
- [ ] Monitor response times (should be <500ms)
- [ ] Be on standby for user issues

**That's it. You're live.**

---

**WEEK 5 TOTAL: ~4 hours**

**By Apr 1:** LIVE. Accepting users. Receiving payments. ✅

---

## 🎯 TOTAL TIME ESTIMATE

| Phase | Hours | Days Spread |
|-------|-------|-------------|
| Week 1: Get running | 16 | 5 days |
| Week 2: Test + fix | 6 | 7 days |
| Week 3: Stripe + test | 7 | 7 days |
| Week 4: Production prep | 7 | 7 days |
| Week 5: Launch | 4 | 7 days |
| **TOTAL** | **40 hours** | **33 days** |

**That's ~1.2 hours per day on average.**

You can do this solo while working on bug fixes, customer support, etc.

---

## 🆘 IF YOU GET STUCK

**Can't deploy?**
- [ ] Ask AI: "Why won't my backend start?"
- [ ] Check logs: `pm2 logs backend --lines 50`
- [ ] Common: Missing environment variable or database connection

**Database migration fails?**
- [ ] Check error message
- [ ] Ask AI: "How do I fix this Prisma error?"
- [ ] Might need to reset database and re-seed

**Stripe payment not working?**
- [ ] Check Sentry for errors
- [ ] Verify API keys are correct
- [ ] Check backend console for webhook issues

**App is slow?**
- [ ] Check CPU/memory on EC2 (AWS console)
- [ ] May need to increase instance size (happens later)
- [ ] For now, note it and move on

**Can't figure it out?**
- Write down the exact error
- Ask AI with the full error message
- Together you'll debug it

---

## ✅ DAILY RITUAL

**Every morning:**
```
1. What's my goal TODAY?
   (Pick 1-2 items from todo)
   
2. Ask AI: "How do I..."
   (Get clear step-by-step)
   
3. Do it
   (Follow the steps, note any issues)
   
4. Test it
   (Does it work?)
   
5. Commit to git
   (git add -A; git commit -m "description")
   
6. Mark off todo
   (✅ Done)
```

**That's the whole routine. Repeat daily until Apr 1.**

---

## 📊 PROGRESS TRACKING

Update this as you go:

### Week 1 (_ / 7 items done)
- [ ] AWS account created
- [ ] IAM user set up
- [ ] RDS instance running
- [ ] Redis instance running
- [ ] EC2 instance running
- [ ] Code deployed to staging
- [ ] App loads in browser

### Week 2 (_ / 4 items done)
- [ ] Logged in as user
- [ ] Browsed all pages
- [ ] Fixed critical bugs
- [ ] Security checks passed

### Week 3 (_ / 3 items done)
- [ ] Stripe test working
- [ ] Payment flow tested
- [ ] Sentry configured

### Week 4 (_ / 3 items done)
- [ ] Production infrastructure ready
- [ ] Stripe LIVE account ready
- [ ] Final checklist signed off

### Week 5 (_ / 3 items done)
- [ ] Code deployed to production
- [ ] Final testing passed
- [ ] 🚀 LIVE

---

**Document Version:** 1.0  
**Created:** February 27, 2026  
**Status:** 🟢 START WITH THIS ONE  
**Owner:** You (solo founder)  
**Last Updated:** February 27, 2026
