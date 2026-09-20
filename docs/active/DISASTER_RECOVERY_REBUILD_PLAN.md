# Disaster Recovery — Ìlú Àṣẹ Production

**Status as of September 15, 2026: site is back up.** This document originally assumed a from-scratch infrastructure rebuild (see "Superseded plan" at the bottom for the record). That assumption turned out to be wrong once the real architecture was found — see below. What's left is much smaller: confirm database connectivity, fix an active rate-limit issue, and deploy this session's code fixes.

---

## 0. What actually happened (reconstructed September 14–15, 2026)

**The account was suspended for non-payment, then reinstated.** That's confirmed directly from the account owner. What wasn't obvious until investigated: this did **not** wipe a live ECS/ALB/Multi-AZ-RDS/ElastiCache production environment. That architecture — the one `docs/active/AWS_SETUP_GUIDE.md` describes — was already retired months earlier:

- **RDS, ElastiCache, and the ALB are gone** — confirmed deleted, not stopped.
- The only RDS snapshot that exists is `iluase-prod-final-snapshot-20260325`, a **manual "final" snapshot** — the kind AWS creates when an instance is deliberately deleted with a snapshot requested, not an automated backup.
- A separate EC2 instance, **`iluase-prod-single`** (`i-0ac1e9e2c4984af72`, t3.small, Ubuntu 22.04), was **launched March 25, 2026 — the same day as that RDS snapshot.**
- CloudFront's origin (distribution `EHB5M2I36BDVR`, still `Deployed`, aliases `iluase.com`/`www.iluase.com`) points directly at `iluase-prod-single`'s Elastic IP, not at any load balancer.
- The ECS log groups (`/ecs/iluase-prod/backend`, `/ecs/iluase-prod/frontend`) have **0 bytes ever logged** — the ECS/ALB setup may never have carried real production traffic before being replaced.

**Conclusion:** the ECS/ALB/Multi-AZ-RDS/ElastiCache architecture was deliberately retired on March 25, 2026, in favor of a single EC2 box behind CloudFront — presumably as a cost-cutting move (matches the cost gap the account owner flagged: the old architecture ran ~$225–300/month, wildly over what was sustainable). **`iluase-prod-single` has been real production since March**, not a fallback.

**What the recent suspension actually did:** stopped `iluase-prod-single`. CloudWatch metrics show it running with a steady ~2% CPU baseline through **August 18, 2026**, then no more data — it was stopped roughly then, consistent with the payment failure. AWS stopping (not terminating) an EC2 instance for non-payment is normal behavior; the EBS volume and its data survive a stop.

**September 15, 2026: `iluase-prod-single` was started again.** `https://iluase.com/` now returns HTTP 200. The site is up.

---

## 1. What's still actually unresolved

### 1.1 — Database connectivity (highest priority, unknown)
It's not established whether the app on `iluase-prod-single` connects to:
- **(a)** a self-hosted Postgres container on the box itself (in which case the deleted `iluase-prod-postgres` RDS instance is irrelevant — production has its own data on its own disk, undisturbed by any of the RDS/ElastiCache/ALB deletions), or
- **(b)** the external RDS endpoint `iluase-prod-postgres.c2n2u4k461ge.us-east-1.rds.amazonaws.com`, which **does not exist anymore** — in which case the app is running in degraded mode right now (frontend loads, anything touching the database silently fails or 503s) and needs the RDS restore (Section 3) before it's actually functional.

**Resolve this by SSHing into `iluase-prod-single` and checking its `docker-compose.yml`/env file for `DATABASE_URL`.** Nothing else in this plan can proceed sensibly until this is known — it changes whether Section 3 is needed at all.

### 1.2 — Active rate-limit issue (confirmed, ongoing)
`/api/health` (and by extension every route, since it shares a global "auth" throttle bucket — 10 req/min — with no per-route override) returned `429 RATE_LIMIT_EXCEEDED` on three checks spread over several minutes on September 15, with `retry-after-auth` not counting down to zero between checks. This means something is **continuously** consuming that bucket, not a one-time burst. Real users attempting to log in right now are very likely also being blocked by the same shared bucket.

**Needs:** SSH in, check backend container logs for what's repeatedly hitting auth-adjacent routes (real recovery traffic? a retry loop in the frontend? a bot?). A restart of the backend container clears the in-memory counter immediately as a stopgap, but won't fix a genuine ongoing cause.

### 1.3 — This box is running pre-audit code
None of this session's fixes (Paystack webhook raw-body signature verification, `JWT_EXPIRES_IN` honored instead of hardcoded `1h`, `POST /auth/logout` + token revocation, Redis-backed rate limiting, the `/api/health` google.com-ping removal, the `Dockerfile.production` fixes) are deployed here. Given 1.2 above, the Redis-backed rate limiter fix specifically is now more urgent than "nice to have" — though note it won't fix a genuine traffic/bot flood by itself, only make the limiting consistent.

---

## 2. Immediate action items, in order

1. **SSH into `iluase-prod-single`** (`ile-ase-key`), run `docker ps` and check the backend's env/compose config for `DATABASE_URL`. This answers 1.1.
2. **Check backend logs for the rate-limit cause** (1.2). Decide: legitimate traffic to let through, bug to fix, or bot to block.
3. Based on 1.1's answer:
   - **If self-hosted DB:** confirm it has automated backups of its own (does the box run `scripts/backup-db.sh` on a cron? check `crontab -l`). If not, set that up now — this is exactly the kind of gap that turns a stop/start incident into permanent data loss next time.
   - **If pointed at the deleted RDS:** proceed to Section 3 (RDS restore) before anything else — the app is silently broken until then.
4. **Deploy this session's fixes** to the box (git pull the commit from `july-2026-hardening-pass`/`main` — `cda2464` — and redeploy via however this box actually deploys; confirm the mechanism via step 1's `docker ps`/compose inspection, since it's not yet confirmed whether this box pulls prebuilt images from ECR or builds in place).
5. Once stable, update `docs/active/AWS_SETUP_GUIDE.md` to describe the real architecture (single EC2 + CloudFront) instead of the retired ECS/ALB/Multi-AZ-RDS one — it's actively misleading as written.

---

## 3. RDS restore — only if 1.1 comes back "(b), points at the deleted RDS"

```bash
aws rds describe-db-subnet-groups --db-subnet-group-name iluase-prod-subnet-group --region us-east-1
# if missing:
aws rds create-db-subnet-group \
  --db-subnet-group-name iluase-prod-subnet-group \
  --db-subnet-group-description "Ilu Ase production RDS subnet group" \
  --subnet-ids subnet-0e9abfd04b5fb760d subnet-0788046c003a849fb \
  --region us-east-1

aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier iluase-prod-postgres \
  --db-snapshot-identifier iluase-prod-final-snapshot-20260325 \
  --db-instance-class db.t3.micro \
  --db-subnet-group-name iluase-prod-subnet-group \
  --vpc-security-group-ids sg-0eafe56bfb33f646f \
  --no-publicly-accessible \
  --no-multi-az \
  --region us-east-1

aws rds wait db-instance-available --db-instance-identifier iluase-prod-postgres --region us-east-1

aws rds modify-db-instance \
  --db-instance-identifier iluase-prod-postgres \
  --backup-retention-period 7 \
  --deletion-protection \
  --apply-immediately \
  --region us-east-1
```

`db.t3.micro` single-AZ (not the original `db.t3.small` Multi-AZ) to match the actual budget — this app is running on a single `t3.small` EC2 box, a Multi-AZ managed database would be a mismatched, expensive part next to it. Then `cd backend && npx prisma migrate deploy` against the new endpoint, same as before — expect ~6 months of migrations to apply (March 25 → now), and the restored data itself to be from March 25, meaning anything after that date is genuinely gone regardless of what AWS Support says (see the still-open support case).

Point `iluase-prod-single`'s `DATABASE_URL` at the new RDS endpoint and restart the backend container.

---

## 4. Closed this session

- ✅ **CloudTrail was not configured at all** — this is why the original March 25 architecture change and the recent stop event had to be reconstructed from CPU metrics and launch timestamps instead of just reading a log. Fixed: multi-region trail `ilu-ase-prod-trail`, logging to a new private/encrypted bucket `ilu-ase-cloudtrail-logs-091653536932`, log-file validation on, actively logging as of September 15, 2026.
- ✅ **Billing alerts were checked, not actually a gap** — a Cost Budget ($50/month, both 85%/100% actual and 100% forecasted thresholds) already exists with real email subscribers. This incident was a payment-method failure, not overspending, which a cost budget doesn't catch — nothing to fix here, just worth knowing it wasn't the hole.
- ✅ **No automated backup of the self-hosted Postgres — fixed September 20, 2026.** Item 3's "confirm it has automated backups... if not, set that up now" from Section 2 above — it didn't, so it's now done: `scripts/backup-prod-db.sh` runs via cron every 6 hours on `iluase-prod-single`, dumping `iluase-postgres` and uploading to a dedicated private/encrypted/versioned S3 bucket (`ilu-ase-prod-db-backups-091653536932`, 90-day lifecycle). The box's IAM instance role (`iluase-ec2-ecr`, previously ECR-read-only only) got a scoped inline policy for exactly this bucket. Tested end-to-end — a real dump uploaded successfully during setup.

---

## 5. Open, needs a human

- **AWS Support case** (submitted September 14, 2026) — still useful for confirming the exact data-loss window and whether anything newer than the March 25 snapshot is recoverable, even though the outage itself is resolved.
- **Cost target (£25/month)** — once 1.1/1.3 are resolved, get a real cost read from the AWS Billing console with the actual running setup (single EC2 + CloudFront + maybe a small RDS) rather than estimating. Given the old $225–300/month architecture is confirmed retired, this should already be close to target — worth confirming with real numbers, not assuming.

---

## Superseded — original September 14 plan (kept for the record only)

The original version of this document, written before `iluase-prod-single` was found, assumed the ECS/ALB/Multi-AZ-RDS/ElastiCache architecture needed to be rebuilt from scratch (new ALB, new ECS task definitions/services, new ElastiCache cluster, RDS restored to `db.t3.small` Multi-AZ). **Do not follow that plan** — it would recreate the exact ~$225–300/month setup that was already deliberately abandoned for being too expensive, on top of infrastructure (`iluase-prod-single`) that's already doing the job. The full original text is preserved in this file's git history (see the commit that introduced `docs/active/DISASTER_RECOVERY_REBUILD_PLAN.md`) if any of its specific command syntax is useful for reference.
