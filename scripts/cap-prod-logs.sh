#!/usr/bin/env bash
# ============================================================
# Cap every production container's log at 3 x 50 MB, then recreate the
# proxy so its cap applies now (a 1-2 second blip). Other services pick up
# the cap the next time they are recreated (backend/nginx: every deploy).
#
# Why: Docker's default json-file log never rotates. The proxy's access log
# reached 3.8 GB and filled the 20 GB disk on November 2, 2026, which broke
# a deploy and put Postgres (same disk) at risk.
#
# Run after scripts/install-prod-proxy-config.sh, so the recreated proxy
# starts with the re-resolving config.
# Usage: AWS_CLI=/Users/a40/Library/Python/3.9/bin/aws scripts/cap-prod-logs.sh
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."
scripts/ssh-prod.sh 'set -e; cd /home/ubuntu/app
STAMP=$(date +%Y%m%d%H%M)
sudo cp docker-compose.yml docker-compose.yml.bak-$STAMP
sudo python3 - <<PY
p = "docker-compose.yml"
s = open(p).read()
if "max-size" not in s:
    block = "    logging:\n      driver: json-file\n      options:\n        max-size: \"50m\"\n        max-file: \"3\"\n"
    s = s.replace("    restart: unless-stopped\n", "    restart: unless-stopped\n" + block)
    open(p, "w").write(s)
print("services with a log cap:", s.count("max-size"))
PY
if ! sudo docker compose config -q; then sudo cp docker-compose.yml.bak-$STAMP docker-compose.yml; echo "compose invalid: restored"; exit 1; fi
sudo docker compose up -d --no-deps --force-recreate proxy
sleep 3
sudo docker inspect -f "proxy log config: {{.HostConfig.LogConfig}}" iluase-proxy
df -h / | tail -1'
curl -s -o /dev/null -w "https://iluase.com/api/health -> %{http_code}\n" https://iluase.com/api/health
