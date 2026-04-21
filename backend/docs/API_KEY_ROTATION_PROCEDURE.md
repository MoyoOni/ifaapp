# API Key Rotation Procedure

## Overview
This document outlines the procedure for rotating API keys used by the Ìlú Àṣẹ platform. Regular rotation of API keys is essential for maintaining security and preventing unauthorized access to third-party services.

## Purpose
API key rotation is a security best practice that helps:
- Minimize the impact of compromised keys
- Reduce the window of opportunity for attackers
- Maintain compliance with security standards (OWASP, GDPR)
- Protect against unauthorized access to third-party services

## Frequency
API keys should be rotated:
- **Quarterly** for all third-party service keys (Stripe, SendGrid, AWS, etc.)
- **Immediately** if a key is suspected to be compromised
- **Upon employee departure** when access to keys was granted

## Keys Subject to Rotation

### Payment Processing (Stripe)
- `STRIPE_SECRET_KEY` - Used for backend payment processing
- `STRIPE_WEBHOOK_SECRET` - Used for webhook signature verification

### Email Service (SendGrid/Mailgun)
- `SENDGRID_API_KEY` - Used for sending transactional emails
- `MAILGUN_API_KEY` - Alternative email service key

### Cloud Services (AWS/S3)
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` - Used for S3 storage
- `AWS_SES_ACCESS_KEY_ID` and `AWS_SES_SECRET_ACCESS_KEY` - Used for email service

### External APIs
- `GOOGLE_CLIENT_SECRET` - Used for OAuth authentication
- `RECAPTCHA_SECRET_KEY` - Used for bot protection

## Rotation Procedure

### 1. Preparation
- Schedule rotation during low-traffic periods
- Notify stakeholders of planned maintenance (if applicable)
- Prepare rollback plan in case of issues
- Create backup of current configuration

### 2. Generation of New Keys
1. Log into the respective service provider dashboard
2. Navigate to API keys or security settings
3. Generate a new key with appropriate permissions
4. Record the new key securely (preferably in a password manager)

### 3. Update Configuration
1. Update the environment variable in the deployment configuration
2. Update the secret in your cloud provider (AWS Secrets Manager, Azure Key Vault, etc.)
3. If using Kubernetes, update the secret resource
4. Verify the new key is stored securely (not in plain text)

### 4. Deployment
1. Deploy the updated configuration to staging environment
2. Test functionality with new keys in staging
3. If successful, deploy to production
4. Monitor for any issues during the transition

### 5. Verification
- Test all functionality that uses the rotated keys
- Verify logs show no authentication errors
- Confirm that all services are working normally
- Ensure no degradation in performance

### 6. Revocation of Old Keys
- Wait at least 24 hours after confirming new keys work properly
- Disable or delete the old keys in the service provider dashboard
- Update any documentation that referenced the old keys

## Emergency Rotation
If a key is compromised:
1. Immediately generate a new key
2. Update configuration and deploy as quickly as possible
3. Revoke the compromised key in the service provider dashboard
4. Investigate the source of the compromise
5. Document the incident and lessons learned

## Automation Opportunities
Consider implementing automation for:
- Scheduled reminders for quarterly rotations
- Automated testing after key rotation
- Health checks to detect if keys stop working
- Automated incident alerts for authentication failures

## Documentation Updates
After each rotation, update:
- This procedure document if any improvements were discovered
- Service-specific documentation that references the keys
- Security runbooks that include key-specific procedures
- Access control documentation

## Checklist

### Before Rotation
- [ ] Scheduled maintenance window (if needed)
- [ ] Stakeholders notified
- [ ] Rollback plan prepared
- [ ] Backup of current configuration taken

### During Rotation
- [ ] New key generated and recorded securely
- [ ] Environment configuration updated
- [ ] New key deployed to staging and tested
- [ ] New key deployed to production
- [ ] All functionality verified working

### After Rotation
- [ ] Old key revoked/deleted after 24-hour safety period
- [ ] Documentation updated
- [ ] Incident log updated (if applicable)
- [ ] Next rotation date scheduled

## Troubleshooting

### Service Interruption After Rotation
1. Verify the new key is correctly entered (check for typos)
2. Confirm the key has the correct permissions
3. Check that the application is reading the updated environment variable
4. If necessary, rollback to the old key temporarily while investigating

### Authentication Failures
1. Review logs for specific error messages
2. Verify the key format matches the expected pattern
3. Confirm the key hasn't expired (if time-limited)
4. Check if the service provider has any outages

## Related Documents
- Security Runbook (`docs/DEPLOYMENT_PROCEDURES.md`)
- Incident Response Plan
- Third-party Service Documentation