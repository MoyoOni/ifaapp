# Launch Metrics & Alerting — Ilé Àṣẹ

**Target launch date:** April 1, 2026
**Owner:** Engineering / DevOps on-call
**Related:** [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md) · [DEPLOYMENT_PROCEDURES.md](DEPLOYMENT_PROCEDURES.md) · [SECRET_ROTATION.md](SECRET_ROTATION.md)

---

## 1. Launch Day Success Targets

These are the numbers we're watching from 9 AM on April 1. If any metric exceeds its threshold, escalate immediately per the on-call contacts below.

| Metric | Target | Alert Threshold | Where to Check |
|--------|--------|-----------------|----------------|
| **Error rate** | < 0.5% of requests | > 5 errors/minute | Sentry dashboard |
| **API p95 latency** | < 2 000 ms | > 3 000 ms sustained | `/api/health/detailed`, CloudWatch |
| **API p99 latency** | < 5 000 ms | > 8 000 ms | CloudWatch |
| **Signup success rate** | > 95% | < 90% | Sentry — filter by `POST /auth/register` |
| **Login success rate** | > 98% | < 95% | Sentry — filter by `POST /auth/login` |
| **Payment success rate** | > 98% | < 95% | Sentry — filter by `wallet`/`payment` events |
| **Health endpoint** | `{"status":"ok"}` | Any non-200 response | UptimeRobot |
| **DB connection count** | < 8 / 10 pool slots used | > 9 / 10 | CloudWatch RDS metrics |
| **Server CPU** | < 60% | > 80% sustained | CloudWatch EC2 |
| **Server memory** | < 70% | > 85% | CloudWatch EC2 |

---

## 2. Health Endpoint Reference

The primary launch-day health dashboard is `/api/health/detailed`.

**Quick check:**
```bash
curl https://app.ilu-ase.com/api/health
# Expected: {"status":"ok","timestamp":"2026-04-01T09:00:00.000Z"}

curl https://app.ilu-ase.com/api/health/detailed
# Expected: {"status":"ok","database":"connected","redis":"connected","timestamp":"..."}
```

**If `/api/health` returns non-200:** treat as P0 incident — escalate immediately.

---

## 3. Sentry Alert Rules

Configure these in the Sentry project settings before launch day.
**Path:** Sentry → Project → Alerts → Create Alert Rule

### Alert 1 — Error Rate Spike (P0)

| Field | Value |
|-------|-------|
| **Name** | `[PROD] Error rate spike` |
| **Condition** | Number of events > **5** in **5 minutes** |
| **Filter** | Environment: `production` |
| **Action** | Notify Slack `#on-call` channel + email on-call engineer |
| **Priority** | Critical |

### Alert 2 — Payment / Wallet Errors (P0)

| Field | Value |
|-------|-------|
| **Name** | `[PROD] Payment or wallet error` |
| **Condition** | Any new issue where title contains `wallet` OR `payment` OR `checkout` OR `transaction` |
| **Filter** | Environment: `production`, Level: `error` or `fatal` |
| **Action** | Notify Slack `#on-call` channel + page on-call engineer |
| **Priority** | Critical |

### Alert 3 — Auth Errors (P1)

| Field | Value |
|-------|-------|
| **Name** | `[PROD] Auth failure spike` |
| **Condition** | Number of events > **10** in **5 minutes** where URL contains `/auth/` |
| **Filter** | Environment: `production` |
| **Action** | Notify Slack `#on-call` channel |
| **Priority** | High |

### Alert 4 — New Fatal Issue (P1)

| Field | Value |
|-------|-------|
| **Name** | `[PROD] New fatal issue` |
| **Condition** | New issue with level `fatal` |
| **Filter** | Environment: `production` |
| **Action** | Notify Slack `#on-call` channel + email on-call |
| **Priority** | High |

**To configure in Sentry UI:**
1. Go to your Sentry project → **Alerts** → **Create Alert Rule**
2. Choose **Issues** (for new-issue alerts) or **Metrics** (for rate alerts)
3. Fill in the fields from the tables above
4. Set the notification integration to your Slack workspace and the `#on-call` channel
5. Save and verify with a test event

---

## 4. UptimeRobot Configuration

Set up a free monitor at [uptimerobot.com](https://uptimerobot.com) before launch.

| Field | Value |
|-------|-------|
| **Monitor type** | HTTP(S) |
| **Friendly name** | `Ilé Àṣẹ — Production Health` |
| **URL** | `https://app.ilu-ase.com/api/health` |
| **Monitoring interval** | Every 5 minutes |
| **Alert contacts** | on-call email + Slack webhook |

---

## 5. On-Call Contacts

| Role | Name | Phone | Slack handle |
|------|------|-------|--------------|
| **Primary on-call** | TBD | TBD | TBD |
| **Secondary on-call** | TBD | TBD | TBD |
| **CTO** | TBD | TBD | TBD |
| **Payment issues** | TBD | TBD | TBD |

> Update this table before launch. Keep a printed copy with the team on April 1.

---

## 6. Launch Day Monitoring Schedule

| Time (WAT) | Action |
|------------|--------|
| 08:30 | Open Sentry, CloudWatch, UptimeRobot dashboards |
| 09:00 | Deploy (merge v4/quality → main, CI/CD triggers) |
| 09:05 | Verify `/api/health` returns 200 |
| 09:10 | Complete one manual signup + login on production |
| 09:10–09:40 | Monitor dashboards — watch error rate, p95 latency, signups |
| 09:40 | If error rate < 0.5% and no P0 alerts → send launch announcement |
| 10:00 | Support team active, check-in every 30 min for 4 hours |
| 13:00 | End of launch-day intensive monitoring |
| 14:00 | Retrospective / debrief on launch day issues |

---

## 7. Escalation Decision Tree

```
Error rate > 5%?
  ├── YES → Is it a single endpoint?
  │           ├── YES → Check Sentry for root cause; hotfix or disable endpoint
  │           └── NO  → Full P0 incident; initiate rollback procedure
  └── NO  → Continue monitoring

Payment errors appearing?
  ├── YES → Idempotency key errors? → Check Transaction table for duplicates
  │         Webhook failures?       → Check Paystack/Flutterwave dashboard
  │         DB errors?              → Check RDS health and connection count
  └── NO  → Continue monitoring

Health endpoint returning non-200?
  ├── YES → Is the backend process running? (pm2 status)
  │         Is DB reachable? (psql ping)
  │         Restart backend? → pm2 reload ilu-ase-backend
  └── NO  → Continue monitoring
```

For rollback procedures, see [DEPLOYMENT_PROCEDURES.md — Rollback](DEPLOYMENT_PROCEDURES.md#rollback-procedures).
