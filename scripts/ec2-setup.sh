#!/bin/bash
# ============================================================
# EC2 Setup Script for Ìlú Àṣẹ Platform
# Run this ONCE after SSH-ing into a fresh Ubuntu 24.04 EC2
#
# Usage:
#   scp -i your-key.pem scripts/ec2-setup.sh ubuntu@<EC2-IP>:~/
#   ssh -i your-key.pem ubuntu@<EC2-IP>
#   chmod +x ec2-setup.sh && ./ec2-setup.sh
# ============================================================

set -e  # Exit on any error

echo "========================================="
echo "  Ìlú Àṣẹ - EC2 Setup Script"
echo "========================================="

# --- 1. System Updates ---
echo ""
echo "[1/7] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

# --- 2. Install Node.js 20 LTS ---
echo ""
echo "[2/7] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# --- 3. Install PM2 (process manager) ---
echo ""
echo "[3/7] Installing PM2..."
sudo npm install -g pm2

# --- 4. Install Nginx + Certbot (reverse proxy + SSL) ---
echo ""
echo "[4/7] Installing Nginx + Certbot..."
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx

# Create certbot webroot directory
sudo mkdir -p /var/www/certbot

# --- 5. Clone the repository ---
echo ""
echo "[5/7] Cloning repository..."
cd /home/ubuntu
if [ -d "ifa_app" ]; then
  echo "Repository already exists, pulling latest..."
  cd ifa_app && git pull origin v4/quality
else
  git clone https://github.com/MoyoOni/ifa_app.git
  cd ifa_app
  git checkout v4/quality
fi

# --- 6. Install dependencies ---
echo ""
echo "[6/7] Installing dependencies..."
cd /home/ubuntu/ifa_app/backend
npm install
cd /home/ubuntu/ifa_app/frontend
npm install

# --- 7. Create directories ---
echo ""
echo "[7/7] Creating log directories..."
sudo mkdir -p /var/log/ilu-ase
sudo chown ubuntu:ubuntu /var/log/ilu-ase

echo ""
echo "========================================="
echo "  EC2 Setup COMPLETE"
echo "========================================="
echo ""
echo "NEXT STEPS:"
echo "  1. Create backend .env:  nano /home/ubuntu/ifa_app/backend/.env"
echo "     (use staging-env-template.sh as reference)"
echo ""
echo "  2. Create frontend .env: nano /home/ubuntu/ifa_app/frontend/.env"
echo ""
echo "  3. Run database migrations:"
echo "     cd /home/ubuntu/ifa_app/backend"
echo "     npx prisma migrate deploy"
echo "     npx prisma db seed"
echo ""
echo "  4. Deploy nginx config:"
echo "     sudo cp /home/ubuntu/ifa_app/scripts/nginx.conf /etc/nginx/sites-available/ilu-ase"
echo "     sudo ln -sf /etc/nginx/sites-available/ilu-ase /etc/nginx/sites-enabled/"
echo "     sudo rm -f /etc/nginx/sites-enabled/default"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  5. Get SSL certificate:"
echo "     sudo certbot --nginx -d ilu-ase.com -d www.ilu-ase.com"
echo ""
echo "  6. Build & start:"
echo "     ./scripts/deploy.sh"
echo ""
