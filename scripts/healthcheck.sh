#!/bin/bash
# ============================================================
# Health Check & Uptime Monitor for Ìlú Àṣẹ Platform
#
# Checks backend health, frontend availability, and DB connectivity.
# Sends alerts if anything is down.
#
# Usage:
#   chmod +x scripts/healthcheck.sh
#   ./scripts/healthcheck.sh                    # One-time check
#
# Cron (add with: crontab -e):
#   # Every 5 minutes
#   */5 * * * * /home/ubuntu/ifa_app/scripts/healthcheck.sh >> /var/log/ilu-ase/healthcheck.log 2>&1
# ============================================================

set -uo pipefail

# --- Configuration ---
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
HEALTH_ENDPOINT="${BACKEND_URL}/api/health"
DETAILED_HEALTH="${BACKEND_URL}/api/health/detailed"
ALERT_EMAIL="${ALERT_EMAIL:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
LOG_PREFIX="[HEALTH $(date '+%Y-%m-%d %H:%M:%S')]"

FAILURES=0
REPORT=""

# --- Functions ---
log_ok() {
    echo "${LOG_PREFIX} OK: $1"
}

log_fail() {
    echo "${LOG_PREFIX} FAIL: $1" >&2
    FAILURES=$((FAILURES + 1))
    REPORT="${REPORT}\n- FAIL: $1"
}

send_alert() {
    local message="$1"
    local hostname
    hostname=$(hostname 2>/dev/null || echo "unknown")

    # Email alert (if configured)
    if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        echo -e "$message" | mail -s "[ALERT] Ìlú Àṣẹ Health Check Failed on ${hostname}" "$ALERT_EMAIL"
    fi

    # Slack alert (if configured)
    if [ -n "$SLACK_WEBHOOK" ]; then
        local slack_message
        slack_message=$(echo -e "$message" | sed 's/"/\\"/g' | tr '\n' ' ')
        curl -sf -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 *Ìlú Àṣẹ Health Alert* (${hostname})\\n${slack_message}\"}" \
            "$SLACK_WEBHOOK" > /dev/null 2>&1
    fi
}

# --- Check 1: Backend health endpoint ---
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_ENDPOINT" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    log_ok "Backend health endpoint (HTTP ${HTTP_CODE})"
else
    log_fail "Backend health endpoint returned HTTP ${HTTP_CODE} (expected 200)"
fi

# --- Check 2: Backend detailed health (DB + Redis) ---
DETAILED_RESPONSE=$(curl -sf --max-time 10 "$DETAILED_HEALTH" 2>/dev/null || echo '{"status":"error"}')

DB_STATUS=$(echo "$DETAILED_RESPONSE" | grep -o '"database"[^}]*' | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
REDIS_STATUS=$(echo "$DETAILED_RESPONSE" | grep -o '"redis"[^}]*' | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ "$DB_STATUS" = "up" ] || [ "$DB_STATUS" = "ok" ]; then
    log_ok "Database connection"
elif [ -n "$DB_STATUS" ]; then
    log_fail "Database status: ${DB_STATUS}"
else
    log_fail "Could not check database status (detailed health endpoint unreachable)"
fi

if [ "$REDIS_STATUS" = "up" ] || [ "$REDIS_STATUS" = "ok" ]; then
    log_ok "Redis connection"
elif [ -n "$REDIS_STATUS" ]; then
    log_fail "Redis status: ${REDIS_STATUS}"
else
    # Redis might not be in the detailed response — that's ok
    log_ok "Redis check skipped (not in health response)"
fi

# --- Check 3: Frontend serving ---
FRONTEND_CODE=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND_URL" 2>/dev/null || echo "000")

if [ "$FRONTEND_CODE" = "200" ]; then
    log_ok "Frontend serving (HTTP ${FRONTEND_CODE})"
else
    log_fail "Frontend returned HTTP ${FRONTEND_CODE} (expected 200)"
fi

# --- Check 4: API responds to a real endpoint ---
API_CODE=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "${BACKEND_URL}/api" 2>/dev/null || echo "000")

if [ "$API_CODE" != "000" ]; then
    log_ok "API root reachable (HTTP ${API_CODE})"
else
    log_fail "API root unreachable"
fi

# --- Check 5: Disk space ---
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -lt 85 ]; then
    log_ok "Disk usage: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -lt 95 ]; then
    log_fail "Disk usage WARNING: ${DISK_USAGE}% (clean up soon)"
else
    log_fail "Disk usage CRITICAL: ${DISK_USAGE}%"
fi

# --- Check 6: Memory ---
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -lt 90 ]; then
    log_ok "Memory usage: ${MEM_USAGE}%"
else
    log_fail "Memory usage HIGH: ${MEM_USAGE}%"
fi

# --- Check 7: PM2 processes ---
if command -v pm2 &> /dev/null; then
    PM2_BACKEND=$(pm2 jlist 2>/dev/null | grep -c '"name":"ilu-ase-backend".*"status":"online"' || echo "0")
    if [ "$PM2_BACKEND" -gt 0 ]; then
        log_ok "PM2 backend process online"
    else
        log_fail "PM2 backend process NOT online"
    fi
fi

# --- Summary ---
echo "${LOG_PREFIX} =========================="
if [ "$FAILURES" -eq 0 ]; then
    echo "${LOG_PREFIX} ALL CHECKS PASSED"
else
    echo "${LOG_PREFIX} ${FAILURES} CHECK(S) FAILED"
    send_alert "Health check found ${FAILURES} failure(s):${REPORT}"
fi

exit "$FAILURES"
