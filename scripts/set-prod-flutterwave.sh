#!/usr/bin/env bash
# ============================================================
# Put the live Flutterwave secret key and webhook secret hash on the
# production server, then restart the backend so it uses them.
#
# It asks for both values with hidden input; they travel over the SSH
# connection's input (never on a command line, never printed, never
# written to a local file). On the box it backs up .env first.
#
# Usage: AWS_CLI=/Users/a40/Library/Python/3.9/bin/aws scripts/set-prod-flutterwave.sh
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Paste your Flutterwave LIVE secret key (starts FLWSECK-), then press Enter."
echo "(Nothing will show while you paste. That's normal.)"
read -r -s FLW_KEY; echo
case "$FLW_KEY" in
  FLWSECK_TEST*) echo "That's a TEST key. Production needs the LIVE key (FLWSECK-...). Nothing was changed."; exit 1 ;;
  FLWSECK-*) ;;
  *) echo "That doesn't look like a Flutterwave secret key (it should start FLWSECK-). Nothing was changed."; exit 1 ;;
esac

echo "Paste the secret hash you saved in Flutterwave (Settings -> Webhooks), then press Enter."
read -r -s FLW_HASH; echo
if [ "${#FLW_HASH}" -lt 32 ]; then
  echo "That hash is too short (under 32 characters). Make one with: openssl rand -hex 32. Nothing was changed."
  exit 1
fi

echo "Updating the server..."
printf '%s\n%s\n' "$FLW_KEY" "$FLW_HASH" | scripts/ssh-prod.sh 'set -e
read -r KEY; read -r HASH
cd /home/ubuntu/app
sudo cp .env .env.bak-$(date +%Y%m%d%H%M)
KEY="$KEY" HASH="$HASH" sudo --preserve-env=KEY,HASH python3 - <<PY
import os, re
p = ".env"
s = open(p).read()
for name, val in (("FLUTTERWAVE_SECRET_KEY", os.environ["KEY"]), ("FLUTTERWAVE_SECRET_HASH", os.environ["HASH"])):
    line = name + "=" + val
    s = re.sub(r"(?m)^" + name + r"=.*$", lambda m: line, s) if re.search(r"(?m)^" + name + r"=", s) else s.rstrip("\n") + "\n" + line + "\n"
open(p, "w").write(s)
PY
sudo docker compose up -d --no-deps backend >/dev/null 2>&1
for i in $(seq 1 40); do sudo docker inspect -f "{{.State.Health.Status}}" iluase-backend | grep -qx healthy && break; sleep 3; done
sudo docker compose exec -T proxy nginx -s reload >/dev/null 2>&1
k=$(sudo docker compose exec -T backend printenv FLUTTERWAVE_SECRET_KEY | tr -d "\r")
case "$k" in FLWSECK-*) echo "Server now has a LIVE Flutterwave key." ;; *) echo "WARNING: the server did not pick up the new key." ;; esac' 2>&1 | grep -v ssh-prod
unset FLW_KEY FLW_HASH

sleep 2
curl -s -o /dev/null -w "Website check: %{http_code} (200 means all good)\n" https://iluase.com/api/health
