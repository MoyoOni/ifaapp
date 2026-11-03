#!/usr/bin/env bash
# ============================================================
# Turn on Telegram alerts for urgent safeguarding cases on production
# (docs/safeguarding/README.md has the 5-minute bot setup).
#
# Asks for the bot token and chat id with hidden input; they travel over
# the SSH session's input, never on a command line or on screen. Backs up
# .env, restarts the backend and checks it is healthy.
#
# Usage: AWS_CLI=/Users/a40/Library/Python/3.9/bin/aws scripts/set-prod-safeguarding-telegram.sh
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Paste the bot token from @BotFather (looks like 123456789:AAH...), then press Enter."
echo "(Nothing will show while you paste. That's normal.)"
read -r -s TOKEN; echo
case "$TOKEN" in *:*) ;; *) echo "That doesn't look like a bot token. Nothing was changed."; exit 1 ;; esac
echo "Paste the chat id (a number, may start with -), then press Enter."
read -r -s CHAT; echo
case "$CHAT" in ''|*[!0-9-]*) echo "That doesn't look like a chat id. Nothing was changed."; exit 1 ;; esac

echo "Updating the server..."
printf '%s\n%s\n' "$TOKEN" "$CHAT" | scripts/ssh-prod.sh 'set -e
read -r TOKEN; read -r CHAT
cd /home/ubuntu/app
sudo cp .env .env.bak-$(date +%Y%m%d%H%M)
TOKEN="$TOKEN" CHAT="$CHAT" sudo --preserve-env=TOKEN,CHAT python3 - <<PY
import os, re
p = ".env"
s = open(p).read()
for name, val in (("SAFEGUARDING_TELEGRAM_BOT_TOKEN", os.environ["TOKEN"]), ("SAFEGUARDING_TELEGRAM_CHAT_ID", os.environ["CHAT"])):
    line = name + "=" + val
    s = re.sub(r"(?m)^" + name + r"=.*$", lambda m: line, s) if re.search(r"(?m)^" + name + r"=", s) else s.rstrip("\n") + "\n" + line + "\n"
open(p, "w").write(s)
PY
grep -q "SAFEGUARDING_TELEGRAM_BOT_TOKEN" docker-compose.yml || sudo python3 - <<PY
p = "docker-compose.yml"
s = open(p).read()
anchor = "      GOOGLE_CLIENT_ID: \${GOOGLE_CLIENT_ID}\n"
add = "      SAFEGUARDING_TELEGRAM_BOT_TOKEN: \${SAFEGUARDING_TELEGRAM_BOT_TOKEN}\n      SAFEGUARDING_TELEGRAM_CHAT_ID: \${SAFEGUARDING_TELEGRAM_CHAT_ID}\n"
assert anchor in s, "could not find where to add the setting"
open(p, "w").write(s.replace(anchor, anchor + add, 1))
PY
sudo docker compose config -q
sudo docker compose up -d --no-deps backend >/dev/null 2>&1
for i in $(seq 1 40); do sudo docker inspect -f "{{.State.Health.Status}}" iluase-backend | grep -qx healthy && break; sleep 3; done
sudo docker compose exec -T proxy nginx -s reload >/dev/null 2>&1
echo "Telegram alerts set. Use \"send a test alert\" on the Safeguarding Cases screen."' 2>&1 | grep -v ssh-prod
unset TOKEN CHAT
curl -s -o /dev/null -w "Website check: %{http_code} (200 means all good)\n" https://iluase.com/api/health
