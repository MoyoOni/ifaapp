#!/usr/bin/env bash
# ============================================================
# Install docker/proxy.production.conf as the production edge proxy's
# config (/home/ubuntu/app/nginx/default.conf), validate it, and reload
# nginx gracefully. Rolls back to the previous file if `nginx -t` fails.
#
# Usage: AWS_CLI=/Users/a40/Library/Python/3.9/bin/aws scripts/install-prod-proxy-config.sh
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."
B64=$(base64 < docker/proxy.production.conf | tr -d '\n')
STAMP=$(date +%Y%m%d%H%M)
scripts/ssh-prod.sh "set -e; cd /home/ubuntu/app
sudo cp nginx/default.conf nginx/default.conf.bak-$STAMP
echo $B64 | base64 -d | sudo tee nginx/default.conf >/dev/null
if sudo docker compose exec -T proxy nginx -t; then
  sudo docker compose exec -T proxy nginx -s reload && echo 'Proxy config installed and reloaded'
else
  sudo cp nginx/default.conf.bak-$STAMP nginx/default.conf && echo 'nginx -t failed: previous config restored' && exit 1
fi"
sleep 2
curl -s -o /dev/null -w "https://iluase.com/api/health -> %{http_code}\n" https://iluase.com/api/health
