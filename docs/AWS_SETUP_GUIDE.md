# AWS Setup Guide — Ilé Àṣẹ (ilu-ase.com)

**Application:** Ilé Àṣẹ — NestJS backend + React/Vite frontend
**Domain:** ilu-ase.com
**Last Updated:** March 13, 2026

## ✅ Staging Environment — LIVE (March 13, 2026)

| Resource | ID / Value |
|----------|-----------|
| EC2 Instance | `i-07990461d23b46ad4` — `t3.small`, Ubuntu 22.04 |
| Public IP | `100.52.200.113` |
| RDS | `ile-ase-staging.c2n2u4k461ge.us-east-1.rds.amazonaws.com` (Postgres 16, `db.t3.micro`) |
| S3 Backup Bucket | `ile-ase-staging-backups-091653536932` |
| IAM Role | `ile-ase-staging-ec2-role` → `ile-ase-staging-ec2-profile` |
| EC2 Security Group | `sg-07d1b138ef04d0632` (ports 22/80/443/3000/4040/8080) |
| RDS Security Group | `sg-06014a78d738484dc` (port 5432 from EC2 only) |
| VPC | `vpc-0493986bc3065411b` |
| Key Pair | `ile-ase-key` → `~\ile-ase-key.pem` |

**Access:**
```
ssh -i "~\ile-ase-key.pem" ubuntu@100.52.200.113
Frontend: http://100.52.200.113:4040
Backend:  http://100.52.200.113:8080/api/health
Swagger:  http://100.52.200.113:8080/api/docs
```

**Note:** SSH access is restricted to specific IPs. If SSH times out, your IP may have changed — run `(Invoke-WebRequest -Uri "https://checkip.amazonaws.com" -UseBasicParsing).Content.Trim()` and add your new IP to `sg-07d1b138ef04d0632` port 22.

---

This guide walks you through provisioning and configuring AWS infrastructure for two environments:
- **Staging** (~$50/month) — one EC2 instance, RDS Micro, Redis on-box
- **Production** (~$200/month) — EC2 Medium, RDS Small Multi-AZ, ElastiCache, ALB, Route53, ACM

Follow Part 1, then Part 2 (staging), then Part 3 (production). Do not skip staging — you will catch problems there before they hit production.

---

## Table of Contents

1. [Part 1: Prerequisites](#part-1-prerequisites)
2. [Part 2: Staging Environment](#part-2-staging-environment)
3. [Part 3: Production Environment](#part-3-production-environment)
4. [Part 4: After Both Environments Are Up](#part-4-after-both-environments-are-up)

---

## Part 1: Prerequisites

### 1.1 AWS Account and Billing Alarm

**Create the account:**

1. Go to https://aws.amazon.com and click **Create an AWS Account**
2. Complete sign-up with a credit card. Choose the **Basic (Free)** support plan.
3. Log in as the root user.

**Enable MFA on the root account (do this now, not later):**

1. Click the account name in the top-right corner → **Security credentials**
2. Under **Multi-factor authentication (MFA)** → **Assign MFA device**
3. Choose **Authenticator app**, follow the steps with Google Authenticator or 1Password

**Create a billing alarm so you are not surprised:**

1. Go to **Billing and Cost Management** → **Budgets** → **Create budget**
2. Choose **Use a template** → **Monthly cost budget**
3. Set **Budgeted amount** to `$75` (will alert at 80% = $60, before hitting your staging limit)
4. Enter your email → **Create budget**

**Create an IAM user for day-to-day work (do not use root for CLI):**

1. Go to **IAM** → **Users** → **Create user**
2. Username: `ile-ase-admin`
3. Check **Provide user access to the AWS Management Console** → **I want to create an IAM user**
4. Choose **Attach policies directly** → check **AdministratorAccess**
5. Click through to finish. Download the CSV with the login URL and credentials.
6. Log out of root. Log back in as `ile-ase-admin` using the console URL from the CSV.

### 1.2 AWS CLI v2

**Install on macOS:**

```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
aws --version
# aws-cli/2.x.x Python/3.x.x ...
```

**Install on Ubuntu/Debian:**

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version
```

**Configure the CLI:**

1. In the AWS console: **IAM** → **Users** → `ile-ase-admin` → **Security credentials** → **Create access key**
2. Choose **Command Line Interface (CLI)** → create and download the key

```bash
aws configure
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: <your secret>
# Default region name: us-east-1
# Default output format: json
```

Verify it works:

```bash
aws sts get-caller-identity
# Should print your account ID and user ARN
```

### 1.3 Create an EC2 Key Pair

You need this before launching any EC2 instance.

1. Go to **EC2** → **Key Pairs** (in the left sidebar under **Network & Security**)
2. Click **Create key pair**
3. Name: `ile-ase-key`
4. Key pair type: **RSA**
5. Private key file format: **.pem** (macOS/Linux) or **.ppk** if you use PuTTY
6. Click **Create key pair** — the `.pem` file downloads automatically

Save it somewhere safe and set permissions:

```bash
chmod 400 ~/Downloads/ile-ase-key.pem
# Move it to a permanent location
mv ~/Downloads/ile-ase-key.pem ~/.ssh/ile-ase-key.pem
```

---

## Part 2: Staging Environment

### Architecture

```
Internet → EC2 t3.small (Ubuntu 22.04)
              ├── nginx (port 80/443) → frontend static files from dist/
              ├── nginx → proxy /api/* to NestJS:3000
              ├── NestJS (PM2, port 3000)
              └── Redis (local, port 6379)
           ↓
         RDS db.t3.micro PostgreSQL 16 (Single-AZ)
           ↓
         S3 bucket (database backups)
```

All resources in `us-east-1` (N. Virginia).

---

### Step 2.1 — Check Your Default VPC

AWS creates a default VPC in each region. Use it for staging (no need to create a custom one).

```bash
aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text
# Returns something like: vpc-0abc1234def56789
```

Note that VPC ID — you will need it when creating security groups.

Get the subnet IDs (you need at least two for RDS, even though staging is single-AZ):

```bash
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=<YOUR-VPC-ID>" \
  --query "Subnets[*].[SubnetId,AvailabilityZone]" \
  --output table
```

Note two subnet IDs in different availability zones (e.g. `subnet-aaaa` in `us-east-1a` and `subnet-bbbb` in `us-east-1b`).

---

### Step 2.2 — Create Security Groups

You need two security groups: one for EC2, one for RDS.

**Security group for EC2 (staging):**

1. Go to **EC2** → **Security Groups** → **Create security group**
2. Name: `ile-ase-staging-ec2`
3. Description: `Staging EC2 - Ile Ase`
4. VPC: select the default VPC
5. **Inbound rules** — add these four:

   | Type | Protocol | Port | Source | Description |
   |------|----------|------|--------|-------------|
   | SSH | TCP | 22 | My IP | SSH access |
   | HTTP | TCP | 80 | 0.0.0.0/0 | HTTP (redirects to HTTPS) |
   | HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS |
   | Custom TCP | TCP | 3000 | My IP | Direct API access for testing |

6. Leave outbound as **All traffic → 0.0.0.0/0**
7. Click **Create security group**

**Security group for RDS (staging):**

1. **Create security group** again
2. Name: `ile-ase-staging-rds`
3. Description: `Staging RDS - Ile Ase`
4. VPC: default VPC
5. **Inbound rules** — one rule:

   | Type | Protocol | Port | Source | Description |
   |------|----------|------|--------|-------------|
   | PostgreSQL | TCP | 5432 | `ile-ase-staging-ec2` SG | From EC2 only |

   For "Source", select **Custom** and then start typing `ile-ase-staging-ec2` — the security group will appear in the dropdown. Select it.

6. Click **Create security group**

---

### Step 2.3 — Create the RDS Subnet Group

RDS requires a subnet group even for single-AZ. You only do this once per region.

1. Go to **RDS** → **Subnet groups** → **Create DB subnet group**
2. Name: `ile-ase-staging-subnet-group`
3. Description: `Staging subnet group`
4. VPC: default VPC
5. **Add subnets** — select all available subnets (check all Availability Zones and add all subnets shown)
6. Click **Create**

---

### Step 2.4 — Launch the Staging RDS Instance

1. Go to **RDS** → **Databases** → **Create database**
2. **Creation method:** Standard create
3. **Engine:** PostgreSQL — Version: **PostgreSQL 16.x** (pick the latest 16.x patch shown)
4. **Templates:** Free tier ← No, choose **Dev/Test** (free tier blocks some options we need)
5. **Settings:**
   - DB instance identifier: `ile-ase-staging`
   - Master username: `postgres_admin`
   - Master password: Generate a strong password (e.g. `openssl rand -base64 24`) and save it in 1Password immediately
6. **Instance configuration:**
   - DB instance class: **db.t3.micro** (cheapest)
   - Storage type: gp2, 20 GiB
   - Storage autoscaling: uncheck (staging doesn't need it)
7. **Availability and durability:** Single DB instance (no Multi-AZ — saves ~$15/month)
8. **Connectivity:**
   - VPC: default VPC
   - Subnet group: `ile-ase-staging-subnet-group`
   - Public access: **No** (EC2 will talk to it privately)
   - VPC security group: remove `default`, add `ile-ase-staging-rds`
   - Availability Zone: `us-east-1a`
   - Database port: 5432
9. **Database authentication:** Password authentication
10. **Additional configuration → Initial database name:** `ilu_ase_staging`
11. **Backup retention:** 1 day (staging — minimal)
12. **Monitoring:** disable Enhanced Monitoring for staging
13. Click **Create database**

Wait 5–10 minutes for the instance to become **Available**. Then:

```bash
# Get the endpoint
aws rds describe-db-instances \
  --db-instance-identifier ile-ase-staging \
  --query "DBInstances[0].Endpoint.Address" \
  --output text
# Returns something like: ile-ase-staging.c9abcdef.us-east-1.rds.amazonaws.com
```

Save this endpoint — it goes into your `DATABASE_URL`.

---

### Step 2.5 — Create the S3 Backup Bucket (Staging)

```bash
aws s3api create-bucket \
  --bucket ile-ase-staging-backups \
  --region us-east-1

# Block all public access (backups must never be public)
aws s3api put-public-access-block \
  --bucket ile-ase-staging-backups \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning so you can recover overwritten backups
aws s3api put-bucket-versioning \
  --bucket ile-ase-staging-backups \
  --versioning-configuration Status=Enabled

# Add a lifecycle rule to expire old backup files after 30 days
aws s3api put-bucket-lifecycle-configuration \
  --bucket ile-ase-staging-backups \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "expire-old-backups",
      "Status": "Enabled",
      "Filter": {"Prefix": "database/"},
      "Expiration": {"Days": 30}
    }]
  }'
```

For staging, the EC2 instance uses its own IAM instance profile or your CLI credentials to write to S3. You will configure that when you launch EC2 below.

---

### Step 2.6 — Launch the Staging EC2 Instance

**Find the Ubuntu 22.04 LTS AMI:**

```bash
aws ec2 describe-images \
  --owners 099720109477 \
  --filters \
    "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
    "Name=state,Values=available" \
  --query "sort_by(Images, &CreationDate)[-1].ImageId" \
  --output text
# Returns something like: ami-0c7217cdde317cfec
```

**Launch the instance via console (easier for first time):**

1. Go to **EC2** → **Instances** → **Launch instances**
2. **Name:** `ile-ase-staging`
3. **Application and OS Images:** Ubuntu Server 22.04 LTS (use the AMI ID from above or search for it)
4. **Instance type:** `t3.small`
5. **Key pair:** `ile-ase-key`
6. **Network settings:**
   - VPC: default VPC
   - Subnet: pick `us-east-1a` (same AZ as your RDS)
   - Auto-assign public IP: **Enable**
   - Security group: **Select existing** → `ile-ase-staging-ec2`
7. **Storage:** 20 GiB, gp3 (faster than gp2 at same price)
8. **Advanced details → IAM instance profile:** Leave blank for now (you will attach it via CLI after creating the role)
9. Click **Launch instance**

**Create an IAM role for EC2 to write to S3 (staging):**

```bash
# Create the trust policy document
cat > /tmp/ec2-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Create the role
aws iam create-role \
  --role-name ile-ase-staging-ec2-role \
  --assume-role-policy-document file:///tmp/ec2-trust.json

# Create an inline policy that allows writing to the staging backup bucket only
cat > /tmp/s3-backup-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::ile-ase-staging-backups",
      "arn:aws:s3:::ile-ase-staging-backups/*"
    ]
  }]
}
EOF

aws iam put-role-policy \
  --role-name ile-ase-staging-ec2-role \
  --policy-name s3-backup-access \
  --policy-document file:///tmp/s3-backup-policy.json

# Create the instance profile and add the role to it
aws iam create-instance-profile \
  --instance-profile-name ile-ase-staging-ec2-profile

aws iam add-role-to-instance-profile \
  --instance-profile-name ile-ase-staging-ec2-profile \
  --role-name ile-ase-staging-ec2-role
```

**Attach the IAM profile to your running EC2 instance:**

1. Go to **EC2** → **Instances** → select `ile-ase-staging`
2. **Actions** → **Security** → **Modify IAM role**
3. Select `ile-ase-staging-ec2-profile` → **Update IAM role**

Get your EC2 public IP:

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=ile-ase-staging" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text
# Returns: 54.x.x.x
```

---

### Step 2.7 — Set Up the EC2 Instance

SSH in:

```bash
ssh -i ~/.ssh/ile-ase-key.pem ubuntu@<EC2-PUBLIC-IP>
```

**Run the setup script from the repo (after cloning):**

The repo contains `scripts/ec2-setup.sh` which installs Node.js 20, PM2, nginx, and clones the repo. Run it:

```bash
# First, clone the repo so you have the script
git clone https://github.com/MoyoOni/ifa_app.git
cd ifa_app
git checkout v4/quality

chmod +x scripts/ec2-setup.sh
./scripts/ec2-setup.sh
```

The script handles: system updates, Node.js 20 LTS, PM2, nginx + Certbot, and dependency installation.

**Install Redis locally (staging only — no ElastiCache):**

```bash
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify it's running
redis-cli ping
# PONG
```

Bind Redis to localhost only (security):

```bash
sudo nano /etc/redis/redis.conf
# Find the line: bind 127.0.0.1 ::1
# Make sure it reads exactly: bind 127.0.0.1
# Save and exit (Ctrl+O, Enter, Ctrl+X)

sudo systemctl restart redis-server
```

**Install PostgreSQL client tools (for pg_dump backups):**

```bash
sudo apt-get install -y postgresql-client-16

# If pg 16 is not available, add the Postgres repo first:
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y postgresql-client-16
```

**Create log directory:**

```bash
sudo mkdir -p /var/log/ilu-ase
sudo chown ubuntu:ubuntu /var/log/ilu-ase
mkdir -p /home/ubuntu/backups/ilu-ase
```

---

### Step 2.8 — Configure Environment Variables

Use the interactive template script to generate `backend/.env`:

```bash
cd /home/ubuntu/ifa_app
chmod +x scripts/staging-env-template.sh
./scripts/staging-env-template.sh
```

The script will prompt you for the RDS endpoint, DB credentials, and EC2 hostname, then generate `backend/.env` and `frontend/.env` automatically.

After the script runs, open `backend/.env` and fill in these additional values that the template leaves blank:

```bash
nano /home/ubuntu/ifa_app/backend/.env
```

Add/update these lines:

```env
# Redis (local on this EC2)
REDIS_URL=redis://127.0.0.1:6379

# Email
SENDGRID_API_KEY=SG.your-sendgrid-key-here
EMAIL_FROM=noreply@ilu-ase.com

# Payments
PAYSTACK_SECRET_KEY=sk_test_your-staging-paystack-key
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your-staging-key
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your-staging-key
FLUTTERWAVE_SECRET_HASH=your-flutterwave-hash

# S3 Backups (uses the EC2 IAM role — no access keys needed)
AWS_REGION=us-east-1
S3_BACKUP_BUCKET=ile-ase-staging-backups

# Sentry (get DSN from sentry.io project settings)
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
SENTRY_ENVIRONMENT=staging

# Bootstrap admin (remove after first login)
BOOTSTRAP_ADMIN_EMAIL=admin@ilu-ase.com
BOOTSTRAP_ADMIN_PASSWORD=change-me-strong-password-min-12

# Google OAuth (get from console.cloud.google.com)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Update `frontend/.env`:

```bash
nano /home/ubuntu/ifa_app/frontend/.env
```

```env
VITE_API_URL=https://staging.ilu-ase.com/api
VITE_DEMO_MODE=false
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/your-project
VITE_ENVIRONMENT=staging
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

### Step 2.9 — Configure Nginx

The repo ships a production-grade nginx config at `scripts/nginx.conf`. Deploy it:

```bash
sudo cp /home/ubuntu/ifa_app/scripts/nginx.conf /etc/nginx/sites-available/ilu-ase

# For staging, update the server_name to use your EC2 IP or staging subdomain
sudo nano /etc/nginx/sites-available/ilu-ase
# Change: server_name ilu-ase.com www.ilu-ase.com;
# To:     server_name staging.ilu-ase.com;   (if you have a subdomain)
# Or:     server_name <EC2-PUBLIC-IP>;        (if using IP directly)

# Also update the frontend location block to serve static files directly
# instead of proxying to port 5173. Find the "Frontend (SPA)" location block:
# Replace:
#   proxy_pass http://frontend;
# With:
#   root /home/ubuntu/ifa_app/frontend/dist;
#   try_files $uri $uri/ /index.html;

sudo ln -sf /etc/nginx/sites-available/ilu-ase /etc/nginx/sites-enabled/ilu-ase
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
# nginx: configuration file /etc/nginx/nginx.conf test is successful

sudo systemctl reload nginx
```

---

### Step 2.10 — Get a Let's Encrypt SSL Certificate

You need a domain name pointing to the EC2 IP. If using a subdomain like `staging.ilu-ase.com`:

1. In your DNS provider (or Route53), add an A record:
   - Name: `staging`
   - Value: `<EC2-PUBLIC-IP>`
   - TTL: 300

Wait 1–5 minutes for DNS to propagate:

```bash
nslookup staging.ilu-ase.com
# Should return your EC2 IP
```

Then get the certificate:

```bash
sudo certbot --nginx -d staging.ilu-ase.com
# Follow the prompts:
# - Enter your email
# - Agree to ToS
# - Choose whether to share email (your call)
# Certbot will automatically update the nginx config with the cert paths
```

Verify auto-renewal works:

```bash
sudo certbot renew --dry-run
# Should say "Congratulations, all simulated renewals succeeded"
```

Certbot installs a systemd timer that renews automatically. No cron needed.

---

### Step 2.11 — Run Database Migrations and Bootstrap Admin

```bash
cd /home/ubuntu/ifa_app/backend

# Apply all Prisma migrations
npx prisma migrate deploy

# Verify all migrations are applied
npx prisma migrate status
# All should show: Applied

# Bootstrap the first admin user
cd /home/ubuntu/ifa_app
export DATABASE_URL="$(grep '^DATABASE_URL=' backend/.env | cut -d= -f2- | tr -d '"')"
export BOOTSTRAP_ADMIN_EMAIL="admin@ilu-ase.com"
export BOOTSTRAP_ADMIN_PASSWORD="your-strong-password-here"
./scripts/bootstrap-production.sh
```

---

### Step 2.12 — Deploy the Application

```bash
cd /home/ubuntu/ifa_app
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The deploy script:
1. Pulls latest code from `v4/quality`
2. Installs dependencies (`npm install --production` for backend, `npm install` for frontend)
3. Runs `prisma migrate deploy`
4. Builds backend (`nest build`) → `dist/`
5. Builds frontend (`vite build`) → `frontend/dist/`
6. Restarts PM2 processes

After it completes:

```bash
pm2 list
# Should show ilu-ase-backend as "online"

curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"..."}

curl https://staging.ilu-ase.com/api/health
# Same response, via nginx + HTTPS
```

**Enable PM2 to restart on server reboot:**

```bash
pm2 startup
# PM2 will print a command starting with "sudo env PATH=..."
# Copy that command and run it exactly as printed

pm2 save
```

---

### Step 2.13 — Verify the Staging Deployment

```bash
# 1. Health check
curl https://staging.ilu-ase.com/api/health

# 2. Check PM2 is running
pm2 list

# 3. Check nginx status
sudo systemctl status nginx

# 4. Check Redis is running
redis-cli ping

# 5. Check backend logs for errors
pm2 logs ilu-ase-backend --lines 50
```

In a browser:
- Navigate to `https://staging.ilu-ase.com` — padlock shown, landing page loads
- Navigate to `/login` — login form loads
- Log in with `admin@ilu-ase.com` and the bootstrap password
- Confirm `/admin` dashboard is accessible

**Remove bootstrap credentials from .env after first login:**

```bash
nano /home/ubuntu/ifa_app/backend/.env
# Delete the lines:
# BOOTSTRAP_ADMIN_EMAIL=...
# BOOTSTRAP_ADMIN_PASSWORD=...
```

---

## Part 3: Production Environment

### Architecture

```
Internet
   ↓
Route53 (ilu-ase.com, *.ilu-ase.com)
   ↓
ACM Wildcard Certificate
   ↓
Application Load Balancer (ALB)
   ├── HTTPS:443 → Target Group (EC2 t3.medium :3000)
   └── HTTP:80  → Redirect to HTTPS
         ↓
EC2 t3.medium (Ubuntu 22.04) — backend only (NestJS + PM2)
nginx serves frontend static files and proxies /api/* to NestJS
   ↓
RDS db.t3.small PostgreSQL 16 Multi-AZ + ElastiCache cache.t3.micro Redis
   ↓
S3 (ile-ase-prod-backups)
```

---

### Step 3.1 — Create Production Security Groups

**Security group for ALB:**

1. **EC2** → **Security Groups** → **Create security group**
2. Name: `ile-ase-prod-alb`
3. Description: `Production ALB - Ile Ase`
4. VPC: default VPC
5. Inbound rules:

   | Type | Protocol | Port | Source |
   |------|----------|------|--------|
   | HTTP | TCP | 80 | 0.0.0.0/0 |
   | HTTPS | TCP | 443 | 0.0.0.0/0 |

6. Create

**Security group for EC2 (production):**

1. Name: `ile-ase-prod-ec2`
2. Description: `Production EC2 - Ile Ase`
3. VPC: default VPC
4. Inbound rules:

   | Type | Protocol | Port | Source | Description |
   |------|----------|------|--------|-------------|
   | SSH | TCP | 22 | My IP | SSH from your IP only |
   | Custom TCP | TCP | 3000 | `ile-ase-prod-alb` SG | NestJS from ALB |
   | HTTP | TCP | 80 | `ile-ase-prod-alb` SG | nginx from ALB |

5. Create

**Security group for RDS (production):**

1. Name: `ile-ase-prod-rds`
2. Description: `Production RDS - Ile Ase`
3. VPC: default VPC
4. Inbound rules:

   | Type | Protocol | Port | Source |
   |------|----------|------|--------|
   | PostgreSQL | TCP | 5432 | `ile-ase-prod-ec2` SG |

5. Create

**Security group for ElastiCache (production):**

1. Name: `ile-ase-prod-redis`
2. Description: `Production Redis - Ile Ase`
3. VPC: default VPC
4. Inbound rules:

   | Type | Protocol | Port | Source |
   |------|----------|------|--------|
   | Custom TCP | TCP | 6379 | `ile-ase-prod-ec2` SG |

5. Create

---

### Step 3.2 — Create the Production RDS Subnet Group

```bash
# Get all subnet IDs in the default VPC
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=<YOUR-VPC-ID>" \
  --query "Subnets[*].SubnetId" \
  --output text
```

1. Go to **RDS** → **Subnet groups** → **Create DB subnet group**
2. Name: `ile-ase-prod-subnet-group`
3. Description: `Production subnet group`
4. VPC: default VPC
5. Add all subnets shown
6. Create

---

### Step 3.3 — Launch the Production RDS Instance

1. Go to **RDS** → **Create database**
2. **Engine:** PostgreSQL 16.x (latest patch)
3. **Templates:** Production
4. **Settings:**
   - DB instance identifier: `ile-ase-prod`
   - Master username: `postgres_admin`
   - Master password: Generate with `openssl rand -base64 32` — save in AWS Secrets Manager (see Step 3.9)
5. **Instance configuration:** `db.t3.small`
6. **Storage:** gp3, 50 GiB, storage autoscaling enabled, max 100 GiB
7. **Availability and durability:** **Multi-AZ DB instance** (this creates a standby in a second AZ — automatic failover)
8. **Connectivity:**
   - VPC: default VPC
   - Subnet group: `ile-ase-prod-subnet-group`
   - Public access: **No**
   - VPC security group: remove `default`, add `ile-ase-prod-rds`
9. **Additional configuration → Initial database name:** `ilu_ase_prod`
10. **Backup:**
    - Automated backups: **Enable**
    - Backup retention: **7 days**
    - Backup window: `02:00-03:00 UTC` (low-traffic window)
11. **Monitoring:** Enable Enhanced Monitoring, granularity 60 seconds
12. **Maintenance:** Enable auto minor version upgrade
13. Create — wait 15–20 minutes for Multi-AZ setup

Get the endpoint:

```bash
aws rds describe-db-instances \
  --db-instance-identifier ile-ase-prod \
  --query "DBInstances[0].Endpoint.Address" \
  --output text
```

---

### Step 3.4 — Create the ElastiCache Redis Cluster

**Create a subnet group for ElastiCache:**

1. Go to **ElastiCache** → **Subnet groups** → **Create subnet group**
2. Name: `ile-ase-prod-redis-subnet`
3. VPC: default VPC
4. Select all subnets → Create

**Create the Redis cluster:**

1. Go to **ElastiCache** → **Redis clusters** → **Create Redis cluster**
2. **Cluster mode:** Disabled (single node — simpler, cheaper, sufficient for this load)
3. **Cluster info:**
   - Name: `ile-ase-prod-redis`
   - Description: `Production Redis for Ile Ase`
4. **Location:** AWS Cloud
5. **Node type:** `cache.t3.micro`
6. **Number of replicas:** 0 (add a replica later if needed)
7. **Subnet group:** `ile-ase-prod-redis-subnet`
8. **Security groups:** Remove default, add `ile-ase-prod-redis`
9. **Encryption:**
   - At-rest: enabled
   - In-transit: enabled
   - Auth token: generate one with `openssl rand -base64 32` — save it
10. **Backup:** Enable, retention 1 day
11. Create — takes 5–10 minutes

Get the Redis endpoint:

```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id ile-ase-prod-redis \
  --show-cache-node-info \
  --query "CacheClusters[0].CacheNodes[0].Endpoint.Address" \
  --output text
```

The Redis URL for your `.env` will be:
```
REDIS_URL=rediss://:your-auth-token@<elasticache-endpoint>:6379
```

Note: `rediss://` (with double s) for TLS.

---

### Step 3.5 — Create the Production S3 Bucket

```bash
aws s3api create-bucket \
  --bucket ile-ase-prod-backups \
  --region us-east-1

aws s3api put-public-access-block \
  --bucket ile-ase-prod-backups \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

aws s3api put-bucket-versioning \
  --bucket ile-ase-prod-backups \
  --versioning-configuration Status=Enabled

# Server-side encryption
aws s3api put-bucket-encryption \
  --bucket ile-ase-prod-backups \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Lifecycle: expire daily backups after 30 days, weekly after 90 days
aws s3api put-bucket-lifecycle-configuration \
  --bucket ile-ase-prod-backups \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "expire-daily-backups",
        "Status": "Enabled",
        "Filter": {"Prefix": "database/daily/"},
        "Expiration": {"Days": 30}
      },
      {
        "ID": "expire-weekly-backups",
        "Status": "Enabled",
        "Filter": {"Prefix": "database/weekly/"},
        "Expiration": {"Days": 90}
      }
    ]
  }'
```

---

### Step 3.6 — Create the IAM Role for Production EC2

```bash
# Reuse the trust policy from staging setup (already in /tmp)
aws iam create-role \
  --role-name ile-ase-prod-ec2-role \
  --assume-role-policy-document file:///tmp/ec2-trust.json

# Policy: write to prod S3 bucket only
cat > /tmp/prod-s3-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::ile-ase-prod-backups",
      "arn:aws:s3:::ile-ase-prod-backups/*"
    ]
  }]
}
EOF

aws iam put-role-policy \
  --role-name ile-ase-prod-ec2-role \
  --policy-name s3-backup-access \
  --policy-document file:///tmp/prod-s3-policy.json

aws iam create-instance-profile \
  --instance-profile-name ile-ase-prod-ec2-profile

aws iam add-role-to-instance-profile \
  --instance-profile-name ile-ase-prod-ec2-profile \
  --role-name ile-ase-prod-ec2-role
```

---

### Step 3.7 — Launch the Production EC2 Instance

**Find the Ubuntu 22.04 AMI (same command as staging):**

```bash
aws ec2 describe-images \
  --owners 099720109477 \
  --filters \
    "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
    "Name=state,Values=available" \
  --query "sort_by(Images, &CreationDate)[-1].ImageId" \
  --output text
```

**Launch via console:**

1. **EC2** → **Launch instances**
2. Name: `ile-ase-prod`
3. AMI: Ubuntu Server 22.04 LTS (from AMI ID above)
4. Instance type: `t3.medium`
5. Key pair: `ile-ase-key`
6. Network settings:
   - Subnet: `us-east-1a` (same AZ as primary RDS for lower latency)
   - Auto-assign public IP: **Enable** (ALB will be the public face; EC2 IP is for SSH and ALB target)
   - Security group: `ile-ase-prod-ec2`
7. Storage: 30 GiB, gp3
8. Advanced → IAM instance profile: `ile-ase-prod-ec2-profile`
9. Launch

Get the private IP (for ALB target group):

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=ile-ase-prod" \
  --query "Reservations[0].Instances[0].PrivateIpAddress" \
  --output text
```

**Set up the EC2 instance** (same process as staging Step 2.7):

```bash
ssh -i ~/.ssh/ile-ase-key.pem ubuntu@<PROD-EC2-PUBLIC-IP>

git clone https://github.com/MoyoOni/ifa_app.git
cd ifa_app
git checkout v4/quality

chmod +x scripts/ec2-setup.sh
./scripts/ec2-setup.sh

# Install postgres client for pg_dump
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update && sudo apt-get install -y postgresql-client-16

sudo mkdir -p /var/log/ilu-ase
sudo chown ubuntu:ubuntu /var/log/ilu-ase
mkdir -p /home/ubuntu/backups/ilu-ase
```

**Configure environment variables for production:**

```bash
nano /home/ubuntu/ifa_app/backend/.env
```

```env
# Database (RDS Multi-AZ endpoint)
DATABASE_URL="postgresql://postgres_admin:<password>@<rds-prod-endpoint>:5432/ilu_ase_prod?connection_limit=10&pool_timeout=10"

# Auth
JWT_SECRET=<64-char hex from: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET=<different 64-char hex>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption (exactly 32 chars)
ENCRYPTION_KEY=<32-char hex from: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))">

# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://app.ilu-ase.com
CORS_ALLOWED_ORIGINS=https://app.ilu-ase.com,https://ilu-ase.com

# Redis (ElastiCache with TLS)
REDIS_URL=rediss://:your-auth-token@<elasticache-endpoint>:6379

# Email
SENDGRID_API_KEY=SG.your-production-sendgrid-key
EMAIL_FROM=noreply@ilu-ase.com

# Payments (LIVE keys — not test)
PAYSTACK_SECRET_KEY=sk_live_your-paystack-key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your-live-key
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your-live-key
FLUTTERWAVE_SECRET_HASH=your-live-hash

# S3
AWS_REGION=us-east-1
S3_BACKUP_BUCKET=ile-ase-prod-backups

# Sentry
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Bootstrap (remove after first deploy)
BOOTSTRAP_ADMIN_EMAIL=admin@ilu-ase.com
BOOTSTRAP_ADMIN_PASSWORD=your-very-strong-password-min-12
```

```bash
nano /home/ubuntu/ifa_app/frontend/.env
```

```env
VITE_API_URL=https://app.ilu-ase.com/api
VITE_DEMO_MODE=false
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/your-project
VITE_ENVIRONMENT=production
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

**Configure nginx for production:**

```bash
sudo cp /home/ubuntu/ifa_app/scripts/nginx.conf /etc/nginx/sites-available/ilu-ase
sudo nano /etc/nginx/sites-available/ilu-ase
```

Update the server_name lines to use your production domain:
```nginx
server_name app.ilu-ase.com ilu-ase.com;
```

Update the frontend section to serve static files directly (not PM2):
```nginx
# Replace the proxy_pass http://frontend; block with:
location / {
    root /home/ubuntu/ifa_app/frontend/dist;
    try_files $uri $uri/ /index.html;
    expires 1h;
    add_header Cache-Control "public";
}

location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    root /home/ubuntu/ifa_app/frontend/dist;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/ilu-ase /etc/nginx/sites-enabled/ilu-ase
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

**Run migrations and bootstrap:**

```bash
cd /home/ubuntu/ifa_app/backend
npx prisma migrate deploy

cd /home/ubuntu/ifa_app
export DATABASE_URL="$(grep '^DATABASE_URL=' backend/.env | cut -d= -f2- | tr -d '"')"
export BOOTSTRAP_ADMIN_EMAIL="admin@ilu-ase.com"
export BOOTSTRAP_ADMIN_PASSWORD="your-strong-password"
./scripts/bootstrap-production.sh
```

**Deploy the application:**

```bash
cd /home/ubuntu/ifa_app
./scripts/deploy.sh

pm2 startup  # Run the printed sudo command
pm2 save
```

Verify the backend is responding:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"..."}
```

---

### Step 3.8 — Request an ACM Wildcard Certificate

This certificate will be used by the ALB. ACM certificates are free.

1. Go to **Certificate Manager (ACM)** — make sure you are in **us-east-1**
2. Click **Request a certificate** → **Request a public certificate**
3. **Fully qualified domain names** — add both:
   - `ilu-ase.com`
   - `*.ilu-ase.com`
4. **Validation method:** DNS validation
5. Click **Request**

You are now on the certificate detail page. Expand the domain names — you will see **CNAME records** to add to your DNS. Each domain gets one CNAME.

**If you are managing DNS in Route53 (Step 3.10 sets this up):** Click **Create records in Route53** — ACM does it automatically.

**If DNS is still at your registrar:** Copy the CNAME name and value for each domain and add them manually in your registrar's DNS panel.

ACM will validate and issue the certificate within a few minutes (usually under 5 minutes with Route53, up to 30 minutes otherwise). The status changes from **Pending validation** to **Issued**.

Note the certificate ARN — you need it when creating the ALB.

---

### Step 3.9 — Create the Application Load Balancer

**Create a target group first (the ALB sends traffic here):**

1. **EC2** → **Target groups** → **Create target group**
2. Target type: **Instances**
3. Target group name: `ile-ase-prod-backend`
4. Protocol: **HTTP**, Port: **80** (nginx on EC2 listens on 80; ALB handles HTTPS termination)
5. VPC: default VPC
6. **Health check:**
   - Protocol: HTTP
   - Path: `/api/health`
   - Healthy threshold: 2
   - Unhealthy threshold: 3
   - Timeout: 5 seconds
   - Interval: 30 seconds
7. Click **Next** → select the `ile-ase-prod` EC2 instance → **Include as pending below**
8. Create target group

**Create the ALB:**

1. **EC2** → **Load Balancers** → **Create load balancer** → **Application Load Balancer**
2. Name: `ile-ase-prod-alb`
3. Scheme: **Internet-facing**
4. IP address type: IPv4
5. **Network mapping:**
   - VPC: default VPC
   - Select ALL Availability Zones (check all checkboxes) — pick a subnet in each AZ
6. **Security groups:** remove default, add `ile-ase-prod-alb`
7. **Listeners and routing:**
   - HTTP:80 → Add listener → Action: Redirect to HTTPS:443
   - HTTPS:443 → Add listener → Default action: Forward to `ile-ase-prod-backend`
   - For HTTPS: select the ACM certificate you created (it will appear in the dropdown after being issued)
8. Create load balancer — takes 2–3 minutes to provision

Get the ALB DNS name:

```bash
aws elbv2 describe-load-balancers \
  --names ile-ase-prod-alb \
  --query "LoadBalancers[0].DNSName" \
  --output text
# Returns: ile-ase-prod-alb-1234567890.us-east-1.elb.amazonaws.com
```

---

### Step 3.10 — Configure Route53

**Create a hosted zone (if you don't have one):**

1. Go to **Route53** → **Hosted zones** → **Create hosted zone**
2. Domain name: `ilu-ase.com`
3. Type: Public hosted zone
4. Create

Route53 will give you 4 name server (NS) records. Go to your domain registrar (GoDaddy, Namecheap, Google Domains, etc.) and update the name servers to these 4 Route53 NS values. This delegates DNS control to Route53. Changes propagate in 24–48 hours, but usually much faster.

**Add DNS records:**

1. In the hosted zone for `ilu-ase.com`, click **Create record**
2. **Root domain (ilu-ase.com → ALB):**
   - Record name: leave blank (root)
   - Record type: A
   - Alias: Yes
   - Route traffic to: **Alias to Application and Classic Load Balancer**
   - Region: US East (N. Virginia)
   - Load balancer: select `ile-ase-prod-alb`
   - Create record

3. **www subdomain:**
   - Record name: `www`
   - Record type: A
   - Alias: Yes → same ALB
   - Create record

4. **app subdomain (main app URL):**
   - Record name: `app`
   - Record type: A
   - Alias: Yes → same ALB
   - Create record

5. **Staging subdomain (points to staging EC2):**
   - Record name: `staging`
   - Record type: A
   - Alias: No
   - Value: `<STAGING-EC2-PUBLIC-IP>`
   - TTL: 300
   - Create record

Wait for DNS propagation (usually 5 minutes with Route53):

```bash
nslookup app.ilu-ase.com
# Should return the ALB's IP addresses
```

---

### Step 3.11 — Verify the Production Deployment

```bash
# From your local machine:
curl https://app.ilu-ase.com/api/health
# {"status":"ok","timestamp":"..."}

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn <YOUR-TARGET-GROUP-ARN>
# State should be "healthy"
```

In the browser:
- Navigate to `https://app.ilu-ase.com` — padlock shown, landing page loads
- Navigate to `https://ilu-ase.com` — redirects to HTTPS, same result
- Navigate to `/login` → sign in with bootstrap admin credentials
- Confirm `/admin` dashboard loads
- Remove bootstrap credentials from `.env` and reload PM2:

```bash
nano /home/ubuntu/ifa_app/backend/.env
# Remove BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD lines

pm2 restart ilu-ase-backend
```

---

### Step 3.12 — Store Secrets in AWS Secrets Manager (Production Best Practice)

Rather than keeping credentials in a `.env` file on disk, use Secrets Manager for the most sensitive values:

```bash
# Store the DB password
aws secretsmanager create-secret \
  --name "ile-ase/prod/db-password" \
  --secret-string "your-rds-master-password"

# Store JWT secrets
aws secretsmanager create-secret \
  --name "ile-ase/prod/jwt-secret" \
  --secret-string "your-64-char-hex-secret"

# Retrieve a secret (for scripting)
aws secretsmanager get-secret-value \
  --secret-id "ile-ase/prod/db-password" \
  --query SecretString \
  --output text
```

Update the IAM role to allow Secrets Manager reads:

```bash
cat > /tmp/secrets-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": "arn:aws:s3:::arn:aws:secretsmanager:us-east-1:*:secret:ile-ase/prod/*"
  }]
}
EOF

aws iam put-role-policy \
  --role-name ile-ase-prod-ec2-role \
  --policy-name secrets-manager-access \
  --policy-document file:///tmp/secrets-policy.json
```

---

## Part 4: After Both Environments Are Up

### Step 4.1 — Enable S3 Upload in the Backup Script

The backup script (`scripts/backup-db.sh`) has an S3 upload section commented out. Enable it:

```bash
nano /home/ubuntu/ifa_app/scripts/backup-db.sh
```

Find the commented-out S3 section at the bottom and replace it with:

```bash
# Upload to S3
S3_BUCKET="s3://ile-ase-prod-backups/database/daily/"
if command -v aws &> /dev/null; then
    log_info "Uploading to S3: ${S3_BUCKET}"
    aws s3 cp "$BACKUP_FILE" "${S3_BUCKET}$(basename $BACKUP_FILE)" --region us-east-1
    log_success "S3 upload complete: ${S3_BUCKET}$(basename $BACKUP_FILE)"
else
    log_error "aws CLI not found — S3 upload skipped"
fi
```

Test the backup manually:

```bash
/home/ubuntu/ifa_app/scripts/backup-db.sh
# Should print INFO lines and end with "Backup complete"

# Verify it uploaded to S3
aws s3 ls s3://ile-ase-prod-backups/database/daily/
```

---

### Step 4.2 — Schedule the Backup Cron

On the production EC2 instance:

```bash
crontab -e
```

Add these lines:

```cron
# Database backup every 6 hours (production)
0 */6 * * * /home/ubuntu/ifa_app/scripts/backup-db.sh >> /var/log/ilu-ase/backup.log 2>&1

# Weekly archive (Sunday at 3 AM) — copy daily backup to weekly prefix
0 3 * * 0 aws s3 cp $(ls -t /home/ubuntu/backups/ilu-ase/ilu-ase_*.sql.gz | head -1) s3://ile-ase-prod-backups/database/weekly/ --region us-east-1 >> /var/log/ilu-ase/backup.log 2>&1

# Rotate PM2 logs weekly
0 4 * * 0 pm2 flush >> /dev/null 2>&1
```

On the staging EC2 instance:

```bash
crontab -e
```

Add:

```cron
# Database backup daily at 2 AM (staging)
0 2 * * * /home/ubuntu/ifa_app/scripts/backup-db.sh >> /var/log/ilu-ase/backup.log 2>&1
```

---

### Step 4.3 — Set Up UptimeRobot (Free External Monitoring)

1. Go to https://uptimerobot.com and create a free account
2. Click **Add New Monitor** for each of these:

   | Type | Friendly Name | URL | Interval |
   |------|---------------|-----|----------|
   | HTTPS | Ile Ase Production | https://app.ilu-ase.com | 5 min |
   | HTTPS | Ile Ase API Health | https://app.ilu-ase.com/api/health | 5 min |
   | HTTPS | Ile Ase Staging | https://staging.ilu-ase.com | 15 min |

3. Go to **Alert Contacts** → **Add Alert Contact**
4. Type: Email → enter your team's email address
5. Assign this alert contact to all three monitors

UptimeRobot will page you within 5 minutes if the site goes down.

---

### Step 4.4 — Run the Bootstrap Production Script

If you have not already done this during deployment:

```bash
ssh -i ~/.ssh/ile-ase-key.pem ubuntu@<PROD-EC2-PUBLIC-IP>

cd /home/ubuntu/ifa_app

export DATABASE_URL="$(grep '^DATABASE_URL=' backend/.env | cut -d= -f2- | tr -d '"')"
export BOOTSTRAP_ADMIN_EMAIL="admin@ilu-ase.com"
export BOOTSTRAP_ADMIN_PASSWORD="your-strong-password-min-12"

./scripts/bootstrap-production.sh
```

Expected output:
```
=== Ilé Àṣẹ — Production Bootstrap ===
Admin user created successfully.
  ID: <uuid>
  Email: admin@ilu-ase.com
  Role: ADMIN
IMPORTANT: Log in and change your password immediately.
=== Bootstrap complete ===
```

After logging in and changing the password, remove the bootstrap variables from `.env`.

---

### Step 4.5 — Configure CloudWatch Alarms (Production)

Set up alarms for the metrics that matter most:

```bash
# CPU alarm on EC2 (alert if over 80% for 5 minutes)
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=ile-ase-prod" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

aws cloudwatch put-metric-alarm \
  --alarm-name "ile-ase-prod-cpu-high" \
  --alarm-description "EC2 CPU over 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=InstanceId,Value=$INSTANCE_ID \
  --alarm-actions arn:aws:sns:us-east-1:<ACCOUNT-ID>:ile-ase-alerts \
  --ok-actions arn:aws:sns:us-east-1:<ACCOUNT-ID>:ile-ase-alerts

# RDS storage alarm (alert if under 10 GiB free)
aws cloudwatch put-metric-alarm \
  --alarm-name "ile-ase-prod-rds-storage-low" \
  --alarm-description "RDS free storage under 10 GiB" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 10737418240 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=DBInstanceIdentifier,Value=ile-ase-prod \
  --alarm-actions arn:aws:sns:us-east-1:<ACCOUNT-ID>:ile-ase-alerts
```

To create the SNS topic that the alarms send to (replace `<ACCOUNT-ID>` with your 12-digit account ID):

```bash
aws sns create-topic --name ile-ase-alerts
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:<ACCOUNT-ID>:ile-ase-alerts \
  --protocol email \
  --notification-endpoint ops@ilu-ase.com
```

Confirm the subscription by clicking the link in the confirmation email that SNS sends.

---

### Step 4.6 — Related Documentation

After completing this guide, these documents are your ongoing references:

| Document | Purpose |
|----------|---------|
| [`docs/FIRST_DEPLOY.md`](FIRST_DEPLOY.md) | First-deploy checklist and steps 1–11 in detail |
| [`docs/DEPLOYMENT_PROCEDURES.md`](DEPLOYMENT_PROCEDURES.md) | Staging → production runbook, rollback procedures |
| [`docs/PRE_LAUNCH_CHECKLIST.md`](PRE_LAUNCH_CHECKLIST.md) | 10-phase pre-launch checklist with sign-off template |
| [`docs/SENTRY_SETUP.md`](SENTRY_SETUP.md) | Sentry project setup and DSN configuration |
| [`docs/SECRET_ROTATION.md`](SECRET_ROTATION.md) | How and when to rotate secrets |
| `scripts/deploy.sh` | Run for every subsequent deploy |
| `scripts/backup-db.sh` | Manual backup trigger + cron target |
| `scripts/bootstrap-production.sh` | First admin user creation (idempotent) |
| `scripts/ec2-setup.sh` | Fresh EC2 setup (run once per instance) |

---

## Cost Reference

### Staging (~$50/month in us-east-1)

| Resource | Spec | Estimated Cost |
|----------|------|----------------|
| EC2 t3.small | 2 vCPU, 2 GiB | ~$15/month |
| RDS db.t3.micro | Single-AZ, 20 GiB | ~$15/month |
| Redis on EC2 | No extra charge | $0 |
| S3 (backups, <5 GiB) | Standard storage | ~$0.12/month |
| Data transfer | ~10 GiB/month | ~$1/month |
| Elastic IP (attached) | Free while attached | $0 |
| **Total** | | **~$31/month** |

### Production (~$200/month in us-east-1)

| Resource | Spec | Estimated Cost |
|----------|------|----------------|
| EC2 t3.medium | 2 vCPU, 4 GiB | ~$30/month |
| RDS db.t3.small Multi-AZ | 50 GiB gp3 | ~$70/month |
| ElastiCache cache.t3.micro | Redis | ~$13/month |
| Application Load Balancer | + LCU charges | ~$20/month |
| Route53 hosted zone | + queries | ~$1/month |
| ACM certificate | Free | $0 |
| S3 (backups, <20 GiB) | Standard storage | ~$0.50/month |
| Data transfer | ~50 GiB/month | ~$5/month |
| CloudWatch | Alarms + metrics | ~$3/month |
| **Total** | | **~$143/month** |

Actual costs depend on traffic. These estimates assume modest initial load (< 500 concurrent users).

---

## Quick Reference: SSH Commands

```bash
# SSH into staging
ssh -i ~/.ssh/ile-ase-key.pem ubuntu@<STAGING-IP>

# SSH into production
ssh -i ~/.ssh/ile-ase-key.pem ubuntu@<PROD-IP>

# Deploy (run on the server)
cd /home/ubuntu/ifa_app && ./scripts/deploy.sh

# Check app status
pm2 list
pm2 logs ilu-ase-backend --lines 100

# Check nginx
sudo nginx -t && sudo systemctl status nginx

# Check backup log
tail -f /var/log/ilu-ase/backup.log

# Manual backup
/home/ubuntu/ifa_app/scripts/backup-db.sh

# Check Redis (staging, local)
redis-cli ping

# Restart the backend without a full deploy
pm2 restart ilu-ase-backend
```
