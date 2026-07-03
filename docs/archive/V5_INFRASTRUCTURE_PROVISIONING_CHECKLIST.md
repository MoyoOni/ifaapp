# 🛠️ Infrastructure Provisioning Checklist & Scripts

**Phase 1 Task:** Track A-1 (Infrastructure Lead / DevOps)  
**Deadline:** Mar 8, 2026 (staging environment)  
**Purpose:** Provision cloud infrastructure for staging and production environments

---

## 📋 Infrastructure Overview

```
STAGING ENVIRONMENT (Feb 28 - Mar 8)
├─ PostgreSQL 16 database
│  ├─ Max connections: 30 (staging is lower)
│  └─ Backup: Daily snapshots
├─ Redis 7 cache
│  ├─ Memory: 1 GB
│  └─ Persistence: Enabled
├─ Node.js 20 application servers (2 instances)
│  ├─ CPU: 1 core / instance
│  └─ Memory: 1 GB / instance
└─ Load balancer (optional, but recommended)
   └─ SSL/TLS termination

PRODUCTION ENVIRONMENT (Mar 20-28)
├─ PostgreSQL 16 database (HA cluster)
│  ├─ Max connections: 100
│  ├─ Write replica for backups
│  ├─ Backup: Hourly snapshots + weekly archive
│  └─ Recovery: <5 minutes RTO, <1 minute RPO
├─ Redis 7 cluster (3 nodes)
│  ├─ Memory: 4 GB total
│  ├─ Replication enabled
│  └─ Data persistence: AOF + RDB
├─ Node.js 20 application servers (3-5 instances)
│  ├─ Auto-scaling: 2-10 instances based on CPU
│  ├─ CPU: 2 cores / instance
│  └─ Memory: 2 GB / instance
├─ CDN for assets (CloudFront or similar)
│  └─ Caching: 1 hour TTL
├─ Load balancer (managed)
│  ├─ Health checks: Every 10 seconds
│  ├─ Timeout: 30 seconds
│  └─ Sticky sessions: Enabled for WebSocket
└─ Monitoring & logging
   ├─ Sentry for error tracking
   ├─ CloudWatch/Datadog for metrics
   ├─ ELK stack for logs
   └─ On-call alerting
```

---

## Prerequisites

Before provisioning, you need:

### Cloud Account Setup
- [ ] AWS account (or GCP/Azure)
- [ ] AWS IAM user with permissions:
  - EC2 (launch instances)
  - RDS (create databases)
  - ElastiCache (create Redis)
  - Route53 (DNS management)
  - S3 (backups)
- [ ] AWS CLI installed locally: `aws configure`
- [ ] Terraform installed (optional, for IaC approach)

### Domain & SSL
- [ ] Domain: `ilu-ase.com` (production)
- [ ] Domain: `staging.ilu-ase.com` (staging)
- [ ] SSL certificate (wildcard for `*.ilu-ase.com`)
- [ ] Option 1: AWS Certificate Manager (free, but AWS-only)
- [ ] Option 2: Let's Encrypt (free, domain must be public)

### Team Access
- [ ] Each team member has AWS access
- [ ] GitHub secrets configured for CI/CD
- [ ] Slack webhook for alerts

---

## Phase 1A: Staging Environment (Feb 28 - Mar 8)

### ✅ Checklist: PostgreSQL 16

**AWS RDS Console:**
1. Click **Create database**
2. Choose **PostgreSQL**
3. Configure:
   - **DB instance identifier:** `ilu-ase-staging`
   - **PostgreSQL version:** 16.1 (latest 16)
   - **Instance class:** `db.t3.small` (staging is small)
   - **Storage:** 20 GB gp3
   - **VPC:** Default (or create new staging VPC)
   - **Publicly accessible:** No (security best practice)

4. **Network & Security:**
   - [ ] Security group allows port 5432 from app servers only
   - [ ] Multi-AZ: No (staging doesn't need HA)
   - [ ] Backup retention: 7 days

5. **Advanced options:**
   - [ ] Database name: `ilu_ase_staging`
   - [ ] Master username: `postgres_admin`
   - [ ] Master password: [Generate 32-char random] → Store in AWS Secrets Manager
   - [ ] Backup window: 03:00 UTC daily

6. Click **Create database** → wait 10-15 minutes

**Verification:**
```bash
# Once RDS is created, get endpoint from AWS console
# Format: ilu-ase-staging.c1234567890.us-east-1.rds.amazonaws.com

# Test connection from app server
psql -h ilu-ase-staging.c1234567890.us-east-1.rds.amazonaws.com \
     -U postgres_admin \
     -d ilu_ase_staging \
     -c "SELECT version();"

# Expected: PostgreSQL 16.1 output
```

**Actions:**
- [ ] Database created
- [ ] Master password stored in AWS Secrets Manager
- [ ] Connection verified from app server
- [ ] Backup schedule confirmed

---

### ✅ Checklist: Redis 7 (ElastiCache)

**AWS ElastiCache Console:**
1. Click **Create cluster**
2. Configure:
   - **Engine:** Redis
   - **Version:** 7.0.x (latest 7)
   - **Node type:** `cache.t3.small` (staging)
   - **Num replicas:** 0 (staging, cost optimization)
   - **Data tiering:** Disabled (small cache)
   - **Name:** `ilu-ase-staging`
   - **Parameter group:** default.redis7

3. **Network & Security:**
   - [ ] VPC: Same as RDS
   - [ ] Subnet group: Create new staging subnet group
   - [ ] Security group: Allow port 6379 from app servers

4. **Advanced options:**
   - [ ] Automatic failover: Disabled (single node)
   - [ ] Multi-AZ: Disabled (staging)
   - [ ] Automated backups: Enabled (daily)
   - [ ] Backup retention: 5 days

5. Click **Create cluster** → wait 5-10 minutes

**Verification:**
```bash
# Get endpoint from AWS console
# Format: ilu-ase-staging.1a2b3c.ng.0001.use1.cache.amazonaws.com:6379

# Test connection
redis-cli -h ilu-ase-staging.1a2b3c.ng.0001.use1.cache.amazonaws.com \
          -p 6379 \
          PING

# Expected: PONG
```

**Actions:**
- [ ] Cache cluster created
- [ ] Connection verified from app server
- [ ] Backup schedule confirmed

---

### ✅ Checklist: EC2 Application Servers

**AWS EC2 Console:**

**Option A: Manual (Faster for staging)**

1. Click **Launch instances**
2. Configure:
   - **Name:** `ilu-ase-staging-app-1`
   - **AMI:** Ubuntu 24.04 LTS (or Amazon Linux 2)
   - **Instance type:** `t3.small` (staging)
   - **VPC:** Same as RDS/Redis
   - **Subnet:** Public (for staging only; don't expose production)
   - **Security group:** Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (app)

3. **Key pair:**
   - [ ] Create or use existing key pair
   - [ ] Download `.pem` file (keep safe)
   - [ ] Store in GitHub Secrets for CI/CD

4. **User data script** (optional, speeds up setup):
   ```bash
   #!/bin/bash
   set -e
   
   # Update system
   sudo apt-get update
   sudo apt-get upgrade -y
   
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   
   # Install Docker (for containerized deployments)
   sudo apt-get install -y docker.io
   sudo usermod -aG docker ubuntu
   
   # Install other essentials
   sudo apt-get install -y git curl wget
   
   echo "EC2 setup complete"
   ```

5. Click **Launch instances** → wait 2-3 minutes

6. SSH into instance:
   ```bash
   ssh -i your-key.pem ubuntu@<public-ip>
   
   # Verify Node.js installed
   node --version  # Should be v20.x
   npm --version
   ```

**Option B: Infrastructure as Code (IaC with Terraform)**

Create `terraform/staging.tf`:
```hcl
# RDS PostgreSQL
resource "aws_db_instance" "staging" {
  allocated_storage    = 20
  db_name              = "ilu_ase_staging"
  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = "db.t3.small"
  username             = "postgres_admin"
  password             = var.db_password
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "ilu-ase-staging-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
}

# Redis ElastiCache
resource "aws_elasticache_cluster" "staging" {
  cluster_id           = "ilu-ase-staging"
  engine               = "redis"
  node_type           = "cache.t3.small"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis7"
  engine_version      = "7.0"
  port                = 6379
}

# EC2 Instance
resource "aws_instance" "app" {
  ami            = "ami-0c55b159cbfafe1f0"  # Ubuntu 24.04 LTS
  instance_type  = "t3.small"
  key_name       = var.key_pair_name
  
  user_data = file("${path.module}/user-data.sh")
  
  tags = {
    Name = "ilu-ase-staging-app-1"
  }
}

output "db_endpoint" {
  value = aws_db_instance.staging.endpoint
}

output "cache_endpoint" {
  value = aws_elasticache_cluster.staging.cache_nodes[0].address
}

output "app_public_ip" {
  value = aws_instance.app.public_ip
}
```

Apply Terraform:
```bash
cd terraform
terraform plan  # Review changes
terraform apply # Create resources
```

**Actions:**
- [ ] PostgreSQL created and accessible
- [ ] Redis created and accessible
- [ ] EC2 instance(s) created and SSH-able
- [ ] All endpoints documented

---

### ✅ Checklist: Deploy Application

SSH into EC2 instance:

```bash
# 1. Clone repository
git clone https://github.com/your-org/ifa_app.git
cd ifa_app

# 2. Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Create environment file
cat > backend/.env.staging << EOF
NODE_ENV=staging
DATABASE_URL="postgresql://postgres_admin:${DB_PASSWORD}@ilu-ase-staging.xxx.rds.amazonaws.com:5432/ilu_ase_staging?sslmode=require"
REDIS_URL="redis://ilu-ase-staging.xxx.cache.amazonaws.com:6379"
JWT_SECRET="$(openssl rand -base64 32)"
STRIPE_API_KEY_TEST="sk_test_..."
STRIPE_WEBHOOK_SECRET_TEST="whsec_..."
SENTRY_DSN_BACKEND="https://key@sentry.io/project-id"
LOG_LEVEL="debug"
DEMO_MODE=false
EOF

# 4. Run database migrations
cd backend
npm run prisma:migrate:deploy
cd ..

# 5. Build frontend
cd frontend
npm run build
cd ..

# 6. Start applications with PM2
npm install -g pm2

pm2 start backend/dist/main.js --name "ilu-ase-backend" --env staging
pm2 start "npm run preview" --cwd frontend --name "ilu-ase-frontend"
pm2 save  # Persist on reboot
pm2 startup  # Auto-start on EC2 reboot

# 7. Verify running
pm2 list
pm2 logs ilu-ase-backend

# 8. Test health endpoint
curl http://localhost:3000/health
# Expected: { "status": "ok" }
```

**Actions:**
- [ ] Code cloned
- [ ] Dependencies installed
- [ ] `.env` configured with RDS/Redis endpoints
- [ ] Database migrated
- [ ] Frontend built
- [ ] PM2 running both services
- [ ] Health check passes

---

### ✅ Checklist: Load Balancer & DNS (Staging)

**AWS Load Balancer:**
1. Go to **EC2 > Load Balancers**
2. Click **Create Load Balancer**
3. Choose **Network Load Balancer** (faster for real-time) or **Application Load Balancer** (better for HTTP)
4. Configure:
   - **Name:** `ilu-ase-staging-lb`
   - **Scheme:** Internet-facing
   - **IP address type:** IPv4

5. **Network mapping:**
   - [ ] VPC: staging VPC
   - [ ] Availability zones: Select 2 AZs

6. **Security groups:**
   - [ ] Allow 80 (HTTP) and 443 (HTTPS) from 0.0.0.0/0
   - [ ] Allow 3000 from LB security group

7. **Target groups:**
   - Create new target group: `ilu-ase-staging-targets`
   - **Protocol:** HTTP, port 3000
   - **Health checks:** `/health` path, 10s interval

8. **Register targets:**
   - [ ] Add EC2 instance(s)

9. Click **Create** → wait 5 minutes

**DNS Configuration:**
1. Go to **Route53**
2. Create **A record:**
   - **Name:** `staging.ilu-ase.com`
   - **Type:** A
   - **Alias:** Yes → select Load Balancer
3. Create **AAAA record** (IPv6, optional)

**Actions:**
- [ ] Load balancer created
- [ ] EC2 instances registered as targets
- [ ] Health checks passing
- [ ] DNS record created
- [ ] Test: `curl https://staging.ilu-ase.com` → 200 OK

---

## Phase 3: Production Environment (Mar 20-28)

### ⚠️ CRITICAL: Only after staging is verified

**Prerequisites for Production:**
- ✅ All staging tests passed
- ✅ Security audit passed (including this checklist)
- ✅ CTO approval
- ✅ Finance/legal approved payment terms
- ✅ Incident response team trained

---

### ✅ Checklist: Production PostgreSQL (HA Cluster)

**AWS RDS Console:**
1. **Create primary instance:**
   - **DB instance identifier:** `ilu-ase-prod`
   - **Instance class:** `db.r5.large` (production-grade)
   - **Storage:** 100 GB gp3 (production workload)
   - **Multi-AZ:** Yes (automatic failover)
   - **Backup retention:** 30 days
   - **Backup window:** 02:00 UTC (off-peak)
   - **Copy backups to another region:** Yes (disaster recovery)

2. **Enhanced monitoring:**
   - [ ] Enable Enhanced Monitoring
   - [ ] Monitoring interval: 1 minute
   - [ ] Log types: PostgreSQL error log, slow query log

3. **Performance Insights:**
   - [ ] Enable (costs extra, but invaluable for troubleshooting)

4. **Wait for instance to stabilize** (you'll see "available" status)

5. **Create read replica** (for backups without downtime):
   - **Source:** ilu-ase-prod (primary)
   - **Instance class:** `db.r5.large`
   - **Multi-AZ:** Yes
   - **Name:** `ilu-ase-prod-replica`

**Verification:**
```bash
# Test connection
psql -h ilu-ase-prod.xxx.rds.amazonaws.com \
     -U postgres_admin \
     -d ilu_ase_staging \
     -c "SELECT server_version, pg_is_wal_replay_paused();"

# Expected: Version 16.1, is_wal_replay_paused = false
```

**Actions:**
- [ ] Primary database created
- [ ] Multi-AZ enabled
- [ ] Read replica created
- [ ] Backups to another region enabled
- [ ] Enhanced monitoring enabled

---

### ✅ Checklist: Production Redis Cluster

**AWS ElastiCache Console:**
1. **Create Redis cluster:**
   - **Engine:** Redis (Cluster mode enabled)
   - **Node type:** `cache.r6g.xlarge` (production)
   - **Number of shards:** 3 (for high availability)
   - **Replicas per shard:** 1 (automatic failover)
   - **Name:** `ilu-ase-prod`

2. **Advanced settings:**
   - [ ] Automatic failover: Enabled
   - [ ] Data tiering: Disabled (unless you have >100GB data)
   - [ ] Automated backups: Enabled (daily)
   - [ ] Backup retention: 30 days

3. **Cluster mode:**
   - [ ] Enabled (allows horizontal scaling)

**Verification:**
```bash
# Test connection
redis-cli -h ilu-ase-prod.xxx.cache.amazonaws.com \
          -p 6379 \
          CLUSTER INFO

# Expected: cluster_state:ok
```

**Actions:**
- [ ] Cluster created with 3 shards
- [ ] Automatic failover enabled
- [ ] Connection verified
- [ ] Backups configured

---

### ✅ Checklist: Production EC2 (Auto-Scaling)

**AWS Auto Scaling:**
1. Create **Launch template:**
   - **Name:** `ilu-ase-prod-template`
   - **AMI:** Ubuntu 24.04 LTS
   - **Instance type:** `t3.large` (production)
   - **Key pair:** Production key pair
   - **Security group:** Allow 22, 80, 443, 3000
   - **User data:** See staging (Node.js, PM2, Docker)

2. Create **Auto Scaling group:**
   - **Name:** `ilu-ase-prod-asg`
   - **Launch template:** ilu-ase-prod-template
   - **Min instances:** 3
   - **Desired:** 5
   - **Max:** 10
   - **Health check:** ELB, 300s grace period

3. Create **scaling policies:**
   - **Scale up:** When CPU > 70% for 2 minutes → add 1 instance
   - **Scale down:** When CPU < 20% for 5 minutes → remove 1 instance

**Verification:**
```bash
# Check ASG status
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names ilu-ase-prod-asg

# Expected: 3-5 instances running across AZs
```

**Actions:**
- [ ] Launch template created
- [ ] Auto Scaling group created (3-10 instances)
- [ ] Scaling policies configured
- [ ] Instances healthy in Load Balancer

---

### ✅ Checklist: Production Load Balancer & SSL

**AWS Load Balancer:**
1. Create **Application Load Balancer:**
   - **Name:** `ilu-ase-prod-lb`
   - **Scheme:** Internet-facing
   - **VPC:** Production VPC

2. **Listeners:**
   - [ ] HTTP (port 80) → Redirect to HTTPS
   - [ ] HTTPS (port 443) → Forward to target group

3. **SSL Certificate:**
   - Option A: **AWS Certificate Manager** (free)
     - Request certificate for `ilu-ase.com` and `*.ilu-ase.com`
     - Verify domain ownership
   - Option B: **Import certificate** (if using external cert)

4. **Target group:**
   - **Name:** `ilu-ase-prod-targets`
   - **Protocol:** HTTP, port 3000
   - **Health check:** `/health` path, 10s interval, 3 healthy checks to mark healthy

5. **Security headers** (ALB rules):
   - [ ] X-Content-Type-Options: nosniff
   - [ ] X-Frame-Options: DENY
   - [ ] X-XSS-Protection: 1; mode=block
   - [ ] Strict-Transport-Security: max-age=31536000

6. **Register targets:**
   - [ ] Add Auto Scaling group as target

**Actions:**
- [ ] Load Balancer created (internet-facing)
- [ ] SSL certificate provisioned
- [ ] HTTP → HTTPS redirect enabled
- [ ] Security headers configured
- [ ] Health checks passing on all instances

---

### ✅ Checklist: Production DNS & CDN

**Route53 (DNS):**
1. Create **A record:**
   - **Name:** `ilu-ase.com`
   - **Type:** A (alias)
   - **Target:** Load Balancer
2. Create **AAAA record** (IPv6)
3. Create **MX record** (if using Route53 for email)
4. Create **TXT record:** SPF, DKIM, DMARC (for email)

**CloudFront (CDN):**
1. **Create distribution:**
   - **Origin:** Load Balancer DNS
   - **Cache behavior:** 1-hour TTL for assets (JS, CSS, images)

2. **Behaviors by path:**
   - `/api/*` → No caching, forward all headers
   - `/ws*` → No caching (WebSocket, no CDN)
   - `/*.{js,css,woff2}` → Cache 1 hour
   - `/` → Cache 5 minutes (index.html, could change)

3. **SSL/TLS:**
   - [ ] Use ACM certificate
   - [ ] Minimum SSL version: TLSv1.2_2021-06

**Actions:**
- [ ] DNS records created (A, AAAA, MX, TXT)
- [ ] CDN distribution created
- [ ] Cache behaviors configured
- [ ] Test: `curl -I https://ilu-ase.com` → 200 OK header

---

### ✅ Checklist: Monitoring & Logging

**CloudWatch (AWS monitoring):**
1. **Create dashboard:**
   - [ ] RDS CPU, memory, connections
   - [ ] ElastiCache CPU, network
   - [ ] EC2 CPU, disk, network per instance
   - [ ] ALB request count, latency, error rates
   - [ ] Application error rate (from Sentry)

2. **Create alarms:**
   - [ ] RDS CPU > 80% → Slack alert
   - [ ] RDS connections > 80 → Slack alert
   - [ ] ALB 5xx errors > 1% → Slack + CTO
   - [ ] Disk usage > 80% → Slack alert
   - [ ] Application errors in Sentry > 10/min → Slack + team

3. **Log groups:**
   - [ ] Create: `/ilu-ase/backend`
   - [ ] Create: `/ilu-ase/frontend`
   - [ ] Retention: 30 days

**Sentry (Error tracking):**
1. Create Sentry project for production
2. Get DSN: `https://key@sentry.io/project-id`
3. Add to backend `.env.production`
4. Add to frontend `.env.production`
5. Create Sentry alert: Errors > 10/hour → Slack

**Actions:**
- [ ] CloudWatch dashboard created
- [ ] Alarms configured (5+)
- [ ] Log groups created
- [ ] Sentry production project created
- [ ] Sentry alerts routed to Slack

---

## 🔐 Security Checklist (Phase 3)

Before going live, verify infrastructure security:

- [ ] **RDS:** Multi-AZ, backup retention 30 days, no public accessibility
- [ ] **Redis:** Encryption at rest (using S3 for backup), encryption in transit (TLS)
- [ ] **EC2:** Security groups restrict to LB only (no direct internet)
- [ ] **ALB:** Security headers set, SSL enforced, WAF rules (if budget allows)
- [ ] **DNS:** SSL certificate valid, DNSSEC enabled (optional)
- [ ] **IAM:** Least privilege, no root account used, MFA enabled
- [ ] **Backups:** Automated, tested restoration, stored in separate region
- [ ] **Logging:** All access logged, log retention 90 days

---

## 📋 Infrastructure Sign-Off Checklist

### Staging (by Mar 8):
- [ ] PostgreSQL 16 created and accessible
- [ ] Redis 7 created and accessible
- [ ] EC2 instance(s) running Node.js 20
- [ ] Application deployed and healthy
- [ ] Load Balancer routing traffic
- [ ] DNS resolving to LB
- [ ] Database migrations complete
- [ ] SSL certificate valid
- [ ] Monitoring dashboards created
- [ ] Backups scheduled

### Production (by Mar 28):
- [ ] PostgreSQL 16 HA cluster deployed
- [ ] Redis cluster deployed (3 shards)
- [ ] EC2 Auto Scaling group running (3-10 instances)
- [ ] Load Balancer configured with SSL
- [ ] CDN distribution live
- [ ] DNS records verified
- [ ] CloudWatch monitoring active
- [ ] Sentry alerts working
- [ ] On-call rotation setup
- [ ] Disaster recovery tested (RTO < 5 min)

---

## 🚀 Next Steps

1. **Feb 27:** Get AWS access + IAM user created
2. **Feb 28:** Provision staging PostgreSQL + Redis
3. **Mar 1:** Deploy application to staging EC2
4. **Mar 5:** Smoke tests on staging (8 scenarios)
5. **Mar 8:** Staging environment fully validated
6. **Mar 20:** Provision production infrastructure (if approved)
7. **Mar 25:** Final production testing
8. **Mar 28:** Ready for launch

---

**Document Version:** 1.0  
**Created:** February 27, 2026  
**Status:** ⬜ READY TO EXECUTE  
**Owner:** [Infrastructure Lead / DevOps]  
**Last Updated:** February 27, 2026
