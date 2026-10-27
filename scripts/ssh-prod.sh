#!/usr/bin/env bash
# ============================================================
# SSH into iluase-prod-single without keeping port 22 open to the world.
#
# The production security group only allows SSH from AWS's EC2 Instance
# Connect range (browser "Connect" in the console). This script:
#   1. opens port 22 to *your current IP only*,
#   2. pushes a throwaway key via EC2 Instance Connect (valid ~60s),
#   3. connects (any extra arguments are run as a remote command),
#   4. removes the temporary rule when you disconnect -- even on Ctrl-C.
#
# Usage:
#   scripts/ssh-prod.sh                         # interactive shell
#   scripts/ssh-prod.sh 'cd /home/ubuntu/app && sudo docker compose ps'
#
# Requires: AWS CLI with credentials for account 091653536932.
# Port 22 was open to 0.0.0.0/0 until 2026-10-27.
# ============================================================
set -euo pipefail

INSTANCE_ID="i-0ac1e9e2c4984af72"
HOST="32.192.127.137"
SG_ID="sg-04d721f9658dd2e29"
REGION="us-east-1"
AWS="${AWS_CLI:-aws}"

MY_IP="$(curl -fsS https://checkip.amazonaws.com | tr -d '[:space:]')"
CIDR="${MY_IP}/32"
KEY_DIR="$(mktemp -d)"
KEY="${KEY_DIR}/eic_key"
ADDED_RULE=false

cleanup() {
  if $ADDED_RULE; then
    "$AWS" ec2 revoke-security-group-ingress --region "$REGION" --group-id "$SG_ID" \
      --protocol tcp --port 22 --cidr "$CIDR" >/dev/null 2>&1 \
      && echo "[ssh-prod] Removed temporary SSH rule for ${CIDR}" \
      || echo "[ssh-prod] WARNING: could not remove SSH rule for ${CIDR} -- remove it in the console" >&2
  fi
  rm -rf "$KEY_DIR"
}
trap cleanup EXIT INT TERM

if "$AWS" ec2 authorize-security-group-ingress --region "$REGION" --group-id "$SG_ID" \
     --ip-permissions "IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=${CIDR},Description=temporary ssh-prod.sh $(whoami) $(date -u +%Y-%m-%dT%H:%MZ)}]" \
     >/dev/null 2>&1; then
  ADDED_RULE=true
  echo "[ssh-prod] Opened port 22 for ${CIDR} (removed when you disconnect)"
else
  echo "[ssh-prod] Port 22 already allowed for ${CIDR} (leaving that rule alone)"
fi

ssh-keygen -q -t ed25519 -f "$KEY" -N ""
AZ="$("$AWS" ec2 describe-instances --region "$REGION" --instance-ids "$INSTANCE_ID" \
  --query 'Reservations[0].Instances[0].Placement.AvailabilityZone' --output text)"
"$AWS" ec2-instance-connect send-ssh-public-key --region "$REGION" --instance-id "$INSTANCE_ID" \
  --instance-os-user ubuntu --availability-zone "$AZ" --ssh-public-key "file://${KEY}.pub" >/dev/null

ssh -i "$KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 "ubuntu@${HOST}" "$@"
