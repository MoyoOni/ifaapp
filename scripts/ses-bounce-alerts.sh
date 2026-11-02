#!/usr/bin/env bash
# ============================================================
# Send SES bounce and complaint notifications for iluase.com to the
# iluase-prod-alerts SNS topic (which emails the platform owner).
# Free: SES notifications and SNS email delivery at this volume cost nothing.
#
# Usage:  AWS_CLI=/Users/a40/Library/Python/3.9/bin/aws scripts/ses-bounce-alerts.sh
# Undo:   rerun with --undo (sets the topics back to none).
# ============================================================
set -euo pipefail

AWS="${AWS_CLI:-aws}"
REGION="us-east-1"
IDENTITY="iluase.com"
TOPIC="arn:aws:sns:us-east-1:091653536932:iluase-prod-alerts"

for t in Bounce Complaint; do
  if [ "${1:-}" = "--undo" ]; then
    "$AWS" ses set-identity-notification-topic --region "$REGION" --identity "$IDENTITY" --notification-type "$t"
  else
    "$AWS" ses set-identity-notification-topic --region "$REGION" --identity "$IDENTITY" --notification-type "$t" --sns-topic "$TOPIC"
    # Include the original subject/recipient headers so an alert says which email bounced.
    "$AWS" ses set-identity-headers-in-notifications-enabled --region "$REGION" --identity "$IDENTITY" --notification-type "$t" --enabled
  fi
  echo "$t: done"
done

"$AWS" ses get-identity-notification-attributes --region "$REGION" --identities "$IDENTITY"
