# 📋 V5 Launch Backlog — From Code-Ready to Production Live

## Target: April 1, 2026 Launch 🚀

> **Status:** V4 (Sprint 8) production hardening COMPLETE. Code ready for staging deployment.
> 
> **Current State:** 24/27 SP complete. All code-level production hardening done. Infrastructure and operational readiness TBD.
> 
> **Timeline:** Feb 26 - Apr 1 (34 days, 5 phases)
> 
> **Deployment Readiness:** 71% overall (Code 95% ✅, Docs 95% ✅, Infrastructure 40% 🟡, Team 50% 🟡)

---

## 📖 How to Read This Document

- Each **PHASE** is a time-boxed chunk of launch work (Feb 26 → Apr 1)
- Each phase has **PARALLEL TRACKS** (work that can happen simultaneously) or **SEQUENTIAL STEPS** (work that depends on previous completion)
- Each track/step has **TASKS** (the actual work to do)
- Status indicators:
  - ⬜ = **READY** — Not started, ready to pick up
  - 🔵 = **IN PROGRESS** — Someone is working on it
  - ✅ = **DONE** — Completed and verified
  - 🟡 = **BLOCKED** — Waiting on something
  - 🚀 = **PENDING LAUNCH** — Ready but not yet executed

---

## 🎯 Overall Progress Dashboard

```
PHASE 1: Setup (Feb 26 - Mar 8)          ⬜ ████░░░░░░░░░░░░░░░  0/40 tasks
PHASE 2: Staging (Mar 8 - Mar 15)        ⬜ ░░░░░░░░░░░░░░░░░░░  0/25 tasks
PHASE 3: Production (Mar 15 - Mar 28)    ⬜ ░░░░░░░░░░░░░░░░░░░  0/30 tasks
PHASE 4: Verification (Mar 22 - Mar 31)  ⬜ ░░░░░░░░░░░░░░░░░░░  0/10 tasks
PHASE 5: Launch Day (Apr 1)              🟡 ░░░░░░░░░░░░░░░░░░░  0/8 tasks

TOTAL: 0/113 tasks → 0% → LAUNCH READY WHEN 100% COMPLETE
```

---

## 📅 Timeline at a Glance

| Phase | Dates | Days | Focus | Tracks | Status |
|-------|-------|------|-------|--------|--------|
| **Phase 1** | Feb 26 - Mar 8 | 10 | **Parallel Setup** | 5 tracks, DevOps/Ops/Security lead | ⬜ READY |
| **Phase 2** | Mar 8 - Mar 15 | 7 | **Staging Validation** | Deploy + 8 smoke tests + load test | ⬜ READY |
| **Phase 3** | Mar 15 - Mar 28 | 13 | **Production Hardening** | 4 tracks, all hardening + backups | ⬜ READY |
| **Phase 4** | Mar 22 - Mar 31 | 9 | **Final Verification** | Daily countdown checklist | ⬜ READY |
| **Phase 5** | Apr 1 | 1 | **🚀 LAUNCH DAY** | Deploy + monitor | 🚀 PENDING |

---

---

## ⚡ PHASE 1: Parallel Setup (Feb 26 - Mar 8) — 10 days

**Objective:** All infrastructure provisioned, team trained, monitoring configured, security hardened — ready to deploy to staging on Mar 8.

**Execution:** 5 parallel tracks can run simultaneously. Each track has an owner. Sync point: Mar 8 (all tracks must be complete).

---

### 🔧 TRACK A: Infrastructure Provisioning (DevOps Owner)

**Description:** Provision staging PostgreSQL, Redis, Node.js, and all networking/security.

**Owner:** DevOps Lead  
**Timeline:** Feb 26 - Mar 8 (10 days)  
**Effort:** 40-50 hours  
**Status:** ⬜ READY

#### A-1: Database Setup ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| A-1.1 | Provision staging PostgreSQL 16 (t3.small or equivalent, 100 GB SSD) | DevOps | 2 hours | ⬜ TODO |
| A-1.2 | Configure automated hourly snapshots (retention: 7 days) | DevOps | 1 hour | ⬜ TODO |
| A-1.3 | Set max connections to 20 (will increase for production) | DevOps | 30 min | ⬜ TODO |
| A-1.4 | Create `ilu_ase` database for staging | DevOps | 15 min | ⬜ TODO |
| A-1.5 | Create read-only `monitoring` user for metrics | DevOps | 15 min | ⬜ TODO |
| A-1.6 | Verify connection works: `psql -h staging-db.example.com -U postgres -c "SELECT 1;"` | DevOps | 15 min | ⬜ TODO |
| A-1.7 | Document PostgreSQL version, config (postgresql.conf), and connection string format | DevOps | 30 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Staging PostgreSQL responds to connections
- ✅ Automated snapshots running (test by checking snapshot list)
- ✅ Connection string format documented for app env vars

#### A-2: Redis Setup ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| A-2.1 | Provision staging Redis (t3.micro or equivalent, 1 GB) | DevOps | 1 hour | ⬜ TODO |
| A-2.2 | Enable persistence (RDB snapshots every 60 seconds) | DevOps | 15 min | ⬜ TODO |
| A-2.3 | Set max memory eviction policy: `allkeys-lru` | DevOps | 15 min | ⬜ TODO |
| A-2.4 | Restrict access to backend servers only (security group) | DevOps | 15 min | ⬜ TODO |
| A-2.5 | Verify connection: `redis-cli -h staging-redis.example.com ping` → PONG | DevOps | 15 min | ⬜ TODO |
| A-2.6 | Document Redis endpoint and port in deployment guide | DevOps | 15 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Redis responds to connections
- ✅ Persistence enabled (RDB snapshots created)
- ✅ Security group restricts access to backend only

#### A-3: Node.js Runtime ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| A-3.1 | Launch 2x t3.small EC2 instances (Ubuntu 24.04 LTS) | DevOps | 30 min | ⬜ TODO |
| A-3.2 | Install Node.js 20.18.0 (use nvm or direct install) | DevOps | 30 min | ⬜ TODO |
| A-3.3 | Install PM2 or equivalent process manager | DevOps | 15 min | ⬜ TODO |
| A-3.4 | Install Nginx as reverse proxy (port 80 → 3000, port 443 → 3000 via SSL) | DevOps | 30 min | ⬜ TODO |
| A-3.5 | Configure log rotation (logrotate) for app logs | DevOps | 15 min | ⬜ TODO |
| A-3.6 | Verify Node.js version: `node --version` → v20.18.0 | DevOps | 10 min | ⬜ TODO |
| A-3.7 | Document server IPs, login credentials, and SSH key location | DevOps | 20 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Node.js 20.18.0 installed on both servers
- ✅ PM2 managing processes
- ✅ Nginx responding to HTTP (redirects to HTTPS)

#### A-4: Networking & Security ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| A-4.1 | Create security groups: allow SSH (22), HTTP (80), HTTPS (443) from office/team IPs | DevOps | 30 min | ⬜ TODO |
| A-4.2 | Restrict backend servers to only access PostgreSQL + Redis | DevOps | 15 min | ⬜ TODO |
| A-4.3 | Generate or import SSH keypair for staging servers | DevOps | 20 min | ⬜ TODO |
| A-4.4 | Set up VPN access (if required by company policy) | DevOps | 1 hour | ⬜ TODO |
| A-4.5 | Configure staging.ilu-ase.com DNS A record → staging load balancer IP | DevOps | 15 min | ⬜ TODO |
| A-4.6 | Verify DNS resolution: `nslookup staging.ilu-ase.com` | DevOps | 10 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ SSH access works with keypair
- ✅ DNS resolves to staging server
- ✅ Security groups allow only necessary ports

#### A-5: SSL/TLS Certificates ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| A-5.1 | Request SSL certificate for staging.ilu-ase.com (use Let's Encrypt or company CA) | DevOps | 2 hours | ⬜ TODO |
| A-5.2 | Install certificate on Nginx (fullchain + private key) | DevOps | 30 min | ⬜ TODO |
| A-5.3 | Configure auto-renewal (certbot with cron for Let's Encrypt) | DevOps | 30 min | ⬜ TODO |
| A-5.4 | Verify certificate: `openssl s_client -connect staging.ilu-ase.com:443` | DevOps | 15 min | ⬜ TODO |
| A-5.5 | Test HSTS header present: `curl -I https://staging.ilu-ase.com` → check for Strict-Transport-Security | DevOps | 15 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ HTTPS works on staging.ilu-ase.com
- ✅ Certificate valid and auto-renews
- ✅ HSTS header present (max-age=31536000)

#### A-6: Environment Variables ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| A-6.1 | Copy `.env.example` to secure vault (AWS Secrets Manager or HashiCorp Vault) | DevOps | 30 min | ⬜ TODO |
| A-6.2 | Fill in all required vars: DATABASE_URL, JWT_SECRET, STRIPE_API_KEY_TEST, SENTRY_DSN_STAGING, etc. | DevOps | 1 hour | ⬜ TODO |
| A-6.3 | Create `.env.staging` file on backend server (NOT in git, loaded via PM2 ecosystem.config.js) | DevOps | 30 min | ⬜ TODO |
| A-6.4 | Verify all env vars loaded: `pm2 env 0` shows all vars | DevOps | 15 min | ⬜ TODO |
| A-6.5 | Document which vars are secrets (should never be logged) | DevOps | 20 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ All env vars in vault (not in git)
- ✅ Backend can load vars without errors
- ✅ Secrets not exposed in logs

#### A-7: Load Balancer & Redundancy ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| A-7.1 | Create load balancer (ALB/NLB) pointing to 2 backend servers | DevOps | 1 hour | ⬜ TODO |
| A-7.2 | Set health check path: `/health` (should return 200 with JSON) | DevOps | 15 min | ⬜ TODO |
| A-7.3 | Configure SSL listener (443 → 80 on backends) | DevOps | 30 min | ⬜ TODO |
| A-7.4 | Test failover: kill one backend, verify load balancer routes to other | DevOps | 20 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Load balancer distributes traffic across 2 backends
- ✅ Health check passes
- ✅ Failover works (1 backend down → traffic still flows)

**Track A Exit Criteria (by Mar 8):**
- ✅ PostgreSQL responding, snapshots configured
- ✅ Redis responding, persistence enabled
- ✅ Node.js 20 on both staging servers
- ✅ DNS resolves, HTTPS works
- ✅ All env vars in vault, not in git
- ✅ Load balancer health checks passing

---

### 📊 TRACK B: Monitoring & Observability (DevOps Owner)

**Description:** Set up Sentry, APM, logging, and dashboards before code hits staging.

**Owner:** DevOps Lead (can be same person as Track A, or different)  
**Timeline:** Feb 26 - Mar 8 (10 days)  
**Effort:** 25-30 hours  
**Status:** ⬜ READY

#### B-1: Sentry Configuration ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| B-1.1 | Create Sentry project for staging (go to sentry.io, create new project) | DevOps | 15 min | ⬜ TODO |
| B-1.2 | Create Sentry project for production | DevOps | 15 min | ⬜ TODO |
| B-1.3 | Get DSN for staging, add to `.env.staging`: `SENTRY_DSN_STAGING=https://...@sentry.io/...` | DevOps | 15 min | ⬜ TODO |
| B-1.4 | Get DSN for production, store in vault (do NOT commit) | DevOps | 15 min | ⬜ TODO |
| B-1.5 | Test Sentry integration: create intentional error in staging backend, verify it appears in Sentry UI | DevOps | 30 min | ⬜ TODO |
| B-1.6 | Configure Sentry alerts: email on 10+ errors/hour, Slack on critical errors | DevOps | 30 min | ⬜ TODO |
| B-1.7 | Document Sentry project IDs and how to access dashboard | DevOps | 20 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Sentry projects created (staging + production)
- ✅ DSNs in env vars
- ✅ Test error appears in Sentry
- ✅ Alerts configured

#### B-2: APM (Application Performance Monitoring) ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| B-2.1 | Choose APM tool: New Relic, DataDog, or Splunk (based on company preference) | DevOps | 1 hour | ⬜ TODO |
| B-2.2 | Create APM project for staging | DevOps | 30 min | ⬜ TODO |
| B-2.3 | Install APM agent in backend (e.g., `npm install newrelic` for Node.js) | DevOps | 30 min | ⬜ TODO |
| B-2.4 | Configure APM with service name: `ilu-ase-backend-staging` | DevOps | 20 min | ⬜ TODO |
| B-2.5 | Verify APM is collecting metrics: deploy code, check APM dashboard shows request traces | DevOps | 30 min | ⬜ TODO |
| B-2.6 | Set up APM alerts: response time > 2s, error rate > 5%, database slow queries | DevOps | 30 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ APM agent installed and collecting data
- ✅ Request traces visible in dashboard
- ✅ Alerts configured

#### B-3: Structured Logging ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| B-3.1 | Verify backend logger utility is in place (`src/common/logger.ts`) | DevOps | 20 min | ⬜ TODO |
| B-3.2 | Verify all backend logs use logger (not console.log) | DevOps | 30 min | ⬜ TODO |
| B-3.3 | Configure logger to output JSON format (for ELK/CloudWatch parsing) | DevOps | 30 min | ⬜ TODO |
| B-3.4 | Add trace IDs to all requests (middleware in NestJS) — already implemented in app.module.ts | DevOps | 20 min | ⬜ TODO |
| B-3.5 | Set up log aggregation (CloudWatch Logs, ELK, or Datadog) | DevOps | 1 hour | ⬜ TODO |
| B-3.6 | Test: create backend request, verify log appears in aggregation with trace ID | DevOps | 20 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Logs in JSON format
- ✅ Trace IDs present in all logs
- ✅ Logs visible in aggregation tool

#### B-4: Health Check Endpoint ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| B-4.1 | Verify backend has `/health` endpoint (should return 200 OK with JSON) | DevOps | 15 min | ⬜ TODO |
| B-4.2 | Health check should verify: Node process running, database connected, Redis connected | DevOps | 30 min | ⬜ TODO |
| B-4.3 | Test health check: `curl https://staging.ilu-ase.com/health` | DevOps | 10 min | ⬜ TODO |
| B-4.4 | Configure load balancer to use `/health` for health checks (30s interval, 2 failures = unhealthy) | DevOps | 20 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ `/health` endpoint responds 200
- ✅ Health check includes database + Redis status
- ✅ Load balancer using health check

#### B-5: Dashboards ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| B-5.1 | Create dashboard: Key metrics (errors, latency, user signups, Stripe events) | DevOps | 1 hour | ⬜ TODO |
| B-5.2 | Add Sentry error rate widget | DevOps | 15 min | ⬜ TODO |
| B-5.3 | Add APM response time p50/p95/p99 | DevOps | 15 min | ⬜ TODO |
| B-5.4 | Add database connection count + slow query count | DevOps | 20 min | ⬜ TODO |
| B-5.5 | Add Stripe webhook events count (successful, failed, retries) | DevOps | 20 min | ⬜ TODO |
| B-5.6 | Test dashboard: refresh and verify all widgets load data | DevOps | 15 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Dashboard shows all key metrics
- ✅ Dashboard auto-refreshes every 30 seconds
- ✅ Can be accessed by on-call team

**Track B Exit Criteria (by Mar 8):**
- ✅ Sentry projects created + DSNs configured
- ✅ APM agent collecting data
- ✅ Logs in JSON format with trace IDs
- ✅ `/health` endpoint working
- ✅ Dashboard created with all key metrics

---

### 👥 TRACK C: Team & Operational Readiness (CTO/Product Owner)

**Description:** Assign owners, train team, communicate plan, establish escalation paths.

**Owner:** CTO  
**Timeline:** Feb 26 - Mar 8 (10 days)  
**Effort:** 20-25 hours  
**Status:** ⬜ READY

#### C-1: Owner Assignments ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| C-1.1 | Assign Track A owner (Infrastructure Provisioning) | CTO | 15 min | ⬜ TODO |
| C-1.2 | Assign Track B owner (Monitoring & Observability) | CTO | 15 min | ⬜ TODO |
| C-1.3 | Assign Track D owner (Security & Compliance) | CTO | 15 min | ⬜ TODO |
| C-1.4 | Assign Track E owner (Payment Safety) | CTO | 15 min | ⬜ TODO |
| C-1.5 | Assign QA lead (smoke test execution) | CTO | 15 min | ⬜ TODO |
| C-1.6 | Assign on-call primary (CTO or senior engineer) | CTO | 15 min | ⬜ TODO |
| C-1.7 | Assign on-call backup (another senior engineer) | CTO | 15 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ All 7 roles assigned (documented in spreadsheet or RACI matrix)
- ✅ All owners have agreed to their role

#### C-2: Runbook Review Meeting ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| C-2.1 | Schedule runbook review meeting: Mar 5, 9 AM (2 hours) | CTO | 15 min | ⬜ TODO |
| C-2.2 | Invite all owners (ops, security, payment, product, CTO) | CTO | 15 min | ⬜ TODO |
| C-2.3 | Distribute [docs/DEPLOYMENT_PROCEDURES.md](docs/DEPLOYMENT_PROCEDURES.md) 24 hours before meeting | CTO | 15 min | ⬜ TODO |
| C-2.4 | During meeting: walk through staging deployment step-by-step (30 min) | CTO | 30 min | ⬜ TODO |
| C-2.5 | During meeting: walk through rollback procedure (15 min) | CTO | 15 min | ⬜ TODO |
| C-2.6 | During meeting: walk through incident response (15 min) | CTO | 15 min | ⬜ TODO |
| C-2.7 | During meeting: walk through launch day timeline (20 min) | CTO | 20 min | ⬜ TODO |
| C-2.8 | Document Q&A from meeting, send to team by noon | CTO | 30 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ All owners attended runbook review
- ✅ Q&A documented + sent to team

#### C-3: Incident Response Escalation ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| C-3.1 | Create escalation chart: Level 1 (on-call), Level 2 (CTO), Level 3 (CEO/Board) | CTO | 1 hour | ⬜ TODO |
| C-3.2 | Define incident severity: Critical (> 50% error rate), High (> 5% error rate), Medium (< 5%), Low (warnings only) | CTO | 30 min | ⬜ TODO |
| C-3.3 | Define response times: Critical (5 min), High (15 min), Medium (1 hour), Low (next business day) | CTO | 20 min | ⬜ TODO |
| C-3.4 | Document Slack incident channel setup (incident starts → pin details to channel) | CTO | 20 min | ⬜ TODO |
| C-3.5 | Document postmortem process (incident ends → schedule postmortem within 48 hours) | CTO | 20 min | ⬜ TODO |
| C-3.6 | Create escalation contact list (phone numbers, Slack handles, email) | CTO | 30 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Escalation chart documented + shared with team
- ✅ On-call primary + backup have contact info
- ✅ Severity definitions + response times agreed upon

#### C-4: Support Team Training ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| C-4.1 | Create troubleshooting guide: 10 common issues (login fails, payment hangs, performance slow, etc.) | Support Lead | 2 hours | ⬜ TODO |
| C-4.2 | For each issue: symptoms, root cause, how to fix, when to escalate | Support Lead | 1 hour | ⬜ TODO |
| C-4.3 | Schedule support team training: Mar 6, 2 PM (1 hour) | Support Lead | 15 min | ⬜ TODO |
| C-4.4 | During training: cover troubleshooting guide + example scenarios | Support Lead | 1 hour | ⬜ TODO |
| C-4.5 | Give support team access to Sentry 0% (read-only, staging + production) | CTO | 20 min | ⬜ TODO |
| C-4.6 | Give support team access to dashboard (refresh metrics) | CTO | 20 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Troubleshooting guide created + shared
- ✅ Support team trained
- ✅ Support team has access to Sentry + dashboard

#### C-5: Communication Plan ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| C-5.1 | Decide launch announcement channel: email, social media, SMS, push notification? | Product | 30 min | ⬜ TODO |
| C-5.2 | Draft beta launch email: "Ilu Àṣẹ is now live! [link] Sign up to join the spiritual community." | Marketing | 1 hour | ⬜ TODO |
| C-5.3 | Draft social media posts (Twitter, Instagram, LinkedIn) | Marketing | 1 hour | ⬜ TODO |
| C-5.4 | Create launch day Slack schedule: when to send what message | Product | 30 min | ⬜ TODO |
| C-5.5 | Assign someone to send launch announcement (April 1, 12 PM UTC) | CTO | 15 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Launch announcement drafted + approved by CTO
- ✅ Communication plan agreed upon

**Track C Exit Criteria (by Mar 8):**
- ✅ All 7 roles assigned
- ✅ Runbook review meeting scheduled (Mar 5) and team notified
- ✅ Incident response escalation documented
- ✅ Support team trained
- ✅ Launch announcement drafted

---

### 🔒 TRACK D: Security & Compliance (Security Owner)

**Description:** OWASP checklist, rate limiting, CORS, encryption, GDPR compliance.

**Owner:** Security Lead  
**Timeline:** Feb 26 - Mar 8 (10 days)  
**Effort:** 30-35 hours  
**Status:** ⬜ READY

#### D-1: OWASP Top 10 Checklist ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| D-1.1 | **A01: Broken Access Control** — Verify all protected routes require auth (check all POST/PUT/DELETE endpoints) | Security | 1 hour | ⬜ TODO |
| D-1.2 | **A01:** Verify role-based access control (client vs babalawo vs vendor vs admin) | Security | 1 hour | ⬜ TODO |
| D-1.3 | **A02: Cryptographic Failures** — Verify passwords hashed with bcrypt 12+ rounds | Security | 30 min | ⬜ TODO |
| D-1.4 | **A02:** Verify JWT_SECRET is 32+ characters, not hardcoded | Security | 30 min | ⬜ TODO |
| D-1.5 | **A02:** Verify all API communication uses HTTPS (no HTTP fallback) | Security | 30 min | ⬜ TODO |
| D-1.6 | **A03: Injection** — Verify Prisma used (ORM prevents SQL injection) | Security | 30 min | ⬜ TODO |
| D-1.7 | **A03:** Run dependency vulnerability scan: `npm audit --audit-level=moderate` | Security | 30 min | ⬜ TODO |
| D-1.8 | **A04: Insecure Design** — Verify idempotency keys prevent double-charging | Security | 1 hour | ⬜ TODO |
| D-1.9 | **A05: Security Misconfiguration** — Verify no hardcoded secrets in .env files (check git) | Security | 30 min | ⬜ TODO |
| D-1.10 | **A06: Vulnerable Components** — Verify all dependencies are up-to-date | Security | 30 min | ⬜ TODO |
| D-1.11 | **A07: Authentication Failures** — Verify JWT validation on all protected endpoints | Security | 1 hour | ⬜ TODO |
| D-1.12 | **A08: Software & Data Integrity** — Verify CI/CD pipeline uses signed commits | Security | 30 min | ⬜ TODO |
| D-1.13 | **A09: Logging & Monitoring** — Verify Sentry + APM configured | Security | 30 min | ⬜ TODO |
| D-1.14 | **A10: Security Logging & Monitoring** — Verify audit logs for admin actions | Security | 30 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ All 14 OWASP items checked ✅ or marked with exception
- ✅ No critical vulnerabilities found

#### D-2: Rate Limiting ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| D-2.1 | Install rate limiting middleware: `npm install @nestjs/throttler` | Backend | 30 min | ⬜ TODO |
| D-2.2 | Apply rate limit to `/auth/login`: 5 attempts per minute per IP | Backend | 1 hour | ⬜ TODO |
| D-2.3 | Apply rate limit to `/auth/register`: 3 attempts per hour per IP | Backend | 30 min | ⬜ TODO |
| D-2.4 | Test rate limiting: try 6 login attempts, verify 6th fails with 429 Too Many Requests | Backend | 20 min | ⬜ TODO |
| D-2.5 | Document rate limiting config in deployment guide | Backend | 20 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Rate limiting middleware installed
- ✅ Tests verify rate limiting works
- ✅ Config documented

#### D-3: CORS Configuration ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| D-3.1 | Verify CORS config in backend: only allow requests from `FRONTEND_URL` env var | Backend | 30 min | ⬜ TODO |
| D-3.2 | Verify CORS is NOT `*` (specific domain only) | Backend | 15 min | ⬜ TODO |
| D-3.3 | Test CORS: curl from staging.ilu-ase.com → pass, curl from random.com → fail | Backend | 20 min | ⬜ TODO |
| D-3.4 | Document CORS config and how to update for new domains | Backend | 15 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ CORS restricted to FRONTEND_URL only
- ✅ Test verifies cross-domain requests fail

#### D-4: Encryption & Hashing ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| D-4.1 | Verify password hashing: `npm list bcrypt` should show bcrypt in dependencies | Backend | 15 min | ⬜ TODO |
| D-4.2 | Verify bcrypt rounds ≥ 12 in user.service.ts | Backend | 20 min | ⬜ TODO |
| D-4.3 | Test password hashing: create user, verify password not stored in plaintext | Backend | 20 min | ⬜ TODO |
| D-4.4 | Verify sensitive fields marked as `@HideFromLogs` in Prisma (if using that feature) | Backend | 20 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Bcrypt 12+ rounds used for passwords
- ✅ No plaintext passwords in database

#### D-5: API Key & Credential Management ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| D-5.1 | Audit all API keys in use: JWT_SECRET, STRIPE_API_KEY_TEST, SENTRY_DSN, etc. | Security | 30 min | ⬜ TODO |
| D-5.2 | Verify all API keys stored in vault (AWS Secrets Manager or HashiCorp Vault), NOT in git | Security | 30 min | ⬜ TODO |
| D-5.3 | Verify API key rotation policy: JWT_SECRET rotated every 90 days (document in runbook) | Security | 30 min | ⬜ TODO |
| D-5.4 | Create procedure to revoke compromised API keys (e.g., if accidentally committed) | Security | 30 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ All API keys in vault
- ✅ No API keys in git history (use git-secrets or similar)
- ✅ Rotation policy documented

#### D-6: GDPR Compliance ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| D-6.1 | Verify privacy policy published at /privacy | Product | 1 hour | ⬜ TODO |
| D-6.2 | Verify terms of service published at /terms | Product | 1 hour | ⬜ TODO |
| D-6.3 | Verify users can request data export (endpoint returns JSON of their data) | Backend | 1 hour | ⬜ TODO |
| D-6.4 | Verify users can request account deletion (soft delete in DB) | Backend | 1 hour | ⬜ TODO |
| D-6.5 | Verify consent for marketing emails (opt-in, not pre-checked) | Product | 30 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Privacy policy + ToS publicly accessible
- ✅ User can export data
- ✅ User can request deletion

**Track D Exit Criteria (by Mar 8):**
- ✅ All 14 OWASP items checked
- ✅ Rate limiting configured + tested
- ✅ CORS restricted to FRONTEND_URL
- ✅ Password hashing verified (bcrypt 12+)
- ✅ All API keys in vault
- ✅ GDPR compliance features working

---

### 💳 TRACK E: Payment Safety (Payment Owner)

**Description:** Stripe webhook, refunds, idempotency, fraud detection, PCI DSS.

**Owner:** Payment/Finance Lead  
**Timeline:** Feb 26 - Mar 8 (10 days)  
**Effort:** 25-30 hours  
**Status:** ⬜ READY

#### E-1: Stripe Webhook Configuration ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| E-1.1 | Create Stripe test webhook endpoint: POST /webhooks/stripe | Backend | 1 hour | ⬜ TODO |
| E-1.2 | Register webhook in Stripe dashboard: charge.completed, charge.failed, charge.refunded events | Payment | 30 min | ⬜ TODO |
| E-1.3 | Configure webhook retry policy: retry up to 3 times with exponential backoff | Payment | 30 min | ⬜ TODO |
| E-1.4 | Test webhook: trigger charge.completed event in Stripe test dashboard, verify backend receives it | Backend | 30 min | ⬜ TODO |
| E-1.5 | Verify webhook signature validation (using Stripe's secret key) | Backend | 30 min | ⬜ TODO |
| E-1.6 | Document webhook payload handling in deployment guide | Backend | 20 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Webhook endpoint created + responds 200 OK
- ✅ Stripe webhook test succeeds
- ✅ Signature validation prevents forgery

#### E-2: Refund Policy & Testing ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| E-2.1 | Create refund endpoint: POST /payments/:paymentId/refund | Backend | 1 hour | ⬜ TODO |
| E-2.2 | Refund logic: verify order status (pending/completed), if completed ask Stripe for refund | Backend | 1 hour | ⬜ TODO |
| E-2.3 | Refund should be atomic: if Stripe call fails, transaction rolls back | Backend | 1 hour | ⬜ TODO |
| E-2.4 | Write refund test: create payment, refund it, verify balance restored in wallet | Test | 1 hour | ⬜ TODO |
| E-2.5 | Document refund policy: 30 days for refunds, process takes 3-5 business days | Product | 30 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Refund endpoint works end-to-end
- ✅ Wallet balance restored after refund
- ✅ Refund policy documented + public

#### E-3: Idempotency Keys ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| E-3.1 | Verify idempotency key schema in database (Transaction.idempotencyKey UNIQUE) | Backend | 20 min | ⬜ TODO |
| E-3.2 | Verify wallet service checks existing transaction by idempotencyKey before creating new one | Backend | 30 min | ⬜ TODO |
| E-3.3 | Test idempotency: send same payment request twice, verify second returns same transaction ID | Test | 30 min | ⬜ TODO |
| E-3.4 | Test race condition: send payment + idempotency key from 2 concurrent requests, verify only 1 transaction | Test | 30 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Idempotency keys prevent double-charging
- ✅ Tests verify race condition safe
- ✅ 9/9 wallet integration tests passing (already done)

#### E-4: Fraud Detection ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| E-4.1 | Create Stripe radar rules: block charges > $5000, block multiple charges same card in 30 seconds | Payment | 1 hour | ⬜ TODO |
| E-4.2 | Configure Stripe to hold suspicious charges for manual review | Payment | 30 min | ⬜ TODO |
| E-4.3 | Create admin endpoint to review held charges | Backend | 1 hour | ⬜ TODO |
| E-4.4 | Create alert for suspicious activity (send to product@ilu-ase.com) | Payment | 30 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Stripe fraud detection rules configured
- ✅ Admin can review suspicious charges
- ✅ Alerts sent to team

#### E-5: PCI DSS Compliance ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| E-5.1 | Audit backend logs: verify NO credit card numbers logged (check logs with regex `\d{13,19}`) | Security | 30 min | ⬜ TODO |
| E-5.2 | Audit database: verify NO credit card numbers stored (only Stripe token_id) | Security | 30 min | ⬜ TODO |
| E-5.3 | Verify frontend uses Stripe.js (not custom form handling credit cards) | Frontend | 30 min | ⬜ TODO |
| E-5.4 | Verify SSL/TLS on all payment endpoints (HTTPS only, no HTTP fallback) | DevOps | 20 min | ⬜ TODO |
| E-5.5 | Create audit trail: log all payment actions (create, refund, dispute) with timestamp + user | Backend | 1 hour | ⬜ TODO |

**Acceptance Criteria:**
- ✅ No credit card data in logs or database
- ✅ Frontend uses Stripe.js
- ✅ All endpoints HTTPS
- ✅ Audit trail logged

**Track E Exit Criteria (by Mar 8):**
- ✅ Stripe webhook configured + tested
- ✅ Refund feature working end-to-end
- ✅ Idempotency keys prevent double-charging
- ✅ Fraud detection rules configured
- ✅ PCI DSS compliance verified

---

## ✅ PHASE 1 EXIT CRITERIA (Mar 8)

All 5 tracks complete:

- ✅ **Track A:** PostgreSQL, Redis, Node.js, DNS, SSL, env vars, load balancer all ready
- ✅ **Track B:** Sentry, APM, logging, health check, dashboards all configured
- ✅ **Track C:** Owners assigned, runbook review scheduled, incident escalation documented, support trained
- ✅ **Track D:** OWASP checklist, rate limiting, CORS, encryption, API key mgmt, GDPR all verified
- ✅ **Track E:** Stripe webhook, refunds, idempotency, fraud detection, PCI DSS all ready

**Business Rule:** Cannot proceed to Phase 2 (staging deployment) until Phase 1 is 100% complete.

---

---

## 🚀 PHASE 2: Staging Validation (Mar 8 - Mar 15) — 7 days

**Objective:** Deploy code to staging, run 8 smoke tests, load test, backup test, get stakeholder sign-off.

**Sequential Steps:** Must complete each step before proceeding to next.

---

### Step 1: Deploy Backend to Staging (Mar 8) ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| 1.1 | SSH into staging server: `ssh -i staging.pem ubuntu@staging-backend-1.ilu-ase.com` | DevOps | 5 min | ⬜ TODO |
| 1.2 | Clone v4/quality branch: `git clone -b v4/quality https://github.com/MoyoOni/ifa_app.git /opt/ilu-ase` | DevOps | 10 min | ⬜ TODO |
| 1.3 | Install backend dependencies: `cd /opt/ilu-ase/backend && npm ci` (use npm ci, not install) | DevOps | 5 min | ⬜ TODO |
| 1.4 | Build backend: `npm run build` | DevOps | 10 min | ⬜ TODO |
| 1.5 | Apply database migrations: `npx prisma migrate deploy` | DevOps | 5 min | ⬜ TODO |
| 1.6 | Create PM2 ecosystem file with env vars from vault | DevOps | 10 min | ⬜ TODO |
| 1.7 | Start backend: `pm2 start ecosystem.config.js` | DevOps | 5 min | ⬜ TODO |
| 1.8 | Verify backend listening: `curl https://staging.ilu-ase.com/health` → 200 OK | DevOps | 5 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Backend deployed from v4/quality branch
- ✅ Database migrations applied
- ✅ `/health` endpoint responds

---

### Step 2: Deploy Frontend to Staging (Mar 8) ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| 2.1 | SSH into staging frontend server | DevOps | 5 min | ⬜ TODO |
| 2.2 | Clone v4/quality branch | DevOps | 10 min | ⬜ TODO |
| 2.3 | Install frontend dependencies: `cd frontend && npm ci` | DevOps | 5 min | ⬜ TODO |
| 2.4 | Build frontend: `npm run build` → dist/ folder created | DevOps | 10 min | ⬜ TODO |
| 2.5 | Deploy dist/ to CDN or web server | DevOps | 10 min | ⬜ TODO |
| 2.6 | Test frontend: `curl https://staging.ilu-ase.com` → HTML loads | DevOps | 5 min | ⬜ TODO |
| 2.7 | Test frontend loads in browser: go to https://staging.ilu-ase.com | QA | 10 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Frontend deployed from v4/quality branch
- ✅ Frontend loads in browser without TypeScript/build errors

---

### Step 3: Run 8 Smoke Tests (Mar 10-12) ⬜ READY

**Reference:** [docs/SMOKE_TEST_GUIDE.md](docs/SMOKE_TEST_GUIDE.md)

| # | Scenario | Time | Owner | Must Pass? | Status |
|---|----------|------|-------|-----------|--------|
| 3.1 | User Registration → Login | 5 min | QA | ✅ YES | ⬜ TODO |
| 3.2 | Browse Temples → Find Babalawo → Book Consultation | 5 min | QA | ✅ YES | ⬜ TODO |
| 3.3 | Complete Booking Confirmation | 5 min | QA | ✅ YES | ⬜ TODO |
| 3.4 | Send Wallet Deposit (idempotency test: send twice, get same transaction) | 5 min | QA | ✅ YES | ⬜ TODO |
| 3.5 | Admin Queue: Verify new user | 3 min | QA | ✅ YES | ⬜ TODO |
| 3.6 | Mobile Responsive: Test on 375px viewport (iPhone SE width) | 5 min | QA | ✅ YES | ⬜ TODO |
| 3.7 | Error Recovery: Intentionally trigger error, verify Sentry captures it | 3 min | QA | ✅ YES | ⬜ TODO |
| 3.8 | Performance baseline: Load 50 concurrent users for 5 min | 10 min | DevOps | ✅ YES | ⬜ TODO |

**For each test:**
- [ ] Test completed
- [ ] Result: PASS or FAIL with details
- [ ] If FAIL: log issue in Jira/GitHub, re-run after fix

**Exit Criteria for Step 3:**
- ✅ All 8 tests pass
- ✅ Sentry error rate < 0.1%
- ✅ No UI crashes or console errors
- ✅ Mobile viewport responsive (no horizontal scroll)

---

### Step 4: Load Testing (Mar 12-13) ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| 4.1 | Install load test tool: `npm install -g artillery` or use locust | DevOps | 15 min | ⬜ TODO |
| 4.2 | Create load test script: 100 concurrent users, each makes 10 requests over 5 minutes | DevOps | 1 hour | ⬜ TODO |
| 4.3 | Run load test: ensure latency p99 < 3 seconds | DevOps | 10 min | ⬜ TODO |
| 4.4 | Verify database connection count during test (should be < 20) | DevOps | 5 min | ⬜ TODO |
| 4.5 | Verify Sentry error rate during test (should be < 1%) | DevOps | 5 min | ⬜ TODO |
| 4.6 | Gradually increase to 200 concurrent users, re-test | DevOps | 10 min | ⬜ TODO |
| 4.7 | Document breaking point: "System handles up to X concurrent users, degrades at Y" | DevOps | 30 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ 100 concurrent users: latency p99 < 3s, error rate < 1%
- ✅ Breaking point identified + documented
- ✅ Database connection pooling working correctly

---

### Step 5: Backup/Restore Test (Mar 13-14) ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| 5.1 | Create production-like dataset on staging: 100 users, 50 consultations, 50 products | QA | 2 hours | ⬜ TODO |
| 5.2 | Create database snapshot: `pg_dump ilu_ase > backup_staging_snapshot.sql` | DevOps | 10 min | ⬜ TODO |
| 5.3 | Stop staging database | DevOps | 5 min | ⬜ TODO |
| 5.4 | Restore from snapshot: `psql ilu_ase < backup_staging_snapshot.sql` | DevOps | 10 min | ⬜ TODO |
| 5.5 | Verify data integrity: run queries to check user count, product, consultations | DevOps | 15 min | ⬜ TODO |
| 5.6 | Re-run database migrations (should succeed or say "already applied") | DevOps | 5 min | ⬜ TODO |
| 5.7 | Document recovery time: "Full database restore: X minutes" | DevOps | 15 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ Data restored successfully
- ✅ All records present (users, consultations, products)
- ✅ Database migrations don't re-apply
- ✅ Recovery time < 30 minutes

---

### Step 6: Stakeholder Sign-Off (Mar 14-15) ⬜ READY

| # | Task | Owner | Duration | Status |
|---|------|-------|----------|--------|
| 6.1 | Prepare sign-off document: results of 8 smoke tests, load test, backup test | QA | 1 hour | ⬜ TODO |
| 6.2 | Schedule sign-off meeting: Mar 14, 2 PM (1 hour) with CTO, Product, Finance | QA | 15 min | ⬜ TODO |
| 6.3 | Present results: all 8 tests passed, backup works, load test complete | QA | 30 min | ⬜ TODO |
| 6.4 | Answer questions: blockers? risks? any issues discovered? | CTO | 20 min | ⬜ TODO |
| 6.5 | Get written approval: CTO, Product, Finance sign off on proceeding to production prep | CTO | 5 min | ⬜ TODO |
| 6.6 | Document sign-off in PHASE_2_SIGN_OFF.md (attach meeting notes) | CTO | 15 min | ⬜ TODO |

**Acceptance Criteria:**
- ✅ All 3 stakeholders sign off
- ✅ No blockers identified
- ✅ Go/no-go decision: PROCEED to Phase 3

---

## ✅ PHASE 2 EXIT CRITERIA (Mar 15)

- ✅ Code deployed to staging (backend + frontend)
- ✅ 8/8 smoke tests passing
- ✅ Load test complete (100+ concurrent users)
- ✅ Backup/restore verified working
- ✅ Stakeholder sign-off obtained

**Business Rule:** Cannot proceed to Phase 3 (production prep) until Phase 2 sign-off obtained.

---

---

## 🛡️ PHASE 3: Production Hardening (Mar 15 - Mar 28) — 13 days

**Objective:** Provision production infrastructure, configure backups, monitoring, security, payments. All hardening must be complete before final verification.

**Execution:** 4 parallel tracks (same as Phase 1, but for production).

---

### Track A: Production Infrastructure (Mar 15-18)

**Description:** Provision production PostgreSQL, Redis, Node.js, load balancer, SSL.

**Owner:** DevOps Lead  
**Timeline:** Mar 15-18 (4 days, parallel with other tracks)  
**Status:** ⬜ READY

**Tasks:** Same as Phase 1 Track A, but for production (larger instance, multi-AZ if possible):

| # | Task | Staging Size | Prod Size | Duration | Status |
|---|------|--------------|----------|----------|--------|
| A-1 | Provision PostgreSQL | t3.small, 100 GB | t3.xlarge, 500 GB, Multi-AZ | 2 hours | ⬜ TODO |
| A-2 | Provision Redis | t3.micro, 1 GB | t3.small, 5 GB, Multi-AZ | 1 hour | ⬜ TODO |
| A-3 | Provision Node.js servers | 2x t3.small | 4x t3.medium, auto-scaling 2-10 | 1 hour | ⬜ TODO |
| A-4 | Configure security groups | SSH+HTTP+HTTPS from office | SSH+HTTPS from office only | 30 min | ⬜ TODO |
| A-5 | Generate SSL certificates | Staging wildcard | Production wildcard *.ilu-ase.com | 2 hours | ⬜ TODO |
| A-6 | Create environment variables | Staging vault | Production vault (higher security) | 1 hour | ⬜ TODO |
| A-7 | Set up load balancer | Staging LB, 2 backends | Production LB, 4 backends, auto-scaling | 1 hour | ⬜ TODO |

**Exit Criteria:**
- ✅ Production PostgreSQL responds, snapshots enabled
- ✅ Production Redis responds, persistence enabled
- ✅ Node.js 20 on all production servers
- ✅ Load balancer distributes across 4 backends
- ✅ HTTPS works with wildcard certificate

---

### Track B: Backup & Disaster Recovery (Mar 15-17)

**Description:** Automated backups, test restore, document procedure.

**Owner:** DevOps Lead  
**Status:** ⬜ READY

| # | Task | Duration | Status |
|---|------|----------|--------|
| B-1 | Enable automated hourly PostgreSQL snapshots (production) | 30 min | ⬜ TODO |
| B-2 | Set up weekly archive (cold storage: S3, GCS, or Glacier) | 1 hour | ⬜ TODO |
| B-3 | Test: Restore from cold storage to staging database | 1 hour | ⬜ TODO |
| B-4 | Document recovery procedure: RTO (Recovery Time Objective) = 1 hour, RPO = 1 hour | 30 min | ⬜ TODO |
| B-5 | Create runbook: "How to restore production database in emergency" | 1 hour | ⬜ TODO |

**Exit Criteria:**
- ✅ Hourly snapshots enabled
- ✅ Weekly archives enabled
- ✅ Restore procedure tested
- ✅ RTO/RPO documented

---

### Track C: Production Monitoring (Mar 18-20)

**Description:** Sentry, APM, logging, dashboards for production.

**Owner:** DevOps Lead  
**Status:** ⬜ READY

| # | Task | Duration | Status |
|---|------|----------|--------|
| C-1 | Create production Sentry project, get DSN | 30 min | ⬜ TODO |
| C-2 | Configure production APM (New Relic, DataDog) | 1 hour | ⬜ TODO |
| C-3 | Create production dashboard: errors, latency, user signups, Stripe events | 1 hour | ⬜ TODO |
| C-4 | Configure PagerDuty alerts (critical errors trigger on-call page) | 1 hour | ⬜ TODO |
| C-5 | Test: intentional error in production → verify Sentry captures → verify on-call alerted | 30 min | ⬜ TODO |

**Exit Criteria:**
- ✅ Production Sentry DSN configured
- ✅ APM metrics flowing
- ✅ Dashboard shows real traffic
- ✅ Alerts trigger correctly

---

### Track D: Security Hardening (Mar 18-20)

**Description:** Rate limiting, CORS, encryption, auth, audit logs.

**Owner:** Security Lead  
**Status:** ⬜ READY

| # | Task | Duration | Status |
|---|------|----------|--------|
| D-1 | Enable rate limiting on production (/auth/login: 5 attempts/min) | 1 hour | ⬜ TODO |
| D-2 | Restrict CORS to production frontend domain only (not staging) | 30 min | ⬜ TODO |
| D-3 | Verify JWT_SECRET in vault (32+ chars, rotated every 90 days) | 30 min | ⬜ TODO |
| D-4 | Enable request logging (API Gateway log all requests, audit trail) | 1 hour | ⬜ TODO |
| D-5 | Verify Helmet.js CSP + HSTS headers present | 30 min | ⬜ TODO |

**Exit Criteria:**
- ✅ Rate limiting active
- ✅ CORS restricted
- ✅ Encryption verified
- ✅ Audit logging enabled

---

### Track E: Payment Hardening (Mar 20-22)

**Description:** Stripe production keys, fraud detection, refunds, PCI DSS.

**Owner:** Payment Lead  
**Status:** ⬜ READY

| # | Task | Duration | Status |
|---|------|----------|--------|
| E-1 | Switch from Stripe test to Stripe live API keys | 1 hour | ⬜ TODO |
| E-2 | Register production webhook in Stripe: charge.completed, charge.failed, charge.refunded | 30 min | ⬜ TODO |
| E-3 | Configure Stripe fraud detection for production (higher thresholds than staging) | 1 hour | ⬜ TODO |
| E-4 | Test: make real payment with test card (4111 111111111111), verify webhook fires | 30 min | ⬜ TODO |
| E-5 | Verify idempotency keys preventing double-charges on production | 30 min | ⬜ TODO |

**Exit Criteria:**
- ✅ Stripe live keys configured (not test keys)
- ✅ Webhook endpoint receiving events
- ✅ Fraud detection active
- ✅ Test payment successful

---

## ✅ PHASE 3 EXIT CRITERIA (Mar 28)

All 4 tracks complete:

- ✅ Production infrastructure provisioned (PostgreSQL, Redis, Node.js, LB)
- ✅ Backups enabled + restore tested
- ✅ Monitoring active (Sentry, APM, dashboard)
- ✅ Security hardened (rate limiting, CORS, encryption)
- ✅ Payments working (Stripe live keys, webhooks)

**Business Rule:** Cannot launch until Phase 3 complete.

---

---

## ✅ PHASE 4: Final Verification (Mar 22 - Mar 31) — 9 days

**Objective:** Daily countdown checklist, incident drill, security audit, all sign-offs obtained.

**Sequential, with sync point Mar 28 (final sign-off).**

---

### Daily Countdown Checklist

| Day | Date | Task | Owner | Must Pass? | Status |
|-----|------|------|-------|-----------|--------|
| **D-10** | Mar 22 | Re-run all 8 smoke tests on staging (not prod yet) | QA | ✅ YES | ⬜ TODO |
| **D-10** | Mar 22 | Verify production database migration test (apply 20+ migrations on prod clone) | DevOps | ✅ YES | ⬜ TODO |
| **D-9** | Mar 23 | Security audit: final OWASP checklist (10 items) | Security | ✅ YES | ⬜ TODO |
| **D-8** | Mar 24 | Runbook walkthrough with ops team (2 hours: deployment, rollback, incident response) | CTO + Ops | ✅ YES | ⬜ TODO |
| **D-7** | Mar 25 | Incident response drill: simulate database outage, test recovery procedure | All | ✅ YES | ⬜ TODO |
| **D-6** | Mar 26 | Sentry + APM configuration final check (alerts firing? dashboards loaded?) | DevOps | ✅ YES | ⬜ TODO |
| **D-5** | Mar 27 | Load test production infrastructure (100 concurrent users, verify under load) | DevOps | ✅ YES | ⬜ TODO |
| **D-1** | Mar 28 | FINAL SIGN-OFF MEETING: CTO + all owners (1 hour) | All | ✅ YES | ⬜ TODO |

---

### Mar 22: Smoke Tests on Staging

| # | Scenario | Expected Result | Actual Result | Status |
|---|----------|-----------------|----------------|--------|
| 1 | User Registration → Login | New account created, can login | | ⬜ TODO |
| 2 | Browse Temples → Find Babalawo | Can navigate to babalawo detail page | | ⬜ TODO |
| 3 | Book Consultation → Confirm | Consultation booked, confirmation received | | ⬜ TODO |
| 4 | Wallet Deposit (idempotency: 2x same key) | 2nd request returns same transaction | | ⬜ TODO |
| 5 | Admin verify user | User marked as verified in queue | | ⬜ TODO |
| 6 | Mobile 375px viewport | No horizontal scroll, responsive | | ⬜ TODO |
| 7 | Error recovery (trigger intentional error) | Sentry captures error | | ⬜ TODO |
| 8 | Performance baseline (50 concurrent) | Latency p99 < 2s, < 1% errors | | ⬜ TODO |

**Exit Criteria:** 8/8 passing, Sentry < 0.1% error rate, no console errors

---

### Mar 23: Production Database Migration Test

| # | Task | Duration | Status |
|---|------|----------|--------|
| 1 | Create production-like clone of staging database (100+ users, realistic data) | 1 hour | ⬜ TODO |
| 2 | Run all 20+ migrations on clone: `npx prisma migrate deploy` | 15 min | ⬜ TODO |
| 3 | Verify data integrity after migrations (check user count, products, etc.) | 30 min | ⬜ TODO |
| 4 | Test app connects to migrated database without errors | 30 min | ⬜ TODO |

**Exit Criteria:** Migrations succeed, data integrity verified

---

### Mar 24: Runbook Walkthrough

**Schedule:** 2 hours with ops team

| Topic | Duration | Owner |
|-------|----------|-------|
| Deployment procedure (step-by-step deployment to production) | 30 min | CTO |
| Rollback procedure (if deployment fails or critical error) | 15 min | DevOps |
| Incident response (how to identify + fix issues) | 15 min | CTO |
| On-call procedures (who to page, who to escalate to) | 15 min | CTO |
| Q&A | 15 min | All |

**Exit Criteria:** Ops team confirms understanding, Q&A documented

---

### Mar 25: Incident Response Drill

**Scenario:** Database unavailable. Team must detect, diagnose, and recover within 15 minutes.

| Step | Action | Expected | Actual | Time |
|------|--------|----------|--------|------|
| 1 | **INCIDENT TRIGGERED** | Database stops responding | | 0:00 |
| 2 | Monitor detects error | Sentry shows 100% error rate | | 0:30 |
| 3 | On-call paged | PagerDuty alerts primary | | 1:00 |
| 4 | CTO joins incident channel | Slack #incidents updated | | 2:00 |
| 5 | Diagnose problem | Check database, logs, network | | 5:00 |
| 6 | Execute recovery | Restart database / switch to backup | | 10:00 |
| 7 | Verify fix | `/health` endpoint returns 200 | | 12:00 |
| 8 | All-clear | Error rate returns to < 0.1% | | 14:00 |
| 9 | Postmortem scheduled | Meeting set for Mar 27 | | 14:30 |

**Exit Criteria:** Team recovered within 15 minutes, postmortem scheduled

---

### Mar 26: Sentry & APM Final Check

| # | Check | Expected | Actual | Status |
|---|-------|----------|--------|--------|
| 1 | Sentry dashboard loads | <2s load time | | ⬜ TODO |
| 2 | Alerts configured | 3+ rules (errors, rate limit, slow query) | | ⬜ TODO |
| 3 | APM dashboard loads | <2s load time | | ⬜ TODO |
| 4 | Request traces visible | Latest 10 requests shown | | ⬜ TODO |
| 5 | Database slow queries | Can filter queries > 1s | | ⬜ TODO |
| 6 | Test alert | Trigger intentional error → verify email sent | | ⬜ TODO |

**Exit Criteria:** All 6 checks pass, alerts working

---

### Mar 27: Load Test Production Infrastructure

| # | Test | Concurrent Users | p99 Latency | Error Rate | Status |
|---|------|------------------|-------------|------------|--------|
| 1 | Baseline | 50 | < 1.5s | < 0.1% | ⬜ TODO |
| 2 | Ramp up | 100 | < 2s | < 0.5% | ⬜ TODO |
| 3 | Peak simulation | 200 | < 3s | < 1% | ⬜ TODO |
| 4 | Sustained | 100 (10 min) | < 2s | < 0.5% | ⬜ TODO |

**Exit Criteria:** 200 concurrent users handled (breaking point identified)

---

### Mar 28: FINAL SIGN-OFF MEETING

**Attendees:** CTO, DevOps Lead, Security Lead, Payment Lead, Product Lead, QA Lead

**Agenda (1 hour):**

| Topic | Duration | Decision |
|-------|----------|----------|
| **Results summary** — all tests passed? | 15 min | GO / NO-GO |
| **Blockers & risks** — any issues? | 10 min | GO / NO-GO |
| **Runbook walkthrough** — ops ready? | 10 min | GO / NO-GO |
| **Incident drill outcome** — recovery < 15 min? | 10 min | GO / NO-GO |
| **Final sign-off** — unanimous agreement to launch? | 10 min | GO / NO-GO |

**Document for each:**
- [ ] CTO sign-off (Code quality, architecture, security)
- [ ] DevOps sign-off (Infrastructure, backups, monitoring)
- [ ] Security sign-off (OWASP checklist, encryption, audit logs)
- [ ] Payment sign-off (Stripe live keys, fraud detection)
- [ ] QA sign-off (Smoke tests, load tests, no blockers)
- [ ] Product sign-off (Feature complete, ready for users)

**Decision:** 
- [ ] **🚀 GO LIVE** on April 1 (if all sign-offs obtained)
- [ ] **🟡 HOLD** pending resolution of issues (identify blockers, reschedule sign-off)

**Exit Criteria:** All 6 sign-offs obtained, unanimous GO decision

---

## ✅ PHASE 4 EXIT CRITERIA (Mar 28)

- ✅ All daily checklist items complete (8/8)
- ✅ All 8 smoke tests passing
- ✅ Database migrations tested on production clone
- ✅ Runbook reviewed + team briefed
- ✅ Incident drill completed successfully
- ✅ Load test verified (200 concurrent users)
- ✅ Final sign-off from all 6 owners

**Business Rule:** If any sign-off denied, identify blocker, reschedule sign-off for next day.

---

---

## 🚀 PHASE 5: LAUNCH DAY (April 1, 2026)

**Timeline:** 8 AM - 12 PM (4 hours active monitoring)

---

### Pre-Launch: Last-Minute Checks (8-9 AM)

| # | Check | Expected | Status |
|---|-------|----------|--------|
| 1 | Staging smoke tests (from Mar 22) | 8/8 passing | ⬜ VERIFY |
| 2 | Database backup | Latest backup < 1 hour old | ⬜ VERIFY |
| 3 | Team online | CTO, DevOps, On-call primary, backup, support all online | ⬜ VERIFY |
| 4 | Slack #incidents channel | Muted, no active incidents | ⬜ VERIFY |
| 5 | Dashboard baseline | Metrics loading, no errors | ⬜ VERIFY |
| 6 | Stripe account | Live keys active, webhook endpoint configured | ⬜ VERIFY |

**If any check fails:** ABORT launch, reschedule for tomorrow.

---

### Go Live: Deploy to Production (9:00 AM)

| Step | Action | Duration | Owner |
|------|--------|----------|-------|
| 1 | Merge `v4/quality` → `main` branch | 2 min | DevOps |
| 2 | Tag commit as release: `git tag v1.0.0-production` | 1 min | DevOps |
| 3 | CI/CD pipeline triggered automatically | ~10 min | CI/CD |
| 4 | Backend build + test | ~5 min | CI/CD |
| 5 | Frontend build | ~3 min | CI/CD |
| 6 | Deploy backend to production servers | ~5 min | CI/CD |
| 7 | Deploy frontend to CDN | ~3 min | CI/CD |
| 8 | Database migrations applied | ~2 min | CI/CD |
| 9 | Smoke test: `/health` endpoint responds 200 | 2 min | DevOps |

**Total deployment time: ~9 minutes**

---

### Post-Deploy: Monitoring (9:10 AM - 12 PM)

**Continuous Monitoring (every 5 minutes):**

| Metric | Healthy | Action if Unhealthy |
|--------|---------|-------------------|
| Error rate (Sentry) | < 0.1% | Investigate + page on-call |
| Response time p99 | < 2s | Monitor for degradation |
| User signups | > 0 | Expected shortly after announcement |
| Stripe charge events | > 0 | Expected shortly |
| Load balancer health | All online | If backend down, auto-failover |
| Database connections | < 20 | If > 20, scale up |

**If Critical Issue Detected (error rate > 5%):**

| Step | Action | Time |
|------|--------|------|
| 1 | STOP — cease the launch announcement | Immediate |
| 2 | Page on-call primary | Immediate |
| 3 | Investigate root cause (check logs, Sentry, APM) | 5 min |
| 4 | **Option A:** Hot fix in production (if quick) | 15 min |
| 5 | **Option B:** Rollback to previous version (safest) | 5 min |
| 6 | Re-test after fix/rollback | 10 min |
| 7 | Resume launch or reschedule for tomorrow | Decision |

---

### Launch Announcement (12 PM, after 3 hours clean)

**Conditions to send announcement:**
- ✅ No critical errors for 3 consecutive hours
- ✅ Error rate < 0.1%
- ✅ Response time p99 < 2s
- ✅ Load balancer health: all backends online

**Announcement (send as email + social media):**

```
🎉 Ilu Àṣẹ is LIVE!

Join our growing community of spiritual practitioners, seekers, and healers.

🔗 https://ilu-ase.com

✨ Features:
- Find and book consultations with Babalawos
- Join circles and grow your practice
- Take courses and deepen your knowledge
- Connect with the community

Welcome to the digital sanctuary for Ifá spiritual practice.

🙏 Àṣẹ.
```

---

## ✅ LAUNCH DAY EXIT CRITERIA

- ✅ Code deployed to production at 9:00 AM
- ✅ `/health` endpoint responds 200 OK
- ✅ Error rate < 0.1% for 3 consecutive hours
- ✅ Response time p99 < 2s
- ✅ No critical incidents
- ✅ Launch announcement sent at 12 PM
- ✅ 🚀 **LAUNCH SUCCESSFUL**

---

---

## 📊 Deployment Readiness Scorecard

Track progress as you move through phases:

| Category | Sep 26 (Today) | Mar 8 (End Phase 1) | Mar 15 (End Phase 2) | Mar 28 (End Phase 4) | Apr 1 (Launch) |
|----------|---|---|---|---|---|
| **Code Quality** | 95% ✅ | 95% ✅ | 95% ✅ | 95% ✅ | 100% ✅ |
| **Documentation** | 95% ✅ | 95% ✅ | 95% ✅ | 95% ✅ | 100% ✅ |
| **Testing** | 80% 🟡 | 90% 🟡 | 100% ✅ | 100% ✅ | 100% ✅ |
| **Infrastructure** | 40% 🟡 | 100% ✅ | 100% ✅ | 100% ✅ | 100% ✅ |
| **Team Readiness** | 50% 🟡 | 100% ✅ | 100% ✅ | 100% ✅ | 100% ✅ |
| **Security** | 85% ✅ | 95% ✅ | 95% ✅ | 100% ✅ | 100% ✅ |
| **Monitoring** | 60% 🟡 | 95% ✅ | 95% ✅ | 100% ✅ | 100% ✅ |
| **Payment Safety** | 95% ✅ | 95% ✅ | 100% ✅ | 100% ✅ | 100% ✅ |
| **Data Management** | 70% 🟡 | 90% 🟡 | 100% ✅ | 100% ✅ | 100% ✅ |
| **Launch Plan** | 50% 🟡 | 100% ✅ | 100% ✅ | 100% ✅ | 100% ✅ |
| **OVERALL** | **71%** | **89%** | **99%** | **100%** | **🚀 LAUNCH** |

---

---

## 🚨 Risk Mitigation Map

For each risk, identify: blocking? mitigation? owner? test date?

| Risk | Blocking? | Mitigation | Owner | Test Date |
|------|-----------|-----------|-------|-----------|
| **Infrastructure not ready by Mar 8** | ✅ YES | Start provisioning TODAY (Feb 26) + 2x person-hours/day monitoring | DevOps | Mar 8 |
| **Staging smoke tests fail** | ✅ YES | Have hotfix ready, re-test, escalate to CTO | QA | Mar 12 |
| **Database migration fails on production** | ✅ YES | Test migration 3x on staging clone before production | DevOps | Mar 23 |
| **Backup doesn't restore** | ✅ YES | Test restore weekly (first test: Mar 14) | DevOps | Mar 14 |
| **Payment system down on launch** | ✅ YES | Have Stripe API key validated, webhook tested, fallback plan (manual invoice) | Payment | Mar 22 |
| **Certificate expires** | ✅ YES | Auto-renewal configured, expiry date monitored, alert set for 30 days before | DevOps | Mar 1 + ongoing |
| **Load balancer fails** | 🟡 MEDIUM | 2nd load balancer on hot standby, failover test on Mar 27 | DevOps | Mar 27 |
| **Database connection exhaustion under load** | 🟡 MEDIUM | connection_limit=20 per backend, auto-scaling tested with 200 concurrent users | DevOps | Mar 27 |
| **Incident during launch** | ✅ YES | On-call team pre?-briefed, runbook reviewed (Mar 24), incident drill (Mar 25) | CTO | Mar 25 |
| **No traffic after launch** | 🟡 MEDIUM | Announcement sent to early beta users, expected activation curve documented | Product | Apr 1 |

---

---

## 📅 Master Timeline: Feb 26 - Apr 1

```
FEB 26 (MON) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PHASE 1 START
FEB 27 (TUE) │                                                Track A, B, C, D, E
FEB 28 (WED) │                                           in parallel
MAR 01 (THU) │                                 (10 days)
MAR 02 (FRI) │
MAR 03 (SAT) │
MAR 04 (SUN) │
MAR 05 (MON) ┃ Runbook review meeting (Mar 5, 9 AM)
MAR 06 (TUE) ┃ Support team training (Mar 6, 2 PM)
MAR 07 (WED) ┃
MAR 08 (THU) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PHASE 1 EXIT
             │                                                PHASE 2 START
MAR 09 (FRI) ┃ Deploy backend + frontend
MAR 10 (SAT) ┃ Smoke tests (8 scenarios)
MAR 11 (SUN) ┃ Load test baseline
MAR 12 (MON) ┃ Load test ramp up
MAR 13 (TUE) ┃ Backup/restore test
MAR 14 (WED) ┃ Stakeholder sign-off meeting
MAR 15 (THU) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PHASE 2 EXIT
             │                                                PHASE 3 START
MAR 16 (FRI) ┃
MAR 17 (SAT) ┃ Track A, B, C, D, E
MAR 18 (SUN) ┃ Production hardening
MAR 19 (MON) ┃ (4 parallel tracks)
MAR 20 (TUE) ┃
MAR 21 (WED) ┃
MAR 22 (THU) ┃ Re-run smoke tests (staging) D-10
MAR 23 (FRI) ┃ Database migration test D-9
MAR 24 (SAT) ┃ Runbook walkthrough D-8
MAR 25 (SUN) ┃ Incident drill D-7
MAR 26 (MON) ┃ Sentry + APM check D-6
MAR 27 (TUE) ┃ Load test production D-5
MAR 28 (WED) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PHASE 3/4 EXIT
             │ FINAL SIGN-OFF MEETING
MAR 29 (THU) ┃ Buffer day (fixes if needed)
MAR 30 (FRI) ┃ Buffer day
MAR 31 (SAT) ┃ Buffer day
             │
APR 01 (SUN) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🚀 LAUNCH DAY
             ┃ 8 AM: Pre-launch checks
             ┃ 9 AM: Deploy to production
             ┃ 9:10 AM - 12 PM: Monitor
             ┃ 12 PM: Launch announcement
             ┃ 🎉 Go live!
```

---

---

## 📋 Quick Reference Checklists

### Weekly Sync Meeting Agenda (Every Tuesday, 9 AM)

**Duration:** 30 minutes  
**Attendees:** Track owners (A-E), CTO, Product Lead

**Agenda:**

1. **Phase Status** (5 min)
   - [ ] Phase 1 (Feb 26-Mar 8): Track A/B/C/D/E status
   - [ ] Phase 2 (Mar 8-15): Deploy + smoke tests
   - [ ] Phase 3 (Mar 15-28): Production hardening
   - [ ] Phase 4 (Mar 22-31): Final verification
   - [ ] Phase 5 (Apr 1): Launch day readiness

2. **Track Reports** (15 min, 3 min per track)
   - [ ] Track A (DevOps): Infrastructure status - Green/Yellow/Red?
   - [ ] Track B (DevOps): Monitoring status - Green/Yellow/Red?
   - [ ] Track C (CTO): Team readiness - Green/Yellow/Red?
   - [ ] Track D (Security): Security hardening - Green/Yellow/Red?
   - [ ] Track E (Payment): Payment safety - Green/Yellow/Red?

3. **Blockers & Escalations** (5 min)
   - [ ] Any RED items? Escalate to CTO immediately
   - [ ] Any dependencies between tracks? Plan work downstream
   - [ ] Any resource constraints? Hire or reschedule

4. **Next Week Preview** (5 min)
   - [ ] What's due next week?
   - [ ] Who needs help?
   - [ ] Schedule detailed planning sessions if needed

**Decision:** Proceed to next phase, or pause + fix blockers?

---

### Owner Assignment Template

```
TRACK A: Infrastructure Provisioning
  Owner: [NAME] ← [EMAIL] | [PHONE]
  Team: [DevOps person 1], [DevOps person 2]
  Status: ⬜ READY / 🔵 IN PROGRESS / ✅ DONE / 🟡 BLOCKED
  Blocker (if any): [DESCRIBE]

TRACK B: Monitoring & Observability
  Owner: [NAME] ← [EMAIL] | [PHONE]
  Team: [DevOps person]
  Status: ⬜ READY / 🔵 IN PROGRESS / ✅ DONE / 🟡 BLOCKED
  Blocker (if any): [DESCRIBE]

TRACK C: Team & Operational Readiness
  Owner: [CTO NAME] ← [EMAIL] | [PHONE]
  Team: [Support lead], [Product lead]
  Status: ⬜ READY / 🔵 IN PROGRESS / ✅ DONE / 🟡 BLOCKED
  Blocker (if any): [DESCRIBE]

TRACK D: Security & Compliance
  Owner: [SECURITY NAME] ← [EMAIL] | [PHONE]
  Team: [Security engineer]
  Status: ⬜ READY / 🔵 IN PROGRESS / ✅ DONE / 🟡 BLOCKED
  Blocker (if any): [DESCRIBE]

TRACK E: Payment Safety
  Owner: [PAYMENT NAME] ← [EMAIL] | [PHONE]
  Team: [Finance lead], [Backend engineer for payment logic]
  Status: ⬜ READY / 🔵 IN PROGRESS / ✅ DONE / 🟡 BLOCKED
  Blocker (if any): [DESCRIBE]

QA LEAD: [NAME] ← [EMAIL] | [PHONE] (Smoke tests, load tests)
ON-CALL PRIMARY: [NAME] ← [EMAIL] | [PHONE] (Launch day monitoring)
ON-CALL BACKUP: [NAME] ← [EMAIL] | [PHONE] (Launch day backup)
```

---

---

## 🎯 Success Criteria: Complete Launch

### Code is Production-Ready ✅
- ✅ 0 TypeScript errors (`npx tsc --noEmit`)
- ✅ 0 build errors (frontend + backend)
- ✅ 9/9 critical path tests passing
- ✅ Idempotency keys preventing double-charges
- ✅ No hardcoded secrets in git

### Infrastructure is Provisioned ✅
- ✅ Staging AND production PostgreSQL, Redis, Node.js online
- ✅ SSL certificates installed (staging + production)
- ✅ Load balancers operational (health checks passing)
- ✅ Automated backups enabled + restore tested
- ✅ Environment variables in vault (not in git)

### Monitoring is Active ✅
- ✅ Sentry error tracking working (stage + prod)
- ✅ APM metrics flowing (latency, traces, slow queries)
- ✅ Dashboards created + auto-refreshing
- ✅ Alerts configured + tested (emails, Slack, PagerDuty)
- ✅ Health check endpoint `/health` responds 200

### Team is Prepared ✅
- ✅ All 7 roles assigned + committed
- ✅ Runbook reviewed + walkthrough completed
- ✅ Incident response escalation documented
- ✅ Support team trained + has Sentry access
- ✅ On-call primary + backup briefed

### Security is Hardened ✅
- ✅ OWASP Top 10 checklist (all 14 items verified)
- ✅ Rate limiting enabled (5 attempts/min on /auth/login)
- ✅ CORS restricted (FRONTEND_URL only, no `*`)
- ✅ Password hashing (bcrypt 12+ rounds)
- ✅ Encryption enabled (HTTPS everywhere)

### Payments are Safe ✅
- ✅ Stripe live API keys configured (not test keys)
- ✅ Webhook endpoint registered + tested
- ✅ Friction detection rules configured
- ✅ Idempotency keys preventing double-charging
- ✅ Refund flow tested end-to-end

### Testing is Complete ✅
- ✅ 8/8 smoke tests passing (staging)
- ✅ Load test complete (100+ concurrent users, breaking point identified)
- ✅ Backup/restore tested (RTO < 1 hour)
- ✅ Database migrations tested on production clone
- ✅ Incident response drill completed successfully

### Sign-Offs Obtained ✅
- ✅ CTO sign-off (code, architecture, security)
- ✅ DevOps sign-off (infrastructure, backups, monitoring)
- ✅ Security sign-off (OWASP, encryption, audit logs)
- ✅ Payment sign-off (Stripe, fraud detection, refunds)
- ✅ QA sign-off (smoke tests, load tests, no blockers)
- ✅ Product sign-off (feature complete, ready for users)

**When ALL sign-offs obtained → 🚀 LAUNCH**

---

---

## 📚 Reference Documents

All referenced documents created or updated during V5 launch:

| Document | Purpose | Owner | Location |
|----------|---------|-------|----------|
| **docs/DEPLOYMENT_PROCEDURES.md** | Step-by-step staging + production deployment | DevOps | already exists |
| **docs/PRE_LAUNCH_CHECKLIST.md** | 10-phase comprehensive verification checklist | QA/CTO | already exists |
| **docs/SMOKE_TEST_GUIDE.md** | 8 critical smoke test scenarios (20-30 min each) | QA | already exists |
| **V4_TODO.md** | Sprint 8 + pre-deployment checklist | CTO | updated today |
| **V5_LAUNCH_BACKLOG.md** | This document — detailed launch roadmap | CTO | created today |
| **RUN BOOK** | Incident response procedures (escalation, recovery, postmortem) | CTO + Ops | To be created |
| **OWNER_ASSIGNMENTS.md** | Track owner contact info + responsibilities | HR/CTO | To be created |
| **PHASE_1_SIGN_OFF.md** | Evidence that Phase 1 complete (by Mar 8) | CTO | To be created |
| **PHASE_2_SIGN_OFF.md** | Evidence that Phase 2 complete (by Mar 15) | QA | To be created |
| **PHASE_4_SIGN_OFF.md** | Evidence that Phase 4 complete (by Mar 28) | CTO | To be created |
| **LAUNCH_DAY_LOG.md** | Real-time log of launch day events (9 AM - 12 PM) | DevOps | To be created (Apr 1) |

---

---

## 🎓 Training Materials to Create

Before team starts Phase 1:

1. **Runbook Training (30 min video)**
   - How to deploy code
   - How to respond to incidents
   - How to escalate  
   - How to rollback

2. **Monitoring Dashboard Training (20 min)**
   - Where to find Sentry
   - How to read error traces
   - Where to find APM
   - How to decode latency metrics

3. **On-Call Training (45 min)**
   - How to get paged
   - How to respond to page
   - How to coordinate with team
   - How to execute runbook

4. **Support FAQ (30 min)**
   - 10 common customer issues
   - How to troubleshoot each
   - When to escalate

---

---

## Final Notes

✅ **V5 Launch Backlog complete.** This document serves as the source of truth for all launch activities from Feb 26 → Apr 1.

**Next Steps:**
1. Assign all 7 owners (Track A-E + QA + on-call primary/backup)
2. Email all owners with their track's detailed tasks
3. Schedule Feb 26 kickoff meeting (1 hour, all owners + CTO)
4. Post V5_LAUNCH_BACKLOG.md in team Slack / wiki
5. Create weekly sync calendar event (every Tuesday, 9 AM until Apr 1)

**By Apr 1, 2026:**
- 113 tasks complete
- 6 sign-offs obtained
- 0 critical blockers
- 🚀 **Ilu Àṣẹ LIVE**

---

**Version:** V5.1 (Feb 26, 2026)  
**Last Updated:** Feb 26, 2026  
**Status:** Ready to execute  
**Deployment Readiness:** 71% (code + docs ready, infrastructure TBD)
