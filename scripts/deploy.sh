#!/bin/bash
# ============================================================
# Deploy Script for Ìlú Àṣẹ Platform
# Builds and starts backend + frontend with PM2
#
# Usage:
#   cd /home/ubuntu/ifa_app
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh
# ============================================================

set -e

APP_DIR="/home/ubuntu/ifa_app"

echo "========================================="
echo "  Ìlú Àṣẹ - Deploy"
echo "========================================="

# --- 1. Pull latest code ---
echo ""
echo "[1/6] Pulling latest code..."
cd "$APP_DIR"
git pull origin v4/quality

# --- 2. Install dependencies ---
# P3-03: npm ci (not npm install) so a deploy always gets exactly what
# package-lock.json pins — it also hard-fails if package.json and the
# lockfile have drifted out of sync, instead of silently re-resolving.
echo ""
echo "[2/6] Installing dependencies..."
cd "$APP_DIR/backend" && npm ci --omit=dev
cd "$APP_DIR/frontend" && npm ci

# --- 3. Run database migrations ---
echo ""
echo "[3/6] Running database migrations..."
cd "$APP_DIR/backend"
npx prisma migrate deploy
echo "Migrations complete."

# --- 4. Build backend ---
echo ""
echo "[4/6] Building backend..."
cd "$APP_DIR/backend"
npm run build

# --- 5. Build frontend ---
echo ""
echo "[5/6] Building frontend..."
cd "$APP_DIR/frontend"
npm run build

# --- 6. Start/restart with PM2 ---
echo ""
echo "[6/6] Starting services with PM2..."
cd "$APP_DIR"

# Gracefully stop existing processes (sends SIGINT, waits for drain)
pm2 stop ilu-ase-backend 2>/dev/null && sleep 2 || true
pm2 delete all 2>/dev/null || true

# Start backend with graceful shutdown support
pm2 start backend/dist/backend/src/main.js \
  --name "ilu-ase-backend" \
  --max-memory-restart 512M \
  --kill-timeout 10000 \
  --log /var/log/ilu-ase/backend.log

# Serve frontend with a simple static server
pm2 serve frontend/dist 5173 \
  --name "ilu-ase-frontend" \
  --spa \
  --log /var/log/ilu-ase/frontend.log

# Save PM2 process list (survives reboot)
pm2 save
pm2 startup 2>/dev/null || echo "Run the pm2 startup command shown above as sudo"

echo ""
echo "========================================="
echo "  Deploy COMPLETE"
echo "========================================="
echo ""
echo "Services:"
pm2 list
echo ""
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Logs:     pm2 logs"
echo "Health:   curl http://localhost:3000/api/health"
