#!/bin/bash
# ============================================================
# Staging Environment Template
# Run this to generate your backend/.env on the EC2 instance
#
# Usage:
#   chmod +x staging-env-template.sh
#   ./staging-env-template.sh
#
# You will be prompted to enter your values.
# ============================================================

set -e

ENV_FILE="/home/ubuntu/ifa_app/backend/.env"

echo "========================================="
echo "  Ìlú Àṣẹ - Staging .env Generator"
echo "========================================="
echo ""

# --- Collect values ---
read -p "RDS Endpoint (e.g. ilu-ase-staging.xxxxx.eu-west-1.rds.amazonaws.com): " RDS_ENDPOINT
read -p "RDS Database name [ilu_ase_staging]: " DB_NAME
DB_NAME=${DB_NAME:-ilu_ase_staging}
read -p "RDS Username [postgres_admin]: " DB_USER
DB_USER=${DB_USER:-postgres_admin}
read -sp "RDS Password: " DB_PASS
echo ""

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 64)
ENCRYPTION_KEY=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)

echo ""
read -p "EC2 Public IP or domain (for FRONTEND_URL): " EC2_HOST

# --- Write .env ---
cat > "$ENV_FILE" << EOF
# Database
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${RDS_ENDPOINT}:5432/${DB_NAME}?connection_limit=10"

# Auth (auto-generated secure keys)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://${EC2_HOST}

# Payment Gateways (IMPORTANT: Keep these SECRET - never commit real keys)
# Get these from your payment gateway dashboards
PAYSTACK_SECRET_KEY=your-paystack-secret-key-here
FLUTTERWAVE_PUBLIC_KEY=your-flutterwave-public-key-here
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key-here
FLUTTERWAVE_SECRET_HASH=your-flutterwave-secret-hash-here

# Error Tracking (IMPORTANT: Keep these SECRET - never commit real DSNs)
SENTRY_DSN=your-sentry-dsn-here
EOF

echo ""
echo "========================================="
echo "  backend/.env created!"
echo "========================================="
echo ""

# --- Frontend .env ---
FRONTEND_ENV="/home/ubuntu/ifa_app/frontend/.env"
cat > "$FRONTEND_ENV" << EOF
VITE_API_URL=http://${EC2_HOST}:3000/api
VITE_DEMO_MODE=false
VITE_SENTRY_DSN=https://5d437442086917cf27eaf2463df3f4cf@o4510958532427776.ingest.de.sentry.io/4510958828126288
VITE_ENVIRONMENT=staging
EOF

echo "  frontend/.env created!"
echo ""
echo "NEXT: Run deploy.sh to build and start the app"
