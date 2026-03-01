# 👥 Owner Assignments & Contact Info

**Status:** V5 Launch Phase 1 Kickoff  
**Updated:** February 27, 2026  
**Purpose:** Single source of truth for who owns what during launch

---

## 🎯 7 Critical Roles

### TRACK A: Infrastructure Provisioning
**Responsible for:** PostgreSQL, Redis, Node.js, load balancers, networking, SSL, backups

```
Owner Name:           [ASSIGN: DevOps Lead or CTO]
Email:                [INSERT]
Phone:                [INSERT]
Slack:                @[INSERT]

Team Members:
  - [DevOps engineer 1]: database provisioning
  - [DevOps engineer 2]: compute + networking

Status:               ⬜ READY (start Feb 26)
Key Dates:
  - Feb 26-Mar 8:     Provision staging infrastructure
  - Mar 15-18:        Provision production infrastructure
  - Mar 22-27:        Monitor + troubleshoot

Contact Frequency:    Daily during provisioning, weekly sync Tuesdays 9 AM
Escalation Path:      → CTO if blocked, → CEO if critical blocker
```

---

### TRACK B: Monitoring & Observability
**Responsible for:** Sentry, APM, logging, dashboards, alerting

```
Owner Name:           [ASSIGN: DevOps Lead or SRE]
Email:                [INSERT]
Phone:                [INSERT]
Slack:                @[INSERT]

Team Members:
  - [DevOps engineer]: APM + logging setup
  - [SRE or backend lead]: dashboard creation

Status:               ⬜ READY (start Feb 26)
Key Dates:
  - Feb 26-Mar 8:     Set up Sentry, APM, dashboards (staging)
  - Mar 15-20:        Set up production monitoring
  - Mar 22-27:        Test + refine alerts

Contact Frequency:    Daily during setup, weekly sync Tuesdays 9 AM
Escalation Path:      → CTO if blocked, → DevOps lead for escalations
```

---

### TRACK C: Team & Operational Readiness
**Responsible for:** Runbook, team training, support, communication, incident response

```
Owner Name:           [ASSIGN: CTO or Director of Engineering]
Email:                [INSERT]
Phone:                [INSERT]
Slack:                @[INSERT]

Team Members:
  - [Support Lead]: support team training
  - [Product Lead]: launch announcement
  - [HR/Admin]: scheduling + coordination

Status:               ⬜ READY (start Feb 26)
Key Dates:
  - Mar 1:            Owner assignments finalized + emailed to team
  - Mar 5:            Runbook review meeting (2 hours)
  - Mar 6:            Support team training (1 hour)
  - Mar 24:           Runbook walkthrough with ops
  - Mar 25:           Incident response drill

Contact Frequency:    Daily coordination, weekly sync Tuesdays 9 AM
Escalation Path:      → CEO if team capacity issue, → CTO for decisions
```

---

### TRACK D: Security & Compliance
**Responsible for:** OWASP checklist, rate limiting, CORS, encryption, GDPR, audit logs

```
Owner Name:           [ASSIGN: Security Lead or Backend Lead]
Email:                [INSERT]
Phone:                [INSERT]
Slack:                @[INSERT]

Team Members:
  - [Security engineer]: OWASP audit
  - [Backend engineer]: rate limiting + encryption implementation

Status:               ⬜ READY (start Feb 26)
Key Dates:
  - Feb 27-Mar 8:     Complete OWASP checklist (staging)
  - Mar 18-20:        Security hardening (production)
  - Mar 23:           Final security audit
  - Mar 28:           Security sign-off

Contact Frequency:    Every 2-3 days during active work, weekly sync
Escalation Path:      → CTO if vulnerability found, → CEO if critical
```

---

### TRACK E: Payment Safety
**Responsible for:** Stripe integration, refunds, idempotency, fraud detection, PCI DSS, webhook

```
Owner Name:           [ASSIGN: Finance Lead or Backend Lead]
Email:                [INSERT]
Phone:                [INSERT]
Slack:                @[INSERT]

Team Members:
  - [Backend payment engineer]: Stripe webhook + refund logic
  - [Finance/Business]: Stripe account setup + fraud rules
  - [QA engineer]: payment flow testing

Status:               ⬜ READY (start Feb 26)
Key Dates:
  - Feb 27-Mar 8:     Stripe test setup + webhook testing
  - Mar 20-22:        Stripe production setup
  - Mar 28:           Payment sign-off

Contact Frequency:    Every 2-3 days during active work, weekly sync
Escalation Path:      → CTO if Stripe issue, → CEO if revenue-impacting bug
```

---

### QA Lead: Smoke Tests & Load Testing
**Responsible for:** 8 smoke test scenarios, load test execution, test reporting

```
Owner Name:           [ASSIGN: QA Lead or QA Engineer]
Email:                [INSERT]
Phone:                [INSERT]
Slack:                @[INSERT]

Status:               ⬜ READY (starts Mar 8 after deployment to staging)
Key Dates:
  - Mar 8:            Deploy code to staging
  - Mar 10-12:        Run 8 smoke tests (5 min each = 40 min total)
  - Mar 12-13:        Load test (100+ concurrent users)
  - Mar 13-14:        Backup/restore test
  - Mar 14:           Report sign-off document

Contact Frequency:    Every 2-3 days during testing, weekly sync
Escalation Path:      → QA manager if test fails, → CTO if blocker
```

---

### ON-CALL PRIMARY: Launch Day & Beyond
**Responsible for:** Real-time monitoring during launch (Apr 1), first responder to incidents

```
Owner Name:           [ASSIGN: CTO or Senior Backend Engineer]
Email:                [INSERT]
Phone:                [INSERT]
Slack:                @[INSERT]
PagerDuty:            [INSERT UID]

Availability:
  - Apr 1:            8 AM - 12 PM (launch day)
  - Apr 2-10:         On-call rotation (escalations)

Key Responsibilities:
  - Monitor Sentry + dashboard during launch
  - Page backup if critical incident
  - Execute rollback if needed
  - Communicate status to team

Contact Frequency:    Daily during launch week
Escalation Path:      Page backup → notify CTO → notify CEO if P0
```

---

### ON-CALL BACKUP: Launch Day & Beyond
**Responsible for:** Secondary responder, backup during incidents

```
Owner Name:           [ASSIGN: Senior DevOps or Backend Engineer]
Email:                [INSERT]
Phone:                [INSERT]
Slack:                @[INSERT]
PagerDuty:            [INSERT UID]

Availability:
  - Apr 1:            8 AM - 12 PM (launch day, standby)
  - Apr 2-10:         On-call rotation (backup)

Key Responsibilities:
  - Standby during launch
  - If paged: join incident channel immediately
  - Assist primary with diagnostics + recovery
  - Document incident for postmortem

Contact Frequency:    Daily during launch week
Escalation Path:      Alert primary → notify CTO → notify CEO if P0
```

---

## 📋 Master Contact Matrix

**Print this out or pin in Slack:**

| Role | Owner | Email | Phone | Slack | Status |
|------|-------|-------|-------|-------|--------|
| **Track A** (Infrastructure) | [NAME] | [EMAIL] | [PHONE] | @[USER] | ⬜ TODO |
| **Track B** (Monitoring) | [NAME] | [EMAIL] | [PHONE] | @[USER] | ⬜ TODO |
| **Track C** (Team) | [NAME] | [EMAIL] | [PHONE] | @[USER] | ⬜ TODO |
| **Track D** (Security) | [NAME] | [EMAIL] | [PHONE] | @[USER] | ⬜ TODO |
| **Track E** (Payments) | [NAME] | [EMAIL] | [PHONE] | @[USER] | ⬜ TODO |
| **QA Lead** | [NAME] | [EMAIL] | [PHONE] | @[USER] | ⬜ TODO |
| **On-Call Primary** | [NAME] | [EMAIL] | [PHONE] | @[USER] | ⬜ TODO |
| **On-Call Backup** | [NAME] | [EMAIL] | [PHONE] | @[USER] | ⬜ TODO |

---

## 🚨 Emergency Escalation Contacts

**Pin in Slack #incidents:**

```
CRITICAL INCIDENT (Error rate > 50% OR Payment system down):
  1. Page on-call primary immediately
  2. If no response in 5 min → page on-call backup
  3. If no response in 10 min → call CTO directly
  4. If no response → call CEO

Escalation Phone Numbers:
  CTO:               [PHONE]
  On-Call Primary:   [PHONE]
  On-Call Backup:    [PHONE]
  CEO:               [PHONE]
  Finance Lead:      [PHONE] (for payment emergencies)
```

---

## ✅ Owner Commitment Checklist

**When all roles assigned, have each owner confirm:**

- [ ] **Track A Owner**: "I commit to provision staging by Mar 8 and production by Mar 28"
- [ ] **Track B Owner**: "I commit to set up monitoring by Mar 8 and verify alerts work by Mar 20"
- [ ] **Track C Owner**: "I commit to run runbook review, support training, and launch communication"
- [ ] **Track D Owner**: "I commit to complete OWASP checklist and security hardening by Mar 28"
- [ ] **Track E Owner**: "I commit to set up Stripe (test + live) and verify payment safety by Mar 28"
- [ ] **QA Lead**: "I commit to run 8 smoke tests and load test by Mar 15"
- [ ] **On-Call Primary**: "I commit to monitor launch on Apr 1 and respond immediately to incidents"
- [ ] **On-Call Backup**: "I commit to standby on Apr 1 and assist with incidents"

---

## 📅 Weekly Check-In: Tuesdays 9 AM

**Every owner reports status (5 min each):**

```
TRACK A: Infrastructure provisioning — Green / Yellow / Red?
TRACK B: Monitoring setup — Green / Yellow / Red?
TRACK C: Team readiness — Green / Yellow / Red?
TRACK D: Security hardening — Green / Yellow / Red?
TRACK E: Payment safety — Green / Yellow / Red?
QA: Test readiness — Green / Yellow / Red?
```

**Decision:** Proceed to next phase, or pause + fix blockers?

---

## 🎯 Success Criteria: Owner Assignment DONE

- ✅ All 8 roles assigned + committed
- ✅ Contact info filled in above
- ✅ Commitments acknowledged by each owner
- ✅ Posted in Slack + team aware
- ✅ Emergency escalation contacts confirmed

By Feb 28: **Owner assignments 100% complete**

---

**Document Version:** 1.0  
**Created:** February 27, 2026  
**Status:** ⬜ AWAITING ASSIGNMENTS  
**Next:** Assign all 8 roles by end of day Feb 27
